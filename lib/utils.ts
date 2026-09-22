import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function isSameDate(start: string, end: string) {
  return start.slice(0, 10) === end.slice(0, 10);
}

export function formatDateRange(start: string, end: string) {
  return isSameDate(start, end) ? formatDate(start) : `${formatDate(start)} — ${formatDate(end)}`;
}

export function formatCompetitionLocation(city?: string | null, country?: string | null) {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not specified";
}

export function formatCompetitionFormat(format: string) {
  return format ? format[0].toUpperCase() + format.slice(1) : "Not specified";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-KZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
