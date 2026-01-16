/**
 * Calcula o dano de um ataque, usando a fórmula básica de RPG.
 * @param {number} userAtk O ataque do usuário.
 * @param {number} targetDef A defesa do alvo.
 * @param {number} movePower O poder do movimento.
 * @returns {number} O valor do dano calculado.
 */
const calcDamage = (userAtk, targetDef, movePower) => {
    // Fórmula simplificada: dano = (ataque_do_usuário / defesa_do_alvo) * poder_do_movimento
    // Garantimos que o dano mínimo seja 1.
    const damage = Math.max(1, Math.floor((userAtk / targetDef) * movePower));
    return damage;
};

/**
 * Processa um ataque, calculando dano, aplicando efeitos e retornando o novo estado.
 * @param {object} user O Doodle que está atacando.
 * @param {object} target O Doodle que está sendo atacado.
 * @param {object} move O movimento usado.
 * @returns {object} Um objeto contendo o novo estado do usuário e do alvo, e as mensagens de log.
 */
export const useMove = (user, target, move) => {
    let newLog = [];
    let newUser = { ...user };
    let newTarget = { ...target };

    // 1. Verifica a chance de acerto
    if (Math.random() * 100 > move.accuracy) {
        newLog.push(`O ataque errou!`);
        return {
            newUser,
            newTarget,
            logMessages: newLog
        };
    }

    let damage = 0;

    // 2. Calcula dano se power > 0
    if (move.power > 0) {
        if (move.category === "atk") {
            damage = calcDamage(newUser.stats.atk, newTarget.stats.def, move.power);
        } else if (move.category === "spatk") {
            damage = calcDamage(newUser.stats.spatk, newTarget.stats.spdef, move.power);
        }

        // Aplica o dano ao novo estado do alvo
        newTarget.stats.currentHp = Math.max(0, newTarget.stats.currentHp - damage);
        newLog.push(`Causou ${damage} de dano!`);
    }

    // 3. Aplica efeito (se houver)
    if (move.effect) {
        switch (move.effect) {
            case "sleep":
                newTarget.status = "sleep";
                newLog.push(`${newTarget.name} adormeceu!`);
                break;
            case "confuse":
                newTarget.status = "confuse";
                newLog.push(`${newTarget.name} Está confuso!`);
                break;
            case "burn":
                newTarget.status = "burn";
                newLog.push(`${newTarget.name} está queimando!`);
                break;
            case "poison":
                newTarget.status = "poison";
                newLog.push(`${newTarget.name} foi envenenado!`);
                break;
            case "lifesteal":
                const healAmount = Math.floor(damage * 0.7);
                newUser.stats.currentHp = Math.min(newUser.stats.hp, newUser.stats.currentHp + healAmount);
                newLog.push(`${newUser.name} recuperou ${healAmount} de HP!`);
                break;
            case "buff_atk":
                newUser.stats.atk += 10;
                newLog.push(`${newUser.name} aumentou seu ataque!`);
                break;
            case "buff_def":
                newUser.stats.def += 10;
                newLog.push(`${newUser.name} aumentou sua defesa!`);
                break;
            case "debuff_def":
                newTarget.stats.def -= 10;
                newLog.push(`${newTarget.name} teve sua defesa reduzida!`);
                break;
            case "debuff_spatk":
                newTarget.stats.spatk -= 10;
                newLog.push(`${newTarget.name} teve seu ataque especial reduzido!`);
                break;
            case "debuff_spdef":
                newTarget.stats.spdef -= 10;
                newLog.push(`${newTarget.name} teve sua defesa especial reduzida!`);
                break;
            case "heal":
                newUser.status = null;
                newUser.stats.currentHp = Math.min(newUser.stats.hp, newUser.stats.currentHp + 30);
                newLog.push(`${newUser.name} se curou e removeu status!`);
                break;
            case "shield":
                newUser.stats.def += 20;
                newUser.stats.spdef += 20;
                newLog.push(`${newUser.name} se defendeu!`);
                break;
        }
    }

    return {
        newUser,
        newTarget,
        logMessages: newLog
    };
};


/**
 * Aplica efeitos de status passivos (dano como Burn/Poison) no início do turno de um Doodle.
 * NOTE: Os logs de sleep e confuse foram movidos para suas respectivas funções de checagem de ação.
 * @param {object} doodle O Doodle a ser afetado.
 * @returns {object} Um objeto com o novo estado do Doodle e as mensagens de log.
 */
export const handleStatusEffects = (doodle) => {
    let newDoodle = { ...doodle };
    let newLog = [];

    switch (newDoodle.status) {
        case "burn":
            newDoodle.stats.currentHp -= 10; // Dano de queimadura
            newLog.push(`${newDoodle.name} sofreu dano da queimadura!`);
            newDoodle.stats.def -= 10;
            newLog.push(`${newDoodle.name} teve sua defesa reduzida!`)
            break;
        case "poison":
            newDoodle.stats.currentHp -= 20; // Dano de veneno
            newLog.push(`${newDoodle.name} sofreu dano do veneno!`);
            break;
        // Status "sleep" e "confuse" não aplicam dano passivo aqui, a checagem de ação é feita separadamente.
    }

    // Verifica se o Doodle desmaiou após o dano de status
    if (newDoodle.stats.currentHp <= 0) {
        newDoodle.stats.currentHp = 0;
        newLog.push(`${newDoodle.name} desmaiou!`);
    }

    return { newDoodle, logMessages: newLog };
};


// ====================================================================
// NOVO: LÓGICA DE SLEEP (INÍCIO DO TURNO)
// ====================================================================

/**
 * Verifica se um Doodle dormindo acorda no início do seu turno (40% de chance).
 * Se não acordar, perde a ação.
 * @param {object} doodle O Doodle a ser afetado.
 * @returns {object} Um objeto com o novo estado do Doodle, mensagens de log, e se ele pode agir (canAct: boolean).
 */
export const handleSleepCheckStartOfTurn = (doodle) => {
    let newDoodle = { ...doodle };
    let newLog = [];
    let canAct = true;

    if (newDoodle.status === "sleep") {
        newLog.push(`${newDoodle.name} está dormindo...`);
        canAct = false; // Por padrão, perde a ação

        // 40% de chance de acordar no início do turno
        if (Math.random() * 100 < 40) {
            newDoodle.status = null; // Acordou!
            newLog.push(`${newDoodle.name} ACORDOU e pode agir!`);
            canAct = true;
        } else {
            newLog.push(`${newDoodle.name} continua dormindo e perdeu o turno.`);
        }
    }

    return { newDoodle, logMessages: newLog, canAct };
};

// ====================================================================
// NOVO: LÓGICA DE SLEEP (FIM DO TURNO POR DANO)
// ====================================================================

/**
 * Verifica se um Doodle dormindo acorda no fim do turno após tomar dano (40% de chance).
 * Deve ser chamado APENAS se o Doodle tomou dano neste turno E ainda está dormindo.
 * @param {object} doodle O Doodle a ser afetado.
 * @returns {object} Um objeto com o novo estado do Doodle e as mensagens de log.
 */
export const handleSleepCheckEndOfTurn = (doodle) => {
    let newDoodle = { ...doodle };
    let newLog = [];

    // Checa se ainda está dormindo para tentar acordar
    if (newDoodle.status === "sleep") {
        newLog.push(`O dano balançou ${newDoodle.name}. Tentando acordar...`);

        // 40% de chance de acordar no fim do turno
        if (Math.random() * 100 < 40) {
            newDoodle.status = null; // Acordou!
            newLog.push(`${newDoodle.name} ACORDOU devido ao dano recebido!`);
        } else {
            newLog.push(`${newDoodle.name} continua dormindo.`);
        }
    }

    return { newDoodle, logMessages: newLog };
};


// ====================================================================
// NOVO: LÓGICA DE CONFUSE (ANTES DE ATACAR)
// ====================================================================

/**
 * Verifica se um Doodle confuso consegue executar seu ataque (40% de chance).
 * Se falhar (60%), toma 10 de dano e o ataque é interrompido.
 * @param {object} doodle O Doodle confuso.
 * @returns {object} Um objeto com o novo estado do Doodle, mensagens de log, e se ele atacou (attackFailed: boolean).
 */
export const handleConfuseCheck = (doodle) => {
    let newDoodle = { ...doodle };
    let newLog = [];
    let attackFailed = false;

    if (newDoodle.status === "confuse") {
        newLog.push(`${newDoodle.name} está confuso!`);

        // 40% de chance de ACERTAR o ataque
        if (Math.random() * 100 < 40) {
            newLog.push(`${newDoodle.name} conseguiu se concentrar!`);
            // Segue com o ataque normalmente
        } else {
            // Falhou: Toma 10 de dano e não ataca
            newLog.push(`${newDoodle.name} está muito confuso e se machucou!`);

            // Aplica dano de confusão
            newDoodle.stats.currentHp = Math.max(0, newDoodle.stats.currentHp - 10);
            newLog.push(`Recebeu 10 de dano da confusão!`);
            attackFailed = true;

            // Verifica se o Doodle desmaiou
            if (newDoodle.stats.currentHp <= 0) {
                newDoodle.stats.currentHp = 0;
                newLog.push(`${newDoodle.name} desmaiou!`);
            }
        }
    }

    return { newDoodle, logMessages: newLog, attackFailed };
};


// ====================================================================
// NOVO: LÓGICA DE CONFUSE (FIM DO TURNO - RECUPERAÇÃO)
// ====================================================================

/**
 * Aplica efeitos de status no final do turno (chance de sair da confusão).
 * @param {object} doodle O Doodle a ser afetado.
 * @returns {object} Um objeto com o novo estado do Doodle e as mensagens de log.
 */
export const handleConfuseCheckEndOfTurn = (doodle) => {
    let newDoodle = { ...doodle };
    let newLog = [];

    if (newDoodle.status === "confuse") {
        // 50% de chance de sair da confusão
        if (Math.random() * 100 < 50) {
            newDoodle.status = null;
            newLog.push(`${newDoodle.name} se livrou da confusão!`);
        } else {
            newLog.push(`${newDoodle.name} continua confuso.`);
        }
    }

    return { newDoodle, logMessages: newLog };
};

