# AWS Deployment Notes

This folder follows the deployment shape used by the neighboring
`legacy-lang-intelligence` repository.

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
