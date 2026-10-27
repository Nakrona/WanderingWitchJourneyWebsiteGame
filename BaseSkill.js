/**
 * BaseSkill.js
 * Kelas dasar (Abstract Base Class) untuk semua skill dan proyektil (OOP, DRY & SOLID).
 * Menangani siklus hidup elemen DOM, posisi, pergerakan dasar, faksi, dan deteksi tabrakan.
 */
class BaseSkill {
    constructor(options = {}) {
        const {
            x = 0,
            y = 0,
            width = 44,
            height = 36,
            vx = 0,
            vy = 0,
            speed = 8,
            faction = Faction.A,
            damage = 1,
            imageSrc = "",
            className = "projectile-gif",
            containerSelector = ".canvas-container"
        } = options;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = vx;
        this.vy = vy;
        this.speed = speed;
        this.faction = faction;
        this.damage = damage;
        this.imageSrc = imageSrc;
        this.className = className;
        this.isAlive = true;
        this.isAssetAvailable = false;
        this.animationFrame = 0;
        this.domElement = null;

        if (this.imageSrc) {
            this.initDOM(containerSelector);
        }
    }

    initDOM(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        this.domElement = document.createElement("img");
        this.domElement.src = this.imageSrc;
        this.domElement.alt = "Skill Projectile";
        this.domElement.className = this.className;
        this.domElement.style.width = `${this.width}px`;
        this.domElement.style.height = `${this.height}px`;
        this.domElement.style.display = "none";

        if (this.domElement.complete && this.domElement.naturalWidth > 0) {
            this.isAssetAvailable = true;
            this.domElement.style.display = "block";
            this.syncDOMPosition();
        }

        this.domElement.addEventListener("load", () => {
            if (this.domElement && this.domElement.naturalWidth > 0) {
                this.isAssetAvailable = true;
                this.domElement.style.display = "block";
                this.syncDOMPosition();
            }
        });

        this.domElement.addEventListener("error", () => {
            this.isAssetAvailable = false;
            if (this.domElement) {
                this.domElement.style.display = "none";
            }
        });

        container.appendChild(this.domElement);
        this.syncDOMPosition();
    }

    syncDOMPosition() {
        if (this.isAssetAvailable && this.domElement) {
            this.domElement.style.transform = `translate(${this.x}px, ${this.y}px)`;
        }
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;
        this.animationFrame++;

        this.syncDOMPosition();

        if (canvasWidth && canvasHeight) {
            if (
                this.x < -this.width - 20 ||
                this.x > canvasWidth + 20 ||
                this.y < -this.height - 20 ||
                this.y > canvasHeight + 20
            ) {
                this.destroy();
            }
        }
    }

    destroy() {
        this.isAlive = false;
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
            this.domElement = null;
        }
    }

    canDamage(target) {
        if (!this.isAlive || !target) return false;
        return Faction.canDamage(this, target);
    }

    checkCollision(target) {
        if (!this.isAlive || !target) return false;

        const targetX = target.x;
        const targetY = target.y;
        const targetW = target.width || target.size || 0;
        const targetH = target.height || target.size || 0;

        return (
            this.x < targetX + targetW &&
            this.x + this.width > targetX &&
            this.y < targetY + targetH &&
            this.y + this.height > targetY
        );
    }

    checkCollisionWithSpike(target) {
        return this.checkCollision(target);
    }

    checkCollisionWithEnemy(target) {
        return this.checkCollision(target);
    }

    draw(context) {
        // Implementasi fallback Canvas pada turunan kelas jika dibutuhkan
    }
}
