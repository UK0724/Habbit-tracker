import { useId, useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ApiError } from "../../../services/api";
import { cn } from "../../../shared/lib/utils";
import {
  AVATAR_ACCEPT,
  useAvatar,
  useRemoveAvatar,
  useUploadAvatar
} from "../avatar";
import { UserAvatar } from "./UserAvatar";

const uploadError = (error: unknown) => {
  if (error instanceof ApiError && error.status === 413)
    return "That photo is too large. Try a smaller one.";
  return error instanceof Error && error.message
    ? error.message
    : "Could not update your photo. Please try again.";
};

/** Profile photo with upload / remove controls. */
export const AvatarUploader = ({
  size = "lg",
  className
}: {
  size?: "md" | "lg";
  className?: string;
}) => {
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: avatar, isLoading } = useAvatar();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const pending = upload.isPending || remove.isPending;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still triggers a change.
    event.target.value = "";
    if (!file) return;
    setMessage(null);
    try {
      await upload.mutateAsync(file);
      setMessage({ tone: "ok", text: "Photo updated." });
    } catch (error) {
      setMessage({ tone: "error", text: uploadError(error) });
    }
  };

  const onRemove = async () => {
    setMessage(null);
    try {
      await remove.mutateAsync();
      setMessage({ tone: "ok", text: "Photo removed." });
    } catch (error) {
      setMessage({ tone: "error", text: uploadError(error) });
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <UserAvatar
        alt={avatar ? "Your profile photo" : "No profile photo"}
        className={size === "lg" ? "h-20 w-20" : "h-14 w-14"}
        textClassName={size === "lg" ? "text-3xl" : "text-xl"}
      />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          {/* Visually hidden input; the button below opens it (keyboard friendly). */}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a profile photo"
            onChange={(event) => void onFile(event)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending || isLoading}
            onClick={() => inputRef.current?.click()}
            aria-describedby={statusId}
            className="gap-2"
          >
            <Camera aria-hidden className="h-4 w-4" />
            {upload.isPending
              ? "Uploading…"
              : avatar
                ? "Change photo"
                : "Upload photo"}
          </Button>
          {avatar ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => void onRemove()}
              className="gap-2"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              {remove.isPending ? "Removing…" : "Remove photo"}
            </Button>
          ) : null}
        </div>
        <p id={statusId} className="text-xs text-content-muted">
          Optional. JPEG, PNG or WebP — cropped to a square.
        </p>
        {message ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={cn(
              "text-xs font-semibold",
              message.tone === "error"
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
};
