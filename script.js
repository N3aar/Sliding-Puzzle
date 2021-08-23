const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')

const gameSize = document.querySelector('.game-size')
const x3 = document.querySelector('#x3')
const x4 = document.querySelector('#x4')
const x5 = document.querySelector('#x5')
const x8 = document.querySelector('#x8')

const resizeButton = document.querySelector('#resize')
const uploadButton = document.querySelector('#uploader')
const resetButton = document.querySelector('#reset')

const example = new Image(400, 400)
const audio = new Audio('./tick.mp3')

const defaultScale = 400
const maxScale = 800

const game = {
  size: 3,
  image: example,
  puzzle: Math.floor(canvas.width / 3),
  board: [],
  resized: false,
  win: true,
  color: ['#8e44ad', '#9b59b6']
}

example.onload = () => reset()
example.src = './example.png'

audio.volume = 0.5

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = "#FFFFFF"

  for (const cl in game.board) {
    for (const rw in game.board[cl]) {
      const square = game.board[cl][rw]
      const x = rw * game.puzzle
      const y = cl * game.puzzle

      if (square.cx > 0 || square.cy > 0) {
        ctx.drawImage(game.image, square.cx, square.cy, game.puzzle, game.puzzle, x, y, game.puzzle, game.puzzle)
      }

      ctx.strokeRect(x, y, game.puzzle, game.puzzle)
    }
  }
}

const movePuzzle = event => {
  if (game.win) {
    return
  }

  const position = getClickedPosition(event)
  const clicked = getClickedSquare(position)

  if (clicked.square?.empty) {
    return
  }

  switch (true) {
    case isEmpty(clicked.column, clicked.row -1): {
      swapInBoard(clicked, { row: -1 })
      break
    }

    case (isEmpty(clicked.column -1, clicked.row)): {
      swapInBoard(clicked, { column: -1 })
      break
    }

    case (isEmpty(clicked.column, clicked.row +1)): {
      swapInBoard(clicked, { row: 1 })
      break
    }

    case (isEmpty(clicked.column +1, clicked.row)): {
      swapInBoard(clicked, { column: 1 })
      break
    }

    default: return
  }

  audio.play()
  draw()
  win()
}

const win = () => {
  for (const cl in game.board) {
    for (const rw in game.board[cl]) {
      const square = game.board[cl][rw]
      const cx = square.cx !== rw * game.puzzle
      const cy = square.cy !== cl * game.puzzle

      if (cx || cy) {
        return
      }
    }
  }

  game.win = true

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.lineWidth = 8

  ctx.font = 'bold 45px Starborn'
  ctx.strokeStyle = '#FFFFFF'
  ctx.fillStyle = game.color[1]

  ctx.drawImage(game.image, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
  ctx.strokeText('YOU WON!', canvas.width/2, canvas.height/2)
  ctx.fillText('YOU WON!', canvas.width/2, canvas.height/2)
}

const isEmpty = (column, row) => {
  const square = game.board[column]?.[row]
  return square && square.empty
}

const swapInBoard = (square, changes) => {
  const column = square.column
  const row = square.row
  const tmp = game.board[column][row]

  if (changes.column) {
    const cl = column + changes.column
    game.board[column][row] = game.board[cl][row]
    game.board[cl][row] = tmp
  }

  if (changes.row) {
    const rw = row + changes.row
    game.board[column][row] = game.board[column][rw]
    game.board[column][rw] = tmp
  }
}

const shuffle = array => {
  for (let i = (array.length - 1); i > 0; i--) {
    const rn = Math.floor(Math.random() * i)
    const tmp = array[i]

    array[i] = array[rn]
    array[rn] = tmp
  }
}

const genBoard = () => {
  game.board.length = 0

  const tmp = []

  for (let column = 0; column < game.size; column++) {
    for (let row = 0; row < game.size; row++) {
      if (column || row) {
        const cy = column * game.puzzle
        const cx = row * game.puzzle
        const position = tmp.length + 2
        tmp.push({ position, cx, cy })
      }
    }
  }

  shuffle(tmp)
  tmp.unshift({ position: 1, cx: 0, cy: 0, empty: true })

  for (let i = 0; i < game.size; i++) {
    game.board[i]  = tmp.slice(i * game.size, ((i + 1) * game.size))
  }
}

const getClickedPosition = window => {
  const canvasRect = canvas.getBoundingClientRect()
  const x = Math.floor(window.clientX - canvasRect.left)
  const y = Math.floor(window.clientY - canvasRect.top)

  return { x, y }
}

const getClickedSquare = position => {
  for (const column in game.board) {
    for (const row in game.board[column]) {
      const cx = row * game.puzzle
      const cy = column * game.puzzle

      const isX = position.x >= cx && position.x <= cx + game.puzzle
      const isY = position.y >= cy && position.y <= cy + game.puzzle

      const square = game.board[column][row]

      if (isX && isY) {
        return { column: Number(column), row: Number(row), square }
      }
    }
  }
}

const changeSize = size => {
  if (game.size === size) {
    return
  }

  game.size = size
  game.puzzle = Math.floor(canvas.width / size)
  reset()
}

const resize = () => {
  const bg = Math.min(game.image.width, game.image.height)
  const scale = game.resized ? defaultScale : (bg > maxScale ? maxScale : bg)
  const inPixels = `${scale}px`

  canvas.width = scale
  canvas.height = scale

  gameSize.style.width = inPixels
  gameSize.style.height = inPixels

  game.resized = !game.resized
  game.puzzle = Math.floor(canvas.width / game.size)

  reset()
}

const reset = () => {
  game.win = false
  ctx.lineWidth = 2
  genBoard()
  draw()
}

const upload = event => {
  const reader = new FileReader()
  reader.onload = evt => {
    const img = new Image()
    game.image = img
    img.onload = () => {
      if (game.resized) {
        resize()
      } else {
        reset()
      }
    }
    img.src = evt.target.result
  }
  reader.readAsDataURL(event.target.files[0])
}

const randomBackgroundColor = () => {
  const colors = [
    ['#16a085', '#1abc9c'],
    ['#27ae60', '#2ecc71'],
    ['#2980b9', '#3498db'],
    ['#8e44ad', '#9b59b6'],
    ['#2c3e50', '#34495e'],
    ['#d35400', '#e67e22'],
    ['#c0392b', '#e74c3c']
  ]

  const random = Math.floor(Math.random() * colors.length)
  const background = colors[random]
  const menu = document.querySelector('#menu')

  game.color = background
  document.body.style.background = background[0]
  menu.style.background = background[1]
}

// Events
uploadButton.addEventListener('change', upload, false)

x3.addEventListener('click', () => changeSize(3))
x4.addEventListener('click', () => changeSize(4))
x5.addEventListener('click', () => changeSize(5))
x8.addEventListener('click', () => changeSize(8))

canvas.addEventListener('click', movePuzzle)
resizeButton.addEventListener('click', resize)
resetButton.addEventListener('click', reset)

// Change Background Color
randomBackgroundColor()
