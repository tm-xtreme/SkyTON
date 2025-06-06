import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Zap, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

import backgroundImg from '@/assets/background.jpg';
import stonImg from '@/assets/ston.png';
import bombImg from '@/assets/bomb.png';
import catchSfx from '@/assets/catch.mp3';
import explosionSfx from '@/assets/explosion.mp3';

const GAME_DURATION = 30;
const ENERGY_COST = 20;

const getRandomPosition = () => `${Math.random() * 80}%`;
const getRandomReward = () => Math.floor(Math.random() * 5) + 1;

export default function StonDropGame() {
  const [userData, setUser Data] = useState(null);
  const [droppables, setDroppables] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [finalEnergy, setFinalEnergy] = useState(0);
  const [finalBalance, setFinalBalance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef();

  const catchAudio = useRef(new Audio(catchSfx));
  const explosionAudio = useRef(new Audio(explosionSfx));

  const userId = sessionStorage.getItem("gameUser Id");
  const gameTimer = useRef(null);
  const dropInterval = useRef(null);

  const startGame = () => {
    setGameStarted(true);
    startTimers();
  };

  const startTimers = () => {
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer.current);
          clearInterval(dropInterval.current);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    dropInterval.current = setInterval(() => {
      const isBomb = Math.random() < 0.2;
      const reward = getRandomReward();
      const id = crypto.randomUUID();

      setDroppables(prev => [
        ...prev,
        {
          id,
          left: getRandomPosition(),
          reward,
          isBomb,
        },
      ]);
    }, 400);
  };

  const pauseGame = () => {
    clearInterval(gameTimer.current);
    clearInterval(dropInterval.current);
    setIsPaused(true);
  };

  const resumeGame = () => {
    setIsPaused(false);
    startTimers();
  };

  const quitGame = async () => {
    clearInterval(gameTimer.current);
    clearInterval(dropInterval.current);
    
    // Add earned score to balance if game was started
    if (gameStarted && !isGameOver && userId) {
      try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, { balance: increment(score) });
        toast({ title: `Game ended! You earned $${score}` });
      } catch (error) {
        toast({ title: 'Failed to update balance.' });
      }
    }
    
    navigate('/tasks');
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUser  = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.energy < ENERGY_COST) {
            toast({ title: 'Not enough energy to play.' });
            navigate('/tasks');
            return;
          }
          await updateDoc(docRef, { energy: increment(-ENERGY_COST) });
          setUser Data({ ...data, id: userId });
        }
      } catch (error) {
        toast({ title: 'Failed to load user data.' });
        navigate('/tasks');
      }
    };

    fetchUser ();
  }, [userId, navigate, toast]);

  useEffect(() => {
    if (!droppables.length) return;
    const timers = droppables.map(drop =>
      setTimeout(() => {
        setDroppables(prev => prev.filter(d => d.id !== drop.id));
      }, 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [droppables]);

  const handleDropClick = useCallback((drop) => {
    if (isPaused) return;
    
    setDroppables(prev => prev.filter(d => d.id !== drop.id));
    if (drop.isBomb) {
      if (navigator.vibrate) navigator.vibrate(300);
      explosionAudio.current.play();
      setRedFlash(true);
      setTimeout(() => setRedFlash(false), 1000);
      setScore(prev => Math.max(0, prev - 20));
    } else {
      catchAudio.current.play();
      setScore(prev => prev + drop.reward);
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isGameOver || !userId) return;
    const finalizeGame = async () => {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, { balance: increment(score) });
      const updatedSnap = await getDoc(docRef);
      const updatedData = updatedSnap.data();
      setFinalEnergy(updatedData.energy);
      setFinalBalance(updatedData.balance);
      toast({ title: `Game Over! You earned $${score}` });
    };
    finalizeGame();
  }, [isGameOver, userId, score, toast]);

  const resetGame = () => window.location.reload();

  const handleBackClick = () => {
    if (!gameStarted || isGameOver) {
      navigate('/tasks');
    } else {
      pauseGame();
      setShowQuitConfirm(true);
    }
  };

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
      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-4 text-white text-sm z-20 bg-black bg-opacity-50 rounded-lg px-4 py-2 shadow-lg select-none">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="cursor-pointer w-6 h-6 hover:text-gray-300"
            onClick={handleBackClick}
            title="Back"
          />
          {userData?.profilePicUrl ? (
            <img
              src={userData.profilePicUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          )}
          <span className="flex items-center gap-1">
            <Zap className="w-5 h-5 text-yellow-400" />
            {userData?.energy ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-green-400" />
            {userData?.balance ?? 0}
          </span>
        </div>
        <div className="text-xs sm:text-sm">
          00:{timeLeft.toString().padStart(2, '0')} | Score: {score}
        </div>
      </div>

      {/* Start screen */}
      {!gameStarted && !isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black bg-opacity-80">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-md">STON DROP</h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="text-white bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 px-8 py-4 text-lg rounded-xl shadow-xl"
                onClick={startGame}
              >
                Start Game
              </Button>
              <Button
                className="text-white bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 px-8 py-4 text-lg rounded-xl shadow-xl"
                onClick={() => navigate('/tasks')}
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Falling items */}
      <AnimatePresence>
        {droppables.map(drop => (
          <motion.img
            key={drop.id}
            src={drop.isBomb ? bombImg : stonImg}
            onClick={() => handleDropClick(drop)}
            className="absolute cursor-pointer"
            style={{
              left: drop.left,
              width: drop.isBomb ? 40 : 24 + drop.reward * 12,
              zIndex: 15,
              userSelect: 'none',
            }}
            initial={{ top: '-12%' }}
            animate={{ 
              top: '100%',
              transition: { 
                duration: 3, 
                ease: 'linear',
                paused: isPaused 
              }
            }}
            exit={{ opacity: 0 }}
            alt={drop.isBomb ? "Bomb" : "STON"}
            draggable={false}
          />
        ))}
      </AnimatePresence>

      {/* Red flash */}
      {redFlash && (
        <div className="absolute inset-0 bg-red-600 opacity-70 z-30 pointer-events-none transition-opacity duration-1000" />
      )}

      {/* Game over screen */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
          <div className="text-white text-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl px-8 py-10 shadow-2xl border border-gray-700 animate-pulse">
            <h1 className="text-4xl font-extrabold mb-4 text-green-400 drop-shadow-lg">Congratulations!</h1>
            <p className="text-2xl mb-2">You earned <span className="text-yellow-400">${score} STON</span></p>
            <p className="text-lg mb-1">Balance: ${finalBalance} STON</p>
            <p className="text-lg mb-6">Energy Left: {finalEnergy}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl"
                onClick={resetGame}
              >
                Play Again
              </Button>
              <Button
                className="px-6 py-2 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl"
                onClick={() => navigate('/tasks')}
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quit confirmation dialog */}
      {showQuitConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Quit Game?</h3>
            <p className="text-gray-300 mb-6">
              Your current score of ${score} STON will be added to your balance. Are you sure you want to quit?
            </p>
            <div className="flex justify-end gap-4">
              <Button
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => {
                  setShowQuitConfirm(false);
                  resumeGame();
                }}
              >
                No, Continue
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={quitGame}
              >
                Yes, Quit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
