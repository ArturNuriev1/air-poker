export default class Zone {
    constructor(scene) {
        this.renderZone = (type) => {
            if (type == 0) {
                let dropZone = scene.add.zone(800, 375, 105, 150).setRectangleDropZone(105, 150)
                dropZone.setData({ cards: 0 })
                return dropZone
            }

            else {
                let dropZone2 = scene.add.zone(550, 375, 105, 150).setRectangleDropZone(105, 150)
                dropZone2.setData({ cards: 0 })
                return dropZone2
            }
        }
        this.renderOutline = (dropZone, type) => {
            let dropZoneOutline = scene.add.graphics()

            if (type == 0) {
                dropZoneOutline.lineStyle(4, 0x000000)
            }
            else {
                dropZoneOutline.lineStyle(4, 0xff0000)
            }

            dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
        }
    }
}