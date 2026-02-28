import React, { useState, useEffect, useMemo } from 'react';
import Note from './Note';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import './index.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('flash-thoughts-theme');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [editingNoteId, setEditingNoteId] = useState(null);

  // Auto-Update state
  const [updateReady, setUpdateReady] = useState(false);

  // Initialize BlockNote
  const editor = useCreateBlockNote();

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('flash-thoughts-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('flash-thoughts');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flash-thoughts', JSON.stringify(notes));
  }, [notes]);

  const addNote = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newNote = {
      id: crypto.randomUUID(),
      text: inputValue,
      content: undefined, // Will store BlockNote JSON arrays
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    if (inputValue.toLowerCase().includes('short')) {
      newNote.expiresAt = Date.now() + 10 * 1000;
    }

    setNotes(prev => [newNote, ...prev]);
    setInputValue('');
  };

  // Electron auto-updater listener
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateReady(true);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update_downloaded');
      }
    };
  }, []);

  const removeNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingNoteId === id) setEditingNoteId(null);
  };

  const adjectTime = (id, timeChangeMs) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, expiresAt: n.expiresAt + timeChangeMs };
      }
      return n;
    }));
  };

  const openEditor = (note) => {
    setEditingNoteId(note.id);

    // Load existing content into editor if it exists
    if (note.content) {
      editor.replaceBlocks(editor.document, note.content);
    } else {
      // Clear editor for new notes
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: " " }]);
    }
  };

  const closeEditor = () => {
    // Save current blocks to note state
    const currentBlocks = editor.document;

    setNotes(prev => prev.map(n => {
      if (n.id === editingNoteId) {
        return { ...n, content: currentBlocks };
      }
      return n;
    }));
    setEditingNoteId(null);
  };

  const editingNote = notes.find(n => n.id === editingNoteId);

  return (
    <div className="app-container fade-in">
      {updateReady && (
        <div className="update-banner">
          <p>🎁 A new version of Flash-Thought is ready!</p>
          <button onClick={() => window.electronAPI.restartApp()}>Restart to Update</button>
        </div>
      )}

      <header className="header">
        <h1>Flash-Thought ✨</h1>
        <p>Capture ideas before they fade away into the void!</p>
        <button
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title="Toggle Theme"
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>
      </header>

      {editingNote ? (
        <div className="editor-view fade-in">
          <div className="editor-header">
            <h2>{editingNote.text}</h2>
            <button onClick={closeEditor} className="btn-close">Close & Save 💾</button>
          </div>

          <div className="blocknote-wrapper">
            <BlockNoteView
              editor={editor}
              theme={isDarkMode ? "dark" : "light"}
            />
          </div>
        </div>
      ) : (
        <>
          <form className="input-form" onSubmit={addNote}>
            <input
              type="text"
              placeholder="What's on your mind?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={150}
            />
            <button type="submit">Capture ⚡</button>
          </form>

          <div className="notes-grid">
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', padding: '3rem' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💭</span>
                <p>Your mind is clear. Add a thought above!</p>
              </div>
            ) : (
              notes.map(note => (
                <Note
                  key={note.id}
                  note={note}
                  onRemove={() => removeNote(note.id)}
                  onAdjustTime={(time) => adjectTime(note.id, time)}
                  onClick={() => openEditor(note)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
