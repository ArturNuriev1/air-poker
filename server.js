const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http, {
    cors: {
      origin: '*',
    }
})

const port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('Server started!')
})

let players = []
let pickedVals = []
let enemyArray = []
let playerArray = []

let hasPlayerA = 0
let playerAID = null

let words = ['Hearts', 'Diamonds', 'Clubs', 'Spades']

const aCard = 0
const bCard = 0

io.on('connect', function (socket) {
    console.log('A user connected: ' + socket.id)
    
    
    if (players.length < 2) {
        if (players.length === 0 || hasPlayerA === 0) {
            console.log('You are Player A')
            hasPlayerA = 1
            playerAID = socket.id
            io.emit('isPlayerA')
        }
        players.push(socket.id)
        if (players.length == 2) {
            io.emit('foundGame')
        }
    }
    
    console.log(players)

    // randomise word order using fisher-yates shuffle
    var j, x, i;
    for (i = 3; i >= 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = words[i];
        words[i] = words[j];
        words[j] = x;
    }
    console.log(words)



    if (players.length > 2) {
        console.log('Game is already in session', players)
        console.log('Booting out ', socket.id)
        socket.disconnect()
    }

    socket.on('dealCards', function () {
        io.emit('dealCards')
    })

    socket.on('pickCards', function (isPlayerA) {
        for (let i = 0; i < 5; i++) {
            let val = Math.floor(Math.random() * (64 - 6 + 1) + 6)
            while (pickedVals.includes(val)) {
                val = Math.floor(Math.random() * (64 - 6 + 1) + 6)
            }
            pickedVals.push(val)
            //console.log(pickedVals)
            enemyArray[i] = val
            let val2 = Math.floor(Math.random() * (64 - 6 + 1) + 6)
            while (pickedVals.includes(val2)) {
                val2 = Math.floor(Math.random() * (64 - 6 + 1) + 6)
            }
            pickedVals.push(val2)
            playerArray[i] = val2
        }
        io.emit('cardsPicked', isPlayerA, playerArray, enemyArray)
    })

    socket.on('nextRound', function() {
        io.emit('nextRound')
    })

    socket.on('revealCards', function(aNum, bNum) {
        console.log('Revealing!')
        io.emit('revealCards', aNum, bNum, words)
    })

    socket.on('enemyPlays', function(index, isPlayerA, num) {
        io.emit('enemyPlays', index, isPlayerA, num)
    })

    socket.on('swapBettors', function(resultsNeeded) {
        io.emit('swapBettors', resultsNeeded)
    })

    socket.on('playerFolds', function(isA) {
        io.emit('enemyFolds', isA)
    })

    socket.on('playerCalls', function(isA) {
        io.emit('enemyCalls', isA)
    })

    socket.on('playerRaises', function(isPlayerA, amount) {
        io.emit('enemyRaises', isPlayerA, amount)
    })

    socket.on('resetGame', function () {
        io.emit('resetGame')
    })

    socket.on('disconnect', function () {
        if (socket.id == playerAID) {
            hasPlayerA = 0
            playerAID = null
        }
        console.log('A user disconnected: ' + socket.id)
        players = players.filter(player => player !== socket.id)
        console.log('New array: ' + players)
    })
})