import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ston from "@/assets/ston.png";
import bomb from "@/assets/bomb.png";
import catchSound from "@/assets/catch.mp3";
import explosionSound from "@/assets/explosion.mp3";

const STON_VALUES = [1, 3, 5, 10];

const getRandomSton = () => ({
  id: crypto.randomUUID(),
  type: Math.random() < 0.85 ? "ston" : "bomb",
  value: STON_VALUES[Math.floor(Math.random() * STON_VALUES.length)],
  left: Math.random() * 90,
  speed: 2 + Math.random() * 3,
});

export default function StonDropGame({ userId, setActiveView }) {
  const [userData, setUserData] = useState(null);
  const [fallingItems, setFallingItems] = useState([]);
  const [score, setScore] = useState(0);
  const gameAreaRef = useRef(null);
  const [flashRed, setFlashRed] = useState(false);

  // Audio refs
  const catchAudio = useRef(null);
  const explosionAudio = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      setUserData(snap.data());
    };
    fetchUser();
  }, [userId]);

  useEffect(() => {
    const dropInterval = setInterval(() => {
      setFallingItems(prev => [...prev, getRandomSton()]);
    }, 1000);
    return () => clearInterval(dropInterval);
  }, []);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setFallingItems(prev =>
        prev
          .map(item => ({ ...item, top: (item.top || 0) + item.speed }))
          .filter(item => item.top < 100)
      );
    }, 50);
    return () => clearInterval(moveInterval);
  }, []);

  const handleClick = (itemId, type, value) => {
    setFallingItems(prev => prev.filter(item => item.id !== itemId));

    if (type === "ston") {
      catchAudio.current?.play();
      setScore(prev => prev + value);
    } else {
      explosionAudio.current?.play();
      navigator.vibrate?.([300]);
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 500);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  return (
    <div
      ref={gameAreaRef}
      className={`relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-900 to-sky-800 text-white ${
        flashRed ? "bg-red-700 transition duration-300" : ""
      }`}
    >
      {/* Audio Elements */}
      <audio ref={catchAudio} src={catchSound} preload="auto" />
      <audio ref={explosionAudio} src={explosionSound} preload="auto" />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 bg-black/40 z-10">
        <button onClick={() => setActiveView("TasksSection")}>
          <ChevronLeft className="w-7 h-7 text-white" />
        </button>
        <div className="flex items-center space-x-3">
          <img
            src={userData?.profilePicUrl}
            alt="user"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold">{userData?.firstName}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <div className="flex items-center gap-1">
                <img src={ston} className="w-4 h-4" />
                {userData?.balance}
              </div>
              <div className="flex items-center gap-1">
                ⚡ {userData?.energy}
              </div>
            </div>
          </div>
        </div>
        <div className="font-bold text-yellow-300">Score: {score}</div>
      </div>

      {/* Falling Items */}
      {fallingItems.map(item => (
        <div
          key={item.id}
          onClick={() => handleClick(item.id, item.type, item.value)}
          className="absolute"
          style={{
            left: `${item.left}%`,
            top: `${item.top || 0}%`,
            transition: "top 0.05s linear",
            cursor: "pointer",
            width: "40px",
            height: "40px",
          }}
        >
          <img
            src={item.type === "bomb" ? bomb : ston}
            alt={item.type}
            className="w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}
