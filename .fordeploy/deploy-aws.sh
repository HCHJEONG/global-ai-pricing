#!/usr/bin/env bash
set -euo pipefail
umask 077

prepare_clean_clone() {
  local script_dir build_root checkout repo_url ref
  script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
  build_root=${PRICING_BUILD_ROOT:-/home/hchjeong/deploy-remote-repo}
  repo_url=${PRICING_DEPLOY_REPO_URL:-git@github.com:HCHJEONG/global-ai-pricing.git}
  ref=${PRICING_DEPLOY_REF:-main}
  case "$build_root" in /*) ;; *) echo "PRICING_BUILD_ROOT must be absolute" >&2; exit 1 ;; esac
  [ ! -L "$build_root" ] || { echo "Clone parent must not be a symlink" >&2; exit 1; }
  # Resolve and validate before creating or deleting anything.
  build_root=$(realpath -m -- "$build_root")
  [ "${build_root##*/}" = deploy-remote-repo ] || {
    echo "Clone parent must be named deploy-remote-repo" >&2; exit 1;
  }
  mkdir -p -- "$build_root"
  build_root=$(cd -- "$build_root" && pwd -P)
  checkout=$build_root/global-ai-pricing
  [ ! -L "$checkout" ] || { echo "Checkout must not be a symlink" >&2; exit 1; }
  exec 8>"$build_root/.global-ai-pricing-build.lock"
  flock -n 8 || { echo "Another pricing clean-clone deployment is running" >&2; exit 1; }

  # Snapshot deployment infrastructure; application code comes from the selected Git ref.
  RUNTIME_DIR=$(mktemp -d /tmp/global-ai-pricing-deploy.XXXXXX)
  cp -- "$script_dir/deploy-aws.sh" "$script_dir/configure-aws-alb.sh" \
    "$script_dir/../Dockerfile.aws" \
    "$script_dir/../.dockerignore" "$RUNTIME_DIR/"

  [ ! -L "$checkout" ] && [ "$(realpath -m -- "$checkout")" = "$build_root/global-ai-pricing" ] || exit 1
  cd -- "$build_root"
  echo "[global-ai-pricing] Replacing clean checkout: $checkout (ref: $ref)"
  rm -rf -- "$checkout"
  (umask 022; git clone --depth 1 --single-branch --branch "$ref" -- "$repo_url" "$checkout")
  mkdir -p -- "$checkout/.fordeploy"
  cp -- "$RUNTIME_DIR/deploy-aws.sh" "$RUNTIME_DIR/configure-aws-alb.sh" "$checkout/.fordeploy/"
  cp -- "$RUNTIME_DIR/Dockerfile.aws" "$RUNTIME_DIR/.dockerignore" "$checkout/"
  git -C "$checkout" rev-parse HEAD > "$checkout/.fordeploy/source-commit.txt"
  echo "[global-ai-pricing] Source commit: $(cat "$checkout/.fordeploy/source-commit.txt")"
  ROOT_DIR=$checkout
  SCRIPT_DIR=$checkout/.fordeploy
}

# Parse the complete deployment before replacing a checkout that may contain this script.
main() {

: "${BASTION_HOST:=ubuntu@43.202.136.180}"
: "${PRIVATE_HOST:=ubuntu@172.31.76.194}"
: "${BASTION_SSH_KEY:=${HOME}/.ssh/penvotkeypair1.pem}"
: "${REMOTE_PORT:=22}"
: "${REMOTE_BASE_DIR:=/home/ubuntu/global-ai-pricing/docker_images}"
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
IMAGE_TAG="$(date +%Y%m%d%H%M%S)-$$-${RANDOM}"
IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_FILE="$ROOT_DIR/${IMAGE_NAME}-${IMAGE_TAG}.tar"
IMAGE_BASENAME="$(basename "$IMAGE_FILE")"
BASTION_TAR="$REMOTE_BASE_DIR/$IMAGE_BASENAME"
PRIVATE_TAR="$REMOTE_BASE_DIR/$IMAGE_BASENAME"

# Remote paths are passed through SSH's shell, so accept shell-safe absolute paths only.
if [[ ! "$REMOTE_BASE_DIR" =~ ^/home/ubuntu/[a-zA-Z0-9_-][a-zA-Z0-9_./-]*$ ]] ||
   [[ "/$REMOTE_BASE_DIR/" == *"/../"* || "/$REMOTE_BASE_DIR/" == *"/./"* ]]; then
  echo "REMOTE_BASE_DIR must be a dedicated shell-safe path under /home/ubuntu" >&2
  exit 1
fi

cleanup() {
  if [ -n "${RUNTIME_DIR:-}" ]; then rm -rf -- "$RUNTIME_DIR"; fi
  rm -f -- "$IMAGE_FILE"
  docker rmi "$IMAGE" >/dev/null 2>&1 || true
  if [ "${upload_started:-0}" = 1 ]; then
    ssh "${SSH_OPTS[@]}" -o ConnectTimeout=10 "$BASTION_HOST" \
      "rm -f -- '$BASTION_TAR'" || log "WARNING: could not remove Bastion archive"
  fi
}
trap cleanup EXIT

SSH_OPTS=(-i "$BASTION_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -p "$REMOTE_PORT")
SCP_OPTS=(-i "$BASTION_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -P "$REMOTE_PORT")

prepare_clean_clone
IMAGE_FILE="$ROOT_DIR/$IMAGE_BASENAME"

log "BUILD START: $IMAGE"
docker build --label com.global-ai-pricing.deployment=production -f "$ROOT_DIR/Dockerfile.aws" -t "$IMAGE" "$ROOT_DIR"
log "BUILD COMPLETE: $IMAGE"

docker save "$IMAGE" > "$IMAGE_FILE"
docker rmi "$IMAGE" >/dev/null 2>&1 || true

log "IMAGE ARCHIVE READY: $IMAGE_FILE"
log "TRANSFERRING IMAGE TO BASTION: $BASTION_HOST"
ssh "${SSH_OPTS[@]}" "$BASTION_HOST" "mkdir -p -- '$REMOTE_BASE_DIR'"
upload_started=1
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
# Serialize private-host deployment and cleanup, including the transfer.
exec 9>"$REMOTE_BASE_DIR/.deploy.lock"
flock -n 9 || { echo "Another pricing deployment is running" >&2; exit 1; }
cleanup_transfer() {
  rm -f -- "$BASTION_TAR"
  ssh -n -i ~/.ssh/penvotkeypair1.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "$PRIVATE_HOST" \
    "rm -f -- '$PRIVATE_TAR'" || echo "[bastion] WARNING: private archive cleanup failed" >&2
}
trap cleanup_transfer EXIT
# Recover archives left by interrupted processes, only in this dedicated directory.
find "$REMOTE_BASE_DIR" -maxdepth 1 -type f -name 'global-ai-pricing-*.tar' -mmin +10080 -delete
# The Bastion shell is reading this deployment from stdin. A nested SSH that
# only runs a command must detach stdin or it can consume the remaining script.
ssh -n -i ~/.ssh/penvotkeypair1.pem -o StrictHostKeyChecking=accept-new "$PRIVATE_HOST" \
  "mkdir -p -- '$REMOTE_BASE_DIR'"
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
trap 'rm -f -- "$PRIVATE_TAR"' EXIT
exec 9>"$REMOTE_BASE_DIR/.deploy.lock"
flock -n 9 || { echo "Another pricing deployment is running" >&2; exit 1; }
find "$REMOTE_BASE_DIR" -maxdepth 1 -type f -name 'global-ai-pricing-*.tar' -mmin +10080 -delete
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
$DOCKER load -i "$PRIVATE_TAR"
rm -f -- "$PRIVATE_TAR"
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
# Only clean this application's resources after the replacement is healthy.
CURRENT_IMAGE_ID=$($DOCKER image inspect --format '{{.Id}}' "$IMAGE")
while read -r id name image state; do
  case "$name" in "$CONTAINER_NAME"|"$CONTAINER_NAME"-*) ;; *) continue ;; esac
  case "$image" in global-ai-pricing:*) ;; *) continue ;; esac
  case "$state" in exited|dead|created) ;; *) continue ;; esac
  [ "$name" != "$CONTAINER_NAME" ] || continue
  $DOCKER rm "$id" || echo "[private] WARNING: kept container $id" >&2
done < <($DOCKER ps -a --format '{{.ID}} {{.Names}} {{.Image}} {{.State}}')

while read -r image; do
  case "$image" in global-ai-pricing:*) ;; *) continue ;; esac
  [ "$image" != "$IMAGE" ] || continue
  id=$($DOCKER image inspect --format '{{.Id}}' "$image")
  [ "$id" != "$CURRENT_IMAGE_ID" ] || continue
  [ -z "$($DOCKER ps -aq --filter "ancestor=$id")" ] || continue
  $DOCKER image rm "$image" || echo "[private] WARNING: kept image $image" >&2
done < <($DOCKER image ls --format '{{.Repository}}:{{.Tag}}' global-ai-pricing)

# Labels identify future dangling images without touching other projects.
while read -r id; do
  [ -n "$id" ] && [ "$id" != "$CURRENT_IMAGE_ID" ] || continue
  [ -z "$($DOCKER ps -aq --filter "ancestor=$id")" ] || continue
  $DOCKER image rm "$id" || echo "[private] WARNING: kept dangling image $id" >&2
done < <($DOCKER image ls --no-trunc -q --filter dangling=true --filter label=com.global-ai-pricing.deployment=production)
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

}
main "$@"
