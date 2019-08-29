type StyleFun = (s: string) => string

interface Style {
  readonly isAvailable   :bool

  readonly clear         :string

  readonly bold          :StyleFun
  readonly italic        :StyleFun
  readonly underline     :StyleFun
  readonly inverse       :StyleFun

  readonly white         :StyleFun
  readonly grey          :StyleFun
  readonly black         :StyleFun
  readonly blue          :StyleFun
  readonly cyan          :StyleFun
  readonly green         :StyleFun
  readonly magenta       :StyleFun
  readonly purple        :StyleFun
  readonly pink          :StyleFun
  readonly red           :StyleFun
  readonly yellow        :StyleFun
  readonly lightyellow   :StyleFun
  readonly orange        :StyleFun
}

let _cacheKey = Symbol("termstyle")


export function getTermStyle(ws :NodeJS.WriteStream) :Style {
  let cachedStyle = (ws as any)[_cacheKey] as Style|undefined
  if (cachedStyle) {
    return cachedStyle
  }

  const TERM = typeof process != 'undefined' && process.env.TERM || ''
  const termColorSupport :number = (
    TERM && ['xterm','screen','vt100'].some(s => TERM.indexOf(s) != -1) ? (
      TERM.indexOf('256color') != -1 ? 256 :
      16
    ) : 0
  )
  const sfn = (
    !ws.isTTY ?
    (_open :string, _ :string, _close :string) :StyleFun => {
      return (s :string) => s
    } :

    termColorSupport < 256 ?
    (open :string, _ :string, close :string) :StyleFun => {
      open = '\x1b[' + open + 'm'
      close = '\x1b[' + close + 'm'
      return (s :string) => open + s + close
    } :

    (_ :string, open :string, close :string) :StyleFun => {
      open = '\x1b[' + open + 'm'
      close = '\x1b[' + close + 'm'
      return (s :string) => open + s + close
    }
  )

  let style :Style = {
    isAvailable: termColorSupport > 0 && !!ws.isTTY,

    clear         : "\e[0m",

    bold          : sfn('1', '1', '22'),
    italic        : sfn('3', '3', '23'),
    underline     : sfn('4', '4', '24'),
    inverse       : sfn('7', '7', '27'),

    white         : sfn('37', '38;2;255;255;255', '39'),
    grey          : sfn('90', '38;5;244', '39'),
    black         : sfn('30', '38;5;16', '39'),
    blue          : sfn('34', '38;5;75', '39'),
    cyan          : sfn('36', '38;5;87', '39'),
    green         : sfn('32', '38;5;84', '39'),
    magenta       : sfn('35', '38;5;213', '39'),
    purple        : sfn('35', '38;5;141', '39'),
    pink          : sfn('35', '38;5;211', '39'),
    red           : sfn('31', '38;2;255;110;80', '39'),
    yellow        : sfn('33', '38;5;227', '39'),
    lightyellow   : sfn('93', '38;5;229', '39'),
    orange        : sfn('33', '38;5;215', '39'),
  }

  ;(ws as any)[_cacheKey] = style
  return style
}
