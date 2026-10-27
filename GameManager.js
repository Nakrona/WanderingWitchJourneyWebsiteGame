class GameManager {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Nilai Poin Elemen Game (10 poin per enemy & 10 poin per koin)
        this.enemyValue = 10; // Setiap 1 Enemy yang dihancurkan bernilai 10 poin
        this.spikeValue = 10; // Alias untuk kompatibilitas
        this.coinValue = 10;  // Setiap 1 Koin yang diambil bernilai 10 poin

        // Batas Maksimal Objek yang Muncul Bersamaan di Layar
        this.maxActiveSpikes = 5; // Maksimal 5 enemy sekaligus di layar
        this.maxActiveCoins = 5;  // Maksimal 5 koin sekaligus di layar

        // Stage Progression System
        this.stage = 1;
        this.targetScore = 100; // Syarat menang Stage 1 = 100 poin

        // Kuota total stage & sisa antrean yang belum di-spawn
        this.totalSpikesInStage = 0;
        this.totalCoinsInStage = 0;
        this.spikesRemainingToSpawn = 0;
        this.coinsRemainingToSpawn = 0;

        this.calculateStageSpawn();

        this.stageScore = 0;
        this.totalScore = 0;

        // HUD Elements
        this.stageDisplay = document.getElementById("stage-display");
        this.scoreDisplay = document.getElementById("score-display");
        this.timerDisplay = document.getElementById("timer-display");
        this.hpDisplay = document.getElementById("hp-display");
        this.dangerAlert = document.getElementById("danger-alert");
        this.healAlert = document.getElementById("heal-alert");

        // Skill Loadout System (Pilih 3 dari 5 Skill untuk Slot Z, X, C)
        this.skillDefinitions = {
            skill1: { id: "skill1", name: "Frost Bolt", shortName: "Skill 1", icon: "❄️", cooldown: 1500, requiredKills: 0 },
            skill2: { id: "skill2", name: "Flame Plasma", shortName: "Skill 2", icon: "🔥", cooldown: 2500, requiredKills: 0 },
            skill3: { id: "skill3", name: "Orbiting Orbs", shortName: "Skill 3", icon: "🌀", cooldown: 9000, requiredKills: 0, duration: 7000 },
            skill4: { id: "skill4", name: "Continuous Beam", shortName: "Skill 4", icon: "⚡", cooldown: 7000, requiredKills: 3, duration: 2000 },
            skill5: { id: "skill5", name: "Hex Shield", shortName: "Skill 5", icon: "🛡️", cooldown: 5000, requiredKills: 0 }
        };

        // Loadout default awal: Skill 1 (Z), Skill 2 (X), Skill 5 (C)
        this.loadout = ["skill1", "skill2", "skill5"];

        // Dynamic HUD Slots (0 -> Z, 1 -> X, 2 -> C)
        this.hudSlots = [0, 1, 2].map((idx) => ({
            badge: document.getElementById(`slot${idx}-badge`),
            name: document.getElementById(`slot${idx}-name`),
            status: document.getElementById(`slot${idx}-status`)
        }));

        // Active projectiles, continuous beams & impact particles
        this.projectiles = [];
        this.activeBeams = [];
        this.particles = [];

        // Active enemies (hazards) & coins arrays
        this.hazards = [];
        this.coins = [];

        // Customization
        this.coinColorPicker = document.getElementById("coin-color-picker");
        this.coinSizeSlider = document.getElementById("coin-size-slider");
        this.coinSizeValue = document.getElementById("coin-size-value");
        this.bgUploadInput = document.getElementById("bg-upload");

        // Overlays
        this.statusOverlay = document.getElementById("game-status-overlay");
        this.statusMessage = document.getElementById("game-status-message");
        this.gameOverDesc = document.getElementById("game-over-desc");
        this.restartBtn = document.getElementById("restart-btn");
        this.returnMenuBtn = document.getElementById("return-menu-btn");
        this.headerRestartBtn = document.getElementById("header-restart-btn");

        this.mainMenuOverlay = document.getElementById("main-menu-overlay");
        this.playBtn = document.getElementById("play-btn");

        this.stageClearOverlay = document.getElementById("stage-clear-overlay");
        this.stageClearTitle = document.getElementById("stage-clear-title");
        this.stageClearDesc = document.getElementById("stage-clear-desc");
        this.nextStageName = document.getElementById("next-stage-name");
        this.nextStageTarget = document.getElementById("next-stage-target");
        this.nextStageSpikes = document.getElementById("next-stage-spikes");
        this.nextStageBtn = document.getElementById("next-stage-btn");

        this.gameState = "MENU";
        this.dangerTimeout = null;
        this.healTimeout = null;

        // Background Image Setup
        this.isBackgroundLoaded = false;
        this.backgroundImage = new Image();
        this.backgroundImage.onload = () => {
            this.isBackgroundLoaded = true;
        };
        this.backgroundImage.onerror = () => {
            this.isBackgroundLoaded = false;
        };
        this.backgroundImage.src = "Background.png";

        // Sound Effects (SFX) Setup
        this.sfxSkillCast = document.getElementById("sfx-skill-cast") || new Audio("SkillCasting.mp3");
        this.sfxHit = document.getElementById("sfx-hit") || new Audio("Hit.mp3");
        this.sfxWin = document.getElementById("sfx-win") || new Audio("win.mp3");
        this.sfxLose = document.getElementById("sfx-lose") || new Audio("lose.mp3");
        this.sfxHeal = document.getElementById("sfx-heal") || new Audio("heal.mp3");

        this.sfxSkillCast.preload = "auto";
        this.sfxHit.preload = "auto";
        this.sfxWin.preload = "auto";
        this.sfxLose.preload = "auto";
        this.sfxHeal.preload = "auto";

        // Unlock audio on initial user interaction to conform with browser autoplay policies
        const unlockAudio = () => {
            [this.sfxSkillCast, this.sfxHit, this.sfxWin, this.sfxLose, this.sfxHeal].forEach((sfx) => {
                if (sfx && typeof sfx.load === "function") {
                    sfx.load();
                }
            });
            window.removeEventListener("keydown", unlockAudio);
            window.removeEventListener("click", unlockAudio);
        };
        window.addEventListener("keydown", unlockAudio, { once: true });
        window.addEventListener("click", unlockAudio, { once: true });

        // Dedicated Timer Instance
        this.timer = new Timer(
            60,
            (remaining) => this.handleTimerTick(remaining),
            () => this.handleTimerComplete()
        );

        this.coinColor = this.coinColorPicker ? this.coinColorPicker.value : "#facc15";
        this.coinRadius = this.coinSizeSlider ? parseInt(this.coinSizeSlider.value, 10) : 12;
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyW: false,
            KeyS: false,
            KeyA: false,
            KeyD: false
        };

        this.player = new Player(50, 50, 48, 4, "player-gif");

        // Skill Activation Calculator & Requirements System (SRP & Strategy Pattern)
        this.activationCalculator = new SkillActivationCalculator();
        this.initPlayerSkills();

        this.potionSpeed = this.player.speed * 0.2; // ~0.8
        this.enemySpeed = this.player.speed * 0.3; // ~1.2

        // Inisialisasi UI Pemilihan Skill di Main Menu
        this.initSkillSelectionUI();

        // Spawn Enemies and Coins up to the max limit of 5 each
        this.replenishHazards();
        this.replenishCoins();

        // Inisialisasi Environment Healing Items (Maksimal 2 per stage, bergerak acak)
        this.initStagePotions();

        this.updateHpDisplay();
        this.updateScoreDisplay();
        this.updateSkillsCooldownHUD();
        this.registerEvents();

        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    calculateStageSpawn() {
        this.enemyValue = 10;
        this.spikeValue = 10;
        this.coinValue = 10;

        // Stage 1: target 100. Tiap stage naik x1.2 (dibulatkan ke kelipatan 10 terdekat)
        if (this.stage === 1) {
            this.targetScore = 100;
        } else {
            this.targetScore = Math.round((100 * Math.pow(1.2, this.stage - 1)) / 10) * 10;
        }

        // Total kuota enemy yang harus dikalahkan pada stage ini
        this.totalSpikesInStage = Math.min(12, 3 + this.stage);
        const enemyPoints = this.totalSpikesInStage * this.enemyValue;

        // Total kuota koin yang harus dikumpulkan agar pas memenuhi targetScore
        this.totalCoinsInStage = Math.max(3, Math.round((this.targetScore - enemyPoints) / this.coinValue));

        // Simpan data antrean spawn cadangan (reserve)
        this.spikesRemainingToSpawn = this.totalSpikesInStage;
        this.coinsRemainingToSpawn = this.totalCoinsInStage;
        this.type2EnemiesSpawnedInStage = 0;
    }

    initStagePotions() {
        const speed = (this.player ? this.player.speed : 4) * 0.2; // 0.8
        this.potions = [
            new Potion(this.canvas.width, this.canvas.height, this.hazards, speed, this.player),
            new Potion(this.canvas.width, this.canvas.height, this.hazards, speed, this.player)
        ];
    }

    /**
     * Menghitung rate spawn kemunculan musuh EnemyType 2 berdasarkan stage saat ini.
     * Rate dimulai dari 20% (0.20) pada Stage 1 dan meningkat bertahap (+4% per stage) hingga batas maksimal 50% (0.50).
     * Otomatis ter-reset kembali ke nilai awal 20% setiap kali Game Over atau Restart ke Stage 1.
     * @returns {number}
     */
    getType2SpawnRate() {
        return Math.min(0.50, 0.20 + (this.stage - 1) * 0.04);
    }

    generateSafeEnemy() {
        const padding = 70;
        const width = 42;
        const height = 42;
        const maxAttempts = 70;
        let attempts = 0;
        const speed = this.enemySpeed || ((this.player ? this.player.speed : 4) * 0.3); // 1.2

        let spawnCoord = null;
        while (attempts < maxAttempts) {
            attempts++;
            const x = padding + Math.random() * (this.canvas.width - padding * 2 - width);
            const y = padding + Math.random() * (this.canvas.height - padding * 2 - height);

            // Jarak aman dari titik spawn awal player (50, 50)
            const distToSpawn = Math.hypot(x - 50, y - 50);
            if (distToSpawn <= 120) continue;

            // Jarak aman dari lokasi PLAYER SAAT INI (tidak boleh spawn di lokasi player)
            if (this.player) {
                const playerCenterX = this.player.x + this.player.size / 2;
                const playerCenterY = this.player.y + this.player.size / 2;
                const distToPlayer = Math.hypot(x + width / 2 - playerCenterX, y + height / 2 - playerCenterY);
                if (distToPlayer <= 130) continue;
            }

            // Jarak aman dari enemy lain yang sedang aktif
            const tooClose = this.hazards.some((h) => Math.hypot(h.x - x, h.y - y) < 70);
            if (tooClose) continue;

            spawnCoord = { x: Math.round(x), y: Math.round(y) };
            break;
        }

        // Fallback aman jika arena padat
        if (!spawnCoord) {
            spawnCoord = {
                x: Math.round(220 + (Math.random() * 300)),
                y: Math.round(160 + (Math.random() * 160))
            };
        }

        // Proporsi spawn: Persentase kemunculan EnemyType 2 meningkat tipis-tipis seiring naiknya Stage,
        // namun tetap dijamin muncul minimal 1 kali di setiap stage.
        const activeType2Count = this.hazards.filter((h) => h.enemyType === 2).length;
        
        // Peluang spawn Type 2 naik tipis-tipis (+4% per stage, dari base 20% hingga cap 50%):
        // Stage 1 = 20%, Stage 2 = 24%, Stage 3 = 28%, Stage 4 = 32%, Stage 5 = 36%, Stage 6 = 40%, dst. (maks 50%)
        // Otomatis ter-reset kembali ke 20% saat game di-restart ke Stage 1
        const type2SpawnRate = this.getType2SpawnRate();

        // Batas maksimal musuh Type 2 aktif bersamaan di layar meningkat secara berimbang:
        // Stage 1-2: maks 1 | Stage 3-4: maks 2 | Stage 5+: maks 3
        const maxActiveType2 = Math.min(3, 1 + Math.floor((this.stage - 1) / 2));

        let isType2 = false;

        if (this.type2EnemiesSpawnedInStage === 0) {
            // Belum ada Type 2 sama sekali di stage ini:
            // Jaminan minimal 1: Jika antrean spawn tinggal 1 musuh atau peluang spawn terpenuhi
            if (this.spikesRemainingToSpawn <= 1 || Math.random() < Math.max(0.25, type2SpawnRate)) {
                isType2 = true;
            }
        } else {
            // Sudah pernah muncul minimal 1 di stage ini:
            // Kemunculan musuh Type 2 berikutnya mengikuti persentase stage yang semakin tinggi
            if (activeType2Count < maxActiveType2 && Math.random() < type2SpawnRate) {
                isType2 = true;
            }
        }

        if (isType2) {
            this.type2EnemiesSpawnedInStage++;
            return new EnemyType2(spawnCoord.x, spawnCoord.y, 46, 46, "enemy.png", ".canvas-container", speed * 0.9);
        }
        return new Enemy(spawnCoord.x, spawnCoord.y, width, height, "enemy.png", ".canvas-container", speed);
    }

    replenishHazards() {
        // Isi arena hingga maksimal 5 enemy aktif selama masih ada kuota stage tersisa
        while (this.hazards.length < this.maxActiveSpikes && this.spikesRemainingToSpawn > 0) {
            const enemy = this.generateSafeEnemy();
            if (enemy) {
                this.hazards.push(enemy);
                this.spikesRemainingToSpawn--;
            } else {
                break;
            }
        }
    }

    replenishCoins() {
        // Isi arena hingga maksimal 5 koin aktif selama masih ada kuota stage tersisa
        while (this.coins.length < this.maxActiveCoins && this.coinsRemainingToSpawn > 0) {
            const coin = new Coin(this.canvas.width, this.canvas.height, this.hazards, this.player);
            this.coins.push(coin);
            this.coinsRemainingToSpawn--;
        }
    }

    playSound(audioElement, fallbackSrc, volume = 0.6) {
        try {
            let sound = null;
            if (audioElement && typeof audioElement.cloneNode === "function") {
                sound = audioElement.cloneNode();
            } else {
                sound = new Audio(fallbackSrc);
            }
            sound.volume = volume;

            // Bersihkan instance audio saat pemutaran selesai untuk mencegah kebocoran memori (memory leak)
            const cleanup = () => {
                sound.removeEventListener("ended", cleanup);
                sound.removeEventListener("error", cleanup);
                sound.pause();
                sound.src = "";
            };
            sound.addEventListener("ended", cleanup, { once: true });
            sound.addEventListener("error", cleanup, { once: true });

            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Browser autoplay policy prevention fallback
                    cleanup();
                });
            }
        } catch (e) {
            try {
                const sound = new Audio(fallbackSrc);
                sound.volume = volume;
                sound.play().catch(() => {});
            } catch (err) {}
        }
    }

    playSkillCastingSound() {
        this.playSound(this.sfxSkillCast, "SkillCasting.mp3", 0.65);
    }

    playHitSound() {
        this.playSound(this.sfxHit, "Hit.mp3", 0.7);
    }

    playWinSound() {
        this.playSound(this.sfxWin, "win.mp3", 0.75);
    }

    playLoseSound() {
        this.playSound(this.sfxLose, "lose.mp3", 0.75);
    }

    playHealSound() {
        this.playSound(this.sfxHeal, "heal.mp3", 0.7);
    }

    startGame() {
        if (this.gameState !== "MENU") return;
        this.gameState = "PLAYING";
        if (this.mainMenuOverlay) {
            this.mainMenuOverlay.classList.add("hidden");
        }
        this.timer.start();
        // Ketika game dimulai, seluruh skill player langsung masuk masa cooldown awal
        this.triggerInitialSkillsCooldown();
    }

    /**
     * Memulai cooldown untuk seluruh skill player saat permainan dimulai.
     */
    triggerInitialSkillsCooldown() {
        if (!this.player || !this.activationCalculator) return;
        this.activationCalculator.startAllCooldowns(this.player);
        this.updateSkillsCooldownHUD();
    }

    /**
     * Mendaftarkan konfigurasi seluruh skill yang dapat digunakan Player.
     */
    initPlayerSkills() {
        if (!this.player || !this.activationCalculator) return;

        Object.values(this.skillDefinitions).forEach((def) => {
            this.activationCalculator.registerSkill(this.player, def.id, {
                requiredKills: def.requiredKills || 0,
                cooldown: def.cooldown || 0
            });
        });
    }

    /**
     * Inisialisasi event listener interaktif untuk kartu pemilihan skill pada Main Menu.
     */
    initSkillSelectionUI() {
        const grid = document.getElementById("skill-selection-grid");
        if (!grid) return;

        const cards = grid.querySelectorAll(".skill-card");
        cards.forEach((card) => {
            card.addEventListener("click", () => {
                const skillId = card.getAttribute("data-skill-id");
                if (skillId) {
                    this.toggleSkillSelection(skillId);
                }
            });
        });

        this.refreshSkillSelectionUI();
    }

    /**
     * Mengatur pemilihan skill: memilih/mengganti skill ke dalam loadout 3 slot.
     * @param {string} skillId 
     */
    toggleSkillSelection(skillId) {
        const existingIdx = this.loadout.indexOf(skillId);

        if (existingIdx !== -1) {
            // Jika sudah ada di loadout: lepaskan jika loadout memiliki lebih dari 1 skill
            if (this.loadout.length > 1) {
                this.loadout.splice(existingIdx, 1);
            }
        } else {
            // Jika belum ada di loadout:
            if (this.loadout.length >= 3) {
                // Ganti skill slot terakhir (FIFO)
                this.loadout.shift();
            }
            this.loadout.push(skillId);
        }

        this.refreshSkillSelectionUI();
        this.updateSkillsCooldownHUD();
    }

    /**
     * Sinkronisasi visual status kartu dan keterangan loadout di Main Menu.
     */
    refreshSkillSelectionUI() {
        const grid = document.getElementById("skill-selection-grid");
        if (!grid) return;

        const keyLabels = ["Z", "X", "C"];
        const cards = grid.querySelectorAll(".skill-card");

        cards.forEach((card) => {
            const skillId = card.getAttribute("data-skill-id");
            const slotIndex = this.loadout.indexOf(skillId);
            const slotTag = card.querySelector(".skill-slot-tag");

            if (slotIndex !== -1) {
                card.classList.add("selected");
                card.setAttribute("data-slot", keyLabels[slotIndex]);
                if (slotTag) {
                    slotTag.textContent = `Slot [${keyLabels[slotIndex]}]`;
                }
            } else {
                card.classList.remove("selected");
                card.removeAttribute("data-slot");
                if (slotTag) {
                    slotTag.textContent = "Pilih";
                }
            }
        });

        // Perbarui rangkuman teks loadout (Aman dari risiko XSS / DOM Injection)
        const summaryText = document.getElementById("loadout-summary-text");
        if (summaryText) {
            summaryText.replaceChildren();
            summaryText.appendChild(document.createTextNode("Loadout Aktif: "));
            this.loadout.forEach((id, idx) => {
                if (idx > 0) {
                    summaryText.appendChild(document.createTextNode(" | "));
                }
                const def = this.skillDefinitions[id];
                const name = def ? def.name : id;
                const strong = document.createElement("strong");
                strong.textContent = `[${keyLabels[idx]}] ${name}`;
                summaryText.appendChild(strong);
            });
        }

        // Perbarui label nama skill di HUD atas
        this.hudSlots.forEach((slot, idx) => {
            const skillId = this.loadout[idx];
            if (slot.name) {
                if (skillId && this.skillDefinitions[skillId]) {
                    slot.name.textContent = this.skillDefinitions[skillId].name;
                } else {
                    slot.name.textContent = "-";
                }
            }
        });
    }

    /**
     * Mengeksekusi skill berdasarkan indeks slot loadout (0: Z, 1: X, 2: C).
     * @param {number} slotIndex 
     */
    useSlot(slotIndex) {
        if (this.gameState !== "PLAYING") return;
        const skillId = this.loadout[slotIndex];
        if (!skillId) return;

        this.castSkill(skillId);
    }

    /**
     * Dispatcher eksekusi skill yang dipilih (Skill 1 s/d Skill 5).
     * @param {string} skillId 
     */
    castSkill(skillId) {
        switch (skillId) {
            case "skill1":
                this.useSkill1();
                break;
            case "skill2":
                this.useSkill2();
                break;
            case "skill3":
                this.useSkill3();
                break;
            case "skill4":
                this.useSkill4();
                break;
            case "skill5":
                this.useSkill5();
                break;
        }
    }

    useSkill1() {
        if (this.gameState !== "PLAYING") return;
        if (!this.activationCalculator.canActivate(this.player, "skill1")) return;

        this.activationCalculator.consumeActivation(this.player, "skill1");

        // Facing direction: 1 means left, -1 means right
        const dirX = (this.player.facingDirection === -1) ? 1 : -1;
        const spawnX = (dirX === 1) ? (this.player.x + this.player.size) : (this.player.x - 44);
        const spawnY = this.player.y + (this.player.size / 2) - 18;

        const projectile = new Skill1(spawnX, spawnY, dirX, 0, ".canvas-container");
        this.projectiles.push(projectile);
        this.playSkillCastingSound();
        this.updateSkillsCooldownHUD();
    }

    useSkill2() {
        if (this.gameState !== "PLAYING") return;
        if (!this.activationCalculator.canActivate(this.player, "skill2")) return;

        this.activationCalculator.consumeActivation(this.player, "skill2");

        const dirX = (this.player.facingDirection === -1) ? 1 : -1;
        const spawnX = (dirX === 1) ? (this.player.x + this.player.size) : (this.player.x - 52);
        const spawnY = this.player.y + (this.player.size / 2) - 20;

        const projectile = new Skill2(spawnX, spawnY, dirX, 0, ".canvas-container");
        this.projectiles.push(projectile);
        this.playSkillCastingSound();
        this.updateSkillsCooldownHUD();
    }

    useSkill3() {
        if (this.gameState !== "PLAYING") return;

        // Validasi syarat aktivasi cooldown
        if (!this.activationCalculator.canActivate(this.player, "skill3")) {
            const cooldownRem = this.activationCalculator.getCooldownRemaining(this.player, "skill3");
            if (cooldownRem > 0) {
                this.showDangerAlert(`Orbiting Orbs masih cooldown (${cooldownRem.toFixed(1)}s)!`);
            }
            return;
        }

        // Jika bola orbit sebelumnya masih aktif berputar, cegah casting tumpuk
        if (this.player.activeSkill3 && this.player.activeSkill3.isAlive) {
            this.showDangerAlert("Orbiting Orbs sedang aktif!");
            return;
        }

        this.activationCalculator.consumeActivation(this.player, "skill3");

        // Munculkan Skill 3 milik Player (Faksi A) yang melingkari tubuhnya (Durasi 7 detik)
        this.player.activeSkill3 = new Skill3(this.player, {
            radius: 66,
            orbCount: 4,
            duration: 7000,
            containerSelector: ".canvas-container"
        });

        this.playSkillCastingSound();
        this.showHealAlert("Orbiting Orbs diaktifkan!");
        this.updateSkillsCooldownHUD();
    }

    useSkill4() {
        if (this.gameState !== "PLAYING") return;

        // Validasi syarat aktivasi: Memerlukan 3 kill musuh & Cooldown 7 detik
        if (!this.activationCalculator.canActivate(this.player, "skill4")) {
            const progress = this.activationCalculator.getKillProgress(this.player, "skill4");
            const cooldownRem = this.activationCalculator.getCooldownRemaining(this.player, "skill4");

            if (cooldownRem > 0) {
                this.showDangerAlert(`Continuous Beam masih cooldown (${cooldownRem.toFixed(1)}s)!`);
            } else if (!progress.isMet) {
                const needed = progress.required - progress.current;
                this.showDangerAlert(`Continuous Beam butuh ${needed} kill lagi (${progress.current}/${progress.required})!`);
            }
            return;
        }

        this.activationCalculator.consumeActivation(this.player, "skill4");

        const beam = new Skill4(this.player, {
            duration: 2000,
            thickness: 38,
            damage: 1,
            tickRate: 200
        });
        this.activeBeams.push(beam);
        this.playSkillCastingSound();
        this.updateSkillsCooldownHUD();
    }

    useSkill5() {
        if (this.gameState !== "PLAYING") return;

        // Validasi syarat aktivasi: Cooldown 5 detik
        if (!this.activationCalculator.canActivate(this.player, "skill5")) {
            const cooldownRem = this.activationCalculator.getCooldownRemaining(this.player, "skill5");
            if (cooldownRem > 0) {
                this.showDangerAlert(`Hex Shield masih cooldown (${cooldownRem.toFixed(1)}s)!`);
            }
            return;
        }

        // Cek apakah perisai sudah aktif pada Player
        if (this.player.shield && this.player.shield.isAlive) {
            if (this.player.shield.stacks < 2) {
                // Stack bertambah menjadi 2X (dapat melindungi dari serangan sebanyak 2x)
                this.player.shield.addStack(1);
                this.activationCalculator.consumeActivation(this.player, "skill5");
                this.playSkillCastingSound();
                this.showHealAlert("Hex Shield bertambah (+1 stack)!");
            } else {
                this.showDangerAlert("Hex Shield sudah maksimal (2/2)!");
                return;
            }
        } else {
            // Perisai baru dengan 1 stack
            new Skill5(this.player, { stacks: 1, maxStacks: 2 });
            this.activationCalculator.consumeActivation(this.player, "skill5");
            this.playSkillCastingSound();
            this.showHealAlert("Hex Shield diaktifkan!");
        }

        this.updateSkillsCooldownHUD();
    }

    /**
     * Memperbarui indikator status dan cooldown seluruh slot skill aktif pada HUD header.
     */
    updateSkillsCooldownHUD() {
        if (!this.activationCalculator) return;

        this.hudSlots.forEach((slot, idx) => {
            const skillId = this.loadout[idx];
            if (!skillId) {
                if (slot.status) slot.status.textContent = "EMPTY";
                if (slot.badge) slot.badge.className = "skill-badge locked";
                return;
            }

            const def = this.skillDefinitions[skillId];
            if (slot.name && def) {
                slot.name.textContent = def.name;
            }

            const activeDuration = skillId === "skill4" ? 2000 : 0;
            const status = this.activationCalculator.getHUDStatus(this.player, skillId, activeDuration);

            if (slot.status) {
                slot.status.textContent = status.text;
            }
            if (slot.badge) {
                slot.badge.className = `skill-badge ${status.cssClass}`.trim();
            }
        });
    }

    createSpikeExplosion(centerX, centerY) {
        const particleCount = 14;
        const colors = ["#ef4444", "#f97316", "#facc15", "#ffffff"];
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 18,
                maxLife: 18
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach((p) => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    updateHpDisplay() {
        if (!this.hpDisplay) return;
        const total = this.player.maxHp;
        const current = Math.max(0, this.player.hp);
        let hearts = "";
        for (let i = 0; i < total; i++) {
            hearts += (i < current) ? "❤️" : "🖤";
        }
        this.hpDisplay.textContent = `${hearts} (${current}/${total})`;
    }

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `${this.stageScore} / ${this.targetScore}`;
        }
    }

    handleTimerTick(remainingSeconds) {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `${remainingSeconds}s`;
        }
    }

    handleTimerComplete() {
        if (this.gameState === "PLAYING") {
            this.gameState = "LOST";
            this.endGame("Game Over - Waktu Habis!", "lose");
        }
    }

    registerEvents() {
        window.addEventListener("keydown", (event) => {
            if (Object.prototype.hasOwnProperty.call(this.keys, event.code)) {
                this.keys[event.code] = true;
                if (event.code.startsWith("Arrow")) {
                    event.preventDefault();
                }
            }

            // Eksekusi skill dinamis sesuai 3 Slot Loadout yang dipilih
            if (event.code === "KeyZ") {
                this.useSlot(0);
            } else if (event.code === "KeyX") {
                this.useSlot(1);
            } else if (event.code === "KeyC") {
                this.useSlot(2);
            }

            // Shortcut to start game from main menu
            if (this.gameState === "MENU" && (event.code === "Enter" || event.code === "Space")) {
                event.preventDefault();
                this.startGame();
            }

            // Shortcut to progress to next stage
            if (this.gameState === "STAGE_CLEARED" && (event.code === "Enter" || event.code === "Space")) {
                event.preventDefault();
                this.startNextStage();
            }
        });

        window.addEventListener("keyup", (event) => {
            if (Object.prototype.hasOwnProperty.call(this.keys, event.code)) {
                this.keys[event.code] = false;
            }
        });

        if (this.coinColorPicker) {
            this.coinColorPicker.addEventListener("input", (event) => {
                const val = event.target.value;
                // Validasi format kode warna heksadesimal 6-digit yang aman
                if (typeof val === "string" && /^#[0-9a-fA-F]{6}$/.test(val)) {
                    this.coinColor = val;
                }
            });
        }

        if (this.coinSizeSlider) {
            this.coinSizeSlider.addEventListener("input", (event) => {
                const parsed = parseInt(event.target.value, 10);
                if (!Number.isNaN(parsed)) {
                    // Batasi ukuran radius koin dalam rentang aman [6px - 22px]
                    this.coinRadius = Math.min(22, Math.max(6, parsed));
                    if (this.coinSizeValue) {
                        this.coinSizeValue.textContent = `${this.coinRadius}px`;
                    }
                }
            });
        }

        if (this.bgUploadInput) {
            this.bgUploadInput.addEventListener("change", (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;

                // Batasi berkas maksimal 5MB dan hanya izinkan raster image murni (mencegah SVG XSS injection)
                const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
                const maxSizeBytes = 5 * 1024 * 1024;

                if (!allowedTypes.includes(file.type)) {
                    this.showDangerAlert("Format gambar tidak didukung! Gunakan PNG/JPG/WebP/GIF.");
                    event.target.value = "";
                    return;
                }

                if (file.size > maxSizeBytes) {
                    this.showDangerAlert("Ukuran gambar terlalu besar! Maksimal 5MB.");
                    event.target.value = "";
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (typeof e.target.result === "string" && e.target.result.startsWith("data:image/")) {
                        this.backgroundImage.src = e.target.result;
                    }
                };
                reader.onerror = () => {
                    this.showDangerAlert("Gagal memuat berkas gambar latar belakang!");
                };
                reader.readAsDataURL(file);
            });
        }

        // Main Menu Play Button
        if (this.playBtn) {
            this.playBtn.addEventListener("click", () => {
                this.startGame();
            });
        }

        // Overlay Restart Button (Main Langsung dengan Skill yang Sama)
        if (this.restartBtn) {
            this.restartBtn.addEventListener("click", () => {
                this.restartGame();
            });
        }

        // Overlay Return to Menu Button (Kembali Pilih Ulang Skill)
        if (this.returnMenuBtn) {
            this.returnMenuBtn.addEventListener("click", () => {
                this.returnToSkillSelection();
            });
        }

        // HUD Header Restart Button
        if (this.headerRestartBtn) {
            this.headerRestartBtn.addEventListener("click", () => {
                this.restartGame();
            });
        }

        // Next Stage Button
        if (this.nextStageBtn) {
            this.nextStageBtn.addEventListener("click", () => {
                this.startNextStage();
            });
        }
    }

    checkCircleRectCollision(circleX, circleY, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(circleX, rect.x + rect.size));
        const closestY = Math.max(rect.y, Math.min(circleY, rect.y + rect.size));
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
    }

    checkRectCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.size > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.size > rect2.y
        );
    }

    showDangerAlert(message = "Bahaya!") {
        if (!this.dangerAlert) return;
        this.dangerAlert.textContent = message;
        this.dangerAlert.classList.add("active");

        if (this.hpDisplay) {
            this.hpDisplay.classList.remove("damaged", "healed");
            void this.hpDisplay.offsetWidth; // trigger reflow
            this.hpDisplay.classList.add("damaged");
        }

        clearTimeout(this.dangerTimeout);
        this.dangerTimeout = setTimeout(() => {
            this.dangerAlert.classList.remove("active");
        }, 1200);
    }

    showHealAlert(message = "+1 HP Pulih!") {
        if (!this.healAlert) return;
        this.healAlert.textContent = message;
        this.healAlert.classList.add("active");

        if (this.hpDisplay) {
            this.hpDisplay.classList.remove("damaged", "healed");
            void this.hpDisplay.offsetWidth; // trigger reflow
            this.hpDisplay.classList.add("healed");
        }

        clearTimeout(this.healTimeout);
        this.healTimeout = setTimeout(() => {
            this.healAlert.classList.remove("active");
        }, 1200);
    }

    checkGameStatus() {
        if (this.stageScore >= this.targetScore && this.gameState === "PLAYING") {
            this.handleStageComplete();
        }
    }

    handleStageComplete() {
        this.gameState = "STAGE_CLEARED";
        this.timer.pause();
        this.playWinSound();

        const nextStageNum = this.stage + 1;
        const nextTarget = Math.round((100 * Math.pow(1.2, nextStageNum - 1)) / 10) * 10;
        const nextSpikes = Math.min(12, 3 + nextStageNum);
        const nextSpikePoints = nextSpikes * this.enemyValue;
        const nextCoins = Math.max(3, Math.round((nextTarget - nextSpikePoints) / this.coinValue));

        if (this.stageClearTitle) {
            this.stageClearTitle.textContent = `Stage ${this.stage} Cleared! 🎉`;
        }
        if (this.stageClearDesc) {
            this.stageClearDesc.textContent = `Target ${this.targetScore} poin berhasil dicapai!`;
        }
        if (this.nextStageName) {
            this.nextStageName.textContent = `Stage ${nextStageNum}`;
        }
        if (this.nextStageTarget) {
            this.nextStageTarget.textContent = `${nextTarget} Poin`;
        }
        if (this.nextStageSpikes) {
            this.nextStageSpikes.textContent = `Total Kuota: ${nextSpikes} Enemy (${nextSpikePoints} Pts) + ${nextCoins} Koin (${nextCoins * this.coinValue} Pts) [Maksimal 5 di layar]`;
        }

        if (this.stageClearOverlay) {
            this.stageClearOverlay.classList.remove("hidden");
        }
    }

    startNextStage() {
        this.stage++;
        this.calculateStageSpawn();
        this.stageScore = 0;

        if (this.stageClearOverlay) {
            this.stageClearOverlay.classList.add("hidden");
        }

        this.gameState = "PLAYING";

        // Reward clear stage: sembuhkan 1 HP
        this.player.heal(1);
        this.updateHpDisplay();

        // Reposisi player ke titik aman
        this.player.respawn();

        // Bersihkan proyektil, beam, dan partikel sebelumnya
        this.projectiles.forEach((p) => p.destroy());
        this.projectiles = [];
        this.activeBeams.forEach((b) => b.destroy());
        this.activeBeams = [];
        this.particles = [];

        // Bersihkan enemy DOM elements lama
        this.hazards.forEach((h) => {
            if (h.destroy) h.destroy();
        });
        this.hazards = [];
        this.coins = [];

        // Isi ulang hingga maksimal 5 dari kuota baru
        this.replenishHazards();
        this.replenishCoins();

        // Inisialisasi ulang tepat 2 potion untuk stage baru
        this.initStagePotions();

        if (this.stageDisplay) {
            this.stageDisplay.textContent = this.stage;
        }
        this.updateScoreDisplay();

        // Durasi timer progresif sesuai stage
        const stageDuration = Math.min(95, Math.round(55 + this.stage * 5));
        this.timer.reset(stageDuration);
        this.timer.start();

        // Skill player masuk masa cooldown saat stage baru dimulai
        this.triggerInitialSkillsCooldown();

        this.showHealAlert(`Stage ${this.stage} Dimulai!`);
    }

    endGame(message, cssClass) {
        if (cssClass === "lose") {
            this.playLoseSound();
        }
        if (this.statusOverlay && this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = cssClass;
            if (this.gameOverDesc) {
                this.gameOverDesc.textContent = `Kamu bertahan hingga Stage ${this.stage} (Total Skor: ${this.totalScore})`;
            }
            this.statusOverlay.classList.remove("hidden");
        }
    }

    /**
     * Helper DRY untuk mereset seluruh entitas, proyektil, kalkulator, dan lingkungan stage.
     * Mengembalikan Stage ke 1, mereset target skor, kuota musuh, dan mengembalikan rate spawn
     * EnemyType 2 ke nilai dasar awal (20%).
     */
    resetStageAndEntities() {
        this.stage = 1;
        this.calculateStageSpawn();
        this.type2EnemiesSpawnedInStage = 0;
        this.stageScore = 0;
        this.totalScore = 0;

        if (this.statusOverlay) {
            this.statusOverlay.classList.add("hidden");
        }
        if (this.stageClearOverlay) {
            this.stageClearOverlay.classList.add("hidden");
        }

        // Clean up projectiles, beams, particles, and active skills
        this.projectiles.forEach((p) => p.destroy());
        this.projectiles = [];
        this.activeBeams.forEach((b) => b.destroy());
        this.activeBeams = [];
        this.particles = [];

        if (this.activationCalculator) {
            this.activationCalculator.reset(this.player);
        }
        this.updateSkillsCooldownHUD();

        this.player.reset();
        this.updateHpDisplay();

        // Bersihkan enemy DOM elements lama
        this.hazards.forEach((h) => {
            if (h.destroy) h.destroy();
        });
        this.hazards = [];
        this.coins = [];

        this.replenishHazards();
        this.replenishCoins();

        // Reset ulang 2 potion untuk restart game
        this.initStagePotions();

        if (this.stageDisplay) {
            this.stageDisplay.textContent = this.stage;
        }
        this.updateScoreDisplay();

        this.timer.reset(60);
    }

    /**
     * Opsi Game Over 1: Restart langsung dengan 3 skill yang sedang aktif.
     */
    restartGame() {
        this.resetStageAndEntities();
        this.gameState = "PLAYING";

        if (this.mainMenuOverlay) {
            this.mainMenuOverlay.classList.add("hidden");
        }

        this.timer.start();
        // Ketika game di-restart, seluruh skill player langsung masuk masa cooldown
        this.triggerInitialSkillsCooldown();
    }

    /**
     * Opsi Game Over 2: Kembali ke Main Menu untuk memilih ulang 3 skill.
     */
    returnToSkillSelection() {
        this.resetStageAndEntities();
        this.gameState = "MENU";

        if (this.mainMenuOverlay) {
            this.mainMenuOverlay.classList.remove("hidden");
        }

        this.refreshSkillSelectionUI();
    }

    update() {
        if (this.gameState !== "PLAYING") {
            return;
        }

        this.player.update(this.keys, this.canvas.width, this.canvas.height);
        this.updateSkillsCooldownHUD();

        // Update Skill 5 (Hex Shield) jika aktif pada Player
        if (this.player.shield && this.player.shield.isAlive) {
            this.player.shield.update(this.canvas.width, this.canvas.height);
        }

        // Update Skill 3 (Orbiting Orbs) jika aktif pada Player
        if (this.player.activeSkill3 && this.player.activeSkill3.isAlive) {
            this.player.activeSkill3.update(this.canvas.width, this.canvas.height);
        }

        // Periksa benturan antara bola orbit milik Player (Faksi A) dengan musuh (Faksi B)
        if (this.player.activeSkill3 && this.player.activeSkill3.isAlive) {
            for (let j = this.hazards.length - 1; j >= 0; j--) {
                if (!this.player.activeSkill3 || !this.player.activeSkill3.isAlive) {
                    break;
                }

                const enemy = this.hazards[j];
                if (!enemy || !enemy.isAlive) continue;

                const hitOrb = this.player.activeSkill3.checkCollisionWithTarget(enemy);
                if (hitOrb) {
                    this.playHitSound();
                    const hitX = enemy.x + enemy.width / 2;
                    const hitY = enemy.y + enemy.height / 2;
                    this.createSpikeExplosion(hitX, hitY);

                    // Hancurkan bola yang menabrak
                    hitOrb.destroy();

                    // Kurangi HP musuh
                    const isKilled = enemy.takeDamage ? enemy.takeDamage(hitOrb.damage || 1) : true;
                    if (isKilled) {
                        const earnedScore = enemy.scoreValue || this.enemyValue;
                        if (enemy.destroy) enemy.destroy();
                        this.hazards.splice(j, 1);

                        this.stageScore += earnedScore;
                        this.totalScore += earnedScore;
                        this.updateScoreDisplay();

                        if (this.activationCalculator) {
                            this.activationCalculator.recordKill(this.player, 1, { source: "skill3" });
                            this.updateSkillsCooldownHUD();
                        }

                        this.replenishHazards();
                        this.checkGameStatus();
                    }

                    // Cek jika seluruh bola orbit telah habis setelah benturan ini
                    if (this.player.activeSkill3) {
                        const hasLivingOrbs = this.player.activeSkill3.orbs && this.player.activeSkill3.orbs.some((o) => o && o.isAlive);
                        if (!hasLivingOrbs) {
                            this.player.activeSkill3.destroy();
                            this.player.activeSkill3 = null;
                            break;
                        }
                    }
                }
            }
        }

        // Projectile updates & Faction-aware collision check
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(this.canvas.width, this.canvas.height);

            if (!proj.isAlive) {
                this.projectiles.splice(i, 1);
                continue;
            }

            let projConsumed = false;

            for (let j = this.hazards.length - 1; j >= 0; j--) {
                const enemy = this.hazards[j];

                // Aturan Faksi: Proyektil Faksi A HANYA bisa melukai Faksi B
                if (!Faction.canDamage(proj, enemy)) {
                    continue;
                }

                // 1. Benturan proyektil dengan perisai Skill 3 Musuh Jenis 2 (Projectile Clash)
                if (enemy.skill3 && enemy.skill3.isAlive && enemy.skill3.orbs) {
                    for (let o = enemy.skill3.orbs.length - 1; o >= 0; o--) {
                        const orb = enemy.skill3.orbs[o];
                        if (orb.isAlive && proj.checkCollision(orb)) {
                            this.playHitSound();
                            this.createSpikeExplosion(orb.x + orb.width / 2, orb.y + orb.height / 2);
                            orb.destroy();
                            proj.destroy();
                            this.projectiles.splice(i, 1);
                            projConsumed = true;
                            break;
                        }
                    }
                    if (projConsumed) break;
                }

                // 2. Tabrakan proyektil dengan tubuh musuh
                if (proj.checkCollision(enemy)) {
                    this.playHitSound();
                    const hitX = enemy.x + enemy.width / 2;
                    const hitY = enemy.y + enemy.height / 2;
                    this.createSpikeExplosion(hitX, hitY);

                    // Kurangi HP musuh dengan takeDamage()
                    const isKilled = enemy.takeDamage ? enemy.takeDamage(proj.damage || 1) : true;

                    if (isKilled) {
                        const earnedScore = enemy.scoreValue || this.enemyValue;
                        if (enemy.destroy) enemy.destroy();
                        this.hazards.splice(j, 1);

                        // Tambahkan poin dari enemy yang dihancurkan (+10 poin)
                        this.stageScore += earnedScore;
                        this.totalScore += earnedScore;
                        this.updateScoreDisplay();

                        // Catat kill musuh ke kalkulator aktivasi skill Player (dari proyektil)
                        if (this.activationCalculator) {
                            this.activationCalculator.recordKill(this.player, 1, { source: "projectile" });
                            this.updateSkillsCooldownHUD();
                        }

                        // Spawn enemy baru dari antrean jika kuota stage masih ada (maksimal 5 di layar)
                        this.replenishHazards();
                        this.checkGameStatus();
                    }

                    proj.destroy();
                    this.projectiles.splice(i, 1);
                    projConsumed = true;
                    break;
                }
            }
        }

        // Periksa benturan Skill 3 milik EnemyType 2 (Faksi B) ke Player (Faksi A)
        this.hazards.forEach((enemy) => {
            if (enemy.skill3 && enemy.skill3.isAlive && enemy.skill3.orbs) {
                enemy.skill3.orbs.forEach((orb) => {
                    if (orb.isAlive && orb.checkCollision(this.player)) {
                        if (Faction.canDamage(orb, this.player)) {
                            const dmgResult = this.player.takeDamage(orb.damage || 1);
                            const orbCenterX = orb.x + orb.width / 2;
                            const orbCenterY = orb.y + orb.height / 2;

                            if (dmgResult === "absorbed") {
                                // Kerusakan diserap seutuhnya oleh Hex Shield!
                                this.playHitSound();
                                this.player.applyKnockback(orbCenterX, orbCenterY, 14);
                                this.createSpikeExplosion(orbCenterX, orbCenterY);
                                orb.destroy();
                                const remStacks = (this.player.shield && this.player.shield.isAlive) ? this.player.shield.stacks : 0;
                                this.showDangerAlert(`🛡️ Serangan diserap perisai! (${remStacks} stack tersisa)`);
                                this.updateSkillsCooldownHUD();
                            } else if (dmgResult === true) {
                                // Serangan menembus dan mengurangi nyawa (HP) Player
                                this.playHitSound();
                                this.updateHpDisplay();

                                this.player.applyKnockback(orbCenterX, orbCenterY, 14);
                                this.createSpikeExplosion(orbCenterX, orbCenterY);
                                orb.destroy();

                                if (this.player.hp <= 0) {
                                    this.player.respawn();
                                    this.gameState = "LOST";
                                    this.timer.pause();
                                    this.endGame("Game Over - Habis Nyawa!", "lose");
                                }
                            }
                        }
                    }
                });
            }
        });

        // Continuous Energy Beam (Skill 4) updates & continuous damage check
        for (let b = this.activeBeams.length - 1; b >= 0; b--) {
            const beam = this.activeBeams[b];
            beam.update(this.canvas.width, this.canvas.height);

            if (!beam.isAlive) {
                this.activeBeams.splice(b, 1);
                continue;
            }

            // Beam menembus dan menyerang musuh (Faksi B)
            for (let j = this.hazards.length - 1; j >= 0; j--) {
                const enemy = this.hazards[j];

                // Cek apakah beam bersinggungan dengan bola Skill 3 musuh
                if (enemy.skill3 && enemy.skill3.isAlive && enemy.skill3.orbs) {
                    for (let o = enemy.skill3.orbs.length - 1; o >= 0; o--) {
                        const orb = enemy.skill3.orbs[o];
                        if (orb.isAlive && beam.checkCollision(orb) && beam.canDamageTarget(orb)) {
                            this.playHitSound();
                            this.createSpikeExplosion(orb.x + orb.width / 2, orb.y + orb.height / 2);
                            orb.destroy();
                        }
                    }
                }

                // Cek apakah beam mengenai tubuh musuh
                if (beam.checkCollision(enemy) && beam.canDamageTarget(enemy)) {
                    this.playHitSound();
                    const hitX = enemy.x + enemy.width / 2;
                    const hitY = enemy.y + enemy.height / 2;
                    this.createSpikeExplosion(hitX, hitY);

                    const isKilled = enemy.takeDamage ? enemy.takeDamage(beam.damage) : true;
                    if (isKilled) {
                        const earnedScore = enemy.scoreValue || this.enemyValue;
                        if (enemy.destroy) enemy.destroy();
                        this.hazards.splice(j, 1);

                        this.stageScore += earnedScore;
                        this.totalScore += earnedScore;
                        this.updateScoreDisplay();

                        // Catat kill musuh ke kalkulator aktivasi skill Player (dari tembakan beam)
                        if (this.activationCalculator) {
                            this.activationCalculator.recordKill(this.player, 1, { source: "beam" });
                            this.updateSkillsCooldownHUD();
                        }

                        this.replenishHazards();
                        this.checkGameStatus();
                    }
                }
            }
        }

        this.updateParticles();

        // Coin collection check (1 coin = 10 poin)
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (this.checkCircleRectCollision(coin.x, coin.y, this.coinRadius, this.player)) {
                this.coins.splice(i, 1);
                this.stageScore += this.coinValue;
                this.totalScore += this.coinValue;
                this.updateScoreDisplay();

                // Spawn koin baru dari antrean jika kuota stage masih ada (maksimal 5 di layar)
                this.replenishCoins();

                this.checkGameStatus();
            }
        }

        // Update pergerakan Enemy mendekati player (kecepatan ~0.6 player)
        this.hazards.forEach((hazard) => {
            if (hazard.update) {
                hazard.update(this.player, this.canvas.width, this.canvas.height, this.hazards);
            }
        });

        // Update pergerakan acak Potion (~0.2 speed player)
        this.potions.forEach((potion) => {
            if (potion.update) {
                potion.update(this.canvas.width, this.canvas.height);
            }
        });

        // Potion (Healing environment) collision check - MAKSIMAL 2 PER STAGE, SEKALI PAKAI TIDAK MUNCUL LAGI
        for (let i = this.potions.length - 1; i >= 0; i--) {
            const potion = this.potions[i];
            if (this.checkCircleRectCollision(potion.x, potion.y, potion.radius, this.player)) {
                if (this.player.hp < this.player.maxHp) {
                    this.player.heal(1);
                    this.playHealSound();
                    this.updateHpDisplay();
                    this.showHealAlert("+1 HP Pulih!");
                    // Potion dikonsumsi dan tidak akan muncul lagi selama stage ini
                    this.potions.splice(i, 1);
                } else {
                    // Debounce alert agar tidak memicu reflow DOM setiap frame
                    const now = Date.now();
                    if (!this.lastFullHpAlert || now - this.lastFullHpAlert > 1500) {
                        this.lastFullHpAlert = now;
                        this.showHealAlert("HP sudah penuh (3/3)!");
                    }
                }
            }
        }

        // Hazard (Enemy) physical collision check (Faksi B melukai Faksi A)
        this.hazards.forEach((hazard) => {
            if (this.checkRectCollision(this.player, hazard)) {
                if (Faction.canDamage(hazard, this.player)) {
                    const dmgResult = this.player.takeDamage(1);
                    const enemyCenterX = hazard.x + hazard.width / 2;
                    const enemyCenterY = hazard.y + hazard.height / 2;

                    if (dmgResult === "absorbed") {
                        // Kerusakan ditangkis sepenuhnya oleh Skill 5 (Hex Shield)
                        this.playHitSound();
                        this.player.applyKnockback(enemyCenterX, enemyCenterY, 14);
                        this.createSpikeExplosion(enemyCenterX, enemyCenterY);
                        const remStacks = (this.player.shield && this.player.shield.isAlive) ? this.player.shield.stacks : 0;
                        this.showDangerAlert(`🛡️ Serangan diserap perisai! (${remStacks} stack tersisa)`);
                        this.updateSkillsCooldownHUD();
                    } else if (dmgResult === true) {
                        // Serangan masuk dan mengurangi nyawa (HP) Player
                        this.playHitSound();
                        this.updateHpDisplay();

                        if (this.hpDisplay) {
                            this.hpDisplay.classList.remove("damaged", "healed");
                            void this.hpDisplay.offsetWidth; // trigger reflow
                            this.hpDisplay.classList.add("damaged");
                        }

                        // Efek knockback terpental mundur menjauhi enemy
                        this.player.applyKnockback(enemyCenterX, enemyCenterY, 14);

                        // Reset location hanya terjadi apabila nyawa karakter habis (0 HP)
                        if (this.player.hp <= 0) {
                            this.player.respawn();
                            this.gameState = "LOST";
                            this.timer.pause();
                            this.endGame("Game Over - Habis Nyawa!", "lose");
                        }
                    }
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.isBackgroundLoaded) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        }

        this.hazards.forEach((hazard) => hazard.draw(this.ctx));
        this.coins.forEach((coin) => coin.draw(this.ctx, this.coinColor, this.coinRadius));
        this.potions.forEach((potion) => potion.draw(this.ctx));

        // Draw projectiles, continuous beams & destruction particles
        this.projectiles.forEach((p) => p.draw(this.ctx));
        this.activeBeams.forEach((beam) => beam.draw(this.ctx));
        this.drawParticles();

        // Gambar bola orbit Skill 3 milik Player jika sedang aktif
        if (this.player.activeSkill3 && this.player.activeSkill3.isAlive) {
            this.player.activeSkill3.draw(this.ctx);
        }

        // Gambar Player
        this.player.draw(this.ctx);

        // Gambar Hexagonal Energy Shield (Skill 5) jika sedang aktif
        if (this.player.shield && this.player.shield.isAlive) {
            this.player.shield.draw(this.ctx);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.game = new GameManager();
});
