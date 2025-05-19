import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Zap, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

import backgroundImg from '@/assets/background.jpg';
import stonImg from '@/assets/ston.png';
import bombImg from '@/assets/bomb.png';
import catchSfx from '@/assets/catch.mp3';
import explosionSfx from '@/assets/explosion.mp3';

// ...imports remain the same

const GAME_DURATION = 30;
const ENERGY_COST = 20;

export default function StonDropGame() {
  const [userData, setUserData] = useState(null);
  const [droppables, setDroppables] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // NEW
  const [redFlash, setRedFlash] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = sessionStorage.getItem("gameUserId");

  const containerRef = useRef();
  const catchAudio = useRef(new Audio(catchSfx));
  const explosionAudio = useRef(new Audio(explosionSfx));

  // Load user and deduct energy
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.energy < ENERGY_COST) {
        toast({ title: 'Not enough energy.' });
        navigate(-1);
        return;
      }

      await updateDoc(docRef, { energy: increment(-ENERGY_COST) });
      setUserData({ ...data, id: userId });
    };

    fetchUser();
  }, [userId, navigate, toast]);

  // Game timer
  useEffect(() => {
    if (!gameStarted || !userData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const dropInterval = setInterval(() => {
      const id = crypto.randomUUID();
      const isBomb = Math.random() < 0.2;
      const reward = getRandomReward();
      setDroppables(prev => [
        ...prev,
        { id, left: getRandomPosition(), reward, isBomb }
      ]);
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(dropInterval);
    };
  }, [gameStarted, userData]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setIsGameOver(false);
    setDroppables([]);
  };

  // Play again logic
  const handlePlayAgain = () => {
    startGame(); // Just re-run the game
  };

  // Final score save
  useEffect(() => {
    if (!isGameOver || !userId) return;
    updateDoc(doc(db, 'users', userId), { balance: increment(score) });
    toast({ title: `Game Over! You earned $${score}` });
  }, [isGameOver, userId, score, toast]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      {/* Top-left info */}
      {/* ... same as before ... */}

      {/* Small Timer/Score top-right */}
      <div className="absolute top-2 right-3 text-white text-sm z-20 bg-black bg-opacity-50 rounded-md px-3 py-1 shadow select-none">
        <p>Time: 00:{timeLeft.toString().padStart(2, '0')}</p>
        <p>Score: {score}</p>
      </div>

      {/* Droppables */}
      <AnimatePresence>
        {gameStarted && droppables.map(drop => (
          <motion.img
            key={drop.id}
            src={drop.isBomb ? bombImg : stonImg}
            onClick={() => handleDropClick(drop)}
            className="absolute cursor-pointer"
            style={{
              left: drop.left,
              width: drop.isBomb ? 40 : 24 + drop.reward * 12,
              zIndex: 15,
            }}
            initial={{ top: '-12%' }}
            animate={{ top: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            alt={drop.isBomb ? "Bomb" : "STON"}
            draggable={false}
          />
        ))}
      </AnimatePresence>

      {/* Red flash on bomb */}
      {redFlash && (
        <div className="absolute inset-0 bg-red-600 opacity-70 z-30 transition-opacity duration-1000 pointer-events-none" />
      )}

      {/* Start Button Overlay */}
      {!gameStarted && !isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <Button
            className="text-white text-xl bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700"
            onClick={startGame}
          >
            Start Game
          </Button>
        </div>
      )}

      {/* Game Over Popup */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="text-white text-center bg-gray-900 bg-opacity-90 rounded-xl p-10 shadow-xl max-w-xs mx-4">
            <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
            <p className="text-xl mb-6">You earned ${score}</p>
            <Button
              className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              onClick={handlePlayAgain}
            >
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
