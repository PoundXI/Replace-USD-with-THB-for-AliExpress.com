#!/usr/bin/env bash

FILES=("html_custom/extension_version" "html_options/options" "js/background" "js/script" "js/utils")

read -r -d '' LICENSE_NOTICE << EOM
/*
	Replace USD with THB for AliExpress.com (Firefox/Chrome Extension)
	Copyright (C) 2019  Pongsakorn Ritrugsa <poundxi@protonmail.com>

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
EOM

if [ "$#" -eq 1 ]; then
	if [ "$1" == "remove" ]; then
		echo "Removing minify script."

		# remove .min script
		for file in ${FILES[*]}; do
			rm -v $file.min.js
		done
	else
		echo "Unknown option '$1'."
	fi
	exit 1
fi

minify_script () {
	INPUT=$1.js
	OUTPUT=$1.min.js

	# minify script (sudo npm install uglify-js-es6 -g)
	echo "Minifying $INPUT -> $OUTPUT"
	if [ "$2" == "mangle" ]; then
		uglifyjs --compress --mangle toplevel --output $OUTPUT $INPUT 2> /dev/null
	else
		uglifyjs --compress --output $OUTPUT $INPUT 2> /dev/null
	fi

	# prepend copyright and license notice
	echo "${LICENSE_NOTICE}$(cat $OUTPUT)" > $OUTPUT
}

for file in ${FILES[*]}; do
	if [ $file != "js/utils" ]; then
		minify_script "$file" "mangle"
	else
		minify_script "$file"
	fi
done
