FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install
COPY backend/ .
RUN npx prisma generate
EXPOSE 3001
# Sync the schema to Postgres on startup, then run the server.
CMD ["sh", "-c", "npx prisma db push && npm start"]
