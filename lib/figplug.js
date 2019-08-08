var global = (
  typeof global != 'undefined' ? global :
  typeof window != 'undefined' ? window :
  this
)

function _stackTrace(cons) {
  const x = {stack:''}
  if (Error.captureStackTrace) {
    Error.captureStackTrace(x, cons)
    const p = x.stack.indexOf('\n')
    if (p != -1) {
      return x.stack.substr(p+1)
    }
  }
  return x.stack
}

// _parseStackFrame(sf :string) : StackFrameInfo | null
// interface StackFrameInfo {
//   func :string
//   file :string
//   line :int
//   col  :int
// }
//
function _parseStackFrame(sf) {
  let m = /^\s*at\s+([^\s]+)\s+\((?:.+\/(src\/[^\:]+)|([^\:]+))\:(\d+)\:(\d+)\)$/.exec(sf)
  if (m) {
    return {
      func: m[1],
      file: m[2] || m[3],
      line: parseInt(m[4]),
      col:  parseInt(m[5]),
    }
  }
  return null
}

function panic(msg) {
  console.error.apply(console,
    ['panic:', msg].concat(Array.prototype.slice.call(arguments, 1))
  )
  if (typeof process != 'undefined') {
    console.error(_stackTrace(panic))
    process.exit(2)
  } else {
    let e = new Error(msg)
    e.name = 'Panic'
    throw e
  }
}

const print = console.log.bind(console)

const dlog = DEBUG ? console.log.bind(console, '[debug]') : ()=>{}

function assert() {
  if (DEBUG) { // for DCE
    var cond = arguments[0]
      , msg = arguments[1]
      , cons = arguments[2] || assert
    if (!cond) {
      if (!assert.throws && typeof process != 'undefined') {
        var stack = _stackTrace(cons)
        console.error('assertion failure:', msg || cond)
        var sf = _parseStackFrame(stack.substr(0, stack.indexOf('\n') >>> 0))
        if (sf) {
          try {
            const fs = require('fs')
            const lines = fs.readFileSync(sf.file, 'utf8').split(/\n/)
            const line_before = lines[sf.line - 2]
            const line        = lines[sf.line - 1]
            const line_after  = lines[sf.line]
            let context = [' > ' + line]
            if (typeof line_before == 'string') {
              context.unshift('   ' + line_before)
            }
            if (typeof line_after == 'string') {
              context.push('   ' + line_after)
            }
            console.error(sf.file + ':' + sf.line + ':' + sf.col)
            console.error(context.join('\n') + '\n\nStack trace:')
          } catch (_) {}
        }
        console.error(stack)
        exit(3)
      } else {
        var e = new Error('assertion failure: ' + (msg || cond))
        e.name = 'AssertionError'
        e.stack = _stackTrace(cons)
        throw e
      }
    }
  }
}

function repr(obj) {
  // TODO: something better
  try {
    return JSON.stringify(obj, null, 2)
  } catch (_) {
    return String(obj)
  }
}
