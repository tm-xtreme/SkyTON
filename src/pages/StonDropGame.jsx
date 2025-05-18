import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const GAME_DURATION_MS = 30000; // 30 seconds
const DROP_INTERVAL_MS = 1000; // 1 second
const ENERGY_COST = 20;

const StonDropGame = ({ onExit }) => {
  const { toast } = useToast();
  const [userData, setUserData] = useState(null);
  const [drops, setDrops] = useState([]);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameAreaRef = useRef(null);
  const dropIdRef = useRef(0);
  const dropIntervalRef = useRef(null);
  const gameTimeoutRef = useRef(null);
  const collectSoundRef = useRef(null);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem("cachedUser");
    if (!cachedUser) {
      toast({
        title: "User Not Found",
        description: "Please launch the game via the dashboard.",
        variant: "destructive",
      });
      onExit();
      return;
    }
    const user = JSON.parse(cachedUser);
    setUserData(user);
    setEnergy(user.energy);
  }, [onExit, toast]);

  const startGame = async () => {
    if (energy < ENERGY_COST) {
      toast({
        title: 'Not enough energy!',
        description: `You need ${ENERGY_COST} energy to play.`,
        variant: 'destructive'
      });
      return;
    }

    setIsPlaying(true);
    setScore(0);
    setDrops([]);

    // Deduct energy
    await updateDoc(doc(db, 'users', userData.id), { energy: increment(-ENERGY_COST) });
    setEnergy(prev => prev - ENERGY_COST);

    // Start dropping tokens
    dropIntervalRef.current = setInterval(() => {
      const dropId = dropIdRef.current++;
      const left = Math.random() * 90 + 5; // Random position between 5% and 95%
      const value = Math.ceil(Math.random() * 5); // Random value between 1 and 5
      setDrops(prev => [...prev, { id: dropId, left, value }]);
    }, DROP_INTERVAL_MS);

    // End game after duration
    gameTimeoutRef.current = setTimeout(() => {
      endGame();
    }, GAME_DURATION_MS);
  };

  const endGame = async () => {
    clearInterval(dropIntervalRef.current);
    clearTimeout(gameTimeoutRef.current);
    setIsPlaying(false);
    setDrops([]);

    // Update balance
    await updateDoc(doc(db, 'users', userData.id), { balance: increment(score) });
    toast({ title: 'Game Over!', description: `You earned ${score} STON.` });

    // Fetch updated user data
    const ref = doc(db, 'users', userData.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const updatedUser = { id: userData.id, ...snap.data() };
      setUserData(updatedUser);
      setEnergy(updatedUser.energy);
    }
  };

  const collectDrop = (id, value) => {
    setScore(prev => prev + value);
    setDrops(prev => prev.filter(drop => drop.id !== id));
    if (collectSoundRef.current) {
      collectSoundRef.current.currentTime = 0;
      collectSoundRef.current.play();
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#0c0f13] overflow-hidden">
      <audio ref={collectSoundRef} src="/assets/collect_sound.mp3" preload="auto" />
      <div className="absolute top-4 left-4">
        <Button variant="secondary" onClick={onExit}>Back</Button>
      </div>

      <div className="absolute top-4 right-4 text-white space-y-1 text-right">
        <div className="text-md font-bold">STON: {score}</div>
        <div className="text-sm">Energy: {energy}/100</div>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button onClick={startGame}>Start Drop</Button>
        </div>
      )}

      <div ref={gameAreaRef} className="relative w-full h-full">
        {drops.map(drop => (
          <motion.div
            key={drop.id}
            initial={{ top: -50 }}
            animate={{ top: '90vh' }}
            transition={{ duration: 4, ease: 'linear' }}
            onClick={() => collectDrop(drop.id, drop.value)}
            className="absolute w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center text-white font-bold"
            style={{ left: `${drop.left}%`, cursor: 'pointer' }}
          >
            +{drop.value}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StonDropGame;
