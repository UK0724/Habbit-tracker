import { CreateHabitModal } from "./CreateHabitModal";
import { useCreateHabitModalStore } from "../stores/createHabitModalStore";

export const CreateHabitGlobalModal = () => {
  const { isOpen, defaultValues, onSuccess, close } =
    useCreateHabitModalStore();

  return (
    <CreateHabitModal
      isOpen={isOpen}
      onClose={close}
      defaultValues={defaultValues}
      onSuccess={onSuccess}
    />
  );
};
