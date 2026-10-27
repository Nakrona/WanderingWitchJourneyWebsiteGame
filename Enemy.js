class Enemy {
    constructor(x, y, width = 42, height = 42, imageSrc = "Enemy.png", containerSelector = ".canvas-container", speed = 1.2) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.dirX = 1;
        this.imageSrc = imageSrc;
        this.isAssetAvailable = false;
        this.domElement = null;
        this.color = "#ef4444";
        this.faction = Faction.B;
        this.enemyType = 1;
        this.maxHp = 1;
        this.hp = 1;
        this.scoreValue = 10;
        this.isAlive = true;

        this.initAsset(containerSelector);
    }

    initAsset(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        this.domElement = document.createElement("img");
        this.domElement.src = this.imageSrc;
        this.domElement.alt = "Enemy";
        this.domElement.className = "enemy-sprite";
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

        let hasTriedGif = false;
        let hasTriedPng = false;
        if (this.imageSrc.toLowerCase().endsWith(".png")) hasTriedPng = true;
        if (this.imageSrc.toLowerCase().endsWith(".gif")) hasTriedGif = true;

        this.domElement.addEventListener("error", () => {
            // Jika Enemy.png gagal dimuat, coba periksa apakah ada Enemy.gif (dan sebaliknya)
            if (!hasTriedGif) {
                hasTriedGif = true;
                this.imageSrc = this.imageSrc.replace(/\.png$/i, ".gif");
                this.domElement.src = this.imageSrc;
            } else if (!hasTriedPng) {
                hasTriedPng = true;
                this.imageSrc = this.imageSrc.replace(/\.gif$/i, ".png");
                this.domElement.src = this.imageSrc;
            } else {
                // Guard: Gambar tidak tersedia (.png dan .gif tidak ditemukan), sembunyikan elemen DOM dan gunakan fallback bulet merah
                this.isAssetAvailable = false;
                if (this.domElement) {
                    this.domElement.style.display = "none";
                }
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

    update(player, canvasWidth, canvasHeight, otherEnemies = []) {
        if (!player) return;

        const playerCenterX = player.x + (player.size || 48) / 2;
        const playerCenterY = player.y + (player.size || 48) / 2;
        const enemyCenterX = this.x + this.width / 2;
        const enemyCenterY = this.y + this.height / 2;

        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const dist = Math.hypot(dx, dy);

        let moveX = 0;
        let moveY = 0;

        // Bergerak mendekati arah player dengan kecepatan sekitar 0.3 speed player (speed = 1.2)
        if (dist > 1) {
            moveX = (dx / dist) * this.speed;
            moveY = (dy / dist) * this.speed;
            this.dirX = dx >= 0 ? 1 : -1;
        }

        // Pemisahan lembut antar-musuh agar tidak menyatu di satu titik
        if (otherEnemies && otherEnemies.length > 1) {
            for (let i = 0; i < otherEnemies.length; i++) {
                const other = otherEnemies[i];
                if (other === this) continue;
                const sepDx = enemyCenterX - (other.x + other.width / 2);
                const sepDy = enemyCenterY - (other.y + other.height / 2);
                const sepDist = Math.hypot(sepDx, sepDy);
                const minDist = (this.width + other.width) * 0.45;
                if (sepDist > 0 && sepDist < minDist) {
                    const pushFactor = ((minDist - sepDist) / minDist) * 0.8;
                    moveX += (sepDx / sepDist) * pushFactor;
                    moveY += (sepDy / sepDist) * pushFactor;
                }
            }
        }

        this.x += moveX;
        this.y += moveY;

        // Jaga agar musuh tetap berada di dalam batas canvas
        if (canvasWidth && canvasHeight) {
            this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
            this.y = Math.max(0, Math.min(this.y, canvasHeight - this.height));
        }

        this.syncDOMPosition();
        this.checkAutoCastSkills();
    }

    /**
     * Hook method untuk auto-cast skill musuh saat cooldown selesai (Open-Closed Principle).
     */
    checkAutoCastSkills() {
        // Implementasi default kosong, dioverride oleh jenis musuh yang memiliki skill
    }

    takeDamage(amount = 1) {
        if (!this.isAlive) return false;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isAlive = false;
            this.destroy();
            return true; // Musuh tereliminasi
        }
        return false; // Musuh terluka tetapi masih hidup
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    destroy() {
        this.isAlive = false;
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
            this.domElement = null;
        }
    }

    draw(context) {
        // Guard: Jika tidak ada image (.png atau .gif), gambar bulet merah
        if (!this.isAssetAvailable) {
            context.save();

            const radius = Math.min(this.width, this.height) / 2;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // 1. Glow aura merah
            const glow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius + 5);
            glow.addColorStop(0, "rgba(239, 68, 68, 0.45)");
            glow.addColorStop(1, "rgba(239, 68, 68, 0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
            context.fill();

            // 2. Bulet merah (Badan lingkaran merah dengan gradien 3D)
            const bodyGrad = context.createRadialGradient(
                centerX - radius * 0.3,
                centerY - radius * 0.3,
                radius * 0.15,
                centerX,
                centerY,
                radius
            );
            bodyGrad.addColorStop(0, "#f87171"); // highlight merah muda
            bodyGrad.addColorStop(0.65, "#ef4444"); // merah solid
            bodyGrad.addColorStop(1, "#991b1b"); // merah gelap bayangan
            context.fillStyle = bodyGrad;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, Math.PI * 2);
            context.fill();

            // 3. Garis tepi lingkaran
            context.strokeStyle = "#7f1d1d";
            context.lineWidth = 2;
            context.stroke();

            // 4. Pantulan cahaya putih mengilap
            context.beginPath();
            context.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
            context.fillStyle = "rgba(255, 255, 255, 0.55)";
            context.fill();

            // 5. Mata musuh (menacing eyes) melirik ke arah player
            const pupilShift = this.dirX >= 0 ? 1 : -1;
            context.fillStyle = "#ffffff";
            context.fillRect(centerX - 9, centerY - 3, 5, 5);
            context.fillRect(centerX + 4, centerY - 3, 5, 5);

            context.fillStyle = "#0f172a";
            context.fillRect(centerX - 7 + pupilShift, centerY - 2, 3, 3);
            context.fillRect(centerX + 6 + pupilShift, centerY - 2, 3, 3);

            context.restore();
        }
    }
}
