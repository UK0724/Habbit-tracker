const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => value.toString().padStart(2, "0");

const parseDateParts = (value: string): [number, number, number] => {
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  return [year, month, day];
};

export const formatDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const isValidDateString = (value: string) => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = parseDateParts(value);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
};

export const dateStringSchemaMessage =
  "Date must be in valid YYYY-MM-DD format";

export const parseDateStringToUtc = (value: string) => {
  const [year, month, day] = parseDateParts(value);
  return new Date(Date.UTC(year, month - 1, day));
};

export const addDaysToDateString = (value: string, offset: number) => {
  const date = parseDateStringToUtc(value);
  date.setUTCDate(date.getUTCDate() + offset);

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
};

export const getTodayDateString = () => formatDateString(new Date());
