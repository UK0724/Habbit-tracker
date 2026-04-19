const pad = (value) => value.toString().padStart(2, "0");
const parseDateParts = (value) => {
    const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
    return [year, month, day];
};
export const getTodayDateString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
export const addDaysToDateString = (value, amount) => {
    const [year, month, day] = parseDateParts(value);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + amount);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
export const formatDateLabel = (value) => {
    const [year, month, day] = parseDateParts(value);
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date(year, month - 1, day));
};
export const formatShortDateLabel = (value) => {
    const [year, month, day] = parseDateParts(value);
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short"
    }).format(new Date(year, month - 1, day));
};
export const isToday = (value) => value === getTodayDateString();
