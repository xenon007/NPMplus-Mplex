ARG APP_VERSION=v0.1.7
ARG BINARY_NAME=shoes

FROM alpine:3.18

# Work folder
WORKDIR /app
# https://github.com/cfal/shoes/releases/download/v0.1.7/shoes-x86_64-unknown-linux-gnu.tar.gz
# https://github.com/cfal/shoes/releases/download/v0.1.7/shoes-x86_64-unknown-linux-musl.tar.gz
# Precompilled binary copy with config
COPY ../bin/${BINARY_NAME} /app/${BINARY_NAME}
COPY ../config/config.yaml /app/config.yaml

# Binary rights
RUN chmod +x /app/${BINARY_NAME}

# Version label
LABEL version="${APP_VERSION}"

EXPOSE 443
# Точка входа
ENTRYPOINT ["/app/shoes"]
CMD ["/app/config.yaml"]
