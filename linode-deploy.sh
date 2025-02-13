#!/bin/bash

# This script is to be run as a hook on the server
# From https://www.linode.com/community/questions/24290/guide-or-assistance-on-setting-up-cicd-with-github-actions-to-my-linode

PROJECT=liqwik-webapp
TARGET=/opt/liqwik-webapp-work-tree/
DEPLOY=/opt/liqwik-webapp/
GIT_DIR=/home/mano/liqwik-webapp.git/
BRANCH="master"

while read -r _ newrev ref
do
    # only pulling the updated code on the main branch
    if [ "$ref" = "refs/heads/$BRANCH" ];
    then
        # get the file list to check for packages
        filelist=$(git diff-tree --no-commit-id --name-only -r "$newrev")

        # check out the files to the working tree
        echo "Ref $ref received. Deploying ${BRANCH} branch to production..."
        git --work-tree=$TARGET --git-dir=$GIT_DIR checkout -f $BRANCH
        cd $TARGET || exit 1

        # if the package files have been changed
        # then we are reinstalling 
        if [[ $filelist == *"package.json"* || $filelist == *"package-lock.json"* ]]; 
        then
            echo "Changes detected in Package files..."
            echo "Reinstalling dependencies..."
            npm i --only=prod
        fi

        # we are building and deploying in any case
        echo "Building UI..."
        npm run build
        echo "Redeploying UI..."
        rm -rf ${DEPLOY:?}/*
        cp -r $TARGET/build/* $DEPLOY/

        # restart with PM2
        pm2 restart $PROJECT

    else
        echo "Ref $ref received. Doing nothing: only the ${BRANCH} branch may be deployed on this server."
    fi
done