#!/usr/bin/env bash
set -euo pipefail

: "${BASTION_HOST:=ubuntu@43.202.136.180}"
: "${PRIVATE_HOST:=ubuntu@172.31.76.194}"
: "${BASTION_SSH_KEY:=${HOME}/.ssh/penvotkeypair1.pem}"
: "${REMOTE_PORT:=22}"
: "${REMOTE_BASE_DIR:=/home/ubuntu/docker_images/pricingai}"
: "${APP_DIR_ON_PRIVATE:=/home/ubuntu/pricingai}"
: "${ENV_FILE_ON_PRIVATE:=${APP_DIR_ON_PRIVATE}/.env.local}"
: "${GCP_KEY_ON_PRIVATE:=${APP_DIR_ON_PRIVATE}/gcp-key.json}"
: "${DATA_DIR_ON_PRIVATE:=${APP_DIR_ON_PRIVATE}/data}"
: "${DATABASE_URL:=file:/app/data/global-ai-pricing.db}"
: "${HEALTH_CHECK_PATH:=/ko/pricing}"
: "${CONTAINER_NAME:=pricingai}"
: "${CONTAINER_PORT:=3000}"
: "${HOST_PORT:=3400}"
: "${MEDIUM_INSTANCE_ID:=i-0fa95bb4eff77caf2}"
: "${CONFIGURE_ALB:=0}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

log() {
  printf '[global-ai-pricing] %s\n' "$*"
}

case "$REMOTE_BASE_DIR" in
  ""|/|/home|/home/ubuntu)
    echo "REMOTE_BASE_DIR must be a dedicated application directory" >&2
    exit 1
    ;;
esac

case "$APP_DIR_ON_PRIVATE" in
  ""|/|/home|/home/ubuntu)
    echo "APP_DIR_ON_PRIVATE must be a dedicated application directory" >&2
    exit 1
    ;;
esac

if [ ! -f "$BASTION_SSH_KEY" ]; then
  echo "missing Bastion SSH key: $BASTION_SSH_KEY" >&2
  exit 1
fi

IMAGE_NAME="global-ai-pricing"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)"
IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_FILE="$ROOT_DIR/${IMAGE_NAME}-${IMAGE_TAG}.tar"
IMAGE_BASENAME="$(basename "$IMAGE_FILE")"
BASTION_TAR="/home/ubuntu/$IMAGE_BASENAME"
PRIVATE_TAR="/home/ubuntu/$IMAGE_BASENAME"

cleanup() {
  rm -f "$IMAGE_FILE"
}
trap cleanup EXIT

SSH_OPTS=(-i "$BASTION_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -p "$REMOTE_PORT")
SCP_OPTS=(-i "$BASTION_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -P "$REMOTE_PORT")

log "BUILD START: $IMAGE"
docker build -f "$ROOT_DIR/Dockerfile.aws" -t "$IMAGE" "$ROOT_DIR"
log "BUILD COMPLETE: $IMAGE"

docker save "$IMAGE" > "$IMAGE_FILE"
docker rmi "$IMAGE" >/dev/null 2>&1 || true

log "IMAGE ARCHIVE READY: $IMAGE_FILE"
log "TRANSFERRING IMAGE TO BASTION: $BASTION_HOST"
scp "${SCP_OPTS[@]}" "$IMAGE_FILE" "$BASTION_HOST:$BASTION_TAR"
log "IMAGE ARRIVED AT BASTION"

ssh "${SSH_OPTS[@]}" "$BASTION_HOST" \
  PRIVATE_HOST="$PRIVATE_HOST" \
  BASTION_TAR="$BASTION_TAR" \
  PRIVATE_TAR="$PRIVATE_TAR" \
  REMOTE_BASE_DIR="$REMOTE_BASE_DIR" \
  APP_DIR_ON_PRIVATE="$APP_DIR_ON_PRIVATE" \
  ENV_FILE_ON_PRIVATE="$ENV_FILE_ON_PRIVATE" \
  GCP_KEY_ON_PRIVATE="$GCP_KEY_ON_PRIVATE" \
  DATA_DIR_ON_PRIVATE="$DATA_DIR_ON_PRIVATE" \
  DATABASE_URL="$DATABASE_URL" \
  HEALTH_CHECK_PATH="$HEALTH_CHECK_PATH" \
  IMAGE="$IMAGE" \
  CONTAINER_NAME="$CONTAINER_NAME" \
  HOST_PORT="$HOST_PORT" \
  CONTAINER_PORT="$CONTAINER_PORT" \
  bash -s <<'BASTION_SCRIPT'
set -euo pipefail
echo "[bastion] transferring image to private host: $PRIVATE_HOST"
scp -i ~/.ssh/penvotkeypair1.pem -o StrictHostKeyChecking=accept-new "$BASTION_TAR" "$PRIVATE_HOST:$PRIVATE_TAR"
ssh -i ~/.ssh/penvotkeypair1.pem -o StrictHostKeyChecking=accept-new "$PRIVATE_HOST" \
  PRIVATE_TAR="$PRIVATE_TAR" \
  REMOTE_BASE_DIR="$REMOTE_BASE_DIR" \
  APP_DIR_ON_PRIVATE="$APP_DIR_ON_PRIVATE" \
  ENV_FILE_ON_PRIVATE="$ENV_FILE_ON_PRIVATE" \
  GCP_KEY_ON_PRIVATE="$GCP_KEY_ON_PRIVATE" \
  DATA_DIR_ON_PRIVATE="$DATA_DIR_ON_PRIVATE" \
  DATABASE_URL="$DATABASE_URL" \
  HEALTH_CHECK_PATH="$HEALTH_CHECK_PATH" \
  IMAGE="$IMAGE" \
  CONTAINER_NAME="$CONTAINER_NAME" \
  HOST_PORT="$HOST_PORT" \
  CONTAINER_PORT="$CONTAINER_PORT" \
  bash -s <<'PRIVATE_SCRIPT'
set -euo pipefail
echo "[private] loading image and replacing container: $CONTAINER_NAME"
DOCKER="sudo docker"
if [ ! -d "$APP_DIR_ON_PRIVATE" ]; then
  echo "[private] missing app dir: $APP_DIR_ON_PRIVATE" >&2
  exit 1
fi
if [ ! -f "$ENV_FILE_ON_PRIVATE" ]; then
  echo "[private] missing env file: $ENV_FILE_ON_PRIVATE" >&2
  exit 1
fi
if [ ! -f "$GCP_KEY_ON_PRIVATE" ]; then
  echo "[private] missing gcp key file: $GCP_KEY_ON_PRIVATE" >&2
  exit 1
fi
if [ ! -d "$DATA_DIR_ON_PRIVATE" ]; then
  echo "[private] missing data dir: $DATA_DIR_ON_PRIVATE" >&2
  exit 1
fi
mkdir -p "$REMOTE_BASE_DIR/images"
mv "$PRIVATE_TAR" "$REMOTE_BASE_DIR/images/"
$DOCKER load -i "$REMOTE_BASE_DIR/images/$(basename "$PRIVATE_TAR")"
rm -f "$REMOTE_BASE_DIR/images/$(basename "$PRIVATE_TAR")"
$DOCKER rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
$DOCKER run -d --restart unless-stopped --name "$CONTAINER_NAME" \
  -p "0.0.0.0:${HOST_PORT}:${CONTAINER_PORT}" \
  --env-file "$ENV_FILE_ON_PRIVATE" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-key.json \
  -v "${DATA_DIR_ON_PRIVATE}:/app/data" \
  -v "${GCP_KEY_ON_PRIVATE}:/app/gcp-key.json:ro" \
  "$IMAGE"
if ! $DOCKER ps --filter "name=^/$CONTAINER_NAME$" --filter status=running --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "[private] container did not enter running state" >&2
  $DOCKER ps -a --filter "name=^/$CONTAINER_NAME$"
  $DOCKER logs --tail 80 "$CONTAINER_NAME" || true
  exit 1
fi
echo "[private] container is running"
$DOCKER ps --filter "name=^/$CONTAINER_NAME$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
health_ready=0
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${HOST_PORT}${HEALTH_CHECK_PATH}" >/dev/null; then
    health_ready=1
    break
  fi
  echo "[private] waiting for HTTP health check ($attempt/30)"
  sleep 2
done
if [ "$health_ready" -ne 1 ]; then
  echo "[private] health check failed on http://127.0.0.1:${HOST_PORT}${HEALTH_CHECK_PATH}" >&2
  $DOCKER logs --tail 80 "$CONTAINER_NAME" || true
  exit 1
fi
echo "[private] HTTP health check passed"
PRIVATE_SCRIPT
rm -f "$BASTION_TAR"
BASTION_SCRIPT

log "REMOTE DEPLOYMENT COMPLETE: $CONTAINER_NAME on $PRIVATE_HOST:$HOST_PORT"

if [ "$CONFIGURE_ALB" = "1" ]; then
  if command -v aws >/dev/null 2>&1; then
    log "CONFIGURING ALB TARGET AND RULES"
    MEDIUM_INSTANCE_ID="$MEDIUM_INSTANCE_ID" PRICING_AI_PORT="$HOST_PORT" bash "$SCRIPT_DIR/configure-aws-alb.sh"
  else
    log "WARNING: AWS CLI is not installed; skipping ALB configuration"
    log "WARNING: configure the target group separately or rerun with AWS CLI available"
  fi
fi

log "DEPLOY SUCCESS: https://pricingai.penvot.com"
