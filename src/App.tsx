import React, { useState, useEffect, useRef, useCallback } from 'react';

type Point = { x: number; y: number };

const TRACKS = [
  { id: 1, title: "DATA.OVERFLOW.MP3", artist: "NULL_NODE", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "CYBER_PSYCHOSIS.WAV", artist: "ERR_0x00A", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "KERNEL.PANIC.EXE", artist: "SYS_ADMIN", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]; 
const INITIAL_DIRECTION = { x: 0, y: -1 }; 
const BASE_SPEED = 120; 

function MusicPlayer({ audioRef, isPlaying, setIsPlaying }: any) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const currentTrack = TRACKS[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume, audioRef]);

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        }
    }, [currentTrackIndex, isPlaying, audioRef, setIsPlaying]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
        else { audioRef.current.play(); setIsPlaying(true); }
    };

    const nextTrack = () => { setCurrentTrackIndex((p) => (p + 1) % TRACKS.length); setIsPlaying(true); };
    const prevTrack = () => { setCurrentTrackIndex((p) => (p - 1 + TRACKS.length) % TRACKS.length); setIsPlaying(true); };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleEnded = () => nextTrack();
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [audioRef]);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-black border-t-4 border-[#ff00ff] flex flex-col md:flex-row items-center justify-between px-4 z-50">
            <audio ref={audioRef} src={currentTrack.url} preload="auto" />
            
            <div className="hidden md:flex flex-col w-1/3 text-[#00ffff]">
                <h4 className="glitch-text text-xl font-bold" data-text={currentTrack.title}>{currentTrack.title}</h4>
                <p className="text-[#ff00ff] text-sm">::{currentTrack.artist}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center w-full md:w-1/3 py-2">
                <div className="flex items-center gap-6">
                    <button onClick={prevTrack} className="hover:text-[#ff00ff] text-2xl">[ PREV ]</button>
                    <button onClick={togglePlay} className="hover:text-[#ff00ff] text-2xl border-2 border-[#00ffff] px-4 py-1">
                        [ {isPlaying ? "PAUSE" : "PLAY"} ]
                    </button>
                    <button onClick={nextTrack} className="hover:text-[#ff00ff] text-2xl">[ NEXT ]</button>
                </div>
            </div>

            <div className="hidden md:flex justify-end items-center gap-4 w-1/3">
                <span className="text-[#ff00ff]">VOL</span>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24" />
            </div>
            <div className="md:hidden absolute top-1 left-0 w-full text-center pointer-events-none opacity-50 text-[10px]">
                {currentTrack.title}
            </div>
        </div>
    );
}

function SnakeGame({ onGameStart }: { onGameStart: () => void }) {
    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
    const directionRef = useRef<Point>(INITIAL_DIRECTION);
    const [food, setFood] = useState<Point>({ x: 5, y: 5 });
    const [gameOver, setGameOver] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [score, setScore] = useState(0);

    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood: Point;
        while(true) {
            newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
            if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
        }
        setFood(newFood);
    }, []);

    const resetGame = useCallback(() => {
        setSnake(INITIAL_SNAKE);
        directionRef.current = INITIAL_DIRECTION;
        setScore(0); setGameOver(false); setHasStarted(true);
        generateFood(INITIAL_SNAKE);
        onGameStart();
    }, [generateFood, onGameStart]);

    const moveSnake = useCallback(() => {
        if (gameOver || !hasStarted) return;
        setSnake((prev) => {
            const head = prev[0];
            const dir = directionRef.current;
            const nextHead = { x: head.x + dir.x, y: head.y + dir.y };

            if (nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE || prev.some(s => s.x === nextHead.x && s.y === nextHead.y)) {
                setGameOver(true); return prev;
            }

            const newSnake = [nextHead, ...prev];
            if (nextHead.x === food.x && nextHead.y === food.y) {
                setScore(s => s + 10); generateFood(newSnake);
            } else newSnake.pop();
            return newSnake;
        });
    }, [food, gameOver, hasStarted, generateFood]);

    useEffect(() => {
        const intervalId = setInterval(moveSnake, BASE_SPEED);
        return () => clearInterval(intervalId);
    }, [moveSnake]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
            if ((!hasStarted || gameOver) && (e.key === "Enter" || e.key === " ")) return resetGame();

            const dir = directionRef.current;
            switch (e.key) {
                case "ArrowUp": case "w": if (dir.y !== 1) directionRef.current = { x: 0, y: -1 }; break;
                case "ArrowDown": case "s": if (dir.y !== -1) directionRef.current = { x: 0, y: 1 }; break;
                case "ArrowLeft": case "a": if (dir.x !== 1) directionRef.current = { x: -1, y: 0 }; break;
                case "ArrowRight": case "d": if (dir.x !== -1) directionRef.current = { x: 1, y: 0 }; break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameOver, hasStarted, resetGame]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4 z-10 font-mono text-2xl">
            <div className="flex justify-between w-full max-w-[500px] mb-2 px-2 text-[#ff00ff]">
                <div>MEM_ALLOC: <span className="text-[#00ffff]">{score.toString().padStart(4, '0')}</span></div>
                <div>SYS_STATE: <span className={gameOver && hasStarted ? 'text-[#ff00ff]' : 'text-[#00ffff]'}>{gameOver && hasStarted ? 'FAIL' : hasStarted ? 'RUN' : 'WAIT'}</span></div>
            </div>

            <div className="relative w-full max-w-[500px] aspect-square bg-black border-4 border-[#00ffff] overflow-hidden" style={{boxShadow: '8px 8px 0 #ff00ff'}}>
                <div className="absolute inset-0 z-20 mix-blend-screen opacity-40 pointer-events-none bg-[length:100%_4px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"></div>

                <div className="w-full h-full relative z-10" style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE; const y = Math.floor(i / GRID_SIZE);
                        const isSnake = snake.some(s => s.x === x && s.y === y);
                        const isHead = snake.findIndex(s => s.x === x && s.y === y) === 0;
                        const isFood = food.x === x && food.y === y;

                        return (
                            <div key={i} className={`w-full h-full border border-black ${
                                isHead ? 'bg-[#ff00ff] z-10 relative shadow-[0_0_8px_#ff00ff]' :
                                isSnake ? 'bg-[#00ffff]' : 
                                isFood ? 'bg-[#fff] animate-pulse shadow-[0_0_8px_#fff]' : 'bg-transparent'
                            }`} />
                        )
                    })}
                </div>

                {!hasStarted && (
                    <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-6 text-center">
                        <h2 className="glitch-text text-4xl mb-8" data-text="AWAITING_INPUT">AWAITING_INPUT</h2>
                        <button onClick={resetGame} className="px-6 py-2 border-2 border-[#fff] text-[#fff] bg-black hover:bg-[#ff00ff] hover:text-black uppercase shadow-[4px_4px_0_#00ffff]">
                            [ EXECUTE_PROTOCOL ]
                        </button>
                    </div>
                )}

                {hasStarted && gameOver && (
                    <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center p-6 text-center border-4 border-[#ff00ff]">
                        <h2 className="glitch-text text-5xl text-[#ff00ff] mb-4" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                        <p className="text-xl mb-6">FINAL_ADDR: <span className="text-[#00ffff]">{score}</span></p>
                        <button onClick={resetGame} className="px-6 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black uppercase shadow-[4px_4px_0_#ff00ff]">
                            [ REBOOT_SYSTEM ]
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function App() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="h-[100dvh] bg-[#000] font-mono text-[#00ffff] flex flex-col relative overflow-hidden vhs-flicker screen-tear">
            <div className="absolute inset-0 static-noise z-50 pointer-events-none"></div>
            <div className="absolute inset-0 scanlines z-40 pointer-events-none opacity-60"></div>

            <div className="relative z-20 flex items-center justify-center py-6 border-b-4 border-[#ff00ff] bg-black">
                <h1 className="text-4xl text-[#ff00ff] glitch-text" data-text="TERMINAL.SNAKE_OS">TERMINAL.SNAKE_OS</h1>
            </div>

            <SnakeGame onGameStart={() => {
                if (!isPlaying && audioRef.current) {
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(()=>console.log("Autoplay blocked"));
                }
            }} />

            <MusicPlayer audioRef={audioRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
    );
}
