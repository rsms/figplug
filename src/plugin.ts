import { BuildCtx, figplugDir } from './ctx'
import { Lib, StdLib, UserLib, LibProps, Product, IncrementalBuildProcess } from './pkgbuild'
import * as os from 'os'
import { existsSync, watch as watchFile } from 'fs'
import * as Html from 'html'
import { jsonfmt, rpath, fmtDuration, parseQueryString } from './util'
import { readfile, writefile, isFile } from './fs'
import postcssNesting from 'postcss-nesting'
import { Manifest } from './manifest'
import * as Path from 'path'
import {
  join as pjoin,
  dirname,
  basename,
  parse as parsePath,
  resolve as presolve,
} from 'path'
import { AssetBundler, AssetInfo } from './asset'


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


interface UserLibSpec {
  fn      :string   // possibly-relative filename
  basedir :string   // absolute base dir
}


export class PluginTarget {
  readonly manifest      :Manifest
  readonly basedir       :string  // root of plugin; dirname of manifest.json
  readonly srcdir        :string
  readonly outdir        :string
  readonly cachedir      :string  // == pjoin(this.outdir, ".figplug-cache")
  readonly name          :string  // e.g. "Foo Bar" from manifest.props.name
  readonly pluginProduct :Product
  readonly uiProduct     :Product|null = null

  // user lib specs provided with constructor and manifest
  readonly pUserLibs     :UserLibSpec[] = []
  readonly uiUserLibs    :UserLibSpec[] = []
  needLoadUserLibs       :bool = false  // true when loadUserLibs needs to be called by build()

  // output files
  readonly pluginOutFile :string
  readonly htmlOutFile   :string = "" // non-empty when uiProduct is set
  readonly htmlInFile    :string = "" // non-empty when uiProduct is set
  readonly cssInFile     :string = "" // non-empty when uiProduct is set

  // incremental build promises
  pluginIncrBuildProcess :IncrementalBuildProcess|null = null
  uiIncrBuildProcess     :IncrementalBuildProcess|null = null


  constructor(manifest :Manifest, outdir :string, pUserLibs :string[], uiUserLibs :string[]) {
    this.manifest = manifest
    this.basedir = dirname(manifest.file)

    let pluginSrcFile = pjoin(this.basedir, manifest.props.main)

    this.srcdir = dirname(pluginSrcFile)
    this.outdir = outdir = outdir || pjoin(this.srcdir, "build")
    this.cachedir = pjoin(this.outdir, ".figplug-cache")
    this.name = manifest.props.name
    this.pluginOutFile = pjoin(outdir, parsePath(pluginSrcFile).name + '.js')

    // setup libs
    let figplugLib = getFigplugLib()
    let figmaPluginLib = getFigmaPluginLib(manifest.props.api)

    // setup user libs
    this.initUserLibs(pUserLibs, uiUserLibs)

    // setup plugin product
    this.pluginProduct = new Product({
      version:  "0",
      entry:    pluginSrcFile,
      outfile:  this.pluginOutFile,
      basedir:  this.basedir,
      cachedir: this.cachedir,
      libs:     [ figplugLib, figmaPluginLib ],
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
          version:  this.pluginProduct.version,
          entry:    uisrcFile,
          outfile:  pjoin(outdir, '.ui.js'),
          basedir:  this.basedir,
          cachedir: this.cachedir,
          libs:     [ figplugLib, domTSLib ],
          jsx:      (ext == ".tsx" || ext == ".jsx") ? "react" : "",
        })
      } // else: HTML-only UI
    }
  }


  initUserLibs(pUserLibs :string[], uiUserLibs :string[]) {
    let mp = this.manifest.props

    // sets used to avoid duplicate entries. Values are absolute paths.
    let seenp  = new Set<string>()
    let seenui = new Set<string>()

    let add = (seen :Set<string>, v :UserLibSpec[], basedir :string, fn :string) => {
      let path = presolve(basedir, fn)
      if (!seen.has(path)) {
        seen.add(path)
        v.push({ fn, basedir })
      }
    }

    // Add libs from config/CLI.
    // libs defined on command line are relative to current working directory
    let basedir = process.cwd()
    for (let fn of pUserLibs) {
      add(seenp, this.pUserLibs, basedir, fn)
    }
    if (mp.ui) for (let fn of uiUserLibs) {
      add(seenui, this.uiUserLibs, basedir, fn)
    }

    // Add libs from manifest
    if (mp.figplug) {
      let basedir = this.srcdir  // plugin libs defined in manifest are relative to srcdir
      if (mp.figplug.libs) for (let fn of mp.figplug.libs) {
        add(seenp, this.pUserLibs, basedir, fn)
      }
      if (mp.ui && mp.figplug.uilibs) for (let fn of mp.figplug.uilibs) {
        add(seenui, this.uiUserLibs, basedir, fn)
      }
    }

    // set load flag if there are any user libs
    this.needLoadUserLibs = (this.pUserLibs.length + this.uiUserLibs.length) > 0
  }


  async loadUserLibs(c :BuildCtx) :Promise<void> {
    assert(this.needLoadUserLibs)
    this.needLoadUserLibs = false

    // dedup libs to make sure we only have once UserLib instance per actual lib file
    let loadLibs = new Map<string,UserLibSpec>()
    let libPaths :string[] = []
    for (let ls of this.pUserLibs.concat(this.uiUserLibs)) {
      let path = presolve(ls.basedir, ls.fn)
      loadLibs.set(path, ls)
      libPaths.push(path)
    }

    // load and await all
    if (c.verbose2) {
      print(`[${this.name}] load libs:\n  ` + Array.from(loadLibs.keys()).join("\n  "))
    }
    let loadedLibs = new Map<string,UserLib>()
    await Promise.all(Array.from(loadLibs).map(([path, ls]) =>
      getUserLib(ls.fn, ls.basedir, this.cachedir).then(lib => {
        loadedLibs.set(path, lib)
      })
    ))

    // add libs to products
    let libs = libPaths.map(path => loadedLibs.get(path)!)
    let i = 0
    for (; i < this.pUserLibs.length; i++) {
      if (c.verbose) { print(`add plugin ${libs[i]}`) }
      this.pluginProduct.libs.push(libs[i])
    }
    // remainder of libs are ui libs
    for (; i < libs.length; i++) {
      assert(this.uiProduct)
      if (c.verbose) { print(`add UI ${libs[i]}`) }
      this.uiProduct!.libs.push(libs[i])
    }
  }


  async build(c :BuildCtx, onbuild? :()=>void) :Promise<void> {
    // TODO: if there's a package.json file in this.basedir then read the
    // version from it and assign it to this.version

    if (this.needLoadUserLibs) {
      await this.loadUserLibs(c)
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

    if (this.pluginIncrBuildProcess || this.uiIncrBuildProcess) {
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
    let isRestartingPluginBuild = false
    const rebuildPlugin = () => {
      if (this.pluginIncrBuildProcess && !isRestartingPluginBuild) {
        isRestartingPluginBuild = true
        this.pluginIncrBuildProcess.restart().then(() => { isRestartingPluginBuild = false })
      }
    }
    for (let lib of this.pluginProduct.libs) {
      if (lib instanceof UserLib) {
        if (lib.jsfile) { watchFile(lib.jsfile, {}, rebuildPlugin) }
        if (lib.dfile) {  watchFile(lib.dfile, {}, rebuildPlugin) }
      }
    }
    if (this.uiProduct) {
      let isRestartingUIBuild = false
      const rebuildUI = () => {
        if (this.uiIncrBuildProcess && !isRestartingUIBuild) {
          isRestartingUIBuild = true
          this.uiIncrBuildProcess.restart().then(() => { isRestartingUIBuild = false })
        }
      }
      for (let lib of this.uiProduct.libs) {
        if (lib instanceof UserLib) {
          if (lib.jsfile) { watchFile(lib.jsfile, {}, rebuildUI) }
          if (lib.dfile) {  watchFile(lib.dfile, {}, rebuildUI) }
        }
      }
    }

    // have UI?
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
        this.uiIncrBuildProcess = this.uiProduct.buildIncrementally(
          c,
          onstart,
          () => buildHtml().then(onend),
        )
        return Promise.all([ this.pluginIncrBuildProcess, this.uiIncrBuildProcess ]).then(() => {})
      }

      if (this.htmlInFile) {
        // HTML-only UI
        onStartBuildHtml = onstart
        return Promise.all([ this.pluginIncrBuildProcess, buildHtml().then(onend) ]).then(() => {})
      }
    } else {
      // no UI
      return this.pluginIncrBuildProcess = this.pluginProduct.buildIncrementally(
        c,
        onStartBuild,
        onEndBuild,
      )
    }
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


    // Static includes
    html = await this.processInlineFiles(c, html)

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


  // processInlineFiles finds, parses and inlines files referenced by `html`.
  //
  // This function acts on two different kinds of information:
  //
  // - HTML elements like img with a src attribute.
  //   The src attribute value is replaced with a data url and width and height attributes
  //   are added (unless specified)
  //
  // - Explicit <?include "filename" ?> directives.
  //   This entire directive is replaced by the contents of the file.
  //
  // Filenames are relative to dirname(this.htmlInFile).
  //
  // An optional query string parameter "?as=" can be provided with the filename
  // to <?include?> directives, which controls what the output will be.
  // The values for "as=" are:
  //
  //     as=bytearray
  //        Inserts a comma-separated sequence of bytes of the file in decimal form.
  //        e.g. 69,120,97,109,112,108,101  for the ASCII data "Example"
  //
  //     as=jsobj
  //        Inserts a JavaScript literal object with the following interface:
  //        {
  //          mimeType :string   // File type. Empty if unknown.
  //          width?   :number   // for images, the width of the image
  //          height?  :number   // for images, the height of the image
  //        }
  //
  // Absence of as= query parameters means that the contents of the file is inserted as text.
  //
  // Note: File loads are deduplicated, so there's really no performance penalty for including
  // the same file multiple times. For instance:
  //
  //   <img src="foo.png">
  //   <script>
  //   const fooData = new Uint8Array([<?include "foo.png?as=bytearray"?>])
  //   const fooInfo = <?include "foo.png?as=jsobj"?>
  //   </script>
  //
  // This would only cause foo.png to be read once.
  //
  async processInlineFiles(c :BuildCtx, html :string) :Promise<string> {
    interface InlineFile {
      type      :"html"|"include"
      filename  :string
      mimeType  :string
      index     :number
      params    :Record<string,string[]>
      loadp     :Promise<void>
      assetInfo :AssetInfo|null  // non-null when loadp is loaded
      loadErr   :Error|null  // non-null on load error (assetInfo will be null)

      // defined for type=="html"
      tagname   :string
      prefix    :string
      suffix    :string
    }

    const re = /<([^\s>]+)([^>]+)src=(?:"([^"]+)"|'([^']+)')([^>]*)>|<\?\s*include\s+(?:"([^"]+)"|'([^']+)')\s*\?>/mig
    const reGroupCount = 7  // used for index of "index" in args to replace callback

    // Find
    let inlineFiles :InlineFile[] = []  // indexed by character offset in html
    let errors :string[] = []  // error messages indexed by character offset in html
    let htmlInFileDir = dirname(this.htmlInFile)
    html.replace(re, (substr :string, ...m :any[]) => {
      let f = {
        index: m[reGroupCount],
        params: {},
        mimeType: "",
      } as InlineFile
      if (m[0]) {
        let srcval = m[2] || m[3]
        if (srcval.indexOf(":") != -1) {
          // skip URLs
          return substr
        }
        f.type = "html"
        f.filename = pjoin(htmlInFileDir, srcval)
        f.tagname = m[0].toLowerCase()
        f.prefix = "<" + m[0] + m[1]
        f.suffix = m[4].trimRight() + ">"
      } else {
        // <?include ... ?>
        let srcval = m[5]
        if (srcval.indexOf(":") != -1) {
          // URLs not supported in ?include?
          let error = `invalid file path`
          console.error(
            `error in ${rpath(this.htmlInFile)}: ${error} in directive: ${substr} -- ignoring`
          )
          errors[f.index] = error
          return ""
        }
        f.type = "include"
        f.filename = pjoin(htmlInFileDir, m[5])
      }
      inlineFiles[f.index] = f
      return substr
    })

    if (inlineFiles.length == 0) {
      // nothing found -- nothing to do
      return html
    }

    // Load data files
    let fileLoaders = new Map<string,Promise<AssetInfo>>() // filename => AssetInfo
    let assetBundler = new AssetBundler()

    for (let k in inlineFiles) {
      let f = inlineFiles[k]
      // parse filename and update f
      let [filename, mimeType, queryString] = assetBundler.parseFilename(f.filename)
      f.params = parseQueryString(queryString)
      f.filename = filename
      f.mimeType = mimeType || ""

      // start loading file
      let loadp = fileLoaders.get(filename)
      if (!loadp) {
        loadp = assetBundler.loadAssetInfo(filename, f.mimeType)
        fileLoaders.set(filename, loadp)
      }
      f.loadp = loadp.then(assetInfo => {
        f.assetInfo = assetInfo
      }).catch(err => {
        let errmsg = String(err).replace(
          filename,
          Path.relative(dirname(this.htmlInFile), filename)
        )
        console.error(`error in ${rpath(this.htmlInFile)}: ${errmsg}`)
        f.loadErr = err
      })
    }

    // await file loaders, ignoring errors
    await Promise.all(Array.from(fileLoaders.values()).map(p => p.catch(err => {})))

    // Replace in html
    html = html.replace(re, (substr :string, ...m :any[]) => {
      let index = m[reGroupCount]
      let f = inlineFiles[index]
      if (!f) {
        let error = errors[index]
        if (error) {
          return `<!--${substr.replace(/^<\?|\?>$/g, "").trim()} [error: ${error}] -->`
        }
        // unmodified
        return substr
      }

      if (!f.assetInfo) {
        return substr
      }

      if (f.type == "html") {
        // Note: f.tagname is lower-cased

        if (f.tagname == "script") {
          // special case for <script src="foo.js"></script> -> <script>...</script>
          let s = f.prefix.trim() + (f.suffix == ">" ? ">" : " " + f.suffix.trimLeft())
          let text = f.assetInfo.getTextData()
          if (s.endsWith("/>")) {
            // <script src="foo.js"/> -> <script>...</script>
            s = s.substr(0, s.length - 2) + ">" + text + "</script>"
          } else {
            s += text
          }
          return s
        }

        const sizeTagNames = {"svg":1,"img":1}
        let s = f.prefix + `src='${f.assetInfo!.url}'`
        if (f.tagname in sizeTagNames && typeof f.assetInfo.attrs.width == "number") {
          let width = f.assetInfo.attrs.width as number
          let height = f.assetInfo.attrs.height as number
          if (width > 0 && height > 0) {
            let wm = substr.match(/width=(?:"([^"]+)"|'([^"]+)')/i)
            let hm = substr.match(/height=(?:"([^"]+)"|'([^"]+)')/i)
            if (wm && !hm) {
              // width set but not height -- set height based on width and aspect ratio
              let w = parseInt(wm[1] || wm[2])
              if (!isNaN(w) && w > 0)  {
                s += ` height="${(w * (height / width)).toFixed(0)}" `
              }
            } else if (!wm && hm) {
              // height set but not width -- set width based on height and aspect ratio
              let h = parseInt(hm[1] || hm[2])
              if (!isNaN(h) && h > 0)  {
                s += ` width="${(h * (width / height)).toFixed(0)}" `
              }
            } else if (!wm && !hm) {
              // set width & height
              s += ` width="${width}" height="${height}" `
            }
          }
        }
        return s + f.suffix
      }

      let asType = "as" in f.params ? (f.params["as"][0]||"").toLowerCase() : ""
      if (asType == "bytearray") {
        return Array.from(f.assetInfo.getData()).join(",")
      }
      let text = f.assetInfo.getTextData()
      if (asType == "jsobj") {
        return JSON.stringify(Object.assign({
          mimeType: f.assetInfo.mimeType,
        }, f.assetInfo.attrs), null, 2)
      }
      return text
    })

    return html
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
    if (c.noGenManifest) {
      c.verbose2 && print(`[${this.name}] skip writing manifest.json`)
      return Promise.resolve()
    }

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
