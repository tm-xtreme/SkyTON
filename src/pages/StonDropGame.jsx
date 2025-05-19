import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import clsx from 'clsx';

import backgroundImg from '@/assets/background.jpg';
import stonImg from '@/assets/ston.png';
import bombImg from '@/assets/bomb.png';
import catchSound from '@/assets/catch.mp3';
import explosionSound from '@/assets/explosion.mp3';

const ENERGY_COST = -20;
const MAX_LIVES = 5;
const GEM_SPAWN_INTERVAL = 1800;
const GEM_FALL_DURATION = 3500;
const BOMB_CHANCE = 0.2;
const SCORE_PENALTY = -3;

const randomReward = () => {
  const rewards = [1, 2, 3, 5, 10];
  return rewards[Math.floor(Math.random() * rewards.length)];
};

const randomX = () => Math.random() * 85 + 5;

function StonDropGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [balance, setBalance] = useState(0);
  const [gems, setGems] = useState([]);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  const playSound = (src) => new Audio(src).play();

  useEffect(() => {
    const cachedUser = sessionStorage.getItem('cachedUser');
    if (!cachedUser) {
      toast({ title: 'User Not Found', description: 'Please launch the game via the dashboard.', variant: 'destructive' });
      navigate('/tasks');
      return;
    }
    const user = JSON.parse(cachedUser);
    setUserData(user);
    setEnergy(user.energy);
    setBalance(user.balance);
  }, [navigate, toast]);

  const updateUserStats = async (field, amount) => {
    try {
      await updateDoc(doc(db, 'users', userData.id), { [field]: increment(amount) });
    } catch (err) {
      console.error(`${field} update error:`, err);
    }
  };

  const spawnGem = useCallback(() => {
    const isBomb = Math.random() < BOMB_CHANCE;
    const newGem = {
      id: Date.now(),
      x: randomX(),
      reward: isBomb ? null : randomReward(),
      isBomb,
    };
    setGems((prev) => [...prev, newGem]);

    setTimeout(() => {
      setGems((prev) => prev.filter((g) => g.id !== newGem.id));
    }, GEM_FALL_DURATION);
  }, []);

  const handleGemClick = async (gem) => {
    setGems((prev) => prev.filter((g) => g.id !== gem.id));
    if (gem.isBomb) {
      navigator.vibrate?.(200);
      setShowExplosion(true);
      playSound(explosionSound);
      setScore((prev) => Math.max(0, prev + SCORE_PENALTY));
      setTimeout(() => setShowExplosion(false), 1000);
    } else {
      playSound(catchSound);
      setScore((prev) => prev + gem.reward);
      await updateUserStats('balance', gem.reward);
    }
  };

  const startGame = async () => {
    if (energy < 20) {
      toast({ title: 'Not Enough Energy', description: 'You need at least 20 energy to play.', variant: 'destructive' });
      return;
    }
    await updateUserStats('energy', ENERGY_COST);
    setIsGameActive(true);
    setScore(0);
    const interval = setInterval(spawnGem, GEM_SPAWN_INTERVAL);
    setTimeout(() => {
      clearInterval(interval);
      setIsGameActive(false);
    }, 25000);
  };

  return (
    <div className={clsx("relative h-screen w-screen overflow-hidden", showExplosion && "bg-red-700")}
      style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover' }}>
      <div className="absolute top-3 left-3 z-40">
        <Button size="icon" variant="ghost" className="bg-slate-800/80 hover:bg-slate-700/90 rounded-full shadow-md" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4 text-white" />
        </Button>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-4 text-white z-40">
        {userData?.profilePicUrl ? (
          <img src={userData.profilePicUrl} alt="profile" className="w-8 h-8 rounded-full border border-sky-400" />
        ) : (
          <UserCircle className="w-8 h-8" />
        )}
        <div>{userData?.firstName}</div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          {energy}
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          {balance}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center h-full">
        {!isGameActive ? (
          <Button onClick={startGame} className="text-xl px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            Start Game
          </Button>
        ) : (
          <div className="text-white text-xl mb-6">Score: {score}</div>
        )}
      </div>

      <AnimatePresence>
        {gems.map((gem) => (
          <motion.img
            key={gem.id}
            src={gem.isBomb ? bombImg : stonImg}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: "90vh", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: GEM_FALL_DURATION / 1000 }}
            onClick={() => handleGemClick(gem)}
            className="absolute cursor-pointer drop-shadow-lg"
            style={{ left: `${gem.x}%`, width: gem.isBomb ? '40px' : '32px' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default StonDropGame;
