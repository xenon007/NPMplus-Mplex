#!/bin/sh

echo "Starting Shoes Multiplexor by Xenon007 version 0.1.7"
CONFIG_PATH="/app/config.yaml"
APP_PATH="/app/shoes"

# хэш функции для отслеживания изменений
hash_file() {
  sha256sum "$1" | cut -d ' ' -f1
}

# начальный хэш
prev_hash=$(hash_file "$CONFIG_PATH")

# бесконечный цикл
while true; do
  sleep 3

  current_hash=$(hash_file "$CONFIG_PATH")

  if [ "$current_hash" != "$prev_hash" ]; then
    echo "[INFO] Detected config.yaml change, restarting Shoes..."
    pkill -f "$APP_PATH"
    sleep 1
    "$APP_PATH" "$CONFIG_PATH" &
    prev_hash=$current_hash
  fi

  # если процесс не работает — запустить
  if ! pgrep -f "$APP_PATH" > /dev/null; then
    echo "[INFO] Shoes is not running, starting..."
    "$APP_PATH" "$CONFIG_PATH" &
  fi
done
