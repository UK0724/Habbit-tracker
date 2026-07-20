import { useState } from "react";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { WishlistCompany } from "../types";
import {
  Building2,
  Plus,
  Star,
  ExternalLink,
  Users,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  ArrowUpRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WishlistCompanySchema } from "../types";

export const WishlistPage = () => {
  const wishlist = useJobTrackerStore((s) => s.wishlist);
  const addWishlistCompany = useJobTrackerStore((s) => s.addWishlistCompany);
  const updateWishlistCompany = useJobTrackerStore((s) => s.updateWishlistCompany);
  const deleteWishlistCompany = useJobTrackerStore((s) => s.deleteWishlistCompany);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<WishlistCompany | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(WishlistCompanySchema),
    defaultValues: {
      name: "",
      careerPage: "",
      priority: "Medium",
      dreamCompany: false,
      referralAvailable: false,
      lastAppliedDate: ""
    }
  });

  const openAddModal = () => {
    setEditingCompany(null);
    reset({
      name: "",
      careerPage: "",
      priority: "Medium",
      dreamCompany: false,
      referralAvailable: false,
      lastAppliedDate: ""
    });
    setFormOpen(true);
  };

  const openEditModal = (company: WishlistCompany) => {
    setEditingCompany(company);
    reset({
      name: company.name,
      careerPage: company.careerPage || "",
      priority: company.priority,
      dreamCompany: company.dreamCompany,
      referralAvailable: company.referralAvailable,
      lastAppliedDate: company.lastAppliedDate || ""
    });
    setFormOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingCompany) {
      updateWishlistCompany({ ...data, id: editingCompany.id });
    } else {
      addWishlistCompany(data);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <Building2 className="h-6 w-6 text-accent" />
            Company Wishlist
          </h1>
          <p className="text-xs text-content-muted mt-1">Bookmark and track your dream tech employers</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </section>

      {/* Grid List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {wishlist.map((company) => (
          <div
            key={company.id}
            className="surface-card p-5 flex flex-col justify-between border border-border-app hover:scale-[1.02] hover:border-accent/30 transition-all duration-200"
          >
            <div>
              {/* Top title & priority */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-1.5">
                    {company.name}
                    {company.dreamCompany && (
                      <Star className="h-4.5 w-4.5 fill-amber-500 text-amber-500 animate-pulse shrink-0" />
                    )}
                  </h3>
                  <span
                    className={`inline-block rounded mt-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                      company.priority === "High"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                        : company.priority === "Medium"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                        : "bg-surface-3 border-border-app text-content-muted"
                    }`}
                  >
                    {company.priority} Priority
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-1 text-content-subtle hover:text-accent rounded hover:bg-surface-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteWishlistCompany(company.id)}
                    className="p-1 text-content-subtle hover:text-rose-500 rounded hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges details */}
              <div className="mt-4 space-y-2 border-t border-border-app/40 pt-3 text-xs font-semibold text-content-2">
                <div className="flex items-center justify-between">
                  <span className="text-content-muted flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-content-subtle" /> Referral Available:
                  </span>
                  <span>{company.referralAvailable ? "✅ Yes" : "❌ No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-muted">Last Applied:</span>
                  <span className="text-content">
                    {company.lastAppliedDate ? company.lastAppliedDate : "Not applied yet"}
                  </span>
                </div>
              </div>
            </div>

            {/* Link footer */}
            <div className="mt-4 pt-3 border-t border-border-app/40 flex justify-end">
              {company.careerPage ? (
                <a
                  href={company.careerPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1.5"
                >
                  Go to Careers Page
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-xs text-content-subtle italic">No career link.</span>
              )}
            </div>
          </div>
        ))}
        {wishlist.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4 py-12 text-center text-sm text-content-muted border border-dashed rounded-2xl font-bold">
            No companies added to wishlist.
          </div>
        )}
      </div>

      {/* Dialog Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">
                {editingCompany ? "Edit Company" : "New Wishlist Company"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 transition text-content-muted hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="field-label">Company Name *</label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Atlassian"
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{String(errors.name.message || "")}</p>}
              </div>

              <div>
                <label className="field-label">Careers Page URL</label>
                <input
                  type="text"
                  {...register("careerPage")}
                  placeholder="https://atlassian.com/careers"
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.careerPage && (
                  <p className="text-xs text-rose-500 mt-1">{String(errors.careerPage.message || "")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Priority *</label>
                  <select
                    {...register("priority")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Last Applied Date</label>
                  <input
                    type="date"
                    {...register("lastAppliedDate")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 select-none">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("dreamCompany")}
                    className="h-4.5 w-4.5 rounded border-border-app text-accent focus:ring-accent"
                  />
                  <span>Mark as Dream Company ⭐</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    {...register("referralAvailable")}
                    className="h-4.5 w-4.5 rounded border-border-app text-accent focus:ring-accent"
                  />
                  <span>Referrer Available in network 👥</span>
                </label>
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
                  {editingCompany ? "Save Changes" : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
