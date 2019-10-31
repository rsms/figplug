import * as fs from 'fs'
import { promisify } from 'util'
import { dirname, resolve as resolvePath } from 'path'
import { URL } from 'url'
import { parseVersion } from './util'

export const stat = promisify(fs.stat)
export const mkdir = promisify(fs.mkdir)

const node_v10_12_0 = parseVersion("10.12.0")
const node_version  = parseVersion(process.version.substr(1))

export const mkdirs :(path :string)=>Promise<void> = (

  node_version >= node_v10_12_0 ? // node 10.12.0 adds "recursive" option
  (path :string) :Promise<void> => mkdir(path, {recursive:true}) :

  // legacy nodejs
  (path :string) :Promise<void> => {
    async function _mkdir(p :string) :Promise<void> {
      try {
        await mkdir(p)
      } catch (err) {
        if (err.code == 'ENOENT') {
          let p2 = dirname(p)
          if (p2 == p) { throw err }
          return await _mkdir(p2).then(() => _mkdir(p))
        } if (err.code == 'EEXIST') {
          try {
            if ((await stat(p)).isDirectory()) {
              return // okay, exists and is directory
            }
          } catch (_) {}
        }
        throw err
      }
    }
    return _mkdir(resolvePath(path))
  }
)

export const readdir = promisify(fs.readdir)

export const readfile = promisify(fs.readFile)

export async function exists(path :fs.PathLike) :Promise<bool> {
  try {
    await stat(path)
    return true
  } catch(_) {}
  return false
}

export async function isFile(path :fs.PathLike) :Promise<bool> {
  try {
    let st = await stat(path)
    return st.isFile()
  } catch(_) {}
  return false
}

export async function isDir(path :fs.PathLike) :Promise<bool> {
  try {
    let st = await stat(path)
    return st.isDirectory()
  } catch(_) {}
  return false
}

export function strpath(path :fs.PathLike) :string {
  if (path instanceof URL) {
    if (path.protocol.toLowerCase() != 'file') {
      throw new Error("not a file URL")
    }
    if (path.hostname != "" && path.hostname != 'localhost') {
      throw new Error("file URL with remote host")
    }
    return path.pathname
  }
  return (
    typeof path == "string" ? path :
    path instanceof Buffer ? path.toString("utf8") :
    String(path)
  )
}

const _writefile = promisify(fs.writeFile)

export function writefile(
  path :fs.PathLike | number,
  data :any,
  options :fs.WriteFileOptions,
) :Promise<void> {
  return _writefile(path, data, options).catch(async (err) => {
    if (err.code != 'ENOENT' || typeof path == "number") {
      throw err
    }
    // directory not found -- create directories and retry
    await mkdirs(dirname(strpath(path)))
    await _writefile(path, data, options)
  })
}


const _copyfile = promisify(fs.copyFile)

export function copyfile(src :fs.PathLike, dst :fs.PathLike, flags?: number) :Promise<void> {
  return _copyfile(src, dst, flags).catch(async (err) => {
    if (err.code != 'ENOENT') {
      throw err
    }
    // directory not found -- create directories and retry
    await mkdirs(dirname(strpath(dst)))
    await _copyfile(src, dst, flags)
  })
}
