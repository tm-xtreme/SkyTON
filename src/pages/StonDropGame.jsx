import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import clsx from 'clsx';

import backgroundImg from '@/assets/background.jpg';
import stonImg from '@/assets/ston.png';
import bombImg from '@/assets/bomb.png';
import catchSfx from '@/assets/catch.mp3';
import explosionSfx from '@/assets/explosion.mp3';

const GAME_DURATION = 30; // seconds
const ENERGY_COST = 20;

const getRandomPosition = () => `${Math.random() * 80 + 10}%`;
const getRandomReward = () => Math.floor(Math.random() * 5) + 1;

export default function StonDropGame({ userId }) {
  const [userData, setUserData] = useState(null);
  const [droppables, setDroppables] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef();

  const catchAudio = useRef(new Audio(catchSfx));
  const explosionAudio = useRef(new Audio(explosionSfx));

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.energy < ENERGY_COST) {
            toast({ title: 'Not enough energy to play.' });
            navigate(-1);
            return;
          }
          await updateDoc(docRef, { energy: increment(-ENERGY_COST) });
          setUserData(data);
          setGameStarted(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({ title: 'Error starting game', description: error.message });
        navigate(-1);
      }
    };
    fetchUser();
  }, [userId, navigate, toast]);

  // Game timer
  useEffect(() => {
    if (!gameStarted) return;

    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(gameTimer);
  }, [gameStarted]);

  // Drop generator
  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    const dropInterval = setInterval(() => {
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
          createdAt: Date.now(),
        },
      ]);
    }, 800);

    // Cleanup droppables that have fallen off-screen
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setDroppables(prev => prev.filter(drop => now - drop.createdAt < 3000));
    }, 500);

    return () => {
      clearInterval(dropInterval);
      clearInterval(cleanupInterval);
    };
  }, [gameStarted, isGameOver]);

  const handleDropClick = useCallback(
    (drop) => {
      if (drop.isBomb) {
        if (navigator.vibrate) navigator.vibrate(300);
        explosionAudio.current.play();
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 500);
        setScore(prev => Math.max(0, prev - 20));
      } else {
        catchAudio.current.play();
        setScore(prev => prev + drop.reward);
      }
      setDroppables(prev => prev.filter(d => d.id !== drop.id));
    }, []
  );

  useEffect(() => {
    if (!isGameOver || !userId) return;
    const finalizeGame = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, { balance: increment(score) });
        toast({ title: `Game Over! You earned $${score}` });
      } catch (error) {
        console.error("Error updating balance:", error);
        toast({ title: 'Error saving score', description: error.message });
      }
    };
    finalizeGame();
  }, [isGameOver, userId, score, toast]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover' }}
    >
      <div className="absolute top-4 left-4 flex items-center gap-3 text-white text-lg z-10 bg-black bg-opacity-50 p-2 rounded-lg">
        <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <UserCircle className="w-6 h-6" />
        <span className="flex items-center gap-1"><Zap className="w-5 h-5 text-yellow-400" />{userData?.energy || 0}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-5 h-5 text-green-400" />{userData?.balance || 0}</span>
      </div>

      <div className="absolute bottom-4 right-4 text-white text-lg z-10 bg-black bg-opacity-50 p-2 rounded-lg">
        <p>00:{timeLeft.toString().padStart(2, '0')}, Score: {score}</p>
      </div>

      <AnimatePresence>
        {droppables.map((drop) => (
          <motion.div
            key={drop.id}
            onClick={() => handleDropClick(drop)}
            className="absolute cursor-pointer z-5"
            style={{ left: drop.left }}
            initial={{ top: '-50px' }}
            animate={{ top: '100vh' }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
          >
            <img 
              src={drop.isBomb ? bombImg : stonImg} 
              alt={drop.isBomb ? "Bomb" : "STON"}
              className="object-contain"
              style={{ 
                width: drop.isBomb ? '40px' : `${30 + (drop.reward * 10)}px`,
                height: 'auto'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {redFlash && (
        <div className="absolute inset-0 bg-red-600 opacity-70 z-20 pointer-events-none" />
      )}

      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="bg-gray-800 text-white text-center p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
            <p className="text-xl mb-6">You earned ${score}</p>
            <Button 
              className="mt-4 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" 
              onClick={() => navigate(-1)}
            >
              Back to Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
