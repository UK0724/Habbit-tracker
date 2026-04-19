import { clsx } from "clsx";
export const cn = (...inputs) => clsx(inputs);
export const formatValueWithUnit = (value, unit) => {
    const formattedValue = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(value);
    if (!unit) {
        return formattedValue;
    }
    if (["₹", "$", "€", "£", "¥"].includes(unit)) {
        return `${unit}${formattedValue}`;
    }
    return `${formattedValue} ${unit}`;
};
