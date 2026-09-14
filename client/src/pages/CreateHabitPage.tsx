import { templates } from "./TodayPage";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { HabitForm } from "../features/habits/forms/HabitForm";
import type { HabitFormValues } from "../features/habits/forms/habitFormSchema";
import { useCreateHabit } from "../features/habits/hooks/useHabits";

export const CreateHabitPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = params.has("template") ? templates[Number(params.get("template"))] : undefined;
  const createHabitMutation = useCreateHabit();

  const handleSubmit = async (values: HabitFormValues) => {
    const habit = await createHabitMutation.mutateAsync(values);
    navigate(`/habits/${habit.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Create"
        title="New habit"
        description="Choose a small action or a number you want to track."
      />

      <SectionCard
        title="Habit details"
        description="Keep it simple: a title, habit type, optional description, and a color accent."
      >
        <HabitForm
          defaultValues={template as Partial<HabitFormValues>}
          submitLabel="Create habit"
          isSubmitting={createHabitMutation.isPending}
          errorMessage={createHabitMutation.error?.message}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </div>
  );
};