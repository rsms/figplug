const redPaint :SolidPaint = { type: "SOLID", color: { r: 1, g: 0, b: 0 } }

const nodes :SceneNode[] = []
for (let i = 0; i < 4; i++) {
  const rect = figma.createRectangle()
  rect.x = i * 150
  rect.fills = [ redPaint ]
  figma.currentPage.appendChild(rect)
  nodes.push(rect)
}
figma.currentPage.selection = nodes
figma.viewport.scrollAndZoomIntoView(nodes)
figma.closePlugin()
