# --- Stage 1: Build ---
FROM node:23-alpine AS builder
WORKDIR /app
# 패키지 정보 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci
# 소스코드 복사 및 Next.js 빌드
COPY . .
RUN npm run build

# --- Stage 2: Production Run ---
FROM node:23-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드 스테이지에서 실행에 필요한 파일들만 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 포트 개방 및 실행
EXPOSE 3000
CMD ["npm", "start"]