import React, { useEffect, useRef, useState } from "react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/firebase";
import stonImg from "@/assets/ston.png";
import bombImg from "@/assets/bomb.png";
import backgroundImg from "@/assets/background.jpg";
import catchSound from "@/assets/catch.mp3";
import explosionSound from "@/assets/explosion.mp3";

const canvasWidth = 360;
const canvasHeight = 600;

const StonDropGame = () => {
  const canvasRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);
  const [flashRed, setFlashRed] = useState(false);

  const catchAudio = new Audio(catchSound);
  const explosionAudio = new Audio(explosionSound);

  const userId = sessionStorage.getItem("gameUserId");

  const fetchUserData = async () => {
    const db = getFirestore(app);
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) setUserData(docSnap.data());
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !userData) return;
    const ctx = canvasRef.current.getContext("2d");
    let animationId;
    const objects = [];

    const stonImage = new Image();
    stonImage.src = stonImg.src;
    const bombImage = new Image();
    bombImage.src = bombImg.src;
    const bgImage = new Image();
    bgImage.src = backgroundImg.src;

    const spawnObject = () => {
      const isBomb = Math.random() < 0.2;
      const reward = isBomb ? 0 : Math.floor(Math.random() * 5) + 1;
      const size = isBomb ? 30 : 20 + reward * 10;
      objects.push({
        x: Math.random() * (canvasWidth - size),
        y: -size,
        size,
        speed: 2 + Math.random() * 3,
        isBomb,
        reward,
      });
    };

    const handleClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (
          x > obj.x &&
          x < obj.x + obj.size &&
          y > obj.y &&
          y < obj.y + obj.size
        ) {
          if (obj.isBomb) {
            explosionAudio.play();
            setFlashRed(true);
            navigator.vibrate?.(300);
            setScore((prev) => Math.max(0, prev - 20));
            setTimeout(() => setFlashRed(false), 150);
          } else {
            catchAudio.play();
            setScore((prev) => prev + obj.reward);
          }
          objects.splice(i, 1);
          break;
        }
      }
    };

    const render = () => {
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
      for (const obj of objects) {
        const img = obj.isBomb ? bombImage : stonImage;
        ctx.drawImage(img, obj.x, obj.y, obj.size, obj.size);
        obj.y += obj.speed;
      }
      animationId = requestAnimationFrame(render);
    };

    let spawnInterval = setInterval(spawnObject, 600);
    render();
    canvasRef.current.addEventListener("click", handleClick);

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationId);
      canvasRef.current?.removeEventListener("click", handleClick);
    };
  }, [userData]);

  useEffect(() => {
    if (timeLeft <= 0 && !isGameOver) {
      endGame();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const endGame = async () => {
    setIsGameOver(true);
    const db = getFirestore(app);
    const userRef = doc(db, "users", userId);
    const newBalance = (userData?.balance || 0) + score;
    await updateDoc(userRef, { balance: newBalance });
    alert(`Congratulations! You earned $${score}. New Balance: $${newBalance}`);
    window.location.href = "/tasks";
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="w-full h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {flashRed && <div className="absolute w-full h-full bg-red-500 opacity-50 z-50" />}

      <div className="flex items-center justify-between px-3 py-2 text-sm z-10 bg-[#111]">
        <button onClick={() => (window.location.href = "/tasks")}>{"<-"}</button>
        <img src={userData.profilePicUrl} className="w-8 h-8 rounded-full" />
        <div className="text-right">
          <div>⚡ {userData.energy}</div>
          <div>${userData.balance}</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="mx-auto my-2 border border-gray-700 bg-[#111]"
      />

      <div className="text-center py-2 text-sm bg-[#111]">
        <div>{String(timeLeft).padStart(2, "0")}:00 | Score: ${score}</div>
      </div>
    </div>
  );
};

export default StonDropGame;
    
