# AWS Deployment Notes

This folder follows the deployment shape used by the neighboring
`legacy-lang-intelligence` repository.

Expected structure:

```text
.fordeploy/
  deploy-aws.sh
  configure-aws-alb.sh
  aws-backup/
    .env.local
    gcp-key.json
```

Deployment scripts should restore `.env.local` and `gcp-key.json` from absolute
source paths before `docker build`, include them in the AWS image, and then
remove or restore the temporary root copies after the build.

Default local secret source paths for this repository should be:

```text
/mnt/j/VSCodeProjects/global-ai-pricing/.fordeploy/aws-backup/.env.local
/mnt/j/VSCodeProjects/global-ai-pricing/.fordeploy/aws-backup/gcp-key.json
```

Do not commit `.env.local`, `gcp-key.json`, image archives, or copied secrets.
