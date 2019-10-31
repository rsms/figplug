import { dirname } from 'path'

export const figplugDir = dirname(__dirname)

export class BuildCtx {
  watch            = false
  debug            = false
  optimize         = false
  clean            = false
  nomin            = false
  verbose          = false
  verbose2         = false
  outdir           = ""     // empty means "infer from source"
  libs   :string[] = []     // filenames
  uilibs :string[] = []     // filenames
  noGenManifest    = false  // do not generate manifest.json
  version          = "0"    // value of the VERSION compile-time constant

  constructor(props? :Partial<BuildCtx>) {
    if (props) {
      for (let k in props) {
        (this as any)[k] = (props as any)[k]
      }
    }
  }
}
