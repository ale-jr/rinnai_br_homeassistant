ARG BUILD_FROM
FROM $BUILD_FROM


RUN apk add --update nodejs-current npm

COPY main.js /app/main.js

WORKDIR /app


# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]