import React, { useEffect, useRef, useState } from "react";
import { Switch, type TextInput } from "react-native";
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
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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
import { errorMessage as describeError, habitApi, habitLogApi } from "../../../src/services/api";
import {
  hapticSuccess,
  hapticLight,
  hapticError
} from "../../../src/utils/haptics";
import { parseNumberInput } from "../../../src/utils/format";
import type { HabitType } from "@habit-tracker/shared";
import { requestNotificationPermissions } from "../../../src/services/notifications";

const COLOR_OPTIONS = [
  { value: "#6366F1", name: "Indigo" },
  { value: "#10B981", name: "Emerald" },
  { value: "#F59E0B", name: "Amber" },
  { value: "#EC4899", name: "Pink" },
  { value: "#06B6D4", name: "Cyan" },
  { value: "#8B5CF6", name: "Violet" },
  { value: "#EF4444", name: "Red" },
  { value: "#14B8A6", name: "Teal" }
];
const COLOR_PALETTE = COLOR_OPTIONS.map((option) => option.value);
/** Form fields in screen order, for jumping to the first error. */
const FIELD_ORDER = ["title", "description", "target", "targetMax", "unit", "weekdays"] as const;
const WEB_APP_HOST = "habbit.abuk.in";
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    color: z.string().default("#6366F1"),
    requireCompletionComment: z.boolean().default(false)
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
    // Same parsing as the payload: "2,5" and "10,000" are understood.
    const target = hasTarget ? parseNumberInput(value.target ?? "") : null;
    if (
      value.goalDirection !== "record" &&
      hasTarget &&
      target === null
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target"],
        message: "Enter a valid number"
      });
    if (value.goalDirection === "range") {
      const max = value.targetMax?.trim() ? parseNumberInput(value.targetMax) : null;
      if (
        target === null ||
        max === null ||
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
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const titleRef = useRef<TextInput>(null);
  const unitRef = useRef<TextInput>(null);
  const targetRef = useRef<TextInput>(null);
  const targetMaxRef = useRef<TextInput>(null);
  const allowLeave = useRef(false);
  const [initialReminder, setInitialReminder] = useState<string | null>(null);
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
  // The unit is locked once entries exist, so old values keep their meaning.
  // Until the check succeeds (loading or failed) the unit stays locked too.
  const existingLogsQuery = useQuery({
    queryKey: ["habitLogs", editId, "any"],
    queryFn: () => habitLogApi.list(editId as string, 1),
    enabled: Boolean(editId) && editingHabit?.type === "measurable"
  });
  const unitLocked =
    Boolean(editId) &&
    !(existingLogsQuery.isSuccess && existingLogsQuery.data.length === 0);
  const unitLockHint = !unitLocked
    ? undefined
    : existingLogsQuery.isSuccess
      ? "The unit can't change once you've logged entries."
      : existingLogsQuery.isError
        ? "Couldn't check your entries, so the unit can't be changed right now."
        : "Checking your entries…";

  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isDirty }
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
      color: COLOR_PALETTE[0],
      requireCompletionComment: false
    }
  });

  const selectedType = watch("type");
  const selectedGoal = watch("goalDirection");
  const selectedSchedule = watch("schedule");
  const selectedColor = watch("color");
  const selectedWeekdays = watch("weekdays");
  const selectedTimesPerWeek = watch("timesPerWeek");
  const requireNote = watch("requireCompletionComment");
  const hasChanges = isDirty || reminderTime !== initialReminder;

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
      color: editingHabit.color,
      requireCompletionComment: Boolean(editingHabit.requireCompletionComment)
    });
    setReminderTime(editingHabit.reminderTime || null);
    setInitialReminder(editingHabit.reminderTime || null);
  }, [editingHabit, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      const targetNum =
        values.type === "measurable" &&
        values.goalDirection !== "record" &&
        values.target?.trim()
          ? parseNumberInput(values.target)
          : null;
      const targetMax =
        values.type === "measurable" &&
        values.goalDirection === "range" &&
        values.targetMax?.trim()
          ? parseNumberInput(values.targetMax)
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
        // Round-trip the setting; only action habits offer the toggle.
        requireCompletionComment:
          values.type === "action"
            ? values.requireCompletionComment
            : Boolean(editingHabit?.requireCompletionComment)
      };
      return editId
        ? habitApi.update(editId, payload)
        : habitApi.create(payload);
    },
    onSuccess: async () => {
      await hapticSuccess();
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      // The first habit starts the check-in streak server-side (Day 1).
      void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
      if (editId) {
        await queryClient.invalidateQueries({ queryKey: ["habit", editId] });
        await queryClient.invalidateQueries({
          queryKey: ["habitStats", editId]
        });
      }
      allowLeave.current = true;
      router.back();
    },
    onError: (err: Error) => {
      hapticError();
      setErrorMessage(
        describeError(
          err,
          editId
            ? "Couldn't save your changes. Please try again."
            : "Couldn't create the habit. Please try again."
        )
      );
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

  // Confirm before leaving with unsaved edits (back button, gesture or header).
  const leaveGuard = useRef({ hasChanges, pending: false });
  leaveGuard.current = { hasChanges, pending: createMutation.isPending };
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        const { hasChanges: dirty, pending } = leaveGuard.current;
        if (allowLeave.current || !dirty || pending) return;
        event.preventDefault();
        Alert.alert("Discard changes?", "Your changes to this habit haven't been saved.", [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              allowLeave.current = true;
              navigation.dispatch(event.data.action);
            }
          }
        ]);
      }),
    [navigation]
  );

  const onInvalid = (formErrors: Partial<Record<keyof HabitFormValues, unknown>>) => {
    void hapticError();
    const first = FIELD_ORDER.find((field) => formErrors[field]);
    if (!first) return;
    const y = fieldY.current[first];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    const refs: Partial<Record<string, React.RefObject<TextInput>>> = {
      title: titleRef,
      unit: unitRef,
      target: targetRef,
      targetMax: targetMaxRef
    };
    setTimeout(() => refs[first]?.current?.focus(), 250);
  };

  /** Records a field's y offset within the scroll content. */
  const trackY = (field: string, offset = 0) => (event: { nativeEvent: { layout: { y: number } } }) => {
    fieldY.current[field] = event.nativeEvent.layout.y + offset;
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
                ? `Expense habits are edited on the web at ${WEB_APP_HOST}.`
                : describeError(editingError, "This habit couldn't be found. It may have been deleted.")}
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
          >
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editId ? "Edit habit" : "New habit"}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View onLayout={trackY("title")}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={titleRef}
                label="Title"
                returnKeyType="next"
                maxLength={100}
                placeholder="e.g. Read 20 Pages, Morning Workout..."
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />
          </View>

          {/* Description Input */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description (optional)"
                maxLength={280}
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
                accessibilityHint={editId ? "Type can't change after creation" : undefined}
                style={[
                  styles.typeButton,
                  selectedType === "action" && styles.typeButtonActive,
                  Boolean(editId) && selectedType !== "action" && styles.typeButtonLocked
                ]}
                onPress={() => {
                  hapticLight();
                  setValue("type", "action", { shouldDirty: true });
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
                accessibilityHint={editId ? "Type can't change after creation" : undefined}
                style={[
                  styles.typeButton,
                  selectedType === "measurable" && styles.typeButtonActive,
                  Boolean(editId) && selectedType !== "measurable" && styles.typeButtonLocked
                ]}
                onPress={() => {
                  hapticLight();
                  setValue("type", "measurable", { shouldDirty: true });
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

          {selectedType === "action" && (
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Require a note to complete</Text>
                <Text style={styles.toggleHint}>
                  You'll add a short note each time you check it off.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Require a note to complete"
                value={requireNote}
                onValueChange={(value) => {
                  hapticLight();
                  setValue("requireCompletionComment", value, { shouldDirty: true });
                }}
                trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          )}

          {/* Measurable specific fields */}
          {selectedType === "measurable" && (
            <View style={styles.measurableBox} onLayout={trackY("measurableBox")}>
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
                          shouldValidate: true,
                          shouldDirty: true
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
              <View
                style={styles.measurableInputsRow}
                onLayout={(event) => {
                  const base = fieldY.current.measurableBox ?? 0;
                  fieldY.current.target = base + event.nativeEvent.layout.y;
                  fieldY.current.targetMax = base + event.nativeEvent.layout.y;
                }}
              >
                {selectedGoal !== "record" && (
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name="target"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          ref={targetRef}
                          label={
                            selectedGoal === "range"
                              ? "Minimum"
                              : selectedGoal === "down"
                                ? "Limit (optional)"
                                : "Target (optional)"
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
                          ref={targetMaxRef}
                          label="Maximum"
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
              <View
                style={styles.unitInput}
                onLayout={(event) => {
                  fieldY.current.unit = (fieldY.current.measurableBox ?? 0) + event.nativeEvent.layout.y;
                }}
              >
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        ref={unitRef}
                        label="Unit"
                        placeholder="mins / pages"
                        editable={!unitLocked}
                        helperText={unitLockHint}
                        maxLength={20}
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
          <View style={styles.section} onLayout={trackY("weekdays")}>
            <Text style={styles.sectionLabel}>Repeat</Text>
            <View style={styles.scheduleRow}>
              {(["daily", "weekdays", "weekly"] as const).map((cadence) => {
                const isSelected = selectedSchedule === cadence;
                return (
                  <TouchableOpacity
                    key={cadence}
                    accessibilityRole="button"
                    accessibilityLabel={`Repeat ${cadence === "weekdays" ? "on chosen days" : cadence}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      hapticLight();
                      setValue("schedule", cadence, { shouldDirty: true });
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
                      {cadence === "daily" ? "Daily" : cadence === "weekdays" ? "Some days" : "Weekly"}
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
                        accessibilityLabel={DAY_NAMES[value]}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          hapticLight();
                          setValue(
                            "weekdays",
                            selected
                              ? selectedWeekdays.filter((day) => day !== value)
                              : [...selectedWeekdays, value].sort(),
                            { shouldValidate: true, shouldDirty: true }
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
                            shouldValidate: true,
                            shouldDirty: true
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
              {COLOR_OPTIONS.map(({ value: color, name }) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    accessibilityRole="radio"
                    accessibilityLabel={`${name} color`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      hapticLight();
                      setValue("color", color, { shouldDirty: true });
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
            onPress={handleSubmit(onSubmit, onInvalid)}
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
    borderColor: COLORS.dangerBorder
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dangerText
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
  typeButtonLocked: {
    opacity: 0.4
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 56,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg
  },
  toggleCopy: {
    flex: 1
  },
  toggleTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600"
  },
  toggleHint: {
    ...TYPOGRAPHY.caption,
    marginTop: 2
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
    color: COLORS.primaryText
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
    color: COLORS.primaryText
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
    minHeight: 44,
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
    color: COLORS.primaryText,
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
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card
  },
  weekdayText: {
    fontSize: 12,
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
