import { BuildCtx, figplugDir } from './ctx'
import { Lib, StdLib, UserLib, LibProps, Product, IncrementalBuildProcess } from './pkgbuild'
import * as os from 'os'
import { existsSync, watch as watchFile } from 'fs'
import * as Html from 'html'
import { jsonfmt, rpath, fmtDuration } from './util'
import { readfile, writefile, isFile } from './fs'
import postcssNesting from 'postcss-nesting'
import { Manifest } from './manifest'
import * as Path from 'path'
import { join as pjoin, dirname, basename, parse as parsePath } from 'path'


const domTSLib = new StdLib("dom")


let _figplugLib :Lib|null = null

function getFigplugLib() :Lib {
  return _figplugLib || (_figplugLib = new Lib({
    dfile:    pjoin(figplugDir, 'lib', 'figplug.d.ts'),
    jsfile:   pjoin(figplugDir, 'lib', 'figplug.js'),
    cachedir: pjoin(os.tmpdir(), 'figplug'),
  }))
}


let figmaPluginLibCache = new Map<string,Lib>()  // by version

function getFigmaPluginLib(apiVersion? :string) :Lib {
  let v :string = FIGMA_API_VERSIONS[0] // latest version
  if (apiVersion && apiVersion != "latest") {
    v = apiVersion
  }
  let lib = figmaPluginLibCache.get(v)
  if (!lib) {
    let dfile = pjoin(figplugDir, 'lib', `figma-plugin-${v}.d.ts`)
    if (!existsSync(dfile)) {
      console.warn(
        `warning: unknown Figma API version ${apiVersion}.`+
        ` Using type definitions for latest known version.`
      )
      dfile = pjoin(figplugDir, 'lib', `figma-plugin.d.ts`)
    }
    lib = new Lib(dfile)
    figmaPluginLibCache.set(v, lib)
  }
  return lib
}


async function setLibPropsFiles(input: string, fn :string, props :LibProps) {
  if (fn.endsWith(".d.ts")) {
    // provided foo.d.ts
    // =? foo.js
    // == foo.d.ts
    if (props.dfile) {
      throw new Error(`duplicate .d.ts file provided for -lib=${repr(input)}`)
    }
    props.dfile = fn
  } else if (fn.endsWith(".js")) {
    // provided foo.js
    // == foo.js
    // =? foo.d.ts
    if (props.jsfile) {
      throw new Error(`duplicate .js file provided for -lib=${repr(input)}`)
    }
    props.jsfile = fn
  } else {
    // assume fn lacks extension -- look for both fn.js and fn.d.ts
    let jsfn = fn + ".js"
    let dtsfn = fn + ".d.ts"
    let hasJS = props.jsfile ? Promise.resolve(false) : isFile(jsfn)
    let hasDTS = props.dfile ? Promise.resolve(false) : isFile(dtsfn)
    if (await hasJS) {
      props.jsfile = jsfn
    }
    if (await hasDTS) {
      props.dfile = dtsfn
    }
  }
}


async function getUserLib(filename :string, basedir :string, cachedir :string) :Promise<UserLib> {
  let props = {} as LibProps
  let names = filename.split(":").map(fn => Path.isAbsolute(fn) ? fn : Path.resolve(basedir, fn))

  if (names.length > 1) {
    // foo.js:foo.d.ts
    if (names.length > 2) {
      throw new Error(`too many filenames provided for -lib=${repr(filename)}`)
    }
    for (let fn of names) {
      fn = Path.resolve(fn)
      await setLibPropsFiles(filename, fn, props)
    }
  } else {
    let fn = Path.resolve(names[0])
    await setLibPropsFiles(filename, fn, props)
  }
  if (!props.dfile && !props.jsfile) {
    throw new Error(`library not found ${filename} (${names.join(", ")})`)
  }
  if (!props.jsfile) {
    // .d.ts file was set -- try to discover matching .js file
    let jsfn = props.dfile!.substr(0, props.dfile!.length - ".d.ts".length) + ".js"
    if (await isFile(jsfn)) {
      props.jsfile = jsfn
    }
  } else if (!props.dfile) {
    // .js file was set -- try to discover matching .d.ts file
    let dtsfn = props.jsfile!.substr(0, props.jsfile!.length - ".js".length) + ".d.ts"
    if (await isFile(dtsfn)) {
      props.dfile = dtsfn
    }
  }
  if (props.jsfile) {
    props.cachedir = cachedir
  }
  // Note: It probably doesn't help much to cache these, so we don't and keep
  // this code a little simpler.
  return new UserLib(props)
}


export class PluginTarget {
  readonly manifest      :Manifest
  readonly basedir       :string  // root of plugin; dirname of manifest.json
  readonly srcdir        :string
  readonly outdir        :string
  readonly name          :string  // e.g. "Foo Bar" from manifest.props.name

  // plugin product (mutable as build() may swap around)
  pluginProduct     :Product
  origPluginProduct :Product|null = null  // non-null when modified by build()

  readonly uiProduct     :Product|null = null
  readonly pluginOutFile :string
  readonly htmlOutFile   :string = "" // non-empty when uiProduct is set
  readonly htmlInFile    :string = "" // non-empty when uiProduct is set
  readonly cssInFile     :string = "" // non-empty when uiProduct is set

  // incremental build promise of plugin
  pluginIncrBuildProcess :IncrementalBuildProcess|null = null


  constructor(manifest :Manifest, outdir :string) {
    this.manifest = manifest
    this.basedir = dirname(manifest.file)

    let pluginSrcFile = pjoin(this.basedir, manifest.props.main)

    this.srcdir = dirname(pluginSrcFile)
    this.outdir = outdir = outdir || pjoin(this.srcdir, "build")
    this.name = manifest.props.name
    this.pluginOutFile = pjoin(outdir, parsePath(pluginSrcFile).name + '.js')

    // setup libs
    let figplugLib = getFigplugLib()
    let figmaPluginLib = getFigmaPluginLib(manifest.props.api)

    // setup plugin product
    this.pluginProduct = new Product({
      version: "0",
      entry:   pluginSrcFile,
      outfile: this.pluginOutFile,
      basedir: this.basedir,
      libs:    [ figplugLib, figmaPluginLib ],
    })

    // setup ui product
    if (manifest.props.ui) {
      let uisrcFile = pjoin(this.basedir, manifest.props.ui)
      let uisrcFilePath = parsePath(uisrcFile)
      let ext = uisrcFilePath.ext.toLowerCase()
      let uisrcDir = uisrcFilePath.dir
      let uisrcName = pjoin(uisrcDir, uisrcFilePath.name)

      this.htmlInFile = uisrcName + '.html'
      this.cssInFile  = uisrcName + '.css'
      this.htmlOutFile = pjoin(outdir, uisrcFilePath.name + '.html')

      if (!uisrcFile.endsWith(".html")) {
        this.uiProduct = new Product({
          version: this.pluginProduct.version,
          entry:   uisrcFile,
          outfile: pjoin(outdir, '.ui.js'),
          basedir: this.basedir,
          libs:    [ figplugLib, domTSLib ],
          jsx:     (ext == ".tsx" || ext == ".jsx") ? "react" : "",
        })
      } // else: HTML-only UI
    }
  }


  async build(c :BuildCtx, onbuild? :()=>void) :Promise<void> {
    // TODO: if there's a package.json file in this.basedir then read the
    // version from it and assign it to this.version

    // Did a previous build stuff away an unmodified version of plugin product?
    if (this.origPluginProduct) {
      this.pluginProduct = this.origPluginProduct
      this.origPluginProduct = null
    }

    // Add extra libs
    let userLibs :{fn:string,basedir:string}[] = c.libs.map(fn => {
      // libs defined on command line are relative to current working directory
      return { fn, basedir: process.cwd() }
    })
    if (this.manifest.props.figplug && this.manifest.props.figplug.libs) {
      for (let fn of this.manifest.props.figplug.libs) {
        // libs defined in manifest are relative to srcdir
        userLibs.push({ fn, basedir: this.srcdir })
      }
    }
    if (userLibs.length > 0) {
      this.origPluginProduct = this.pluginProduct
      this.pluginProduct = this.pluginProduct.copy()
      let libs = await Promise.all(
        userLibs.map(({fn, basedir}) => getUserLib(fn, basedir, this.outdir))
      )
      for (let lib of libs) {
        this.pluginProduct.libs.push(lib)
      }
    }

    // sanity-check input and output files
    if (this.pluginProduct.entry == this.pluginProduct.outfile) {
      throw "plugin input file is same as output file: " +
            repr(this.pluginProduct.entry)
    }
    if (this.htmlInFile && this.htmlInFile == this.htmlOutFile) {
      throw `html input file is same as output file: ` + repr(this.htmlInFile)
    }
    if (this.uiProduct && this.uiProduct.entry == this.uiProduct.outfile) {
      throw "ui input file is same as output file: " +
            repr(this.uiProduct.entry)
    }

    // setup string subs for ui
    if (this.uiProduct) {
      this.uiProduct.subs = [
        ["process.env.NODE_ENV", c.debug ? "'development'" : "'production'"],
      ]
    }

    // reporting
    let onStartBuild = () => {}
    let onEndBuild = onbuild ? onbuild : (()=>{})
    if (c.verbose || c.watch) {
      let info = (
        "plugin " + repr(this.name) +
        " at " + rpath(this.srcdir) +
        " -> " + rpath(this.outdir)
      )
      let startTime = 0
      onStartBuild = () => {
        startTime = Date.now()
        print(`building ${info}`)
      }
      onEndBuild = () => {
        let time = fmtDuration(Date.now() - startTime)
        print(`built ${info} in ${time}`)
        onbuild && onbuild()
      }
    }

    // build once or incrementally depending on c.watch
    return Promise.all([
      this.writeManifestFile(c, this.manifest),
      c.watch ?
        this.buildIncr(c, onStartBuild, onEndBuild) :
        this.buildOnce(c, onStartBuild, onEndBuild)
    ]).then(() => {})
  }


  async buildIncr(c :BuildCtx, onStartBuild :()=>void, onEndBuild :()=>void) :Promise<void> {
    // TODO: return cancelable promise, like we do for
    // Product.buildIncrementally.

    if (this.pluginIncrBuildProcess) {
      throw new Error(`already has incr build process`)
    }

    // reload manifest on change
    watchFile(this.manifest.file, {}, async () => {
      try {
        let manifest2 = await Manifest.loadFile(this.manifest.file)
        if (this.manifest.props.main != manifest2.props.main ||
            this.manifest.props.ui != manifest2.props.ui)
        {
          // source changed -- need to restart build process
          // TODO: automate restarting the build
          console.error(
            '\n' +
            `Warning: Need to restart program -- ` +
            'source files in manifest changed.' +
            '\n'
          )
        } else {
          this.writeManifestFile(c, manifest2)
        }
      } catch (err) {
        console.error(err.message)
      }
    })

    let onStartBuildHtml = () => {}
    const buildHtml = () => {
      onStartBuildHtml()
      return this.buildHTML(c)
    }

    // watch HTML and CSS source files for changes
    if (this.htmlInFile && existsSync(this.htmlInFile)) {
      watchFile(this.htmlInFile, {}, buildHtml)
    }
    if (this.cssInFile && existsSync(this.cssInFile)) {
      watchFile(this.cssInFile, {}, buildHtml)
    }

    // Watch user libraries
    let isRestarting = false
    const rebuildPlugin = () => {
      if (this.pluginIncrBuildProcess && !isRestarting) {
        isRestarting = true
        this.pluginIncrBuildProcess.restart().then(() => {
          isRestarting = false
        })
      }
    }
    for (let lib of this.pluginProduct.libs) {
      if (lib instanceof UserLib) {
        if (lib.jsfile) {
          watchFile(lib.jsfile, {}, rebuildPlugin)
        }
        if (lib.dfile) {
          watchFile(lib.dfile, {}, rebuildPlugin)
        }
      }
    }

    if (this.uiProduct || this.htmlInFile) {
      let buildCounter = 0
      let onstart = () => {
        if (buildCounter++ == 0) {
          onStartBuild()
        }
      }
      let onend = () => {
        if (--buildCounter == 0) {
          onEndBuild()
        }
      }

      this.pluginIncrBuildProcess = this.pluginProduct.buildIncrementally(c, onstart, onend)

      if (this.uiProduct) {
        // TS UI
        return Promise.all([
          this.pluginIncrBuildProcess,
          this.uiProduct.buildIncrementally(
            c,
            onstart,
            () => buildHtml().then(onend),
          ),
        ]).then(() => {})
      }

      if (this.htmlInFile) {
        // HTML-only UI
        onStartBuildHtml = onstart
        return Promise.all([
          this.pluginIncrBuildProcess,
          buildHtml().then(onend),
        ]).then(() => {})
      }
    }

    // no UI
    return this.pluginProduct.buildIncrementally(c, onStartBuild, onEndBuild)
  }


  buildOnce(c :BuildCtx, onStartBuild :()=>void, onEndBuild :()=>void) :Promise<void> {
    onStartBuild()

    if (this.uiProduct) {
      // TS UI
      return Promise.all([
        this.pluginProduct.build(c),
        this.uiProduct.build(c).then(() => this.buildHTML(c)),
      ]).then(onEndBuild)
    }

    if (this.htmlInFile) {
      // HTML-only UI
      return Promise.all([
        this.pluginProduct.build(c),
        this.buildHTML(c),
      ]).then(onEndBuild)
    }

    // no UI
    return this.pluginProduct.build(c).then(onEndBuild)
  }


  async buildHTML(c :BuildCtx) :Promise<void> {
    const defaultHtml = (
      "<html><head></head><body><div id=\"root\"></div></body></html>"
    )

    let startTime = 0
    if (c.verbose) {
      startTime = Date.now()
      print(`build module ${repr(rpath(this.htmlOutFile))}`)
    }

    // read contents of HTML and CSS files
    let [html, css] = await Promise.all([
      readfile(this.htmlInFile, 'utf8').catch(err => {
        if (err.code != 'ENOENT') { throw err }
        return defaultHtml
      }),
      readfile(this.cssInFile, 'utf8').catch(err => {
        if (err.code != 'ENOENT') { throw err }
        return ""
      }),
    ])

    // HTML head and tail
    let head = ""
    let tail = ""

    if (this.uiProduct) {
      let js = this.uiProduct.output.js
      tail += '<script>\n' + js + '\n</script>'
    }

    // process CSS if any was loaded
    if (css.trim() != "") {
      css = await this.processCss(css, this.cssInFile)
      head = '<style>\n' + css + '\n</style>'
    }

    // find best offset in html text to insert HTML head content
    let htmlOut = ""
    let tailInsertPos = Html.findTailIndex(html)
    if (head.length) {
      let headInsertPos = Html.findHeadIndex(html)
      htmlOut = (
        html.substr(0, headInsertPos) +
        head +
        html.substring(headInsertPos, tailInsertPos) +
        tail +
        html.substr(tailInsertPos)
      )
    } else {
      htmlOut = (
        html.substr(0, tailInsertPos) +
        tail +
        html.substr(tailInsertPos)
      )
    }

    if (c.verbose) {
      let time = fmtDuration(Date.now() - startTime)
      print(`built module ${repr(rpath(this.htmlOutFile))} in ${time}`)
    }

    return writefile(this.htmlOutFile, htmlOut, 'utf8')
  }


  processCss(css :string, filename :string) :Promise<string> {
    return postcssNesting.process(css, {
      from: filename,
    }, {
      features: {
        'nesting-rules': true,
      },
    }).then(r => r.toString()) as Promise<string>
  }


  writeManifestFile(c :BuildCtx, manifest :Manifest) :Promise<void> {
    let props = manifest.propMap()

    // override source file names
    props.set("main", basename(this.pluginProduct.outfile))
    if (this.htmlOutFile) {
      props.set("ui", basename(this.htmlOutFile))
    } else {
      props.delete("ui")
    }

    // generate JSON
    let json = jsonfmt(props)

    // write file
    let file = pjoin(this.outdir, 'manifest.json')

    c.verbose2 && print(`write ${rpath(file)}`)

    return writefile(file, json, 'utf8')
  }


  toString() :string {
    let name = JSON.stringify(this.manifest.props.name)
    let dir = JSON.stringify(
      rpath(this.srcdir) || basename(process.cwd())
    )
    return `Plugin(${name} at ${dir})`
  }
}
