import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatValueWithUnit = (value: number, unit?: string) => {
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
