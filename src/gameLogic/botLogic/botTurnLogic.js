import { getBotAction } from './botLogic';
import {
    useMove,
    handleStatusEffects,
    // Importando as novas funções de status
    handleSleepCheckStartOfTurn,
    handleConfuseCheck,
    handleSleepCheckEndOfTurn,
    handleConfuseCheckEndOfTurn
} from '../combatLogic';

/**
 * Processa um turno de batalha completo, incluindo as ações do jogador e do bot.
 * @param {object} battleState O estado atual da batalha.
 * @param {object} playerAction A ação escolhida pelo jogador (ex: { type: 'attack', move: {name: 'Ataque Rápido'}}).
 * @param {object} playerDoodle O Doodle atual do jogador em campo.
 * @param {object} botDoodle O Doodle atual do bot em campo.
 * @returns {object} O novo estado da batalha e as mensagens de log.
 */

/**
 * Verifica se um time ainda tem Doodles ativos (HP > 0).
 * @param {object[]} team O array de Doodles no time.
 * @returns {boolean} True se houver pelo menos um Doodle ativo, False caso contrário.
 */
export const hasActiveDoodles = (team) => {
    // team[0] é o Doodle ativo no campo, os outros são reservas.
    // Você deve percorrer o time todo, exceto talvez o Doodle em campo (se já foi tratado como 'fainted').
    // Assumindo que o 'team' é a lista completa, e você precisa checar se *qualquer* um está vivo:
    return team.some(doodle => doodle.stats.currentHp > 0);
};

export const processTurn = (battleState, playerAction, playerDoodle, botDoodle) => {
    let newState = { ...battleState };
    let newLog = [];
    let status = {
        playerFainted: false,
        botFainted: false,
        isGameOver: false,
    };

    // Função auxiliar para determinar a prioridade da ação
    const getPriority = (action) => {
        if (action.type === 'quit') return 5;
        // Verifica 'action.move.effect' para ataques com prioridade
        if (action.type === 'attack' && action.move?.effect === 'priority') return 4;
        if (action.type === 'swap') return 3;
        if (action.type === 'item') return 2;
        return 1;
    };

    // O Bot escolhe sua ação
    const botAction = getBotAction(newState.botDoodle, newState.botTeam);

    // Determinar a ordem de prioridade das ações
    const actions = [
        { type: 'player', action: playerAction, speed: playerDoodle.stats.speed, priority: getPriority(playerAction) },
        { type: 'bot', action: botAction, speed: botDoodle.stats.speed, priority: getPriority(botAction) }
    ];

    actions.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        return b.speed - a.speed;
    });

    // --- Lógica de Aplicação de Status Passivos (Burn/Poison) antes das ações ---
    // Esta fase é mantida para garantir que o dano passivo ocorra antes do ataque
    const { newDoodle: updatedPlayerDoodle, logMessages: playerStatusLog } = handleStatusEffects(playerDoodle);
    newLog.push(...playerStatusLog);
    newState.playerDoodle = updatedPlayerDoodle;

    const { newDoodle: updatedBotDoodle, logMessages: botStatusLog } = handleStatusEffects(botDoodle);
    newLog.push(...botStatusLog);
    newState.botDoodle = updatedBotDoodle;

    // Se algum doodle desmaiou, o turno de ações é ignorado
    if (newState.playerDoodle.stats.currentHp <= 0 || newState.botDoodle.stats.currentHp <= 0) {
        if (newState.playerDoodle.stats.currentHp <= 0) status.playerFainted = true;
        // NOVO: Verifica se o time do jogador acabou
        if (!hasActiveDoodles(newState.playerTeam)) { // Assumindo que você tem newState.playerTeam
            newLog.push("O time do jogador foi derrotado!");
            status.isGameOver = true;
        }
        if (newState.botDoodle.stats.currentHp <= 0) status.botFainted = true;
        // NOVO: Verifica se o time do bot acabou
        if (!hasActiveDoodles(newState.botTeam)) { // Assumindo que você tem newState.botTeam
            newLog.push("O time do bot foi derrotado!");
            status.isGameOver = true;
        }
        return { newBattleState: newState, logMessages: newLog, status };
    }
    // ----------------------------------------------------

    for (const { type, action } of actions) {
        // Verifica se a batalha já acabou ou se o Doodle já desmaiou
        if (newState.playerDoodle.stats.currentHp <= 0 || newState.botDoodle.stats.currentHp <= 0) {
            break;
        }

        const isPlayer = type === 'player';
        let attacker = isPlayer ? newState.playerDoodle : newState.botDoodle;
        let target = isPlayer ? newState.botDoodle : newState.playerDoodle;

        let actionBlocked = false;
        let targetHpBeforeAttack = target.stats.currentHp; // Captura HP do alvo antes da ação

        // --- FASE 1: CHECAGEM DE STATUS DE BLOQUEIO (SLEEP E CONFUSE) ---
        if (action.type === 'attack') {

            // 1. Sleep Check (Acordar no início do turno)
            if (attacker.status === "sleep") {
                const sleepResult = handleSleepCheckStartOfTurn(attacker);
                attacker = sleepResult.newDoodle;
                newLog.push(...sleepResult.logMessages);

                if (!sleepResult.canAct) {
                    actionBlocked = true; // Sleep bloqueou a ação
                }
            }

            // 2. Confuse Check (Se puder agir)
            if (!actionBlocked && attacker.status === "confuse" && attacker.stats.currentHp > 0) {
                const confuseResult = handleConfuseCheck(attacker);
                attacker = confuseResult.newDoodle;
                newLog.push(...confuseResult.logMessages);

                if (confuseResult.attackFailed) {
                    actionBlocked = true; // Confuse bloqueou a ação e aplicou auto-dano
                }
            }

            // Atualiza o Doodle atacante no estado após os checks de auto-dano/bloqueio
            if (isPlayer) { newState.playerDoodle = attacker; } else { newState.botDoodle = attacker; }
        }

        // --- FASE 2: EXECUÇÃO DA AÇÃO (SE NÃO BLOQUEADA) ---
        if (!actionBlocked && attacker.stats.currentHp > 0) {

            // Lógica para Ações do JOGADOR
            if (type === 'player') {
                switch (action.type) {
                    case 'attack':
                        // O ataque só acontece se não foi bloqueado e o Doodle não desmaiou na confusão
                        const attackResult = useMove(attacker, target, action.move);

                        newLog.push(`${attacker.name} usou ${action.move.name}!`);
                        newLog.push(...attackResult.logMessages);

                        newState.playerDoodle = attackResult.newUser;
                        newState.botDoodle = attackResult.newTarget;
                        break;
                    case 'swap':
                        newLog.push(`${newState.playerDoodle.name} retornou.`);
                        newLog.push(`Você trocou para ${action.doodle.name}!`);
                        newState.playerDoodle = action.doodle;
                        break;
                    case 'quit':
                        newLog.push("Você desistiu da batalha!");
                        newState.isGameOver = true;
                        status.isGameOver = true;
                        return { newBattleState: newState, logMessages: newLog, status };
                    case 'item':
                        newLog.push("Ainda não há itens disponíveis neste modo.");
                        break;
                }
            }
            // Lógica para Ações do BOT
            if (type === 'bot' && playerAction.type !== 'item' && playerAction.type !== 'quit') {
                switch (action.type) {
                    case 'attack':
                        const attackResult = useMove(attacker, target, action.move);

                        newLog.push(`${attacker.name} usou ${action.move.name}!`);
                        newLog.push(...attackResult.logMessages);

                        newState.botDoodle = attackResult.newUser;
                        newState.playerDoodle = attackResult.newTarget;
                        break;
                    case 'swap':
                        newLog.push(`${newState.botDoodle.name} retornou.`);
                        newLog.push(`O bot trocou para ${action.doodle.name}!`);
                        newState.botDoodle = action.doodle;
                        break;
                }
            }

            // --- FASE 3: CHECAGEM DE STATUS PÓS-AÇÃO ---

            // Após a ação, re-atribui os Doodles para os objetos atuais do estado (pode ter mudado no useMove)
            attacker = isPlayer ? newState.playerDoodle : newState.botDoodle;
            target = isPlayer ? newState.botDoodle : newState.playerDoodle;

            // 1. Confuse Recovery Check (para o atacante)
            const endConfuseResult = handleConfuseCheckEndOfTurn(attacker);
            attacker = endConfuseResult.newDoodle;
            newLog.push(...endConfuseResult.logMessages);

            // 2. Sleep Recovery Check (para o alvo, se ainda estiver dormindo E tomou dano)
            const targetTookDamage = target.stats.currentHp < targetHpBeforeAttack;
            if (targetTookDamage && target.status === "sleep") {
                const endSleepResult = handleSleepCheckEndOfTurn(target);
                target = endSleepResult.newDoodle;
                newLog.push(...endSleepResult.logMessages);
            }
        }

        // Atualiza o estado final da iteração
        if (isPlayer) {
            newState.playerDoodle = attacker;
            newState.botDoodle = target;
        } else {
            newState.botDoodle = attacker;
            newState.playerDoodle = target;
        }
    }

    // Verifica se algum Doodle desmaiou após as ações (e updates de HP de Confuse/Ataques)
    if (newState.playerDoodle.stats.currentHp <= 0) {
        newState.playerDoodle.stats.currentHp = 0;
        newLog.push(`${newState.playerDoodle.name} desmaiou!`);
        status.playerFainted = true;
    }
    if (newState.botDoodle.stats.currentHp <= 0) {
        newState.botDoodle.stats.currentHp = 0;
        newLog.push(`${newState.botDoodle.name} desmaiou!`);
        status.botFainted = true;
    }

    return { newBattleState: newState, logMessages: newLog, status };
};
