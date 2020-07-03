import { basename } from 'path'


// prog is the name of the program
// export const prog :string = process.argv[1]
export const prog = process.env["_"] || basename(process.argv[1])


// die prints message to stderr and exits with status 1
export function die(message :any, ...msg :any[]) {
  if (message instanceof Error) {
    message = message.stack || message.message || String(message)
  }
  console.error(
    `${prog}: ${message}` +
    (msg && msg.length > 0 ? msg.join(' ') : "")
  )
  process.exit(1)
}

// parseopt types
export type Options = { [k :string] :any }
export type FlagSpec = string | [ string|string[] , string?, string? ]
export type Usage = string
                  | (()=>string)
                  | null
                  | undefined

// parseopt parses command-line arguments.
// Returns options and unparsed remaining arguments.
//
// flag format:
//
//   flag      = flagname | flagspec
//   flagname  = "-"* <text>
//   flagnames = Array< flagname+ >
//   flagspec  = Tuple< flagnames | flagname >
//
// flag format examples:
//
//   "verbose"
//   Simple boolean flag that can be set with -verbose or --verbose.
//
//   [ "v", "Show version" ]
//   Boolean flag "v" with description text shown in program usage.
//
//   [ ["v", "version"], "Show version" ]
//   Boolean flag "v" with alternate name "version" with description.
//
//   [ ["v", "version"] ]
//   Boolean flag "v" with alternate name "version" without description.
//
//   [ "o", "Output file", "<path>" ]
//   Value flag with description. Value type defaults to string.
//   Can be invoked as -o=path, --o=path, -o path, and --o path.
//
//   [ "o", "", "<path>" ]
//   Value flag without description.
//
//   [ "limit", "Show no more than <limit> items", "<limit>:number" ]
//   Value flag with type constraint. Passing a value that is not a JS number
//   causes an error message.
//
//   [ "with-openssl", "", "enable:bool" ]
//   Boolean flag
//
export function parseopt(argv :string[], usage :Usage, ...flags :FlagSpec[]) :[Options, string[]] {
  let [flagmap, opts] = parseFlagSpecs(flags)

  let options :Options = {}

  let i = 0
  for (; i < argv.length; i++) {
    // read argument
    let arg = argv[i]
    if (arg == '--') {
      i++
      break
    }
    if (arg[0] != '-') {
      break
    }
    arg = arg.replace(/^\-+/, '')
    let eqp = arg.indexOf('=')
    let argval :string|undefined = undefined
    if (eqp != -1) {
      // e.g. -name=value
      argval = arg.substr(eqp + 1)
      arg = arg.substr(0, eqp)
    }

    // lookup flag
    let opt = flagmap.get(arg)
    if (!opt) {
      if (arg == "h" || arg == "help") {
        printUsage(opts, usage)
        process.exit(0)
      } else {
        console.error(`unknown option -${arg} (see ${prog} -help)`)
        process.exit(1)
      }
    }

    // save option
    if (opt.valueName) {
      if (argval === undefined) {
        // -k v
        argval = argv[i + 1]
        if (argval !== undefined && argval[0] != "-") {
          i++
        // } else if (opt.valueType == "boolean") {
        //   argval = "true"
        } else {
          console.error(`missing value for option -${arg} (see ${prog} -help)`)
          process.exit(1)
        }
      } // else -k=v
      try {
        let value = opt.valueParser ? opt.valueParser(argval) : argval
        if (opt.multi) {
          if (arg in options) {
            options[arg].push(value)
          } else {
            options[arg] = [value]
          }
        } else {
          options[arg] = value
        }
      } catch (err) {
        console.error(`invalid value for option -${arg} (${err.message})`)
      }
    } else if (argval !== undefined) {
      console.error(`unexpected value provided for flag -${arg}`)
      process.exit(1)
    } else {
      // e.g. -k
      options[arg] = true
    }
  }

  return [options, argv.slice(i)]
}


interface Opt {
  flags        :string[]
  description? :string
  valueName?   :string
  valueType?   :string
  multi?       :bool  // true for list types e.g. "foo:string[]"
  valueParser? :(v:string)=>any
}


function parseFlagSpecs(flagspecs :FlagSpec[]) :[Map<string,Opt>,Opt[]] {
  let flagmap = new Map<string,Opt>()
  let opts :Opt[] = []
  for (let spec of flagspecs) {
    let opt = flagspecToOpt(spec)
    opts.push(opt)
    for (let k of opt.flags) {
      flagmap.set(k, opt)
    }
  }
  return [flagmap, opts]
}


function flagspecToOpt(f :FlagSpec) :Opt {
  const cleanFlag = (s :string) => s.replace(/^\-+/, '')
  if (typeof f == "string") {
    return { flags: [ cleanFlag(f) ] }
  }
  let o :Opt = {
    flags: (
      typeof f[0] == "string" ? [ cleanFlag(f[0]) ] :
      f[0].map(cleanFlag)
    ),
    description: f[1] || undefined
  }
  if (f[2]) {
    let [name, type] = f[2].split(/:/, 2)
    if (type) {
      o.multi = type.endsWith("[]")
      if (o.multi) {
        type = type.substr(0, type.length-2)
      }
      switch (type.toLowerCase()) {

        case 'string':
        case 'str':
        case '':
          type = 'string'
          break

        case 'bool':
        case 'boolean':
          type = 'boolean'
          o.valueParser = s => {
            s = s.toLowerCase()
            return s != "false" && s != "0" && s != "no" && s != "off"
          }
          break

        case 'number':
        case 'num':
        case 'float':
        case 'int':
          type = 'number'
          o.valueParser = s => {
            let n = Number(s)
            if (isNaN(n)) {
              throw new Error(`${repr(s)} is not a number`)
            }
            return n
          }
          break

        default:
          throw new Error(`invalid argument type "${type}"`)
      }
    } else {
      type = "string"
    }
    o.valueName = name || type
    o.valueType = type
  }
  return o
}


function printUsage(opts :Opt[], usage? :Usage) {
  let vars :{[k:string]:any} = {
    prog: prog,
  }
  let s = (
    usage ? typeof usage == 'function' ? usage() : usage :
    opts && opts.length > 0 ? `Usage: $prog [options]` : `Usage: $prog`
  )
  s = s.replace(/\$(\w+)/g, (m, v) => {
    let sub = vars[v]
    if (!sub) {
      throw new Error(`unknown variable $${v}`)
    }
    return sub
  })
  if (opts.length > 0) {
    s += '\noptions:\n'
    let longestFlagName = 0
    let flagNames :string[] = []
    for (let f of opts) {

      let flagName = "  -" + (
        f.valueName ? f.flags.map(s => (
          f.valueType == "boolean" ?
            s + '=on|off' :
            s + '=' + f.valueName + ''
        )) : f.flags
      ).join(', -')

      if (flagName.length > 20) {
        flagName = flagName.replace(/, -/g, ',\n    -')
        for (let line of flagName.split(/\n/)) {
          longestFlagName = Math.max(longestFlagName, line.length)
        }
      } else {
        longestFlagName = Math.max(longestFlagName, flagName.length)
      }
      flagNames.push(flagName)
    }
    const spaces = '                                     '
    for (let i = 0; i < opts.length; i++) {
      let f = opts[i]
      let names = flagNames[i]
      // "length" of name is length of last line (catches multi-line names)
      let namelen = (v => v[v.length-1].length)(names.split("\n"))
      let padding = spaces.substr(0, longestFlagName - namelen)
      if (f.description) {
        s += `${names}${padding}  ${f.description}\n`
      } else {
        s += `${names}\n`
      }
    }
  }
  console.error(s)
}

