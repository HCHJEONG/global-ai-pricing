#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:=ap-northeast-2}"
: "${ALB_NAME:=penvot-internet-facing-1}"
: "${MEDIUM_INSTANCE_ID:?Set MEDIUM_INSTANCE_ID to the t3a.medium instance id}"
: "${PRICING_AI_HOST:=pricingai.penvot.com}"
: "${PRICING_AI_PORT:=3400}"
: "${PRICING_AI_TARGET_GROUP_NAME:=pricingai-tg}"
: "${PRICING_AI_RULE_PRIORITY:=92}"

ALB_ARN="$(aws elbv2 describe-load-balancers --names "$ALB_NAME" --region "$AWS_REGION" --query 'LoadBalancers[0].LoadBalancerArn' --output text)"
VPC_ID="$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --region "$AWS_REGION" --query 'LoadBalancers[0].VpcId' --output text)"
HTTPS_LISTENER="$(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --region "$AWS_REGION" --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text)"

ALB_SG_ID="$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --region "$AWS_REGION" --query 'LoadBalancers[0].SecurityGroups[0]' --output text)"
INSTANCE_SG_ID="$(aws ec2 describe-instances --instance-ids "$MEDIUM_INSTANCE_ID" --region "$AWS_REGION" --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)"
if [ -z "$ALB_SG_ID" ] || [ "$ALB_SG_ID" = "None" ] || [ -z "$INSTANCE_SG_ID" ] || [ "$INSTANCE_SG_ID" = "None" ]; then
  echo "Could not resolve ALB or instance security group" >&2
  exit 1
fi

HAS_ALB_PORT="$(aws ec2 describe-security-groups --group-ids "$INSTANCE_SG_ID" --region "$AWS_REGION" --query "SecurityGroups[0].IpPermissions[?IpProtocol=='tcp' && FromPort==\`$PRICING_AI_PORT\` && ToPort==\`$PRICING_AI_PORT\`].UserIdGroupPairs[?GroupId=='$ALB_SG_ID'] | length(@)" --output text)"
if [ "$HAS_ALB_PORT" != "1" ]; then
  aws ec2 authorize-security-group-ingress --group-id "$INSTANCE_SG_ID" --protocol tcp --port "$PRICING_AI_PORT" --source-group "$ALB_SG_ID" --region "$AWS_REGION" >/dev/null
fi

TARGET_GROUP_ARN="$(aws elbv2 describe-target-groups --names "$PRICING_AI_TARGET_GROUP_NAME" --region "$AWS_REGION" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || true)"
if [ -z "$TARGET_GROUP_ARN" ] || [ "$TARGET_GROUP_ARN" = "None" ]; then
  TARGET_GROUP_ARN="$(aws elbv2 create-target-group --name "$PRICING_AI_TARGET_GROUP_NAME" --protocol HTTP --port "$PRICING_AI_PORT" --vpc-id "$VPC_ID" --target-type instance --health-check-path / --region "$AWS_REGION" --query 'TargetGroups[0].TargetGroupArn' --output text)"
fi
aws elbv2 register-targets --target-group-arn "$TARGET_GROUP_ARN" --targets Id="$MEDIUM_INSTANCE_ID",Port="$PRICING_AI_PORT" --region "$AWS_REGION"

aws elbv2 describe-rules --listener-arn "$HTTPS_LISTENER" --region "$AWS_REGION" --query "Rules[?Conditions[?Values && contains(Values, '${PRICING_AI_HOST}')]].RuleArn" --output text | xargs -r -n1 aws elbv2 delete-rule --rule-arn
USED_PRIORITY="$(aws elbv2 describe-rules --listener-arn "$HTTPS_LISTENER" --region "$AWS_REGION" --query "Rules[?Priority==\`$PRICING_AI_RULE_PRIORITY\`].RuleArn" --output text)"
if [ -n "$USED_PRIORITY" ] && [ "$USED_PRIORITY" != "None" ]; then
  echo "ALB priority $PRICING_AI_RULE_PRIORITY is already in use" >&2
  exit 1
fi

aws elbv2 create-rule --listener-arn "$HTTPS_LISTENER" --priority "$PRICING_AI_RULE_PRIORITY" --conditions "Field=host-header,HostHeaderConfig={Values=[${PRICING_AI_HOST}]}" --actions "Type=forward,TargetGroupArn=${TARGET_GROUP_ARN}" --region "$AWS_REGION" >/dev/null

echo "Registered ${PRICING_AI_HOST} -> ${TARGET_GROUP_ARN} -> ${MEDIUM_INSTANCE_ID}:${PRICING_AI_PORT}"
