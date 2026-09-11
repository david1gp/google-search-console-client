import { existsSync, realpathSync } from "node:fs"
import { release as osRelease } from "node:os"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildCommand } from "@stricli/core"
import pkg from "../../package.json" with { type: "json" }
import type { GoogleSearchConsoleCommandContext } from "./googleSearchConsoleCommandContext.js"

type GoogleSearchConsoleCliVersionCommandFlags = {
  readonly verbose?: boolean
}

type GoogleSearchConsoleCliExecutable = {
  readonly entrypoint: string
  readonly target?: string
}

const googleSearchConsoleCliPackageMetadata = pkg as typeof pkg & {
  readonly author?: string | { readonly name?: string; readonly url?: string }
  readonly engines?: Readonly<Record<string, string>>
}

function googleSearchConsoleCliExecutableResolve(): GoogleSearchConsoleCliExecutable {
  const entrypoint = process.argv[1]
  if (entrypoint === undefined) return { entrypoint: "unavailable" }

  const resolvedEntrypoint = resolve(entrypoint)
  try {
    return { entrypoint: resolvedEntrypoint, target: realpathSync(resolvedEntrypoint) }
  } catch {
    return { entrypoint: resolvedEntrypoint }
  }
}

function googleSearchConsoleCliInstallationTypeResolve(executableTarget: string | undefined): string {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
  if (existsSync(resolve(packageRoot, ".git"))) return "development checkout"
  if (executableTarget !== undefined && !relative(packageRoot, executableTarget).startsWith(".."))
    return "package installation"
  return "unknown"
}

function googleSearchConsoleCliAuthorRender(): string {
  if (typeof googleSearchConsoleCliPackageMetadata.author === "string")
    return googleSearchConsoleCliPackageMetadata.author
  if (googleSearchConsoleCliPackageMetadata.author !== undefined) {
    const { name, url } = googleSearchConsoleCliPackageMetadata.author
    return [name, url].filter((value): value is string => value !== undefined).join(" — ") || "unavailable"
  }
  return "unavailable"
}

function googleSearchConsoleCliRuntimeResolve(): string {
  if (typeof Bun !== "undefined") return `bun ${Bun.version}`
  return `${process.release.name} ${process.version}`
}

function googleSearchConsoleCliVerboseLines(): string[] {
  const executable = googleSearchConsoleCliExecutableResolve()
  const requirements =
    googleSearchConsoleCliPackageMetadata.engines === undefined
      ? "unavailable"
      : Object.entries(googleSearchConsoleCliPackageMetadata.engines)
          .map(([runtime, requirement]) => `${runtime} ${requirement}`)
          .join(", ")

  return [
    `user agent: ${pkg.name}/${pkg.version}`,
    `executable: ${executable.entrypoint}`,
    `executable target: ${executable.target ?? "unavailable"}`,
    `version: ${pkg.version}`,
    `description: ${pkg.description ?? "unavailable"}`,
    `author: ${googleSearchConsoleCliAuthorRender()}`,
    `license: ${pkg.license ?? "unavailable"}`,
    `project: ${pkg.homepage ?? pkg.repository?.url ?? "unavailable"}`,
    `installation type: ${googleSearchConsoleCliInstallationTypeResolve(executable.target)}`,
    `runtime: ${googleSearchConsoleCliRuntimeResolve()}`,
    `runtime requirements: ${requirements || "unavailable"}`,
    `platform: ${process.platform} ${process.arch} (OS release ${osRelease()})`,
  ]
}

export const googleSearchConsoleCliVersionCommand = buildCommand<
  GoogleSearchConsoleCliVersionCommandFlags,
  [],
  GoogleSearchConsoleCommandContext
>({
  func: function (flags) {
    const lines = [pkg.version]
    if (flags.verbose === true) lines.push(...googleSearchConsoleCliVerboseLines())
    this.process.stdout.write(`${lines.join("\n")}\n`)
  },
  parameters: {
    flags: {
      verbose: {
        brief: "Print package and environment metadata",
        kind: "boolean",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Print version information",
  },
})
