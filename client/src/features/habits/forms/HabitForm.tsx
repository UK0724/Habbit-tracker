import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
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
      color: defaultValues?.color ?? "violet"
    }
  });

  const selectedType = watch("type");
  const selectedColor = watch("color");

  useEffect(() => {
    if (selectedType === "action") {
      setValue("unit", "", {
        shouldDirty: true,
        shouldValidate: true
      });
    } else {
      setValue("requireCompletionComment", false, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  }, [selectedType, setValue]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="field-label" htmlFor="title">
          Title
        </label>
        <Input id="title" placeholder="Workout" {...register("title")} />
        {errors.title ? (
          <p className="field-hint text-rose-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="type">
            Habit type
          </label>
          <Select id="type" disabled={typeDisabled} {...register("type")}>
            <option value="action">Action</option>
            <option value="measurable">Measurable</option>
          </Select>
          <p className="field-hint">
            Action habits use Done / Not done. Measurable habits store numeric
            values.
          </p>
          {errors.type ? (
            <p className="field-hint text-rose-600">{errors.type.message}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="unit">
            Unit
          </label>
          <Input
            id="unit"
            placeholder={selectedType === "measurable" ? "kg" : "Not needed"}
            disabled={selectedType === "action"}
            {...register("unit")}
          />
          <p className="field-hint">
            Required only for measurable habits like `kg`, `₹`, or `liters`.
          </p>
          {errors.unit ? (
            <p className="field-hint text-rose-600">{errors.unit.message}</p>
          ) : null}
        </div>
      </div>

      {selectedType === "action" ? (
        <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
            {...register("requireCompletionComment")}
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Ask for a comment when marking Done
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Useful for habits like job applications, outreach, reading, or
              anything where the completed item matters.
            </span>
            {errors.requireCompletionComment ? (
              <span className="field-hint block text-rose-600">
                {errors.requireCompletionComment.message}
              </span>
            ) : null}
          </span>
        </label>
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

      <div>
        <p className="field-label">Color</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {habitColorOptions.map((option) => {
            const isSelected = selectedColor === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setValue("color", option.value, {
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <span
                  className={cn("h-4 w-4 rounded-full", option.swatch)}
                  aria-hidden
                />
                <span className="font-semibold">{option.label}</span>
              </button>
            );
          })}
        </div>
        {errors.color ? (
          <p className="field-hint text-rose-600">{errors.color.message}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
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
