import UglifyJS from '../deps/uglify-es'
import * as rollup from 'rollup'
import * as typescript from 'typescript'
import typescriptPlugin from 'rollup-plugin-typescript2'
import commonjsPlugin from 'rollup-plugin-commonjs'
import nodeResolvePlugin from 'rollup-plugin-node-resolve'
import * as Path from 'path'
import { join as pjoin, relative as relpath, dirname, basename } from 'path'
import { readFileSync } from 'fs'
import { writefile, readfile, stat, mkdir } from './fs'
import { AssetBundler } from './asset'
import { figplugDir } from './ctx'
import {
  inlineSourceMap,
  rpath,
  jsonfmt,
  fmtByteSize,
  strUTF8Size,
  fmtDuration,
} from './util'
import * as strings from "./strings"


// TODO: port this code to typescript


// export const pkg = {
//   dir: "",
//   name: "",
//   version: "",
//   info: {},

//   init(dir) {
//     dir = Path.resolve(dir)
//     pkg.dir = dir
//     try {
//       let info = readFileSync(pjoin(dir, 'package.json'), 'utf8')
//       pkg.name = info.name || pkg.name
//       pkg.version = info.version || pkg.version
//       pkg.info = info
//     } catch (_) {}
//     if (!pkg.name) {
//       pkg.name = basename(dir)
//     }
//     pkg.init = () => { throw new Error('pkg.init called twice') }
//     return pkg
//   }
// }


export class LibBase {
}


export class Lib extends LibBase {
  constructor(props/*? :string|LibProps*/) {
    super()
    if (typeof props == "string") {
      props = { dfile: props }
    }
    this.dfile = props.dfile ? Path.resolve(props.dfile) : ''
    this.jsfile = props.jsfile ? Path.resolve(props.jsfile) : ''
    this.cachedir = props.cachedir ? Path.resolve(props.cachedir) : '.'
    this._cacheDebug = null
    this._cacheNonDebug = null
    this._isBuilding = false
    this._buildPromises = []
    if (!this.jsfile) {
      // definition-only (for libs provided by the host environment)
      this.getCode = () => ""
    }
  }

  toString() {
    let s = ""
    const cwd = process.cwd()
    const r = fn => fn.startsWith(cwd) ? rpath(fn) : fn
    if (this.dfile) { s = r(this.dfile) }
    if (this.jsfile) { s += (s ? ":" : "") + r(this.jsfile) }
    return "Lib(" + s + ")"
  }

  getDefines(debug) {
    return {
      DEBUG: debug,
    }
  }

  async getCode(c) { // :string
    // stat source file
    let srcst = await stat(this.jsfile)

    // attempt to load from memory
    let cached = c.debug ? this._cacheDebug : this._cacheNonDebug
    if (cached && cached.mtimeMs >= srcst.mtimeMs) {
      if (c.verbose2) {
        print(`cache hit for lib ${this} (${repr(cachefile)})`)
      }
      return cached.code
    }

    if (this._isBuilding) {
      return new Promise((resolve, reject) => {
        this._buildPromises.push({resolve, reject})
      })
    }

    const doneBuilding = (err, result) => {
      this._isBuilding = false
      let pv = this._buildPromises.slice()
      this._buildPromises = []
      for (let p of pv) {
        err ? p.reject(err) : p.resolve(result)
      }
      if (err) {
        return Promise.reject(err)
      } else {
        return Promise.resolve(result)
      }
    }

    try {
      this._isBuilding = true

      // attempt to load from precompiled file
      let cachefile = pjoin(
        this.cachedir,
        (c.debug ? ".debug-" : ".opt-") +
        this.jsfile.replace(/[^A-Za-z0-9_\-\.]+/g, '-')
      )

      // cached version exists and is up to date?
      try {
        let cachest = await stat(cachefile)
        if (
          (srcst.mtimeMs !== undefined && srcst.mtimeMs <= cachest.mtimeMs) ||
          (srcst.mtimeMs === undefined && srcst.mtime <= cachest.mtime)
        ) {
          if (c.verbose2) {
            print(`cache hit for lib ${this} (${repr(cachefile)})`)
          }
          return doneBuilding(null, readfile(cachefile, 'utf8'))
        }
        if (c.verbose2) {
          print(`cache miss for lib ${this} (${repr(cachefile)})`)
        }
      } catch (_) {}

      // if we get here, we need to compile the library
      if (c.verbose2) {
        print(`build lib ${this.jsfile} -> ${cachefile}`)
      } else if (c.verbose && this instanceof UserLib) {
        print(`build lib ${this}`)
      }
      let r = await this.compile(c, this.jsfile, cachefile)

      // check for error
      if (r.error) {
        let err = r.error
        if (err.line !== undefined) {
          err.message =
            `${err.filename || err.file}:${err.line}:${err.col} ${r.message}`
        }
        throw err
      }

      // write compiled file
      try { await mkdir(dirname(cachefile)) } catch(_) {}
      await writefile(cachefile, r.code, 'utf8')
      if (c.verbose2) {
        print(`compiled lib ${rpath(this.jsfile)} cached at ${repr(cachefile)}`)
      }

      // memoize
      let cache = { code: r.code, mtimeMs: Date.now() }
      if (c.debug) {
        this._cacheDebug = cache
      } else {
        this._cacheNonDebug = cache
      }

      return doneBuilding(null, r.code)
    } catch (err) {
      return doneBuilding(err, "")
    }
  }


  async compile(c, infile, outfile) { // :{ error? :Error, code :string }
    let js = await readfile(infile, 'utf8')
    let r = UglifyJS.minify({[infile] : js}, {
      ecma:  6,
      parse: {},
      compress: {
        dead_code: true,
        global_defs: this.getDefines(c.debug),
      },
      mangle: false,
      output: {
        ast: false,
        code: true,
        preserve_line: c.debug, // poor man's sourcemap :-)
      },
      // sourceMap: {
      //   root: dirname(infile),
      //   filename: basename(infile),
      //   url: "x", // "inline" causes [DEP0005] DeprecationWarning
      // },
    })
    // if (r.map) {
    //   r.code += "\n" + inlineSourceMap(r.map)
    // }
    return r
  }
}


// StdLib represents a standard TypeScript library like "dom"
export class StdLib extends LibBase {
  // readonly name :string
  constructor(name) {
    super()
    this.name = name
  }
}


// UserLib represents a user-provided library
export class UserLib extends Lib {
  getCode(c) {
    return super.getCode(c).catch(e => {
      let msg = ""
      if (e.filename && e.line !== undefined) {
        // e.message contains filename and location already
        msg = `Error while building ${this}: ${e.message}`
      } else {
        msg = e.stack||String(e)
      }
      console.error(msg)
      return ""
    })
  }
}


export class Product {
  constructor(props /*:ProductProps*/) {
    this.outfile = Path.resolve(props.outfile)
    this.outdir = dirname(this.outfile)
    this.name = props.name || rpath(this.outfile)
    this.version = props.version || '0.0.0'
    this.basedir = props.basedir || "."

    this.entry = Path.resolve(props.entry)
    this.srcdir = props.srcdir || dirname(this.entry)
    this.targetESVersion = Number(props.targetESVersion) || 0  // 0=latest
    if (isNaN(this.targetESVersion)) {
      throw new Error(`invalid targetESVersion value (not a number)`)
    }

    this.jsx = props.jsx || null
    this.mapfile = props.mapfile || this.outfile + '.map'

    this.assetBundler = new AssetBundler()

    // banner is added to the top of the product JS file
    this.banner = props.banner || `/* ${this.name} ${this.version} */\n`

    // libraries
    this.libs = []
    this.stdlibs = []
    for (let lib of props.libs || []) {
      if (lib instanceof Lib) {
        this.libs.push(lib)
      } else if (lib instanceof StdLib) {
        this.stdlibs.push(lib)
      } else {
        throw new Error(`invalid lib object ${repr(lib)}`)
      }
    }

    // string substitution
    this.subs = props.subs || []  // [string,string][] ; match string -> replacement string

    // constant definitions that may be inlined
    this.definesInline = {}

    // constant defintions (will be available as `const name = value` at runtime)
    this.defines = {}

    // output data, updated when building
    this.output = { js: "", map: "" }
  }


  copy() {
    let p2 = Object.create(this.constructor.prototype)
    for (let k of Object.keys(this)) {
      p2[k] = this[k]
    }
    return p2
  }


  async build(c) {
    this.preBuild(c)
    try {
      let startTime = Date.now()

      if (c.verbose2) {
        print(`build module ${repr(this.name)}`)
      }

      // // check if product is already up-to-date
      // if (!c.clean && await this.isUpToDate()) {
      //   this.reportBuildCompleted(startTime)
      //   return
      // }

      // parse & compile input sources
      let incfg = await this.makeInputConfig(c)
      let rollupBundle = await rollup.rollup(incfg)
      // Note: rollup mutates incfg

      // assemble & generate output
      let outcfg = await this.makeOutputConfig(c)
      let res = await rollupBundle.generate(outcfg)

      // pick primary "entry" output object
      let output = res.output.reduce((a, b) => b.isEntry ? b : a)

      // fixup source map (mutates output.map object)
      this.patchSourceMap(output.map)

      // apply any string substitution
      if (this.subs.length > 0) {
        output.code = strings.sub(output.code, this.subs)
      }

      // optimize code
      if (c.optimize) {
        // print(`optimizing ${this.name} ...`)
        output = this._optimize(c, output.code, output.map, outcfg)
      }

      // source map
      let map = output.map.toString()

      // post-process code
      let js = this.postProcessJs(c, output.code, map)

      // update in-memory outout
      this.output = { js, map }

      // write files
      await Promise.all([
        writefile(this.outfile, js, 'utf8'),
        writefile(this.mapfile, map, 'utf8'),
      ])

      this.reportBuildCompleted(c, startTime)

    } catch(err) {
      this.logBuildError(err)
      err._wasReported = true
      throw err
    }
  }


  preBuild(c) {
    for (let k in this.definesInline) {
      // no work to be done
      return
    }
    this.definesInline = {}
    for (let lib of this.libs) {
      Object.assign(this.definesInline, lib.getDefines(c.debug))
    }
    this.defines = Object.assign({
      VERSION: this.version,
    }, this.definesInline)
  }


  postProcessJs(c, js, mapjson) {
    // at some point in history rollup and/or typescript changed behavior
    // and is no longer writing sourceMappingURL to the output code. Thus,
    // we strip any sourceMappingURL and add it back again.
    js = js.trim().replace(
      /[\r\n\s]*\/\/#\s*sourceMappingURL\s*=\s*[^\r\n]+[\r\n]*/m,
      ''
    )
    if (c.optimize) {
      // sidecar file
      js += '\n//#sourceMappingURL=' + basename(this.mapfile) + "\n"
    } else {
      js += "\n" + inlineSourceMap(mapjson)
    }
    return js
  }


  // interface IncrBuildProcess extends Promise<void> {
  //   end() :void           // ends build process
  //   readonly ended :bool  // true after process has ended
  // }
  //
  buildIncrementally(c, onStartBuild, onEndBuild) { // :IncrBuildProcess
    this.preBuild(c)
    const p = this

    let onstart = (
      onStartBuild ? isFirstRun => { onStartBuild(p, isFirstRun) } : ()=>{}
    )
    if (c.verbose2) {
      onstart = isFirstRun => {
        if (onStartBuild) {
          onStartBuild(p, isFirstRun)
        }
        print(`build module ${repr(p.name)}`)
      }
    }

    let buildProcess = {
      end() {}, // ends build process (implemented inside promise body)
      ended: false,
      promise: null,
      then(f) { return this.promise.then(f) },
      ["catch"](f) { return this.promise.catch(f) },
    }

    var wopt = {} // options to rollup.watch

    const configure = async () => {
      let [incfg, outcfg] = await Promise.all([
        p.makeInputConfig(c),
        p.makeOutputConfig(c),
      ])
      wopt = {
        ...incfg,
        output: outcfg,
        watch: {
          clearScreen: true,
        },
      }
    }

    buildProcess.promise = new Promise(async (resolve, reject) => {
      let startTime = Date.now()
      let isFirstRun = true

      var watcher

      buildProcess.end = err => {
        if (buildProcess.ended) {
          return
        }
        buildProcess.ended = true
        try {
          watcher.close()
        } catch (_) {}
        err ? reject(err) : resolve()
      }

      buildProcess.restart = () => {
        if (buildProcess.ended) {
          return
        }
        try {
          watcher.close()
        } catch (_) {}
        return startWatcher()
      }

      let _onEndBuild = async () => {
        // Note: Unfortunately there's no public API for controlling writing
        // of files with rollup in watch mode, so we simply read the
        // implicitly-written files from disk. This is very fast on a modern
        // OS since the files' contents should be in memory already.

        // TODO do more testing to make sure we no longer need this:
        // let js, map
        // if (c.debug) {
        //   // inline sourcemap in debug mode
        //   js = await readfile(this.outfile, 'utf8')
        //   const lastLinePrefix = '//# sourceMappingURL='
        //   let lastLine = js.substr(js.lastIndexOf(lastLinePrefix))
        //   let i = lastLine.indexOf('\n')
        //   if (i != -1) {
        //     lastLine = lastLine.substr(0, i)  // trim away suffix
        //   }
        //   let mapstr = lastLine.substr(lastLinePrefix.length)
        //   mapstr = mapstr.substr(mapstr.indexOf(';base64,') + 8)
        //   map = Buffer.from(mapstr, 'base64').toString('utf8')
        // } else {
        let [js, map] = await Promise.all([
          readfile(p.outfile, 'utf8'),
          readfile(p.mapfile, 'utf8'),
        ])

        // fixup source map (mutates output.map object)
        let sourcemap = JSON.parse(map)
        p.patchSourceMap(sourcemap)

        // optimize code
        if (c.optimize) {
          let r = p._optimize(c, js, sourcemap, wopt.output)
          js = r.code
          map = r.map
          // re-write files
          await Promise.all([
            writefile(p.outfile, js, 'utf8'),
            writefile(p.mapfile, map, 'utf8'),
          ])
        } else {
          map = JSON.stringify(sourcemap)
        }

        // post-process code
        js = p.postProcessJs(c, js, map)

        // update output
        p.output = { js, map }

        // write files
        await Promise.all([
          writefile(p.outfile, js, 'utf8'),
          writefile(p.mapfile, map, 'utf8'),
        ])

        p.reportBuildCompleted(c, startTime)

        if (onEndBuild) {
          onEndBuild(p)
        }
      }

      async function startWatcher() {
        await configure()
        watcher = rollup.watch(wopt)
        watcher.on('event', ev => {
          switch (ev.code) {

            case 'BUNDLE_START': { // building an individual bundle
              startTime = Date.now()
              onstart(isFirstRun)
              if (isFirstRun) {
                isFirstRun = false
              }
              break
            }

            case 'BUNDLE_END': { // finished building a bundle
              // let files = ev.output.map(fn => relpath(pkg.dir, fn)).join(', ')
              _onEndBuild().catch(err => watcher.emit('error', err))
              break
            }

            case 'ERROR': { // encountered an error while bundling
              p.logBuildError(ev.error)
              break
            }

            case 'FATAL': { // encountered an unrecoverable error
              const err = ev.error
              if (err) {
                p.logBuildError(err)
                if (err.code == 'PLUGIN_ERROR' && err.plugin == 'rpt2') {
                  // TODO: retry buildIncrementally() when source changes
                }
              } else {
                reject('unknown error')
              }
              break
            }

            case 'START': // the watcher is (re)starting
            case 'END':   // finished building all bundles
              break

            default: {
              console.error('unhandled rollup event:', ev.code, ev)
            }
          }
        })
      }

      startWatcher()

    })

    return buildProcess
  }


  reportBuildCompleted(c, startTime) {
    if (c.verbose2) {
      let timeDuration = Date.now() - startTime
      let time = fmtDuration(timeDuration)
      let size = fmtByteSize(strUTF8Size(this.output.js))
      print(`built module ${repr(this.name)} (${size}) in ${time}`)
    }
  }

  logBuildError(err) {
    if (err.code == 'PLUGIN_ERROR') {
      // don't include stack trace
      let msg = err.message || ''+err
      if (err.plugin == 'rpt2') {
        // convert weird typescript origins `file(line,col):` to standard
        // `file:line:col:`
        msg = msg.replace(
          /(\n|^)(.+)\((\d+),(\d+)\)/g, '$1$2:$3:$4'
        )
      }
      console.error(msg)
    } else if (err.loc) {
      let l = err.loc
      console.error(`${l.file}:${l.line}:${l.column}: ${err.message}`)
      if (err.frame) {
        console.error(err.frame)
      }
    } else {
      console.error(err.stack || ''+err)
    }
  }

  getTSTargetID() /*:string*/ {
    switch (this.targetESVersion) {
      case 0:            return 'esnext'; break
      case 3:            return 'es3'; break
      case 5:            return 'es5'; break
      case 6: case 2015: return 'es6'; break
      case 7: case 2016: return 'es2016'; break
      case 8: case 2017: return 'es2017'; break
      case 9: case 2018: return 'es2018'; break
      default:
        if (this.targetESVersion > 2018) {
          return 'es' + this.targetESVersion
        }
        throw new Error(`invalid targetESVersion ${this.targetESVersion}`)
    }
  }

  async makeInputConfig(c) {
    let userTsConfigFile = pjoin(this.basedir, 'tsconfig.json')
    let userTsConfig = {}, userTsCompilerOptions = {}
    let estarget = this.getTSTargetID()
    let include = []
    let stdlibs = [ estarget ]
    try {
      userTsConfig = JSON.parse(await readfile(userTsConfigFile, 'utf8'))
      userTsCompilerOptions = userTsConfig.compilerOptions || {}
      if (userTsConfig.include && Array.isArray(userTsConfig.include)) {
        include = userTsConfig.include.slice()
      }
      let co = userTsConfig.compilerOptions || {}
      if (userTsCompilerOptions.lib) {
        stdlibs = userTsConfig.lib.slice()
      }
    } catch (_) {
      // Note: we leave userTsConfigFile set to the file that doesn't exist
      // as the rollup-plugin-typescript2 library will otherwise try to find
      // another tsconfig file, which will certainly be the wrong one.
      // Because of this, we set the tsconfig to point to our default
      // template tsconfig file in lib.
      userTsConfigFile = pjoin(figplugDir, "lib", "template-tsconfig.json")
    }

    // add libs d files
    for (let lib of this.libs) {
      if (lib.dfile) {
        include.push(lib.dfile)
      }
    }

    // add stdlibs
    for (let lib of this.stdlibs) {
      stdlibs.push(lib.name)
    }

    let jsx = (
      userTsCompilerOptions.jsx !== undefined ? userTsCompilerOptions.jsx :
      ( this.entry.endsWith(".tsx") || this.entry.endsWith(".jsx") ?
        "react" : undefined )
    )

    let typescriptObj = this.assetBundler.getTypescriptProxy()
    let assetRollupPlugin = this.assetBundler.getRollupPlugin()

    let defaultCompilerOptions = {
      removeComments: !c.debug,
      noFallthroughCasesInSwitch: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      preserveConstEnums: true,
      strictNullChecks: true,
      alwaysStrict: true,
      forceConsistentCasingInFileNames: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true, // Include modules imported with .json extension
      extendedDiagnostics: c.verbose2,
      listFiles: c.verbose2,
      // traceResolution: c.verbose2, // prints A LOT of info
    }

    let tsconfig = {
      // https://github.com/ezolenko/rollup-plugin-typescript2#plugin-options
      check: false, // don't lint -- faster
      verbosity: c.verbose2 ? 2 : 1, // 0 Error, 1 Warning, 2 Info, 3 Debug
      typescript: typescriptObj,
      tsconfigDefaults: { compilerOptions: defaultCompilerOptions },
      tsconfig: userTsConfigFile,
      tsconfigOverride: {
        include,

        compilerOptions: Object.assign(
          userTsCompilerOptions,
          {
            // for all builds
            //
            module: "esnext",
            sourceMap: true,
            target: estarget,
            noEmitOnError: true,
            outDir: relpath(this.basedir, this.outdir),
            lib: stdlibs,
            jsx,
            baseUrl: relpath(this.basedir, this.srcdir),
          },
          // c.optimize ? {
          //   // only for optimized builds
          //   //
          //   noUnusedLocals: true,
          // } : {},
          c.debug ? {
            // only for debug builds
            //
            pretty: true,

          } : {}
        ),

      },
      cacheRoot: pjoin(this.outdir, '.tscache-' + (c.debug ? 'g' : 'o')),
      clean: c.clean,

      rollupCommonJSResolveHack: true,
    }

    if (c.verbose2) {
      print(`configuration for ${repr(this.name)}:\n` + jsonfmt(
        {
          outfile: this.outfile,
          outdir: this.outdir,
          name: this.name,
          version: this.version,
          basedir: this.basedir,
          entry: this.entry,
          srcdir: this.srcdir,
          targetESVersion: this.targetESVersion,
          tsconfig: userTsConfigFile,
          "tsconfig.compilerOptions": Object.assign(
            {},
            defaultCompilerOptions,
            tsconfig.tsconfigOverride.compilerOptions
          ),
          "tsconfig.include": tsconfig.tsconfigOverride.include,
          libs: this.libs.map(String),
        }
      ))
    }

    let tsPlugin = typescriptPlugin(tsconfig)

    let incfg = {
      input: this.entry,
      plugins: [

        tsPlugin,

        nodeResolvePlugin({
          // see https://github.com/rollup/rollup-plugin-node-resolve
          mainFields: ['jsnext:main', 'module', 'main'],
        }),

        commonjsPlugin({
          // see https://github.com/rollup/rollup-plugin-commonjs
          include: [
            pjoin(this.basedir, 'node_modules', '**'),
          ],
          sourceMap: false,  // Default: true
        }),

        assetRollupPlugin,
      ],
      onwarn(w) {
        if (w.loc) {
          let msg = `WARN ${rpath(w.loc.file)}:${w.loc.line}:${w.loc.column} ${w.message}`
          if (w.frame) {
            // look for @ts-ignore on preceeding line
            let lines = w.frame.split("\n")
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith(`${w.loc.line}:`) &&
                  lines[i-1].match(/\/\/\s*@ts-ignore[\s\r\n]+/))
              {
                // ignore
                return
              }
            }
            msg += "\n" + w.frame
          }
          console.warn(msg)
        } else {
          console.warn(`WARN ${w.message}`)
        }
      },
    }

    return incfg
  }

  async makeOutputConfig(c) {
    const wrapperStart = '(function(exports){\n'
    const wrapperEnd = '})(typeof exports != "undefined" ? exports : this);\n'

    let outcfg = {
      file: this.outfile,
      format: 'cjs', // umd
      name: this.name,
      sourcemap: true,
      freeze: c.debug, // Object.freeze(x) on import * as x from ...
      banner: this.banner + wrapperStart,
      footer: wrapperEnd,
      intro: '',
    }

    // add predefined constants to intro
    let defs = Object.keys(this.defines).map(k =>
      k + ' = ' + JSON.stringify(this.defines[k])
    )
    if (defs.length > 0) {
      outcfg.intro += 'var ' + defs.join(', ') + ';\n'
    }

    // add lib code to intro
    let libcode = await Promise.all(this.libs.map(lib => lib.getCode(c)))
    for (let code of libcode) {
      if (code != "") {
        outcfg.intro += code + '\n'
      }
    }

    // Note: This is probably not needed, as TypeScript will complain and not compile.
    // // wrap user program in function in case we generated an intro.
    // // this allows user code to redeclare global variables like print or dlog.
    // if (this.libs.length > 0 || defs.length > 0) {
    //   outcfg.intro += ";(function(){\n"
    //   outcfg.outro += "\n})();\n"
    // }

    return outcfg
  }

  patchSourceMap(m) {
    delete m.sourcesContent

    const srcDirRel = relpath(this.outdir, this.srcdir)
    const sourceRootRel = dirname(srcDirRel)

    m.sourceRoot = srcDirRel

    m.sources = m.sources.map(path => {
      if (path.startsWith(srcDirRel)) {
        const abspath = Path.resolve(this.outdir, path)
        return relpath(this.srcdir, abspath)
      }
      return path
    })
  }

  _optimize(c, code, map, outcfg) {
    // need to clear sourceRoot for uglify to produce correct source paths
    let mapSourceRoot = map.sourceRoot
    map.sourceRoot = ''

    let pureFuncList = [
      // list of known global pure functions that doesn't have any
      // side-effects, provided by the environment.
      'Math.floor',
      'Math.ceil',
      'Math.round',
      'Math.random',
      // TODO: expand this list
    ]

    let infilename = rpath(outcfg.file)
    let minify = !c.nomin
    let outputEcmaVersion = this.targetESVersion
    let result = {}
    let startTime = 0

    if (c.verbose2) {
      startTime = Date.now()
      let size = fmtByteSize(strUTF8Size(code))
      print(`optimizing module ${repr(this.name)} (${size})`)
    }

    try {
      result = UglifyJS.minify({[infilename]: code}, {
        warnings: true,
        toplevel: outcfg.format == 'cjs',

        // compress: false,
        compress: {
          ecma: outputEcmaVersion,
          // (default: `5`) -- Pass `6` or greater to enable `compress` options that
          // will transform ES5 code into smaller ES6+ equivalent forms.

          // arrows: false,
          // (default: `true`) -- Converts `()=>{return x}` to `()=>x`. Class
          // and object literal methods will also be converted to arrow expressions if
          // the resultant code is shorter: `m(){return x}` becomes `m:()=>x`.
          // This transform requires that the `ecma` compress option is set to `6` or greater.

          // booleans: false,
          // (default: `true`) -- various optimizations for boolean context,
          // for example `!!a ? b : c → a ? b : c`

          // collapse_vars: false,
          // (default: `true`) -- Collapse single-use non-constant variables,
          // side effects permitting.

          // comparisons: false,
          // (default: `true`) -- apply certain optimizations to binary nodes,
          // e.g. `!(a <= b) → a > b` (only when `unsafe_comps`), attempts to negate binary
          // nodes, e.g. `a = !b && !c && !d && !e → a=!(b||c||d||e)` etc.

          // computed_props: false,
          // (default: `true`) -- Transforms constant computed properties
          // into regular ones: `{["computed"]: 1}` is converted to `{computed: 1}`.

          // conditionals: false,
          // (default: `true`) -- apply optimizations for `if`-s and conditional
          // expressions

          // dead_code: false,
          // (default: `true`) -- remove unreachable code

          // drop_console: false,
          // (default: `false`) -- Pass `true` to discard calls to
          // `console.*` functions. If you wish to drop a specific function call
          // such as `console.info` and/or retain side effects from function arguments
          // after dropping the function call then use `pure_funcs` instead.

          // drop_debugger: false,
          // (default: `true`) -- remove `debugger;` statements

          evaluate: true,
          // (default: `true`) -- attempt to evaluate constant expressions

          // expression: true,
          // (default: `false`) -- Pass `true` to preserve completion values
          // from terminal statements without `return`, e.g. in bookmarklets.

          global_defs: this.definesInline,
          // (default: `{}`) -- see [conditional compilation](#conditional-compilation)

          // hoist_funs: false,
          // (default: `false`) -- hoist function declarations

          // hoist_props: false,
          // (default: `true`) -- hoist properties from constant object and
          // array literals into regular variables subject to a set of constraints. For example:
          // `var o={p:1, q:2}; f(o.p, o.q);` is converted to `f(1, 2);`. Note: `hoist_props`
          // works best with `mangle` enabled, the `compress` option `passes` set to `2` or higher,
          // and the `compress` option `toplevel` enabled.

          hoist_vars: true,
          // (default: `false`) -- hoist `var` declarations (this is `false`
          // by default because it seems to increase the size of the output in general)

          // if_return: false,
          // (default: `true`) -- optimizations for if/return and if/continue

          // inline: false,
          // (default: `true`) -- embed simple functions

          // join_vars: false,
          // (default: `true`) -- join consecutive `var` statements

          keep_classnames: true,
          // (default: `false`) -- Pass `true` to prevent the
          // compressor from discarding class names.  See also: the `keep_classnames`
          // [mangle option](#mangle).

          // keep_fargs: true,
          // (default: `true`) -- Prevents the compressor from discarding unused
          // function arguments.  You need this for code which relies on `Function.length`.

          // keep_fnames: true,
          // (default: `false`) -- Pass `true` to prevent the
          // compressor from discarding function names.  Useful for code relying on
          // `Function.prototype.name`. See also: the `keep_fnames` [mangle option](#mangle).

          keep_infinity: true,
          // (default: `false`) -- Pass `true` to prevent `Infinity` from
          // being compressed into `1/0`, which may cause performance issues on Chrome.

          // loops: false,
          // (default: `true`) -- optimizations for `do`, `while` and `for` loops
          // when we can statically determine the condition.

          // negate_iife: false,
          // (default: `true`) -- negate "Immediately-Called Function Expressions"
          // where the return value is discarded, to avoid the parens that the
          // code generator would insert.

          passes: 2,
          // (default: `1`) -- The maximum number of times to run compress.
          // In some cases more than one pass leads to further compressed code.  Keep in
          // mind more passes will take more time.

          // properties: false,
          // (default: `true`) -- rewrite property access using the dot notation, for
          // example `foo["bar"] → foo.bar`

          pure_funcs: pureFuncList,
          // (default: `null`) -- You can pass an array of names and
          // UglifyJS will assume that those functions do not produce side
          // effects.  DANGER: will not check if the name is redefined in scope.
          // An example case here, for instance `var q = Math.floor(a/b)`.  If
          // variable `q` is not used elsewhere, UglifyJS will drop it, but will
          // still keep the `Math.floor(a/b)`, not knowing what it does.  You can
          // pass `pure_funcs: [ 'Math.floor' ]` to let it know that this
          // function won't produce any side effect, in which case the whole
          // statement would get discarded.  The current implementation adds some
          // overhead (compression will be slower).

          // pure_getters: undefined,
          // (default: `"strict"`) -- If you pass `true` for
          // this, UglifyJS will assume that object property access
          // (e.g. `foo.bar` or `foo["bar"]`) doesn't have any side effects.
          // Specify `"strict"` to treat `foo.bar` as side-effect-free only when
          // `foo` is certain to not throw, i.e. not `null` or `undefined`.

          // reduce_funcs: false,
          // (default: `true`) -- Allows single-use functions to be
          // inlined as function expressions when permissible allowing further
          // optimization.  Enabled by default.  Option depends on `reduce_vars`
          // being enabled.  Some code runs faster in the Chrome V8 engine if this
          // option is disabled.  Does not negatively impact other major browsers.

          // reduce_vars: false,
          // (default: `true`) -- Improve optimization on variables assigned with and
          // used as constant values.

          // sequences: false,
          // (default: `true`) -- join consecutive simple statements using the
          // comma operator.  May be set to a positive integer to specify the maximum number
          // of consecutive comma sequences that will be generated. If this option is set to
          // `true` then the default `sequences` limit is `200`. Set option to `false` or `0`
          // to disable. The smallest `sequences` length is `2`. A `sequences` value of `1`
          // is grandfathered to be equivalent to `true` and as such means `200`. On rare
          // occasions the default sequences limit leads to very slow compress times in which
          // case a value of `20` or less is recommended.

          // side_effects: false,
          // (default: `true`) -- Pass `false` to disable potentially dropping
          // functions marked as "pure".  A function call is marked as "pure" if a comment
          // annotation `/*@__PURE__*/` or `/*#__PURE__*/` immediately precedes the call. For
          // example: `/*@__PURE__*/foo();`

          // switches: false,
          // (default: `true`) -- de-duplicate and remove unreachable `switch` branches

          // toplevel: false,
          // (default: `false`) -- drop unreferenced functions (`"funcs"`) and/or
          // variables (`"vars"`) in the top level scope (`false` by default, `true` to drop
          // both unreferenced functions and variables)

          // top_retain: null,
          // (default: `null`) -- prevent specific toplevel functions and
          // variables from `unused` removal (can be array, comma-separated, RegExp or
          // function. Implies `toplevel`)

          // typeofs: false,
          // (default: `true`) -- Transforms `typeof foo == "undefined"` into
          // `foo === void 0`.  Note: recommend to set this value to `false` for IE10 and
          // earlier versions due to known issues.

          // unsafe: false,
          // (default: `false`) -- apply "unsafe" transformations (discussion below)

          // unsafe_arrows: true,
          // (default: `false`) -- Convert ES5 style anonymous function
          // expressions to arrow functions if the function body does not reference `this`.
          // Note: it is not always safe to perform this conversion if code relies on the
          // the function having a `prototype`, which arrow functions lack.
          // This transform requires that the `ecma` compress option is set to `6` or greater.

          // unsafe_comps: false,
          // (default: `false`) -- Reverse `<` and `<=` to `>` and `>=` to
          // allow improved compression. This might be unsafe when an at least one of two
          // operands is an object with computed values due the use of methods like `get`,
          // or `valueOf`. This could cause change in execution order after operands in the
          // comparison are switching. Compression only works if both `comparisons` and
          // `unsafe_comps` are both set to true.

          // unsafe_Func: false,
          // (default: `false`) -- compress and mangle `Function(args, code)`
          // when both `args` and `code` are string literals.

          // unsafe_math: false,
          // (default: `false`) -- optimize numerical expressions like
          // `2 * x * 3` into `6 * x`, which may give imprecise floating point results.

          // unsafe_methods: false,
          // (default: false) -- Converts `{ m: function(){} }` to
          // `{ m(){} }`. `ecma` must be set to `6` or greater to enable this transform.
          // If `unsafe_methods` is a RegExp then key/value pairs with keys matching the
          // RegExp will be converted to concise methods.
          // Note: if enabled there is a risk of getting a "`<method name>` is not a
          // constructor" TypeError should any code try to `new` the former function.

          // unsafe_proto: false,
          // (default: `false`) -- optimize expressions like
          // `Array.prototype.slice.call(a)` into `[].slice.call(a)`

          // unsafe_regexp: false,
          // (default: `false`) -- enable substitutions of variables with
          // `RegExp` values the same way as if they are constants.

          // unused: true,
          // (default: `true`) -- drop unreferenced functions and variables (simple
          // direct variable assignments do not count as references unless set to
          // `"keep_assign"`)

          // warnings: false,
          // (default: `false`) -- display warnings when dropping unreachable
          // code or unused declarations etc.
        },

        // mangle: false,
        mangle: minify ? {
          // reserved: [],
          keep_classnames: true,
          keep_fnames: false,
          safari10: false,
        } : false,

        output: {
          preamble: this.banner.trim(), // uglify adds a trailing newline
          beautify: !minify,
          indent_level: 2,
          // comments: true,
          ast: false,
          code: true,
          safari10: false,
          ecma: outputEcmaVersion,
        },
        sourceMap: {
          content: map,
          root: mapSourceRoot,
          url: basename(this.mapfile),
          filename: basename(this.outfile),
        },
      })

      if (result.error) {
        throw result.error
      }

      if (c.verbose2) {
        let size = fmtByteSize(strUTF8Size(code))
        let time = fmtDuration(Date.now() - startTime)
        print(`finished optimizing module ${repr(this.name)} in ${time}`)
      }

    } catch (err) {
      if (err.filename) {
        console.error(
          `${err.filename}:${err.line}:${err.col}:`,
          err.message
        )
      }
      throw err
    }

    return {
      code: result.code, // + outcfg.footer
      map: result.map,
    }
  }
}
