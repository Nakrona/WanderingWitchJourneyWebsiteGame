/**
 * Faction.js
 * Sistem Faksi untuk membedakan kubu karakter dan proyektil (SRP & SOLID).
 * Faksi A: Player dan skill milik player.
 * Faksi B: Musuh (Enemy Type 1 & Enemy Type 2) dan skill milik musuh (Skill 3).
 */
const Faction = {
    A: 'FACTION_A',
    B: 'FACTION_B',

    /**
     * Memeriksa apakah dua entitas saling bermusuhan (berbeda faksi).
     * @param {Object} entityA 
     * @param {Object} entityB 
     * @returns {boolean}
     */
    isOpponent(entityA, entityB) {
        if (!entityA || !entityB) return false;
        const fA = entityA.faction;
        const fB = entityB.faction;
        if (!fA || !fB) return false;
        return fA !== fB;
    },

    /**
     * Memeriksa apakah attacker diizinkan melukai target berdasarkan aturan faksi:
     * - Skill Faksi A HANYA bisa mengenai target Faksi B (tidak bisa mengenai Faksi A).
     * - Skill Faksi B HANYA bisa mengenai target Faksi A (tidak bisa mengenai Faksi B).
     * @param {Object} attacker 
     * @param {Object} target 
     * @returns {boolean}
     */
    canDamage(attacker, target) {
        return this.isOpponent(attacker, target);
    }
};

Object.freeze(Faction);

