# Ext JS D3 Integration Package

##D3 setup

For D3 version 4.0 or newer, to generate the needed D3 rollup file:
 
 - npm install d3
 - (in the d3 package directory)
 `rollup -c -f iife -i index.js -n d3 -output=d3.js`