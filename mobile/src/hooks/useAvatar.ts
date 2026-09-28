import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

/** Cached with the rest of the user's data; queryClient.clear() on sign-out drops it. */
export const AVATAR_QUERY_KEY = ["avatar"] as const;

export const fetchAvatar = async () => (await accountApi.getAvatar())?.avatar ?? null;

/** The profile photo as a data URL, or null (signed in only). */
export const useAvatar = () => {
  const signedIn = useAuthStore((state) => Boolean(state.token));
  return useQuery<string | null>({
    queryKey: AVATAR_QUERY_KEY,
    queryFn: fetchAvatar,
    enabled: signedIn,
    staleTime: 5 * 60 * 1000
  });
};

export const useSetAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: string) => accountApi.setAvatar(image),
    onMutate: () => ({ userId: useAuthStore.getState().user?.id }),
    onSuccess: (data, _image, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      queryClient.setQueryData<string | null>(AVATAR_QUERY_KEY, data?.avatar ?? null);
      void queryClient.invalidateQueries({ queryKey: AVATAR_QUERY_KEY });
    }
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => accountApi.removeAvatar(),
    onMutate: () => ({ userId: useAuthStore.getState().user?.id }),
    onSuccess: (_data, _vars, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      queryClient.setQueryData<string | null>(AVATAR_QUERY_KEY, null);
      void queryClient.invalidateQueries({ queryKey: AVATAR_QUERY_KEY });
    }
  });
};
