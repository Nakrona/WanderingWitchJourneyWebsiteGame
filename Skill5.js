/**
 * Skill5.js
 * Implementasi Skill 5: Hexagonal Energy Shield (OOP, SRP & SOLID).
 * Memberikan perisai bulat bertekstur heksagonal transparan kepada penggunanya.
 * - Dapat di-stack hingga maksimal 2X (2 lapisan proteksi).
 * - Cooldown: 5 detik (5.000 ms).
 * - Melindungi nyawa (HP) pengguna dari serangan musuh (menyerap 1 serangan per stack).
 * - Menampilkan indikator stack melayang di atas kepala pengguna.
 */
class Skill5 extends BaseSkill {
    constructor(caster, options = {}) {
        const faction = caster.faction || Faction.A;
        super({
            x: caster.x,
            y: caster.y,
            width: (caster.size || 48) + 24,
            height: (caster.size || 48) + 24,
            speed: 0,
            faction
        });

        this.caster = caster;
        this.maxStacks = options.maxStacks || 2;
        this.stacks = Math.min(this.maxStacks, options.stacks || 1);
        this.radius = options.radius || ((caster.size || 48) * 0.72);
        this.isAlive = true;
        this.animationFrame = 0;
        this.absorbFlashTimer = 0;
        this.deflectParticles = [];

        // Hubungkan perisai langsung ke caster
        this.caster.shield = this;
    }

    /**
     * Menambahkan stack perisai (maksimal 2x).
     * @param {number} amount 
     */
    addStack(amount = 1) {
        this.stacks = Math.min(this.maxStacks, this.stacks + amount);
        this.isAlive = true;
        this.absorbFlashTimer = 16; // Visual flash aktivasi
    }

    /**
     * Menyerap damage yang diterima caster.
     * Mengurangi 1 stack perisai dan melindungi HP caster dari pengurangan.
     * @param {number} amount 
     * @returns {boolean} true jika damage berhasil diserap perisai
     */
    absorbDamage(amount = 1) {
        if (!this.isAlive || this.stacks <= 0) return false;

        this.stacks -= 1;
        this.absorbFlashTimer = 22; // Flash terang saat menyerap serangan

        // Ledakan partikel heksagon saat menahan serangan
        this.createDeflectParticles();

        if (this.stacks <= 0) {
            this.destroy();
        }

        return true;
    }

    createDeflectParticles() {
        const center = this.getShieldCenter();
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i * (Math.PI * 2 / count)) + (Math.random() * 0.3);
            const speed = 2.5 + Math.random() * 4;
            this.deflectParticles.push({
                x: center.x + Math.cos(angle) * (this.radius * 0.8),
                y: center.y + Math.sin(angle) * (this.radius * 0.8),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3.5,
                color: Math.random() < 0.6 ? "#22d3ee" : "#ffffff",
                life: 18,
                maxLife: 18
            });
        }
    }

    getShieldCenter() {
        if (this.caster && typeof this.caster.getCenter === "function") {
            return this.caster.getCenter();
        }
        return {
            x: this.caster.x + (this.caster.size || 48) / 2,
            y: this.caster.y + (this.caster.size || 48) / 2
        };
    }

    update(canvasWidth, canvasHeight) {
        if (!this.isAlive || this.stacks <= 0) {
            this.destroy();
            return;
        }

        this.animationFrame++;

        if (this.absorbFlashTimer > 0) {
            this.absorbFlashTimer--;
        }

        // Sinkronisasi posisi bounding box mengikuti pergerakan caster
        const center = this.getShieldCenter();
        this.x = center.x - this.radius;
        this.y = center.y - this.radius;
        this.width = this.radius * 2;
        this.height = this.radius * 2;

        // Update partikel deflect
        for (let i = this.deflectParticles.length - 1; i >= 0; i--) {
            const p = this.deflectParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.92;
            p.vy *= 0.92;
            p.life--;
            if (p.life <= 0) {
                this.deflectParticles.splice(i, 1);
            }
        }
    }

    draw(context) {
        if (!this.isAlive || this.stacks <= 0 || !this.caster) return;

        context.save();
        const center = this.getShieldCenter();
        const currentRadius = this.radius + Math.sin(this.animationFrame * 0.08) * 1.5;

        // 1. Gambar Kubah Perisai Transparan (Sphere Dome)
        const isFlashing = this.absorbFlashTimer > 0;
        const baseAlpha = this.stacks === 2 ? 0.35 : 0.22;
        const glowColor = this.stacks === 2 ? "rgba(34, 211, 238," : "rgba(56, 189, 248,";

        const sphereGrad = context.createRadialGradient(
            center.x - currentRadius * 0.25,
            center.y - currentRadius * 0.25,
            currentRadius * 0.15,
            center.x,
            center.y,
            currentRadius
        );

        if (isFlashing) {
            sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
            sphereGrad.addColorStop(0.6, "rgba(165, 243, 252, 0.7)");
            sphereGrad.addColorStop(1, "rgba(6, 182, 212, 0.4)");
        } else {
            sphereGrad.addColorStop(0, `${glowColor} 0.15)`);
            sphereGrad.addColorStop(0.7, `${glowColor} ${baseAlpha})`);
            sphereGrad.addColorStop(1, `${glowColor} ${baseAlpha * 1.6})`);
        }

        context.fillStyle = sphereGrad;
        context.beginPath();
        context.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
        context.fill();

        // 2. Gambar Tekstur Pola Heksagonal Transparan (Hexagonal Grid Pattern)
        this.drawHexagonTexture(context, center.x, center.y, currentRadius, isFlashing);

        // 3. Garis Lingkar Luar Berdenyut (Glowing Boundary Rings)
        context.lineWidth = this.stacks === 2 ? 3 : 2;
        context.strokeStyle = isFlashing ? "#ffffff" : (this.stacks === 2 ? "#22d3ee" : "#38bdf8");
        context.shadowColor = "#06b6d4";
        context.shadowBlur = this.stacks === 2 ? 14 : 8;
        context.beginPath();
        context.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
        context.stroke();

        // Cincin kedua jika memiliki 2 Stack (Double Layer Visual)
        if (this.stacks === 2) {
            context.lineWidth = 1.2;
            context.strokeStyle = "rgba(255, 255, 255, 0.85)";
            context.setLineDash([6, 6]);
            context.beginPath();
            context.arc(center.x, center.y, currentRadius - 4, 0, Math.PI * 2);
            context.stroke();
            context.setLineDash([]);
        }

        context.shadowBlur = 0;

        // 4. Gambar Partikel Deflect jika ada
        this.deflectParticles.forEach((p) => {
            context.save();
            context.globalAlpha = p.life / p.maxLife;
            context.fillStyle = p.color;
            context.beginPath();
            context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
        });

        // 5. Gambar Indikator Stack Melayang di Atas Kepala Pengguna
        this.drawStackIndicator(context, center.x, this.caster.y - 14);

        context.restore();
    }

    /**
     * Menggambar pola heksagon geometris yang rapi di dalam lingkaran perisai.
     */
    drawHexagonTexture(context, cx, cy, radius, isFlashing) {
        context.save();
        // Masking: pola heksagonal hanya digambar di dalam lingkaran perisai
        context.beginPath();
        context.arc(cx, cy, radius - 1, 0, Math.PI * 2);
        context.clip();

        const hexRadius = 9.5;
        const hexWidth = Math.sqrt(3) * hexRadius;
        const hexHeight = 2 * hexRadius * 0.75;
        const rotationAngle = (this.animationFrame * 0.012);

        context.strokeStyle = isFlashing 
            ? "rgba(255, 255, 255, 0.75)" 
            : (this.stacks === 2 ? "rgba(103, 232, 249, 0.45)" : "rgba(56, 189, 248, 0.28)");
        context.lineWidth = 1.2;

        const range = Math.ceil(radius / hexRadius) + 1;
        for (let row = -range; row <= range; row++) {
            for (let col = -range; col <= range; col++) {
                const offsetX = (row % 2 !== 0) ? hexWidth / 2 : 0;
                const hx = cx + col * hexWidth + offsetX;
                const hy = cy + row * hexHeight;

                const dist = Math.hypot(hx - cx, hy - cy);
                if (dist <= radius + hexRadius) {
                    this.drawSingleHexagon(context, hx, hy, hexRadius, rotationAngle);
                }
            }
        }

        context.restore();
    }

    drawSingleHexagon(context, x, y, r, rotation = 0) {
        context.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) + rotation;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) {
                context.moveTo(px, py);
            } else {
                context.lineTo(px, py);
            }
        }
        context.closePath();
        context.stroke();
    }

    /**
     * Menggambar indikator stack perisai melayang di atas kepala pengguna.
     * @param {CanvasRenderingContext2D} context 
     * @param {number} x 
     * @param {number} y 
     */
    drawStackIndicator(context, x, y) {
        context.save();
        const badgeWidth = 42;
        const badgeHeight = 16;
        const badgeX = x - badgeWidth / 2;
        const badgeY = y;

        // Background kapsul gelap transparan
        context.fillStyle = "rgba(15, 23, 42, 0.85)";
        context.beginPath();
        context.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
        context.fill();

        // Border bercahaya sesuai jumlah stack
        context.lineWidth = 1.2;
        context.strokeStyle = this.stacks === 2 ? "#22d3ee" : "#38bdf8";
        context.shadowColor = "#06b6d4";
        context.shadowBlur = 6;
        context.stroke();
        context.shadowBlur = 0;

        // Gambar 2 heksagon pip kecil sebagai penanda stack
        const pipRadius = 4.5;
        const pip1X = x - 8;
        const pip2X = x + 8;
        const pipY = badgeY + badgeHeight / 2;

        // Pip 1 (Stack 1)
        context.fillStyle = this.stacks >= 1 ? "#22d3ee" : "rgba(100, 116, 139, 0.4)";
        context.beginPath();
        context.arc(pip1X, pipY, pipRadius, 0, Math.PI * 2);
        context.fill();

        // Pip 2 (Stack 2)
        context.fillStyle = this.stacks >= 2 ? "#22d3ee" : "rgba(100, 116, 139, 0.4)";
        context.beginPath();
        context.arc(pip2X, pipY, pipRadius, 0, Math.PI * 2);
        context.fill();

        // Label teks mini
        context.fillStyle = "#ffffff";
        context.font = "bold 9px 'Segoe UI', sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(`🛡️${this.stacks}`, x - 18, pipY);

        context.restore();
    }

    destroy() {
        this.isAlive = false;
        this.stacks = 0;
        this.deflectParticles = [];
        if (this.caster && this.caster.shield === this) {
            this.caster.shield = null;
        }
        super.destroy();
    }
}
