import type { Request } from "express";
import path from "node:path";

export function imageStorageKey(value?: string | null) {
  if (!value) return null;

  try {
    return path.basename(new URL(value).pathname);
  } catch {
    return path.basename(value);
  }
}

export function publicImageUrl(request: Request, value?: string | null) {
  const key = imageStorageKey(value);
  return key ? `${request.protocol}://${request.get("host")}/uploads/${key}` : null;
}
