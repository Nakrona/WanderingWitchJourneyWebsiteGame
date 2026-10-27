/**
 * EnemyType2.js
 * Musuh Jenis 2 (Turunan dari Enemy - OOP, Liskov Substitution & Open-Closed Principle).
 * Ciri khas:
 * 1. Memiliki 2 HP dan bernilai 20 poin saat dihancurkan.
 * 2. Menggunakan Skill 3: Lingkaran proyektil gabungan Skill 1 dan Skill 2 yang melingkarinya secara dinamis.
 * 3. Berwarna / ber-aura ungu magis (Elite Enemy).
 * 4. Faksi B: Proyektilnya tidak melukai sesama musuh (Faksi B), hanya melukai Player (Faksi A).
 */
class EnemyType2 extends Enemy {
    constructor(x, y, width = 46, height = 46, imageSrc = "Enemy.png", containerSelector = ".canvas-container", speed = 1.0) {
        super(x, y, width, height, imageSrc, containerSelector, speed);

        this.enemyType = 2;
        this.color = "#a855f7"; // Ungu magis
        this.maxHp = 2;
        this.hp = 2;
        this.scoreValue = 20;
        this.containerSelector = containerSelector;

        // Berikan penanda class CSS khusus untuk styling aura ungu
        if (this.domElement) {
            this.domElement.classList.add("enemy-type2");
        }

        // Konfigurasi Skill 3 & Sistem Cooldown Otomatis (OOP & SRP)
        this.skill3 = null;
        this.activeSkill3 = null;
        this.skill3Cooldown = 9000; // Cooldown 9 detik (9000ms)
        this.skill3Duration = 7000; // Durasi aktif 7 detik (7000ms)
        this.skill3LastUsed = Date.now();

        // Musuh Jenis 2 langsung mengaktifkan Skill 3 saat pertama kali muncul
        this.activateSkill3();
    }

    /**
     * Mengaktifkan kembali Skill 3 (Orbiting Orbs) pada Musuh Jenis 2.
     */
    activateSkill3() {
        if (!this.isAlive || this.hp <= 0) return;
        this.skill3LastUsed = Date.now();
        this.skill3 = new Skill3(this, {
            radius: 58,
            orbCount: 4,
            duration: this.skill3Duration,
            containerSelector: this.containerSelector
        });
        this.activeSkill3 = this.skill3;
    }

    /**
     * Memeriksa dan otomatis mengaktifkan skill musuh saat masa cooldown telah selesai.
     */
    checkAutoCastSkills() {
        if (!this.isAlive || this.hp <= 0) return;

        const isSkill3Active = this.skill3 && this.skill3.isAlive;
        if (!isSkill3Active) {
            const now = Date.now();
            if (now - this.skill3LastUsed >= this.skill3Cooldown) {
                this.activateSkill3();
            }
        }
    }

    initAsset(containerSelector) {
        super.initAsset(containerSelector);
        if (this.domElement) {
            this.domElement.classList.add("enemy-type2");
        }
    }

    update(player, canvasWidth, canvasHeight, otherEnemies = []) {
        if (!this.isAlive) return;

        super.update(player, canvasWidth, canvasHeight, otherEnemies);

        // Perbarui rotasi proyektil Skill 3 yang melingkari tubuh musuh
        if (this.skill3 && this.skill3.isAlive) {
            this.skill3.update(canvasWidth, canvasHeight);
        }
    }

    takeDamage(amount = 1) {
        const wasKilled = super.takeDamage(amount);
        if (wasKilled && this.skill3) {
            this.skill3.destroy();
        }
        return wasKilled;
    }

    destroy() {
        if (this.skill3) {
            this.skill3.destroy();
            this.skill3 = null;
        }
        super.destroy();
    }

    draw(context) {
        if (!this.isAlive) return;

        // 1. Gambar aura/proyektil orbit Skill 3
        if (this.skill3 && this.skill3.isAlive) {
            this.skill3.draw(context);
        }

        // 2. Gambar tubuh musuh
        if (this.isAssetAvailable) {
            // Jika menggunakan gambar sprite, tambahkan aura cincin ungu di bawah sprite
            context.save();
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const glow = context.createRadialGradient(centerX, centerY, 10, centerX, centerY, this.width / 2 + 8);
            glow.addColorStop(0, "rgba(168, 85, 247, 0.4)");
            glow.addColorStop(1, "rgba(168, 85, 247, 0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(centerX, centerY, this.width / 2 + 8, 0, Math.PI * 2);
            context.fill();
            context.restore();
        } else {
            // Canvas Fallback untuk Musuh Jenis 2 (Bola Ungu dengan shading 3D)
            context.save();
            const radius = Math.min(this.width, this.height) / 2;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Aura ungu bersinar
            const glow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius + 8);
            glow.addColorStop(0, "rgba(168, 85, 247, 0.6)");
            glow.addColorStop(1, "rgba(147, 51, 234, 0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            context.fill();

            // Tubuh gradien ungu
            const bodyGrad = context.createRadialGradient(
                centerX - radius * 0.3,
                centerY - radius * 0.3,
                radius * 0.15,
                centerX,
                centerY,
                radius
            );
            bodyGrad.addColorStop(0, "#c084fc"); // ungu muda
            bodyGrad.addColorStop(0.65, "#a855f7"); // ungu solid
            bodyGrad.addColorStop(1, "#581c87"); // ungu tua bayangan
            context.fillStyle = bodyGrad;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, Math.PI * 2);
            context.fill();

            // Garis tepi tebal
            context.strokeStyle = "#3b0764";
            context.lineWidth = 2.5;
            context.stroke();

            // Highlight pantulan cahaya
            context.beginPath();
            context.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
            context.fillStyle = "rgba(255, 255, 255, 0.6)";
            context.fill();

            // Mata musuh elite
            const pupilShift = this.dirX >= 0 ? 1 : -1;
            context.fillStyle = "#ffffff";
            context.fillRect(centerX - 9, centerY - 3, 5, 5);
            context.fillRect(centerX + 4, centerY - 3, 5, 5);

            context.fillStyle = "#581c87";
            context.fillRect(centerX - 7 + pupilShift, centerY - 2, 3, 3);
            context.fillRect(centerX + 6 + pupilShift, centerY - 2, 3, 3);

            context.restore();
        }

        // 3. Mini Health Bar (2 HP) di atas kepala Musuh Jenis 2
        this.drawHpBar(context);
    }

    drawHpBar(context) {
        context.save();
        const barWidth = 32;
        const barHeight = 5;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 10;

        // Background hitam transparan
        context.fillStyle = "rgba(15, 23, 42, 0.85)";
        context.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Isi HP
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        context.fillStyle = hpPercent > 0.5 ? "#a855f7" : "#ef4444";
        context.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        context.strokeStyle = "#ffffff";
        context.lineWidth = 0.8;
        context.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        context.restore();
    }
}
