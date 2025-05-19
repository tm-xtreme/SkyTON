import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

import backgroundImg from '@/assets/background.jpg';
import stonImg from '@/assets/ston.png';
import bombImg from '@/assets/bomb.png';
import catchSfx from '@/assets/catch.mp3';
import explosionSfx from '@/assets/explosion.mp3';

const GAME_DURATION = 30; // seconds
const ENERGY_COST = 20;

const getRandomPosition = () => `${Math.random() * 80}%`;
const getRandomReward = () => Math.floor(Math.random() * 5) + 1;

export default function StonDropGame({ userId }) {
  const [userData, setUserData] = useState(null);
  const [droppables, setDroppables] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef();

  const catchAudio = useRef(new Audio(catchSfx));
  const explosionAudio = useRef(new Audio(explosionSfx));

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
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
      }
    };
    fetchUser();
  }, [userId, navigate, toast]);

  // Remove droppables after 3s (animation duration)
  useEffect(() => {
    if (!droppables.length) return;
    const timers = droppables.map(drop =>
      setTimeout(() => {
        setDroppables(prev => prev.filter(d => d.id !== drop.id));
      }, 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [droppables]);

  useEffect(() => {
    if (!userData) return;

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
        },
      ]);
    }, 400);

    return () => {
      clearInterval(gameTimer);
      clearInterval(dropInterval);
    };
  }, [userData]);

  const handleDropClick = useCallback(
    (drop) => {
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
      setDroppables(prev => prev.filter(d => d.id !== drop.id));
    }, []
  );

  useEffect(() => {
    if (!isGameOver || !userId) return;
    const finalizeGame = async () => {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, { balance: increment(score) });
      toast({ title: `Game Over! You earned $${score}` });
    };
    finalizeGame();
  }, [isGameOver, userId, score, toast]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* User info top-left with background */}
      <div className="absolute top-3 left-3 flex items-center gap-3 text-white text-base z-20 bg-black bg-opacity-50 rounded-lg px-4 py-2 shadow-lg select-none">
        <ArrowLeft 
          className="cursor-pointer w-6 h-6 hover:text-gray-300 transition-colors" 
          onClick={() => navigate(-1)} 
          title="Back"
        />
        <UserCircle className="w-6 h-6" />
        <span className="flex items-center gap-1">
          <Zap className="w-5 h-5 text-yellow-400" />
          {userData?.energy ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-5 h-5 text-green-400" />
          {userData?.balance ?? 0}
        </span>
      </div>

      {/* Timer and Score top-right with background */}
      <div className="absolute top-3 right-3 text-white text-lg z-20 bg-black bg-opacity-50 rounded-lg px-4 py-2 shadow-lg select-none">
        <p>
          00:{timeLeft.toString().padStart(2, '0')}, Score: {score}
        </p>
      </div>

      <AnimatePresence>
        {droppables.map((drop) => (
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
            animate={{ top: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            alt={drop.isBomb ? "Bomb" : "STON"}
            draggable={false}
          />
        ))}
      </AnimatePresence>

      {/* Red flash on bomb click */}
      {redFlash && (
        <div className="absolute inset-0 bg-red-600 opacity-70 z-30 pointer-events-none transition-opacity duration-1000" />
      )}

      {/* Game over modal */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-40">
          <div className="text-white text-center bg-gray-900 bg-opacity-90 rounded-xl p-10 shadow-xl max-w-xs mx-4">
            <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
            <p className="text-xl mb-6">You earned ${score}</p>
            <Button 
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
