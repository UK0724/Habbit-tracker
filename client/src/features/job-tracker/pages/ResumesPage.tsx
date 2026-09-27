import { z } from "zod";
import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { ResumeVersion } from "../types";
import {
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  Edit2,
  Trash2,
  X,
  Target
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResumeVersionSchema } from "../types";

export const ResumesPage = () => {
  const resumes = useJobTrackerStore((s) => s.resumes);
  const addResumeVersion = useJobTrackerStore((s) => s.addResumeVersion);
  const updateResumeVersion = useJobTrackerStore((s) => s.updateResumeVersion);
  const deleteResumeVersion = useJobTrackerStore((s) => s.deleteResumeVersion);

  const [formOpen, setFormOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<ResumeVersion | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<
    z.input<typeof ResumeVersionSchema>,
    unknown,
    z.output<typeof ResumeVersionSchema>
  >({
    resolver: zodResolver(ResumeVersionSchema),
    defaultValues: {
      name: "",
      fileUrl: "",
      dateCreated: new Date().toISOString().split("T")[0] || "",
      usageCount: 0,
      successCount: 0
    }
  });

  const openAddModal = () => {
    setEditingResume(null);
    reset({
      name: "",
      fileUrl: "",
      dateCreated: new Date().toISOString().split("T")[0] || "",
      usageCount: 0,
      successCount: 0
    });
    setFormOpen(true);
  };

  const openEditModal = (resume: ResumeVersion) => {
    setEditingResume(resume);
    reset({
      name: resume.name,
      fileUrl: resume.fileUrl || "",
      dateCreated: resume.dateCreated,
      usageCount: resume.usageCount,
      successCount: resume.successCount
    });
    setFormOpen(true);
  };

  const onSubmit = (data: z.output<typeof ResumeVersionSchema>) => {
    if (editingResume) {
      updateResumeVersion({ ...data, id: editingResume.id });
    } else {
      addResumeVersion(data);
    }
    setFormOpen(false);
  };

  const handleIncrementUsage = (resume: ResumeVersion) => {
    updateResumeVersion({
      ...resume,
      usageCount: resume.usageCount + 1
    });
  };

  const handleIncrementSuccess = (resume: ResumeVersion) => {
    updateResumeVersion({
      ...resume,
      // Cap success count under usage count
      successCount: Math.min(resume.usageCount, resume.successCount + 1)
    });
  };

  const handleDecrementUsage = (resume: ResumeVersion) => {
    updateResumeVersion({
      ...resume,
      usageCount: Math.max(0, resume.usageCount - 1),
      successCount: Math.min(
        Math.max(0, resume.usageCount - 1),
        resume.successCount
      )
    });
  };

  const handleDecrementSuccess = (resume: ResumeVersion) => {
    updateResumeVersion({
      ...resume,
      successCount: Math.max(0, resume.successCount - 1)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-accent" />
            Resume Manager
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Track specific resume drafts and measure their callback success
            rates
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          Add Version
        </button>
      </section>

      {/* Grid view */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {resumes.map((resume) => {
          const successRate =
            resume.usageCount === 0
              ? 0
              : Math.round((resume.successCount / resume.usageCount) * 100);

          return (
            <div
              key={resume.id}
              className="surface-card p-5 flex flex-col justify-between border border-border-app hover:border-accent/30 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-border-app/40 pb-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-content truncate max-w-[130px]">
                      {resume.name}
                    </h3>
                    <p className="text-[10px] text-content-muted mt-1 font-semibold">
                      Created: {resume.dateCreated}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(resume)}
                      className="p-1 hover:text-accent rounded hover:bg-surface-2 text-content-subtle"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteResumeVersion(resume.id)}
                      className="p-1 hover:text-rose-500 rounded hover:bg-rose-500/10 text-content-subtle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-accent/10 border border-accent/20 p-2.5">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                      Callback Rate
                    </p>
                    <p className="text-xl font-extrabold text-accent">
                      {successRate}%
                    </p>
                  </div>
                </div>

                {/* Tracking numbers */}
                <div className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-content-2">
                    <span className="text-content-muted">
                      Applications Sent:
                    </span>
                    <div className="flex items-center gap-1.5 font-extrabold text-content">
                      <button
                        onClick={() => handleDecrementUsage(resume)}
                        className="rounded bg-surface-2 border px-1.5 py-0.5 hover:bg-surface-3"
                      >
                        -
                      </button>
                      <span>{resume.usageCount}</span>
                      <button
                        onClick={() => handleIncrementUsage(resume)}
                        className="rounded bg-surface-2 border px-1.5 py-0.5 hover:bg-surface-3"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-content-2">
                    <span className="text-content-muted">
                      Interviews / Hits:
                    </span>
                    <div className="flex items-center gap-1.5 font-extrabold text-content">
                      <button
                        onClick={() => handleDecrementSuccess(resume)}
                        className="rounded bg-surface-2 border px-1.5 py-0.5 hover:bg-surface-3"
                      >
                        -
                      </button>
                      <span>{resume.successCount}</span>
                      <button
                        onClick={() => handleIncrementSuccess(resume)}
                        className="rounded bg-surface-2 border px-1.5 py-0.5 hover:bg-surface-3"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {resume.fileUrl && (
                <div className="mt-4 pt-3 border-t border-border-app/40 text-right">
                  <a
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
                  >
                    View File Link
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
        {resumes.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4 py-12 text-center text-sm text-content-muted border border-dashed rounded-2xl font-bold">
            No resume versions logged.
          </div>
        )}
      </div>

      {/* Dialog Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">
                {editingResume ? "Edit Resume Details" : "New Resume Version"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 text-content-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="field-label">Version Name *</label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="React Resume (v2)"
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">
                    {String(errors.name.message || "")}
                  </p>
                )}
              </div>

              <div>
                <label className="field-label">File Link / Drive URL</label>
                <input
                  type="text"
                  {...register("fileUrl")}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Usage Count</label>
                  <input
                    type="number"
                    {...register("usageCount", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  />
                </div>

                <div>
                  <label className="field-label">Success Hits</label>
                  <input
                    type="number"
                    {...register("successCount", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Created Date *</label>
                <input
                  type="date"
                  {...register("dateCreated")}
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                />
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
                  {editingResume ? "Save Changes" : "Log Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
