/**
 * Skill3.js
 * Implementasi Skill 3 (Composite Pattern & OOP):
 * Gabungan dari Skill 1 dan Skill 2 yang melingkari (orbit) karakter pengguna (Caster).
 * Proyektil berputar mengelilingi karakter dan mengikuti pergerakan karakter tersebut.
 */

class OrbitingProjectile extends BaseSkill {
    constructor(caster, angleOffset, radius = 62, orbType = 1, containerSelector = ".canvas-container") {
        const imageSrc = orbType === 1 ? "Skill1.gif" : "Skill2.gif";
        const width = orbType === 1 ? 40 : 44;
        const height = orbType === 1 ? 34 : 36;
        const faction = caster.faction || Faction.B;

        super({
            x: caster.x,
            y: caster.y,
            width,
            height,
            speed: 0,
            faction,
            damage: 1,
            imageSrc,
            className: `projectile-gif skill3-orb skill3-orb-type${orbType}`,
            containerSelector
        });

        this.caster = caster;
        this.angle = angleOffset;
        this.angularSpeed = 0.045; // Kecepatan rotasi mengitari karakter (~2.6 rad/dtk)
        this.radius = radius;
        this.orbType = orbType; // 1 = Es/Biru (Skill 1), 2 = Api/Oranye (Skill 2)
        this.animationFrame = 0;

        // Posisikan segera pada koordinat orbit awal
        this.updatePosition();
    }

    updatePosition() {
        if (!this.caster || !this.caster.isAlive || (this.caster.hp !== undefined && this.caster.hp <= 0)) {
            this.destroy();
            return;
        }

        const center = this.caster.getCenter 
            ? this.caster.getCenter() 
            : { x: this.caster.x + (this.caster.width || 42) / 2, y: this.caster.y + (this.caster.height || 42) / 2 };

        this.x = center.x + Math.cos(this.angle) * this.radius - this.width / 2;
        this.y = center.y + Math.sin(this.angle) * this.radius - this.height / 2;

        this.syncDOMPosition();
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isAlive) return;

        if (!this.caster || !this.caster.isAlive || (this.caster.hp !== undefined && this.caster.hp <= 0)) {
            this.destroy();
            return;
        }

        this.angle += this.angularSpeed;
        this.animationFrame++;
        this.updatePosition();
    }

    syncDOMPosition() {
        if (this.isAssetAvailable && this.domElement) {
            // Rotasi visual proyektil searah dengan orbit
            const deg = (this.angle * 180 / Math.PI) + 90;
            this.domElement.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${deg}deg)`;
        }
    }

    draw(context) {
        if (!this.isAlive) return;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Fallback visual Canvas jika gambar GIF belum termuat
        if (!this.isAssetAvailable) {
            context.save();
            const rad = this.width / 2;
            const grad = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, rad);

            if (this.orbType === 1) {
                // Aura Es/Biru (Skill 1)
                grad.addColorStop(0, "rgba(56, 189, 248, 1)");
                grad.addColorStop(0.6, "rgba(37, 99, 235, 0.7)");
                grad.addColorStop(1, "rgba(30, 64, 175, 0)");
            } else {
                // Aura Api/Plasma Oranye (Skill 2)
                grad.addColorStop(0, "rgba(254, 240, 138, 1)");
                grad.addColorStop(0.5, "rgba(249, 115, 22, 0.8)");
                grad.addColorStop(1, "rgba(185, 28, 28, 0)");
            }

            context.fillStyle = grad;
            context.beginPath();
            context.arc(centerX, centerY, rad, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    }
}

class Skill3 {
    constructor(caster, options = {}) {
        this.caster = caster;
        this.faction = caster.faction || Faction.B;
        this.isAlive = true;
        this.radius = options.radius || 62;
        this.containerSelector = options.containerSelector || ".canvas-container";
        this.duration = options.duration !== undefined ? options.duration : 7000; // Durasi aktif Skill 3: 7 detik (7000ms)
        this.spawnTime = Date.now();

        // Gabungan Skill 1 dan Skill 2 (4 bola melingkar berselang-seling: Skill 1, Skill 2, Skill 1, Skill 2)
        this.orbs = [];
        const orbCount = options.orbCount || 4;
        for (let i = 0; i < orbCount; i++) {
            const angleOffset = (i * (2 * Math.PI / orbCount));
            const orbType = (i % 2 === 0) ? 1 : 2; // Berselang-seling Skill 1 dan Skill 2
            const orb = new OrbitingProjectile(
                this.caster,
                angleOffset,
                this.radius,
                orbType,
                this.containerSelector
            );
            this.orbs.push(orb);
        }
    }

    getRemainingSeconds() {
        if (!this.duration) return 0;
        const elapsed = Date.now() - this.spawnTime;
        return Math.max(0, (this.duration - elapsed) / 1000);
    }

    getOrbs() {
        return this.orbs;
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isAlive) return;

        // Cek apakah durasi aktif 7 detik telah berakhir
        if (this.duration > 0 && (Date.now() - this.spawnTime >= this.duration)) {
            this.destroy();
            return;
        }

        // Jika caster mati atau hancur, musnahkan seluruh orbit
        if (!this.caster || !this.caster.isAlive || (this.caster.hp !== undefined && this.caster.hp <= 0)) {
            this.destroy();
            return;
        }

        // Perbarui setiap orb dan buang orb yang sudah hancur
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            orb.update(canvasWidth, canvasHeight);
            if (!orb.isAlive) {
                this.orbs.splice(i, 1);
            }
        }

        // Jika seluruh bola orbit telah habis, skill selesai
        if (this.orbs.length === 0) {
            this.destroy();
        }
    }

    draw(context) {
        if (!this.isAlive || !this.caster) return;

        context.save();
        const center = this.caster.getCenter 
            ? this.caster.getCenter() 
            : { x: this.caster.x + (this.caster.width || 42) / 2, y: this.caster.y + (this.caster.height || 42) / 2 };

        // Lingkaran sihir transparan yang mengitari karakter pengguna
        context.strokeStyle = "rgba(168, 85, 247, 0.35)"; // Ungu magis
        context.lineWidth = 1.5;
        context.setLineDash([4, 6]);
        context.beginPath();
        context.arc(center.x, center.y, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        // Gambar setiap orb
        this.orbs.forEach(orb => orb.draw(context));
    }

    canDamage(target) {
        if (!this.isAlive || !target) return false;
        return Faction.canDamage(this, target);
    }

    /**
     * Memeriksa tabrakan dari setiap orb yang sedang aktif melingkari karakter.
     * @param {Object} target 
     * @returns {OrbitingProjectile|null} Orb yang bertabrakan, atau null jika tidak ada
     */
    checkCollisionWithTarget(target) {
        if (!this.isAlive || !target || !this.canDamage(target) || !this.orbs) return null;

        for (let i = 0; i < this.orbs.length; i++) {
            const orb = this.orbs[i];
            if (orb && orb.isAlive && orb.checkCollision(target)) {
                return orb;
            }
        }
        return null;
    }

    destroy() {
        this.isAlive = false;
        if (this.orbs) {
            this.orbs.forEach(orb => {
                if (orb && typeof orb.destroy === "function") {
                    orb.destroy();
                }
            });
            this.orbs = [];
        }
        if (this.caster) {
            if (this.caster.activeSkill3 === this) {
                this.caster.activeSkill3 = null;
            }
            if (this.caster.skill3 === this) {
                this.caster.skill3 = null;
            }
        }
    }
}
