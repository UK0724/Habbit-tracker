const pad = (value: number) => value.toString().padStart(2, "0");

const parseDateParts = (value: string): [number, number, number] => {
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  return [year, month, day];
};

export const getTodayDateString = () => {
  const date = new Date();
  const zone =
    localStorage.getItem("pulse-timezone") ||
    localStorage.getItem("arc-timezone") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-CA", {timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
};

export const addDaysToDateString = (value: string, amount: number) => {
  const [year, month, day] = parseDateParts(value);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDateLabel = (value: string) => {
  const [year, month, day] = parseDateParts(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
};

export const formatShortDateLabel = (value: string) => {
  const [year, month, day] = parseDateParts(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(year, month - 1, day));
};

export const isToday = (value: string) => value === getTodayDateString();

/** Current month as YYYY-MM. */
export const getCurrentMonthString = () => getTodayDateString().slice(0, 7);

/** Shift a YYYY-MM month string by a number of months. */
export const shiftMonthString = (month: string, amount: number) => {
  const [year = 0, monthIndex = 1] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

export const formatMonthLabel = (month: string) => {
  const [year = 0, monthIndex = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, monthIndex - 1, 1));
};

export const isCurrentMonth = (month: string) =>
  month === getCurrentMonthString();
