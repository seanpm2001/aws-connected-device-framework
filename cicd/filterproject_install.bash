#!/bin/bash

set -e

echo filterproject_install started on `date`

env | sort

echo Adding workaround for unsupported characters in the auto-generated codecommit passwords
export ESCAPED_CREDENTIALS=$(echo "$CDF_CODECOMMIT_USERNAME:$CDF_CODECOMMIT_PASSWORD" | sed -r 's:/:%2F:g' )

echo configuring git
git config --global user.email "$CDF_CODECOMMIT_EMAIL"
git config --global user.name "$CDF_CODECOMMIT_USERNAME"

echo Adding workaround for CodeCommit not cloning source as git
cd $CODEBUILD_SRC_DIR/..
git clone "https://$ESCAPED_CREDENTIALS@git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/$REPO_NAME" temp_src
cd temp_src && git checkout $CODEBUILD_RESOLVED_SOURCE_VERSION && cd ..
rm -rf "$CODEBUILD_SRC_DIR/*"
cp -a temp_src/. "$CODEBUILD_SRC_DIR/" && rm -rf temp_src
