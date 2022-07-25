#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

cp  ./fasty.min.js  /Users/michael/WebstormProjects/bs-form-builder/build/fasty
