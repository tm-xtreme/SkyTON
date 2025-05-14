import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { Gem, Zap, UserCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 420;
const PADDLE_WIDTH = 70;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 14;
const GEM_SIZE = 24;
const BALL_SPEED = 4;
const GEM_FALL_SPEED = 2.2;
const MAX_LIVES = 5;
const ENERGY_COST_PER_GAME = -20;
const LIFE_RECOVERY_TIME = 5 * 60 * 1000; // 5 min
const ENERGY_RECOVERY_TIME = 24 * 60 * 60 * 1000; // 24h
const MAX_ENERGY = 1000;

function getRandomGem() {
  return {
    id: Date.now() + Math.random(),
    value: Math.floor(Math.random() * 10) + 1,
    x: Math.random() * (GAME_WIDTH - GEM_SIZE),
    y: 0,
    caught: false,
  };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function now() {
  return Date.now();
}

function BrickBreakerGamePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // User state
  const [userData, setUserData] = useState(null);

  // Game state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gems, setGems] = useState([]);
  const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: BALL_SPEED, dy: -BALL_SPEED });
  const [paddleX, setPaddleX] = useState(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [lastLifeTime, setLastLifeTime] = useState(now());
  const [lastEnergyTime, setLastEnergyTime] = useState(now());

  // Refs for animation loop
  const requestRef = useRef();
  const gameAreaRef = useRef();

  // Firebase helpers
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

  // Life and energy recovery
  const updateUserLife = async (userId, newLife, newLastLife) => {
    try {
      await updateDoc(doc(db, 'users', userId), { life: newLife, lastLife: newLastLife });
      return true;
    } catch (err) {
      console.error('Life update error:', err);
      return false;
    }
  };

  const updateUserEnergyRecovery = async (userId, newEnergy, newLastEnergy) => {
    try {
      await updateDoc(doc(db, 'users', userId), { energy: newEnergy, lastEnergy: newLastEnergy });
      return true;
    } catch (err) {
      console.error('Energy recovery update error:', err);
      return false;
    }
  };

  // Load user
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

    // Set lives and timers from userData
    if (user.life !== undefined) setLives(user.life);
    if (user.lastLife) setLastLifeTime(user.lastLife);
    if (user.lastEnergy) setLastEnergyTime(user.lastEnergy);
  }, [navigate, toast]);

  // Life recovery timer
  useEffect(() => {
    if (!userData?.id) return;
    const interval = setInterval(async () => {
      if (lives < MAX_LIVES) {
        const elapsed = now() - (userData.lastLife || lastLifeTime);
        if (elapsed >= LIFE_RECOVERY_TIME) {
          const newLife = clamp(lives + 1, 0, MAX_LIVES);
          setLives(newLife);
          setLastLifeTime(now());
          await updateUserLife(userData.id, newLife, now());
          setUserData((u) => ({ ...u, life: newLife, lastLife: now() }));
        }
      }
    }, 1000 * 10);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [lives, userData]);

  // Energy recovery timer
  useEffect(() => {
    if (!userData?.id) return;
    const interval = setInterval(async () => {
      if (userData.energy < MAX_ENERGY) {
        const elapsed = now() - (userData.lastEnergy || lastEnergyTime);
        if (elapsed >= ENERGY_RECOVERY_TIME) {
          await updateUserEnergyRecovery(userData.id, MAX_ENERGY, now());
          setUserData((u) => ({ ...u, energy: MAX_ENERGY, lastEnergy: now() }));
        }
      }
    }, 1000 * 60);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [userData]);

  // Paddle movement (mouse/touch)
  useEffect(() => {
    const movePaddle = (e) => {
      let x;
      if (e.type === "mousemove") {
        const rect = gameAreaRef.current.getBoundingClientRect();
        x = e.clientX - rect.left;
      } else if (e.type === "touchmove") {
        const rect = gameAreaRef.current.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
      }
      setPaddleX(clamp(x - PADDLE_WIDTH / 2, 0, GAME_WIDTH - PADDLE_WIDTH));
    };
    if (isGameActive) {
      window.addEventListener("mousemove", movePaddle);
      window.addEventListener("touchmove", movePaddle, { passive: false });
    }
    return () => {
      window.removeEventListener("mousemove", movePaddle);
      window.removeEventListener("touchmove", movePaddle);
    };
  }, [isGameActive]);

  // Game loop
  const gameLoop = useCallback(() => {
    setBall((prev) => {
      let { x, y, dx, dy } = prev;
      x += dx;
      y += dy;

      // Wall collision
      if (x <= 0 || x + BALL_SIZE >= GAME_WIDTH) dx = -dx;
      if (y <= 0) dy = -dy;

      // Paddle collision
      if (
        y + BALL_SIZE >= GAME_HEIGHT - 30 &&
        x + BALL_SIZE > paddleX &&
        x < paddleX + PADDLE_WIDTH
      ) {
        dy = -Math.abs(dy);
        // Add a bit of angle based on where it hit the paddle
        const hitPos = (x + BALL_SIZE / 2) - (paddleX + PADDLE_WIDTH / 2);
        dx = BALL_SPEED * (hitPos / (PADDLE_WIDTH / 2));
      }

      // Ball falls below paddle
      if (y > GAME_HEIGHT) {
        loseLife();
        return { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: BALL_SPEED, dy: -BALL_SPEED };
      }

      return { x, y, dx, dy };
    });

    // Move gems
    setGems((prevGems) =>
      prevGems
        .map((gem) => {
          if (gem.caught) return gem;
          return { ...gem, y: gem.y + GEM_FALL_SPEED };
        })
        .filter((gem) => gem.y < GAME_HEIGHT + GEM_SIZE && !gem.caught)
    );

    // Ball-gem collision
    setGems((prevGems) => {
      let hit = false;
      const newGems = prevGems.map((gem) => {
        if (
          !gem.caught &&
          ball.x + BALL_SIZE > gem.x &&
          ball.x < gem.x + GEM_SIZE &&
          ball.y + BALL_SIZE > gem.y &&
          ball.y < gem.y + GEM_SIZE
        ) {
          hit = true;
          setScore((s) => s + gem.value);
          toast({ title: 'STON!', description: `+${gem.value} STON!` });
          updateUserBalance(userData.id, gem.value);
          return { ...gem, caught: true };
        }
        return gem;
      });
      return newGems.filter((g) => !g.caught);
    });

    // Add new gem randomly
    if (Math.random() < 0.02 && gems.length < 3) {
      setGems((prev) => [...prev, getRandomGem()]);
    }

    // Continue loop
    if (isGameActive) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    // eslint-disable-next-line
  }, [isGameActive, paddleX, ball, gems, userData]);

  // Start/stop game loop
  useEffect(() => {
    if (isGameActive) {
      setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: BALL_SPEED, dy: -BALL_SPEED });
      setGems([getRandomGem()]);
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line
  }, [isGameActive]);

  // Lose life
  const loseLife = async () => {
    if (lives > 1) {
      setLives((l) => l - 1);
      setLastLifeTime(now());
      await updateUserLife(userData.id, lives - 1, now());
    } else {
      endGame();
    }
  };

  // Start game
  const startGame = async () => {
    if (userData?.energy < Math.abs(ENERGY_COST_PER_GAME)) {
      toast({
        title: 'Not enough energy!',
        description: `You need ${Math.abs(ENERGY_COST_PER_GAME)} energy to play.`,
        variant: 'destructive'
      });
      return;
    }
    if (lives <= 0) {
      toast({
        title: 'No lives!',
        description: `Wait for life recovery (5 min per life).`,
        variant: 'destructive'
      });
      return;
    }
    setScore(0);
    setIsGameActive(true);
    setGems([getRandomGem()]);
    setBall({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: BALL_SPEED, dy: -BALL_SPEED });
    // Deduct energy
    await updateUserEnergy(userData.id, ENERGY_COST_PER_GAME);
    setUserData((u) => ({ ...u, energy: u.energy + ENERGY_COST_PER_GAME }));
  };

  // End game
  const endGame = useCallback(async () => {
    setIsGameActive(false);
    setGems([]);
    toast({ title: 'Game Over!', description: `You earned ${score} STON.` });
    // Update user data
    const updatedUser = await getUserData(userData.id);
    if (updatedUser) setUserData(updatedUser);
  }, [score, userData]);

  if (!userData) return null;

  return (
    <div className="ston-breaker-bg">
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

      <div className="breaker-container pt-2">
        <div className="breaker-header flex justify-between items-center p-2 text-xs">
          <div className="flex items-center gap-2">
            {userData.profilePicUrl ? (
              <img src={userData.profilePicUrl} alt={userData.firstName} className="w-8 h-8 rounded-full border border-sky-400" />
            ) : (
              <UserCircle className="w-8 h-8 text-sky-400" />
            )}
            <div>
              <p className="breaker-header-text font-semibold">{userData.firstName}</p>
              <div className="flex items-center breaker-balance text-xs">
                <DollarSign className="w-3 h-3 mr-1" /> {userData.balance}
              </div>
            </div>
          </div>
          <div className="breaker-energy flex items-center gap-1 px-3 py-1 text-xs rounded bg-slate-700 text-yellow-200">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{userData.energy}</span>
          </div>
          <div className="breaker-lives flex items-center gap-1 px-3 py-1 text-xs rounded bg-slate-700 text-pink-200 ml-2">
            <span className="font-bold">❤ {lives}</span>
          </div>
        </div>

        <div className="breaker-content px-2">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="breaker-title text-2xl font-bold text-center mb-1">STON Brick Breaker</h1>
            <p className="breaker-subtitle text-xs text-center mb-2">Bounce the ball, catch STON gems, earn rewards!</p>

            <div
              id="breaker-game-area"
              ref={gameAreaRef}
              className="breaker-game-area relative mx-auto rounded-lg overflow-hidden mb-2"
              style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                background: '#0a2233',
                border: '2px solid #1e293b',
                position: 'relative',
                touchAction: 'none'
              }}
            >
              {/* Gems */}
              <AnimatePresence>
                {gems.map((gem) => (
                  <motion.div
                    key={gem.id}
                    className="breaker-gem absolute"
                    style={{
                      left: gem.x,
                      top: gem.y,
                      width: GEM_SIZE,
                      height: GEM_SIZE,
                      background: 'linear-gradient(135deg,#34d399,#10b981)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#0a2233',
                      fontSize: 14,
                      border: '2px solid #fff'
                    }}
                    initial={{ scale: 0.7, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Gem className="w-4 h-4 mr-1 text-emerald-400" />
                    {gem.value}
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Ball */}
              {isGameActive && (
                <div
                  className="breaker-ball absolute"
                  style={{
                    left: ball.x,
                    top: ball.y,
                    width: BALL_SIZE,
                    height: BALL_SIZE,
                    background: 'radial-gradient(circle at 30% 30%, #fff, #38bdf8 80%)',
                    borderRadius: '50%',
                    border: '2px solid #fff'
                  }}
                />
              )}
              {/* Paddle */}
              <div
                className="breaker-paddle absolute"
                style={{
                  left: paddleX,
                  bottom: 18,
                  width: PADDLE_WIDTH,
                  height: PADDLE_HEIGHT,
                  background: 'linear-gradient(90deg,#38bdf8,#0ea5e9)',
                  borderRadius: 8,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px #0ea5e9aa',
                  transition: 'left 0.05s'
                }}
              />

              {/* Overlay for game over */}
              {!isGameActive && (
                <div
                  className="breaker-overlay absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10"
                  style={{ minHeight: GAME_HEIGHT }}
                >
                  <div className="text-white text-xl font-bold mb-2">
                    {lives === 0 ? 'Game Over' : 'STON Brick Breaker'}
                  </div>
                  <div className="text-white mb-2">Score: {score}</div>
                  <Button
                    onClick={startGame}
                    className="w-full text-sm py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-md"
                    disabled={userData.energy < Math.abs(ENERGY_COST_PER_GAME) || lives === 0}
                  >
                    {lives === 0
                      ? 'No Lives! Wait for recovery'
                      : userData.energy < Math.abs(ENERGY_COST_PER_GAME)
                      ? 'Not enough energy'
                      : 'Start Game'}
                  </Button>
                  {lives === 0 && (
                    <div className="text-xs text-pink-200 mt-2">
                      1 life recovers every 5 minutes.
                    </div>
                  )}
                  {userData.energy < Math.abs(ENERGY_COST_PER_GAME) && (
                    <div className="text-xs text-yellow-200 mt-2">
                      Energy recovers in 24h (max 1000).
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-2 text-xs">
              <div className="flex items-center breaker-score">
                <Gem className="w-4 h-4 mr-1 text-emerald-400" />
                <span className="font-bold">Score: {score}</span>
              </div>
              <div className="flex items-center">
                <span className="breaker-lives mr-1">Lives:</span>
                <span className="breaker-lives-count text-base font-bold">{lives}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrickBreakerGamePage;
