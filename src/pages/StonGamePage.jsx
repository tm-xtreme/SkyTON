
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Gem, Zap, UserCircle, DollarSign } from 'lucide-react';
import { getUserEnergy, updateUserEnergy } from '@/lib/firebase';

const GAME_DURATION_MS = 3000; 
const SHOTS_PER_GAME = 5;
const ENERGY_COST_PER_GAME = -20;

function StonGamePage() {
  const location = useLocation();
  const { toast } = useToast();

  const [userData, setUserData] = useState({
    id: '',
    name: 'Player',
    balance: '0',
    profilePicUrl: '',
  });

  const [energy, setEnergy] = useState(0);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(SHOTS_PER_GAME);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gem, setGem] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id') || '';
    setUserData({
      id: id,
      name: searchParams.get('n') || 'Player',
      balance: searchParams.get('b') || '0',
      profilePicUrl: searchParams.get('p') || '',
    });

    if (id) {
      getUserEnergy(id).then(setEnergy);
    }
  }, [location.search]);

  const fetchEnergy = useCallback(async () => {
    if (userData.id) {
      const currentEnergy = await getUserEnergy(userData.id);
      setEnergy(currentEnergy);
    }
  }, [userData.id]);

  useEffect(() => {
    fetchEnergy();
  }, [fetchEnergy]);

  const startNewGem = useCallback(() => {
    if (shotsLeft <= 0) {
      endGame();
      return;
    }
    const newGemValue = Math.floor(Math.random() * 10) + 1;
    const newGemX = Math.random() * 80 + 10; 
    setGem({
      id: Date.now(),
      value: newGemValue,
      x: newGemX,
      y: -10, 
    });
  }, [shotsLeft]);

  const startGame = async () => {
    if (energy < Math.abs(ENERGY_COST_PER_GAME)) {
      toast({
        title: "Not enough energy!",
        description: `You need ${Math.abs(ENERGY_COST_PER_GAME)} energy to play.`,
        variant: "destructive",
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
      const success = await updateUserEnergy(userData.id, ENERGY_COST_PER_GAME);
      if (success) {
        fetchEnergy(); 
        toast({
          title: "Game Over!",
          description: `You scored ${score} STON! Energy updated.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Could not update energy. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [userData.id, score, toast, fetchEnergy]);

  useEffect(() => {
    if (isGameActive && shotsLeft === 0 && !gem) {
       endGame();
    }
  }, [isGameActive, shotsLeft, gem, endGame]);

  const handleShoot = () => {
    if (!isGameActive || !gem || shotsLeft <= 0) return;

    setShotsLeft(prev => prev - 1);

    const gemElement = document.getElementById(`gem-${gem.id}`);
    if (gemElement) {
        const gemRect = gemElement.getBoundingClientRect();
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
        
        const gemBottomPosition = gemRect.bottom - gameAreaRect.top;
        const catchZoneTop = gameAreaRect.height * 0.6;
        const catchZoneBottom = gameAreaRect.height * 0.9;

        if (gemBottomPosition > catchZoneTop && gemBottomPosition < catchZoneBottom) {
            setScore(prevScore => prevScore + gem.value);
            toast({
                title: "Caught!",
                description: `+${gem.value} STON!`,
                variant: "default"
            });
            setGem(null); 
            if (shotsLeft > 1) {
                setTimeout(startNewGem, 500);
            } else {
                setTimeout(endGame, 500);
            }
        } else {
             if (shotsLeft > 1) {
                setGem(null);
                setTimeout(startNewGem, 100); 
            } else {
                 setGem(null);
                setTimeout(endGame, 100);
            }
        }
    } else {
         if (shotsLeft > 1) {
            setGem(null);
            setTimeout(startNewGem, 100);
        } else {
            setGem(null);
            setTimeout(endGame, 100);
        }
    }
  };
  
  const onGemAnimationComplete = () => {
    if(isGameActive){
        setShotsLeft(prev => prev - 1);
        setGem(null);
        if(shotsLeft > 1) {
            setTimeout(startNewGem, 100);
        } else {
            setTimeout(endGame, 100);
        }
    }
  };

  return (
    <div className="ston-game-bg">
      <div className="game-container">
        {/* Header */}
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

        {/* Game Content */}
        <div className="game-content">
          <div className="w-full max-w-md mx-auto">
            <h1 className="game-title text-4xl font-bold text-center mb-2">
              STON Game
            </h1>
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
                    transition={{ duration: GAME_DURATION_MS / 1000, ease: "linear" }}
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
                className="w-full text-lg py-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={energy < Math.abs(ENERGY_COST_PER_GAME) && userData.id !== ''}
              >
                {energy < Math.abs(ENERGY_COST_PER_GAME) && userData.id !== '' ? `Need ${Math.abs(ENERGY_COST_PER_GAME)} Energy` : "Start Game"}
              </Button>
            ) : (
              <Button
                onClick={handleShoot}
                className="w-full text-lg py-6 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={shotsLeft <= 0 || !gem}
              >
                Shoot!
              </Button>
            )}
            {userData.id === '' && (
              <p className="text-center text-yellow-400 mt-4 text-sm font-medium">
                Note: User ID not found in URL. Energy features will be disabled.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="footer-text">
            Powered by Hostinger Horizons. Game concept: SkyTON Catch.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StonGamePage;
