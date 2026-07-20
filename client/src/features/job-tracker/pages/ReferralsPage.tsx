import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { Referral } from "../types";
import {
  Users,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  ArrowRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReferralSchema } from "../types";

export const ReferralsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const referrals = useJobTrackerStore((s) => s.referrals);
  const addReferral = useJobTrackerStore((s) => s.addReferral);
  const updateReferral = useJobTrackerStore((s) => s.updateReferral);
  const deleteReferral = useJobTrackerStore((s) => s.deleteReferral);

  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);

  // Detect query param trigger (e.g. from command palette)
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingReferral(null);
      setFormOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(ReferralSchema),
    defaultValues: {
      company: "",
      personName: "",
      linkedin: "",
      dateSent: new Date().toISOString().split("T")[0] || "",
      replied: false,
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "", // default 5 days later
      notes: ""
    }
  });

  const openAddModal = () => {
    setEditingReferral(null);
    reset({
      company: "",
      personName: "",
      linkedin: "",
      dateSent: new Date().toISOString().split("T")[0] || "",
      replied: false,
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "",
      notes: ""
    });
    setFormOpen(true);
  };

  const openEditModal = (ref: Referral) => {
    setEditingReferral(ref);
    reset({
      company: ref.company,
      personName: ref.personName,
      linkedin: ref.linkedin || "",
      dateSent: ref.dateSent,
      replied: ref.replied,
      followUpDate: ref.followUpDate,
      notes: ref.notes || ""
    });
    setFormOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingReferral) {
      updateReferral({ ...data, id: editingReferral.id });
    } else {
      addReferral(data);
    }
    setFormOpen(false);
  };

  const handleToggleReplied = (ref: Referral) => {
    updateReferral({
      ...ref,
      replied: !ref.replied
    });
  };

  const todayStr = new Date().toISOString().split("T")[0] || "";

  const filteredReferrals = referrals.filter((ref) => {
    return (
      ref.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.personName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Referral Tracker
          </h1>
          <p className="text-xs text-content-muted mt-1">Track pending referrers, follow-up timelines, and outcomes</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          Request Referral
        </button>
      </section>

      {/* Toolbar */}
      <section className="surface-card p-4 flex gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Search company or person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border-app bg-surface-2/40 py-2.5 pl-10 pr-4 text-sm text-content outline-none focus:border-accent"
          />
        </div>
      </section>

      {/* Table grid */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border-app text-xs font-extrabold text-content-muted uppercase tracking-wider">
                <th className="p-4">Replied</th>
                <th className="p-4">Company</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">LinkedIn</th>
                <th className="p-4">Date Sent</th>
                <th className="p-4">Follow-up Date</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-app">
              {filteredReferrals.map((ref) => {
                const isOverdue = !ref.replied && ref.followUpDate <= todayStr;
                return (
                  <tr
                    key={ref.id}
                    className={`hover:bg-surface-2/40 text-sm font-semibold transition ${
                      isOverdue ? "bg-rose-500/5 text-rose-500/90" : ""
                    }`}
                  >
                    <td className="p-4 w-12">
                      <button
                        onClick={() => handleToggleReplied(ref)}
                        className={`rounded-lg p-1.5 transition ${
                          ref.replied
                            ? "text-emerald-500 hover:text-emerald-600"
                            : "text-content-muted hover:text-accent"
                        }`}
                        title={ref.replied ? "Mark as Pending" : "Mark as Replied"}
                      >
                        {ref.replied ? (
                          <CheckCircle className="h-5 w-5 fill-emerald-500/20" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-content-subtle hover:border-accent" />
                        )}
                      </button>
                    </td>
                    <td className="p-4 font-extrabold">{ref.company}</td>
                    <td className="p-4 text-content">{ref.personName}</td>
                    <td className="p-4">
                      {ref.linkedin ? (
                        <a
                          href={ref.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-hover inline-flex items-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                            <rect x="2" y="9" width="4" height="12" />
                            <circle cx="4" cy="4" r="2" />
                          </svg>
                          <span className="text-xs">Profile</span>
                        </a>
                      ) : (
                        <span className="text-content-subtle">—</span>
                      )}
                    </td>
                    <td className="p-4 text-content-muted">{ref.dateSent}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-content-muted" />
                        <span>{ref.followUpDate}</span>
                        {isOverdue && (
                          <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500 flex items-center gap-0.5 shadow-sm">
                            <AlertTriangle className="h-3 w-3" /> Due
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-content-2 text-xs max-w-xs truncate" title={ref.notes}>
                      {ref.notes || <span className="text-content-subtle">No notes.</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ref)}
                          className="rounded-lg p-1.5 hover:bg-surface-3 hover:text-accent"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteReferral(ref.id)}
                          className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredReferrals.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-content-muted font-bold">
                    No referral requests tracked.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog: Add/Edit Referral Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">
                {editingReferral ? "Edit Referral" : "New Referral Request"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 transition text-content-muted hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Company */}
                <div>
                  <label className="field-label">Company *</label>
                  <input
                    type="text"
                    {...register("company")}
                    placeholder="Google"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.company && (
                    <p className="text-xs text-rose-500 mt-1">{String(errors.company.message || "")}</p>
                  )}
                </div>

                {/* Person Name */}
                <div>
                  <label className="field-label">Person Name *</label>
                  <input
                    type="text"
                    {...register("personName")}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.personName && (
                    <p className="text-xs text-rose-500 mt-1">{String(errors.personName.message || "")}</p>
                  )}
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <label className="field-label">LinkedIn Profile URL</label>
                <input
                  type="text"
                  {...register("linkedin")}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.linkedin && (
                  <p className="text-xs text-rose-500 mt-1">{String(errors.linkedin.message || "")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date Sent */}
                <div>
                  <label className="field-label">Date Sent *</label>
                  <input
                    type="date"
                    {...register("dateSent")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="field-label">Follow-up Date *</label>
                  <input
                    type="date"
                    {...register("followUpDate")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.followUpDate && (
                    <p className="text-xs text-rose-500 mt-1">{String(errors.followUpDate.message || "")}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="field-label">Outreach Notes / Details</label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Draft messages, relationship description, reply timeline..."
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              {/* Submit Buttons */}
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
                  {editingReferral ? "Save Changes" : "Record Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
