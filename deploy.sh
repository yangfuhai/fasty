#!/usr/bin/env sh

# abort on errors
set -e

# build
#npm run build

ossutil rm oss://fasy/ -rf
ossutil cp -rf ./index.html  oss://fasy/index.html
ossutil cp -rf ./build  oss://fasy/build
ossutil cp -rf ./dist  oss://fasy/dist
ossutil cp -rf ./src  oss://fasy/src
