FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY nest-cli.json tsconfig*.json .eslintrc.js .prettierrc ./
COPY src ./src
COPY migrations ./migrations

RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Migration CLI uses ts-node at startup, so retain the installed toolchain.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 5000
CMD ["./docker-entrypoint.sh"]
