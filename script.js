const canvas = d3.select('.canvas')
const colorInput = d3.select('#colorPicker')
const marker = d3.select('.marker')
const clearButton = d3.select('[data-clear]')
const saveButton = d3.select('[data-save]')
const undoButton = d3.select('[data-undo]')
const copyButton = d3.select('[data-copy]')
const textArea = d3.select('#css')
const drawArea = d3.select('.draw-area')
const range = d3.select('#columns')

const width = drawArea.node().offsetWidth
const height = drawArea.node().offsetHeight
let columns = 30
const multiplier = height / width
let rows = columns * multiplier
let cellSize = 100 / columns
let rowSize = 100 / rows
let isPressed = false

const bisect = d3.bisector((d) => d)

const dx = (posX) => {
	const stepX = 1 / (columns - 1)
	const dataX = d3.range(0, 100, stepX)
	const indexX = bisect.center(dataX, posX / width)
	return (dataX[indexX] * 100).toFixed(2)
}

const dy = (posY) => {
	const stepY = 1 / (rows - 1)
	const dataY = d3.range(0, 1, stepY)
	const indexY = bisect.center(dataY, posY / height)
	return (dataY[indexY] * 100).toFixed(2)
}

let bg = []
let bgPosition = []

const draw = () => {
	drawArea
		.style('background-image', bg.join(','))
		.style('background-position', bgPosition.join(','))
}

const updateText = () => {
	textArea.html(`
aspect-ratio: 4 / 3;
background-image: ${bg.join(',')};
background-size: calc(100% / ${columns}) calc(100% / ${rows});
background-position: ${bgPosition.join(',')};
background-repeat: no-repeat;
	`)
}

const shouldDraw = (newBgValue, newBgPositionValue) => {
	if (!isPressed) return false
	if (!bg.length) return true
	if (bg[0] !== newBgValue) return true
	return bgPosition[0] !== newBgPositionValue
}

canvas.on('click', (e) => {
	const color = colorInput.node().value
	const [posX, posY] = d3.pointer(e)
	const x = dx(posX)
	const y = dy(posY)
	
	bg = [ `linear-gradient(${color}, ${color})`, ...bg ]
	bgPosition = [ `${x}% ${y}%`, ...bgPosition]
	
	draw()
	updateText()
})

canvas
	.on('mouseover', () => {
		marker.style('opacity', 1)
	})
	.on('mouseout', () => {
		marker.style('opacity', 0)
	})
	.on('mousedown', () => {
		isPressed = true
	})
	.on('mouseup', () => {
		isPressed = false
	})

canvas.on('mousemove', (e) => {
	const color = colorInput.node().value
	const [posX, posY] = d3.pointer(e)
	const x = dx(posX)
	const y = dy(posY)
	
	marker
		.style('background-position', `${x}% ${y}%`)
	
	const newBgValue = `linear-gradient(${color}, ${color})`
	const newBgPositionValue = `${x}% ${y}%`
	
	if (!shouldDraw(newBgValue, newBgPositionValue)) return
	
	bg = [ newBgValue, ...bg ]
	bgPosition = [ newBgPositionValue, ...bgPosition]

	draw()
	updateText()
})

colorInput.on('input', () => {
	marker.style('--bg', colorInput.node().value)
})

const clear = () => {
	bg = []
	bgPosition = []
	textArea.html('')
	drawArea
		.style('background-image', '')
		.style('background-position', '')
		.style('background-size', '')
}

clearButton.on('click', clear)

saveButton.on('click', () => {
	const art = textArea.node().value
	localStorage.setItem('art', art)
})

const restoreSavedArt = () => {
	const savedArt = localStorage.getItem('art')
	
	if (!savedArt) return
	drawArea.attr('style', savedArt)
	textArea.html(savedArt)
}

const setColumnCount = () => {
	columns = range.node().value
	rows = columns * multiplier
	cellSize = 100 / columns
	rowSize = 100 / rows
	canvas.style('--cellSizeCol', `${cellSize}%`)
	canvas.style('--cellSizeRow', `${rowSize}%`)
	canvas.style('--colCount', columns)
}

setColumnCount()
restoreSavedArt()

window.addEventListener('resize', () => {
	if (window.innerWidth > width + 100) return
	setColumnCount()
})

range.on('input', setColumnCount)

copyButton.on('click', (e) => {
	const copyText = textArea.node()

  copyText.select()
  copyText.setSelectionRange(0, 99999)
	navigator.clipboard.writeText(copyText.value)
	copyButton.text('Copied!')
	
	setTimeout(() => {
		copyButton.text('Copy to clipboard')
	}, 3000)
})

undoButton.on('click', () => {
	bg.splice(0, 1)
	bgPosition.splice(0, 1)
	
	draw()
	updateText()
})