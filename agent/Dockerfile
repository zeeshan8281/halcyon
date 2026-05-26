# --- frontend build ---
FROM --platform=linux/amd64 node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- backend build ---
FROM --platform=linux/amd64 node:22-slim AS backend
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --no-audit --no-fund
COPY src/ ./src/
RUN npx tsc -p .

# --- runtime ---
FROM --platform=linux/amd64 node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=backend  /app/dist            ./dist
COPY --from=frontend /app/frontend/dist   ./frontend/dist

EXPOSE 8080
CMD ["node", "dist/index.js"]
