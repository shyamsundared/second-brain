# One image with the API, the background worker and the built React app.
FROM node:24-slim

WORKDIR /app

# Prisma's migration engine needs OpenSSL, which the slim image leaves out
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies first, so code changes don't reinstall them on every build
COPY package.json package-lock.json ./
RUN npm ci
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend

COPY . .
# prisma generate refuses to run without DATABASE_URL, though it never connects.
# This placeholder is only for the build; the real URL is set when the container runs.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

# Download the embedding model into the image now. Otherwise every restart downloads
# ~25MB before saving and search work.
RUN node -e "import('./dist/ingest/embed.js').then((m) => m.embed('warm up'))"

ENV NODE_ENV=production
EXPOSE 3000
# Applies pending migrations, then starts the server (and the worker inside it)
CMD ["npm", "start"]
