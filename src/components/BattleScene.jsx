import React, { useState, useEffect } from 'react';
import { processTurn } from '../gameLogic/botLogic/botTurnLogic';

// Componente principal da cena de batalha
const BattleScene = ({ teams }) => {
    // -------------------------------------------------------------
    // ESTADOS DO COMPONENTE
    // -------------------------------------------------------------
    const [battleState, setBattleState] = useState(() => {
        return {
            playerTeam: teams.playerTeam,
            botTeam: teams.botTeam,
            playerDoodle: teams.playerTeam[0],
            botDoodle: teams.botTeam[0],
            isGameOver: false,
        };
    });

    const [currentMenu, setCurrentMenu] = useState('main'); // 'main', 'attacks', 'swap', 'confirmQuit'
    const [logDisplay, setLogDisplay] = useState({
        isShowing: true, // Inicia mostrando o log inicial
        currentLogIndex: 0,
        currentText: '',
        isTyping: true,
        log: ["A batalha começou!", "O que você fará?"],
    });

    const {
        playerTeam,
        botTeam,
        playerDoodle,
        botDoodle,
        isGameOver
    } = battleState;
    // -------------------------------------------------------------
    // SINCRONIZAR ANIMAÇÃO
    // -------------------------------------------------------------
    const [visualHUD, setVisualHUD] = useState({
        playerHp: teams.playerTeam[0].stats.currentHp,
        playerStatus: teams.playerTeam[0].status,
        botHp: teams.botTeam[0].stats.currentHp,
        botStatus: teams.botTeam[0].status,
    });

    // Atualize também o useEffect de troca de Doodle
    useEffect(() => {
        setVisualHUD({
            playerHp: playerDoodle.stats.currentHp,
            playerStatus: playerDoodle.status,
            botHp: botDoodle.stats.currentHp,
            botStatus: botDoodle.status,
        });
    }, [playerDoodle.id, botDoodle.id]);
    // -------------------------------------------------------------
    // EFEITO PARA CONTROLAR A ANIMAÇÃO DE TEXTO DO JORNAL
    // -------------------------------------------------------------
    useEffect(() => {
        if (!logDisplay.isShowing || !logDisplay.isTyping) {
            return;
        }

        const fullText = logDisplay.log[logDisplay.currentLogIndex];
        let charIndex = 0;

        const typingInterval = setInterval(() => {
            setLogDisplay(prevState => ({
                ...prevState,
                currentText: fullText.substring(0, charIndex + 1)
            }));
            charIndex++;

            if (charIndex === fullText.length) {
                clearInterval(typingInterval);
                setLogDisplay(prevState => ({
                    ...prevState,
                    isTyping: false
                }));
            }
        }, 30); // Velocidade de digitação

        return () => clearInterval(typingInterval);
    }, [logDisplay.isShowing, logDisplay.isTyping, logDisplay.currentLogIndex, logDisplay.log]);


    // -------------------------------------------------------------
    // FUNÇÕES DE LÓGICA DO JOGO E DO FLUXO DO TURNO
    // -------------------------------------------------------------
    const handlePlayerAction = (action) => {
        // Usa o estado atual para o processamento do turno
        const { newBattleState, logMessages, status } = processTurn(battleState, action, playerDoodle, botDoodle);

        // Atualiza o estado da batalha com o novo estado retornado
        setBattleState(newBattleState);

        // Inicia a exibição do jornal com as novas mensagens de log
        setLogDisplay({
            isShowing: true,
            currentLogIndex: 0,
            currentText: '',
            isTyping: true,
            log: logMessages
        });

        // NOVO: Lógica de troca por desmaio
        if (status.playerFainted) {
            // Se o Doodle do jogador desmaiou, mostra o menu de troca
            setCurrentMenu('swap');
        } else if (status.botFainted) {
            // Se o Doodle do bot desmaiou, o bot troca automaticamente
            handleBotFaintSwap(newBattleState.botTeam);
        } else {
            // Se ninguém desmaiou, volta para o menu principal
            setCurrentMenu('main');
        }
    };

    // NOVO: Lógica para o bot trocar de Doodle automaticamente
    const handleBotFaintSwap = (botTeam) => {
        // Encontra o primeiro Doodle da equipe do bot que ainda não desmaiou
        const nextDoodle = botTeam.find(doodle => doodle.stats.currentHp > 0);

        if (nextDoodle) {
            const updatedBotTeam = botTeam.map(doodle =>
                doodle.id === nextDoodle.id ? { ...doodle, inBattle: true } : { ...doodle, inBattle: false }
            );

            setBattleState(prevState => ({
                ...prevState,
                botDoodle: nextDoodle,
                botTeam: updatedBotTeam,
            }));

            setLogDisplay(prevState => ({
                ...prevState,
                log: [...prevState.log, `O bot trocou para ${nextDoodle.name}!`
                ]
            }));
        } else {
            // Se não houver Doodles restantes, o jogador vence
            setBattleState(prevState => ({ ...prevState, isGameOver: true }));
            setLogDisplay(prevState => ({
                ...prevState,
                log: [...prevState.log, "A equipe do bot foi derrotada!", "Você venceu!"
                ]
            }));
        }
    };

    // NOVO: Lógica para o jogador trocar de Doodle manualmente após um desmaio
    const handlePlayerFaintSwap = (doodle) => {
        const updatedPlayerTeam = playerTeam.map(d =>
            d.id === doodle.id ? { ...d, inBattle: true } : { ...d, inBattle: false }
        );

        setBattleState(prevState => ({
            ...prevState,
            playerDoodle: doodle,
            playerTeam: updatedPlayerTeam,
        }));

        setLogDisplay(prevState => ({
            ...prevState,
            log: [...prevState.log, `Você escolheu ${doodle.name} para a batalha!`
            ]
        }));

        // Retorna ao menu principal após a troca
        setCurrentMenu('main');
    };

    const handleLogAdvance = () => {
        if (logDisplay.isTyping) {
            const fullText = logDisplay.log[logDisplay.currentLogIndex];
            setLogDisplay(prevState => ({
                ...prevState,
                isTyping: false,
                currentText: fullText
            }));
        } else {
            if (logDisplay.currentLogIndex < logDisplay.log.length - 1) {

                // CORREÇÃO AQUI: Use battleState.playerDoodle em vez de apenas playerDoodle
                setVisualHUD({
                    playerHp: battleState.playerDoodle.stats.currentHp,
                    playerStatus: battleState.playerDoodle.status,
                    botHp: battleState.botDoodle.stats.currentHp,
                    botStatus: battleState.botDoodle.status,
                });

                setLogDisplay(prevState => ({
                    ...prevState,
                    currentLogIndex: prevState.currentLogIndex + 1,
                    isTyping: true,
                    currentText: ''
                }));
            } else {
                setLogDisplay(prevState => ({ ...prevState, isShowing: false }));
            }
        }
    };

    // -------------------------------------------------------------
    // FUNÇÕES DE RENDERIZAÇÃO
    // -------------------------------------------------------------
    const renderHealthBar = (currentHp, maxHp) => {
        const percentage = (currentHp / maxHp) * 100;

        // Escolha da cor baseada na porcentagem
        const barColor = percentage > 60 ? 'bg-green-500' : percentage >= 30 ? 'bg-yellow-500' : 'bg-red-500';

        return (
            <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        );
    };

    const renderHUD = (doodle, isOpponent = false) => {
        // Pegamos os valores do visualHUD
        const hpToShow = isOpponent ? visualHUD.botHp : visualHUD.playerHp;
        const statusToShow = isOpponent ? visualHUD.botStatus : visualHUD.playerStatus;

        return (
            <div className={`p-4 border-2 border-brown rounded-lg shadow-md bg-parchment-light w-64 ${isOpponent ? 'text-right' : 'text-left'}`}>
                <h3 className="font-pixel text-brown-dark text-lg truncate">{doodle.name}</h3>
                <p className="font-medieval text-brown-dark text-sm">HP: {hpToShow}/{doodle.stats.hp}</p>
                {renderHealthBar(hpToShow, doodle.stats.hp)}

                {/* Agora o status também é sincronizado! */}
                {statusToShow && (
                    <p className="font-medieval text-red-600 text-xs mt-1 animate-pulse">
                        {statusToShow}
                    </p>
                )}
            </div>
        );
    };
    const renderMiniHUD = (doodle) => {
        const isCurrentDoodle = doodle.id === playerDoodle.id;
        const borderColor = isCurrentDoodle ? 'border-blue-500' : 'border-brown-dark';

        return (
            <button
                key={doodle.id}
                onClick={() => handlePlayerFaintSwap(doodle)}
                className={`flex flex-col items-center bg-parchment p-2 border-2 rounded-md font-pixel text-sm text-brown-dark hover:bg-parchment-dark ${borderColor}`}
                disabled={isCurrentDoodle || doodle.stats.currentHp <= 0}
            >
                <img src={doodle.picture} alt={doodle.name} className="w-12 h-12 object-contain mb-1" />
                <span className="truncate">{doodle.name}</span>
                <span className="text-xs font-medieval text-gray-600">
                    HP: {doodle.stats.currentHp}/{doodle.stats.hp}
                </span>
            </button>
        );
    };

    // Renderiza a área de ações ou o jornal de batalha
    const renderBattleArea = () => {
        if (isGameOver) {
            return (
                <div className="flex-1 font-pixel text-brown-dark h-full flex flex-col justify-center items-center">
                    <p className="text-3xl">FIM DE JOGO</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-parchment py-2 px-4 border-2 border-brown-dark rounded-md text-lg hover:bg-parchment-dark">
                        Jogar Novamente
                    </button>
                </div>
            );
        }

        if (logDisplay.isShowing) {
            return (
                <div
                    className="flex-1 font-medieval text-brown-dark cursor-pointer h-full flex flex-col justify-end"
                    onClick={handleLogAdvance}
                >
                    <p className="text-2xl">{logDisplay.currentText}</p>
                    <p className="mt-2 text-sm text-gray-500 font-pixel">
                        {logDisplay.isTyping ? "" : "CLIQUE PARA CONTINUAR"}
                    </p>
                </div>
            );
        }

        switch (currentMenu) {
            case 'main':
                return (
                    <div className="grid grid-cols-2 gap-2 w-full h-full">
                        <button onClick={() => setCurrentMenu('attacks')} className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark">
                            Lutar
                        </button>
                        <button onClick={() => setCurrentMenu('swap')} className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark">
                            Trocar
                        </button>
                        <button onClick={() => handlePlayerAction({ type: 'item' })} className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark">
                            Item
                        </button>
                        <button onClick={() => setCurrentMenu('confirmQuit')} className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark">
                            Desistir
                        </button>
                    </div>
                );
            case 'attacks':
                return (
                    <div className="relative w-full h-full p-2">
                        <div className="grid grid-cols-2 gap-2">
                            {playerDoodle.moveset.map(attack => (
                                <button
                                    key={attack.name}
                                    onClick={() => handlePlayerAction({ type: 'attack', move: attack })}
                                    className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark text-left truncate"
                                >
                                    {attack.name} <br />
                                    <span className="text-sm font-medieval text-gray-600">
                                        Tipo: {attack.category} | P: {attack.power}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setCurrentMenu('main')} className="absolute bottom-2 right-2 bg-parchment p-2 border-2 border-brown-dark rounded-full font-pixel text-sm text-brown-dark hover:bg-parchment-dark">
                            &#8592;
                        </button>
                    </div>
                );
            case 'swap':
                return (
                    <div className="relative w-full h-full p-2">
                        <p className="font-pixel text-brown-dark text-center text-lg mb-2">Selecione um Doodle:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {playerTeam.map(doodle => renderMiniHUD(doodle))}
                        </div>
                        <button onClick={() => setCurrentMenu('main')} className="absolute bottom-2 right-2 bg-parchment p-2 border-2 border-brown-dark rounded-full font-pixel text-sm text-brown-dark hover:bg-parchment-dark">
                            &#8592;
                        </button>
                    </div>
                );
            case 'confirmQuit':
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="font-pixel text-brown-dark text-xl mb-4">Tem certeza que quer desistir?</p>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button onClick={() => handlePlayerAction({ type: 'quit' })} className="bg-red-500 py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-white hover:bg-red-700">Sim</button>
                            <button onClick={() => setCurrentMenu('main')} className="bg-parchment py-4 px-2 border-2 border-brown-dark rounded-md font-pixel text-lg text-brown-dark hover:bg-parchment-dark">Não</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between items-center bg-dark bg-paper font-medieval">
            <div className="flex flex-col items-center w-full max-w-3xl flex-grow justify-center">
                <div className="w-full flex justify-around items-start mb-8">
                    <div>{renderHUD(botDoodle, true)}</div>
                    <img
                        src={botDoodle.picture}
                        alt={botDoodle.name}
                        className="w-40 h-40 md:w-48 md:h-48 object-contain"
                    />
                </div>

                <div className="w-full flex justify-around items-end">
                    <img
                        src={playerDoodle.picture}
                        alt={playerDoodle.name}
                        className="w-40 h-40 md:w-48 md:h-48 object-contain"
                    />
                    <div>{renderHUD(playerDoodle)}</div>
                </div>
            </div>

            <div className="w-full max-w-4xl h-48 bg-parchment-light border-4 border-brown rounded-lg shadow-xl p-4 flex flex-col">
                {renderBattleArea()}
            </div>
        </div>
    );
};

export default BattleScene;