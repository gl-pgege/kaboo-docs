FROM node:20-slim
WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable
COPY . .
RUN yarn build
CMD ["node", "dist/main.js"]
