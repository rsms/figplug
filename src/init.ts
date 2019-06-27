import { readfile, writefile, copyfile, exists } from './fs'
import { jsonfmt, jsonparse } from './util'
import * as proc from './proc'
import { figplugDir } from './ctx'
import {
  join as pjoin,
  dirname,
  basename,
  resolve as resolvePath,
  isAbsolute as isabspath,
  relative as relpath,
} from 'path'


export async function initPlugin(props :InitOptions) :Promise<bool> {
  let init = new PluginInitializer(props)
  return init.initPlugin()
}

type PluginUIKind = "ts+html" | "html" | "react" | null

export interface InitOptions {
  dir        :string
  srcdir?    :string // defaults to dir
  name?      :string // defaults to basename(dir)
  ui?        :PluginUIKind
  overwrite? :bool
  verbose?   :bool
  debug?     :bool
}

export class PluginInitializer {
  dir       :string
  srcdir    :string
  name      :string
  ui        :PluginUIKind
  overwrite :bool
  verbose   :bool
  debug     :bool

  apiVersion   :string
  manifestFile :string
  tsconfigFile :string
  packageFile  :string
  figmaDtsFile :string
  pluginFile   :string
  htmlFile     :string
  uiFile       :string

  wrotePackage :bool = false

  constructor(props :InitOptions) {
    this.verbose = !!props.verbose
    this.debug = !!props.debug
    assert(props.dir)
    this.dir = props.dir
    this.srcdir = (
      props.srcdir ? (
        isabspath(props.srcdir) ? props.srcdir :
        pjoin(this.dir, props.srcdir)
      ) :
      this.dir
    )
    this.name = props.name || basename(resolvePath(this.dir))
    this.ui = props.ui || null
    this.overwrite = !!props.overwrite

    this.apiVersion   = ""
    this.manifestFile = pjoin(this.dir, "manifest.json")
    this.tsconfigFile = pjoin(this.dir, "tsconfig.json")
    this.packageFile  = pjoin(this.dir, "package.json")
    this.figmaDtsFile = pjoin(this.dir, "figma.d.ts")
    this.pluginFile   = pjoin(this.srcdir, "plugin.ts")
    this.htmlFile     = pjoin(this.srcdir, "ui.html")
    this.uiFile       = pjoin(
      this.srcdir,
      this.ui == "react" ? "ui.tsx" : "ui.ts"
    )
  }


  async initPlugin() :Promise<bool> {
    if (!this.apiVersion) {
      this.apiVersion = await getLatestFigmaPluginAPIVersion()
    }
    let tasks :Promise<bool>[] = [
      this.writeManifest(),
      this.writePlugin(),
      this.writeTypeDefsFile(),
      this.writeTSConfig(),
    ]
    switch (this.ui) {
      case null:
        break
      case "html":
        tasks.push(this.writeHTML())
        break
      case "ts+html":
        tasks.push(this.writeHTML())
        tasks.push(this.writeUITS())
        break
      case "react":
        tasks.push(this.writeHTML())
        tasks.push(this.writeUITSX())
        tasks.push(this.writePackageJson())
        break
      default:
        throw new Error(`unexpected value for ui: ${repr(this.ui)}`)
    }
    return Promise.all(tasks).then(this.initStage2.bind(this))
  }


  async initStage2(results :bool[]) :Promise<bool> {
    if (!results.every(r => r)) {
      // some task failed
      return false
    }

    if (this.wrotePackage) {
      if (this.verbose) {
        print("npm install")
      }
      let args = this.debug ? ["install"] : ["install", "--silent"]
      let status = await proc.spawn("npm", args, {
        cwd: dirname(resolvePath(this.packageFile)),
        windowsHide: true,
        stdio: this.verbose ? "inherit" : "pipe",
      })
      if (status != 0) {
        return false
      }
    }

    return true
  }


  warnFileExist(file :string) :false {
    console.error(`${file} already exists`)
    return false
  }


  async writeTypeDefsFile() :Promise<bool> {
    let templateFile = pjoin(
      figplugDir,
      "lib",
      `figma-plugin-${this.apiVersion}.d.ts`
    )
    if (!this.overwrite && await exists(this.figmaDtsFile)) {
      // TODO: check for version mismatch
      console.error(`${this.figmaDtsFile} already exists`)
      return true
    }
    return copyfile(templateFile, this.figmaDtsFile).then(()=>true)
  }


  async writeTSConfig() :Promise<bool> {
    if (!this.overwrite && await exists(this.tsconfigFile)) {
      return this.warnFileExist(this.tsconfigFile)
    }
    let tsconfig = await getTsConfigTemplate()
    tsconfig.include = [
      relpath(this.dir, this.figmaDtsFile),
    ]
    if (this.ui == "react") {
      tsconfig.compilerOptions.jsx = "react"
    }
    let tsconfigJson = jsonfmt(tsconfig) + "\n"
    return writefile(this.tsconfigFile, tsconfigJson, "utf8").then(()=>true)
  }


  async writeHTML() :Promise<bool> {
    if (!this.overwrite && await exists(this.htmlFile)) {
      return this.warnFileExist(this.htmlFile)
    }
    let templateFile = pjoin(
      figplugDir,
      "lib",
      ( this.ui == "react" ? "template-ui-react.html" :
                             "template-ui.html"
      ),
    )
    return copyfile(templateFile, this.htmlFile).then(()=>true)
  }


  async writeUITS() :Promise<bool> {
    if (!this.overwrite && await exists(this.uiFile)) {
      return this.warnFileExist(this.uiFile)
    }
    let templateFile = pjoin(figplugDir, "lib", "template-ui.ts")
    return copyfile(templateFile, this.uiFile).then(()=>true)
  }


  async writeUITSX() :Promise<bool> {
    if (!this.overwrite && await exists(this.uiFile)) {
      return this.warnFileExist(this.uiFile)
    }
    let templateFile = pjoin(figplugDir, "lib", "template-ui-react.tsx")
    return copyfile(templateFile, this.uiFile).then(()=>true)
  }


  async writePackageJson() :Promise<bool> {
    if (!this.overwrite && await exists(this.packageFile)) {
      return this.warnFileExist(this.packageFile)
    }
    this.wrotePackage = true
    let templateFile = pjoin(figplugDir, "lib", "template-package-react.json")
    return copyfile(templateFile, this.packageFile).then(()=>true)
  }


  async writePlugin() :Promise<bool> {
    if (!this.overwrite && await exists(this.pluginFile)) {
      return this.warnFileExist(this.pluginFile)
    }
    let templateFile = pjoin(
      figplugDir,
      "lib",
      this.ui ? "template-plugin-ui.ts" :
                "template-plugin.ts"
    )
    return copyfile(templateFile, this.pluginFile).then(()=>true)
  }


  async writeManifest() :Promise<bool> {
    // manifest data
    let manifest :{[k:string]:any} = {
      version: this.apiVersion,
      name: this.name,
      script: relpath(this.dir, this.pluginFile),
    }
    if (this.ui == "html") {
      manifest.ui = relpath(this.dir, this.htmlFile)
    } else if (this.ui) {
      manifest.ui = relpath(this.dir, this.uiFile)
    }

    // existing manifest?
    let existingJs
    try { existingJs = await readfile(this.manifestFile, "utf8") } catch (_) {}
    if (existingJs) {
      if (!this.overwrite) {
        return this.warnFileExist(this.manifestFile)
      }
      let existingManifest = jsonparse(existingJs)
      manifest = Object.assign(existingManifest, manifest)
    }

    let json = jsonfmt(manifest) + "\n"
    return writefile(this.manifestFile, json, "utf8").then(() => true)
  }
}


let _tsConfigTemplate = null as string | null

async function getTsConfigTemplate() :Promise<{[k:string]:any}> {
  if (!_tsConfigTemplate) {
    let fn = pjoin(figplugDir, "lib", "template-tsconfig.json")
    _tsConfigTemplate = JSON.stringify(jsonparse(await readfile(fn, "utf8")))
  }
  return JSON.parse(_tsConfigTemplate) // copy
}


let _latestFigmaPluginAPIVersion = null as string | null

async function getLatestFigmaPluginAPIVersion() :Promise<string> {
  if (!_latestFigmaPluginAPIVersion) {
    let fn = pjoin(figplugDir, "lib", "figma-plugin-latest.d.ts")
    let src = await readfile(fn, "utf8")
    let m = src.match(/\s+readonly\s+version:\s*"([^"]+)",/m)
    if (m && m[1]) {
      _latestFigmaPluginAPIVersion = m[1].trim()
    } else {
      throw new Error(`failed to find version in ${fn}`)
    }
  }
  return _latestFigmaPluginAPIVersion
}
