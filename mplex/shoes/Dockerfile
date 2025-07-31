FROM alpine:latest
WORKDIR /app
# Copying precompilled app and config
COPY docker-bootstrap.sh /
COPY shoes /app/
COPY config.yaml /app/
RUN chmod +x /app/shoes && chmod +x /docker-bootstrap.sh && chown 0:0 /app/shoes

ENTRYPOINT ["/docker-bootstrap.sh"]
