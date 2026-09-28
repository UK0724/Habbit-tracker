import { useState } from "react";

import { cn } from "../../../shared/lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import { useAvatar } from "../avatar";

/** Round profile photo, falling back to the email initial. Decorative by default. */
export const UserAvatar = ({
  className,
  textClassName,
  alt = ""
}: {
  className?: string;
  textClassName?: string;
  alt?: string;
}) => {
  const email = useAuthStore((s) => s.user?.email);
  const { data: avatar } = useAvatar(Boolean(email));
  const [failed, setFailed] = useState<string | null>(null);
  const initial = email?.[0]?.toUpperCase() ?? "U";
  const showPhoto = Boolean(avatar) && failed !== avatar;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-accent via-violet-600 to-fuchsia-500 font-black text-white shadow-sm",
        className
      )}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
    >
      {showPhoto ? (
        <img
          src={avatar as string}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(avatar ?? null)}
        />
      ) : (
        <span className={textClassName}>{initial}</span>
      )}
    </span>
  );
};
