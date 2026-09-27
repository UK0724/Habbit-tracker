import { useAuthStore } from "../stores/authStore";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState, useEffect } from "react";

export const AppProviders = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.token !== previous.token) {
          queryClient.clear();
          localStorage.removeItem("pulse-timezone");
          localStorage.removeItem("arc-timezone");
          useHomeDateStore.getState().resetSelectedDate();
        }
      }),
    [queryClient]
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
