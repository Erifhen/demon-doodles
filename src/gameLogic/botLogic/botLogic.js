// gameLogic/botLogic.js

/**
 * Decide a melhor ação para o bot neste turno.
 * @param {object} botDoodle O Doodle atual do bot em campo.
 * @param {object[]} botTeam A equipe completa do bot.
 * @returns {object} Ação escolhida: { type: 'attack'|'swap', move|doodle: any }
 */
export const getBotAction = (botDoodle, botTeam) => {
    // Lógica de troca: se a vida estiver abaixo de 50% e a sorte estiver a favor
    const hpPercentage = (botDoodle.currentHp / botDoodle.stats.hp) * 100;
    const shouldSwap = hpPercentage <= 50 && Math.random() < 0.3; // 30% de chance

    if (shouldSwap) {
        // Tenta encontrar um Doodle para trocar
        const availableDoodles = botTeam.filter(d => d.currentHp > 0 && d.id !== botDoodle.id);
        if (availableDoodles.length > 0) {
            // Escolhe um Doodle disponível aleatoriamente
            const doodleToSwap = availableDoodles[Math.floor(Math.random() * availableDoodles.length)];
            return {
                type: 'swap',
                // CORREÇÃO: Usa a propriedade 'doodle'
                doodle: doodleToSwap
            };
        }
    }

    // Se não trocar, escolhe um ataque aleatório
    const attacks = botDoodle.moveset;
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    return {
        type: 'attack',
        // CORREÇÃO: Usa a propriedade 'move'
        move: randomAttack
    };
};