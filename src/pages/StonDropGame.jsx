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

const getRandomPosition = () => Math.random() * 80 + '%';
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
  }, [userId]);

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
  }, [isGameOver]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover' }}
    >
      <div className="absolute top-2 left-2 flex items-center gap-2 text-white text-sm z-10">
        <ArrowLeft onClick={() => navigate(-1)} />
        <UserCircle />
        <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{userData?.energy}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{userData?.balance}</span>
      </div>

      <div className="absolute bottom-2 right-2 text-white text-sm z-10">
        <p>00:{timeLeft.toString().padStart(2, '0')}, Score: {score}</p>
      </div>

      <AnimatePresence>
        {droppables.map((drop) => (
          <motion.img
            key={drop.id}
            src={drop.isBomb ? bombImg : stonImg}
            onClick={() => handleDropClick(drop)}
            className="absolute cursor-pointer"
            style={{ left: drop.left, width: `${drop.reward * 12}px` }}
            initial={{ top: '-10%' }}
            animate={{ top: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        ))}
      </AnimatePresence>

      {redFlash && (
        <div className="absolute inset-0 bg-red-600 opacity-70 z-20 transition-opacity duration-1000" />
      )}

      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold">Congratulations!</h1>
            <p className="mt-2">You earned ${score}</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StonDropGame;    
