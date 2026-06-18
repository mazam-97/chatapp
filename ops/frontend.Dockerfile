FROM node:20-alpine
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
# Optional build-time API URLs (used for local dev via docker-compose).
# When empty, the app falls back to same-origin /api and /ws paths (k8s Ingress).
ARG VITE_BACKEND_URL=""
ARG VITE_WS_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
