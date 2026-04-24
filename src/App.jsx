/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import "./reset.css";
import "./App.css";

export default function App() {
    const [points, setPoints] = useState(0);
    const [time, setTime] = useState(0);
    const [isPlay, setIsPlay] = useState(false);

    const [dots, setDots] = useState([]);
    const [current, setCurrent] = useState(1);
    const [now, setNow] = useState(() => Date.now());
    const intervalRef = useRef(null);
    const startRef = useRef(0);
    const [statusCode, setStatusCode] = useState(0);
    const status = [
        {
            label: "LET'S PLAY",
            status: 0,
            color: "#000",
        },
        {
            label: "ALL CLEARED",
            status: 1,
            color: "green",
        },
        {
            label: "GAME OVER",
            status: -1,
            color: "red",
        },
    ];
    const currentStatus = status.find((s) => s.status === statusCode);
    const [autoPlay, setAutoPlay] = useState(false);
    const autoRef = useRef(null);
    // ================= PLAY =================
    const handlePlay = () => {
        if (!points || points <= 0) return;
        setStatusCode(0);
        setIsPlay(true);
        setTime(0);
        setCurrent(1);
        setDots([]);

        startRef.current = Date.now();
        generateDots(points);
    };

    // ================= GENERATE DOTS =================
    const generateDots = (count) => {
        const base = Date.now();

        const newDots = Array.from({ length: count }, (_, i) => ({
            id: base + i,
            value: i + 1,
            x: Math.random() * 90,
            y: Math.random() * 90,
            startedAt: null,
            duration: 3000,
            removing: false,
            clicked: false,
            fading: false,
        }));

        setDots(newDots);
    };

    // ================= CLICK DOT =================
    const handleClickDot = (dot) => {
        // tránh click lại hoặc click dot đã xóa
        if (!isPlay || dot.removing || dot.clicked) return;

        // click sai
        if (dot.value !== current) {
            handleGameOver();
            return;
        }

        // bắt đầu countdown
        setDots((prev) =>
            prev.map((d) =>
                d.id === dot.id
                    ? {
                          ...d,
                          startedAt: Date.now(),
                          clicked: true,
                      }
                    : d
            )
        );

        setCurrent((prev) => prev + 1);
    };

    // ================= GAME OVER =================
    const handleGameOver = () => {
        if (!isPlay) return;

        clearInterval(intervalRef.current);
        setIsPlay(false);
        setStatusCode(-1);
    };

    // ================= GLOBAL TIMER =================
    useEffect(() => {
        if (!isPlay) return;

        intervalRef.current = setInterval(() => {
            const diff = (Date.now() - startRef.current) / 1000;
            setTime(diff);
        }, 50);

        const intervalDotTime = setInterval(() => {
            setNow(Date.now());
        }, 50);

        return () => {
            clearInterval(intervalRef.current);
            clearInterval(intervalDotTime);
        };
    }, [isPlay]);

    // ================= REMOVE DOT =================
    useEffect(() => {
        if (!isPlay) return;

        setDots((prev) => {
            let changed = false;

            const newDots = prev.map((dot) => {
                if (
                    dot.startedAt &&
                    !dot.removing &&
                    now - dot.startedAt >= dot.duration
                ) {
                    changed = true;
                    return { ...dot, removing: true };
                }
                return dot;
            });

            return changed ? newDots : prev;
        });
    }, [now, isPlay]);
    useEffect(() => {
        const removingDots = dots.filter((d) => d.removing);
        if (!removingDots.length) return;

        const timeout = setTimeout(() => {
            setDots((prev) => prev.filter((d) => !d.removing));
        }, 300);

        return () => clearTimeout(timeout);
    }, [dots]);

    // ================= ALL CLEARED =================
    useEffect(() => {
        if (!isPlay) return;
        if (dots.length === 0 && current > points) {
            setIsPlay(false);
            clearInterval(intervalRef.current);
            setStatusCode(1);
        }
    }, [dots, isPlay, current, points]);

    // ================= AUTO PLAY =================
    useEffect(() => {
        if (!autoPlay || !isPlay) return;
        autoRef.current = setInterval(() => {
            const nextDot = dots.find((d) => d.value === current);
            if (nextDot && !nextDot.startedAt) {
                handleClickDot(nextDot);
            }
        }, 1000);

        return () => clearInterval(autoRef.current);
    }, [autoPlay, isPlay, current, dots]);
    return (
        <div className="container">
            <div>
                <h1 style={{ color: currentStatus.color }}>
                    {currentStatus.label}
                </h1>
                <div className="row">
                    <label>Points:</label>
                    <input
                        type="number"
                        value={points}
                        disabled={isPlay}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") return setPoints("");
                            const num = Number(value);
                            if (!isNaN(num)) {
                                setPoints(Math.max(0, num));
                            }
                        }}
                    />
                </div>
                <div className="row">
                    <label>Time:</label>
                    <span>{time.toFixed(1)}s</span>
                </div>
                <div className="row groupBtn">
                    <button onClick={handlePlay} type="button">
                        {isPlay ? "Restart" : "Play"}
                    </button>
                    <button
                        onClick={() => setAutoPlay((prev) => !prev)}
                        disabled={!isPlay}
                    >
                        Auto Play: {autoPlay ? "ON" : "OFF"}
                    </button>
                </div>
            </div>

            <div className="game-container">
                {[...dots]
                    .sort((a, b) => b.value - a.value)
                    .map((dot) => {
                        let remaining = 0;
                        let progress = 0;
                        if (dot.startedAt) {
                            remaining = Math.max(
                                0,
                                (dot.duration - (now - dot.startedAt)) / 1000
                            );
                            progress = Math.min(
                                (now - dot.startedAt) / dot.duration,
                                1
                            );
                        }
                        const alpha = 1 - progress;

                        const color = `rgba(255, 0, 0, ${alpha})`;
                        return (
                            <div
                                className="dotWrapper"
                                style={{
                                    left: `${dot.x}%`,
                                    top: `${dot.y}%`,
                                    zIndex: dot.value === current ? 9999 : 1,
                                }}
                                onClick={() => handleClickDot(dot)}
                            >
                                <div
                                    className="dot"
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        flexDirection: "column",
                                        backgroundColor: dot.startedAt
                                            ? `rgba(255, 0, 0, ${alpha * 0.2})`
                                            : "transparent",
                                        color: color,
                                        border: `1px solid ${color}`,
                                        transition: "transform 0.3s ease",
                                    }}
                                >
                                    <span>{dot.value}</span>
                                    {dot.startedAt && (
                                        <small>{remaining.toFixed(1)}</small>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
            {isPlay && current < points + 1 && <div>Next: {current}</div>}
        </div>
    );
}
