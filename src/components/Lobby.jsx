import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, loginAnonymously } from "../firebase/config";
import { createRoom, joinRoom, startGame } from "../firebase/roomService";
import DoodleSelector from "./DoodleSelector";

const Lobby = () => {
  const [playerId, setPlayerId] = useState(null);
  const [playerNick, setPlayerNick] = useState("Player");
  const [opponentNick, setOpponentNick] = useState("Esperando...");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [screen, setScreen] = useState("menu");
  const [isEditingNick, setIsEditingNick] = useState(false);

  // 🔹 autenticação anônima
  const ensureAuth = async () => {
    if (!playerId) {
      const uid = await loginAnonymously();
      setPlayerId(uid);
      return uid;
    }
    return playerId;
  };

  // 🔹 criar sala
  const handleCreateRoom = async () => {
    const uid = await ensureAuth();
    if (!uid) return;
    const newRoom = await createRoom(uid, playerNick);
    if (newRoom) {
      setRoomCode(newRoom);
      setIsHost(true);
      setScreen("lobby");
    }
  };

  // 🔹 entrar em sala
  const handleJoinRoom = async () => {
    const uid = await ensureAuth();
    if (!uid || !roomCode) return;
    const joined = await joinRoom(roomCode, uid, playerNick);
    if (joined) {
      setIsHost(false);
      setScreen("lobby");
    }
  };

  // 🔹 listener da sala
  useEffect(() => {
    if (!roomCode || !playerId) return;
    const roomRef = doc(db, "rooms", roomCode);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const players = data.players || {};
        setPlayerNick(players[playerId]?.nick || "Player");

        const opponentId = Object.keys(players).find((id) => id !== playerId);
        setOpponentNick(opponentId ? players[opponentId]?.nick : "Esperando...");

        if (data.status === "playing") {
          setScreen("doodleSelector");
        }
      }
    });
    return () => unsub();
  }, [roomCode, playerId]);

  // 🔹 atualizar nick
  const handleSaveNick = async () => {
    if (!roomCode || !playerId) return;
    const roomRef = doc(db, "rooms", roomCode);
    await updateDoc(roomRef, {
      [`players.${playerId}.nick`]: playerNick,
    });
  };

  // 🔹 iniciar jogo
  const handleStart = async () => {
    if (isHost && opponentNick !== "Esperando...") {
      await startGame(roomCode);
    }
  };

  // --- Renders ---
  const renderMenu = () => (
    <div className="w-full max-w-md space-y-6">
      <button
        onClick={handleCreateRoom}
        className="menu-item w-full py-4 px-6 text-2xl text-center transition-all hover:text-accent relative group"
      >
        Criar Sala
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
      </button>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <input
          type="text"
          placeholder="Código da Sala"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="flex-1 py-4 px-6 text-2xl bg-parchment text-brown-dark border-2 border-brown-dark font-medieval"
        />
        <button
          onClick={handleJoinRoom}
          className="menu-item flex-1 py-4 px-6 text-2xl text-center transition-all hover:text-accent relative group"
        >
          Entrar
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
        </button>
      </div>
    </div>
  );

  const renderLobbyScreen = () => (
    <div className="w-full max-w-md text-center">
      <h2 className="text-3xl font-pixel mb-4">Lobby</h2>
      <p className="text-xl mb-4">
        Código da Sala: <span className="font-bold text-accent">{roomCode}</span>
      </p>

      <div className="bg-parchment text-brown-dark p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg">Você:</span>
          {isEditingNick ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Digite seu Nick"
                value={playerNick}
                onChange={(e) => setPlayerNick(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveNick();
                    setIsEditingNick(false);
                  }
                }}
                className="text-lg bg-parchment text-brown-dark border-b-2 border-brown-dark px-2 focus:outline-none placeholder-gray-700"
              />
              <button
                onClick={() => {
                  handleSaveNick();
                  setIsEditingNick(false);
                }}
                className="relative group text-sm py-1 px-3 bg-brown-dark text-parchment rounded-full hover:text-accent transition-colors"
              >
                Confirmar
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{playerNick}</span>
              <button
                onClick={() => setIsEditingNick(true)}
                className="relative group text-sm py-1 px-3 bg-brown-dark text-parchment rounded-full hover:text-accent transition-colors"
              >
                Alterar Nick
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-lg">Oponente:</span>
          <span className="text-lg italic text-gray-500">{opponentNick}</span>
        </div>
      </div>

      {isHost ? (
        <button
          onClick={handleStart}
          disabled={opponentNick === "Esperando..."}
          className={`w-full py-4 px-6 text-2xl transition-all relative group ${
            opponentNick === "Esperando..."
              ? "cursor-not-allowed opacity-50"
              : "hover:text-accent"
          }`}
        >
          Iniciar Jogo
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
        </button>
      ) : (
        <p className="text-xl italic text-gray-400">Esperando o anfitrião iniciar...</p>
      )}
    </div>
  );

  const renderDoodleSelectorScreen = () => (
    <div className="w-full min-h-screen flex items-center justify-center">
      <DoodleSelector
        roomCode={roomCode}
        playerId={playerId}
        playerNick={playerNick}
        opponentNick={opponentNick}
        isHost={isHost}
        onSelectionComplete={() => setScreen("duel")}
      />
    </div>
  );

  const renderDuelScreen = () => (
    <div className="w-full max-w-md text-center">
      <h2 className="text-3xl font-pixel mb-4">A Batalha Vai Começar!</h2>
      <p className="text-xl italic text-gray-400">
        Preparando a cena de combate...
      </p>
    </div>
  );

  const renderContent = () => {
    switch (screen) {
      case "menu":
        return renderMenu();
      case "lobby":
        return renderLobbyScreen();
      case "doodleSelector":
        return renderDoodleSelectorScreen();
      case "duel":
        return renderDuelScreen();
      default:
        return renderMenu();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      {/* O cabeçalho só é renderizado para as telas de 'menu' e 'lobby' */}
      {(screen === "menu" || screen === "lobby") && (
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold font-pixel text-accent">
            Batalha Online
          </h1>
          <p className="text-xl text-gray-300 italic">"Prove sua maestria"</p>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default Lobby;