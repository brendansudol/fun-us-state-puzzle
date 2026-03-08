import { APP_TIMEZONE } from "@/lib/constants";

function toDateParts(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function toUtcTimestamp(dateString: string) {
  const { year, month, day } = toDateParts(dateString);
  return Date.UTC(year, month - 1, day);
}

export function isDateString(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getAppDateString(inputDate = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(inputDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to derive app date string.");
  }

  return `${year}-${month}-${day}`;
}

export function daysBetween(startDateString: string, endDateString: string): number {
  return Math.round((toUtcTimestamp(endDateString) - toUtcTimestamp(startDateString)) / 86_400_000);
}

export function addDays(dateString: string, days: number): string {
  const timestamp = toUtcTimestamp(dateString);
  return getAppDateString(new Date(timestamp + days * 86_400_000));
}

export function isPreviousDay(previousDateString: string, nextDateString: string): boolean {
  return daysBetween(previousDateString, nextDateString) === 1;
}
