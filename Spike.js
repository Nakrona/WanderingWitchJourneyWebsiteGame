// Spike.js - Aliased to Enemy for full backward compatibility
class Spike extends Enemy {
    constructor(x, y, width = 42, height = 42, imageSrc = "enemy.png", containerSelector = ".canvas-container", speed = 1.2) {
        super(x, y, width, height, imageSrc, containerSelector, speed);
    }
}