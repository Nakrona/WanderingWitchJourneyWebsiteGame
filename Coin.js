class Coin {
    constructor(canvasWidth, canvasHeight, hazards = [], player = null) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = 0;
        this.y = 0;
        this.relocate(hazards, player);
    }

    isOverlappingHazard(candidateX, candidateY, hazard, safeMargin = 30) {
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
        const safeMargin = 30;
        const maxAttempts = 80;
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

            // Pastikan tidak berada di titik spawn awal player (50, 50)
            const distToSpawn = Math.hypot(candidateX - 50, candidateY - 50);
            if (distToSpawn <= 100) continue;

            // Pastikan tidak berada di lokasi player saat ini
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
            this.x = padding + Math.random() * (this.canvasWidth - padding * 2);
            this.y = padding + Math.random() * (this.canvasHeight - padding * 2);
        }
    }

    draw(context, color, radius) {
        context.beginPath();
        context.arc(this.x, this.y, radius, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();

        context.strokeStyle = "#ffffff";
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        context.arc(this.x - radius * 0.3, this.y - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 255, 255, 0.4)";
        context.fill();
    }
}