import React, { useEffect, useState, useRef } from "react";
import "./App.css";

// Backend API base URL - change in production as needed
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Colors/theme based on request details and README recommendations
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ffca28",
};

// PUBLIC_INTERFACE
function App() {
  // Notes state (list of all notes)
  const [notes, setNotes] = useState([]);
  // ui: currently selected note (by id)
  const [selectedId, setSelectedId] = useState(null);
  // ui: Draft for editing (title/body), separate from backend state
  const [draft, setDraft] = useState({ title: "", body: "" });
  // ui: Track request status for minimal feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ui: Responsive sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const didMountRef = useRef(false);

  // Fetch notes on load
  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  // Helper: Fetch all notes from backend
  // PUBLIC_INTERFACE
  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) throw new Error("Failed to load notes");
      const data = await response.json();
      setNotes(data);
      // Select the first note or reset selection
      setSelectedId(data.length > 0 ? data[0].id : null);
    } catch (err) {
      setError(err.message || "Error fetching notes");
    } finally {
      setLoading(false);
    }
  }

  // When selected note changes, update draft
  useEffect(() => {
    if (!selectedId) {
      setDraft({ title: "", body: "" });
      return;
    }
    const selected = notes.find((n) => n.id === selectedId);
    if (selected) setDraft({ title: selected.title, body: selected.body });
  }, [selectedId, notes]);

  // Handlers for sidebar navigation
  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setError("");
  }

  // PUBLIC_INTERFACE
  async function handleDeleteNote(id) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Delete failed");
      await fetchNotes();
      setSelectedId((prev) =>
        notes.length > 1
          ? notes.filter((n) => n.id !== id)[0]?.id
          : null
      );
    } catch (err) {
      setError(err.message || "Deletion failed");
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleDraftChange(e) {
    setDraft({ ...draft, [e.target.name]: e.target.value });
  }

  // PUBLIC_INTERFACE
  async function handleSaveNote(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (draft.title.trim() === "") {
      setError("Title is required");
      setLoading(false);
      return;
    }
    try {
      let resp, data;
      if (selectedId) {
        // update
        resp = await fetch(`${API_BASE}/notes/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft.title, body: draft.body }),
        });
        if (!resp.ok) throw new Error("Update failed");
      } else {
        // create
        resp = await fetch(`${API_BASE}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft.title, body: draft.body }),
        });
        if (!resp.ok) throw new Error("Create failed");
        data = await resp.json();
      }
      await fetchNotes();
      if (data && data.id) setSelectedId(data.id);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleNewNote() {
    setSelectedId(null);
    setDraft({ title: "", body: "" });
    setError("");
  }

  // Sidebar toggle for mobile
  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  // App layout
  return (
    <div className="notes-root" data-theme="light" style={{ height: "100vh", background: "#fff" }}>
      {/* Topbar */}
      <div
        className="notes-topbar"
        style={{
          height: 56,
          background: COLORS.primary,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          fontWeight: 600,
          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
        }}
      >
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 24,
            marginRight: 12,
            cursor: "pointer",
          }}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span style={{ fontSize: 22, letterSpacing: 1 }}>📝 Notemaster</span>
        <span style={{ color: COLORS.accent, fontSize: 16 }}>Minimal Notes App</span>
      </div>

      {/* Layout grid: sidebar + main */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <aside
          className="notes-sidebar"
          style={{
            width: sidebarOpen ? 260 : 0,
            minWidth: sidebarOpen ? 180 : 0,
            background: "#f9f9f9",
            borderRight: "1px solid #e9ecef",
            transition: "all 0.2s",
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            display: sidebarOpen ? "flex" : "none",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "0.8rem 1rem 0 1rem", borderBottom: "1px solid #eee" }}>
            <button
              style={{
                background: COLORS.accent,
                color: "#333",
                fontWeight: "bold",
                border: "none",
                borderRadius: 6,
                width: "100%",
                padding: "0.5rem 0",
                fontSize: 15,
                marginBottom: 4,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                cursor: "pointer",
              }}
              onClick={handleNewNote}
              aria-label="New note"
            >
              + New Note
            </button>
          </div>
          {/* Notes list */}
          <nav className="notes-list" style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 24, color: "#888" }}>Loading…</div>
            ) : notes.length === 0 ? (
              <div style={{ padding: 24, color: "#aaa" }}>
                <em>No notes yet</em>
              </div>
            ) : (
              notes.map((note) => (
                <SidebarNoteListItem
                  key={note.id}
                  note={note}
                  selected={note.id === selectedId}
                  onSelect={() => handleSelectNote(note.id)}
                  onDelete={() => handleDeleteNote(note.id)}
                  accent={COLORS.accent}
                />
              ))
            )}
          </nav>
        </aside>
        {/* Main area */}
        <main style={{
          flex: 1,
          background: "#fff",
          minHeight: 0,
          padding: "2.5rem 2.5vw",
          display: "flex",
          flexDirection: "column",
        }}>
          <section className="note-editor"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              width: "100%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              borderRadius: 8,
              background: "#fafcff",
              padding: "2rem 2rem 1rem 2rem"
            }}>
            <form onSubmit={handleSaveNote} autoComplete="off">
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  name="title"
                  placeholder="Note title"
                  value={draft.title}
                  onChange={handleDraftChange}
                  style={{
                    fontSize: 22,
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: `1.5px solid ${COLORS.primary}`,
                    borderRadius: 6,
                    fontWeight: 600,
                    background: "#fff",
                    color: "#222",
                    marginBottom: 4,
                    outline: "none",
                  }}
                  maxLength={100}
                  aria-label="Note title"
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  name="body"
                  placeholder="Write your note here..."
                  value={draft.body}
                  onChange={handleDraftChange}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 16,
                    width: "100%",
                    minHeight: 160,
                    border: "1.2px solid #dadada",
                    borderRadius: 5,
                    padding: "0.7rem 0.75rem",
                    resize: "vertical",
                    background: "#fff",
                  }}
                  aria-label="Note body"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: COLORS.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.5rem 1.5rem",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.72 : 1,
                  }}
                  aria-label={selectedId ? "Update note" : "Create note"}
                >
                  {selectedId ? "Update Note" : "Create Note"}
                </button>
                {selectedId && (
                  <button
                    type="button"
                    disabled={loading}
                    style={{
                      background: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.5rem 1.15rem",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                    onClick={() => handleDeleteNote(selectedId)}
                    aria-label="Delete note"
                  >
                    Delete
                  </button>
                )}
                <span style={{ flex: 1 }}></span>
                <span style={{ color: "#888", fontSize: 13 }}>{loading ? "Saving..." : null}</span>
              </div>
              {error && (
                <div style={{ marginTop: 16, color: "#e74c3c" }}>{error}</div>
              )}
            </form>
          </section>
        </main>
      </div>
      {/* Responsive adjustments */}
      <style>
        {`
        @media (max-width: 800px) {
          .notes-sidebar {
            width: 62vw !important;
            min-width: 0 !important;
            position: absolute;
            z-index: 2;
            left: 0;
            top: 56px;
            height: calc(100vh - 56px);
            box-shadow: 2px 0 8px rgba(0,0,0,0.04);
          }
          .sidebar-toggle {
            display: inline-block !important;
          }
        }
        @media (max-width: 600px) {
          main {
            padding: 1rem 0.5rem !important;
          }
          .note-editor {
            padding: 1.2rem 0.4rem 0.7rem 0.4rem !important;
          }
        }
        `}
      </style>
    </div>
  );
}

// Sidebar note list item (minimal, with delete button on hover)
// PUBLIC_INTERFACE
function SidebarNoteListItem({ note, selected, onSelect, onDelete, accent }) {
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: selected ? accent : "#f9f9f9",
        margin: "1px 0",
        padding: "0.63rem 1rem",
        borderLeft: selected ? `4px solid ${accent}` : "4px solid transparent",
        borderRadius: "0 7px 7px 0",
        fontWeight: selected ? 600 : 400,
        display: "flex",
        alignItems: "center",
        position: "relative",
        color: selected ? "#333" : "#222",
        minHeight: 32,
      }}
      tabIndex={0}
      aria-label={`Select note ${note.title}`}
    >
      <span
        style={{
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 15.5,
        }}
      >
        {note.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          background: "none",
          border: "none",
          color: "#bbb",
          fontSize: 19,
          padding: "0 0.5rem",
          opacity: 0.66,
          cursor: "pointer",
          marginLeft: 2,
          transition: "color 0.16s",
        }}
        aria-label={`Delete note ${note.title}`}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default App;
