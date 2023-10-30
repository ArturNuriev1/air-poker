import Phaser from 'phaser'

import Game from './Game'

const config = {
	type: Phaser.AUTO,
    parent: "phaser-example",
    width: 1280,
    height: 720,
    scale: {
        // Fit to window
        mode: Phaser.Scale.FIT,
        // Center vertically and horizontally
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Game]
}

export default new Phaser.Game(config)
