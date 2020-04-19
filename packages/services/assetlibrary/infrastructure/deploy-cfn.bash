#!/bin/bash

set -e

#-------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------

function help_message {
    cat << EOF

NAME
    deploy-cfn.bash    

DESCRIPTION
    Deploys the asset library.

MANDATORY ARGUMENTS:
    -e (string)   Name of environment.
    -c (string)   Location of application configuration file containing configuration overrides.
    -m (string)   Mode ('full' or 'lite').  Defaults to full.

OPTIONAL ARGUMENTS
    -v (string)   ID of VPC to deploy into
    -g (string)   ID of source security group to allow access
    -n (string)   ID of private subnets (comma delimited) to deploy into
    -r (string)   ID of private routetables (comma delimited) to configure for Neptune access

    -x (number)   No. of concurrent executions to provision.
    -s (flag)     Apply autoscaling as defined in ./cfn-autosclaing.yml  

    -C (string)   Name of customer authorizer stack.  Defaults to cdf-custom-auth-${ENVIRONMENT}.
    -a (string)   An authorization token.  Only required if fine-grained access control is enabled.

    -R (string)   AWS region.
    -P (string)   AWS profile.
    
EOF
}

while getopts ":e:c:v:g:n:m:r:x:sa:C:R:P:" opt; do
  case $opt in

    e  ) export ENVIRONMENT=$OPTARG;;
    c  ) export ASSETLIBRARY_CONFIG_LOCATION=$OPTARG;;
    v  ) export VPC_ID=$OPTARG;;
    g  ) export SOURCE_SECURITY_GROUP_ID=$OPTARG;;
    n  ) export PRIVATE_SUBNET_IDS=$OPTARG;;
    r  ) export PRIVATE_ROUTE_TABLE_IDS=$OPTARG;;
    m  ) export ASSETLIBRARY_MODE=$OPTARG;;

    x  ) export CONCURRENT_EXECUTIONS=$OPTARG;;
    s  ) export APPLY_AUTOSCALING=true;;

    a  ) export AL_AUTH_TOKEN=$OPTARG;;
    C  ) export CUST_AUTH_STACK_NAME=$OPTARG;;

    R  ) export AWS_REGION=$OPTARG;;
    P  ) export AWS_PROFILE=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done


if [ -z "$ENVIRONMENT" ]; then
	echo -e ENVIRONMENT is required; help_message; exit 1;
fi

if [ -z "$ASSETLIBRARY_CONFIG_LOCATION" ]; then
	echo -c ASSETLIBRARY_CONFIG_LOCATION is required; help_message; exit 1;
fi

if [ -z "$ASSETLIBRARY_MODE" ]; then
	export ASSETLIBRARY_MODE=full
fi
if [[ "$ASSETLIBRARY_MODE" != "lite" && "$ASSETLIBRARY_MODE" != "full" ]]; then
	echo -m ASSETLIBRARY_MODE allowed values: 'full', 'lite'; help_message; exit 1;
fi

if [[ "$ASSETLIBRARY_MODE" = "full" ]]; then
  if [ -z "$VPC_ID" ]; then
    echo -v VPC_ID is required in 'full' mode; help_message; exit 1;
  fi

  if [ -z "$SOURCE_SECURITY_GROUP_ID" ]; then
    echo -g SOURCE_SECURITY_GROUP_ID is required in 'full' mode; help_message; exit 1;
  fi

  if [ -z "$PRIVATE_SUBNET_IDS" ]; then
    echo -n PRIVATE_SUBNET_IDS is required in 'full' mode; help_message; exit 1;
  fi

  if [ -z "$PRIVATE_ROUTE_TABLE_IDS" ]; then
    echo -r PRIVATE_ROUTE_TABLE_IDS is required in 'full' mode; help_message; exit 1;
  fi
fi

if [ -z "$CONCURRENT_EXECUTIONS" ]; then
	export CONCURRENT_EXECUTIONS=0
fi

if [ -z "$APPLY_AUTOSCALING" ]; then
	export APPLY_AUTOSCALING=false
fi


AWS_ARGS=
if [ -n "$AWS_REGION" ]; then
	AWS_ARGS="--region $AWS_REGION "
fi
if [ -n "$AWS_PROFILE" ]; then
	AWS_ARGS="$AWS_ARGS--profile $AWS_PROFILE"
fi

AWS_SCRIPT_ARGS=
if [ -n "$AWS_REGION" ]; then
	AWS_SCRIPT_ARGS="-R $AWS_REGION "
fi
if [ -n "$AWS_PROFILE" ]; then
	AWS_SCRIPT_ARGS="$AWS_SCRIPT_ARGS-P $AWS_PROFILE"
fi


NEPTUNE_STACK_NAME=cdf-assetlibrary-neptune-${ENVIRONMENT}
ASSETLIBRARY_STACK_NAME=cdf-assetlibrary-${ENVIRONMENT}
BASTION_STACK_NAME=cdf-bastion-${ENVIRONMENT}


echo "
Running with:
  ENVIRONMENT:                      $ENVIRONMENT
  ASSETLIBRARY_CONFIG_LOCATION:     $ASSETLIBRARY_CONFIG_LOCATION
  ASSETLIBRARY_MODE:                $ASSETLIBRARY_MODE
  VPC_ID:                           $VPC_ID
  SOURCE_SECURITY_GROUP_ID:         $SOURCE_SECURITY_GROUP_ID
  PRIVATE_SUBNET_IDS:               $PRIVATE_SUBNET_IDS
  PRIVATE_ROUTE_TABLE_IDS:          $PRIVATE_ROUTE_TABLE_IDS
  CONCURRENT_EXECUTIONS:            $CONCURRENT_EXECUTIONS
  APPLY_AUTOSCALING:                $APPLY_AUTOSCALING
  CUST_AUTH_STACK_NAME:             $CUST_AUTH_STACK_NAME
  AL_AUTH_TOKEN:                    $AL_AUTH_TOKEN
  AWS_REGION:                       $AWS_REGION
  AWS_PROFILE:                      $AWS_PROFILE
"


cwd=$(dirname "$0")

if [ "$ASSETLIBRARY_MODE" = "full" ]; then

  echo '
  **********************************************************
    Checking deployed Neptune version
  **********************************************************
  '

  # The minimum Neptune DB engine that we support.
  min_dbEngineVersion_required='1.0.1.0.200463.0'

  # Let's see if we have previously deployed Neptune before.  If so, we need to check its version
  stack_exports=$(aws cloudformation list-exports $AWS_ARGS)

  neptune_url_export="$NEPTUNE_STACK_NAME-GremlinEndpoint"
  neptune_url=$(echo $stack_exports \
      | jq -r --arg neptune_url_export "$neptune_url_export" \
      '.Exports[] | select(.Name==$neptune_url_export) | .Value')

  if [ -n "$neptune_url" ]; then

    # Neptune has been deployed.  Let's grab the name of the ssh key we need to log onto the Bastion
    stack_parameters=$(aws cloudformation describe-stacks --stack-name $BASTION_STACK_NAME $AWS_ARGS) || true
    if [ -n "$stack_parameters" ]; then
        key_pair_name=$(echo $stack_parameters \
          | jq -r --arg stack_name "$BASTION_STACK_NAME" \
          '.Stacks[] | select(.StackName==$stack_name) | .Parameters[] | select(.ParameterKey=="KeyPairName") | .ParameterValue')
        key_pair_location="~/.ssh/${key_pair_name}.pem"
        echo Attempting to use key pair: $key_pair_location

        echo "Checking Neptune version using:
        NEPTUNE_STACK_NAME: $NEPTUNE_STACK_NAME
        BASTION_STACK_NAME: $BASTION_STACK_NAME
        key_pair_location:  $key_pair_location
        min_dbEngineVersion_required: $min_dbEngineVersion_required
        AWS_SCRIPT_ARGS:  $AWS_SCRIPT_ARGS
        "

        set +e
        dbEngineVersionCheck=$($cwd/neptune_dbEngineVersion.bash -n $NEPTUNE_STACK_NAME -b $BASTION_STACK_NAME -k $key_pair_location -v $min_dbEngineVersion_required $AWS_SCRIPT_ARGS)
        set -e
        dbEngineVersionStatus=$(echo $?)

        echo dbEngineVersionStatus: $dbEngineVersionStatus

        if [ "$dbEngineVersionStatus" -ne 0 ]; then
          echo "
    ********    WARNING!!!   *********
    Cannot proceed with the deploy as Neptune minimum dbEngine version $min_dbEngineVersion_required is required.  You must upgrade your Neptune instances first!

    Refer to https://docs.aws.amazon.com/neptune/latest/userguide/engine-releases-${min_dbEngineVersion_required}.html for details of how to upgrade.

    "
          exit 1
        fi
     else
          echo "
    ********    WARNING!!!   *********
    No Bastion detected therefore cannot verify version of Neptune.

    "
     fi
  fi

  echo '
  **********************************************************
    Determining whether the VPC to deploy Neptune into has an S3 VPC endpoint
  **********************************************************
  '
  count=$(aws ec2 describe-vpc-endpoints $AWS_ARGS \
    --filters Name=vpc-id,Values=$VPC_ID Name=service-name,Values=com.amazonaws.$AWS_REGION.s3 | jq  '.VpcEndpoints | length')

  if [ $count -eq 1 ]; then
    CREATE_S3_VPC_ENDPOINT='false'
  else
    CREATE_S3_VPC_ENDPOINT='true'
  fi

  echo '
  **********************************************************
    Deploying the Neptune CloudFormation template
  **********************************************************
  '

  aws cloudformation deploy \
    --template-file $cwd/cfn-neptune.yml \
    --stack-name $NEPTUNE_STACK_NAME \
    --parameter-overrides \
        VpcId=$VPC_ID \
        SecurityGroupId=$SOURCE_SECURITY_GROUP_ID \
        PrivateSubNetIds=$PRIVATE_SUBNET_IDS \
        PrivateRouteTableIds=$PRIVATE_ROUTE_TABLE_IDS \
        CreateS3VpcEndpoint=$CREATE_S3_VPC_ENDPOINT \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    $AWS_ARGS

  aws cloudformation set-stack-policy \
    --stack-name $NEPTUNE_STACK_NAME \
    --stack-policy-body "$(cat $cwd/cfn-neptune-stack-policy.json)" \
    $AWS_ARGS
fi


echo '
**********************************************************
  Setting Asset Library configuration
**********************************************************
'
aws_iot_endpoint=$(aws iot describe-endpoint  --endpoint-type iot:Data-ATS $AWS_ARGS \
    | jq -r '.endpointAddress')

cat $ASSETLIBRARY_CONFIG_LOCATION | \
  jq --arg mode "$ASSETLIBRARY_MODE" --arg aws_iot_endpoint "$aws_iot_endpoint" \
  '.mode=$mode | .aws.iot.endpoint=$aws_iot_endpoint' \
  > $ASSETLIBRARY_CONFIG_LOCATION.tmp && mv $ASSETLIBRARY_CONFIG_LOCATION.tmp $ASSETLIBRARY_CONFIG_LOCATION


if [ "$ASSETLIBRARY_MODE" = "full" ]; then

  stack_exports=$(aws cloudformation list-exports $AWS_ARGS)

  neptune_url_export="$NEPTUNE_STACK_NAME-GremlinEndpoint"
  neptune_url=$(echo $stack_exports \
      | jq -r --arg neptune_url_export "$neptune_url_export" \
      '.Exports[] | select(.Name==$neptune_url_export) | .Value')

  cat $ASSETLIBRARY_CONFIG_LOCATION | \
    jq --arg neptune_url "$neptune_url" \
    '.neptuneUrl=$neptune_url' \
    > $ASSETLIBRARY_CONFIG_LOCATION.tmp && mv $ASSETLIBRARY_CONFIG_LOCATION.tmp $ASSETLIBRARY_CONFIG_LOCATION
fi

application_configuration_override=$(cat $ASSETLIBRARY_CONFIG_LOCATION)


if [ "$ASSETLIBRARY_MODE" = "lite" ]; then

  echo '
  **********************************************************
    Enabling Fleet Indexing
  **********************************************************
  '
  aws iot update-indexing-configuration \
    --thing-indexing-configuration thingIndexingMode=REGISTRY_AND_SHADOW,thingConnectivityIndexingMode=STATUS \
    --thing-group-indexing-configuration thingGroupIndexingMode=ON \
    $AWS_ARGS &
    
fi

echo '
**********************************************************
  Deploying the Asset Library CloudFormation template 
**********************************************************
'
aws cloudformation deploy \
  --template-file $cwd/build/cfn-assetLibrary-output.yml \
  --stack-name $ASSETLIBRARY_STACK_NAME \
  --parameter-overrides \
      Environment=$ENVIRONMENT \
      ApplicationConfigurationOverride="$application_configuration_override" \
      VpcId=$VPC_ID \
      SourceSecurityGroupId=$SOURCE_SECURITY_GROUP_ID \
      PrivateSubNetIds=$PRIVATE_SUBNET_IDS \
      CustAuthStackName=$CUST_AUTH_STACK_NAME \
      ProvisionedConcurrentExecutions=$CONCURRENT_EXECUTIONS \
      ApplyAutoscaling=$APPLY_AUTOSCALING \
      Mode=$ASSETLIBRARY_MODE \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --no-fail-on-empty-changeset \
  $AWS_ARGS



if [ "$ASSETLIBRARY_MODE" = "full" ]; then

  echo '
  **********************************************************
    Adding Asset library security group to the Neptune security group
  **********************************************************
  '
  stack_exports=$(aws cloudformation list-exports $AWS_ARGS)

  assetlibrary_sg_id_export="$ASSETLIBRARY_STACK_NAME-AssetLibrarySecurityGroupID"
  assetlibrary_sg_id=$(echo $stack_exports \
      | jq -r --arg assetlibrary_sg_id_export "$assetlibrary_sg_id_export" \
      '.Exports[] | select(.Name==$assetlibrary_sg_id_export) | .Value')

  neptune_sg_id_export="$NEPTUNE_STACK_NAME-NeptuneSecurityGroupID"
  neptune_sg_id=$(echo $stack_exports \
      | jq -r --arg neptune_sg_id_export "$neptune_sg_id_export" \
      '.Exports[] | select(.Name==$neptune_sg_id_export) | .Value')

  aws ec2 authorize-security-group-ingress \
    --group-id $neptune_sg_id \
    --protocol tcp --port 8182 --source-group $assetlibrary_sg_id \
    $AWS_ARGS || true


  echo '
  **********************************************************
    Initializing the Asset Library data
  **********************************************************
  '

  stack_exports=$(aws cloudformation list-exports $AWS_ARGS)

  assetlibrary_invoke_url_export="$ASSETLIBRARY_STACK_NAME-apigatewayurl"
  assetlibrary_invoke_url=$(echo $stack_exports \
      | jq -r --arg assetlibrary_invoke_url_export "$assetlibrary_invoke_url_export" \
      '.Exports[] | select(.Name==$assetlibrary_invoke_url_export) | .Value')

  status_code=$(curl -X POST \
    "$assetlibrary_invoke_url/48e876fe-8830-4996-baa0-9c0dd92bd6a2/init" \
    -H 'Accept: application/vnd.aws-cdf-v1.0+json' \
    -H 'Content-Type: application/vnd.aws-cdf-v1.0+json' \
    -H 'Authorization: '"$AL_AUTH_TOKEN"'' \
    -qSfsw '%{http_code}' 2>/dev/null) || true
  # Implement retry for asset library initialization.
  max_waiting_seconds=60
  expired_time=$(date -d "+${max_waiting_seconds}Seconds" +"%Y-%m-%d %H:%M:%S" 2>/dev/null || \
    date -v "+${max_waiting_seconds}S" +"%Y-%m-%d %H:%M:%S")

  while [[ $(date +"%Y-%m-%d %H:%M:%S") < "$expired_time" ]]
  do
    if [[ $status_code -eq 204 ]] || [[ $status_code -eq 409 ]] ; then
      break
    fi
    echo "Retry assetlibrary initialization : $(date +"%Y-%m-%d %H:%M:%S")"
    status_code=$(curl -X POST \
      "$assetlibrary_invoke_url/48e876fe-8830-4996-baa0-9c0dd92bd6a2/init" \
      -H 'Accept: application/vnd.aws-cdf-v1.0+json' \
      -H 'Content-Type: application/vnd.aws-cdf-v1.0+json' \
      -H 'Authorization: '"$AL_AUTH_TOKEN"'' \
      -qSfsw '%{http_code}' 2>/dev/null) || true
    sleep 1.0
  done

  case $status_code in
    204)
        echo "Assetlibrary successfully initialized status code $status_code";;
    409)
      echo "Assetlibrary already initialized status code $status_code";;
    *)
      echo "Assetlibrary failed to initialize status code $status_code";;
  esac

fi


echo '
**********************************************************
  Asset Library Done!
**********************************************************
'
