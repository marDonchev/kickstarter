#!/bin/sh
#export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
firebase emulators:start --only functions,database --import=./data --export-on-exit