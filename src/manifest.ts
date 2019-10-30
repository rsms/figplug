import * as Path from 'path'
import { readfile, stat } from './fs'
import { jsonparse } from './util'
import { join as pjoin } from 'path'

export interface ManifestFigPlugProps {
  libs?     :string[]
  uilibs?   :string[]
  moduleId? :string
}

export interface ManifestProps {
  name     :string
  api      :string
  main     :string
  id?      :string
  ui?      :string
  menu?    :MenuEntry[]
  build?   :string
  figplug? :ManifestFigPlugProps
}

export type MenuEntry = MenuItem | MenuSeparator | Menu
export interface MenuItem {
  name    :string
  command :string
}
export interface MenuSeparator {
  separator :true
}
export interface Menu {
  name :string
  menu :MenuEntry[]
}

// type union of possible values of figma manifest
type ManifestValue = string | MenuEntry[]

/*
const standardProps = new Set([
  "version",
  "name",
  "script",
  "html",
  "menu",
  "build",
])

// props required by Figma.ManifestJson
const requiredProps = [
  "name",
  "version",
  "script",
]*/

// props of Figma.ManifestJson
const standardProps = new Set([
  "name",
  "api",
  "main",
  "id",
  "ui",
  "menu",
  "build",
])

// props required by Figma.ManifestJson
const requiredProps = [
  "name",
  "api",
  "main",
]

// TODO: consider preprocessing the TypeScript definitions to automatically
// generate the data above.


export class Manifest {
  readonly file: string
  readonly props: ManifestProps

  constructor(file :string, props: ManifestProps) {
    this.file = file
    this.props = props
  }

  // returns a map of properties in a predefined, well-known order.
  //
  propMap() :Map<string,ManifestValue> {
    let m = new Map<string,ManifestValue>()
    for (let name of standardProps) {
      if (this.props.hasOwnProperty(name)) {
        m.set(name, (this.props as any)[name])
      }
    }
    return m
  }

  // load a manifest file at path which can name a file or a directory.
  //
  static async load(path :string) :Promise<Manifest> {
    if (path.endsWith(".json") || path.endsWith(".js")) {
      return Manifest.loadFile(Path.resolve(path))
    } else if (path.endsWith(Path.sep)) { // e.g. foo/bar/
      return Manifest.loadDir(Path.resolve(path))
    }
    path = Path.resolve(path)
    if ((await stat(path)).isDirectory()) {
      return Manifest.loadDir(path)
    }
    return Manifest.loadFile(path)
  }

  // loadDir loads some manifest file in a directory
  //
  static loadDir(dir :string) :Promise<Manifest> {
    return Manifest.loadFile(pjoin(dir, "manifest.json")).catch(e => {
      if (e.code == 'ENOENT') {
        return Manifest.loadFile(pjoin(dir, "manifest.js"))
      }
      throw e
    })
  }

  // loadFile loads a manifest file
  //
  static async loadFile(file :string) :Promise<Manifest> {
    let props = jsonparse(await readfile(file, 'utf8'), file) as ManifestProps

    // verify that required properties are present
    for (let prop of requiredProps) {
      if ((props as any)[prop] === undefined) {
        throw new Error(`missing ${repr(prop)} property in ${file}`)
      }
    }

    return new Manifest(file, props)
  }
}


// const internalManifestProps = new Set([
//   'manifestFile',
// ])

// // manifestToFigmaManifest returns a Figma.ManifestJson without
// // figplug properties.
// //
// export function manifestToFigmaManifest(m :Manifest) :Figma.ManifestJson {
//   let fm :{[k:string]:any} = {}
//   for (let k of Object.keys(m)) {
//     if (!internalManifestProps.has(k)) {
//       fm[k] = (m as any)[k]
//     }
//   }
//   return fm as Figma.ManifestJson
// }
