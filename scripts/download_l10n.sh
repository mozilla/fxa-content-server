#!/usr/bin/env sh

set -e

# hard code this for train-90
export FXA_L10N_SHA=2f7ac75835024d3f9125459b77c1d280f1cafb57

if [ -z "$FXA_L10N_SHA" ]; then
    FXA_L10N_SHA="master"
fi

DOWNLOAD_PATH="https://github.com/mozilla/fxa-content-server-l10n.git#$FXA_L10N_SHA"

echo "Downloading L10N files from $DOWNLOAD_PATH..."
# Download L10N using npm
npm install $DOWNLOAD_PATH
