import { db } from "./config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Gera um código de sala aleatório de 6 caracteres (letras e números)
const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Cria uma nova sala no Firestore
export const createRoom = async (hostId, hostNick) => {
  try {
    const roomCode = generateRoomCode();
    await setDoc(doc(db, "rooms", roomCode), {
      status: "waiting", // 'waiting', 'playing', 'finished'
      players: {
        [hostId]: {
          nick: hostNick,
          isHost: true,
        },
      },
      turn: null, // Define o turno como 'null' inicialmente
      doodles: [], // Doodles escolhidos pelos jogadores
    });
    console.log("Sala criada com o código:", roomCode);
    return roomCode;
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return null;
  }
};

// Entra em uma sala existente e decide aleatoriamente quem começa
export const joinRoom = async (roomCode, playerId, playerNick) => {
  try {
    const roomRef = doc(db, "rooms", roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Sala não encontrada.");
    }

    const roomData = roomSnap.data();
    const players = roomData.players || {};
    const playerCount = Object.keys(players).length;

    if (playerCount >= 2) {
      throw new Error("A sala está cheia.");
    }

    // Encontra o ID do anfitrião
    const hostId = Object.keys(players).find(id => players[id].isHost);
    
    // Sorteia aleatoriamente quem terá a primeira escolha
    const firstPlayerId = Math.random() < 0.5 ? hostId : playerId;

    // Atualiza o documento da sala com o novo jogador e a escolha aleatória
    await updateDoc(roomRef, {
      [`players.${playerId}`]: {
        nick: playerNick,
        isHost: false,
      },
      status: "ready", // A sala está pronta para começar
      turn: firstPlayerId, // Define o jogador que terá a primeira escolha
    });

    console.log(`Jogador ${playerNick} entrou na sala ${roomCode}. O primeiro a escolher é: ${firstPlayerId}`);
    return roomData;

  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    return null;
  }
};

// Adicione aqui a função para iniciar o jogo futuramente
export const startGame = async (roomCode) => {
  try {
    const roomRef = doc(db, "rooms", roomCode);
    await updateDoc(roomRef, {
      status: "playing",
    });
    console.log("Jogo iniciado na sala:", roomCode);
    return true;
  } catch (error) {
    console.error("Erro ao iniciar o jogo:", error);
    return false;
  }
};