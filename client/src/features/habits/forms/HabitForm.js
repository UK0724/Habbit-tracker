import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { cn } from "../../../shared/lib/utils";
import { habitColorOptions, habitFormSchema } from "./habitFormSchema";
export const HabitForm = ({ defaultValues, submitLabel, isSubmitting, errorMessage, typeDisabled, onSubmit, onDelete, isDeleting }) => {
    const { register, watch, setValue, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(habitFormSchema),
        defaultValues: {
            title: defaultValues?.title ?? "",
            description: defaultValues?.description ?? "",
            type: defaultValues?.type ?? "action",
            unit: defaultValues?.unit ?? "",
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
        }
    }, [selectedType, setValue]);
    return (_jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { className: "field-label", htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", placeholder: "Workout", ...register("title") }), errors.title ? (_jsx("p", { className: "field-hint text-rose-600", children: errors.title.message })) : null] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "field-label", htmlFor: "type", children: "Habit type" }), _jsxs(Select, { id: "type", disabled: typeDisabled, ...register("type"), children: [_jsx("option", { value: "action", children: "Action" }), _jsx("option", { value: "measurable", children: "Measurable" })] }), _jsx("p", { className: "field-hint", children: "Action habits use Done / Not done. Measurable habits store numeric values." }), errors.type ? (_jsx("p", { className: "field-hint text-rose-600", children: errors.type.message })) : null] }), _jsxs("div", { children: [_jsx("label", { className: "field-label", htmlFor: "unit", children: "Unit" }), _jsx(Input, { id: "unit", placeholder: selectedType === "measurable" ? "kg" : "Not needed", disabled: selectedType === "action", ...register("unit") }), _jsx("p", { className: "field-hint", children: "Required only for measurable habits like `kg`, `\u20B9`, or `liters`." }), errors.unit ? (_jsx("p", { className: "field-hint text-rose-600", children: errors.unit.message })) : null] })] }), _jsxs("div", { children: [_jsx("label", { className: "field-label", htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", placeholder: "Optional note to make the habit clearer.", ...register("description") }), errors.description ? (_jsx("p", { className: "field-hint text-rose-600", children: errors.description.message })) : null] }), _jsxs("div", { children: [_jsx("p", { className: "field-label", children: "Color" }), _jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: habitColorOptions.map((option) => {
                            const isSelected = selectedColor === option.value;
                            return (_jsxs("button", { type: "button", onClick: () => setValue("color", option.value, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                }), className: cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition", isSelected
                                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"), children: [_jsx("span", { className: cn("h-4 w-4 rounded-full", option.swatch), "aria-hidden": true }), _jsx("span", { className: "font-semibold", children: option.label })] }, option.value));
                        }) }), errors.color ? (_jsx("p", { className: "field-hint text-rose-600", children: errors.color.message })) : null] }), errorMessage ? (_jsx("div", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700", children: errorMessage })) : null, _jsxs("div", { className: "flex flex-col-reverse gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("div", { children: onDelete ? (_jsx(Button, { type: "button", variant: "danger", onClick: () => void onDelete(), disabled: isDeleting || isSubmitting, children: isDeleting ? "Deleting..." : "Delete habit" })) : null }), _jsx(Button, { type: "submit", disabled: isSubmitting || isDeleting, children: isSubmitting ? "Saving..." : submitLabel })] })] }));
};
