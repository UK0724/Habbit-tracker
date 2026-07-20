import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { UserNote } from "../types";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  FolderOpen,
  Calendar,
  Save,
  ChevronRight,
  Eye,
  Edit3,
  X
} from "lucide-react";

// Simple Custom Markdown to HTML regex parser
const parseMarkdown = (markdown: string): string => {
  if (!markdown) return "";
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold font-display border-b border-border-app/40 pb-2 mt-4 mb-2 text-content">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold font-display mt-4 mb-2 text-content-2">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold mt-3 mb-1.5 text-content-2">$1</h3>');

  // Checklists (checked/unchecked)
  html = html.replace(/^- \[x\] (.*?)$/gm, '<div class="flex items-center gap-2 text-xs text-content-muted my-1"><input type="checkbox" checked disabled class="rounded text-accent" /> <span class="line-through">$1</span></div>');
  html = html.replace(/^- \[ \] (.*?)$/gm, '<div class="flex items-center gap-2 text-xs text-content-2 my-1"><input type="checkbox" disabled class="rounded border-border-app" /> <span>$1</span></div>');

  // Bullet points
  html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-sm text-content-2 my-1">$1</li>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-content">$1</strong>');

  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-surface-3 border border-border-app px-1 rounded text-xs text-rose-500 font-mono">$1</code>');

  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-surface-2 border border-border-app p-3 rounded-xl text-xs font-mono text-emerald-500 my-3 overflow-x-auto">$1</pre>');

  // Newlines to paragraph breaks (if not matched inside other blocks)
  html = html.replaceAll("\n", "<br />");

  return html;
};

export const NotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const notes = useJobTrackerStore((s) => s.notes);
  const addNote = useJobTrackerStore((s) => s.addNote);
  const updateNote = useJobTrackerStore((s) => s.updateNote);
  const deleteNote = useJobTrackerStore((s) => s.deleteNote);

  // Active loaded note ID
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Note category filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Editor mode: edit or preview or split
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [newNoteModal, setNewNoteModal] = useState(false);

  // New note form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<UserNote["category"]>("Interview Notes");

  // Load first note or command parameter note
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0]?.id || null);
    }
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setNewTitle("");
      setNewNoteModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeNote) return;
    updateNote({
      ...activeNote,
      content: e.target.value,
      dateUpdated: new Date().toISOString().split("T")[0] || ""
    });
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const id = addNote({
      title: newTitle.trim(),
      category: newCategory,
      content: `# ${newTitle.trim()}\n\nWrite your markdown notes here...`,
      dateUpdated: new Date().toISOString().split("T")[0] || ""
    });

    setActiveNoteId(id);
    setNewNoteModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote(id);
      if (activeNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setActiveNoteId(remaining[0]?.id || null);
      }
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (categoryFilter === "all") return true;
    return note.category === categoryFilter;
  });

  const categories: UserNote["category"][] = [
    "Interview Notes",
    "Questions",
    "Learning",
    "STAR Stories",
    "Recruiter Conversations"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            Interview Notes &amp; STAR Stories
          </h1>
          <p className="text-xs text-content-muted mt-1">Draft STAR behavioral interview templates, checklists, and recruiters logs</p>
        </div>
        <button
          onClick={() => {
            setNewTitle("");
            setNewNoteModal(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          Create Note
        </button>
      </section>

      {/* Workspace Panel */}
      <div className="relative flex flex-col md:flex-row gap-6 min-h-[50vh]">
        {/* Left Side: Note List Selector */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <div className="surface-card p-3 flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-content-muted px-2.5">Category Filter</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-border-app bg-surface-2 p-2.5 text-xs font-bold text-content-2 outline-none focus:border-accent"
            >
              <option value="all">All Notes</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="surface-card p-2 flex-1 overflow-y-auto max-h-[55vh] space-y-1">
            {filteredNotes.map((note) => {
              const active = note.id === activeNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`group flex items-center justify-between rounded-xl p-3 cursor-pointer text-xs transition ${
                    active
                      ? "bg-accent/10 text-accent border border-accent/20 font-bold"
                      : "text-content-2 hover:bg-surface-3 border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate pr-2">{note.title}</p>
                    <p className="text-[9px] text-content-muted mt-1 flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" />
                      {note.category}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="p-1 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition shrink-0"
                    title="Delete Note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {filteredNotes.length === 0 && (
              <p className="text-center py-12 text-content-muted font-bold text-xs">No notes found.</p>
            )}
          </div>
        </aside>

        {/* Right Side: Markdown Editor Workspace */}
        <section className="flex-1 surface-card overflow-hidden flex flex-col">
          {activeNote ? (
            <div className="flex-1 flex flex-col min-h-[50vh]">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-border-app/40 p-4 bg-surface-2/20">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
                    {activeNote.category}
                  </span>
                  <span className="text-[10px] text-content-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated: {activeNote.dateUpdated}
                  </span>
                </div>

                {/* View Toggles */}
                <div className="flex rounded-xl border border-border-app bg-surface p-1">
                  <button
                    onClick={() => setEditorTab("edit")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold transition ${
                      editorTab === "edit" ? "bg-accent text-accent-fg" : "text-content-muted hover:text-content"
                    }`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Write
                  </button>
                  <button
                    onClick={() => setEditorTab("preview")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold transition ${
                      editorTab === "preview" ? "bg-accent text-accent-fg" : "text-content-muted hover:text-content"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Editor Workspace Area */}
              <div className="flex-1 p-4 flex flex-col min-h-[40vh]">
                {editorTab === "edit" ? (
                  <textarea
                    value={activeNote.content}
                    onChange={handleContentChange}
                    placeholder="Write markdown content here..."
                    className="w-full flex-1 bg-transparent text-sm leading-relaxed text-content outline-none resize-none min-h-[35vh] font-mono"
                  />
                ) : (
                  <div
                    className="prose prose-sm text-sm leading-relaxed text-content max-w-none min-h-[35vh] break-words overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(activeNote.content) }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-content-muted border border-dashed rounded-2xl">
              <FileText className="h-10 w-10 text-content-subtle mb-3" />
              <p className="text-sm font-bold">No Note Selected</p>
              <p className="text-xs mt-1">Select a note from the sidebar or click Create Note to begin.</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal Dialog: New Note Title */}
      {newNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">New Note</h3>
              <button
                onClick={() => setNewNoteModal(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 text-content-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateNoteSubmit} className="p-6 space-y-4">
              <div>
                <label className="field-label">Note Title *</label>
                <input
                  type="text"
                  required
                  placeholder="STAR Story: Performance improvements"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="field-label">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as UserNote["category"])}
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-app">
                <button
                  type="button"
                  onClick={() => setNewNoteModal(false)}
                  className="rounded-xl border border-border-app bg-surface px-4 py-2.5 text-xs font-bold text-content-2 hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
