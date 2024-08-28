FROM node:16.17.1-slim

RUN groupadd -g 880 eventkit && useradd -u 8800 -g 880 -m eventkit && \
    mkdir -p /app/ && chown eventkit:eventkit /app

RUN apt-get update && apt-get install -y \
    ruby \
    git \
    libcairo2-dev \
    libjpeg62-turbo-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    python && \
    apt-get clean \
    && npm install -g npm@8.19.2

USER eventkit

WORKDIR /app

COPY --chown=eventkit:eventkit ./package.json ./package-lock.json /app/

RUN npm install --quiet

ENV PATH="/home/eventkit/.gem/ruby/2.3.0/bin:$PATH"

RUN gem install --user-install coveralls-lcov

COPY ./eventkit_cloud /app/eventkit_cloud
COPY ./config/ui/ /app/

CMD ["npm", "start"]
