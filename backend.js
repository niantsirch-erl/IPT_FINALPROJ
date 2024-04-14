const { Socket } = require('dgram');
const express = require('express')
const app = express()

//socket.io setup
const http = require('http');
const { argv, argv0 } = require('process');
const server = http.createServer(app)
const { Server } = require('socket.io');
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000});

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '. /index.html')
})

const backEndplayers = {}
const backEndProjectiles = {}
// const backEndPowerUps = []

const SPEED = 10
const RADIUS = 10
const PROJECTILE_RADUIS = 5
// const MAX_POWERUP = 5

let projectileID = 0

io.on('connection', (socket) => {
  console.log('a user connected')

  io.emit('updatePlayers', backEndplayers)

  socket.on('shoot', ({x, y, angle}) => {
    projectileID++

    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5 
    }

    backEndProjectiles[projectileID] = {
      x,
      y,
      velocity,
      playerID: socket.id
    }

    console.log(backEndProjectiles);
  })

  socket.on('disconnect', (reason) => {
    console.log(reason);
    delete backEndplayers[socket.id]
    io.emit('updatePlayers', backEndplayers)
  })

  socket.on('initGame', ({username, width, height}) => {
    backEndplayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${360 * Math.random()}, 50%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    }

    //init canvas
    backEndplayers[socket.id].canvas = {
      width,
      height,
    }

    backEndplayers[socket.id].radius = RADIUS

  })
  
  socket.on('keydown', ({keyCode, sequenceNumber}) => {

    if(!backEndplayers[socket.id]) return

    backEndplayers[socket.id].sequenceNumber = sequenceNumber
    switch (keyCode) {
      case 'KeyW':
        backEndplayers[socket.id].y -= SPEED
        break;
      case 'KeyS':
        backEndplayers[socket.id].y += SPEED
        break;
      case 'KeyA':
        backEndplayers[socket.id].x -= SPEED
        break;
      case 'KeyD':
        backEndplayers[socket.id].x += SPEED
        break
    }
  })

  // console.log(backEndplayers);
})

//backend ticks
setInterval(() => {
  //update projectile position
  for(const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    const PROJECTILE_RADUIS = 5
    if (backEndProjectiles[id].x - PROJECTILE_RADUIS >= 
      backEndplayers[backEndProjectiles[id].playerID]?.canvas?.width || 
      backEndProjectiles[id].x + PROJECTILE_RADUIS <= 0 || 
      backEndProjectiles[id].y - PROJECTILE_RADUIS >= 
      backEndplayers[backEndProjectiles[id].playerID]?.canvas?.height || 
      backEndProjectiles[id].y + PROJECTILE_RADUIS <= 0) 
      {
      delete backEndProjectiles[id]
      continue
    }

    for(const playerID in backEndplayers){
      const backEndPlayer = backEndplayers[playerID]

      const DISTANCE = Math.hypot(backEndProjectiles[id].x - backEndPlayer.x, backEndProjectiles[id].y - backEndPlayer.y)

      //collision detection
      if (DISTANCE < PROJECTILE_RADUIS + backEndPlayer.radius &&
        backEndProjectiles[id].playerID !== playerID
      ) {
        if(backEndplayers[backEndProjectiles[id].playerID]){
          backEndplayers[backEndProjectiles[id].playerID].score++
        }
        
        console.log(backEndplayers[backEndProjectiles[id].playerID]);
        delete backEndProjectiles[id]
        delete backEndplayers[playerID]
        break
      }

      // console.log(DISTANCE);
    }
    // console.log(backEndProjectiles)
  }

  for (const playerID in backEndplayers) {
    const player = backEndplayers[playerID];
    let collided = false;

    if (player.x - RADIUS < 0) {
      player.x = RADIUS;
      collided = true;
    }

    if (player.x + RADIUS > player.canvas.width) {
      player.x = player.canvas.width - RADIUS;
      collided = true;
    }

    if (player.y - RADIUS < 0) {
      player.y = RADIUS;
      collided = true;
    }

    if (player.y + RADIUS > player.canvas.height) {
      player.y = player.canvas.height - RADIUS;
      collided = true;
    }

    if (collided) {

      io.emit('playerCollision', { playerID, x: player.x, y: player.y });
    }
  }

  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndplayers)
  // io.emit('updatePowerUps', backEndPowerUps);
  
}, 15);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log('server loaded')


///IDEA
/* Make the enemy spawn for points */