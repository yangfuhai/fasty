#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

cp  ./fasty.min.js  /Users/michael/WebstormProjects/bs-form-builder/build/fasty
cp  ./fasty.min.js  /Users/michael/work/git/jpress5/jpress-web/src/main/webapp/static/components/fasty
