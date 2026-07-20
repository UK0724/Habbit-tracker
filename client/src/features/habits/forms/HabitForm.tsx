import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { cn } from "../../../shared/lib/utils";
import {
  HabitFormValues,
  habitColorOptions,
  habitFormSchema
} from "./habitFormSchema";

type HabitFormProps = {
  defaultValues?: Partial<HabitFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  typeDisabled?: boolean;
  onSubmit: (values: HabitFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
};

const TYPE_OPTIONS = [
  {
    value: "action",
    label: "Action",
    emoji: "✅",
    desc: "Done / not done each day"
  },
  {
    value: "measurable",
    label: "Measurable",
    emoji: "📊",
    desc: "Track a number — kg, km, hrs"
  },
  {
    value: "expense",
    label: "Expense",
    emoji: "💸",
    desc: "Track money you spend"
  }
] as const;

const CURRENCIES = ["₹", "$", "€", "£"] as const;

export const HabitForm = ({
  defaultValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  typeDisabled,
  onSubmit,
  onDelete,
  isDeleting
}: HabitFormProps) => {
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors }
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      type: defaultValues?.type ?? "action",
      unit: defaultValues?.unit ?? "",
      requireCompletionComment: defaultValues?.requireCompletionComment ?? false,
      linkToJobTracker: defaultValues?.linkToJobTracker ?? false,
      color: defaultValues?.color ?? "violet",
      goalDirection: defaultValues?.goalDirection ?? "up",
      target: defaultValues?.target
    }
  });

  const selectedType = watch("type");
  const selectedColor = watch("color");
  const selectedUnit = watch("unit");
  const selectedGoal = watch("goalDirection");

  useEffect(() => {
    if (selectedType === "action") {
      setValue("unit", "", { shouldDirty: true, shouldValidate: true });
    } else if (selectedType === "expense") {
      const current = getValues("unit") ?? "";
      if (!CURRENCIES.includes(current as (typeof CURRENCIES)[number])) {
        setValue("unit", "₹", { shouldDirty: true, shouldValidate: true });
      }
      setValue("goalDirection", "down", { shouldValidate: true });
      setValue("requireCompletionComment", false, { shouldValidate: true });
    } else {
      setValue("requireCompletionComment", false, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const setType = (value: HabitFormValues["type"]) =>
    setValue("type", value, { shouldDirty: true, shouldValidate: true });

  // Convert the numeric input's string value to number | undefined so the
  // schema stays a real optional number (no zod preprocess needed).
  const targetField = register("target", {
    setValueAs: (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value)
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="field-label" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          placeholder={
            selectedType === "expense" ? "e.g. Food, Rent, Fuel" : "e.g. Workout"
          }
          {...register("title")}
        />
        {errors.title ? (
          <p className="field-hint text-rose-600">{errors.title.message}</p>
        ) : null}
      </div>

      {/* Type selector */}
      <div>
        <p className="field-label">Habit type</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPE_OPTIONS.map((option) => {
            const isActive = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={typeDisabled}
                onClick={() => setType(option.value)}
                className={cn(
                  "flex flex-col gap-1 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border-app bg-surface hover:border-content-subtle"
                )}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-xl">
                    {option.emoji}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive ? "text-accent" : "text-content"
                    )}
                  >
                    {option.label}
                  </span>
                </span>
                <span className="text-xs leading-5 text-content-muted">
                  {option.desc}
                </span>
              </button>
            );
          })}
        </div>
        {typeDisabled ? (
          <p className="field-hint">
            Type can&apos;t change once a habit has logs.
          </p>
        ) : null}
      </div>

      {/* Conditional config */}
      {selectedType === "measurable" ? (
        <div className="space-y-5">
          <div>
            <label className="field-label" htmlFor="unit">
              Unit
            </label>
            <Input
              id="unit"
              placeholder="kg, km, hrs, pages…"
              {...register("unit")}
            />
            <p className="field-hint">The unit for the number you log each day.</p>
            {errors.unit ? (
              <p className="field-hint text-rose-600">{errors.unit.message}</p>
            ) : null}
          </div>

          <div>
            <p className="field-label">Goal</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "up", label: "Higher is better", hint: "steps, water, pages" },
                  { value: "down", label: "Lower is better", hint: "weight, screen time" }
                ] as const
              ).map((option) => {
                const isActive = selectedGoal === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("goalDirection", option.value, {
                        shouldDirty: true,
                        shouldValidate: true
                      })
                    }
                    className={cn(
                      "rounded-2xl border p-3 text-left transition",
                      isActive
                        ? "border-accent bg-accent/10"
                        : "border-border-app bg-surface hover:border-content-subtle"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm font-bold",
                        isActive ? "text-accent" : "text-content"
                      )}
                    >
                      {option.value === "up" ? "↑ " : "↓ "}
                      {option.label}
                    </span>
                    <span className="text-xs text-content-muted">
                      e.g. {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="target">
              Target {selectedUnit ? `(${selectedUnit})` : ""} — optional
            </label>
            <Input
              id="target"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="e.g. 75"
              {...targetField}
            />
            <p className="field-hint">
              We&apos;ll show your progress toward this.
            </p>
            {errors.target ? (
              <p className="field-hint text-rose-600">{errors.target.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedType === "expense" ? (
        <div>
          <p className="field-label">Currency</p>
          <div className="flex gap-2">
            {CURRENCIES.map((currency) => {
              const isActive = selectedUnit === currency;
              return (
                <button
                  key={currency}
                  type="button"
                  onClick={() =>
                    setValue("unit", currency, {
                      shouldDirty: true,
                      shouldValidate: true
                    })
                  }
                  className={cn(
                    "h-11 w-14 rounded-xl border text-lg font-bold transition",
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-app bg-surface text-content-2 hover:border-content-subtle"
                  )}
                >
                  {currency}
                </button>
              );
            })}
          </div>
          <p className="field-hint">
            You&apos;ll log an amount each time you spend on this. Lower spend
            is always better here.
          </p>

          <div className="mt-4">
            <label className="field-label" htmlFor="target">
              Monthly budget {selectedUnit ?? "₹"} — optional
            </label>
            <Input
              id="target"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="e.g. 5000"
              {...targetField}
            />
            <p className="field-hint">
              We&apos;ll warn you as you approach it.
            </p>
            {errors.target ? (
              <p className="field-hint text-rose-600">{errors.target.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedType === "action" ? (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border-app bg-surface-2 p-4 transition hover:border-accent/40">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-border-app text-accent focus:ring-accent/30"
              {...register("requireCompletionComment")}
            />
            <span>
              <span className="block text-sm font-semibold text-content">
                Ask for a comment when marking Done
              </span>
              <span className="mt-1 block text-sm leading-6 text-content-muted">
                Useful for habits like job applications, outreach, or reading —
                anything where the completed item matters.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border-app bg-surface-2 p-4 transition hover:border-accent/40">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-border-app text-accent focus:ring-accent/30"
              {...register("linkToJobTracker")}
            />
            <span>
              <span className="block text-sm font-semibold text-content">
                Link to Job Search Tracker
              </span>
              <span className="mt-1 block text-sm leading-6 text-content-muted">
                Connect this habit to the Job Search workspace. The switcher and homepage card will only be visible when this habit exists.
              </span>
            </span>
          </label>
        </div>
      ) : null}

      <div>
        <label className="field-label" htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Optional note to make the habit clearer."
          {...register("description")}
        />
        {errors.description ? (
          <p className="field-hint text-rose-600">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      {/* Color picker */}
      <div>
        <p className="field-label">Color</p>
        <div className="flex flex-wrap gap-3">
          {habitColorOptions.map((option) => {
            const isSelected = selectedColor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={isSelected}
                onClick={() =>
                  setValue("color", option.value, {
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl ring-2 ring-offset-2 ring-offset-surface transition",
                  option.swatch,
                  isSelected
                    ? "ring-content scale-105"
                    : "ring-transparent hover:scale-105"
                )}
              >
                {isSelected ? (
                  <span className="text-lg font-bold text-white drop-shadow">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {errors.color ? (
          <p className="field-hint text-rose-600">{errors.color.message}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border-app pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => void onDelete()}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? "Deleting..." : "Delete habit"}
            </Button>
          ) : null}
        </div>

        <Button type="submit" disabled={isSubmitting || isDeleting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};
