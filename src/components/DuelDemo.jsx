import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DoodleSelectorBot from "./DoodleSelectorBot";
import Lobby from "./Lobby";
import BattleScene from "./BattleScene"; // Importe a cena de batalha

const DuelDemo = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("mainMenu");
  const [battleTeams, setBattleTeams] = useState(null); // Novo estado para os times

  // A função agora recebe os times e armazena no estado antes de mudar de tela
  const handleBotSelectionComplete = (teams) => {
    setBattleTeams(teams);
    setScreen("duelBot");
  };

  // --- Telas ---
  const renderMainMenu = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold font-pixel text-accent">
          Duelo
        </h1>
        <p className="text-xl text-gray-300 italic">"Prove sua maestria"</p>
      </div>
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => setScreen("lobby")}
          className="menu-item w-full py-4 px-6 text-2xl text-left flex items-center hover:text-accent relative group mb-4"
        >
          <i className="fas fa-shield-alt mr-4"></i> Batalhe Online
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full"></span>
        </button>
        <button
          onClick={() => setScreen("doodleSelectorBot")}
          className="menu-item w-full py-4 px-6 text-2xl text-left flex items-center hover:text-accent relative group"
        >
          <i className="fas fa-robot mr-4"></i> Batalhe contra o Bot
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full"></span>
        </button>
      </div>
    </div>
  );

  const renderDoodleSelectorBot = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <DoodleSelectorBot onSelectionComplete={handleBotSelectionComplete} />
    </div>
  );

  const renderLobby = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <Lobby />
    </div>
  );

  const renderBattleScene = () => {
    // Passa os times para a cena de batalha
    return <BattleScene isOnline={false} teams={battleTeams} />;
  };

  // --- Render principal ---
  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-accent hover:text-white transition-colors duration-200 z-10"
      >
        <i className="fas fa-arrow-left text-2xl md:text-3xl"></i>
      </button>

      {screen === "mainMenu" && renderMainMenu()}
      {screen === "lobby" && renderLobby()}
      {screen === "doodleSelectorBot" && renderDoodleSelectorBot()}
      {/* Agora, renderize a nova função */}
      {screen === "duelBot" && renderBattleScene()}
    </>
  );
};

export default DuelDemo;