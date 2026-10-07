FROM node:22-alpine

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace", "@asyne/api"]
