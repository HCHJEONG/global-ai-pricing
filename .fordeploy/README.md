# AWS Deployment Notes

This folder follows the deployment shape used by the neighboring
`lawvot` repository: project-owned artifacts and application-scoped cleanup.

Expected local structure:

```text
.fordeploy/
  deploy-aws.sh
  configure-aws-alb.sh
  aws-backup/
    .env.local
    gcp-key.json
```

The AWS image must not include `.env.local`, `gcp-key.json`, or the SQLite DB.
Runtime-only files live on the private host and are attached at `docker run`
time with `--env-file` and bind mounts.

Expected runtime structure on yws:

```text
/home/ubuntu/pricingai/
  .env.local
  gcp-key.json
  data/
    global-ai-pricing.db
```

Do not commit `.env.local`, `gcp-key.json`, image archives, DB files, or copied
secrets.

## Image archives and cleanup

Both Bastion and private host use
`/home/ubuntu/global-ai-pricing/docker_images/global-ai-pricing-<run-id>.tar`.
Override the archive directory with `REMOTE_BASE_DIR` (a dedicated absolute
shell-safe path under `/home/ubuntu`). Runtime files stay in
`/home/ubuntu/pricingai`; changing the archive path does not migrate env files or DBs.

- Each run uses a unique timestamp/process/random tag. Deployment locks serialize
  transfer/replacement/cleanup on the remote hosts.
- Local tar and build image tags are removed on exit. Remote tar files are removed
  on success or failure, including partial transfers where SSH remains reachable.
- Subsequent runs delete matching tar files older than seven days directly inside
  the configured archive directory, recovering leftovers from killed processes or
  network failures. No recursive directory deletion is used.
- After HTTP health succeeds, remove stopped containers only when both the
  configured container name (or its `-` suffix family) and `global-ai-pricing`
  image repository match. Keep the current named container.
- Remove old `global-ai-pricing` image tags only when no container references their
  image ID. Keep the current image ID, and remove unused dangling images only with
  the `com.global-ai-pricing.deployment=production` label. No forced image removal
  or global Docker prune is used. No previous-image retention or automatic rollback
  is provided; failed health checks skip historical Docker resource cleanup.

Existing archives in `/home/ubuntu/`, `/home/ubuntu/docker_images/pricingai/images/`,
or other former locations are not automatically migrated or deleted. Unlabeled
legacy dangling images and shared build caches are also left untouched.
Changes take effect on the next maintainer-run deployment; editing this script
performs no server cleanup or deployment.

Offline checks (no Docker daemon or AWS connection needed):

```sh
bash -n .fordeploy/deploy-aws.sh
python3 -m unittest discover -s .fordeploy/tests -v
```

## Clean-clone deployment

Run manually from WSL/Linux:

```sh
bash .fordeploy/deploy-aws.sh
```

Like LawVot, this replaces only
`/home/hchjeong/deploy-remote-repo/global-ai-pricing` with a fresh shallow clone
of `main` from `git@github.com:HCHJEONG/global-ai-pricing.git`. Commit and push
application changes before using it. The parent and sibling projects are retained.
A build lock rejects concurrent clean-clone deployments, and symlink checkouts
are rejected before deletion. Running from inside the old clone is supported.

The invoking script's `deploy-aws.sh` and ALB helper,
`Dockerfile.aws`, and `.dockerignore` are copied before replacing the checkout.
The cloned application's deployment scripts are replaced with that snapshot, so
the single script performs clean clone, build, transfer, HTTP health check, and
application-scoped cleanup in sequence. It records the application commit
in `.fordeploy/source-commit.txt`; the checkout remains until the next run.
No local environment files, credentials, or DB files are copied into the clone.

Overrides: `PRICING_BUILD_ROOT` (absolute parent ending in `deploy-remote-repo`),
`PRICING_DEPLOY_REF` (branch or tag), and `PRICING_DEPLOY_REPO_URL`.
Existing deployment environment overrides, including `REMOTE_BASE_DIR`, also apply.
`deploy-aws.sh` always starts with a clean clone and performs a real build and
deployment when run; there is no separate clean-clone launcher.
