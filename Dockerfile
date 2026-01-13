FROM node:24-slim

RUN apt-get update && apt-get install -y \
    git \
    gnupg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN cd /tmp && \
    git clone https://github.com/spwhitton/git-remote-gcrypt && \
    cd git-remote-gcrypt && \
    ./install.sh && \
    cd / && \
    rm -rf /tmp/git-remote-gcrypt

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
