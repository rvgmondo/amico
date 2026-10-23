@echo off
rem Dev server launcher: portable Node 22 first on PATH (machine Node 26 breaks
rem Payload's config loader), then Next dev on port 3010.
set "PATH=C:\CC\amico\vendor\node;%PATH%"
cd /d C:\CC\amico
call npx cross-env NODE_OPTIONS=--no-deprecation next dev -p 3010
