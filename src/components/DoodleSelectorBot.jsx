import React, { useState, useEffect } from "react";
import doodlesData from "../data/doodles.json";
// Importe a função do seu arquivo battleSet.js
import { createBattleTeams } from "../gameLogic/botLogic/battleSet"; 

const MAX_DOODLES_PER_PLAYER = 3;
const COUNTDOWN_TIME = 3; // Segundos

const DoodleSelectorBot = ({ onSelectionComplete }) => {
  const [allDoodles, setAllDoodles] = useState([]);
  const [playerDoodles, setPlayerDoodles] = useState([]);
  const [botDoodles, setBotDoodles] = useState([]);
  const [currentTurn, setCurrentTurn] = useState("player");
  const [isSelectionPhase, setIsSelectionPhase] = useState(true);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [isBotPicking, setIsBotPicking] = useState(false);

  useEffect(() => {
    setAllDoodles(doodlesData);
  }, []);

  // =========================
  // Função do bot escolher
  // =========================
  const botPick = () => {
    if (botDoodles.length >= MAX_DOODLES_PER_PLAYER) return;

    setIsBotPicking(true);
    setTimeout(() => {
      const availableDoodles = allDoodles.filter(
        (d) =>
          !playerDoodles.some((pd) => pd.id === d.id) &&
          !botDoodles.some((bd) => bd.id === d.id)
      );

      if (availableDoodles.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableDoodles.length);
        const chosenDoodle = availableDoodles[randomIndex];
        setBotDoodles((prev) => [...prev, chosenDoodle]);
      }

      setIsBotPicking(false);
      setCurrentTurn("player");
    }, 1500);
  };

  // =========================
  // Sempre que turno mudar → verifica se é do bot
  // =========================
  useEffect(() => {
    if (
      playerDoodles.length === MAX_DOODLES_PER_PLAYER &&
      botDoodles.length === MAX_DOODLES_PER_PLAYER
    ) {
      setIsSelectionPhase(false);
      return;
    }

    if (currentTurn === "bot" && botDoodles.length < MAX_DOODLES_PER_PLAYER) {
      botPick();
    }
  }, [currentTurn, playerDoodles, botDoodles]);

  // =========================
  // Contagem regressiva
  // =========================
  useEffect(() => {
    if (!isSelectionPhase && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isSelectionPhase && countdown === 0) {
      handleGameStart();
    }
  }, [isSelectionPhase, countdown]);

  // =========================
  // Funções auxiliares
  // =========================
  const isDoodleSelected = (doodleId) => {
    return [...playerDoodles, ...botDoodles].some((d) => d.id === doodleId);
  };

  const handlePlayerSelect = (doodle) => {
    if (currentTurn !== "player" || playerDoodles.length >= MAX_DOODLES_PER_PLAYER) {
      return;
    }

    setPlayerDoodles((prev) => {
      const updated = [...prev, doodle];
      if (updated.length < MAX_DOODLES_PER_PLAYER) {
        setCurrentTurn("bot");
      } else if (botDoodles.length < MAX_DOODLES_PER_PLAYER) {
        // Jogador terminou, deixa o bot completar sozinho
        setCurrentTurn("bot");
      }
      return updated;
    });
  };

  const handleGameStart = () => {
    // 1. Chame a função para criar os times de batalha.
    const teams = createBattleTeams(playerDoodles, botDoodles);

    // 2. Passe o resultado para o onSelectionComplete.
    if (onSelectionComplete) {
      onSelectionComplete(teams);
    }
  };

  // =========================
  // Renderização
  // =========================
  const renderDoodleGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
      {allDoodles.map((doodle) => {
        const selected = isDoodleSelected(doodle.id);
        const disabled =
          selected ||
          playerDoodles.length >= MAX_DOODLES_PER_PLAYER ||
          isBotPicking ||
          currentTurn !== "player";
        const highlightTurn =
          currentTurn === "player" &&
          !selected &&
          playerDoodles.length < MAX_DOODLES_PER_PLAYER;

        return (
          <button
            key={doodle.id}
            onClick={() => handlePlayerSelect(doodle)}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg border-2 border-brown-dark
              transition-all duration-200 h-52 md:h-64
              ${selected ? "opacity-30 cursor-not-allowed border-dashed" : "hover:scale-105"}
              ${highlightTurn ? "outline outline-4 outline-accent" : ""}
              ${disabled ? "cursor-not-allowed" : ""}
              bg-parchment-light
            `}
            title={selected ? "Já selecionado" : "Clique para selecionar"}
          >
            <img
              src={doodle.picture}
              alt={doodle.name}
              className="w-32 h-32 md:w-40 md:h-40 object-contain mb-1"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/100x100/5d4037/ffffff?text=Doodle";
              }}
            />
            <span className="text-brown-dark font-pixel text-xs md:text-sm text-center truncate w-full px-1">
              {doodle.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderSelectedDoodles = (doodles, title) => (
    <div className="w-full p-4 border-2 border-brown-dark rounded-lg bg-parchment-light shadow-md h-full">
      <h3 className="font-pixel text-xl text-brown-dark mb-4 text-center">
        {title}
      </h3>
      <div className="flex flex-col gap-2 items-center">
        {doodles.map((doodle) => (
          <div
            key={doodle.id}
            className="flex flex-col items-center gap-2 bg-parchment p-2 rounded-md border border-brown-dark w-full"
          >
            <img
              src={doodle.picture}
              alt={doodle.name}
              className="w-16 h-16 object-contain"
            />
            <span className="font-medieval text-brown-dark text-sm text-center truncate w-full">
              {doodle.name}
            </span>
          </div>
        ))}
      </div>
      {doodles.length < MAX_DOODLES_PER_PLAYER && (
        <p className="text-brown-dark text-sm mt-2 italic text-center">
          Escolha {MAX_DOODLES_PER_PLAYER - doodles.length} mais...
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <h1 className="text-4xl md:text-6xl font-bold font-pixel mb-6 text-accent">
        Escolha Seus Doodles
      </h1>

      {isSelectionPhase && (
        <p className="text-xl italic text-gray-300 mb-6 text-center">
          {currentTurn === "player"
            ? "Sua vez de escolher!"
            : "O Bot está escolhendo..."}
        </p>
      )}
      {!isSelectionPhase && (
        <p className="text-3xl font-pixel text-accent mb-6">
          Batalha em: {countdown}...
        </p>
      )}

      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-8 justify-center items-start">
        {/* Painel do Jogador */}
        <div className="w-full md:w-1/4 h-full md:h-[600px]">
          {renderSelectedDoodles(playerDoodles, "Seu Time")}
        </div>

        {/* Grid Central */}
        <div className="w-full md:w-3/4 bg-parchment border-4 border-brown rounded-lg shadow-xl p-6 flex items-center justify-center md:h-[600px] overflow-y-auto">
          {isSelectionPhase ? (
            renderDoodleGrid()
          ) : (
            <p className="text-brown-dark text-2xl font-pixel text-center">
              Aguarde... o jogo vai começar!
            </p>
          )}
        </div>

        {/* Painel do Bot */}
        <div className="w-full md:w-1/4 h-full md:h-[600px]">
          {renderSelectedDoodles(botDoodles, "Time do Bot")}
        </div>
      </div>
    </div>
  );
};

export default DoodleSelectorBot;