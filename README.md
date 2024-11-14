# Air Poker

An online multiplayer 1v1 poker variation involving maths and memory with slight elements of strategy. The concept originates from the japanese manga series *Usogui*. The individual clients are hosted using github pages and the server is hosted using Render. I used this project as a fun way to learn javascript from scratch, it's powered by phaser and due to server limitations it currently supports one two-player lobby running at a time. You can play it at https://arturnuriev1.github.io/ (the server might take around 30 seconds to spin back up when first opening it).

## Rules

Each player is given five cards which each have a number from 6 to 64 written on them. This number acts as the best possible sum of a poker hand that can be made from a regular deck of cards (e.g. 15 would be a straight flush of A + 2 + 3 + 4 + 5). Each turn players choose which card they want to play and once both players have chosen the cards are flipped over and betting begins. The player with the best simulated poker hand wins.

A key rule is that whenever a poker hand is created the cards that it uses up cannot be reused afterwards. As an example, if in round 1 a card with the number 12 is played, it would create a 4oaK aces plus eight. If a card with the number 13 is played in the following turn, it cannot be a 4oaK aces plus nine as all the aces are already used up, so it will instead be a 4oaK twos plus five.

Players take turns having the first bet, except for the first round where the person with the smaller number played bets first. Ante begins at 1 chip (referred to as Air-Bios) and increases by 1 every round. Folding will not reveal which card would have won, making it harder to keep track of which playing cards have been used. A player will lose after losing all their Air-Bios, or after five rounds the game will end and the person with the most Air-Bios remaining wins.
