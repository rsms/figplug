import React from 'react'
import ReactDOM from 'react-dom'

// example of embedding and importing assets/resources
import logoSvg from './assets/logo.svg'
import logoSvgJsx from './assets/logo.svg?jsx'
import gif from './assets/under-construction.gif'
import jpegImage from './assets/rectangle.jpg'
import packageJson from './package.json'

class App extends React.Component {
  textbox: HTMLInputElement

  countRef = (element: HTMLInputElement) => {
    if (element) element.value = '5'
    this.textbox = element
  }

  onCreate = () => {
    const count = parseInt(this.textbox.value, 10)
    parent.postMessage({
      pluginMessage: { type: 'create-rectangles', count }
    }, '*')
  }

  onCancel = () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
  }

  render() {
    return <div>
      <img src={gif.url} width={gif.width} />
      <img src={jpegImage.url} width={jpegImage.width} />
      <div style={{
        backgroundImage: `url("${logoSvg.url}")`,
        width: logoSvg.width,
        height: logoSvg.height,
      }} />
      {logoSvgJsx}
      <pre>
        {JSON.stringify(packageJson, null, 2)}
      </pre>
      <h2>Rectangle Creator</h2>
      <p>Count: <input ref={this.countRef} /></p>
      <button id="create" onClick={this.onCreate}>Create</button>
      <button onClick={this.onCancel}>Cancel</button>
    </div>
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
