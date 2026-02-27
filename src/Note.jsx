import React, { useState, useEffect } from 'react';
import './Note.css';

const Note = ({ note, onRemove, onAdjustTime, onClick }) => {
    const [timeLeft, setTimeLeft] = useState(note.expiresAt - Date.now());
    const [status, setStatus] = useState('healthy');

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = note.expiresAt - Date.now();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                onRemove();
            } else if (remaining < 60 * 1000) {
                setStatus('dying');
            } else if (remaining < 5 * 60 * 1000) {
                setStatus('critical');
            } else if (remaining < 60 * 60 * 1000) {
                setStatus('warning');
            } else {
                setStatus('healthy');
            }
        }, 1000);

        const initialRemaining = note.expiresAt - Date.now();
        setTimeLeft(initialRemaining);
        if (initialRemaining <= 0) onRemove();

        return () => clearInterval(interval);
    }, [note.expiresAt, onRemove]);

    const formatTime = (ms) => {
        if (ms <= 0) return '0s';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const maxLife = 24 * 60 * 60 * 1000;
    const lifePercent = Math.max(0, Math.min(100, (timeLeft / maxLife) * 100));

    // Helper to extract a text preview from the BlockNote JSON structure
    const getPreviewText = () => {
        if (!note.content || !Array.isArray(note.content)) return null;

        // Find the first block that has text content
        let preview = "";
        for (const block of note.content) {
            if (block.content && Array.isArray(block.content)) {
                for (const span of block.content) {
                    if (span.type === "text" && span.text) {
                        preview += span.text + " ";
                    }
                }
            }
            if (preview.length > 40) break;
        }

        if (!preview.trim()) return null;

        return preview.substring(0, 40) + (preview.length > 40 ? '...' : '');
    };

    const previewText = getPreviewText();

    return (
        <div className={`note-card status-${status}`} style={{ '--life': `${lifePercent}%` }}>
            <div className="note-content" onClick={onClick} title="Click to edit details" style={{ cursor: 'pointer' }}>
                <h3 className="note-text">{note.text}</h3>
                {previewText && (
                    <p className="note-preview">
                        📝 {previewText}
                    </p>
                )}
                <div className="note-timer">
                    <span className="hourglass">⏳</span> {formatTime(timeLeft)} left
                </div>
            </div>

            <div className="note-actions">
                <div className="time-controls">
                    <button
                        className="btn-decrease"
                        aria-label="-1 Hour"
                        onClick={(e) => { e.stopPropagation(); onAdjustTime(-60 * 60 * 1000); }}
                        title="Fast forward (-1h)"
                    >
                        ➖
                    </button>
                    <button
                        className="btn-extend"
                        aria-label="+1 Hour"
                        onClick={(e) => { e.stopPropagation(); onAdjustTime(60 * 60 * 1000); }}
                        title="Feed the thought (+1h)"
                    >
                        ➕
                    </button>
                </div>
                <button
                    className="btn-process"
                    aria-label="Process"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    title="Done! Process it."
                >
                    ✅
                </button>
            </div>

            <div className="life-bar-container">
                <div className="life-bar" style={{ width: `${Math.max(0, Math.min(100, (timeLeft / note.expiresAt) * 100))}%` }}></div>
            </div>
        </div>
    );
};

export default Note;
