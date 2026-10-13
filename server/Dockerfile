FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S lifeloom && adduser -S lifeloom -G lifeloom
COPY --from=build --chown=lifeloom:lifeloom /app/node_modules ./node_modules
COPY --from=build --chown=lifeloom:lifeloom /app/dist ./dist
COPY --from=build --chown=lifeloom:lifeloom /app/package.json ./
USER lifeloom
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
