/**
 * Coin.js - Aliased to Soul for backward compatibility.
 * Proyek telah bertransformasi menggunakan entitas Soul (SoulBlue.gif).
 */
class Coin extends Soul {
    constructor(canvasWidth, canvasHeight, hazards = [], player = null, containerSelector = ".canvas-container") {
        super(canvasWidth, canvasHeight, hazards, player, containerSelector);
    }
}
