FROM node:trixie-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM node:trixie-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:trixie-slim AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]


