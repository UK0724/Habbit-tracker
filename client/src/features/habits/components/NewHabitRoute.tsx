import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useCreateHabitModalStore } from "../stores/createHabitModalStore";

/** Old /habits/new links open the create-habit dialog over the habits list. */
export const NewHabitRoute = () => {
  const open = useCreateHabitModalStore((s) => s.open);
  useEffect(() => {
    open();
  }, [open]);
  return <Navigate to="/habits" replace />;
};
