/**
 * SkillActivationCalculator.js
 * Modul Kalkulator & Pengelola Syarat Aktivasi Skill (SRP, Strategy Pattern, SOLID).
 * Menghitung dan memvalidasi apakah suatu entitas (Player / Musuh) berhak mengaktifkan skill.
 * 
 * Aturan Aktivasi:
 * - Player (Faksi A): Memerlukan pemenuhan kuota kill musuh (misal: 3 kill untuk Skill 4) DAN cooldown.
 * - Musuh (Faksi B): Hanya bergantung pada cooldown tanpa memerlukan syarat kill (siap diimplementasikan).
 */
class SkillActivationCalculator {
    constructor() {
        // Menyimpan data aktivasi per entitas
        // Struktur: Map(caster -> Map(skillKey -> SkillRequirementData))
        this.entityData = new Map();
    }

    /**
     * Mendaftarkan syarat aktivasi untuk skill tertentu pada entitas/caster.
     * @param {Object} caster Objek caster (Player atau Enemy)
     * @param {string} skillKey Pengenal skill (contoh: "skill1", "skill2", "skill4")
     * @param {Object} config Konfigurasi syarat { requiredKills = 0, cooldown = 0 }
     */
    registerSkill(caster, skillKey, config = {}) {
        if (!caster) return;

        if (!this.entityData.has(caster)) {
            this.entityData.set(caster, new Map());
        }

        const skillsMap = this.entityData.get(caster);
        skillsMap.set(skillKey, {
            requiredKills: config.requiredKills || 0,
            currentKills: config.currentKills || 0,
            cooldown: config.cooldown || 0,
            lastUsedTime: 0
        });
    }

    /**
     * Menambahkan catatan kill ke caster yang berhasil mengeliminasi musuh.
     * Aturan Syarat:
     * - Kuota kill HANYA diakumulasikan jika skill yang bersangkutan telah SELESAI masa cooldown-nya.
     * - Selama skill masih aktif menembak atau masih dalam masa cooldown (misal saat beam aktif atau cooldown 7s berjalan),
     *   musuh yang terbunuh TIDAK dihitung ke dalam syarat pengaktifan skill tersebut.
     * - Kill yang dihasilkan oleh beam itu sendiri (source === "beam") juga secara spesifik diabaikan.
     * @param {Object} caster Entitas yang mendapatkan kill (Player)
     * @param {number} amount Jumlah kill (default: 1)
     * @param {Object} contextInfo Informasi sumber serangan { source: 'projectile' | 'beam' }
     */
    recordKill(caster, amount = 1, contextInfo = {}) {
        if (!caster || !this.entityData.has(caster)) return;

        const now = Date.now();
        const skillsMap = this.entityData.get(caster);
        skillsMap.forEach((data, skillKey) => {
            if (data.requiredKills > 0) {
                // 1. Cek apakah cooldown skill ini sudah benar-benar selesai
                const isCooldownFinished = (now - data.lastUsedTime >= data.cooldown);
                if (!isCooldownFinished) {
                    // Selama cooldown belum selesai, hitungan kill tidak dimasukkan
                    return;
                }

                // 2. Jika kill berasal dari tembakan beam itu sendiri, abaikan dari hitungan
                if (contextInfo.source === "beam" || contextInfo.source === "skill4") {
                    return;
                }

                // Cooldown telah selesai, akumulasikan kill baru
                data.currentKills = Math.min(data.requiredKills, data.currentKills + amount);
            }
        });
    }

    /**
     * Memeriksa apakah suatu skill memenuhi semua syarat pengaktifan:
     * 1. Apakah cooldown telah selesai?
     * 2. Apakah kuota kill terpenuhi? (Player wajib kill, Musuh bypass syarat kill).
     * @param {Object} caster 
     * @param {string} skillKey 
     * @returns {boolean}
     */
    canActivate(caster, skillKey) {
        const data = this.getSkillData(caster, skillKey);
        if (!data) return false;

        const now = Date.now();
        const isCooldownReady = (now - data.lastUsedTime >= data.cooldown);

        // Player (Faksi A) wajib memenuhi kuota kill, Musuh (Faksi B) bebas syarat kill
        const isPlayer = caster.faction === Faction.A;
        const isKillMet = !isPlayer || (data.requiredKills <= 0) || (data.currentKills >= data.requiredKills);

        return isCooldownReady && isKillMet;
    }

    /**
     * Mengonsumsi syarat aktivasi ketika skill berhasil dikeluarkan:
     * - Mencatat timestamp aktivasi untuk memulai cooldown baru.
     * - Mereset kuota kill (khusus Player).
     * @param {Object} caster 
     * @param {string} skillKey 
     */
    consumeActivation(caster, skillKey) {
        const data = this.getSkillData(caster, skillKey);
        if (!data) return;

        data.lastUsedTime = Date.now();
        // Reset kuota kill setelah skill digunakan
        data.currentKills = 0;
    }

    /**
     * Mengambil data skill dari suatu caster.
     * @param {Object} caster 
     * @param {string} skillKey 
     * @returns {Object|null}
     */
    getSkillData(caster, skillKey) {
        if (!caster || !this.entityData.has(caster)) return null;
        return this.entityData.get(caster).get(skillKey) || null;
    }

    /**
     * Mengambil informasi progres kuota kill untuk HUD/UI.
     * @param {Object} caster 
     * @param {string} skillKey 
     * @returns {{current: number, required: number, ratio: number, isMet: boolean}}
     */
    getKillProgress(caster, skillKey) {
        const data = this.getSkillData(caster, skillKey);
        if (!data) {
            return { current: 0, required: 0, ratio: 1, isMet: true };
        }

        const isPlayer = caster.faction === Faction.A;
        const isMet = !isPlayer || (data.requiredKills <= 0) || (data.currentKills >= data.requiredKills);
        const ratio = data.requiredKills > 0 ? Math.min(1, data.currentKills / data.requiredKills) : 1;

        return {
            current: data.currentKills,
            required: data.requiredKills,
            ratio,
            isMet
        };
    }

    /**
     * Menghitung sisa durasi cooldown dalam detik.
     * @param {Object} caster 
     * @param {string} skillKey 
     * @returns {number} Sisa cooldown (detik)
     */
    getCooldownRemaining(caster, skillKey) {
        const data = this.getSkillData(caster, skillKey);
        if (!data) return 0;

        const now = Date.now();
        return Math.max(0, (data.cooldown - (now - data.lastUsedTime)) / 1000);
    }

    /**
     * Mengambil status teks dan kelas visual untuk HUD status badge.
     * @param {Object} caster 
     * @param {string} skillKey 
     * @param {number} activeDuration Durasi aktif skill (misal 2000 ms untuk beam)
     * @returns {{text: string, cssClass: string, isReady: boolean}}
     */
    getHUDStatus(caster, skillKey, activeDuration = 0) {
        const data = this.getSkillData(caster, skillKey);
        if (!data) {
            return { text: "READY", cssClass: "", isReady: true };
        }

        const now = Date.now();
        const elapsed = now - data.lastUsedTime;
        const cooldownRem = Math.max(0, (data.cooldown - elapsed) / 1000);

        // Status khusus Skill 4 (Continuous Beam)
        if (skillKey === "skill4") {
            const isBeaming = activeDuration > 0 && elapsed < activeDuration && data.lastUsedTime > 0;
            if (isBeaming) {
                const beamRem = ((activeDuration - elapsed) / 1000).toFixed(1);
                return {
                    text: `BEAM ${beamRem}s`,
                    cssClass: "active",
                    isReady: false
                };
            }

            if (cooldownRem > 0) {
                return {
                    text: `${cooldownRem.toFixed(1)}s`,
                    cssClass: "cooldown",
                    isReady: false
                };
            }

            const killProgress = this.getKillProgress(caster, skillKey);
            if (!killProgress.isMet) {
                return {
                    text: `KILL ${killProgress.current}/${killProgress.required}`,
                    cssClass: "locked",
                    isReady: false
                };
            }

            return {
                text: `READY (${killProgress.required}/${killProgress.required})`,
                cssClass: "ready-charge",
                isReady: true
            };
        }

        // Status khusus Skill 5 (Hexagonal Shield)
        if (skillKey === "skill5") {
            const hasShield = caster.shield && caster.shield.isAlive && caster.shield.stacks > 0;
            const stacks = hasShield ? caster.shield.stacks : 0;

            if (cooldownRem > 0) {
                return {
                    text: stacks > 0 ? `${cooldownRem.toFixed(1)}s (🛡️${stacks})` : `${cooldownRem.toFixed(1)}s`,
                    cssClass: "cooldown",
                    isReady: false
                };
            }

            if (stacks >= 2) {
                return {
                    text: "MAX (2/2)",
                    cssClass: "ready-charge",
                    isReady: true
                };
            }

            if (stacks === 1) {
                return {
                    text: "STACK (+1)",
                    cssClass: "ready-charge",
                    isReady: true
                };
            }

            return {
                text: "READY",
                cssClass: "",
                isReady: true
            };
        }

        // Status khusus Skill 3 (Orbiting Orbs - Durasi 7 detik)
        if (skillKey === "skill3") {
            const isOrbiting = caster.activeSkill3 && caster.activeSkill3.isAlive;
            if (isOrbiting && typeof caster.activeSkill3.getRemainingSeconds === "function") {
                const remOrb = caster.activeSkill3.getRemainingSeconds().toFixed(1);
                return {
                    text: `ORB ${remOrb}s`,
                    cssClass: "active",
                    isReady: false
                };
            }
            if (cooldownRem > 0) {
                return {
                    text: `${cooldownRem.toFixed(1)}s`,
                    cssClass: "cooldown",
                    isReady: false
                };
            }
            if (isOrbiting) {
                return {
                    text: "ACTIVE",
                    cssClass: "active",
                    isReady: false
                };
            }
            return {
                text: "READY",
                cssClass: "",
                isReady: true
            };
        }

        // Status Skill 1 & 2 (Standar Cooldown)
        if (cooldownRem > 0) {
            return {
                text: `${cooldownRem.toFixed(1)}s`,
                cssClass: "cooldown",
                isReady: false
            };
        }

        return {
            text: "READY",
            cssClass: "",
            isReady: true
        };
    }

    /**
     * Memulai cooldown untuk seluruh skill yang terdaftar pada caster secara serentak.
     * Digunakan saat permainan pertama kali dimulai atau di-restart.
     * @param {Object} caster 
     */
    startAllCooldowns(caster) {
        if (!caster || !this.entityData.has(caster)) return;
        const now = Date.now();
        const skillsMap = this.entityData.get(caster);
        skillsMap.forEach((data) => {
            data.lastUsedTime = now;
        });
    }

    /**
     * Reset seluruh data aktivasi (digunakan saat restart game atau reset stage).
     * @param {Object} caster 
     */
    reset(caster) {
        if (!caster) {
            this.entityData.clear();
            return;
        }

        if (this.entityData.has(caster)) {
            const skillsMap = this.entityData.get(caster);
            skillsMap.forEach((data) => {
                data.currentKills = 0;
                data.lastUsedTime = 0;
            });
        }
    }
}
