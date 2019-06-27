const redPaint :SolidPaint = { type: "SOLID", color: { r: 255, g: 0, b: 0 } }

let rect = figma.createRectangle()
rect.fills = [ redPaint ]

figma.closePlugin()
