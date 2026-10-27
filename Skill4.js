/**
 * Skill4.js
 * Implementasi Skill 4: Continuous Energy Beam (OOP, SRP & SOLID).
 * Menembakkan berkas sinar laser (beam) horizontal sesuai arah hadap karakter (Player).
 * - Durasi aktif: 2 detik (2000 ms).
 * - Menyerang secara berkelanjutan (tick rate) terhadap musuh (Faksi B) yang berada di jalur beam.
 * - Berkas laser bergerak dinamis mengikuti posisi dan arah hadap karakter selama 2 detik.
 * - Visual spektakuler: Dual-Layer Visual (Canvas Electric Lightning & Glow + DOM Neon Beam Filter).
 * - Menembus musuh dan menghancurkan bola proyektil Skill 3 milik musuh jika bersinggungan.
 */
class Skill4 extends BaseSkill {
    constructor(caster, options = {}) {
        const faction = caster.faction || Faction.A;
        super({
            x: caster.x,
            y: caster.y,
            width: 0,
            height: 0,
            speed: 0,
            faction,
            damage: options.damage || 1
        });

        this.caster = caster;
        this.duration = options.duration || 2000; // 2 detik aktif (2000 ms)
        this.startTime = Date.now();
        this.thickness = options.thickness || 38; // Ketebalan berkas laser
        this.tickRate = options.tickRate || 200; // Tick damage tiap 200 ms per target
        this.lastHitMap = new Map(); // Tracker interval damage per target
        this.dirX = 1;
        this.animationFrame = 0;
        this.particles = [];
        this.lightningBolts = [];
        this.containerSelector = options.containerSelector || ".canvas-container";
        this.domElement = null;

        // Inisialisasi posisi awal & DOM visual layer
        this.updatePosition(800, 480);
        this.initDOM(this.containerSelector);
    }

    isCasterAlive() {
        if (!this.caster) return false;
        if (this.caster.isAlive !== undefined) return this.caster.isAlive;
        if (this.caster.hp !== undefined) return this.caster.hp > 0;
        return true;
    }

    initDOM(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        this.domElement = document.createElement("div");
        this.domElement.className = "skill4-beam-fx";
        this.domElement.innerHTML = `
            <div class="beam-outer-aura"></div>
            <div class="beam-core-glow"></div>
            <div class="beam-white-laser"></div>
            <div class="beam-muzzle-flash"></div>
        `;
        container.appendChild(this.domElement);
        this.syncDOMPosition();
    }

    syncDOMPosition() {
        if (!this.domElement) return;

        this.domElement.style.transform = `translate(${this.x}px, ${this.y}px)`;
        this.domElement.style.width = `${this.width}px`;
        this.domElement.style.height = `${this.height}px`;

        const muzzle = this.domElement.querySelector(".beam-muzzle-flash");
        if (muzzle) {
            if (this.dirX === 1) {
                muzzle.style.left = "0px";
                muzzle.style.right = "auto";
            } else {
                muzzle.style.left = "auto";
                muzzle.style.right = "0px";
            }
        }
    }

    updatePosition(canvasWidth = 800, canvasHeight = 480) {
        if (!this.isCasterAlive()) {
            this.destroy();
            return;
        }

        const center = this.caster.getCenter 
            ? this.caster.getCenter() 
            : { x: this.caster.x + (this.caster.size || 48) / 2, y: this.caster.y + (this.caster.size || 48) / 2 };

        // Arah hadap: facingDirection === -1 (Kanan), facingDirection === 1 (Kiri)
        this.dirX = (this.caster.facingDirection === -1) ? 1 : -1;

        const originY = center.y - this.thickness / 2;

        if (this.dirX === 1) {
            // Menembak ke arah KANAN
            const originX = center.x + 14;
            this.x = originX;
            this.y = originY;
            this.width = Math.max(0, canvasWidth - originX + 30);
            this.height = this.thickness;
        } else {
            // Menembak ke arah KIRI
            const originX = center.x - 14;
            this.x = -20;
            this.y = originY;
            this.width = Math.max(0, originX + 20);
            this.height = this.thickness;
        }

        this.syncDOMPosition();
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isAlive) return;

        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.destroy();
            return;
        }

        if (!this.isCasterAlive()) {
            this.destroy();
            return;
        }

        this.animationFrame++;
        this.updatePosition(canvasWidth, canvasHeight);

        // Generate busur petir plasma (electric lightning arcs)
        if (this.animationFrame % 2 === 0) {
            this.generateLightning();
        }

        // Munculkan partikel energi di sepanjang berkas beam
        for (let i = 0; i < 2; i++) {
            const beamLength = Math.max(10, this.width);
            const spawnDist = Math.random() * beamLength;
            const px = (this.dirX === 1) ? (this.x + spawnDist) : (this.x + this.width - spawnDist);
            const py = this.y + Math.random() * this.height;

            this.particles.push({
                x: px,
                y: py,
                vx: this.dirX * (4 + Math.random() * 6),
                vy: (Math.random() - 0.5) * 3,
                size: 2 + Math.random() * 3.5,
                life: 12,
                maxLife: 12,
                color: Math.random() < 0.6 ? "#38bdf8" : "#ffffff"
            });
        }

        // Perbarui partikel beam
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    generateLightning() {
        this.lightningBolts = [];
        const segments = 12;
        const startX = (this.dirX === 1) ? this.x : (this.x + this.width);
        const endX = (this.dirX === 1) ? (this.x + this.width) : this.x;
        const centerY = this.y + this.height / 2;

        const points = [];
        points.push({ x: startX, y: centerY });
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const px = startX + (endX - startX) * progress;
            const py = centerY + (Math.random() - 0.5) * (this.thickness * 0.75);
            points.push({ x: px, y: py });
        }
        points.push({ x: endX, y: centerY });
        this.lightningBolts.push(points);
    }

    canDamageTarget(target) {
        if (!this.isAlive || !target) return false;
        if (!Faction.canDamage(this, target)) return false;

        const now = Date.now();
        const lastHit = this.lastHitMap.get(target) || 0;
        if (now - lastHit >= this.tickRate) {
            this.lastHitMap.set(target, now);
            return true;
        }
        return false;
    }

    draw(context) {
        if (!this.isAlive || !this.isCasterAlive()) return;

        context.save();

        const center = this.caster.getCenter ? this.caster.getCenter() : { x: this.caster.x + 24, y: this.caster.y + 24 };
        const originX = (this.dirX === 1) ? (center.x + 12) : (center.x - 12);
        const originY = center.y;
        const targetX = (this.dirX === 1) ? (this.x + this.width) : this.x;

        // 1. Muzzle Energy Charge Flash di depan caster
        const muzzleGrad = context.createRadialGradient(originX, originY, 4, originX, originY, 32);
        muzzleGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        muzzleGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.95)");
        muzzleGrad.addColorStop(0.7, "rgba(14, 165, 233, 0.5)");
        muzzleGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
        context.fillStyle = muzzleGrad;
        context.beginPath();
        context.arc(originX, originY, 32, 0, Math.PI * 2);
        context.fill();

        // 2. Berkas Sinar Luar (Wide Atmospheric Halo)
        const outerGrad = context.createLinearGradient(0, this.y - 6, 0, this.y + this.height + 6);
        outerGrad.addColorStop(0, "rgba(2, 132, 199, 0)");
        outerGrad.addColorStop(0.25, "rgba(56, 189, 248, 0.5)");
        outerGrad.addColorStop(0.5, "rgba(125, 211, 252, 0.85)");
        outerGrad.addColorStop(0.75, "rgba(56, 189, 248, 0.5)");
        outerGrad.addColorStop(1, "rgba(2, 132, 199, 0)");

        context.fillStyle = outerGrad;
        context.fillRect(this.x, this.y - 6, this.width, this.height + 12);

        // 3. Inti Plasma Terang (Intense Core Beam)
        const coreHeight = this.thickness * 0.5;
        const coreY = originY - coreHeight / 2;
        const coreGrad = context.createLinearGradient(0, coreY, 0, coreY + coreHeight);
        coreGrad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
        coreGrad.addColorStop(0.5, "rgba(255, 255, 255, 1)");
        coreGrad.addColorStop(1, "rgba(56, 189, 248, 0.8)");

        context.fillStyle = coreGrad;
        context.fillRect(this.x, coreY, this.width, coreHeight);

        // 4. Inti Laser Putih Berdenyut (Hyper-bright Central Line)
        const pulse = Math.sin(this.animationFrame * 0.45) * 2.5;
        context.strokeStyle = "#ffffff";
        context.lineWidth = 4 + pulse;
        context.shadowColor = "#38bdf8";
        context.shadowBlur = 16;
        context.beginPath();
        context.moveTo(originX, originY);
        context.lineTo(targetX, originY);
        context.stroke();

        // 5. Busur Listrik Plasma (Electric Lightning Arcs)
        context.shadowBlur = 8;
        context.strokeStyle = "rgba(186, 230, 253, 0.9)";
        context.lineWidth = 1.8;
        this.lightningBolts.forEach(points => {
            if (points.length < 2) return;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }
            context.stroke();
        });

        // 6. Partikel Percikan Energi Laser
        context.shadowBlur = 0;
        this.particles.forEach(p => {
            context.save();
            context.globalAlpha = p.life / p.maxLife;
            context.fillStyle = p.color;
            context.beginPath();
            context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
        });

        context.restore();
    }

    destroy() {
        this.isAlive = false;
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
            this.domElement = null;
        }
        this.lastHitMap.clear();
        this.particles = [];
        this.lightningBolts = [];
        super.destroy();
    }
}
