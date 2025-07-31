FROM alpine:latest
WORKDIR /app
# Copying precompilled app and config
COPY bin/docker-bootstrap.sh /
COPY bin/shoes /app/
COPY config/config.yaml /app/config.yaml
RUN chmod +x /app/shoes && chmod +x /docker-bootstrap.sh && chown 0:0 /app/shoes

ENTRYPOINT ["/docker-bootstrap.sh"]
