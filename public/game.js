const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

const scoreID = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEl = document.querySelector('#modalEl')
const updatedScore = document.querySelector('#updatedScore')


const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
const frontEndProjectiles = {}
// let powerUPs = []

const MAX_POWERUP = 5

socket.on('updateProjectiles', (backEndProjectiles) => {
    for(const id in backEndProjectiles){
        const backEndProjectile = backEndProjectiles[id]

        if (!frontEndProjectiles[id]) {
            frontEndProjectiles[id] = new Projectile({
                x: backEndProjectile.x,
                y: backEndProjectile.y, 
                radius: 5, 
                color: frontEndPlayers[backEndProjectile.playerID]?.color, 
                velocity: backEndProjectile.velocity
            })
        }else{
            frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
            frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
        }
       
    }

    for(const frontEndProjectilesID in frontEndProjectiles){
        if(!backEndProjectiles[frontEndProjectilesID]){
            delete frontEndProjectiles[frontEndProjectilesID]
        }
    }
    
})

socket.on('updatePlayers', (backEndPlayers) => {
    for(const id in backEndPlayers){
        const backEndPlayer = backEndPlayers[id]

        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player({
                x: backEndPlayer.x, 
                y: backEndPlayer.y, 
                radius: 10, 
                color: backEndPlayer.color,
                username: backEndPlayer.username
            })

            document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score"${backEndPlayer.score}">${backEndPlayer.username}: ${backEndPlayer.score}</div>`
        }else{
            document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`
            document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backEndPlayer.score)

            //sorts the score of the player
            const pareDiv = document.querySelector('#playerLabels')
            const childDiv = Array.from(pareDiv.querySelectorAll('div'))

            childDiv.sort((a, b) => {
                const scoreA = Number(a.getAttribute('data-score'))
                const scoreB = Number(b.getAttribute('data-score'))

                return scoreB - scoreA
            })

            //remove old elements
            childDiv.forEach(div => {
                pareDiv.removeChild(div)
            })

            //add sorted Elements
            childDiv.forEach(div => {
                pareDiv.appendChild(div)
            })

            frontEndPlayers[id].target = {
                x: backEndPlayer.x,
                y: backEndPlayer.y
            }

            //if player exist
            if (id === socket.id) {

                const lastBackEndInputIndex = playerInput.findIndex(input => {
                    return backEndPlayer.sequenceNumber === input.sequenceNumber
                })

                if (lastBackEndInputIndex > -1) {
                    playerInput.splice(0, lastBackEndInputIndex + 1)
                }
                playerInput.forEach(input => {
                    frontEndPlayers[id].target.x += input.dx
                    frontEndPlayers[id].target.y += input.dy
                })
            }
        }
    }

    //deletions for frontendPlayers
    for(const id in frontEndPlayers){
        if(!backEndPlayers[id]){
            const divToDelete = document.querySelector(`div[data-id="${id}"]`)
            divToDelete.parentNode.removeChild(divToDelete)

            if (id === socket.id) {
                document.querySelector('#usernameForm').style.display = 'block'
            }
            delete frontEndPlayers[id]
        }
    }
    
})

function checkPlayerBoundary() {
    const player = frontEndPlayers[socket.id]
    let collided = false;

    if (player) {
        if (player.x - player.radius < 0) {
            player.x = player.radius;
            collided = true;
        }

        if (player.x + player.radius > canvas.width) {
            player.x = canvas.width - player.radius;
            collided = true;
        }

        if (player.y - player.radius < 0) {
            player.y = player.radius;
            collided = true;
        }

        if (player.y + player.radius > canvas.height) {
            player.y = canvas.height - player.radius;
            collided = true;
        }

        if (collided) {
            // Emit an event to notify the server about the collision
            socket.emit('playerCollision', { x: player.x, y: player.y });
        }
    }
}

let animationID

// let score = 0
function animate () {
    animationID = requestAnimationFrame(animate)
    // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.clearRect(0, 0, canvas.width, canvas.height)

    checkPlayerBoundary()

    for(const id in frontEndPlayers) {
        const frontEndPlayer = frontEndPlayers[id]

        if (frontEndPlayer.target) {
            frontEndPlayers[id].x += (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
            frontEndPlayers[id].y += (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
        }
        frontEndPlayer.draw()
    }

    for(const id in frontEndProjectiles) {
        const frontEndProjectile = frontEndProjectiles[id]
        frontEndProjectile.draw()
    }


}
// console.log(player)

addEventListener('click', (event) => {
    const canvas = document.querySelector('canvas')
    const {
        top, 
        left
    } = canvas.getBoundingClientRect()
    const playerPosition = {
        x: frontEndPlayers[socket.id].x,
        y: frontEndPlayers[socket.id].y
    }

    const angle = Math.atan2(
        (event.clientY - top) - playerPosition.y,
        (event.clientX - left) - playerPosition.x
    )
    

    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle
    })
    
    // console.log(frontEndProjectiles)
})

animate()

const keys = {
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    a: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

const SPEED = 10
const playerInput = []
let sequenceNumber = 0
setInterval(() => {
    if (keys.w.pressed) {
        sequenceNumber++
        playerInput.push({sequenceNumber, dx: 0, dy: -SPEED})
        // frontEndPlayers[socket.id].y -= SPEED
        socket.emit('keydown', {keyCode: 'KeyW', sequenceNumber})
    }
    if (keys.s.pressed) {
        sequenceNumber++
        playerInput.push({sequenceNumber, dx: 0, dy: SPEED})
        // frontEndPlayers[socket.id].y += SPEED
        socket.emit('keydown', {keyCode: 'KeyS', sequenceNumber})
    }SPEED
    if (keys.a.pressed) {
        sequenceNumber++
        playerInput.push({sequenceNumber, dx: -SPEED, dy: 0})
        // frontEndPlayers[socket.id].x -= SPEED
        socket.emit('keydown', {keyCode: 'KeyA', sequenceNumber})
    }
    if (keys.d.pressed) {
        sequenceNumber++
        playerInput.push({sequenceNumber, dx: SPEED, dy: 0})
        // frontEndPlayers[socket.id].x += SPEED
        socket.emit('keydown', {keyCode: 'KeyD', sequenceNumber})
    }
}, 15);

window.addEventListener('keydown', (event) =>{
    if (!frontEndPlayers[socket.id]) return

    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = true
            break;
        case 'KeyS':
            keys.s.pressed = true
            break;
        case 'KeyA':
            keys.a.pressed = true
            break;
        case 'KeyD':
           keys.d.pressed = true
            break
    }
    
})

window.addEventListener('keyup', (event) => {
    if (!frontEndPlayers[socket.id]) return

    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = false
            break;
        case 'KeyS':
            keys.s.pressed = false
            break;
        case 'KeyA':
            keys.a.pressed = false
            break;
        case 'KeyD':
            keys.d.pressed = false
            break
    }
})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
    event.preventDefault()
    document.querySelector('#usernameForm').style.display = 'none'
    socket.emit('initGame', {
        username: document.querySelector('#usernameInput').value, width: canvas.width, 
        height: canvas.height,
        devicePixelRatio
    })
})
