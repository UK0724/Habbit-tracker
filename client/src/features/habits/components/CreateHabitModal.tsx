import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useDialog } from "../../../shared/hooks/useDialog";
import { HabitForm } from "../forms/HabitForm";
import type { HabitFormValues } from "../forms/habitFormSchema";
import { useCreateHabit } from "../hooks/useHabits";
import type { Habit } from "../../../shared/types/habit";

export type CreateHabitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<HabitFormValues>;
  onSuccess?: (habit: Habit) => void;
};

export const CreateHabitModal = ({
  isOpen,
  onClose,
  defaultValues,
  onSuccess
}: CreateHabitModalProps) => {
  const createHabitMutation = useCreateHabit();
  const { reset } = createHabitMutation;
  const dirtyRef = useRef(false);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);
  const close = () => {
    if (!createHabitMutation.isPending) onClose();
  };
  /** Backdrop clicks and Escape are easy to trigger by accident. */
  const closeWithConfirm = () => {
    if (createHabitMutation.isPending) return;
    if (
      dirtyRef.current &&
      !window.confirm("Discard this habit? Your changes will be lost.")
    ) {
      return;
    }
    onClose();
  };
  useDialog(isOpen, closeWithConfirm, "[data-create-habit-dialog]");
  useEffect(() => {
    if (isOpen) {
      reset();
      dirtyRef.current = false;
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleSubmit = async (values: HabitFormValues) => {
    const habit = await createHabitMutation.mutateAsync(values);
    onClose();
    if (onSuccess) {
      onSuccess(habit);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-3 sm:p-4 bg-black/70 animate-fade-in"
      onClick={closeWithConfirm}
    >
      <div
        data-create-habit-dialog
        role="dialog"
        aria-modal="true"
        aria-label="Create New Habit"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border-app bg-surface shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-app p-4 sm:px-7 sm:py-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              New Quest
            </span>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-content">
              Create New Habit
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-content-muted">
              Choose an action or target to build consistency into your daily
              flow.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            disabled={createHabitMutation.isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-content-muted hover:bg-surface-2 hover:text-content transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <HabitForm
          scrollable
          key={JSON.stringify(defaultValues ?? {})}
          defaultValues={defaultValues}
          submitLabel="Create habit"
          isSubmitting={createHabitMutation.isPending}
          errorMessage={createHabitMutation.error?.message}
          onSubmit={handleSubmit}
          onCancel={close}
          onDirtyChange={handleDirtyChange}
        />
      </div>
    </div>,
    document.body
  );
};
