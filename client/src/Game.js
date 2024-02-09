import Phaser from 'phaser'

import Card from './card.js'

import Zone from './Zone.js'

import Calc from './calc.js'

import io from 'socket.io-client'

export default class Game extends Phaser.Scene {
	constructor() {
		super('Game')
	}

	preload() {
        this.load.image('bg', './bg2.jpg')
		this.load.image('card', './card.png')
        this.load.spritesheet('load', './load.png', { frameWidth: 200, frameHeight: 200, startFrame: 0, endFrame: 28 })
	}

	create() {
        let self = this

        let enemyArray = []
        let playerArray = []

        let playerPlayed = 0
        let enemyPlayed = 0
        let playerVal, enemyVal
        let tempImg, tempImg2
        let newPlayer = new Card(self)
        let tempZone
        let ante = 1
        let pBios = 25
        let eBios = 25
        let callVal = 1
        let firstBet = 2
        let currentBet = 0
        let enemyRaised = 0
        let playerCalled = 0
        let enemyCalled = 0
        let prevBet = 0
        this.raiseAmount = 0
        let pot = 0
        let playerTotalBet = 0
        // let calamity = 0
        
        // variable to keep track between the two clients
        this.isPlayerA = false
                
        // The poker hand calculations are done using the calc.js class
        let calc = new Calc(this)
        

        // set background image
        this.add.image(650, 360, 'bg')
        
        // animation config for the loading gif
        const config = {
            key: 'loadGif',
            frames: this.anims.generateFrameNumbers('load', { start: 0, end: 28, first: 0 }),
            frameRate: 30,
            repeat: -1
        }
        this.anims.create(config)
        
        this.load = this.add.sprite(930, 520, 'load').play('loadGif').setScale(0.25, 0.25)
        
        this.loadText = this.add.text(608, 520, "WAITING FOR OPPONENT", {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:50, 
            align:'center'
        }).setOrigin(0.5)
        

        // server hosted for free via render
        this.socket = io('https://air-poker-server.onrender.com')
        
        this.socket.on('connect', function () {
            console.log('Connected! ', self.socket.id)
        })
        
        this.socket.on('isPlayerA', function () {
            console.log('You are Player A')
            self.isPlayerA = true
        })

        this.socket.on('foundGame', function () {
            self.dealText.setColor('#00ffff').setInteractive()
            self.loadText.setText('')
            self.anims.remove('loadGif')
            self.load.destroy()
        })

        this.socket.on('dealCards', function () {
            self.dealCards()
            self.dealText.disableInteractive()
            self.dealText.setColor('#00ffff')
        })

        this.socket.on('nextRound', function () {
            // delete the cards that are in each dropzone
            enemyArray[5].x = 10000
            newPlayer.x = 10000
            playerPlayed = 0
            enemyPlayed = 0
            tempZone.data.values.cards = 0
        })

        this.socket.on('enemyPlays', function(index, isA, num) {
            if (isA != self.isPlayerA) {
                tempImg = self.add.image(550, 375, 'card').setScale(0.15).disableInteractive()
                enemyVal = num
                enemyArray[4-index].destroy()
                enemyPlayed = 1
            }
        })

        this.socket.on('revealCards', function(words) {
            self.time.addEvent({
                delay: 1000,
                callback: () => {
                    tempImg.destroy()
                    tempImg2.destroy()
                    let tempCard = new Card(self)
                    enemyArray[5] = tempCard.render(550, 375, 0, enemyVal, 5)
                    newPlayer = tempCard.render(800, 375, 0, playerVal, 5)
                    self.results = calc.law(playerVal, enemyVal)
                    // if (self.results[2] == true) {
                    //     calamity = 1
                    // }
                    self.betting = true
                    self.betPhase()
                }
            })
        })

        // Triggered after betting ends in order to clean up and start next round
        this.socket.on('swapBettors', function(resultsNeeded) {
            if (resultsNeeded) {
                self.time.addEvent({
                    delay: 1500,
                    callback: () => {
                        if (self.results[0].value > self.results[1].value) {
                            numText.setText('The winner is ' + playerVal + '!')
                        }

                        else {
                            numText.setText('The winner is ' + enemyVal + '!')
                        }
                    }
                })
            }
            if (ante == 5) {
                self.time.addEvent({
                    delay: 4000,
                    callback: () => {
                        self.checkVictory(true)
                        return
                    }
                })
            }

            // Swap the person who bets first next round
            if (prevBet == firstBet) {
                firstBet = 1 - firstBet
            }
            ante += 1
            self.raiseAmount = 0
            self.betting = false
            prevBet = firstBet

            // Helps make the timing of the animations smoother
            if (!resultsNeeded) {
                self.time.addEvent({
                    delay: 2000,
                    callback: () => {
                        self.socket.emit('nextRound')
                        personalText.setText('')
                        numText.setText('')
                    }
                })
            }

            else {
                self.time.addEvent({
                    delay: 3500,
                    callback: () => {
                        self.socket.emit('nextRound')
                        personalText.setText('')
                        numText.setText('')
                    }
                })
            }
        })

        this.betPhase = () => {
            // firstBet is initialised with 2, so this means that it is currently the first betting turn in the 
            // game and that the betting order is determined by the number on each player's chosen card
            if (firstBet == 2) {
                if (playerVal < enemyVal) {
                    firstBet = 1
                    personalText.setText('Your turn to bet')
                }
                else {
                    firstBet = 0
                    personalText.setText('Enemy\'s turn to bet')
                }
            }

            // Otherwise each player takes turns to have betting priority
            else {
                if (firstBet == 1) {
                    personalText.setText('Your turn to bet')
                }
                else {
                    personalText.setText('Enemy\'s turn to bet')
                }
            }

            prevBet = firstBet
            pBios -= ante
            eBios -= ante
            pot = 2*ante
            self.checkVictory()
            this.updateText()
        }

        // this.calamityText = this.add.text(608, 520, '', {
        //     color: 'white', 
        //     fontFamily: 'Bahnschrift', 
        //     fontSize:50, 
        //     align:'center'
        // }).setOrigin(0.5)

        // this.checkCalamity = () => {
        //     if (calamity == 1) {
        //         console.log("CALAMITY, player bet " + playerTotalBet)
        //         pot = pot + playerTotalBet
        //         let currentTime = 0
        //         let potIncrement = pot
        //         let interval = 1500 / playerTotalBet
        //         for (let i = 0; i < playerTotalBet; i++) {
        //             self.time.addEvent({
        //                 delay: currentTime += interval,
        //                 callback: () => {
        //                     potText.setText(potIncrement++ + " Air-Bios")
        //                 }
        //             })
        //             currentTime = currentTime + interval
        //         }
        //         this.calamityText.setText("A CALAMITY HAS OCCURRED!")
        //         // calamity = 0
        //     }
        // }


        // Buttons for calling/raising/folding and changing raise amount

        let raiseRect = this.add.rectangle(965, 560, 131, 65, 0xe1ad01).setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', function() {self.raise()})
        .on('pointerover', () => raiseRect.fillColor = 0xffc400)
        .on('pointerout', () => raiseRect.fillColor = 0xe1ad01)
        raiseRect.isStroked = true
        raiseRect.lineWidth = 2

		let raiseText = this.add.text(976, 570, 'RAISE', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)

        let foldRect = this.add.rectangle(965, 640, 131, 65, 0xe1ad01).setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', function() {self.fold()})
        .on('pointerover', () => foldRect.fillColor = 0xffc400)
        .on('pointerout', () => foldRect.fillColor = 0xe1ad01)
        foldRect.isStroked = true
        foldRect.lineWidth = 2

		let foldText = this.add.text(980, 650, 'FOLD', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)

        let callRect = this.add.rectangle(1115, 640, 131, 65, 0xe1ad01).setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', function() {self.call()})
        .on('pointerover', () => callRect.fillColor = 0xffc400)
        .on('pointerout', () => callRect.fillColor = 0xe1ad01)
        callRect.isStroked = true
        callRect.lineWidth = 2

		let callText = this.add.text(1130, 650, 'CALL', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)

        let callPlus = this.add.text(1202, 570, '+', {
            color: '#e1ad01', 
            fontFamily: 'Bahnschrift', 
            fontSize:80, 
            align:'justify'
        }).setOrigin(0)
        .setStroke('#ffffff', 3)
        .setPadding(0, -25, 0, -25)
        .setInteractive()
        .on('pointerdown', () => self.incRaise())
        .on('pointerover', () => callPlus.setColor('#ffc400'))
        .on('pointerout', () => callPlus.setColor('#e1ad01'))

        let callMinus = this.add.text(1110, 580, '-', {
            color: '#e1ad01', 
            fontFamily: 'Bahnschrift', 
            fontSize:80, 
            align:'justify'
        }).setOrigin(0)
        .setStroke('#ffffff', 3)
        .setPadding(0, -40, 0, -30)
        .setInteractive()
        .on('pointerdown', () => self.decRaise())
        .on('pointerover', () => callMinus.setColor('#ffc400'))
        .on('pointerout', () => callMinus.setColor('#e1ad01'))

        let callNum = this.add.text(1177, 590, callVal, {
            color: '#e1ad01', 
            fontFamily: 'Bahnschrift', 
            fontSize:60, 
            align:'center'
        }).setOrigin(0.5)
        .setStroke('#ffffff', 3)

        // create the dropzone to place the card in
        this.zone = new Zone(this)
        this.playerZone = this.zone.renderZone(0)
        this.enemyZone = this.zone.renderZone(1)
        this.enemyZone.disableInteractive()
        this.outline = this.zone.renderOutline(this.playerZone, 0)
        this.outline = this.zone.renderOutline(this.enemyZone, 1)

        let enemyText = this.add.text(878, 295, 'Current Bet:', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:38, 
            align:'justify'
        }).setOrigin(0)

        let currentBetText = this.add.text(1093, 295, currentBet + ' Air-Bios', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:38, 
            align:'left'
        }).setOrigin(0)

        let totalText = this.add.text(915, 345, 'Total Pot:', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:38, 
            align:'justify'
        }).setOrigin(0)
        
        let potText = this.add.text(1080, 345, pot + ' Air-Bios', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:38, 
            align:'left'
        }).setOrigin(0)

        let pBalance = this.add.text(70, 580, 'Player Balance:', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)
        let pBiosText = this.add.text(100, 630, pBios + ' Air-Bios', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)

        let eBalance = this.add.text(70, 40, 'Enemy Balance:', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)
        let eBiosText = this.add.text(100, 90, eBios + ' Air-Bios', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'justify'
        }).setOrigin(0)

        let personalText = this.add.text(1082, 415, ' ', {
                color: 'white', 
                fontFamily: 'Bahnschrift', 
                fontSize:40, 
                align:'center'
        }).setOrigin(0.5)

        let numText = this.add.text(672, 220, "", {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'center'
        }).setOrigin(0.5)

        // This text could be used to display the values of each card after every round
        // calc.js supports this by returning these values, but it is currently unimplemented
        // as it would take up too much screenspace

        // let pRevealText = this.add.text(672, 510, pReveal, {
        //     color: 'white', 
        //     fontFamily: 'Bahnschrift', 
        //     fontSize:40, 
        //     align:'center'
        // }).setOrigin(0.5)

        // let eRevealText = this.add.text(672, 230, eReveal, {
        //     color: 'white', 
        //     fontFamily: 'Bahnschrift', 
        //     fontSize:40, 
        //     align:'center'
        // }).setOrigin(0.5)

        let result = ' '
        let resultText = this.add.text(672, 510, result, {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'center'
        }).setOrigin(0.5)

        this.updateText = () => {
            currentBetText.setText(currentBet + ' Air-Bios')
            potText.setText(pot + ' Air-Bios')
            //anteText.setText(ante + ' Air-Bios')
            pBiosText.setText(pBios + ' Air-Bios')
            eBiosText.setText(eBios + ' Air-Bios')

        }

        this.fold = () => {
            if (firstBet == 1 && self.betting) {
                // self.checkCalamity()
                console.log('Fold!')
                eBios += pot
                pot = 0
                self.socket.emit('swapBettors', false)
                self.socket.emit('playerFolds', self.isPlayerA)
                currentBet = 0
                this.updateText()
                resultText.setText('You folded!')

                self.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        resultText.setText('')
                    }
                })

                self.time.addEvent({
                    delay: 4000,
                    callback: () => { self.checkVictory() }
                })
            }
        }

        this.socket.on('enemyFolds', function(isA) {
            if (isA != self.isPlayerA) {
                // self.checkCalamity()
                pBios += pot
                pot = 0
                currentBet = 0
                self.updateText()
                resultText.setText('Enemy folded!')

                self.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        resultText.setText('')
                    }
                })

                self.time.addEvent({
                    delay: 4000,
                    callback: () => { self.checkVictory() }
                })
            }
        })

        this.raise = () => {
            if (firstBet == 1 && self.betting && pBios >= callVal + currentBet && eBios >= callVal + currentBet) {
                console.log('Raise!')
                pBios -= callVal + self.raiseAmount
                pot += callVal + self.raiseAmount
                firstBet = 0
                self.raiseAmount += callVal

                self.updateText()
                personalText.setText('Enemy\'s turn to bet')
                resultText.setText('You raised ' + callVal + ' Air-Bios!')
                self.socket.emit('playerRaises', self.isPlayerA, self.raiseAmount)
            }
        }

        this.socket.on('enemyRaises', function(isA, raiseAmount) {
            if (isA != self.isPlayerA) {
                enemyRaised = 1
                self.raiseAmount = raiseAmount

                pot += raiseAmount
                eBios -= raiseAmount

                firstBet = 1
                enemyCalled = 0
                currentBet = raiseAmount

                self.updateText()
                personalText.setText('Your turn to bet')
                resultText.setText('Enemy raised ' + raiseAmount + ' Air-Bios!')
            }
        })

        this.call = () => {
            if (firstBet == 1 && self.betting) {
                resultText.setText('You called!')
                // If enemy has called, proceed to showdown
                if (enemyCalled == 1) {
                    // self.checkCalamity()
                    // self.time.addEvent({
                    //     delay: calamity ? 3000 : 0,
                    //     callback: () => {
                    // calamity = 0

                    // Check who has better hand
                    if (self.results[0].value > self.results[1].value) {
                        pBios += pot
                        pot = 0
                    }
                    else {
                        eBios += pot
                        pot = 0
                    }

                    playerCalled = 0
                    enemyCalled = 0
                    self.socket.emit('swapBettors', true)
                    currentBet = 0
                    self.updateText()

                    self.time.addEvent({
                        delay: 1000,
                        callback: () => {
                            resultText.setText('')
                        }
                    })
                    self.socket.emit('playerCalls', self.isPlayerA)
                    self.time.addEvent({
                        delay: 4000,
                        callback: () => { self.checkVictory() }
                    })
                }
                else {
                    pBios -= self.raiseAmount
                    pot += self.raiseAmount

                    self.updateText()
                    self.socket.emit('playerCalls', self.isPlayerA)
                    firstBet = 0
                    playerCalled = 1
                    personalText.setText('Enemy\'s turn to bet')
                }
                console.log('Call!')
            }
        }

        this.socket.on('enemyCalls', function(isA) {
            if (isA != self.isPlayerA) {
                // If enemy has called, proceed to showdown
                if (playerCalled == 1) {
                    // Check who has better hand
                    if (self.results[0].value > self.results[1].value) {
                        pBios += pot
                        pot = 0
                    }
                    else {
                        eBios += pot
                        pot = 0
                    }

                    playerCalled = 0
                    enemyCalled = 0
                    currentBet = 0
                    resultText.setText('Enemy called!')

                    self.time.addEvent({
                        delay: 2000,
                        callback: () => {
                            resultText.setText('')
                        }
                    })
                    self.updateText()
                    self.time.addEvent({
                        delay: 4000,
                        callback: () => { self.checkVictory() }
                    })
                }
                else {
                    eBios -= self.raiseAmount
                    pot += self.raiseAmount

                    self.updateText()
                    self.raiseAmount = 0
                    enemyCalled = 1
                    firstBet = 1

                    personalText.setText('Your turn to bet')
                    resultText.setText('Enemy called!')
                }
            }
        })

        // Increase raise amount by 1
        this.incRaise = () => {
            if (callVal == 1) {
                callMinus.setInteractive()
            }
            if (callVal == 4) {
                callPlus.setColor('#e1ad01')
                callPlus.disableInteractive()
            }
            if (callVal <= 4) {
                callVal++
            }
            callNum.setText(callVal)
        }

        // Decrease raise amount by 1
        this.decRaise = () => {
            if (callVal == 5) {
                callPlus.setInteractive()
            }
            if (callVal == 2) {
                callMinus.setColor('#e1ad01')
                callMinus.disableInteractive()
            }
            if (callVal >= 2) {
                callVal--
            }
            callNum.setText(callVal)
        }

        let winScreen = this.add.rectangle(0, 0, 1500, 1500, 0x000000, 0).setOrigin(0).setDepth(1);
        let currentTime = 0

        let victoryText = this.add.text(665, 300, "", {
            color: '#e1ad01', 
            fontFamily: 'Bahnschrift', 
            fontSize: 60, 
            align:'center'
        }).setOrigin(0.5)
        .setStroke('#ffffff', 3).setAlpha(0).setDepth(2)
        
        let repeatText = this.add.text(
            600, 420, "PLAY AGAIN?"
        ).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#00ffff').setAlpha(0).setDepth(2).disableInteractive()

        repeatText.on('pointerdown', function () {
            self.socket.emit('resetGame', self.isPlayerA)
            repeatText.setColor('#00ffff')
        })

        repeatText.on('pointerover', function () {
            repeatText.setColor('#ff69b4')
        })

        repeatText.on('pointerout', function () {
            repeatText.setColor('#00ffff')
        })

        repeatText.on('pointerdown', function () {
            self.socket.emit('pickCards', self.isPlayerA)
            repeatText.setAlpha(0)
        })

        // Handle player or enemy victory
        this.checkVictory = (isVic, isPlayerA) => {
            if (pBios <= 0 || eBios <= 0 || isVic) {
                // Disable player's cards
                for (const item of playerArray) {
                    if (item.scene !== undefined) {
                        item.disableInteractive()
                    }
                }

                // Check which player won and which player it is displaying for
                if (pBios >= eBios) {
                    victoryText.setText(self.isPlayerA ? "YOU WON" : "ENEMY WON")
                }
                else {
                    victoryText.setText(self.isPlayerA ? "ENEMY WON" : "YOU WON")
                }

                // Fade in the low opacity black screen
                self.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        for (let i = 0; i <= 80; i++) {
                            self.time.addEvent({
                                delay: currentTime,
                                callback: () => {
                                    winScreen.fillAlpha = i/100
                                }
                            })
                            currentTime += 10
                        }
                    }
                })

                // Fade in the victory text and repeat game text the same way
                currentTime = 0
                self.time.addEvent({
                    delay: 1800,
                    callback: () => {
                        for (let i = 0; i <= 100; i++) {
                            self.time.addEvent({
                                delay: currentTime,
                                callback: () => {
                                    victoryText.setAlpha(i/100)
                                }
                            })
                            currentTime += 10
                        }
                    }
                })

                currentTime = 0
                self.time.addEvent({
                    delay: 2500,
                    callback: () => {
                        repeatText.setInteractive()
                        for (let i = 0; i <= 100; i++) {
                            self.time.addEvent({
                                delay: currentTime,
                                callback: () => {
                                    repeatText.setAlpha(i/100)
                                }
                            })
                            currentTime += 10
                        }
                    }
                })
            }
        }

        // this.input.keyboard.on('keydown-W', function () {self.checkVictory(true)})

		this.dealCards = () => {
            self.socket.emit('pickCards', self.isPlayerA)
        }

        this.reset = () => {
            console.log("Sent reset request to server")
            self.socket.emit('resetGame')
            self.socket.emit('pickCards', self.isPlayerA)
        }

        // Triggered upon either player choosing to play again
        this.socket.on('resetGame', function () {
            // Destroy all the player cards
            for (const item of playerArray) {
                if (item.scene !== undefined) {
                    item.destroy()
                }
            }

            // Remove the victory screen
            winScreen.fillAlpha = 0
            victoryText.setAlpha(0)
            repeatText.setAlpha(0)
            repeatText.disableInteractive()

            // Reset all modified variables
            enemyArray = []
            playerArray = []
            playerPlayed = 0
            enemyPlayed = 0
            let newPlayer = new Card(self)
            ante = 1
            pBios = 25
            eBios = 25
            callVal = 1
            firstBet = 2
            currentBet = 0
            enemyRaised = 0
            playerCalled = 0
            enemyCalled = 0
            prevBet = 0
            self.raiseAmount = 0
            pot = 0
            playerTotalBet = 0            
            calc = new Calc(this)
        })

        // After values for the cards have been generated in the server, create the cards for player and enemy
        this.socket.on('cardsPicked', function (isA, playerVals, enemyVals) {
            // Check which player it is generating cards for
            if (isA != self.isPlayerA) {
                // Generate player and enemy cards
                for (let i = 0; i < 5; i++) {
                    let enemyCard = new Card(self)
                    enemyArray[i] = enemyCard.render(475 + (i * 100), 75, 'card', enemyVals[i], i)
                    let playerCard = new Card(self)
                    playerArray[i] = playerCard.render(475 + (i * 100), 645, 0, playerVals[i], i)
                }
            }

            else {
                for (let i = 0; i < 5; i++) {
                    let enemyCard = new Card(self)
                    enemyArray[i] = enemyCard.render(475 + (i * 100), 75, 'card', playerVals[i], i)
                    let playerCard = new Card(self)
                    playerArray[i] = playerCard.render(475 + (i * 100), 645, 0, enemyVals[i], i)
                }
            }

            self.dealText.disableInteractive()
        })

        this.dealText = this.add.text(100, 370, ['DEAL CARDS']).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#708090').disableInteractive()

        this.dealText.on('pointerdown', function () {
            self.socket.emit('pickCards', self.isPlayerA)
            self.dealText.setColor('#00ffff')
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4')
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff')
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX
            gameObject.y = dragY
        })

        this.input.on('dragstart', function (pointer, gameObject) {
            self.children.bringToTop(gameObject)
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX
                gameObject.y = gameObject.input.dragStartY
            }
        })

        // If player drops card into dropzone
        this.input.on('drop', function (pointer, gameObject, dropZone) {
            tempZone = dropZone

            // If the dropzone is empty
            if (dropZone.data.values.cards == 0) {
                dropZone.data.values.cards = 1
                // Create a card facing downards in the dropzone and destroy the original dragged card
                tempImg2 = this.scene.add.image(800, 375, 'card').setScale(0.15)
                gameObject.destroy()
                
                // Display it for the other player
                self.socket.emit('enemyPlays', gameObject.index, self.isPlayerA, gameObject.value)
                playerPlayed = 1
                playerVal = gameObject.value

                // Go to betting if other player already played
                if (enemyPlayed) {
                    self.socket.emit('revealCards', playerVal, enemyVal)
                }
            }
            
            // Otherwise return the card back
            else {
                gameObject.x = gameObject.input.dragStartX
                gameObject.y = gameObject.input.dragStartY
            }
        })

	}

    
}
