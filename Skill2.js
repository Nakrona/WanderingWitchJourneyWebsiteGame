/**
 * Skill2.js
 * Implementasi Skill 2 Proyektil (Turunan dari BaseSkill - OOP, SRP & Liskov Substitution).
 * Proyektil plasma api oranye-kuning yang meluncur lurus ke depan dengan kecepatan tinggi.
 */
class Skill2 extends BaseSkill {
    constructor(x, y, dirX, dirY = 0, containerSelector = ".canvas-container", faction = Faction.A) {
        const speed = 9;
        super({
            x,
            y,
            width: 52,
            height: 40,
            vx: dirX * speed,
            vy: dirY * speed,
            speed,
            faction,
            damage: 1,
            imageSrc: "Skill2.gif",
            className: "projectile-gif skill2-gif",
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

            // Outer fiery glow
            const gradient = context.createRadialGradient(centerX, centerY, 3, centerX, centerY, this.width / 2);
            gradient.addColorStop(0, "rgba(249, 115, 22, 0.95)"); // orange
            gradient.addColorStop(0.5, "rgba(239, 68, 68, 0.65)"); // red
            gradient.addColorStop(1, "rgba(185, 28, 28, 0)");
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
            context.fill();

            // Inner intense plasma core
            context.fillStyle = "#fef08a"; // bright yellow
            context.beginPath();
            context.ellipse(centerX, centerY, this.width / 2.8, this.height / 3.5, 0, 0, Math.PI * 2);
            context.fill();

            // Dual flame sparkles
            for (let i = 1; i <= 4; i++) {
                const trailX = centerX - this.dirX * (i * 10);
                const trailY1 = centerY + Math.sin(this.animationFrame * 0.5 + i) * 5;
                const trailY2 = centerY - Math.sin(this.animationFrame * 0.5 + i) * 5;

                context.fillStyle = `rgba(249, 115, 22, ${0.85 - i * 0.2})`;
                context.beginPath();
                context.arc(trailX, trailY1, Math.max(1, 4.5 - i), 0, Math.PI * 2);
                context.arc(trailX, trailY2, Math.max(1, 4.5 - i), 0, Math.PI * 2);
                context.fill();
            }

            context.restore();
        }
    }
}
