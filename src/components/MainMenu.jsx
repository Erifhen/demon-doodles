import React from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: "fa-gamepad", text: "Jogo Demo", route: "/demo-game" },
  { icon: "fa-shield-alt", text: "Duelo Demo", route: "/duel-demo" },
  { icon: "fa-book-dead", text: "Doodle coDex", route: "/doodle-codex" },
  { icon: "fa-cog", text: "Sobre & Configurações", route: "/about-settings" },
];

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel">
          DEMON DOODLES
        </h1>
        <p className="text-xl text-gray-300 italic">"Capture aqueles que deveriam ser exorcizados..."</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {menuItems.map(({ icon, text, route }) => (
          <button
            key={route}
            onClick={() => navigate(route)}
            className="menu-item w-full py-4 px-6 text-2xl text-left flex items-center transition-all hover:text-accent relative group"
          >
            <i className={`fas ${icon} mr-4`}></i> {text}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;

