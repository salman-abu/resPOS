FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy packages
COPY packages ./packages

# Copy apps
COPY apps ./apps

# Install dependencies
RUN pnpm install

# Build the apps
RUN pnpm run build

EXPOSE 3000
EXPOSE 3001

CMD ["pnpm", "run", "start"]
