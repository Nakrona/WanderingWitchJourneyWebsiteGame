class Potion {
    constructor(canvasWidth, canvasHeight, hazards = [], speed = 0.8, player = null) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = 0;
        this.y = 0;
        this.radius = 16;
        this.speed = speed;

        // Vektor kecepatan gerak acak (sekitar 0.2x speed player)
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.changeDirTimer = Math.floor(Math.random() * 60) + 60;

        this.animationTimer = Math.random() * Math.PI * 2;
        this.relocate(hazards, player);
    }

    isOverlappingHazard(candidateX, candidateY, hazard, safeMargin = 35) {
        const hazardLeft = hazard.x - safeMargin;
        const hazardRight = hazard.x + hazard.width + safeMargin;
        const hazardTop = hazard.y - safeMargin;
        const hazardBottom = hazard.y + hazard.height + safeMargin;

        return (
            candidateX >= hazardLeft &&
            candidateX <= hazardRight &&
            candidateY >= hazardTop &&
            candidateY <= hazardBottom
        );
    }

    relocate(hazards = [], player = null) {
        const padding = 50;
        const safeMargin = 35;
        const maxAttempts = 100;
        let attempts = 0;
        let isSafePosition = false;

        while (!isSafePosition && attempts < maxAttempts) {
            attempts++;

            const candidateX = padding + Math.random() * (this.canvasWidth - padding * 2);
            const candidateY = padding + Math.random() * (this.canvasHeight - padding * 2);

            const collidesWithSpike = hazards.some((hazard) =>
                this.isOverlappingHazard(candidateX, candidateY, hazard, safeMargin)
            );
            if (collidesWithSpike) continue;

            // Avoid spawning on top of player's spawn point (50, 50)
            const distToSpawn = Math.hypot(candidateX - 50, candidateY - 50);
            if (distToSpawn <= 100) continue;

            // Avoid player's CURRENT location
            if (player) {
                const pCenterX = player.x + (player.size || 48) / 2;
                const pCenterY = player.y + (player.size || 48) / 2;
                const distToPlayer = Math.hypot(candidateX - pCenterX, candidateY - pCenterY);
                if (distToPlayer <= 110) continue;
            }

            this.x = candidateX;
            this.y = candidateY;
            isSafePosition = true;
        }

        if (!isSafePosition) {
            this.x = this.canvasWidth / 2;
            this.y = this.canvasHeight / 2;
        }
    }

    update(canvasWidth, canvasHeight) {
        this.changeDirTimer--;
        if (this.changeDirTimer <= 0) {
            // Ubah arah acak secara berkala
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
            this.changeDirTimer = Math.floor(Math.random() * 90) + 60;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Memantul lembut di batas tepi canvas
        const minX = this.radius + 15;
        const maxX = (canvasWidth || this.canvasWidth) - this.radius - 15;
        const minY = this.radius + 15;
        const maxY = (canvasHeight || this.canvasHeight) - this.radius - 15;

        if (this.x < minX) {
            this.x = minX;
            this.vx = Math.abs(this.vx);
        } else if (this.x > maxX) {
            this.x = maxX;
            this.vx = -Math.abs(this.vx);
        }

        if (this.y < minY) {
            this.y = minY;
            this.vy = Math.abs(this.vy);
        } else if (this.y > maxY) {
            this.y = maxY;
            this.vy = -Math.abs(this.vy);
        }
    }

    draw(context) {
        this.animationTimer += 0.05;
        const bob = Math.sin(this.animationTimer) * 4;
        const drawX = this.x;
        const drawY = this.y + bob;

        context.save();

        // 1. Glowing magical aura
        const glowRadius = this.radius + 8;
        const glow = context.createRadialGradient(drawX, drawY + 2, 2, drawX, drawY + 2, glowRadius);
        glow.addColorStop(0, "rgba(244, 63, 94, 0.45)");
        glow.addColorStop(0.7, "rgba(244, 63, 94, 0.15)");
        glow.addColorStop(1, "rgba(244, 63, 94, 0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(drawX, drawY + 2, glowRadius, 0, Math.PI * 2);
        context.fill();

        // 2. Cork stopper
        context.fillStyle = "#b45309";
        context.strokeStyle = "#78350f";
        context.lineWidth = 1.5;
        context.beginPath();
        if (context.roundRect) {
            context.roundRect(drawX - 5, drawY - 17, 10, 5, 2);
        } else {
            context.rect(drawX - 5, drawY - 17, 10, 5);
        }
        context.fill();
        context.stroke();

        // 3. Glass neck
        context.fillStyle = "rgba(224, 242, 254, 0.6)";
        context.strokeStyle = "rgba(255, 255, 255, 0.8)";
        context.lineWidth = 1.5;
        context.fillRect(drawX - 4, drawY - 12, 8, 6);
        context.strokeRect(drawX - 4, drawY - 12, 8, 6);

        // 4. Round glass flask body
        const bulbRadius = 13;
        const bulbCenterY = drawY + 2;

        context.beginPath();
        context.arc(drawX, bulbCenterY, bulbRadius, 0, Math.PI * 2);
        context.fillStyle = "rgba(15, 23, 42, 0.5)";
        context.fill();

        // Red healing potion liquid with gradient
        context.beginPath();
        context.arc(drawX, bulbCenterY, bulbRadius - 2, 0, Math.PI * 2);
        const liquidGradient = context.createLinearGradient(
            drawX,
            bulbCenterY - bulbRadius,
            drawX,
            bulbCenterY + bulbRadius
        );
        liquidGradient.addColorStop(0, "#fb7185"); // rose-400
        liquidGradient.addColorStop(0.5, "#ef4444"); // red-500
        liquidGradient.addColorStop(1, "#991b1b"); // red-800
        context.fillStyle = liquidGradient;
        context.fill();

        // White Health Cross '+' symbol in center
        context.fillStyle = "#ffffff";
        context.shadowColor = "rgba(255, 255, 255, 0.8)";
        context.shadowBlur = 4;
        context.fillRect(drawX - 1.5, bulbCenterY - 5, 3, 10);
        context.fillRect(drawX - 5, bulbCenterY - 1.5, 10, 3);
        context.shadowBlur = 0;

        // Outer glass contour
        context.strokeStyle = "#ffffff";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(drawX, bulbCenterY, bulbRadius, 0, Math.PI * 2);
        context.stroke();

        // Curved reflection shine highlight
        context.strokeStyle = "rgba(255, 255, 255, 0.75)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(drawX - 4, bulbCenterY - 4, 6, Math.PI * 0.9, Math.PI * 1.5);
        context.stroke();

        // Little floating sparkle
        const sparkleX = drawX + Math.cos(this.animationTimer * 1.8) * 11;
        const sparkleY = bulbCenterY + Math.sin(this.animationTimer * 1.8) * 9;
        context.fillStyle = "rgba(255, 255, 255, 0.9)";
        context.beginPath();
        context.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}
