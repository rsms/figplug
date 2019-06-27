import { unique } from './util'
import { Manifest } from './manifest'
import { parseopt, die, prog, FlagSpec } from './cli'
import { PluginTarget } from './plugin'
import * as Path from 'path'
import * as fs from 'fs'
import { BuildCtx } from './ctx'
import { initPlugin, InitOptions } from './init'


async function buildPlugin(manifest :Manifest, c :BuildCtx) {
  let p = new PluginTarget(manifest, c.outdir)
  return p.build(c)
}

const baseCliOptions :FlagSpec[] = [
  [["v", "verbose"], "Print additional information to stdout"],
  ["debug",   "Print a lot of information to stdout. Implies -v"],
  ["version", "Print figplug version information"],
]


function updateBaseCliOptions(baseopt: {[k:string]:any}={}, opt: {[k:string]:any}={}) {
  baseopt.debug = opt.debug || baseopt.debug
  baseopt.verbose = opt.v || opt.verbose || baseopt.verbose || opt.debug || baseopt.debug
}


async function main(argv :string[]) :Promise<void> {
  const [opt, args] = parseopt(argv.slice(1),
    "Usage: $prog [options] <command> [<command-arg> ...]\n" +
    "\n" +
    "commands:\n" +
    "  init  [<dir>]   Initialize a plugin\n" +
    "  build [<dir>]   Build a plugin\n" +
    "  version         Print figplug version information\n" +
    "  help [<cmd>]    Equivalent to $prog command -help\n"
    ,
    ...baseCliOptions
  )
  if (args.length == 0) {
    die(`missing <command>. Try ${prog} -help`)
  }

  // normalize options (-debug implies -verbose; -v => -verbose)
  opt.verbose = opt.verbose2 || opt.v || opt.verbose

  let command = args[0]

  if (command == "help") {
    // convert "prog help command" => "prog command -help"
    command = args[1]
    if (!command) {
      return main([argv[0], "-h"])
    }
    args[0] = command
    args[1] = "-help"
  }

  if (opt.version) {
    return main_version(args, opt)
  }

  switch (command) {
    case "init":  return main_init(args, opt)
    case "build": return main_build(args, opt)
    case "version": return main_version(args, opt)
    default: {
      die(`unknown command ${repr(command)}. Try ${prog} -help`)
    }
  }
}


async function main_version(argv :string[], baseopt: {[k:string]:any}={}) {
  const [opt, ] = parseopt(argv.slice(1),
    `Usage: $prog ${argv[0]} [-v|-verbose]\n` +
    "Print figplug version information."
    ,
    ...baseCliOptions.filter(f => !Array.isArray(f) || f[0] != "version")
  )

  updateBaseCliOptions(baseopt, opt)
  opt.verbose = opt.verbose || opt.v || baseopt.verbose

  print(`figplug ${VERSION}`)

  if (opt.verbose) {
    print(
      `Supported Figma Plugin API versions:` +
      `\n  ${FIGMA_API_VERSIONS.join("\n  ")}`
    )

    print(`System and library info:`)
    let p = JSON.parse(fs.readFileSync(__dirname + "/../package.json", "utf8"))
    let nmdir = __dirname + "/../node_modules/"
    let extraInfo = [
      ["arch", process.arch],
      ["platform", process.platform],
    ] as string[][]
    for (let k of Object.keys(process.versions)) {
      extraInfo.push([k, (process.versions as any)[k]])
    }
    let longestName = extraInfo.reduce((a, e) => Math.max(a, e[0].length), 0)
    let spaces = "                                             "
    for (let [k,v] of extraInfo) {
      k += spaces.substr(0, longestName - k.length)
      print(`  ${k} ${v}`)
    }

    extraInfo.splice(0, extraInfo.length)
    for (let dn of Object.keys(p.dependencies)) {
      try {
        let p2 = JSON.parse(
          fs.readFileSync(`${nmdir}/${dn}/package.json`, "utf8")
        )
        extraInfo.push([dn, p2.version])
      } catch (_) {
        extraInfo.push([dn, "(unavailable)"])
      }
    }
    longestName = extraInfo.reduce((a, e) => Math.max(a, e[0].length), 0)
    print(`  deps:`)
    for (let [k,v] of extraInfo) {
      k += spaces.substr(0, longestName - k.length)
      print(`    ${k} ${v}`)
    }
  }
  process.exit(0)
}


async function main_init(argv :string[], baseopt: {[k:string]:any}={}) {
  const [opt, args] = parseopt(argv.slice(1),
    `Usage: $prog ${argv[0]} [<dir> ...]\n` +
    "Initialize Figma plugins in directories provided as <dir>, or the current directory."
    ,
    ["ui",           "Generate UI written in TypeScript & HTML"],
    ["html",         "Generate UI written purely in HTML"],
    ["react",        "Generate UI written in React"],
    [["f", "force"], "Overwrite or replace existing files"],
    ["api",          `Specify Figma Plugin API version. Defaults to "${FIGMA_API_VERSIONS[0]}".`, "<version>"],
    ["name",         "Name of plugin. Defaults to directory name.", "<name>"],
    ["srcdir",       "Where to put source files, relative to <dir>. Defaults to \".\".", "<dirname>"],
    ...baseCliOptions
  )

  updateBaseCliOptions(baseopt, opt)

  let dirs = args.length == 0 ? ["."] : args

  let baseOptions :Partial<InitOptions> = {
    verbose: baseopt.verbose,
    debug: baseopt.verbose2,
    name: opt.name,
    overwrite: !!opt.force,
    srcdir: opt.srcdir as string|undefined,
    apiVersion: opt.api as string|undefined,
    ui: (
      opt["react"] ? "react" :
      opt["html"]  ? "html" :
      opt.ui       ? "ts+html" :
      undefined
    ),
  }

  let allSuccess = await Promise.all(
    dirs.map(dir =>
      initPlugin({ ...baseOptions, dir })
    )
  ).then(v => v.every(r => r))

  if (!allSuccess) {
    console.error(
      `Remove files you'd like to be re-created, `+
      `or run with -force to overwrite all files.`
    )
    process.exit(1)
  } else {
    process.exit(0)
  }
}


async function main_build(argv :string[], baseopt: {[k:string]:any}={}) {
  const [opt, args] = parseopt(argv.slice(1),
    `Usage: $prog ${argv[0]} [options] [<path> ...]\n` +
    "Builds Figma plugins.\n" +
    "<path>  Path to a plugin directory or a manifest file. Defaults to \".\"."
    ,
    ["w",       "Watch sources for changes and rebuild incrementally"],
    ["g",       "Generate debug code (assertions and DEBUG branches)."],
    ["O",       "Generate optimized code."],
    ["clean",   "Force rebuilding of everything, ignoring cache. Implied with -O."],
    ["nomin",   "Do not minify or mangle optimized code when -O is enabled."],
    [["o", "output"],  "Write output to directory. Defaults to ./build", "<dir>"],
    ...baseCliOptions
  )

  updateBaseCliOptions(baseopt, opt)

  // create build context object
  const c = new BuildCtx()
  c.verbose2 = baseopt.debug   || c.verbose2
  c.verbose  = baseopt.verbose || c.verbose
  c.watch    = opt.w       || c.watch
  c.debug    = opt.g       || c.debug
  c.optimize = opt.O       || c.optimize
  c.clean    = opt.clean   || c.clean
  c.nomin    = opt.nomin   || c.nomin
  c.outdir   = opt.o || opt.outdir || c.outdir

  // set manifest locations based on CLI arguments
  let manifestPaths = unique(
    (args.length == 0 ? [process.cwd() + Path.sep] : args)
      .map(s => Path.resolve(s))
  )

  // build a plugin for each input manifest location
  return Promise.all(manifestPaths.map(async (path) => {
    let manifest = await Manifest.load(path)
    return buildPlugin(manifest, c)
  })).then(()=>{})
}

function onError(err :any) {
  if (typeof err != "object" || !(err as any)._wasReported) {
    die(err)
  } else {
    process.exit(1)
  }
}

process.on('unhandledRejection', onError)
main(process.argv.slice(1)).catch(onError)
