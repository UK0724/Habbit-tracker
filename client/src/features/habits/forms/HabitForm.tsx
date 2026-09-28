import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CircleCheck,
  CircleDot,
  ChartNoAxesColumnIncreasing,
  Bell,
  ChevronDown
} from "lucide-react";

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
  scrollable?: boolean;
  defaultValues?: Partial<HabitFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  typeDisabled?: boolean;
  onSubmit: (values: HabitFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
  onCancel?: () => void;
  /** Called whenever the form's dirty state changes (used to guard discards). */
  onDirtyChange?: (dirty: boolean) => void;
};

const TYPE_OPTIONS = [
  {
    value: "action",
    label: "Action",
    icon: CircleCheck,
    desc: "Done / not done each day"
  },
  {
    value: "measurable",
    label: "Measurable",
    icon: ChartNoAxesColumnIncreasing,
    desc: "Track a number — kg, km, hrs"
  }
] as const;

const CURRENCIES = ["₹", "$", "€", "£"] as const;

export const HabitForm = ({
  scrollable = false,
  defaultValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  typeDisabled,
  onSubmit,
  onDelete,
  isDeleting,
  onCancel,
  onDirtyChange
}: HabitFormProps) => {
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting, isDirty }
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      schedule: defaultValues?.schedule ?? "daily",
      weekdays: defaultValues?.weekdays ?? [1, 2, 3, 4, 5],
      timesPerWeek: defaultValues?.timesPerWeek ?? 3,
      targetMax: defaultValues?.targetMax,
      reminderTime: defaultValues?.reminderTime ?? "",
      linkToExpenseTracker: defaultValues?.linkToExpenseTracker ?? false,
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      type: defaultValues?.type ?? "action",
      unit: defaultValues?.unit ?? "",
      requireCompletionComment:
        defaultValues?.requireCompletionComment ?? false,
      color: defaultValues?.color ?? "violet",
      goalDirection: defaultValues?.goalDirection ?? "up",
      target: defaultValues?.target
    }
  });

  const selectedType = watch("type");
  const selectedColor = watch("color");
  const selectedUnit = watch("unit");
  const selectedGoal = watch("goalDirection");
  const selectedSchedule = watch("schedule");
  const [submissionError, setSubmissionError] = useState<string>();
  const saving = Boolean(isSubmitting || formSubmitting);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    // Only a range goal uses an upper limit; "record only" has no target.
    if (selectedGoal !== "range") setValue("targetMax", null);
    if (selectedGoal === "record") setValue("target", null);
  }, [selectedGoal, setValue]);

  useEffect(() => {
    if (selectedSchedule !== "weekdays")
      setValue("weekdays", [1, 2, 3, 4, 5], { shouldValidate: true });
    if (selectedSchedule !== "weekly")
      setValue("timesPerWeek", 3, { shouldValidate: true });
  }, [selectedSchedule, setValue]);

  useEffect(() => {
    if (selectedType === "action") {
      setValue("unit", "", { shouldDirty: true, shouldValidate: true });
      setValue("goalDirection", "up", { shouldValidate: true });
      setValue("target", null, { shouldValidate: true });
      setValue("targetMax", null, { shouldValidate: true });
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
        ? null
        : Number(value)
  });

  return (
    <form
      className={
        scrollable
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "space-y-6"
      }
      aria-busy={saving}
      onSubmit={handleSubmit(async (values) => {
        setSubmissionError(undefined);
        try {
          await onSubmit(values);
        } catch (error) {
          setSubmissionError(
            error instanceof Error
              ? error.message
              : "Could not save. Please try again."
          );
        }
      })}
    >
      <div
        className={cn(
          "space-y-6",
          scrollable &&
            "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:px-7 sm:py-6"
        )}
      >
        <div>
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            placeholder={
              selectedType === "expense"
                ? "e.g. Food, Rent, Fuel"
                : "e.g. Workout"
            }
            {...register("title")}
          />
          {errors.title ? (
            <p className="field-hint text-rose-600">{errors.title.message}</p>
          ) : null}
        </div>

        {/* Type selector */}
        <div>
          <p id="habit-type-label" className="field-label">
            Habit type
          </p>
          <div
            role="group"
            aria-labelledby="habit-type-label"
            className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
          >
            {TYPE_OPTIONS.map((option) => {
              const isActive = selectedType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  disabled={typeDisabled}
                  onClick={() => setType(option.value)}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60",
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "text-content-muted hover:bg-surface hover:text-content"
                  )}
                >
                  <option.icon aria-hidden className="h-4 w-4 shrink-0" />
                  <span>{option.label}</span>
                  <span className="sr-only">{option.desc}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-content-muted">
            {selectedType === "measurable"
              ? "Track an amount, like minutes, steps or pages."
              : "A simple daily check-in. Did you do it?"}
          </p>
          {typeDisabled ? (
            <p className="field-hint">
              Type can&apos;t change once a habit has logs.
            </p>
          ) : null}
        </div>

        {/* Schedule Picker */}
        <div className="space-y-3">
          <label className="field-label" htmlFor="schedule">
            Repeat frequency
          </label>
          <select
            id="schedule"
            className="field-input font-medium"
            {...register("schedule")}
          >
            <option value="daily">Every day</option>
            <option value="weekdays">Specific days of the week</option>
            <option value="weekly">Target days per week</option>
          </select>

          {watch("schedule") === "weekdays" && (
            <div
              role="group"
              aria-label="Days of the week"
              className="flex flex-wrap gap-2 pt-1"
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => {
                  const isSelected = watch("weekdays")?.includes(index);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isSelected}
                      className={cn(
                        "h-10 px-3.5 rounded-xl border text-xs font-bold transition",
                        isSelected
                          ? "border-accent bg-accent text-white shadow-sm shadow-accent/20"
                          : "border-border-app bg-surface-2 text-content-2 hover:border-content-subtle"
                      )}
                      onClick={() => {
                        const days = watch("weekdays") ?? [];
                        setValue(
                          "weekdays",
                          days.includes(index)
                            ? days.filter((d) => d !== index)
                            : [...days, index],
                          { shouldValidate: true }
                        );
                      }}
                    >
                      {day}
                    </button>
                  );
                }
              )}
            </div>
          )}

          {errors.weekdays && (
            <p role="alert" className="text-xs text-rose-500 font-semibold">
              Choose at least one day.
            </p>
          )}

          {watch("schedule") === "weekly" && (
            <div className="pt-1">
              <label className="field-label" htmlFor="timesPerWeek">
                Target completions per week
              </label>
              <Input
                id="timesPerWeek"
                type="number"
                min="1"
                max="7"
                className="w-32"
                {...register("timesPerWeek", { valueAsNumber: true })}
              />
              {errors.timesPerWeek && (
                <p role="alert" className="field-hint text-rose-600">
                  Choose between 1 and 7 days.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Optional Daily Reminder */}
        <details className="group border-y border-border-app/60 py-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-content [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Bell aria-hidden className="h-4 w-4 text-content-muted" />
              Daily reminder{" "}
              <span className="text-xs text-content-muted">Optional</span>
            </span>
            <ChevronDown
              aria-hidden
              className="h-4 w-4 text-content-muted transition group-open:rotate-180"
            />
          </summary>
          <div className="mt-3">
            <div className="w-full min-w-0 max-w-full sm:w-48">
              <Input type="time" aria-label="Daily reminder time" className="reminder-time-input" {...register("reminderTime")} />
            </div>
            <p className="field-hint mt-1.5">
              You will receive a notification to complete your habit at this
              time.
            </p>
          </div>
        </details>
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
              <p className="field-hint">
                The unit for the number you log each day.
              </p>
              {errors.unit ? (
                <p className="field-hint text-rose-600">
                  {errors.unit.message}
                </p>
              ) : null}
            </div>

            <div>
              <p id="habit-goal-label" className="field-label">
                Goal
              </p>
              <div
                role="group"
                aria-labelledby="habit-goal-label"
                className="grid gap-2 sm:grid-cols-2"
              >
                {(
                  [
                    {
                      value: "up",
                      label: "Higher is better",
                      hint: "steps, water, pages",
                      icon: ArrowUp
                    },
                    {
                      value: "down",
                      label: "Lower is better",
                      hint: "screen time",
                      icon: ArrowDown
                    },
                    {
                      value: "range",
                      label: "Within a range",
                      hint: "minimum to maximum",
                      icon: ArrowLeftRight
                    },
                    {
                      value: "record",
                      label: "Record only",
                      hint: "every entry counts",
                      icon: CircleDot
                    }
                  ] as const
                ).map((option) => {
                  const isActive = selectedGoal === option.value;
                  const GoalIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        setValue("goalDirection", option.value, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }
                      className={cn(
                        "rounded-xl p-3 text-left transition focus-visible:ring-2 focus-visible:ring-accent",
                        isActive
                          ? "bg-accent/10 ring-1 ring-accent/30"
                          : "hover:bg-surface-2"
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-bold",
                          isActive ? "text-accent" : "text-content"
                        )}
                      >
                        <GoalIcon aria-hidden className="h-4 w-4 shrink-0" />
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

            {selectedGoal !== "record" ? (
              <div>
                <label className="field-label" htmlFor="target">
                  {selectedGoal === "range"
                    ? `Lower limit${selectedUnit ? ` (${selectedUnit})` : ""} — required`
                    : `${selectedGoal === "down" ? "Daily maximum" : "Daily target"}${selectedUnit ? ` (${selectedUnit})` : ""} — optional`}
                </label>
                <Input
                  id="target"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="e.g. 75"
                  aria-invalid={Boolean(errors.target)}
                  aria-describedby="target-hint"
                  {...targetField}
                />
                <p id="target-hint" className="field-hint">
                  {selectedGoal === "range"
                    ? "The lowest value that still counts as done."
                    : "The saved value must meet this rule. Leave blank to count any recorded value."}
                </p>
                {errors.target ? (
                  <p role="alert" className="field-hint text-rose-600">
                    {errors.target.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {selectedGoal === "range" ? (
              <div>
                <label className="field-label" htmlFor="targetMax">
                  Upper limit{selectedUnit ? ` (${selectedUnit})` : ""} —
                  required
                </label>
                <Input
                  id="targetMax"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="e.g. 100"
                  aria-invalid={Boolean(errors.targetMax)}
                  aria-describedby="targetMax-hint"
                  {...register("targetMax", {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? null
                        : Number(v)
                  })}
                />
                <p id="targetMax-hint" className="field-hint">
                  The highest value that still counts as done.
                </p>
                {errors.targetMax ? (
                  <p role="alert" className="field-hint text-rose-600">
                    {errors.targetMax.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedType === "action" ? (
          <div className="flex items-start gap-3">
            <input
              id="requireCompletionComment"
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-app accent-accent focus-visible:ring-2 focus-visible:ring-accent"
              aria-describedby="requireCompletionComment-hint"
              {...register("requireCompletionComment")}
            />
            <div>
              <label
                htmlFor="requireCompletionComment"
                className="text-sm font-semibold text-content"
              >
                Require a note to complete
              </label>
              <p
                id="requireCompletionComment-hint"
                className="field-hint mt-0.5"
              >
                You&apos;ll add a short note each time you tick this habit off.
              </p>
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
                <p className="field-hint text-rose-600">
                  {errors.target.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Clean, simplified habit creation — no multi-checkbox clutter */}

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
                    "relative flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition",
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
      </div>

      {(submissionError || errorMessage) && (
        <div
          role="alert"
          className="shrink-0 border-t border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600"
        >
          {submissionError || errorMessage}
        </div>
      )}

      <div
        className={cn(
          "flex gap-3 border-t border-border-app",
          scrollable
            ? "shrink-0 items-center justify-end bg-surface p-4 sm:px-7"
            : "flex-col-reverse pt-4 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        {onDelete ? (
          <div>
            <Button
              type="button"
              variant="danger"
              onClick={() => void onDelete()}
              disabled={isDeleting || saving}
            >
              {isDeleting ? "Deleting..." : "Delete habit"}
            </Button>
          </div>
        ) : null}

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="min-h-11 px-3 text-sm font-semibold text-content-2 hover:text-content transition"
          >
            Cancel
          </button>
        ) : (
          <Link
            to="/habits"
            className="text-sm font-semibold text-content-2 hover:text-content transition"
          >
            Cancel
          </Link>
        )}
        <Button type="submit" disabled={saving || isDeleting}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};
