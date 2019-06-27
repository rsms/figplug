
function id<T>(obj :T) :Exclude<T, null|undefined> {
  if (obj === undefined || obj === null) {
    throw new Error("null value")
  }
  return obj as any as Exclude<T, null|undefined>
}

id(document.getElementById('create')).onclick = () => {
  const textbox = id(document.getElementById('count') as HTMLInputElement)
  const count = parseInt(textbox.value, 10)
  parent.postMessage({ pluginMessage: { type: 'create-rectangles', count } }, '*')
}

id(document.getElementById('cancel')).onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
}
