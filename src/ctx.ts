import { dirname } from 'path'

export const figplugDir = dirname(__dirname)

export class BuildCtx {
  watch             = false
  debug             = false
  optimize          = false
  clean             = false
  nomin             = false
  verbose           = false
  verbose2          = false
  outdir            = ""     // empty means "infer from source"
  libs   :string[]  = []     // filenames
  uilibs :string[]  = []     // filenames
  noGenManifest     = false  // do not generate manifest.json
  externalSourceMap = false  // store source map in file instead of inline data url
  noSourceMap       = false  // disable source map generation
  version = "0"

  constructor(props? :Partial<BuildCtx>) {
    if (props) {
      for (let k in props) {
        (this as any)[k] = (props as any)[k]
      }
    }
  }
}
