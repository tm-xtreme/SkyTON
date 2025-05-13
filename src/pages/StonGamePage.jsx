import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const GAME_DURATION_MS = 3000;
const SHOTS_PER_GAME = 5;
const ENERGY_COST_PER_GAME = -20;

function StonGamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState({ id: '', name: 'Player', balance: 0, profilePicUrl: '' });
  const [energy, setEnergy] = useState(0);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(SHOTS_PER_GAME);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gem, setGem] = useState(null);

  // Firestore helpers
  const getUser = async (userId) => {
    if (!userId) return null;
    try {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      return snap.exists() ? { id: userId, ...snap.data() } : null;
    } catch (e) {
      console.error('Error fetching user:', e);
      return null;
    }
  };

  const updateUserEnergy = async (userId, amount) => {
    try {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, { energy: increment(amount) });
      return true;
    } catch (e) {
      console.error('Error updating energy:', e);
      return false;
    }
  };

  const updateUserBalance = async (userId, amount) => {
    try {
      const ref = doc(db, 'users', userId);
      await updateDoc(ref, { balance: increment(amount) });
      return true;
    } catch (e) {
      console.error('Error updating balance:', e);
      return false;
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id') || '';
    if (id) {
      getUser(id).then((data) => {
        if (data) {
          setUserData(data);
          setEnergy(data.energy || 0);
        }
      });
    }
  }, [location.search]);

  const startNewGem = useCallback(() => {
    if (shotsLeft <= 0) {
      endGame();
      return;
    }
    setGem({
      id: Date.now(),
      value: Math.floor(Math.random() * 10) + 1,
      x: Math.random() * 80 + 10,
      y: -10,
    });
  }, [shotsLeft]);

  const startGame = async () => {
    if (energy < Math.abs(ENERGY_COST_PER_GAME)) {
      toast({
        title: 'Not enough energy!',
        description: `You need ${Math.abs(ENERGY_COST_PER_GAME)} energy to play.`,
        variant: 'destructive',
      });
      return;
    }
    setIsGameActive(true);
    setScore(0);
    setShotsLeft(SHOTS_PER_GAME);
    startNewGem();
  };

  const endGame = useCallback(async () => {
    setIsGameActive(false);
    setGem(null);
    if (userData.id) {
      const energyUpdated = await updateUserEnergy(userData.id, ENERGY_COST_PER_GAME);
      const balanceUpdated = await updateUserBalance(userData.id, score);
      if (energyUpdated && balanceUpdated) {
        const updated = await getUser(userData.id);
        if (updated) {
          setUserData(updated);
          setEnergy(updated.energy);
        }
        toast({
          title: 'Game Over!',
          description: `You scored ${score} STON!`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update energy or balance.',
          variant: 'destructive',
        });
      }
    }
  }, [score, userData.id, toast]);

  const handleShoot = () => {
    if (!isGameActive || !gem || shotsLeft <= 0) return;
    setShotsLeft((prev) => prev - 1);
    const gemEl = document.getElementById(`gem-${gem.id}`);
    const area = document.getElementById('game-area');
    if (!gemEl || !area) return;

    const gemBottom = gemEl.getBoundingClientRect().bottom - area.getBoundingClientRect().top;
    const catchTop = area.clientHeight * 0.6;
    const catchBottom = area.clientHeight * 0.9;

    if (gemBottom > catchTop && gemBottom < catchBottom) {
      setScore((prev) => prev + gem.value);
      toast({ title: 'Caught!', description: `+${gem.value} STON!` });
    }
    setGem(null);
    if (shotsLeft > 1) {
      setTimeout(startNewGem, 300);
    } else {
      setTimeout(endGame, 300);
    }
  };

  const onGemAnimationComplete = () => {
    if (!isGameActive) return;
    setShotsLeft((prev) => prev - 1);
    setGem(null);
    if (shotsLeft > 1) setTimeout(startNewGem, 200);
    else setTimeout(endGame, 300);
  };

  return (
    <div className="ston-game-bg">
      <div className="absolute top-4 left-4 z-50">
        <Button size="sm" variant="ghost" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="game-container">
        <div className="game-header flex justify-between items-center p-4">
          <div className="flex items-center space-x-3">
            {userData.profilePicUrl ? (
              <img src={userData.profilePicUrl} alt={userData.name} className="w-12 h-12 rounded-full border-2 border-sky-400 shadow-lg" />
            ) : (
              <UserCircle className="w-12 h-12 text-sky-400" />
            )}
            <div>
              <p className="game-header-text text-base font-bold">{userData.name}</p>
              <div className="flex items-center text-sm game-balance">
                <DollarSign className="w-4 h-4 mr-1" /> {userData.balance}
              </div>
            </div>
          </div>
          <div className="game-energy flex items-center space-x-2 px-4 py-2 rounded-lg">
            <Zap className="w-7 h-7 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-100">{energy}</span>
          </div>
        </div>

        <div className="game-content">
          <div className="w-full max-w-md mx-auto">
            <h1 className="game-title text-4xl font-bold text-center mb-2">STON Game</h1>
            <p className="game-subtitle text-center mb-4">Catch the falling STONs before they disappear!</p>

            <div id="game-area" className="game-area relative w-full rounded-lg overflow-hidden mb-4">
              <AnimatePresence>
                {isGameActive && gem && (
                  <motion.div
                    id={`gem-${gem.id}`}
                    key={gem.id}
                    className="absolute gem"
                    initial={{ y: gem.y, x: `${gem.x}%` }}
                    animate={{ y: '110%' }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: GAME_DURATION_MS / 1000, ease: 'linear' }}
                    onAnimationComplete={onGemAnimationComplete}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-800">
                      {gem.value}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="catch-zone absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
                <div className="h-full flex items-center justify-center">
                  <p className="catch-zone-text text-sm font-medium">Catch Zone</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-lg">
              <div className="flex items-center game-score">
                <Gem className="w-6 h-6 mr-2 text-emerald-400" />
                <span className="font-bold">Score: {score}</span>
              </div>
              <div className="flex items-center">
                <span className="game-score mr-2">Shots Left:</span>
                <span className="game-shots text-2xl font-bold">{shotsLeft}</span>
              </div>
            </div>

            {!isGameActive ? (
              <Button
                onClick={startGame}
                className="w-full text-lg py-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg"
                disabled={energy < Math.abs(ENERGY_COST_PER_GAME)}
              >
                {energy < Math.abs(ENERGY_COST_PER_GAME)
                  ? `Need ${Math.abs(ENERGY_COST_PER_GAME)} Energy`
                  : 'Start Game'}
              </Button>
            ) : (
              <Button
                onClick={handleShoot}
                className="w-full text-lg py-6 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold shadow-lg"
                disabled={shotsLeft <= 0 || !gem}
              >
                Shoot!
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 text-center">
          <p className="footer-text">Powered by Hostinger Horizons. Game concept: SkyTON Catch.</p>
        </div>
      </div>
    </div>
  );
}

export default StonGamePage;
