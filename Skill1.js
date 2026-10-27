/**
 * Skill1.js
 * Implementasi Skill 1 Proyektil (Turunan dari BaseSkill - OOP, SRP & Liskov Substitution).
 * Proyektil energi es biru yang meluncur lurus ke depan.
 */
class Skill1 extends BaseSkill {
    constructor(x, y, dirX, dirY = 0, containerSelector = ".canvas-container", faction = Faction.A) {
        const speed = 8;
        super({
            x,
            y,
            width: 44,
            height: 36,
            vx: dirX * speed,
            vy: dirY * speed,
            speed,
            faction,
            damage: 1,
            imageSrc: "Skill1.gif",
            className: "projectile-gif skill1-gif",
            containerSelector
        });

        this.dirX = dirX;
        this.dirY = dirY;
    }

    syncDOMPosition() {
        if (this.isAssetAvailable && this.domElement) {
            const scaleX = this.dirX >= 0 ? 1 : -1;
            this.domElement.style.transform = `translate(${this.x}px, ${this.y}px) scaleX(${scaleX})`;
        }
    }

    draw(context) {
        if (!this.isAssetAvailable && this.isAlive) {
            context.save();
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Outer glowing aura
            const gradient = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, this.width / 2);
            gradient.addColorStop(0, "rgba(56, 189, 248, 0.95)"); // light blue
            gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.6)"); // blue
            gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
            context.fill();

            // Inner energy core
            context.fillStyle = "#ffffff";
            context.beginPath();
            context.ellipse(centerX, centerY, this.width / 3.2, this.height / 4, 0, 0, Math.PI * 2);
            context.fill();

            // Dynamic trail particles
            for (let i = 1; i <= 3; i++) {
                const trailX = centerX - this.dirX * (i * 9);
                const trailY = centerY + Math.sin(this.animationFrame * 0.4 + i) * 3;
                context.fillStyle = `rgba(56, 189, 248, ${0.8 - i * 0.22})`;
                context.beginPath();
                context.arc(trailX, trailY, Math.max(1, 4 - i), 0, Math.PI * 2);
                context.fill();
            }

            context.restore();
        }
    }
}
