import React, { useState } from "react";
import doodlesData from "../data/doodles.json";
import { useNavigate } from "react-router-dom";

const DoodleCodex = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const doodlesPerPage = 1;
  const totalPages = Math.ceil(doodlesData.length / doodlesPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const currentDoodle = doodlesData[currentPage];

  const renderStats = (stats) => (
    <ul className="grid grid-cols-2 gap-2 text-sm md:text-base">
      <li className="flex justify-between">
        <span className="font-bold">HP:</span> <span>{stats.hp}</span>
      </li>
      <li className="flex justify-between">
        <span className="font-bold">ATK:</span> <span>{stats.atk}</span>
      </li>
      <li className="flex justify-between">
        <span className="font-bold">SPATK:</span> <span>{stats.spatk}</span>
      </li>
      <li className="flex justify-between">
        <span className="font-bold">DEF:</span> <span>{stats.def}</span>
      </li>
      <li className="flex justify-between">
        <span className="font-bold">SPDEF:</span> <span>{stats.spdef}</span>
      </li>
      <li className="flex justify-between">
        <span className="font-bold">SPEED:</span> <span>{stats.speed}</span>
      </li>
    </ul>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dark text-light bg-paper font-medieval relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-accent hover:text-white transition-colors duration-200"
      >
        <i className="fas fa-arrow-left text-2xl md:text-3xl"></i>
      </button>

      <div className="flex flex-col items-center mb-6">
        <h1 className="text-4xl md:text-6xl font-bold font-pixel mb-2 text-accent">Doodle Codex</h1>
      </div>

      <div className="w-full max-w-2xl bg-parchment border-4 border-brown rounded-lg shadow-xl p-8 md:p-12 relative flex flex-col items-center">
        
        {currentDoodle ? (
          <div className="w-full text-brown-dark">
            <h2 className="text-3xl md:text-4xl font-bold font-pixel mb-2 text-center">
              {currentDoodle.name}
            </h2>
            <p className="text-lg italic mb-4 text-center">{currentDoodle.subname}</p>
            
            <div className="w-full flex justify-center mb-4">
              <img
                src={currentDoodle.picture}
                alt={currentDoodle.name}
                className="w-48 h-48 md:w-64 md:h-64 object-contain border-4 border-brown-dark p-2 rounded-md"
              />
            </div>
            
            <p className="text-sm md:text-base leading-relaxed mb-4 text-center">{currentDoodle.description}</p>
            
            <div className="bg-parchment-light p-4 rounded-md border border-brown-dark">
              <h3 className="font-bold text-lg mb-2 text-center">Status</h3>
              {renderStats(currentDoodle.stats)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Nenhum doodle nesta página...
          </div>
        )}

        {/* Botões de navegação */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={`absolute left-0 top-1/2 -translate-y-1/2 text-5xl text-brown-dark p-2 opacity-50 hover:opacity-100 transition-opacity duration-300 ${
            currentPage === 0 ? "cursor-not-allowed opacity-20" : ""
          }`}
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages - 1}
          className={`absolute right-0 top-1/2 -translate-y-1/2 text-5xl text-brown-dark p-2 opacity-50 hover:opacity-100 transition-opacity duration-300 ${
            currentPage >= totalPages - 1 ? "cursor-not-allowed opacity-20" : ""
          }`}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default DoodleCodex;