#!/usr/bin/env TSC_NONPOLLING_WATCHER=1 node

// Usage: build.js [options] <manifest-file> ...
// Builds Figma plugins given manifest files as the input.
//
// options:
//  -w         Watch sources for changes and rebuild incrementally
//  -clean     Force rebuilding of everything, ignoring cache. Implied with -O.
//  -g         Generate debug code (assertions and DEBUG branches).
//  -O         Generate optimized code.
//  -nomin     Do not minify or mangle optimized code when -O is enabled.
//  -h, -help  Print this help message and exit.
//
const fs = require('fs')
const assert = require('assert')
const postcss = require('postcss-preset-env')
const pb = require('./misc/pkgbuild')
const { pkg, Product, Lib, print, writefile, readfile, relpath } = pb
const { dirname, extname, parse: pparse, join: pjoin } = require('path')
const vm = require('vm')

let opt
let pluginLibs = [], uiLibs = []


// base64enc returns the Base64 encoding of a JS string
const base64enc = typeof btoa == 'function' ? btoa : s => {
  return Buffer.from(s, "utf8").toString("base64")
}

// jsonparse parses "relaxed" JSON which can be in JavaScript format
function jsonparse(jsonText, filename) {
  return vm.runInNewContext(
    '(()=>(' + jsonText + '))()',
    { /* sandbox */ },
    { filename, displayErrors: true }
  )
}

// jsonfmt formats a value into JSON with compact pretty-printing
function jsonfmt(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\{\n\s+"/gm, '{ "')
    .replace(/\n\s+\}/gm, ' }')
}

// mapToObject creates a JS key-value object from a Map object
function mapToObject(map) {
  let o = {}
  for (let [k,v] of map) { o[k] = v }
  return o
}


// findHTMLHeadIndex finds the best insertion point in string html for
// adding content that should optimally be placed inside <head>.
//
function findHTMLHeadIndex(html) {
  // try |</head>
  let m = /\s*<\/head[^\>]*>/igm.exec(html)
  if (m) {
    return m.index
  }

  // try |<body>
  m = /\s*<body[^\>]*>/igm.exec(html)
  if (m) {
    return m.index
  }

  // try <html>|
  m = /(<html[^\>]*>[ \t]*[\r\n]?)/igm.exec(html)
  if (m) {
    return m.index + m[1].length
  }

  // try <!doctype>|
  m = /(<\!doctype[^\>]*>[ \t]*[\r\n]?)/igm.exec(html)
  if (m) {
    return m.index + m[1].length
  }

  // fall back to 0
  return 0
}


function findHTMLTailIndex(html) {
  // try |</body>
  let m = /<\/body[^\>]*>/igm.exec(html)
  if (m) {
    return m.index
  }

  // try |</html>
  m = /(<\/html[^\>]*>)/igm.exec(html)
  if (m) {
    return m.index
  }

  // fall back to length
  return html.length
}


async function makePluginHTML(p) {
  let htmlSrcFile = p.srcfileHtml
  let cssSrcFile  = p.srcfileCss
  let htmlOutFile = p.outfileHtml

  let [html, css] = await Promise.all([
    readfile(htmlSrcFile, 'utf8'),
    readfile(cssSrcFile, 'utf8').catch(err => {
      if (err.code != 'ENOENT') { throw err }
      return ''
    }),
  ])

  let js = p.output.js

  // inline sourcemap for debug builds
  if (p.debug) {
    js = js.replace(
      /(\/\/#\s*sourceMappingURL\s*=\s*)[^\r\n]+/g,
      '$1data:application\/json;base64,' + base64enc(p.output.map)
    )
  }

  // build HTML head and tail
  let head = ''
  let tail = '<script>\n' + js + '\n</script>'
  if (css.length) {
    css = await postcss.process(css, {
      from: cssSrcFile,
    }, {
      features: {
        'nesting-rules': true
      }
    })
    head = '<style>\n' + css + '\n</style>'
  }

  let htmlOut = ''

  // find best offset in html text to insert HTML head content
  let tailInsertPos = findHTMLTailIndex(html)
  if (head.length) {
    let headInsertPos = findHTMLHeadIndex(html)
    htmlOut = (
      html.substr(0, headInsertPos) +
      head +
      html.substring(headInsertPos, tailInsertPos) +
      tail +
      html.substr(tailInsertPos)
    )
  } else {
    htmlOut = (
      html.substr(0, tailInsertPos) +
      tail +
      html.substr(tailInsertPos)
    )
  }

  print(`write ${relpath(".", htmlOutFile)}`)
  await writefile(htmlOutFile, htmlOut, 'utf8')
}


async function generateManifestFile(p, manifest) {
  let entries = new Map(
    Object.keys(manifest).sort().map(k => [k, manifest[k]])
  )

  // override source file names
  entries.set('script', 'plugin.js')
  if (p.pluginUI) {
    entries.set('html', 'ui.html')
  }

  // generate JSON
  let json = jsonfmt(mapToObject(entries))

  // write file
  let file = pjoin(dirname(p.outfile), 'manifest.json')
  print(`write ${relpath(".", file)}`)
  await writefile(file, json, 'utf8')
}


function watchAuxFiles(p) {
  fs.watch(p.srcfileHtml, {}, () => makePluginHTML(p))
  if (fs.existsSync(p.srcfileCss)) {
    fs.watch(p.srcfileCss, {}, () => makePluginHTML(p))
  }
}


async function loadManifest(file) {
  let manifest = jsonparse(await readfile(file, 'utf8'), file)
  assert(manifest.name, `missing "name" in ${file}`)
  assert(manifest.version, `missing "version" in ${file}`)
  assert(manifest.script, `missing "script" in ${file}`)
  return manifest
}


async function makePlugin(manifestFile) {
  let manifest = await loadManifest(manifestFile)

  let name = manifest.name.replace(/[^A-Za-z_\.\-\s]+/g, ' ')
  let srcdir = dirname(manifestFile)
  let outdir = pjoin('build', name)

  let baseProductOptions = {
    name,
    version:  pkg.version,
    debug:    opt.debug,
    optimize: opt.optimize,
    nomin:    opt.nomin,
    clean:    opt.clean,
    targetESVersion: 8,
  }

  let p = new Product({ ...baseProductOptions,
    entry:   pjoin(srcdir, manifest.script),
    outfile: pjoin(outdir, 'plugin.js'),
    libs:    pluginLibs,
  })

  // UI?
  if (manifest.html) {
    let uisrc = pparse(manifest.html)
    let uisrcName = pjoin(uisrc.dir, uisrc.name)
    p.pluginUI = new Product({ ...baseProductOptions,
      entry:   pjoin(srcdir, manifest.html),
      outfile: pjoin(outdir, 'ui.js'),
      libs:    uiLibs,
    })
    p.pluginUI.srcfileHtml = pjoin(srcdir, uisrcName + '.html')
    p.pluginUI.srcfileCss  = pjoin(srcdir, uisrcName + '.css')
    p.pluginUI.outfileHtml = pjoin(outdir, 'ui.html')
  }

  // manifest
  let promises = [
    generateManifestFile(p, manifest)
  ]

  if (opt.watch) {
    promises.push(p.buildIncrementally())

    // reload manifest on change
    fs.watch(manifestFile, {}, async () => {
      try {
        let manifest2 = await loadManifest(manifestFile)
        if (manifest.script != manifest2.script ||
            manifest.html != manifest2.html) {
          // source changed -- need to restart build process
          // TODO: automate restarting the build
          console.error(
            '\n' +
            'Warning: Need to restart build.js -- ' +
            'source files in manifest changed.' +
            '\n'
          )
        } else {
          generateManifestFile(p, manifest2)
        }
      } catch (err) {
        console.error(err.message)
      }
    })

    // rebuild HTML UI on change
    if (p.pluginUI) {
      watchAuxFiles(p.pluginUI)
      promises.push(p.pluginUI.buildIncrementally(makePluginHTML))
    }
  } else {
    promises.push(p.build())
    if (p.pluginUI) {
      promises.push(p.pluginUI.build().then(() => makePluginHTML(p.pluginUI)))
    }
  }

  return Promise.all(promises)
}


async function main(argv) {
  pkg.init(__dirname)

  let cachedir = 'build'
  opt = pb.parseopt(argv)

  // setup libs
  let globalLib = new Lib('src/global.d.ts', { jsfile: 'src/global.js', cachedir })
  let figmaPluginLib = new Lib('src/figma-plugin.d.ts')
  uiLibs = [
    globalLib,
    figmaPluginLib
  ]
  pluginLibs = [
    globalLib,
    figmaPluginLib,
  ]

  const pluginManifestFiles = []
  if (pluginManifestFiles.length == 0) {
    pluginManifestFiles.push('src/manifest.js')
  }

  await Promise.all(pluginManifestFiles.map(makePlugin))
}

main(process.argv.slice(1)).catch(e =>
  console.error(e.stack || ''+e))
