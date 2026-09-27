import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Calendar,
  Bell
} from "lucide-react-native";
import { Input } from "../../../src/components/Input";
import { Button } from "../../../src/components/Button";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../../src/constants/theme";
import { habitApi } from "../../../src/services/api";
import {
  hapticSuccess,
  hapticLight,
  hapticError
} from "../../../src/utils/haptics";
import type { HabitType } from "@habit-tracker/shared";
import { requestNotificationPermissions } from "../../../src/services/notifications";

const COLOR_PALETTE = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#8B5CF6", // Violet
  "#EF4444", // Red
  "#14B8A6" // Teal
];

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 }
] as const;

const habitFormSchema = z
  .object({
    title: z.string().trim().min(1, "Habit title is required").max(100),
    description: z.string().max(280).optional(),
    type: z.enum(["action", "measurable"]),
    target: z.string().optional(),
    targetMax: z.string().optional(),
    unit: z.string().optional(),
    goalDirection: z.enum(["up", "down", "range", "record"]).default("up"),
    schedule: z.enum(["daily", "weekdays", "weekly"]).default("daily"),
    weekdays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
    timesPerWeek: z.number().int().min(1).max(7).default(1),
    color: z.string().default("#6366F1")
  })
  .superRefine((value, context) => {
    if (value.schedule === "weekdays" && value.weekdays.length === 0)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weekdays"],
        message: "Choose at least one day"
      });
    if (value.type !== "measurable") return;
    if (!value.unit?.trim())
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Enter a unit for your entries"
      });
    if (value.unit && value.unit.trim().length > 20)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Use 20 characters or fewer"
      });
    const hasTarget = Boolean(value.target?.trim());
    const target = hasTarget ? Number(value.target) : null;
    if (
      value.goalDirection !== "record" &&
      hasTarget &&
      !Number.isFinite(target)
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target"],
        message: "Enter a valid number"
      });
    if (value.goalDirection === "range") {
      const max = value.targetMax?.trim() ? Number(value.targetMax) : null;
      if (
        target === null ||
        max === null ||
        !Number.isFinite(max) ||
        max < target
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetMax"],
          message: "Enter a maximum at least as large as the minimum"
        });
    }
  });

type HabitFormValues = z.infer<typeof habitFormSchema>;

export default function CreateHabitScreen() {
  const router = useRouter();
  const { editId: rawEditId } = useLocalSearchParams<{ editId?: string }>();
  const editId = Array.isArray(rawEditId) ? rawEditId[0] : rawEditId;
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const createInFlight = useRef(false);
  const {
    data: editingHabit,
    isLoading: isLoadingHabit,
    error: editingError,
    refetch: refetchEditingHabit
  } = useQuery({
    queryKey: ["habit", editId],
    queryFn: () => habitApi.get(editId as string),
    enabled: Boolean(editId)
  });

  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "action",
      target: "",
      targetMax: "",
      unit: "",
      goalDirection: "up",
      schedule: "daily",
      weekdays: [1, 2, 3, 4, 5],
      timesPerWeek: 1,
      color: COLOR_PALETTE[0]
    }
  });

  const selectedType = watch("type");
  const selectedGoal = watch("goalDirection");
  const selectedSchedule = watch("schedule");
  const selectedColor = watch("color");
  const selectedWeekdays = watch("weekdays");
  const selectedTimesPerWeek = watch("timesPerWeek");

  useEffect(() => {
    if (!editingHabit || editingHabit.type === "expense") return;
    reset({
      title: editingHabit.title,
      description: editingHabit.description ?? "",
      type: editingHabit.type,
      target: editingHabit.target == null ? "" : String(editingHabit.target),
      targetMax:
        editingHabit.targetMax == null ? "" : String(editingHabit.targetMax),
      unit: editingHabit.unit ?? "",
      goalDirection: editingHabit.goalDirection,
      schedule: editingHabit.schedule ?? "daily",
      weekdays: editingHabit.weekdays ?? [1, 2, 3, 4, 5],
      timesPerWeek: editingHabit.timesPerWeek ?? 1,
      color: editingHabit.color
    });
    setReminderTime(editingHabit.reminderTime || null);
  }, [editingHabit, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      const targetNum =
        values.type === "measurable" &&
        values.goalDirection !== "record" &&
        values.target?.trim()
          ? Number(values.target)
          : null;
      const targetMax =
        values.type === "measurable" &&
        values.goalDirection === "range" &&
        values.targetMax?.trim()
          ? Number(values.targetMax)
          : null;
      const payload = {
        title: values.title.trim(),
        description: editId
          ? (values.description?.trim() ?? "")
          : values.description?.trim() || undefined,
        type: values.type as HabitType,
        color: values.color,
        schedule: values.schedule,
        ...(values.schedule === "weekdays"
          ? { weekdays: values.weekdays }
          : {}),
        ...(values.schedule === "weekly"
          ? { timesPerWeek: values.timesPerWeek }
          : {}),
        goalDirection:
          values.type === "measurable" ? values.goalDirection : "up",
        target: targetNum,
        targetMax,
        unit:
          values.type === "measurable"
            ? values.unit?.trim() || undefined
            : undefined,
        reminderTime: editId
          ? (reminderTime ?? "")
          : (reminderTime ?? undefined),
        requireCompletionComment: false
      };
      return editId
        ? habitApi.update(editId, payload)
        : habitApi.create(payload);
    },
    onSuccess: async () => {
      await hapticSuccess();
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      if (editId) {
        await queryClient.invalidateQueries({ queryKey: ["habit", editId] });
        await queryClient.invalidateQueries({
          queryKey: ["habitStats", editId]
        });
      }
      router.back();
    },
    onError: (err: Error) => {
      hapticError();
      setErrorMessage(err?.message || "Failed to create habit");
    },
    onSettled: () => {
      createInFlight.current = false;
    }
  });

  const onSubmit = (data: HabitFormValues) => {
    if (createInFlight.current) return;
    createInFlight.current = true;
    setErrorMessage(null);
    createMutation.mutate(data);
  };

  const openReminderPicker = async () => {
    if (!reminderTime) {
      const permitted = await requestNotificationPermissions();
      if (!permitted) {
        Alert.alert(
          "Notifications are off",
          "Allow notifications for Pulse in your device settings to use daily reminders."
        );
        return;
      }
    }
    setShowTimePicker(true);
  };

  const pickerValue = new Date();
  const [pickerHour, pickerMinute] = (reminderTime ?? "08:00")
    .split(":")
    .map(Number);
  pickerValue.setHours(pickerHour ?? 8, pickerMinute ?? 0, 0, 0);

  if (
    editId &&
    (isLoadingHabit || !editingHabit || editingHabit.type === "expense")
  ) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {isLoadingHabit ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loadingIndicator}
          />
        ) : (
          <View style={styles.loadError}>
            <Text style={styles.errorText}>
              {editingHabit?.type === "expense"
                ? "Edit expense habits on the web app."
                : (editingError?.message ?? "Habit not found")}
            </Text>
            {editingHabit?.type !== "expense" && (
              <Button
                title="Retry"
                onPress={() => void refetchEditingHabit()}
              />
            )}
            <Button title="Go back" onPress={() => router.back()} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Close habit form"
            disabled={createMutation.isPending}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editId ? "Edit habit" : "New habit"}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Title"
                placeholder="e.g. Read 20 Pages, Morning Workout..."
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />

          {/* Description Input */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description (optional)"
                placeholder="A short note to keep you going"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                numberOfLines={2}
                error={errors.description?.message}
              />
            )}
          />

          {/* Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Habit type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Action"
                accessibilityState={{ selected: selectedType === "action" }}
                disabled={Boolean(editId)}
                style={[
                  styles.typeButton,
                  selectedType === "action" && styles.typeButtonActive
                ]}
                onPress={() => {
                  hapticLight();
                  setValue("type", "action");
                }}
              >
                <CheckCircle2
                  size={20}
                  color={
                    selectedType === "action"
                      ? COLORS.primary
                      : COLORS.textMuted
                  }
                />
                <View style={styles.typeButtonTextGroup}>
                  <Text
                    style={[
                      styles.typeButtonTitle,
                      selectedType === "action" && styles.typeButtonTitleActive
                    ]}
                  >
                    Action
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Measurable"
                accessibilityState={{ selected: selectedType === "measurable" }}
                disabled={Boolean(editId)}
                style={[
                  styles.typeButton,
                  selectedType === "measurable" && styles.typeButtonActive
                ]}
                onPress={() => {
                  hapticLight();
                  setValue("type", "measurable");
                }}
              >
                <Sliders
                  size={20}
                  color={
                    selectedType === "measurable"
                      ? COLORS.primary
                      : COLORS.textMuted
                  }
                />
                <View style={styles.typeButtonTextGroup}>
                  <Text
                    style={[
                      styles.typeButtonTitle,
                      selectedType === "measurable" &&
                        styles.typeButtonTitleActive
                    ]}
                  >
                    Measurable
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.typeButtonDesc}>
              {editId
                ? "Habit type stays the same after creation."
                : selectedType === "action"
                  ? "A simple daily check-in. Did you do it?"
                  : "Track an amount, like minutes, steps or pages."}
            </Text>
          </View>

          {/* Measurable specific fields */}
          {selectedType === "measurable" && (
            <View style={styles.measurableBox}>
              <Text style={styles.boxTitle}>What counts as progress?</Text>
              <View style={styles.goalOptions}>
                {(
                  [
                    {
                      value: "up",
                      label: "At least",
                      hint: "Reach or exceed a target"
                    },
                    {
                      value: "down",
                      label: "At most",
                      hint: "Stay below a limit"
                    },
                    {
                      value: "range",
                      label: "In a range",
                      hint: "Stay between two values"
                    },
                    {
                      value: "record",
                      label: "Just record",
                      hint: "Any entry counts"
                    }
                  ] as const
                ).map((option) => {
                  const selected = selectedGoal === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      accessibilityHint={option.hint}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        hapticLight();
                        setValue("goalDirection", option.value, {
                          shouldValidate: true
                        });
                      }}
                      style={[
                        styles.goalOption,
                        selected && styles.goalOptionSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.goalOptionLabel,
                          selected && styles.goalOptionLabelSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.goalOptionHint}>{option.hint}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.measurableInputsRow}>
                {selectedGoal !== "record" && (
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="target"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label={
                            selectedGoal === "range"
                              ? "MINIMUM"
                              : selectedGoal === "down"
                                ? "LIMIT (OPTIONAL)"
                                : "TARGET (OPTIONAL)"
                          }
                          placeholder="30"
                          keyboardType="decimal-pad"
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          error={errors.target?.message}
                        />
                      )}
                    />
                  </View>
                )}
                {selectedGoal === "range" && (
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="targetMax"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="MAXIMUM"
                          placeholder="60"
                          keyboardType="decimal-pad"
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          error={errors.targetMax?.message}
                        />
                      )}
                    />
                  </View>
                )}
              </View>
              <View style={styles.unitInput}>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Unit"
                        placeholder="mins / pages"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={errors.unit?.message}
                      />
                    )}
                  />
                </View>
              </View>
              {selectedGoal !== "range" && selectedGoal !== "record" && (
                <Text style={styles.measurableHint}>
                  Leave the target blank to count any recorded value.
                </Text>
              )}
            </View>
          )}

          {/* Schedule Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Repeat</Text>
            <View style={styles.scheduleRow}>
              {(["daily", "weekdays", "weekly"] as const).map((cadence) => {
                const isSelected = selectedSchedule === cadence;
                return (
                  <TouchableOpacity
                    key={cadence}
                    accessibilityRole="button"
                    accessibilityLabel={`${cadence} repeat`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      hapticLight();
                      setValue("schedule", cadence);
                    }}
                    style={[
                      styles.scheduleButton,
                      isSelected && styles.scheduleButtonActive
                    ]}
                  >
                    <Calendar
                      size={16}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.scheduleText,
                        isSelected && styles.scheduleTextActive
                      ]}
                    >
                      {cadence.charAt(0).toUpperCase() + cadence.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSchedule === "weekdays" && (
              <>
                <Text style={styles.scheduleHint}>Choose your days</Text>
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map(({ label, value }) => {
                    const selected = selectedWeekdays.includes(value);
                    return (
                      <TouchableOpacity
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          hapticLight();
                          setValue(
                            "weekdays",
                            selected
                              ? selectedWeekdays.filter((day) => day !== value)
                              : [...selectedWeekdays, value].sort(),
                            { shouldValidate: true }
                          );
                        }}
                        style={[
                          styles.weekdayButton,
                          selected && styles.scheduleButtonActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayText,
                            selected && styles.scheduleTextActive
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.weekdays?.message && (
                  <Text style={styles.validationText}>
                    {errors.weekdays.message}
                  </Text>
                )}
              </>
            )}
            {selectedSchedule === "weekly" && (
              <>
                <Text style={styles.scheduleHint}>Times each week</Text>
                <View style={styles.weekdayRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((count) => {
                    const selected = selectedTimesPerWeek === count;
                    return (
                      <TouchableOpacity
                        key={count}
                        accessibilityRole="button"
                        accessibilityLabel={`${count} times per week`}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          hapticLight();
                          setValue("timesPerWeek", count, {
                            shouldValidate: true
                          });
                        }}
                        style={[
                          styles.weekdayButton,
                          selected && styles.scheduleButtonActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayText,
                            selected && styles.scheduleTextActive
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Daily reminder (optional)</Text>
            <View style={styles.reminderRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  reminderTime
                    ? `Change reminder at ${reminderTime}`
                    : "Set daily reminder"
                }
                onPress={() => void openReminderPicker()}
                style={styles.reminderButton}
              >
                <Bell
                  size={18}
                  color={reminderTime ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.reminderText}>
                  {reminderTime
                    ? new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit"
                      }).format(pickerValue)
                    : "Set a time"}
                </Text>
              </TouchableOpacity>
              {reminderTime && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Remove daily reminder"
                  onPress={() => {
                    setReminderTime(null);
                    setShowTimePicker(false);
                  }}
                  style={styles.removeReminderButton}
                >
                  <Text style={styles.removeReminderText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.reminderHint}>
              A notification on this device at your chosen time.
            </Text>
            {showTimePicker && (
              <View style={styles.pickerArea}>
                <DateTimePicker
                  value={pickerValue}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowTimePicker(false);
                    if (event.type !== "set" || !selectedDate) return;
                    const hour = selectedDate
                      .getHours()
                      .toString()
                      .padStart(2, "0");
                    const minute = selectedDate
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");
                    setReminderTime(`${hour}:${minute}`);
                  }}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Done choosing reminder time"
                    onPress={() => setShowTimePicker(false)}
                    style={styles.pickerDoneButton}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Color Tag Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorsRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    accessibilityRole="button"
                    accessibilityLabel={`${color} habit color`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      hapticLight();
                      setValue("color", color);
                    }}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      isSelected && styles.colorCircleActive
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          {errorMessage && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          <Button
            title={
              createMutation.isPending
                ? "Saving..."
                : editId
                  ? "Save changes"
                  : "Create habit"
            }
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            fullWidth
            size="lg"
            style={styles.createButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  keyboardContainer: {
    flex: 1
  },
  loadingIndicator: {
    flex: 1
  },
  loadError: {
    flex: 1,
    justifyContent: "center",
    gap: SPACING.md,
    padding: SPACING.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    ...TYPOGRAPHY.title2
  },
  formScroll: {
    flex: 1
  },
  formContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)"
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger
  },
  section: {
    marginBottom: SPACING.lg
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginBottom: SPACING.sm
  },
  typeRow: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    gap: 6
  },
  typeButtonActive: {
    backgroundColor: COLORS.surfaceElevated
  },
  typeButtonTextGroup: {
    flex: 1
  },
  typeButtonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text
  },
  typeButtonTitleActive: {
    color: COLORS.primary
  },
  typeButtonDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm
  },
  measurableBox: {
    marginBottom: SPACING.lg
  },
  goalOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  goalOption: {
    width: "48%",
    minHeight: 62,
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface
  },
  goalOptionSelected: {
    backgroundColor: COLORS.primaryLight
  },
  goalOptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text
  },
  goalOptionLabelSelected: {
    color: COLORS.primary
  },
  goalOptionHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2
  },
  boxTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginBottom: SPACING.sm
  },
  measurableInputsRow: {
    flexDirection: "row",
    gap: SPACING.md
  },
  unitInput: {
    marginTop: SPACING.sm
  },
  measurableHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm
  },
  scheduleRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    gap: 6
  },
  scheduleButtonActive: {
    backgroundColor: COLORS.primaryLight
  },
  scheduleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  scheduleTextActive: {
    color: COLORS.primary,
    fontWeight: "700"
  },
  scheduleHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 4
  },
  weekdayButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  validationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: SPACING.sm
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm
  },
  reminderButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card
  },
  reminderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text
  },
  removeReminderButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: SPACING.sm
  },
  removeReminderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  reminderHint: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm
  },
  pickerArea: {
    marginTop: SPACING.sm
  },
  pickerDoneButton: {
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: SPACING.md
  },
  pickerDoneText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "700"
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: COLORS.white
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background
  },
  createButton: { marginTop: 0 }
});
