import { useCallback } from "react";
import { useDialog } from "../../../shared/hooks/useDialog";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import {
  JobApplication,
  ApplicationStatus,
  APPLICATION_STATUSES
} from "../types";
import {
  Briefcase,
  Search,
  Plus,
  Copy,
  Edit2,
  Trash2,
  List,
  Kanban,
  FileSpreadsheet,
  Upload,
  ArrowUpDown,
  X,
  ExternalLink
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobApplicationSchema } from "../types";

export const ApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const applications = useJobTrackerStore((s) => s.applications);
  const addApplication = useJobTrackerStore((s) => s.addApplication);
  const updateApplication = useJobTrackerStore((s) => s.updateApplication);
  const deleteApplication = useJobTrackerStore((s) => s.deleteApplication);
  const duplicateApplication = useJobTrackerStore(
    (s) => s.duplicateApplication
  );
  const resumes = useJobTrackerStore((s) => s.resumes);

  // Layout View: kanban or list
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [sortField, setSortField] =
    useState<keyof JobApplication>("appliedDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  const closeForm = useCallback(() => setFormOpen(false), []);
  useDialog(formOpen, closeForm, "[data-application-dialog]");
  // Drag and Drop active tracking
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Detect query param trigger (e.g. from command palette)
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingApp(null);
      setFormOpen(true);
      // Clear parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<Omit<JobApplication, "id">>({
    resolver: zodResolver(JobApplicationSchema),
    defaultValues: {
      company: "",
      role: "",
      techStack: [],
      jobUrl: "",
      salary: "",
      location: "",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Wishlist",
      notes: "",
      resumeVersionUsed: ""
    }
  });

  const openAddModal = () => {
    setEditingApp(null);
    reset({
      company: "",
      role: "",
      techStack: [],
      jobUrl: "",
      salary: "",
      location: "",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Wishlist",
      notes: "",
      resumeVersionUsed: ""
    });
    setFormOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    reset({
      company: app.company,
      role: app.role,
      techStack: app.techStack,
      jobUrl: app.jobUrl || "",
      salary: app.salary || "",
      location: app.location,
      appliedDate: app.appliedDate,
      status: app.status,
      followUpDate: app.followUpDate || "",
      notes: app.notes || "",
      resumeVersionUsed: app.resumeVersionUsed || ""
    });
    setFormOpen(true);
  };

  const onSubmit = (data: Omit<JobApplication, "id">) => {
    if (editingApp) {
      updateApplication({ ...data, id: editingApp.id });
    } else {
      addApplication(data);
    }
    setFormOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (!id) return;

    const app = applications.find((a) => a.id === id);
    if (app && app.status !== status) {
      updateApplication({ ...app, status });
    }
    setDraggedAppId(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Company",
      "Role",
      "Tech Stack",
      "Job URL",
      "Salary",
      "Location",
      "Applied Date",
      "Status",
      "Notes"
    ];
    const rows = applications.map((app) => [
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.role.replace(/"/g, '""')}"`,
      `"${app.techStack.join(", ")}"`,
      `"${(app.jobUrl || "").replace(/"/g, '""')}"`,
      `"${(app.salary || "").replace(/"/g, '""')}"`,
      `"${app.location.replace(/"/g, '""')}"`,
      app.appliedDate,
      app.status,
      `"${(app.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `job_applications_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        // simple parsing of csv line (splitting by commas, ignoring quotes for simplistic load)
        const parts =
          line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const cleanParts = parts.map((p) => p.replace(/^"|"$/g, "").trim());

        if (cleanParts.length >= 7) {
          const company = cleanParts[0] || "Unknown Company";
          const role = cleanParts[1] || "Software Engineer";
          const techStack = cleanParts[2]
            ? cleanParts[2].split(";").map((t) => t.trim())
            : ["React"];
          const jobUrl = cleanParts[3] || "";
          const salary = cleanParts[4] || "";
          const location = cleanParts[5] || "Remote";
          const appliedDate =
            cleanParts[6] || new Date().toISOString().split("T")[0] || "";
          const status = (cleanParts[7] as ApplicationStatus) || "Wishlist";
          const notes = cleanParts[8] || "";

          addApplication({
            company,
            role,
            techStack,
            jobUrl,
            salary,
            location,
            appliedDate,
            status: APPLICATION_STATUSES.includes(status) ? status : "Wishlist",
            notes,
            resumeVersionUsed: ""
          });
        }
      }
    };
    reader.readAsText(file);
  };

  // Filtering & Sorting Logic
  const filteredApps = applications
    .filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      const matchesLocation =
        !locationFilter ||
        app.location.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesTech =
        !techFilter ||
        app.techStack.some((t) =>
          t.toLowerCase().includes(techFilter.toLowerCase())
        );

      return matchesSearch && matchesStatus && matchesLocation && matchesTech;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (!aVal) return 1;
      if (!bVal) return -1;

      const order = sortOrder === "asc" ? 1 : -1;
      return aVal > bVal ? order : -order;
    });

  const toggleSort = (field: keyof JobApplication) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-app/40 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-accent" />
            Job Applications
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Manage and track your active job pipelines
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import/Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-border-app bg-surface px-3.5 py-2 text-xs font-bold text-content-2 hover:bg-surface-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>

          <label className="flex items-center gap-1.5 rounded-xl border border-border-app bg-surface px-3.5 py-2 text-xs font-bold text-content-2 hover:bg-surface-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-fg hover:bg-accent-hover shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Application
          </button>
        </div>
      </section>

      {/* Filters Toolbar */}
      <section className="surface-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border-app bg-surface-2/40 py-2.5 pl-10 pr-4 text-sm text-content outline-none focus:border-accent"
          />
        </div>

        {/* Filters and Views */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border-app bg-surface p-2.5 text-xs font-bold text-content-2 outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Tech stack filter input */}
          <input
            type="text"
            placeholder="Tech (e.g. React)"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="rounded-xl border border-border-app bg-surface p-2.5 text-xs font-bold text-content-2 outline-none w-28 focus:border-accent"
          />

          {/* Location filter */}
          <input
            type="text"
            placeholder="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-xl border border-border-app bg-surface p-2.5 text-xs font-bold text-content-2 outline-none w-28 focus:border-accent"
          />

          {/* View Toggles */}
          <div className="flex rounded-xl border border-border-app bg-surface p-1.5 shrink-0">
            <button
              onClick={() => setView("kanban")}
              className={`rounded-lg p-1.5 transition ${
                view === "kanban"
                  ? "bg-accent text-accent-fg"
                  : "text-content-muted hover:text-content"
              }`}
              title="Kanban Board"
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-lg p-1.5 transition ${
                view === "list"
                  ? "bg-accent text-accent-fg"
                  : "text-content-muted hover:text-content"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout Rendering */}
      {view === "kanban" ? (
        /* Kanban Board rendering */
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin max-h-[70vh]">
          {APPLICATION_STATUSES.map((status) => {
            const statusApps = filteredApps.filter(
              (app) => app.status === status
            );
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="w-72 shrink-0 flex flex-col gap-3 rounded-2xl bg-surface-2/40 border border-border-app/40 p-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1.5">
                  <span className="text-xs font-extrabold text-content">
                    {status}
                  </span>
                  <span className="rounded-full bg-surface-3 border border-border-app/60 px-2 py-0.5 text-[10px] font-bold text-content-muted">
                    {statusApps.length}
                  </span>
                </div>

                {/* Column cards container */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[55vh]">
                  {statusApps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="surface-card p-4 hover:border-accent/40 active:cursor-grabbing transition cursor-grab border border-border-app bg-surface relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-sm tracking-tight text-content">
                            {app.company}
                          </p>
                          <p className="text-xs font-bold text-content-2 mt-0.5">
                            {app.role}
                          </p>
                        </div>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-content-muted hover:text-accent"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Tech badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {app.techStack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="rounded bg-surface-2 border border-border-app px-1.5 py-0.5 text-[9px] font-bold text-content-muted"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Detail row */}
                      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-content-muted">
                        <span>{app.location}</span>
                        <span>{app.appliedDate}</span>
                      </div>

                      {/* Actions hover bar */}
                      <div className="mt-3 pt-2.5 border-t border-border-app/40 flex justify-end gap-2">
                        <button
                          onClick={() => duplicateApplication(app.id)}
                          title="Duplicate"
                          className="p-1 hover:text-accent hover:bg-surface-2 rounded"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          title="Edit"
                          className="p-1 hover:text-accent hover:bg-surface-2 rounded"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          title="Delete"
                          className="p-1 hover:text-rose-500 hover:bg-rose-500/10 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {statusApps.length === 0 && (
                    <div className="border border-dashed border-border-app/40 rounded-xl py-8 text-center text-[10px] text-content-muted">
                      Drag here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table List rendering */
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-2 border-b border-border-app text-xs font-extrabold text-content-muted uppercase tracking-wider">
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => toggleSort("company")}
                  >
                    Company <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => toggleSort("role")}
                  >
                    Role <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                  </th>
                  <th className="p-4">Tech Stack</th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => toggleSort("location")}
                  >
                    Location <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => toggleSort("appliedDate")}
                  >
                    Applied <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => toggleSort("status")}
                  >
                    Status <ArrowUpDown className="inline h-3.5 w-3.5 ml-1" />
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-app">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-surface-2/40 text-sm font-semibold"
                  >
                    <td className="p-4 font-bold">{app.company}</td>
                    <td className="p-4 text-content-2">{app.role}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {app.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded bg-surface-2 border border-border-app px-1.5 py-0.5 text-[10px] font-bold text-content-muted"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-content-muted">{app.location}</td>
                    <td className="p-4 text-content-muted">
                      {app.appliedDate}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs text-accent">
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => duplicateApplication(app.id)}
                          className="rounded-lg p-1.5 hover:bg-surface-3 hover:text-accent"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          className="rounded-lg p-1.5 hover:bg-surface-3 hover:text-accent"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-content-muted font-bold"
                    >
                      No applications found matching search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog: Add/Edit Application Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden border border-border-app bg-surface shadow-panel rounded-2xl animate-pop-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
              <h3 className="font-display text-lg font-bold text-content">
                {editingApp ? "Edit Application" : "New Job Application"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 transition text-content-muted hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              data-application-dialog
              role="dialog"
              aria-modal="true"
              aria-label="Job application"
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Company */}
                <div>
                  <label className="field-label">Company Name *</label>
                  <input
                    type="text"
                    {...register("company")}
                    placeholder="Google"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.company && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.company.message}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="field-label">Job Role *</label>
                  <input
                    type="text"
                    {...register("role")}
                    placeholder="Senior UI Engineer"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.role && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Tech stack */}
              <div>
                <label className="field-label">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, CSS"
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    setValue("techStack", tags);
                  }}
                  defaultValue={editingApp?.techStack.join(", ")}
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                {errors.techStack && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.techStack.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="field-label">Location *</label>
                  <input
                    type="text"
                    {...register("location")}
                    placeholder="Bengaluru (Hybrid)"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.location && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                {/* Salary */}
                <div>
                  <label className="field-label">Salary Package</label>
                  <input
                    type="text"
                    {...register("salary")}
                    placeholder="₹45,00,000"
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Applied Date */}
                <div>
                  <label className="field-label">
                    Date Applied / Wishlist Date *
                  </label>
                  <input
                    type="date"
                    {...register("appliedDate")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.appliedDate && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.appliedDate.message}
                    </p>
                  )}
                </div>

                {/* Status Selection */}
                <div>
                  <label className="field-label">Status *</label>
                  <select
                    {...register("status")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Job Link */}
                <div>
                  <label className="field-label">Job Posting URL</label>
                  <input
                    type="text"
                    {...register("jobUrl")}
                    placeholder="https://careers.google.com/..."
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  {errors.jobUrl && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.jobUrl.message}
                    </p>
                  )}
                </div>

                {/* Resume Version Used */}
                <div>
                  <label className="field-label">Resume version used</label>
                  <select
                    {...register("resumeVersionUsed")}
                    className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent text-content"
                  >
                    <option value="">None Selected</option>
                    {resumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="field-label">
                  Comments &amp; Follow-up Info
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Recruiter contact details, coding round links, preparation reminders..."
                  className="w-full rounded-xl border border-border-app bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              {/* Submit Buttons */}
              <label className="field-label">
                Follow-up date
                <input
                  type="date"
                  className="field-input"
                  {...register("followUpDate")}
                />
              </label>
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
                  {editingApp ? "Save Changes" : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
