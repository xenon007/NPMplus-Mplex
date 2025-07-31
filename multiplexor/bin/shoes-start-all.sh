#!/bin/bash

# Запуск shoes
/app/multiplexor/shoes -config /app/multiplexor/config.yaml &

# Запуск NPMplus
/app/run.sh
