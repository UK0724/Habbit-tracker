import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { HabitForm } from "../features/habits/forms/HabitForm";
import type { HabitFormValues } from "../features/habits/forms/habitFormSchema";
import {
  useDeleteHabit,
  useHabit,
  useUpdateHabit
} from "../features/habits/hooks/useHabits";

export const EditHabitPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const habitQuery = useHabit(id);
  const updateHabitMutation = useUpdateHabit(id as string);
  const deleteHabitMutation = useDeleteHabit(id as string);

  const handleSubmit = async (values: HabitFormValues) => {
    await updateHabitMutation.mutateAsync(values);
    navigate(`/habits/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this habit and all of its logs?")) {
      return;
    }

    await deleteHabitMutation.mutateAsync();
    navigate("/");
  };

  if (habitQuery.isLoading) {
    return <div className="surface-card h-80 animate-pulse bg-surface/80" />;
  }

  if (habitQuery.isError || !habitQuery.data) {
    return (
      <SectionCard title="Unable to load habit">
        <p className="text-sm text-rose-600">
          {habitQuery.error?.message ?? "This habit could not be found."}
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Edit"
        title={`Edit ${habitQuery.data.title}`}
        description="Type is locked here to keep historical logging consistent as the app grows."
      />

      <SectionCard
        title="Update habit"
        description="Adjust naming, copy, unit, or color without disturbing the rest of the experience."
      >
        <HabitForm
          defaultValues={{
            ...habitQuery.data,
            title: habitQuery.data.title,
            description: habitQuery.data.description ?? "",
            type: habitQuery.data.type,
            unit: habitQuery.data.unit ?? "",
            requireCompletionComment: habitQuery.data.requireCompletionComment,
            color: habitQuery.data.color as HabitFormValues["color"],
            goalDirection: habitQuery.data.goalDirection,
            target: habitQuery.data.target
          }}
          submitLabel="Save changes"
          isSubmitting={updateHabitMutation.isPending}
          errorMessage={
            updateHabitMutation.error?.message ?? deleteHabitMutation.error?.message
          }
          typeDisabled
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          isDeleting={deleteHabitMutation.isPending}
        />
      </SectionCard>
    </div>
  );
};
