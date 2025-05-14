import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/gui/button';
import { useToast } from '@/components/gui/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const GAME_SPEED = 10; // Ball movement speed in milliseconds
const PADDLE_SPEED = 10; // Paddle movement speed
const GEM_REWARD_MIN = 1; // Minimum gem reward
const GEM_REWARD_MAX = 10; // Maximum gem reward
const ENERGY_COST_PER_GAME = -20;
const LIFE_RECOVERY_TIME_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENERGY = 1000;

function StonGamePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState(null);
  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [ball, setBall] = useState({ x: 50, y: 50, dx: 2, dy: 2 });
  const [paddle, setPaddle] = useState({ x: 45 }); // Paddle position in percentage
  const [gems, setGems] = useState([]);
  const gameAreaRef = useRef(null);

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

  const recoverLives = useCallback(() => {
    if (lives < 5) {
      setLives((prev) => prev + 1);
    }
  }, [lives]);

  const recoverEnergy = useCallback(async () => {
    if (userData?.id && energy < MAX_ENERGY) {
      const recoveredEnergy = Math.min(MAX_ENERGY - energy, 100); // Recover up to 100 energy
      const success = await updateUserEnergy(userData.id, recoveredEnergy);
      if (success) setEnergy((prev) => prev + recoveredEnergy);
    }
  }, [energy, userData]);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem('cachedUser');
    if (!cachedUser) {
      toast({
        title: 'User Not Found',
        description: 'Please launch the game via the dashboard.',
        variant: 'destructive',
      });
      navigate('/tasks');
      return;
    }
    const user = JSON.parse(cachedUser);
    setUserData(user);
    setEnergy(user.energy || 0);

    // Start life recovery interval
    const lifeInterval = setInterval(recoverLives, LIFE_RECOVERY_TIME_MS);

    // Start energy recovery interval
    const energyInterval = setInterval(recoverEnergy, 24 * 60 * 60 * 1000); // 24 hours

    return () => {
      clearInterval(lifeInterval);
      clearInterval(energyInterval);
    };
  }, [navigate, toast, recoverLives, recoverEnergy]);

  const startGame = () => {
    if (energy < Math.abs(ENERGY_COST_PER_GAME)) {
      toast({
        title: 'Not enough energy!',
        description: `You need ${Math.abs(ENERGY_COST_PER_GAME)} energy to play.`,
        variant: 'destructive',
      });
      return;
    }

    setLives(5); // Reset lives
    setScore(0); // Reset score
    setIsGameActive(true);

    updateUserEnergy(userData?.id, ENERGY_COST_PER_GAME); // Deduct energy
    spawnGems();
  };

  const endGame = async () => {
    setIsGameActive(false);

    const success = await updateUserBalance(userData?.id, score);
    if (success) {
      toast({
        title: 'Game Over!',
        description: `You earned ${score} STON.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update balance.',
        variant: 'destructive',
      });
    }
  };

  const spawnGems = () => {
    setGems(Array(5).fill(null).map(() => ({
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10, // Random X position
      y: -10, // Start above the screen
      value: Math.floor(Math.random() * (GEM_REWARD_MAX - GEM_REWARD_MIN + 1)) + GEM_REWARD_MIN,
    })));
  };

  const handleBallMovement = () => {
    setBall((prev) => {
      let { x, y, dx, dy } = prev;

      // Check collisions with walls
      if (x <= 0 || x >= 100) dx = -dx; // Left or right wall
      if (y <= 0) dy = -dy; // Top wall

      // Check collision with paddle
      const paddleLeft = paddle.x - 10;
      const paddleRight = paddle.x + 10;
      if (y >= 95 && x >= paddleLeft && x <= paddleRight) dy = -dy;

      // Check if ball falls below paddle
      if (y > 100) {
        setLives((prev) => prev - 1);
        if (lives <= 1) {
          endGame();
        }
        return { x: 50, y: 50, dx, dy }; // Reset ball position
      }

      return { x: x + dx, y: y + dy, dx, dy };
    });
  };

  const movePaddle = (direction) => {
    setPaddle((prev) => ({
      x: Math.max(10, Math.min(90, prev.x + (direction === 'left' ? -PADDLE_SPEED : PADDLE_SPEED))),
    }));
  };

  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(handleBallMovement, GAME_SPEED);
    return () => clearInterval(interval);
  }, [isGameActive, ball, paddle]);

  if (!userData) return null;

  return (
    <div className="ston-game-bg">
      <div className="game-container">
        <div className="game-header flex justify-between items-center p-2 text-xs">
          <div className="flex items-center gap-2">
            <p className="game-header-text font-semibold">{userData.firstName}</p>
            <div className="flex items-center game-balance text-xs">
              Score: {score}
            </div>
          </div>
          <div className="game-energy">Lives: {lives}</div>
        </div>
        <div className="game-content">
          <div id="game-area" ref={gameAreaRef} className="game-area relative">
            {gems.map((gem) => (
              <div key={gem.id} style={{ left: `${gem.x}%`, top: `${gem.y}%` }} className="gem">
                {gem.value}
              </div>
            ))}
            <div
              className="ball"
              style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            ></div>
            <div
              className="paddle"
              style={{ left: `${paddle.x}%` }}
            ></div>
          </div>
          {!isGameActive ? (
            <Button onClick={startGame}>Start Game</Button>
          ) : (
            <div>
              <Button onMouseDown={() => movePaddle('left')}>Left</Button>
              <Button onMouseDown={() => movePaddle('right')}>Right</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StonGamePage;
