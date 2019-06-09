#!/usr/bin/env bash

# minify script
./minify-script.sh

# read extension version from manifest.json
version=$(grep '"version"' manifest.json | cut -d ':' -f 2 | sed 's/[", ]//g')

# create zip directory
mkdir zip > /dev/null 2>&1

# create zip file
zip -r zip/$version.zip \
	3rdparty html_custom html_options icons js \
	manifest.json LICENSE \
	-x html_custom/extension_version.js html_options/options.js js/background.js js/script.js js/utils.js
