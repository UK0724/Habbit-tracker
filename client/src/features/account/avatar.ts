import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../../services/api";

export const AVATAR_QUERY_KEY = ["avatar"] as const;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

const AVATAR_SIZE = 256;
/** Keep the JSON body comfortably under the server's 100 KB limit. */
const MAX_DATA_URL_CHARS = 85_000;
const HARD_LIMIT_CHARS = 98_000;
/** Refuse absurdly large source files before decoding them. */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(AVATAR_ACCEPT.split(","));

type AvatarResponse = { avatar: string | null };

export const getAvatar = () => apiRequest<AvatarResponse>("/account/avatar");

export const putAvatar = (image: string) =>
  apiRequest<AvatarResponse>("/account/avatar", {
    method: "PUT",
    body: JSON.stringify({ image })
  });

export const deleteAvatar = () =>
  apiRequest<AvatarResponse>("/account/avatar", { method: "DELETE" });

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    image.src = url;
  });

/**
 * Center-crop to a square, resize to 256×256 and export as JPEG
 * (quality 0.8, or 0.6 when the result is still too large).
 */
export const prepareAvatar = async (file: File): Promise<string> => {
  if (!ACCEPTED_TYPES.has(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("That image is too large. Choose one under 20 MB.");

  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error("That file couldn't be read as an image.");

  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this image.");
  // JPEG has no transparency: paint a white backdrop for PNG/WebP cut-outs.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );

  let dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  if (dataUrl.length > MAX_DATA_URL_CHARS)
    dataUrl = canvas.toDataURL("image/jpeg", 0.6);
  if (!dataUrl.startsWith("data:image/jpeg"))
    throw new Error("Your browser couldn't process this image.");
  if (dataUrl.length > HARD_LIMIT_CHARS)
    throw new Error("That photo is too detailed to upload. Try another one.");
  return dataUrl;
};

export const useAvatar = (enabled = true) =>
  useQuery({
    queryKey: AVATAR_QUERY_KEY,
    queryFn: getAvatar,
    select: (data) => data?.avatar ?? null,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled
  });

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => putAvatar(await prepareAvatar(file)),
    onSuccess: async (data) => {
      queryClient.setQueryData<AvatarResponse>(AVATAR_QUERY_KEY, {
        avatar: data?.avatar ?? null
      });
      await queryClient.invalidateQueries({ queryKey: AVATAR_QUERY_KEY });
    }
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvatar,
    onSuccess: async () => {
      queryClient.setQueryData<AvatarResponse>(AVATAR_QUERY_KEY, {
        avatar: null
      });
      await queryClient.invalidateQueries({ queryKey: AVATAR_QUERY_KEY });
    }
  });
};
