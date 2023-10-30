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
        let suits
        let pBios = 25
        let eBios = 25
        let callVal = 1
        let result = ' '
        let betting = false
        let firstBet = 2
        let enemyBet = 0
        let playerbet = 0
        let playerCalled = 0
        let enemyCalled = 0
        let prevBet = 0
        this.raiseAmount = 0

        this.isPlayerA = false
        
        let calc = new Calc(this)
        
        let pot = 0

		this.socket = io('http://localhost:3000')

        this.socket.on('connect', function () {
        	console.log('Connected!')
        })

        this.socket.on('isPlayerA', function () {
        	self.isPlayerA = true
        })

        this.socket.on('dealCards', function () { //MAKE THIS SERVER SIDED
            self.dealCards()
            self.dealText.disableInteractive()
        })

        this.socket.on('nextRound', function () {
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
                    suits = words
                    tempImg.destroy()
                    tempImg2.destroy()
                    let tempCard = new Card(self)
                    enemyArray[5] = tempCard.render(550, 375, 0, enemyVal, 5)
                    newPlayer = tempCard.render(800, 375, 0, playerVal, 5)
                    self.results = calc.law(playerVal, enemyVal)
                    self.betting = true
                    self.betPhase()
                }
            })
        })

        this.socket.on('swapBettors', function(resultsNeeded) {
            if (resultsNeeded) {
                self.time.addEvent({
                    delay: 1000,
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
            if (prevBet == firstBet) {
                firstBet = 1 - firstBet
            }
            ante += 1
            self.raiseAmount = 0
            self.betting = false
            prevBet = firstBet
            self.time.addEvent({
                delay: 3000,
                callback: () => {
                    self.socket.emit('nextRound')
                    personalText.setText('')
                    numText.setText('')
                }
            })
        })

        this.betPhase = () => {
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
            this.updateText()
        }

        this.add.image(650, 360, 'bg').setScale(1, 1)

		this.dealText = this.add.text(100, 370, ['DEAL CARDS']).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive()

		// this.nextText = this.add.text(100, 380, ['NEXT ROUND']).setFontSize(24).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive()

        // this.nextText.on('pointerdown', function () {
        //     self.socket.emit('nextRound')
        //     self.dealText.setColor('#00ffff')
        // })

        // this.nextText.on('pointerover', function () {
        //     self.nextText.setColor('#ff69b4')
        // })

        // this.nextText.on('pointerout', function () {
        //     self.nextText.setColor('#00ffff')
        // })

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

        this.zone = new Zone(this)
        this.playerZone = this.zone.renderZone(0)
        this.enemyZone = this.zone.renderZone(1)
        this.enemyZone.disableInteractive()
        this.outline = this.zone.renderOutline(this.playerZone, 0)
        this.outline = this.zone.renderOutline(this.enemyZone, 1)

        let enemyText = this.add.text(895, 295, 'Enemy Bet:', {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:38, 
            align:'justify'
        }).setOrigin(0)

        let enemyBetText = this.add.text(1093, 295, enemyBet + ' Air-Bios', {
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

        // let roundText = this.add.text(955, 395, 'Ante:', {
        //     color: 'white', 
        //     fontFamily: 'Bahnschrift', 
        //     fontSize:38, 
        //     align:'justify'
        // }).setOrigin(0)

        // let anteText = this.add.text(1050, 395, ante + ' Air-Bios', {
        //     color: 'white', 
        //     fontFamily: 'Bahnschrift', 
        //     fontSize:38, 
        //     align:'justify'
        // }).setOrigin(0)


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

        //let personalText = this.add.text(672, 510, ' ', {
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

        let resultText = this.add.text(672, 510, result, {
            color: 'white', 
            fontFamily: 'Bahnschrift', 
            fontSize:40, 
            align:'center'
        }).setOrigin(0.5)

        this.updateText = () => {
            enemyBetText.setText(enemyBet + ' Air-Bios')
            potText.setText(pot + ' Air-Bios')
            //anteText.setText(ante + ' Air-Bios')
            pBiosText.setText(pBios + ' Air-Bios')
            eBiosText.setText(eBios + ' Air-Bios')

        }

        this.fold = () => {
            if (firstBet == 1 && self.betting) {
                console.log('Fold!')
                eBios += pot
                pot = 0
                self.socket.emit('swapBettors', false)
                self.socket.emit('playerFolds', self.isPlayerA)
                this.updateText()
                resultText.setText('You folded!')
                self.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        resultText.setText('')
                    }
                })
            }
        }

        this.socket.on('enemyFolds', function(isA) {
            if (isA != self.isPlayerA) {
                pBios += pot
                pot = 0
                self.updateText()
                resultText.setText('Enemy folded!')
                self.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        resultText.setText('')
                    }
                })
            }
        })

        this.raise = () => {
            if (firstBet == 1 && self.betting) {
                console.log('Raise!')
                if (callVal > pBios) {
                    callVal = pBios
                }
                pBios -= callVal
                pot += callVal
                firstBet = 0
                self.raiseAmount += callVal
                self.updateText()
                personalText.setText('Enemy\'s turn to bet')
                resultText.setText('You raised ' + callVal + ' Air-Bios!')
                self.socket.emit('playerRaises', self.isPlayerA, callVal)
            }
        }

        this.socket.on('enemyRaises', function(isA, raiseAmount) {
            if (isA != self.isPlayerA) {
                self.raiseAmount = raiseAmount
                pot += raiseAmount
                eBios -= raiseAmount
                firstBet = 1
                enemyCalled = 0
                self.updateText()
                personalText.setText('Your turn to bet')
                resultText.setText('Enemy raised ' + raiseAmount + ' Air-Bios!')
            }
        })

        this.call = () => {
            if (firstBet == 1 && self.betting) {
                resultText.setText('You called!')
                if (enemyCalled == 1) {
                    //showdown
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
                    self.updateText()
                    self.time.addEvent({
                        delay: 1000,
                        callback: () => {
                            resultText.setText('')
                        }
                    })
                    self.socket.emit('playerCalls', self.isPlayerA)
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
                console.log(playerCalled)
                if (playerCalled == 1) {
                    
                    //showdown
                    //if player result > enemyresult move pot
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
                    resultText.setText('Enemy called!')
                    self.time.addEvent({
                        delay: 2000,
                        callback: () => {
                            resultText.setText('')
                        }
                    })
                    self.updateText()
                }
                else {
                    console.log(self.raiseAmount)
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

		this.dealCards = () => {
            self.socket.emit('pickCards', self.isPlayerA)
        	// for (let i = 0; i < 5; i++) {
            //     let val = Phaser.Math.Between(6, 64)
            //     while (pickedVals.includes(val)) {
            //         val = Phaser.Math.Between(6, 64)
            //     }
            //     pickedVals.push(val)
            //     //console.log(pickedVals)
            //     let enemyCard = new Card(this)
            //     enemyArray[i] = enemyCard.render(475 + (i * 100), 75, 'card', val, i)
            //     let val2 = Phaser.Math.Between(6, 64)
            //     while (pickedVals.includes(val2)) {
            //         val2 = Phaser.Math.Between(6, 64)
            //     }
            //     pickedVals.push(val2)
            //     let playerCard = new Card(this)
            //     playerArray[i] = playerCard.render(475 + (i * 100), 645, 0, val2, i)
            // }
    	}

        this.socket.on('cardsPicked', function (isA, playerVals, enemyVals) {
            if (isA != self.isPlayerA) {
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

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            tempZone = dropZone
            if (dropZone.data.values.cards == 0) {
                dropZone.data.values.cards = 1
                tempImg2 = this.scene.add.image(800, 375, 'card').setScale(0.15)
                gameObject.destroy()
                gameObject.destroy()
                self.socket.emit('enemyPlays', gameObject.index, self.isPlayerA, gameObject.value)
                playerPlayed = 1
                playerVal = gameObject.value
                if (enemyPlayed) {
                    self.socket.emit('revealCards', playerVal, enemyVal)
                }
            }
            else {
                gameObject.x = gameObject.input.dragStartX
                gameObject.y = gameObject.input.dragStartY
            }
        })


	}

    
}
