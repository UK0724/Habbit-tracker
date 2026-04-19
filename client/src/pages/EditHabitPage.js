import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { HabitForm } from "../features/habits/forms/HabitForm";
import { useDeleteHabit, useHabit, useUpdateHabit } from "../features/habits/hooks/useHabits";
export const EditHabitPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const habitQuery = useHabit(id);
    const updateHabitMutation = useUpdateHabit(id);
    const deleteHabitMutation = useDeleteHabit(id);
    const handleSubmit = async (values) => {
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
        return _jsx("div", { className: "surface-card h-80 animate-pulse bg-white/80" });
    }
    if (habitQuery.isError || !habitQuery.data) {
        return (_jsx(SectionCard, { title: "Unable to load habit", children: _jsx("p", { className: "text-sm text-rose-700", children: habitQuery.error?.message ?? "This habit could not be found." }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(PageHeader, { eyebrow: "Edit", title: `Edit ${habitQuery.data.title}`, description: "Type is locked here to keep historical logging consistent as the app grows." }), _jsx(SectionCard, { title: "Update habit", description: "Adjust naming, copy, unit, or color without disturbing the rest of the experience.", children: _jsx(HabitForm, { defaultValues: {
                        title: habitQuery.data.title,
                        description: habitQuery.data.description ?? "",
                        type: habitQuery.data.type,
                        unit: habitQuery.data.unit ?? "",
                        color: habitQuery.data.color
                    }, submitLabel: "Save changes", isSubmitting: updateHabitMutation.isPending, errorMessage: updateHabitMutation.error?.message ?? deleteHabitMutation.error?.message, typeDisabled: true, onSubmit: handleSubmit, onDelete: handleDelete, isDeleting: deleteHabitMutation.isPending }) })] }));
};
