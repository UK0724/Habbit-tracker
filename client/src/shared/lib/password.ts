/** Same rules the server enforces for register and password reset. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const validateNewPassword = (
  password: string,
  confirm: string
): string | null => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "That password is too long. Use a shorter one.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
};
