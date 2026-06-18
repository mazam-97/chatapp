FROM node:20-alpine
WORKDIR /app
COPY websocket/package.json ./
RUN npm install
COPY websocket/ .
RUN npx prisma generate
EXPOSE 8080
CMD ["npm", "start"]
