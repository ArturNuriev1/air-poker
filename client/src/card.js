import Phaser from 'phaser'

var enemyArray = []
var playerArray = []
var image

export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, value, index) => {
            // Check whether a facedown or faceup card needs to be created
            if (sprite == 0) {
                var rect = scene.add.rectangle(0, 0, 101, 144, 0xffffff)
                rect.isStroked = true
                rect.strokeColor = 0x000000
                rect.lineWidth = 2

                // Create the number text on the card
                var text = scene.add.text(0, 0, value, {
                    color: 'black', 
                    fontFamily: 'Bahnschrift', 
                    fontSize:40, 
                    align:'justify'
                })
                text.setOrigin(0.5)
                text.setResolution(2)
                
                let card = scene.add.container(x, y, [rect, text]).setSize(100, 100).setInteractive()
                card.value = value
                scene.input.setDraggable(card)
                card.index = index
                playerArray.push(card)
                return card
            }
            else {
                let image = scene.add.image(x, y, sprite)
                image.setScale(0.15, 0.15).disableInteractive()
                image.value = value
                enemyArray.push(image)
                return image
            }
        }
        this.remove = () => {
            this.x = 10000
        }
    }
}