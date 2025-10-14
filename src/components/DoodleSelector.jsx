import React, { useState, useEffect, useCallback } from "react";
import doodlesData from "../data/doodles.json";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const MAX_DOODLES_PER_PLAYER = 3;
const COUNTDOWN_TIME = 3;

const DoodleSelector = ({
  roomCode,
  playerId,
  playerNick,
  opponentNick,
  isHost,
  onSelectionComplete,
}) => {
  const [roomData, setRoomData] = useState(null);
  const [allDoodles, setAllDoodles] = useState([]);
  const [selectedDoodlesP1, setSelectedDoodlesP1] = useState([]);
  const [selectedDoodlesP2, setSelectedDoodlesP2] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [isSelectionPhase, setIsSelectionPhase] = useState(true);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [player1Id, setPlayer1Id] = useState(null);
  const [player2Id, setPlayer2Id] = useState(null);

  // 1. Carrega os doodles e configura o listener da sala
  useEffect(() => {
    setAllDoodles(doodlesData);

    if (roomCode) {
      const roomRef = doc(db, "rooms", roomCode);
      const unsubscribe = onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomData(data);

          const pIds = Object.keys(data.players || {});
          if (pIds.length === 2) {
            setPlayer1Id(pIds.find((id) => data.players[id].isHost));
            setPlayer2Id(pIds.find((id) => !data.players[id].isHost));
          } else if (pIds.length === 1) {
            setPlayer1Id(pIds[0]);
            setPlayer2Id(null);
          }

          const firestoreDoodles = data.doodles || [];
          const doodlesP1 = firestoreDoodles.filter(
            (d) => d.ownerId === pIds.find((id) => data.players[id].isHost)
          );
          const doodlesP2 = firestoreDoodles.filter(
            (d) => d.ownerId === pIds.find((id) => !data.players[id].isHost)
          );

          setSelectedDoodlesP1(doodlesP1);
          setSelectedDoodlesP2(doodlesP2);

          setCurrentTurnPlayerId(data.turn);

          if (firestoreDoodles.length === MAX_DOODLES_PER_PLAYER * 2) {
            setIsSelectionPhase(false);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, playerId]);

  // 2. Lógica para contagem regressiva e transição para a batalha
  useEffect(() => {
    if (!isSelectionPhase && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isSelectionPhase) {
      onSelectionComplete();
    }
  }, [isSelectionPhase, countdown, onSelectionComplete]);

  // Função para verificar se um doodle já foi selecionado
  const isDoodleSelected = useCallback(
    (doodleId) => {
      return [...selectedDoodlesP1, ...selectedDoodlesP2].some(
        (d) => d.id === doodleId
      );
    },
    [selectedDoodlesP1, selectedDoodlesP2]
  );

  // Função para lidar com a seleção de um doodle
  const handleDoodleSelect = async (doodle) => {
    if (currentTurnPlayerId !== playerId) {
      return;
    }

    const mySelectedDoodles =
      playerId === player1Id ? selectedDoodlesP1 : selectedDoodlesP2;
    if (
      isDoodleSelected(doodle.id) ||
      mySelectedDoodles.length >= MAX_DOODLES_PER_PLAYER
    ) {
      return;
    }

    const roomRef = doc(db, "rooms", roomCode);
    const newDoodles = [...(roomData.doodles || []), { ...doodle, ownerId: playerId }];
    const nextTurnPlayerId = playerId === player1Id ? player2Id : player1Id;

    await updateDoc(roomRef, {
      doodles: newDoodles,
      turn: nextTurnPlayerId,
    }).catch(console.error);

    if (newDoodles.length === MAX_DOODLES_PER_PLAYER * 2) {
      setIsSelectionPhase(false);
      await updateDoc(roomRef, { status: "playing" }).catch(console.error);
    }
  };

  const renderDoodleGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
      {allDoodles.map((doodle) => {
        const selected = isDoodleSelected(doodle.id);
        const mySelectedDoodles =
          playerId === player1Id ? selectedDoodlesP1 : selectedDoodlesP2;
        const disabledBecauseMax =
          mySelectedDoodles.length >= MAX_DOODLES_PER_PLAYER;
        const disabledBecauseNotMyTurn =
          currentTurnPlayerId !== playerId && roomCode;

        return (
          <button
            key={doodle.id}
            onClick={() => handleDoodleSelect(doodle)}
            disabled={
              selected || disabledBecauseMax || disabledBecauseNotMyTurn
            }
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg border-2 border-brown-dark
              transition-all duration-200 h-52 md:h-64
              ${selected ? "opacity-30 cursor-not-allowed border-dashed" : "hover:scale-105"}
              ${currentTurnPlayerId === playerId && !selected && !disabledBecauseMax ? "outline outline-4 outline-accent" : ""}
              ${disabledBecauseNotMyTurn || disabledBecauseMax ? "cursor-not-allowed" : ""}
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

  const renderSelectedDoodles = (doodles, playerIdent) => (
    <div className="w-full p-4 border-2 border-brown-dark rounded-lg bg-parchment-light shadow-md h-full">
      <h3 className="font-pixel text-xl text-brown-dark mb-4 text-center">
        {playerIdent === playerId ? playerNick : opponentNick}
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

  if (!roomData && roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-light font-medieval">
        <p className="text-xl">Carregando sala...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <h1 className="text-4xl md:text-6xl font-bold font-pixel mb-6 text-accent">
        Escolha Seus Doodles
      </h1>

      {isSelectionPhase && (
        <p className="text-xl italic text-gray-300 mb-6 text-center">
          {currentTurnPlayerId === playerId
            ? "Sua vez de escolher!"
            : `Vez de ${opponentNick || "o outro jogador"}...`}
        </p>
      )}
      {!isSelectionPhase && (
        <p className="text-3xl font-pixel text-accent mb-6">
          Batalha em: {countdown}...
        </p>
      )}

      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-8 justify-center items-start">
        {/* Painel do Jogador 1 (Esquerda) */}
        <div className="w-full md:w-1/4 h-full md:h-[600px]">
          {renderSelectedDoodles(selectedDoodlesP1, player1Id)}
        </div>

        {/* Grid de Doodles (Centro) */}
        <div className="w-full md:w-3/4 bg-parchment border-4 border-brown rounded-lg shadow-xl p-6 flex items-center justify-center md:h-[600px] overflow-y-auto">
          {isSelectionPhase ? (
            renderDoodleGrid()
          ) : (
            <p className="text-brown-dark text-2xl font-pixel text-center">
              Aguarde... o jogo vai começar!
            </p>
          )}
        </div>

        {/* Painel do Jogador 2 (Direita) */}
        <div className="w-full md:w-1/4 h-full md:h-[600px]">
          {renderSelectedDoodles(selectedDoodlesP2, player2Id)}
        </div>
      </div>
    </div>
  );
};

export default DoodleSelector;