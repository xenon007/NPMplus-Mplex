
FROM --platform="$BUILDPLATFORM" alpine:3.22.0
WORKDIR /app
# Copying precompilled app and config
COPY ./shoes/docker-bootstrap.sh /
COPY ./shoes/shoes /app/
COPY ./shoes/config.yaml /app/
RUN chmod +x /app/shoes && chmod +x /docker-bootstrap.sh && chown 0:0 /app/shoes

ENTRYPOINT ["/docker-bootstrap.sh"]
