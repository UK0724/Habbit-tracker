import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { HabitForm } from "../features/habits/forms/HabitForm";
import { useCreateHabit } from "../features/habits/hooks/useHabits";
export const CreateHabitPage = () => {
    const navigate = useNavigate();
    const createHabitMutation = useCreateHabit();
    const handleSubmit = async (values) => {
        const habit = await createHabitMutation.mutateAsync(values);
        navigate(`/habits/${habit.id}`);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(PageHeader, { eyebrow: "Create", title: "New habit", description: "Add a focused action habit or a measurable metric with a clean foundation you can extend later." }), _jsx(SectionCard, { title: "Habit details", description: "Keep it simple: a title, habit type, optional description, and a color accent.", children: _jsx(HabitForm, { submitLabel: "Create habit", isSubmitting: createHabitMutation.isPending, errorMessage: createHabitMutation.error?.message, onSubmit: handleSubmit }) })] }));
};
