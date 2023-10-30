import Phaser from 'phaser'

let cards = {
    1 : 4, 2 : 4, 3 : 4, 4 : 4, 5 : 4, 6 : 4, 7 : 4, 8 : 4, 9 : 4, 10 : 4, 11 : 4, 12 : 4, 13 : 4
}

// let suits = [
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
//  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
// ]

let order = [1, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]

let values = {
    1 : 41, 2 : 2, 3 : 3, 4 : 5, 5 : 7, 6 : 11, 7 : 13, 8 : 17, 9 : 19, 10 : 23, 11 : 29, 12 : 31, 13 : 37
}

let calamity = false

let ranks = {
    100000 : "High Card", 200000 : "Pair", 300000 : "2 pairs", 400000 : "3 of a kind", 
    500000 : "Straight", 600000 : "Flush", 700000 : "Full House", 800000 : "4 of a kind",
    900000 : "Straight Flush", 1000000 : "Royal Straight Flush"
}

let playerResult = new Object()
let enemyResult = new Object()

// From what I understand, if suits are used in a specific order like they are here, it is
// impossible to have a non-flush straight, since that can only be achieved if the suits are
// used up in an irregular order. Similarly, high card isn't possible as it will always turn
// into a flush.

export default class Calc {
    constructor(scene) {
        this.law = (num, enemyNum) => {
            calamity = false
            console.log(cards)
            let oldCards = Object.assign({}, cards)
            this.solve(enemyNum)
            enemyResult = Object.assign({}, playerResult)
            let newCards = Object.assign({}, cards)
            cards = Object.assign({}, oldCards)
            //console.log(cards)
            this.solve(num)
            //merge newCards and cards based on differences from oldCards
            this.updateCards(oldCards, newCards)
            cards = Object.assign({}, oldCards)
            console.log(playerResult)
            return [playerResult, enemyResult, this.calamity]
        }
        this.updateCards = (oldCards, newCards) => {
            for (let i = 13; i >= 1; i--) {
                if (oldCards[i] != newCards[i] && oldCards[i] != cards[i]) {
                    oldCards[i] = Math.min(newCards[i], cards[i])
                    calamity = true
                    console.log('A calamity has occurred!')
                }
                else {
                    oldCards[i] = oldCards[i] - (oldCards[i]-newCards[i] + oldCards[i]-cards[i])
                }
            }
        }
        this.updateSuits = () => {
            console.log(cards)
            for (const [key, value] of Object.entries(cards)) {
                if (value <= 3) {
                    suits[0].splice(suits[0].indexOf(key), 1)
                }
                if (value <= 2) {
                    suits[1].splice(suits[1].indexOf(key), 1)
                }
                if (value <= 1) {
                    suits[2].splice(suits[2].indexOf(key), 1)
                }
                if (value == 0) {
                    suits[3].splice(suits[3].indexOf(key), 1)
                }
            }
            console.log(suits)
        }
        this.getSuits = (values) => {
            let result = []
            for (const card of values) {
                let found = false
                for (let i = 0; i < 4; i++) {
                    if (!found) {
                        for (const num of suits[i]) {
                            if (!found) {
                                if (num == card) {
                                    result.push([card, i])
                                    suits[i].splice(suits[i].indexOf(num), 1)
                                    console.log(suits)
                                    found = true
                                }
                            }
                        }
                    }
                }
            }
            console.log(result)
            return result
        }
        this.solve = (num) => {
            let score = 0
            if (num == 47) { //Royal straight flush
                if (cards[1] != 0 && cards[10] != 0 && cards[11] != 0 && cards[12] != 0 && cards[13] != 0) {
                    playerResult.value = 10000000000
                    playerResult.cards = [[10, cards[10]], [11, cards[11]], [12, cards[12]], [13, cards[13]], [1, cards[1]]]
                    cards[1] -= 1; cards[10] -= 1; cards[11] -= 1; cards[12] -= 1; cards[13] -= 1
                    return
                }
            }
            if (num % 5 == 0 && num > 10) { //Straight flush
                if (cards[num/5 - 2] != 0 && cards[num/5 - 1] != 0 && cards[num/5] != 0 && cards[num/5 + 1] != 0 && cards[num/5 + 2] != 0 && num < 60) {
                    playerResult.value = 9000000000 + num
                    playerResult.cards = []
                    for (let i = num/5 - 2; i <= num/5 + 2; i++) {
                        playerResult.cards.push([i, cards[i]])
                        cards[i] -= 1
                    }
                    return
                }
            }
            for (const i of order) { //4 of a kind
                if (cards[i] == 4 && cards[num-i*4] > 0 && num != i*5) {
                    console.log(ranks[800000], i, num-i*4)
                    playerResult.value = 8000000000 + values[num-i*4] + values[i]**4
                    playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [i, cards[i]-2], [i, cards[i]-3], [num-i*4, cards[num-i*4]]]
                    cards[i] = 0
                    cards[num-i*4] -= 1
                    return
                }
            }
            for (const i of order) { //Full house
                if (cards[i] >= 3 && (num - i*3) % 2 == 0 && cards[(num-i*3)/2] >= 2 && i*2 != (num - i*3)) {
                    console.log(ranks[700000], i, (num-i*3)/2)
                    playerResult.value = 7000000000 + values[num-i*3] + values[i]**4
                    playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [i, cards[i]-2], [num-i*3, cards[num-i*3]], [num-i*3, cards[num-i*3]-1]]
                    cards[i] -= 3
                    cards[(num-i*3)/2] -= 2
                    return
                }
            }
            for (var suit in cards) { //Flush
                suit = Number(suit)
                if (cards[suit] != 0 && suit <= (num-10)) { //1 + 2 + 3 + 4 = 10
                    for (var suit2 in cards) {
                        suit2 = Number(suit2)
                        if (cards[suit2] != 0 && (suit + suit2) <= (num - 6) && suit != suit2) {
                            for (var suit3 in cards) {
                                suit3 = Number(suit3)
                                if (cards[suit3] != 0 && (suit + suit2 + suit3) <= (num-3) && suit3 != suit2 && suit3 != suit) {
                                    for (var suit4 in cards) {
                                        suit4 = Number(suit4)
                                        if (cards[suit4] != 0 && (suit + suit2 + suit3 + suit4) <= (num-1) && suit4 != suit && suit4 != suit2 && suit4 != suit3) {
                                            for (var suit5 in cards) {
                                                suit5 = Number(suit5)
                                                if (cards[suit5] != 0 && (suit + suit2 + suit3 + suit4 + suit5) == num && suit5 != suit && suit5 != suit2 && suit5 != suit3 && suit5 != suit4) {
                                                    playerResult.value += 6000000000
                                                    playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [i, cards[i]-2], [num-i*3, cards[num-i*3]], [num-i*3, cards[num-i*3]-1]]
                                                    cards[suit], cards[suit2] -= 10000
                                                    cards[suit2] -= 1
                                                    cards[suit3] -= 1
                                                    cards[suit4] -= 1
                                                    cards[suit5] -= 1
                                                    let temp = [suit, suit2, suit3, suit4, suit5]
                                                    playerResult.value = 1
                                                    for (let j = 5; j > 0; j--) {
                                                        playerResult.value *= values[Math.max(temp)] * 10**j
                                                        temp = temp.splice(temp.indexOf(Math.max(temp)), 1)
                                                    }
                                                    console.log(ranks[600000], suit, suit2, suit3, suit4, suit5)
                                                    return
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //console.log('3 of a kind')
            for (const i of order) { //3 of a kind
                if (cards[i] >= 3 && (num - i*3) >= 3) {
                    for (var suit in cards) {
                        suit = Number(suit)
                        if (i*3 + suit < num) {
                            for (var suit2 in cards) {
                                suit2 = Number(suit)
                                if (i*3 + suit + suit2 == num && suit != suit2) {
                                    playerResult.value = 4000000000 + Math.max(values[suit], values[suit2])**4 + Math.min(values[suit], values[suit2]) + values[i]**5
                                    playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [i, cards[i]-2], [suit, cards[suit]], [suit2, cards[suit2]]]
                                    cards[i] -= 3
                                    cards[suit] -= 1
                                    cards[suit2] -= 1
                                    console.log(ranks[400000], i, i, i, suit, suit2)
                                    return
                                }
                            }
                        }
                    }
                }
            }
            //2 pairs, pair, high card and N/A
            //console.log('2 pairs:')
            for (const i of order) {
                if (cards[i] >= 2 && (num - i*2) >= 2) {
                    for (var suit in cards) {
                        suit = Number(suit)
                        if (i*2 + suit*2 < num && cards[suit] >= 1 && suit != i) {
                            for (var suit2 in cards) {
                                suit2 = Number(suit2)
                                if (i*2 + suit*2 + suit2 == num && suit != suit2 && suit2 != i && cards[suit2] >= 1) {
                                    playerResult.value = 3000000000 + Math.max(values[suit], values[i])**4 + Math.min(values[suit], values[i])**3 + values[suit2]
                                    playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [suit, cards[suit]], [suit, cards[suit]-1], [suit2, cards[suit2]]]
                                    cards[i] -= 2
                                    cards[suit] -= 2
                                    cards[suit2] -= 1
                                    console.log(ranks[300000], i, i, suit, suit, suit2)
                                    return
                                }
                            }
                        }
                    }
                }
            }
            //console.log('1 pair:')
            for (const i of order) {
                if (cards[i] >= 2 && (num - i*2) >= 2) {
                    for (var suit in cards) {
                        suit = Number(suit)
                        if (i*2 + suit < num && suit != i && cards[suit] >= 1) {
                            for (var suit2 in cards) {
                                suit2 = Number(suit2)
                                if (i*2 + suit + suit2 < num && suit != suit2 && suit2 != i && cards[suit2] >= 1) {
                                    for (var suit3 in cards) {
                                        suit3 = Number(suit3)
                                        if (i*2 + suit + suit2 + suit3 == num && suit3 != suit2 && suit3 != suit && suit3 != i && cards[suit3] >= 1) {
                                            cards[i] -= 2
                                            cards[suit] -= 1
                                            cards[suit2] -= 1
                                            cards[suit3] -= 1
                                            console.log(ranks[200000], i, i, suit, suit2, suit3)
                                            playerResult.value = 2000000000 + values[i] ** 4 * values[suit] * values[suit2] * values[suit3]
                                            playerResult.cards = [[i, cards[i]], [i, cards[i]-1], [suit, cards[suit]], [suit2, cards[suit2]], [suit3, cards[suit3]]]
                                            return
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            console.log('End reached!')
            playerResult.value = 0
            playerResult.cards = [0]
            return
        }
    }
}