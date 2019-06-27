import * as fs from 'fs'
import { promisify } from 'util'
import { dirname } from 'path'
import { URL } from 'url'

export const stat = promisify(fs.stat)
export const mkdir = promisify(fs.mkdir)

export function mkdirs(path :fs.PathLike) :Promise<void> {
  return mkdir(path, {recursive:true})
}

export const readfile = promisify(fs.readFile)

export async function exists(path :fs.PathLike) :Promise<bool> {
  try {
    await stat(path)
    return true
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
