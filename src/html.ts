
// findHeadIndex finds the best insertion point in string html for
// adding content that should optimally be placed inside <head>.
//
export function findHeadIndex(html :string) :int {
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

// findTailIndex finds the best insertion point in string html for
// adding content that should optimally be placed at the end of the html
// document.
//
export function findTailIndex(html :string) :int {
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
