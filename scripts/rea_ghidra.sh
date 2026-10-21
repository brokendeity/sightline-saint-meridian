#!/bin/sh
# User-local native analysis tools; original target files remain read-only.
export GHIDRA_INSTALL_DIR='/Users/richardmpayi/Applications/RETools/ghidra_12.1.4_PUBLIC'
export JAVA_HOME='/Users/richardmpayi/Applications/RETools/amazon-corretto-21.jdk/Contents/Home'
exec /opt/homebrew/bin/rea "$@"
