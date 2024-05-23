#!/usr/bin/env bash
echo Creating build directory...

BUILD_DIR=build

mkdir -p $BUILD_DIR

if cd $BUILD_DIR ; then
    echo "Copying files to build directory..."
else
    echo "cd to /build failed"
    exit 1
fi

cp ../{.npmignore,package.json,LICENSE,README.md} .
cp -r ../utilities/* .

cd ..
