// gameLogic/botLogic/battleSet.js

/**
 * Prepara os times de Doodles para a batalha.
 * @param {Array} playerDoodles - A equipe de Doodles do jogador.
 * @param {Array} botDoodles - A equipe de Doodles do bot.
 * @returns {Object} Um objeto com os times de batalha inicializados.
 */
export const createBattleTeams = (playerDoodles, botDoodles) => {
  // Inicializa a equipe do jogador com HP completo e sem status
  const playerTeam = playerDoodles.map(doodle => ({ 
    ...doodle, 
    currentHp: doodle.maxHp, 
    status: null,
    isDefeated: false
  }));

  // Inicializa a equipe do bot com HP completo e sem status
  const botTeam = botDoodles.map(doodle => ({ 
    ...doodle, 
    currentHp: doodle.maxHp, 
    status: null,
    isDefeated: false
  }));

  return { playerTeam, botTeam };
};