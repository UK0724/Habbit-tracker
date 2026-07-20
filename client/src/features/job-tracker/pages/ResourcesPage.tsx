import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { ResourceBookmark } from "../types";
import {
  Compass,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Video,
  Code2,
  FileText,
  X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResourceBookmarkSchema } from "../types";

export const ResourcesPage = () => {
  const resources = useJobTrackerStore((s) => s.resources);
  const addResource = useJobTrackerStore((s) => s.addResource);
  const deleteResource = useJobTrackerStore((s) => s.deleteResource);

  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<Omit<ResourceBookmark, "id">>({
    resolver: zodResolver(ResourceBookmarkSchema),
    defaultValues: {
      title: "",
      url: "",
      category: "Job Links"
    }
  });

  const onSubmit = (data: Omit<ResourceBookmark, "id">) => {
    addResource(data);
    setFormOpen(false);
    reset();
  };

  const categories = ["Job Links", "Leetcode", "Frontend", "Videos", "Articles"];

  const filteredResources = resources.filter((res) => {
    if (activeTab === "all") return true;
    return res.category === activeTab;
  });

  const getIcon = (cat: string) => {
    switch (cat) {
      case "Leetcode":
        return Code2;
      case "Videos":
        return Video;
      case "Articles":
        return FileText;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <Compass className="h-6 w-6 text-accent" />
            Study Resources &amp; Bookmarks
          </h1>
          <p className="text-xs text-content-muted mt-1">Save helpful links, practice websites, and articles for quick access</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          Add Bookmark
        </button>
      </section>

      {/* Tabs */}
      <section className="flex gap-2 border-b border-border-app/40 pb-2 overflow-x-auto scrollbar-thin text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeTab === "all" ? "bg-accent/14 text-accent" : "text-content-muted hover:text-content"
          }`}
        >
          All Resources ({resources.length})
        </button>
        {categories.map((cat) => {
          const count = resources.filter((r) => r.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                activeTab === cat ? "bg-accent/14 text-accent" : "text-content-muted hover:text-content"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </section>

      {/* Bookmarks Grid List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((res) => {
          const Icon = getIcon(res.category);
          return (
            <div
              key={res.id}
              className="surface-card p-4 flex items-start justify-between gap-3 border border-border-app hover:border-accent/30 hover:scale-[1.01] transition-all"
            >
              <div className="flex gap-3 min-w-0">
                <span className="rounded-xl bg-accent/10 border border-accent/20 p-2.5 text-accent shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-content truncate leading-snug">{res.title}</h3>
                  <span className="inline-block text-[9px] font-extrabold uppercase text-content-subtle mt-1 tracking-wider bg-surface-2 border px-1.5 py-0.5 rounded">
                    {res.category}
                  </span>
                  
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 mt-3.5"
                  >
                    Go to Resource
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => deleteResource(res.id)}
                className="p-1 hover:text-rose-500 rounded text-content-subtle shrink-0"
                title="Delete Bookmark"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {filteredResources.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-sm text-content-muted border border-dashed rounded-2xl font-bold">
            No bookmarks saved in this category.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">New Bookmark</h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 text-content-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="field-label">Resource Title *</label>
                <input
                  type="text"
                  {...register("title")}
                  placeholder="Leetcode Top interview questions"
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="field-label">URL Link *</label>
                <input
                  type="text"
                  {...register("url")}
                  placeholder="https://leetcode.com/..."
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.url && <p className="text-xs text-rose-500 mt-1">{errors.url.message}</p>}
              </div>

              <div>
                <label className="field-label">Category *</label>
                <select
                  {...register("category")}
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-app">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-border-app bg-surface px-4 py-2.5 text-xs font-bold text-content-2 hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
