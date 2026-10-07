import { Router } from 'express'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { requireAuthentication } from '../../middleware/authentication.js'
import { getAuthContext } from '../../middleware/authentication.js'
import { db } from '../../database/client.js'
import { organizations, users } from '../../database/schema.js'
import { eq } from 'drizzle-orm'
import { HttpError } from '../../shared/http-error.js'

const inputSchema=z.object({dataUrl:z.string(),kind:z.enum(['avatar','logo']),entityId:z.string().uuid().optional()})
const mimeExtensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
export const uploadRouter=Router()
uploadRouter.use(requireAuthentication)
uploadRouter.post('/image',async(request,response)=>{
  const {dataUrl,kind,entityId}=inputSchema.parse(request.body)
  const auth=getAuthContext(response)
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if(!match)throw new HttpError(400,'INVALID_IMAGE','La imagen debe ser JPG, PNG o WebP.')
  const extension=mimeExtensions[match[1]!],buffer=Buffer.from(match[2]!,'base64')
  if(!extension||buffer.length>2*1024*1024)throw new HttpError(400,'IMAGE_TOO_LARGE','La imagen no puede superar 2 MB.')
  const directory=path.resolve(process.cwd(),'uploads');await mkdir(directory,{recursive:true})
  const ownerKey=entityId||crypto.randomUUID()
  const filename=`${kind}-${ownerKey}-${crypto.randomUUID()}.${extension}`;await writeFile(path.join(directory,filename),buffer)

  if(entityId){
    if(kind==='avatar'){
      if(auth.platformRole!=='superuser'&&auth.userId!==entityId)throw new HttpError(403,'IMAGE_UPDATE_FORBIDDEN','No puedes modificar este avatar.')
      const [user]=await db.update(users).set({avatarUrl:filename,updatedAt:new Date()}).where(eq(users.id,entityId)).returning({id:users.id})
      if(!user)throw new HttpError(404,'USER_NOT_FOUND','Usuario no encontrado.')
    }else{
      if(auth.platformRole!=='superuser'&&auth.organizationId!==entityId)throw new HttpError(403,'IMAGE_UPDATE_FORBIDDEN','No puedes modificar este logo.')
      const [organization]=await db.update(organizations).set({logoUrl:filename,updatedAt:new Date()}).where(eq(organizations.id,entityId)).returning({id:organizations.id})
      if(!organization)throw new HttpError(404,'ORGANIZATION_NOT_FOUND','Empresa no encontrada.')
    }
  }

  response.status(201).json({storageKey:filename,url:`${request.protocol}://${request.get('host')}/uploads/${filename}`})
})
