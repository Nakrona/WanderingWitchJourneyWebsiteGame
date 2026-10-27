class Player {
    constructor(x, y, size, speed, gifElementId = "player-gif") {
        this.spawnX = x;
        this.spawnY = y;
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = "#3b82f6";
        this.faction = Faction.A;

        this.facingDirection = 1;

        // Player Health System (3 HP)
        this.maxHp = 3;
        this.hp = 3;
        this.isAlive = true;
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.shield = null; // Referensi perisai Skill 5 aktif
        this.activeSkill3 = null; // Referensi orbit Skill 3 aktif

        // Knockback physics
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTimer = 0;

        this.isAssetAvailable = false;

        this.domElement = document.getElementById(gifElementId);
        this.initAssetValidation();

        this.syncDOMPosition();
    }

    initAssetValidation() {
        if (!this.domElement) {
            this.isAssetAvailable = false;
            return;
        }

        this.domElement.style.width = `${this.size}px`;
        this.domElement.style.height = `${this.size}px`;

        if (this.domElement.complete && this.domElement.naturalWidth > 0) {
            this.isAssetAvailable = true;
            this.domElement.style.display = "block";
        } else {
            this.domElement.style.display = "none";
        }

        this.domElement.addEventListener("load", () => {
            if (this.domElement.naturalWidth > 0) {
                this.isAssetAvailable = true;
                this.domElement.style.display = "block";
            }
        });

        this.domElement.addEventListener("error", () => {
            this.isAssetAvailable = false;
            this.domElement.style.display = "none";
        });
    }

    takeDamage(amount = 1) {
        if (this.isInvulnerable || this.hp <= 0) {
            return false;
        }

        // Cek proteksi perisai Skill 5 (Hexagonal Shield)
        if (this.shield && this.shield.isAlive && this.shield.stacks > 0) {
            const absorbed = this.shield.absorbDamage(amount);
            if (absorbed) {
                this.isInvulnerable = true;
                this.invulnerableTimer = 35; // Invulnerable singkat untuk reposisi aman
                return "absorbed"; // Berhasil ditangkis perisai, HP utuh!
            }
        }

        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.isAlive = false;
        }
        this.isInvulnerable = true;
        this.invulnerableTimer = 80; // ~1.33 seconds invulnerability so player can walk away without getting hit again
        if (this.domElement) {
            this.domElement.classList.add("hit-blinking");
        }
        return true;
    }

    heal(amount = 1) {
        if (this.hp >= this.maxHp) {
            return false;
        }

        this.hp = Math.min(this.maxHp, this.hp + amount);
        return true;
    }

    getCenter() {
        return {
            x: this.x + this.size / 2,
            y: this.y + this.size / 2
        };
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }

    applyKnockback(sourceX, sourceY, force = 14) {
        const playerCenterX = this.x + this.size / 2;
        const playerCenterY = this.y + this.size / 2;
        let dx = playerCenterX - sourceX;
        let dy = playerCenterY - sourceY;
        let dist = Math.hypot(dx, dy);

        if (dist < 0.001) {
            dx = this.facingDirection === 1 ? -1 : 1;
            dy = 0;
            dist = 1;
        }

        const dirX = dx / dist;
        const dirY = dy / dist;

        this.knockbackVx = dirX * force;
        this.knockbackVy = dirY * force;
        this.knockbackTimer = 14; // ~14 frames recoil impulse
    }

    update(keys, canvasWidth, canvasHeight) {
        // Handle invulnerability countdown & visual flickering
        if (this.isInvulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
                if (this.domElement) {
                    this.domElement.classList.remove("hit-blinking");
                    this.domElement.style.opacity = "1";
                }
            } else {
                if (this.domElement && !this.domElement.classList.contains("hit-blinking")) {
                    this.domElement.classList.add("hit-blinking");
                }
            }
        } else {
            if (this.domElement) {
                if (this.domElement.classList.contains("hit-blinking")) {
                    this.domElement.classList.remove("hit-blinking");
                }
                if (this.domElement.style.opacity !== "1") {
                    this.domElement.style.opacity = "1";
                }
            }
        }

        // Apply knockback recoil movement
        if (this.knockbackTimer > 0) {
            this.x += this.knockbackVx;
            this.y += this.knockbackVy;
            this.knockbackVx *= 0.82;
            this.knockbackVy *= 0.82;
            this.knockbackTimer--;
        } else {
            // Normal Player Movement
            if (keys.ArrowLeft || keys.KeyA) {
                this.x -= this.speed;
                this.facingDirection = 1;
            }
            if (keys.ArrowRight || keys.KeyD) {
                this.x += this.speed;
                this.facingDirection = -1;
            }

            if (keys.ArrowUp || keys.KeyW) {
                this.y -= this.speed;
            }
            if (keys.ArrowDown || keys.KeyS) {
                this.y += this.speed;
            }
        }

        this.x = Math.max(0, Math.min(canvasWidth - this.size, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.size, this.y));

        this.syncDOMPosition();
    }

    syncDOMPosition() {
        if (this.isAssetAvailable && this.domElement) {
            this.domElement.style.transform = `translate(${this.x}px, ${this.y}px) scaleX(${this.facingDirection})`;
        }
    }

    respawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.facingDirection = 1;
        this.isAlive = true;
        this.isInvulnerable = true;
        this.invulnerableTimer = 60;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTimer = 0;
        if (this.domElement) {
            this.domElement.classList.add("hit-blinking");
        }
        if (this.shield) {
            this.shield.destroy();
            this.shield = null;
        }
        if (this.activeSkill3) {
            this.activeSkill3.destroy();
            this.activeSkill3 = null;
        }
        this.syncDOMPosition();
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.hp = this.maxHp;
        this.isAlive = true;
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTimer = 0;
        this.facingDirection = 1;
        if (this.domElement) {
            this.domElement.classList.remove("hit-blinking");
            this.domElement.style.opacity = "1";
        }
        if (this.shield) {
            this.shield.destroy();
            this.shield = null;
        }
        if (this.activeSkill3) {
            this.activeSkill3.destroy();
            this.activeSkill3 = null;
        }
        this.syncDOMPosition();
    }

    draw(context) {
        if (!this.isAssetAvailable) {
            context.save();
            if (this.isInvulnerable && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
                context.globalAlpha = 0.15;
            }

            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.size, this.size);

            context.strokeStyle = "#60a5fa";
            context.lineWidth = 2;
            context.strokeRect(this.x, this.y, this.size, this.size);

            context.fillStyle = "#ffffff";
            if (this.facingDirection === 1) {
                context.fillRect(this.x + 6, this.y + 8, 5, 5);
                context.fillRect(this.x + 16, this.y + 8, 5, 5);
            } else {
                context.fillRect(this.x + this.size - 11, this.y + 8, 5, 5);
                context.fillRect(this.x + this.size - 21, this.y + 8, 5, 5);
            }

            context.restore();
        }
    }
}