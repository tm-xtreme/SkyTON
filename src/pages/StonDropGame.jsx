import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import clsx from 'clsx';

const GAME_DURATION_MS = 2500;
const SHOTS_PER_GAME = 5;
const ENERGY_COST_PER_GAME = -20;

const randomReward = () => {
  const rewards = [1, 2, 3, 5, 10];
  return rewards[Math.floor(Math.random() * rewards.length)];
};

function StonDropGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(SHOTS_PER_GAME);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gem, setGem] = useState(null);
  const [showExplosion, setShowExplosion] = useState(false);

  const getUserData = async (userId) => {
    try {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      return snap.exists() ? { id: userId, ...snap.data() } : null;
    } catch (err) {
      console.error('Error loading user data:', err);
      return null;
    }
  };

  const updateUserEnergy = async (userId, amount) => {
    try {
      await updateDoc(doc(db, 'users', userId), { energy: increment(amount) });
      return true;
    } catch (err) {
      console.error('Energy update error:', err);
      return false;
    }
  };

  const updateUserBalance = async (userId, amount) => {
    try {
      await updateDoc(doc(db, 'users', userId), { balance: increment(amount) });
      return true;
    } catch (err) {
      console.error('Balance update error:', err);
      return false;
    }
  };

  useEffect(() => {
    const cachedUser = sessionStorage.getItem("cachedUser");
    if (!cachedUser) {
      toast({
        title: "User Not Found",
        description: "Please launch the game via the dashboard.",
        variant: "destructive",
      });
      navigate("/tasks");
      return;
    }
    const user = JSON.parse(cachedUser);
    setUserData(user);
  }, [navigate, toast]);

  const spawnGem = useCallback(() => {
    if (!isGameActive || shotsLeft <= 0) return;

    const reward = randomReward();
    const newGem = {
      id: Date.now(),
      x: Math.random() * 90 + 5,
      reward,
    };
    setGem(newGem);

    setTimeout(() => {
      if (shotsLeft > 0) setShotsLeft((prev) => prev - 1);
      setGem(null);
    }, GAME_DURATION_MS);
  }, [isGameActive, shotsLeft]);

  const handleStartGame = async () => {
    if (!userData) return;

    if (userData.energy < 20) {
      toast({
        title: "Not Enough Energy",
        description: "You need at least 20 energy to play.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateUserEnergy(userData.id, ENERGY_COST_PER_GAME);
    if (!success) return;

    setShotsLeft(SHOTS_PER_GAME);
    setScore(0);
    setIsGameActive(true);
    spawnGem();
  };

  const handleGemClick = async (reward) => {
    setScore((prev) => prev + reward);
    setGem(null);
    setShowExplosion(true);
    await updateUserBalance(userData.id, reward);

    setTimeout(() => setShowExplosion(false), 1000);
    spawnGem();
  };

  return (
    <div className={clsx("ston-game-bg relative h-screen w-screen overflow-hidden", showExplosion && "bg-red-700 transition-all duration-1000")}>
      <div className="absolute top-3 left-3 z-40">
        <Button 
          size="icon"
          variant="ghost"
          className="bg-slate-800/80 hover:bg-slate-700/90 rounded-full shadow-md"
          onClick={() => navigate('/tasks')}
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Button>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-4 text-white z-40">
        {userData?.profilePicUrl ? (
          <img src={userData.profilePicUrl} alt="profile" className="w-8 h-8 rounded-full border border-sky-400" />
        ) : (
          <UserCircle className="w-8 h-8" />
        )}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          {userData?.energy}
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          {userData?.balance}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center h-full">
        {!isGameActive ? (
          <Button onClick={handleStartGame} className="text-xl px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            Start Game
          </Button>
        ) : (
          <>
            <div className="text-white mb-4 text-xl">Score: {score}</div>
            <div className="text-white mb-6">Shots Left: {shotsLeft}</div>
          </>
        )}
      </div>

      <AnimatePresence>
        {gem && (
          <motion.div
            key={gem.id}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: "90vh", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: GAME_DURATION_MS / 1000 }}
            className="absolute"
            style={{ left: `${gem.x}%`, top: 0 }}
          >
            <motion.div
              onClick={() => handleGemClick(gem.reward)}
              className={clsx(
                "cursor-pointer rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-yellow-300",
              )}
              style={{
                width: `${30 + gem.reward * 5}px`,
                height: `${30 + gem.reward * 5}px`,
                fontSize: `${12 + gem.reward * 2}px`,
              }}
              whileTap={{ scale: 0.8 }}
            >
              +{gem.reward}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StonDropGame;
