const redPaint :SolidPaint = { type: "SOLID", color: { r: 1, g: 0, b: 0 } }

function createRectangles(count :number) {
  const nodes :SceneNode[] = []
  for (let i = 0; i < count; i++) {
    const rect = figma.createRectangle()
    rect.x = i * 150
    rect.fills = [ redPaint ]
    figma.currentPage.appendChild(rect)
    nodes.push(rect)
  }
  figma.currentPage.selection = nodes
  figma.viewport.scrollAndZoomIntoView(nodes)
}

figma.showUI(__html__)

figma.ui.onmessage = msg => {
  if (msg.type === 'create-rectangles' && typeof msg.count == 'number') {
    createRectangles(msg.count)
  }
  figma.closePlugin()
}
