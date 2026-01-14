FROM node:24-slim

RUN apt-get update && apt-get install -y \
    git \
    gnupg \
    ca-certificates \
    curl \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts 2>/dev/null && \
    chmod 644 /root/.ssh/known_hosts && \
    mkdir -p /etc/ssh && \
    ssh-keyscan github.com >> /etc/ssh/ssh_known_hosts 2>/dev/null

RUN cd /tmp && \
    git clone https://github.com/spwhitton/git-remote-gcrypt && \
    cd git-remote-gcrypt && \
    ./install.sh && \
    cd / && \
    rm -rf /tmp/git-remote-gcrypt

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
