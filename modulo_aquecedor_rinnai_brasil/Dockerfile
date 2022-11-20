

ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    nodejs \
    npm \
    git


COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN cd /app && npm install --unsafe-perm
COPY src /app/src

WORKDIR /app


# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]