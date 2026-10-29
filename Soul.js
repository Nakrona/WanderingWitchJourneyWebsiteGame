/**
 * Soul.js
 * Kelas entitas Soul (Pengganti Koin) berbasis GIF animasi SoulBlue.gif (OOP, SRP & Clean Code).
 * Ciri khas:
 * 1. Bergerak perlahan (kecepatan ~0.9 px/frame).
 * 2. Bergerak menjauhi Player saat didekati dengan osilasi gerak dinamis dan acak (random wander flee).
 * 3. Menampilkan visual SoulBlue.gif pada layer DOM animasi dan efek aura sihir biru pada Canvas.
 * 4. Bernilai 10 poin saat diambil oleh Player.
 */
class Soul {
    constructor(canvasWidth, canvasHeight, hazards = [], player = null, containerSelector = ".canvas-container") {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = 36;
        this.height = 36;
        this.radius = 16;
        this.speed = 0.9; // Bergerak perlahan
        this.scoreValue = 10;
        this.isAlive = true;
        this.isAssetAvailable = false;
        this.imageSrc = "SoulBlue.gif";
        this.domElement = null;
        this.containerSelector = containerSelector;

        // Vektor & sudut gerak acak (wander)
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderChangeTimer = Math.floor(Math.random() * 40) + 30;
        this.bobTimer = Math.random() * Math.PI * 2;

        this.x = 0;
        this.y = 0;
        this.relocate(hazards, player);
        this.initDOM(containerSelector);
    }

    initDOM(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        this.domElement = document.createElement("img");
        this.domElement.src = this.imageSrc;
        this.domElement.alt = "Soul Blue";
        this.domElement.className = "soul-sprite";
        this.domElement.style.width = `${this.width}px`;
        this.domElement.style.height = `${this.height}px`;
        this.domElement.style.position = "absolute";
        this.domElement.style.top = "0";
        this.domElement.style.left = "0";
        this.domElement.style.pointerEvents = "none";
        this.domElement.style.zIndex = "4";
        this.domElement.style.display = "none";
        this.domElement.style.filter = "drop-shadow(0 0 8px rgba(56, 189, 248, 0.75))";

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
        });

        container.appendChild(this.domElement);
    }

    syncDOMPosition() {
        if (this.domElement) {
            this.domElement.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`;
        }
    }

    isOverlappingHazard(candidateX, candidateY, hazard, safeMargin = 30) {
        const hazardLeft = hazard.x - safeMargin;
        const hazardRight = hazard.x + (hazard.width || 42) + safeMargin;
        const hazardTop = hazard.y - safeMargin;
        const hazardBottom = hazard.y + (hazard.height || 42) + safeMargin;

        return (
            candidateX >= hazardLeft &&
            candidateX <= hazardRight &&
            candidateY >= hazardTop &&
            candidateY <= hazardBottom
        );
    }

    relocate(hazards = [], player = null) {
        const padding = 50;
        const safeMargin = 30;
        const maxAttempts = 80;
        let attempts = 0;
        let isSafePosition = false;

        while (!isSafePosition && attempts < maxAttempts) {
            attempts++;

            const candidateX = padding + Math.random() * (this.canvasWidth - padding * 2 - this.width);
            const candidateY = padding + Math.random() * (this.canvasHeight - padding * 2 - this.height);

            const collidesWithSpike = hazards.some((hazard) =>
                this.isOverlappingHazard(candidateX, candidateY, hazard, safeMargin)
            );
            if (collidesWithSpike) continue;

            // Pastikan tidak berada di titik spawn awal player (50, 50)
            const distToSpawn = Math.hypot(candidateX - 50, candidateY - 50);
            if (distToSpawn <= 100) continue;

            // Pastikan tidak berada persis di lokasi player saat ini
            if (player) {
                const pCenterX = player.x + (player.size || 48) / 2;
                const pCenterY = player.y + (player.size || 48) / 2;
                const distToPlayer = Math.hypot(candidateX + this.width / 2 - pCenterX, candidateY + this.height / 2 - pCenterY);
                if (distToPlayer <= 120) continue;
            }

            this.x = candidateX;
            this.y = candidateY;
            isSafePosition = true;
        }

        if (!isSafePosition) {
            this.x = padding + Math.random() * (this.canvasWidth - padding * 2 - this.width);
            this.y = padding + Math.random() * (this.canvasHeight - padding * 2 - this.height);
        }

        this.syncDOMPosition();
    }

    update(player, canvasWidth, canvasHeight) {
        if (!this.isAlive) return;

        // Efek melayang halus (ethereal floating bob)
        this.bobTimer += 0.05;
        const bobOffset = Math.sin(this.bobTimer) * 0.35;

        // Perbarui sudut acak secara berkala
        this.wanderChangeTimer--;
        if (this.wanderChangeTimer <= 0) {
            this.wanderAngle += (Math.random() - 0.5) * 1.2;
            this.wanderChangeTimer = Math.floor(Math.random() * 45) + 30;
        } else {
            this.wanderAngle += (Math.random() - 0.5) * 0.1;
        }

        let moveX = 0;
        let moveY = 0;

        if (player) {
            const pCenterX = player.x + (player.size || 48) / 2;
            const pCenterY = player.y + (player.size || 48) / 2;
            const soulCenterX = this.x + this.width / 2;
            const soulCenterY = this.y + this.height / 2;

            const dx = soulCenterX - pCenterX;
            const dy = soulCenterY - pCenterY;
            const dist = Math.hypot(dx, dy);

            const fleeRadius = 240; // Jarak deteksi penghindaran Soul terhadap Player

            if (dist < fleeRadius && dist > 0.001) {
                // Vektor menjauhi player (Flee Force)
                const fleeX = dx / dist;
                const fleeY = dy / dist;

                // Bobot: 75% menjauhi player + 25% variasi acak (random wander)
                const wanderX = Math.cos(this.wanderAngle);
                const wanderY = Math.sin(this.wanderAngle);

                moveX = (fleeX * 0.78 + wanderX * 0.22) * this.speed;
                moveY = (fleeY * 0.78 + wanderY * 0.22) * this.speed;
            } else {
                // Saat player jauh, bergerak melayang santai secara perlahan
                moveX = Math.cos(this.wanderAngle) * (this.speed * 0.5);
                moveY = Math.sin(this.wanderAngle) * (this.speed * 0.5);
            }
        } else {
            moveX = Math.cos(this.wanderAngle) * (this.speed * 0.5);
            moveY = Math.sin(this.wanderAngle) * (this.speed * 0.5);
        }

        this.x += moveX;
        this.y += moveY + bobOffset;

        // Jaga agar Soul selalu berada di dalam arena canvas
        const padding = 16;
        if (this.x < padding) {
            this.x = padding;
            this.wanderAngle = Math.PI - this.wanderAngle;
        } else if (this.x > (canvasWidth || this.canvasWidth) - this.width - padding) {
            this.x = (canvasWidth || this.canvasWidth) - this.width - padding;
            this.wanderAngle = Math.PI - this.wanderAngle;
        }

        if (this.y < padding) {
            this.y = padding;
            this.wanderAngle = -this.wanderAngle;
        } else if (this.y > (canvasHeight || this.canvasHeight) - this.height - padding) {
            this.y = (canvasHeight || this.canvasHeight) - this.height - padding;
            this.wanderAngle = -this.wanderAngle;
        }

        this.syncDOMPosition();
    }

    destroy() {
        this.isAlive = false;
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
            this.domElement = null;
        }
    }

    draw(context, color = "#38bdf8", radius = 16) {
        if (!this.isAlive) return;

        // Jika GIF DOM belum tampil, render aura spirit biru di canvas
        if (!this.isAssetAvailable) {
            context.save();
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const rad = this.radius;

            const grad = context.createRadialGradient(cx, cy, 2, cx, cy, rad);
            grad.addColorStop(0, "rgba(224, 242, 254, 1)");
            grad.addColorStop(0.4, "rgba(56, 189, 248, 0.85)");
            grad.addColorStop(0.8, "rgba(37, 99, 235, 0.5)");
            grad.addColorStop(1, "rgba(30, 58, 138, 0)");

            context.fillStyle = grad;
            context.beginPath();
            context.arc(cx, cy, rad, 0, Math.PI * 2);
            context.fill();

            // Inti cahaya putih
            context.fillStyle = "#ffffff";
            context.beginPath();
            context.arc(cx, cy, rad * 0.35, 0, Math.PI * 2);
            context.fill();

            context.restore();
        }
    }
}

// Backward compatibility alias untuk sistem atau pengujian lama
class Coin extends Soul {}
