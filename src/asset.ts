import * as Svgo from 'svgo'
import * as Path from 'path'
import * as rollup from 'rollup'
import { gifInfoBuf } from './gif'
import { jpegInfoBuf } from './jpeg'
import * as typescript from 'typescript'
import { readfile } from './fs'
import { dirname, basename } from 'path'

let _svgoInstance :Svgo|null = null

function getSvgo() :Svgo {
  return _svgoInstance || (_svgoInstance = new Svgo({
    full: true,
    plugins: [
      { cleanupAttrs: true },
      { removeDoctype: true },
      { removeXMLProcInst: true },
      { removeComments: true },
      { removeMetadata: true },
      { removeTitle: true },
      { removeDesc: true },
      { removeUselessDefs: true },
      { removeEditorsNSData: true },
      { removeEmptyAttrs: true },
      { removeHiddenElems: true },
      { removeEmptyText: true },
      { removeEmptyContainers: true },
      { removeViewBox: false },
      { cleanupEnableBackground: true },
      { convertStyleToAttrs: true },
      { convertColors: true },
      { convertPathData: true },
      { convertTransform: true },
      { removeUnknownsAndDefaults: true },
      { removeNonInheritableGroupAttrs: true },
      { removeUselessStrokeAndFill: true },
      { removeUnusedNS: true },
      { cleanupIDs: true },
      { cleanupNumericValues: true },
      { moveElemsAttrsToGroup: true },
      { moveGroupAttrsToElems: true },
      { collapseGroups: true },
      { removeRasterImages: false },
      { mergePaths: true },
      { convertShapeToPath: true },
      { sortAttrs: true },
      //{ removeDimensions: true },
    ],
  }))
}


export class AssetInfo {
  // one of these are set, depending on encoding
  b64data   :string = ""
  textData  :string = ""

  urlPrefix :string = ""
  mimeType  :string = ""

  // file-type dependent attributes, like width and height for images
  attrs :{[key:string]:any} = {}

  // cache
  _url :string = ""

  get url() :string {
    if (!this._url) {
      this._url = this.urlPrefix + this.b64data
    }
    return this._url
  }

  getTextData() :string {
    return this.textData || this.getData().toString("utf8")
  }

  getData() :Buffer {
    return this.textData ? Buffer.from(this.textData, "utf8")
                         : Buffer.from(this.b64data, "base64")
  }
}


export class AssetBundler {
  mimeTypes = new Map([
    ['.jpg',  'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png',  'image/png'],
    ['.gif',  'image/gif'],
    ['.svg',  'image/svg+xml'],
    ['.dat',  'application/octet-stream'],
  ])

  assetCache = new Map() // .d.ts path => {meta, mimeType, file}

  // the following properties are updated on each compilation, even in
  // watch mode.
  tsService :typescript.LanguageService|null = null
  tsCompilerOptions = {} as typescript.CompilerOptions

  _typescriptProxy :typeof typescript|null = null
  _rollupPlugin :rollup.Plugin|null = null


  mimeTypeIsText(mimeType :string) :bool {
    // TODO: expand this when we expand this.mimeTypes
    return mimeType == "image/svg+xml"
  }

  mimeTypeIsJSXCompatible(mimeType :string) :bool {
    return mimeType == "image/svg+xml"
  }

  mimeTypeIsImage(mimeType :string) :bool {
    return mimeType.startsWith("image/")
  }


  extractPathQueryString(path :string) :[string,string] { // [path, query]
    let qi = path.lastIndexOf("?")
    if (qi != -1) {
      let si = path.lastIndexOf("/")
      if (si < qi) {
        return [ path.substr(0, qi), path.substr(qi + 1) ]
      }
    }
    return [ path, "" ]
  }

  // Wrap typescript to allow virtualized .d.ts asset files
  //
  getTypescriptProxy() :typeof typescript {
    const a = this
    return this._typescriptProxy || (this._typescriptProxy = {
      __proto__: typescript,

      sys: {
        __proto__: typescript.sys,

        fileExists(path :string) :bool {
          if (a.assetCache.has(path) || typescript.sys.fileExists(path)) {
            return true
          }
          if (path.endsWith(".d.ts")) {
            let srcpath = path.substr(0, path.length - 5) // strip ".d.ts"
            let [file, meta] = a.extractPathQueryString(srcpath)
            let ext = Path.extname(file).toLowerCase()
            let mimeType = a.mimeTypes.get(ext)
            if (mimeType && typescript.sys.fileExists(file)) {
              a.assetCache.set(path, { meta, mimeType, file })
              return true
            }
          }
          return false
        },

        readFile(path :string, encoding? :string) :string | undefined {
          let ent = a.assetCache.get(path)
          if (ent !== undefined) {
            let { meta, mimeType, file } = ent
            if (meta == "jsx") {
              if (a.mimeTypeIsJSXCompatible(mimeType)) {
                return (
                  "import React from 'react';\n" +
                  "const s :React.StatelessComponent<" +
                    "React.SVGAttributes<SVGElement>>;\n" +
                  "export default s;\n"
                )
              } else {
                console.error(`${file}: not valid JSX`)
              }
            }
            if (a.mimeTypeIsImage(mimeType)) {
              return "const a :{url:string,width:number,height:number};\nexport default a;\n"
            }
            return "const a :{url:string};\nexport default a;\n"
          }
          return typescript.sys.readFile(path, encoding)
        },
      },

      // createLanguageService(
      //   host: LanguageServiceHost,
      //   documentRegistry?: DocumentRegistry,
      //   syntaxOnly?: boolean
      // ): LanguageService
      createLanguageService(
        host :typescript.LanguageServiceHost,
        documentRegistry? :typescript.DocumentRegistry,
        syntaxOnly? :bool
      ) :typescript.LanguageService {

        // provide trace function in case tracing is enabled
        this.tsCompilerOptions = host.getCompilationSettings()
        if (this.tsCompilerOptions.traceResolution) {
          host.trace = msg => print(">>", msg)
        }

        const ts = this

        // Patch the TS rollup plugin to work around
        // https://github.com/ezolenko/rollup-plugin-typescript2/issues/154
        // getScriptSnapshot(fileName: string):
        //   tsTypes.IScriptSnapshot | undefined
        host.getScriptSnapshot = function(fileName) {
          fileName = fileName.replace(/\\+/g, "/")
          let snapshot = (host as any).snapshots[fileName]
          if (!snapshot) {
            snapshot = ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName))
            ;(host as any).snapshots[fileName] = snapshot
            ;(host as any).versions[fileName] =
              ((host as any).versions[fileName] || 0) + 1
          }
          return snapshot
        }

        let s = typescript.createLanguageService(
          host,
          documentRegistry,
          syntaxOnly
        )

        a.tsService = s

        return s
      },
    } as any as typeof typescript)
  } // getTypescriptProxy


  getRollupPlugin() {
    const a = this
    return this._rollupPlugin || (this._rollupPlugin = {
      name: 'asset',

      buildEnd(err?: Error) :Promise<void>|void {
        a.assetCache.clear()
      },

      resolveId(id: string, parentId: string | undefined) :rollup.ResolveIdResult {
        if (id.indexOf("?") != -1) {
          let [file, meta] = a.extractPathQueryString(id)
          if (meta && a.mimeTypes.has(Path.extname(file).toLowerCase())) {
            return (
              parentId ? Path.resolve(dirname(parentId), id) :
              Path.resolve(id)
            )
          }
        }
        return undefined
      },

      load(id :string) :Promise<string|null> {
        let ext = Path.extname(id)
        if (ext == ".json") {
          return readfile(id, "utf8").then(json =>
            `export default ${JSON.stringify(JSON.parse(json))}`
          )
        }

        let [id2, mimeType, meta] = a.parseFilename(id)
        id = id2
        if (!mimeType) {
          return Promise.resolve(null)
        }

        this.addWatchFile(id)

        let jsid = basename(id)
        jsid = jsid.substr(0, jsid.length - ext.length)
          .replace(/[^A-Za-z0-9_]+/g, "_")

        // print("LOAD", id, {meta})

        if (meta == "jsx") {
          // generate JSX virtual dom instead of data url
          return a.readAsJSXModule(id, jsid)
        }

        return a.loadAssetInfo(id, mimeType).then(obj =>
          `const asset_${jsid} = ${JSON.stringify(obj)};\n` +
          `export default asset_${jsid};`
        )
      }
    })
  } // getRollupPlugin


  // parseFilename returns [filename, mimeType?, queryString]
  parseFilename(filename :string) :[string, string|undefined, string] {
    const a = this
    let [fn, queryString] = a.extractPathQueryString(filename)
    let ext = Path.extname(fn)
    let mimeType = a.mimeTypes.get(ext.toLowerCase())
    return [fn, mimeType, queryString]
  }


  // readAsJSX reads a resource which contents is valid JSX, like an SVG,
  // and parses it as JSX, returning ESNext JavaScript module code.
  async readAsJSXModule(path :string, jsid :string) :Promise<string> {
    let svg = await readfile(path, "utf8")
    let jsxSource = (
      `import React from "react";\n` +
      `const asset_${jsid} = ${svg};\n` +
      `export default asset_${jsid};\n`
    )
    // transpile(
    //   input: string,
    //   compilerOptions?: CompilerOptions,
    //   fileName?: string,
    //   diagnostics?: Diagnostic[],
    //   moduleName?: string
    // ): string;
    let compilerOptions = {
      jsx: this.tsCompilerOptions.jsx || typescript.JsxEmit.React,
      module: typescript.ModuleKind.ESNext, // "esnext"
      target: typescript.ScriptTarget.ESNext, // "esnext"
    } as typescript.CompilerOptions
    return typescript.transpile(jsxSource, compilerOptions, path+".jsx")
  }


  async loadAssetInfo(path :string, mimeType? :string) :Promise<AssetInfo> {
    let obj = new AssetInfo()

    if (mimeType) {
      obj.mimeType = mimeType

      if (mimeType == "image/gif") {
        let data = await readfile(path, "base64")
        let head = Buffer.from(data.substr(0,16), "base64")
        try {
          obj.attrs = gifInfoBuf(head)
        } catch(err) {
          console.error(`${path}: not a GIF image (${err})`)
          obj.attrs.width = 0
          obj.attrs.height = 0
        }
        obj.urlPrefix = `data:${mimeType};base64,`
        obj.b64data = data

      } else if (mimeType == "image/jpeg") {
        let data = await readfile(path)
        try {
          obj.attrs = jpegInfoBuf(data)
        } catch(err) {
          console.error(`${path}: not a JPEG image (${err})`)
          obj.attrs.width = 0
          obj.attrs.height = 0
        }
        obj.urlPrefix = `data:${mimeType};base64,`
        obj.b64data = data.toString("base64")

      } else if (this.mimeTypeIsText(mimeType)) {
        // for text types, attempt text encoding
        let data = await readfile(path, "utf8")

        if (mimeType == "image/svg+xml") {
          let res = await getSvgo().optimize(data, {path})
          if (res.data.match(/^[^\r\n\t]+$/)) {
            obj.attrs = res.info as {[k:string]:any}
            if (obj.attrs.width) {
              obj.attrs.width = parseInt(obj.attrs.width)
              if (isNaN(obj.attrs.width)) {
                obj.attrs.width = 0
              }
            } else {
              obj.attrs.width = 0
            }
            if (obj.attrs.height) {
              obj.attrs.height = parseInt(obj.attrs.height)
              if (isNaN(obj.attrs.height)) {
                obj.attrs.height = 0
              }
            } else {
              obj.attrs.height = 0
            }
            obj.urlPrefix = `data:${mimeType};utf8,`
            obj.textData = res.data
          }
        }
      }
    }

    if (!obj.urlPrefix) {
      // fallback to base-64 encoding the data
      let data = await readfile(path, "base64")
      obj.urlPrefix = `data:${mimeType};base64,`
      obj.b64data = data
    }

    return obj
  }

}
