#!/usr/bin/env node
import { googleSearchConsoleCliApplication } from "./cli/googleSearchConsoleCliApplication.js"
import { googleSearchConsoleCliRun } from "./cli/googleSearchConsoleCliRun.js"

await googleSearchConsoleCliRun(googleSearchConsoleCliApplication, process.argv.slice(2), process)
