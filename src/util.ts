import * as vm from 'vm'
import { relative as relpath } from 'path'

declare const btoa :undefined|((s:string)=>string)

// base64enc returns the Base64 encoding of a JS string
export const base64enc :(s :string)=>string = (
  typeof btoa == 'function' ? btoa : s => {
    return Buffer.from(s, "utf8").toString("base64")
  }
)

// jsonparse parses "relaxed" JSON which can be in JavaScript format
export function jsonparse(jsonText :string, filename? :string) {
  return vm.runInNewContext(
    '(()=>(' + jsonText + '))()',
    { /* sandbox */ },
    { filename, displayErrors: true }
  )
}

// jsonfmt formats a value into JSON with compact pretty-printing
export function jsonfmt(value :any) :string {
  if (value instanceof Map) {
    let json = "{ "
    const trailer = ",\n  "
    for (let [k, v] of value as Map<any,any>) {
      json += JSON.stringify(k) + ": " + jsonfmt(v) + trailer
    }
    return (
      json == "{ " ? "{}" :
      json.substr(0, json.length-trailer.length) + "\n}"
    )
  }
  return JSON.stringify(value, null, 2)
}

// mapToObject creates a JS key-value object from a Map object
export function mapToObject<V>(map :Map<any,V>) :{[k:string]:V} {
  let o :{[k:string]:V} = {}
  for (let [k,v] of map) { o[String(k)] = v }
  return o
}

// export function sortedMap<T,K>(obj :{[k:string]:T}) :Map<K,T>
export function sortedMap<T extends object>(obj :T) :Map<string,any> {
  let keys = Object.keys(obj)
  keys.sort()
  return new Map<string,any>(keys.map(k => [ k, (obj as any)[k] ] ))
}


// unique returns collection v without duplicate values
// while maintaining order.
//
export function unique<T>(v :Iterable<T>) :T[] {
  return Array.from(new Set(v))
}

// rpath returns path relative to the current working directory,
// or "." if path==cwd.
//
export function rpath(path :string) :string {
  return relpath(".", path) || "."
}

// inlineSourceMap takes a json string of a source map and returns a
// sourceMappingURL JS comment with the source map as a data url.
//
export function inlineSourceMap(json :string) :string {
  return '//#sourceMappingURL=data:application\/json;base64,' +
         base64enc(json) + "\n"
}


// // utf8ByteSize returns the number of bytes needed to represent
// // codepoint cp as UTF-8
// //
// export function utf8ByteSize(cp :int) :int {
//   return (
//     (cp < 0x80) ? 1 :
//     (cp < 0x800) ? 2 :
//     (cp < 0x10000) ? 3 :
//     4
//   )
// }


// strUTF8Size returns the number of bytes required to store s as UTF-8
//
export function strUTF8Size(s :string) :int {
  return Buffer.from(s, 'utf8').length
  // let len = 0, i = 0
  // for (; i < s.length; i++) {
  //   if (s.charCodeAt(i) > 0xff) {
  //     len++
  //   }
  // }
  // return len + i
}


// fmtByteSize returns human-readable text of size, which is assumed to
// be number of bytes.
//
export function fmtByteSize(size :number) :string {
  const round = (n :number) :number => Math.ceil(n*10)/10
  if (size <= 1000) { return size + " B" }
  if (size < 1000*1024) { return round(size/1024) + " kB" }
  if (size < 1000*1024*1024) { return round(size/(1024*1024)) + " MB" }
  return round(size/(1024*1024*1024)) + " GB"
}

// fmtDuration returns human-readable text of a duration of time.
//
export function fmtDuration(milliseconds :number) :string {
  const round = (n :number) :number => Math.ceil(n*10)/10
  if (milliseconds < 1000) { return milliseconds + "ms" }
  if (milliseconds < 1000*60) { return round(milliseconds/1000) + "s" }
  if (milliseconds < 1000*60*60) { return round(milliseconds/1000*60) + "min" }
  return round(milliseconds/1000*60*60) + "hr"
}
