#!/usr/bin/env node

const command = process.argv[2];

if (command === "version") {
	console.log("winnow 0.0.1");
} else {
	console.error("Usage: winnow version");
	process.exitCode = 1;
}
