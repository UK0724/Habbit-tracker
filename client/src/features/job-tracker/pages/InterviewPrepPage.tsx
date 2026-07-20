import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { PrepCategory, PrepTopic } from "../types";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCcw,
  BookMarked,
  Save,
  MessageSquare,
  Trash2
} from "lucide-react";

export const InterviewPrepPage = () => {
  const prepCategories = useJobTrackerStore((s) => s.prepCategories);
  const addPrepCategory = useJobTrackerStore((s) => s.addPrepCategory);
  const deletePrepCategory = useJobTrackerStore((s) => s.deletePrepCategory);
  const addPrepTopic = useJobTrackerStore((s) => s.addPrepTopic);
  const toggleTopic = useJobTrackerStore((s) => s.toggleTopic);
  const updateTopicNotes = useJobTrackerStore((s) => s.updateTopicNotes);
  const incrementRevision = useJobTrackerStore((s) => s.incrementRevision);
  const setTopicDifficulty = useJobTrackerStore((s) => s.setTopicDifficulty);

  // Active accordion state
  const [expandedCat, setExpandedCat] = useState<string | null>(prepCategories[0]?.id || null);
  // Edit notes state
  const [activeEditingTopic, setActiveEditingTopic] = useState<{ catId: string; topicId: string } | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  // Add Category (Module) Form State
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Add Topic (Subtopic) Inline Form State (indexed by Category ID)
  const [newTopicNames, setNewTopicNames] = useState<Record<string, string>>({});
  const [newTopicDifficulties, setNewTopicDifficulties] = useState<Record<string, "Easy" | "Medium" | "Hard">>({});

  const toggleCategory = (id: string) => {
    setExpandedCat(expandedCat === id ? null : id);
  };

  const startEditingNotes = (catId: string, topic: PrepTopic) => {
    setActiveEditingTopic({ catId, topicId: topic.id });
    setTempNotes(topic.notes);
  };

  const handleSaveNotes = () => {
    if (!activeEditingTopic) return;
    updateTopicNotes(activeEditingTopic.catId, activeEditingTopic.topicId, tempNotes);
    setActiveEditingTopic(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addPrepCategory(newCategoryName.trim());
    setNewCategoryName("");
    setAddCategoryOpen(false);
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" study module and all its topics?`)) {
      deletePrepCategory(catId);
      if (expandedCat === catId) {
        setExpandedCat(null);
      }
    }
  };

  const handleAddTopicSubmit = (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    const topicName = newTopicNames[catId] || "";
    if (!topicName.trim()) return;
    const diff = newTopicDifficulties[catId] || "Medium";
    
    addPrepTopic(catId, topicName.trim(), diff);
    
    // Reset values
    setNewTopicNames((prev) => ({ ...prev, [catId]: "" }));
    setNewTopicDifficulties((prev) => ({ ...prev, [catId]: "Medium" }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            Interview Preparation
          </h1>
          <p className="text-xs text-content-muted mt-1">Review specific topics, count revisions, and log study notes</p>
        </div>
      </section>

      {/* Add Module Block */}
      <div className="animate-fade-in-up">
        {addCategoryOpen ? (
          <form onSubmit={handleAddCategory} className="surface-card p-5 space-y-3 border border-accent/40 animate-pop-in">
            <h3 className="text-sm font-bold text-content">Create New Study Module</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Module Name (e.g., GraphQL or System Design)"
                className="flex-1 bg-surface-2 border border-border-app/80 rounded-xl px-4 py-2 text-sm outline-none focus:border-accent text-content"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-accent text-accent-fg px-4 py-2 text-sm font-bold hover:bg-accent/95 cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setAddCategoryOpen(false)}
                  className="rounded-xl bg-surface-3 hover:bg-surface-3/80 text-content-2 px-4 py-2 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddCategoryOpen(true)}
            className="w-full border border-dashed border-border-app/80 hover:border-accent/40 hover:bg-accent/5 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-content-muted hover:text-accent transition duration-200 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add New Study Module
          </button>
        )}
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        {prepCategories.map((category) => {
          const completedCount = category.topics ? category.topics.filter((t) => t.completed).length : 0;
          const totalCount = category.topics ? category.topics.length : 0;
          const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
          const isExpanded = expandedCat === category.id;

          return (
            <div key={category.id} className="surface-card overflow-hidden transition-all duration-200">
              {/* Category trigger block */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 text-left bg-surface-2/40 hover:bg-surface-2 transition border-b border-border-app/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <h2 className="text-base font-extrabold text-content">{category.name}</h2>
                    <p className="text-[10px] text-content-muted font-bold uppercase tracking-wider mt-0.5">
                      {completedCount} of {totalCount} topics completed ({percent}%)
                    </p>
                  </div>
                </div>

                {/* Progress Indicators & Action Buttons */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="h-2 w-32 bg-surface-3 rounded-full overflow-hidden hidden md:block">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id, category.name);
                    }}
                    className="p-1.5 rounded hover:bg-surface-3 text-content-subtle hover:text-rose-500 transition cursor-pointer"
                    title="Delete Module"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-content-muted" /> : <ChevronDown className="h-5 w-5 text-content-muted" />}
                </div>
              </button>

              {/* Topics nested details */}
              {isExpanded && (
                <div className="p-4 space-y-4 bg-surface/30">
                  <div className="divide-y divide-border-app/40 space-y-4">
                    {category.topics && category.topics.length > 0 ? (
                      category.topics.map((topic) => {
                        const isNotesEditing =
                          activeEditingTopic?.catId === category.id &&
                          activeEditingTopic?.topicId === topic.id;

                        return (
                          <div key={topic.id} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              {/* Checked checkbox */}
                              <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={topic.completed}
                                  onChange={() => toggleTopic(category.id, topic.id)}
                                  className="mt-0.5 h-4.5 w-4.5 rounded border-border-app text-accent focus:ring-accent"
                                />
                                <div>
                                  <p className={`text-sm font-bold ${topic.completed ? "line-through text-content-muted" : "text-content"}`}>
                                    {topic.name}
                                  </p>
                                  <div className="flex flex-wrap gap-2 items-center mt-1.5">
                                    {/* Difficulty selection */}
                                    <select
                                      value={topic.difficulty}
                                      onChange={(e) =>
                                        setTopicDifficulty(
                                          category.id,
                                          topic.id,
                                          e.target.value as "Easy" | "Medium" | "Hard"
                                        )
                                      }
                                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border outline-none cursor-pointer ${
                                        topic.difficulty === "Easy"
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                          : topic.difficulty === "Medium"
                                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                                          : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                      }`}
                                    >
                                      <option value="Easy">Easy</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Hard">Hard</option>
                                    </select>

                                    {/* Revision count pill */}
                                    <span className="rounded bg-surface-3 border border-border-app px-2 py-0.5 text-[9px] font-extrabold text-content-muted">
                                      Revisions: {topic.revisionCount}
                                    </span>
                                  </div>
                                </div>
                              </label>

                              {/* Quick topic actions */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  onClick={() => incrementRevision(category.id, topic.id)}
                                  className="flex items-center gap-1.5 rounded-lg border border-border-app bg-surface px-2.5 py-1.5 text-[10px] font-extrabold text-content-2 hover:bg-surface-2 cursor-pointer"
                                >
                                  <RefreshCcw className="h-3 w-3" />
                                  Revision
                                </button>
                                <button
                                  onClick={() => {
                                    if (isNotesEditing) {
                                      handleSaveNotes();
                                    } else {
                                      startEditingNotes(category.id, topic);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 px-2.5 py-1.5 text-[10px] font-extrabold text-accent cursor-pointer"
                                >
                                  {isNotesEditing ? <Save className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                  {isNotesEditing ? "Save Notes" : "Write Notes"}
                                </button>
                              </div>
                            </div>

                            {/* Note editing area / display */}
                            {isNotesEditing ? (
                              <div className="rounded-xl border border-accent bg-surface p-3 space-y-2">
                                <textarea
                                  rows={3}
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  placeholder="Add summary notes, equations, tips, code snippets..."
                                  className="w-full bg-transparent text-sm text-content outline-none resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setActiveEditingTopic(null)}
                                    className="rounded bg-surface-3 hover:bg-surface-3/85 px-3 py-1 text-[10px] font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveNotes}
                                    className="rounded bg-accent text-accent-fg px-3 py-1 text-[10px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              topic.notes && (
                                <div className="rounded-xl border border-border-app/40 bg-surface-2/40 p-3 text-xs text-content-2 leading-relaxed whitespace-pre-line">
                                  {topic.notes}
                                </div>
                              )
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-content-muted py-2">No topics added in this module yet.</p>
                    )}
                  </div>

                  {/* Inline Form to Add a Topic */}
                  <form onSubmit={(e) => handleAddTopicSubmit(e, category.id)} className="pt-4 border-t border-border-app/40 flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={newTopicNames[category.id] || ""}
                      onChange={(e) => setNewTopicNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                      placeholder="Add subtopic (e.g. Redux Toolkit or closures)"
                      className="w-full sm:flex-1 bg-surface-2 border border-border-app/80 rounded-xl px-3 py-2 text-xs outline-none focus:border-accent text-content"
                    />
                    <div className="w-full sm:w-auto flex gap-2">
                      <select
                        value={newTopicDifficulties[category.id] || "Medium"}
                        onChange={(e) => setNewTopicDifficulties(prev => ({ ...prev, [category.id]: e.target.value as any }))}
                        className="flex-1 sm:flex-initial bg-surface-2 border border-border-app/80 rounded-xl px-3 py-2 text-xs outline-none text-content font-bold cursor-pointer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-xl bg-accent text-accent-fg px-4 py-2 text-xs font-bold flex items-center justify-center gap-1 hover:bg-accent/90 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Topic
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
