import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const GAME_DURATION_MS = 2500;
const SHOTS_PER_GAME = 5;
const ENERGY_COST_PER_GAME = -20;

function PingPongGamePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(SHOTS_PER_GAME);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gem, setGem] = useState(null);
  const [paddlePosition, setPaddlePosition] = useState(40); // Paddle starts at 40% of screen width
  const [misses, setMisses] = useState(0); // Track misses
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 0 }); // Ball position

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

  const startNewGem = useCallback(() => {
    if (shotsLeft <= 0) return endGame();
    setGem({
      id: Date.now(),
      value: Math.floor(Math.random() * 10) + 1,
      x: Math.random() * 80 + 10,
      y: -10
    });
  }, [shotsLeft]);

  const startGame = () => {
    if (userData?.energy < Math.abs(ENERGY_COST_PER_GAME)) {
      toast({
        title: 'Not enough energy!',
        description: `You need ${Math.abs(ENERGY_COST_PER_GAME)} energy to play.`,
        variant: 'destructive'
      });
      return;
    }
    setScore(0);
    setShotsLeft(SHOTS_PER_GAME);
    setMisses(0);
    setIsGameActive(true);
    startNewGem();
  };

  const endGame = useCallback(async () => {
    setIsGameActive(false);
    setGem(null);
    if (!userData?.id) return;

    const [energyOk, balanceOk] = await Promise.all([
      updateUserEnergy(userData.id, ENERGY_COST_PER_GAME),
      updateUserBalance(userData.id, score),
    ]);

    if (energyOk && balanceOk) {
      const updatedUser = await getUserData(userData.id);
      if (updatedUser) setUserData(updatedUser);
      toast({ title: 'Game Over!', description: `You earned ${score} STON.` });
    } else {
      toast({ title: 'Error', description: 'Failed to update balance or energy.', variant: 'destructive' });
    }
  }, [score, userData]);

  const handleShoot = () => {
    if (!isGameActive || !gem || shotsLeft <= 0) return;
    setShotsLeft((prev) => prev - 1);

    const gemEl = document.getElementById(`gem-${gem.id}`);
    const area = document.getElementById('game-area');
    if (!gemEl || !area) return;

    const gemBottom = gemEl.getBoundingClientRect().bottom - area.getBoundingClientRect().top;
    const zoneTop = area.clientHeight * 0.6;
    const zoneBottom = area.clientHeight * 0.9;

    if (gemBottom > zoneTop && gemBottom < zoneBottom) {
      setScore((prev) => prev + gem.value);
      toast({ title: 'Caught!', description: `+${gem.value} STON!` });
    }
    setGem(null);
    if (shotsLeft > 1) setTimeout(startNewGem, 250);
    else setTimeout(endGame, 300);
  };

  const onGemAnimationComplete = () => {
    if (!isGameActive) return;
    setShotsLeft((prev) => prev - 1);
    setGem(null);
    if (shotsLeft > 1) setTimeout(startNewGem, 250);
    else setTimeout(endGame, 300);
  };

  const handlePaddleMove = (e) => {
    const gameArea = document.getElementById("game-area");
    if (gameArea) {
      const rect = gameArea.getBoundingClientRect();
      const newPaddlePosition = ((e.clientX - rect.left) / rect.width) * 100;
      setPaddlePosition(Math.min(Math.max(newPaddlePosition, 0), 100));
    }
  };

  const moveBall = () => {
    if (!isGameActive) return;
    setBallPosition((prev) => ({ ...prev, y: prev.y + 1 }));
    if (ballPosition.y > 100) {
      setMisses((prev) => prev + 1);
      if (misses >= 4) {
        setIsGameActive(false);
        toast({ title: 'Game Over!', description: `You missed 5 times!` });
      }
      setBallPosition({ x: 50, y: 0 });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isGameActive) moveBall();
    }, 20);
    return () => clearInterval(interval);
  }, [isGameActive, ballPosition, misses]);

  if (!userData) return null;

  return (
    <div className="ping-pong-game-bg">
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

      <div className="game-container pt-2">
        <div className="game-header flex justify-between items-center p-2 text-xs">
          <div className="flex items-center gap-2">
            {userData.profilePicUrl ? (
              <img src={userData.profilePicUrl} alt={userData.firstName} className="w-8 h-8 rounded-full border border-sky-400" />
            ) : (
              <UserCircle className="w-8 h-8 text-sky-400" />
            )}
            <div>
              <p className="game-header-text font-semibold">{userData.firstName}</p>
              <div className="flex items-center game-balance text-xs">
                <DollarSign className="w-3 h-3 mr-1" /> {userData.balance}
              </div>
            </div>
          </div>
          <div className="game-energy flex items-center gap-1 px-3 py-1 text-xs rounded bg-slate-700 text-yellow-200">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{userData.energy}</span>
          </div>
        </div>

        <div className="game-content px-2">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="game-title text-2xl font-bold text-center mb-1">Ping Pong Game</h1>
            <p className="game-subtitle text-xs text-center mb-2">Catch falling gems and earn rewards!</p>

            <div
              id="game-area"
              className="game-area relative w-full rounded-lg overflow-hidden mb-2"
              onMouseMove={handlePaddleMove}
            >
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
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-800">
                      {gem.value}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="catch-zone absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none">
              <div className="h-full"></div>
              </div>
              
              <div
                className="paddle absolute bottom-0 w-24 h-2 bg-sky-400 rounded-full"
                style={{ left: `${paddlePosition}%` }}
              ></div>
              <motion.div
                className="ball absolute bg-white rounded-full"
                style={{
                  width: '10px',
                  height: '10px',
                  left: `${ballPosition.x}%`,
                  top: `${ballPosition.y}%`,
                }}
              ></motion.div>
            </div>

            {!isGameActive ? (
              <Button onClick={startGame} className="w-full mt-4">
                Start New Game
              </Button>
            ) : (
              <div className="game-info flex justify-between items-center text-sm mb-4">
                <div className="score">
                  <strong>Score:</strong> {score}
                </div>
                <div className="shots-left">
                  <strong>Shots Left:</strong> {shotsLeft}
                </div>
                <div className="misses">
                  <strong>Misses:</strong> {misses} / 5
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PingPongGamePage;
