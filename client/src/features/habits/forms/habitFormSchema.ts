import { z } from "zod";

export const habitColorOptions = [
  { label: "Violet", value: "violet", swatch: "bg-violet-500" },
  { label: "Indigo", value: "indigo", swatch: "bg-indigo-500" },
  { label: "Blue", value: "blue", swatch: "bg-blue-500" },
  { label: "Emerald", value: "emerald", swatch: "bg-emerald-500" },
  { label: "Rose", value: "rose", swatch: "bg-rose-500" },
  { label: "Amber", value: "amber", swatch: "bg-amber-500" },
  { label: "Slate", value: "slate", swatch: "bg-slate-500" }
] as const;

const habitColorValues = habitColorOptions.map((option) => option.value) as [
  (typeof habitColorOptions)[number]["value"],
  ...(typeof habitColorOptions)[number]["value"][]
];

export const habitFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(100),
    description: z
      .string()
      .trim()
      .max(280, "Description must be 280 characters or less")
      .optional(),
    type: z.enum(["action", "measurable"]),
    unit: z
      .string()
      .trim()
      .max(20, "Unit must be 20 characters or less")
      .optional(),
    color: z.enum(habitColorValues)
  })
  .superRefine((value, context) => {
    if (value.type === "measurable" && !value.unit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Unit is required for measurable habits"
      });
    }
  });

export type HabitFormValues = z.infer<typeof habitFormSchema>;
