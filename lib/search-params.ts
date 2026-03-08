import { isDateString } from "@/lib/date";

export interface ParsedSearchParams {
  mode: string | null;
  date: string | null;
  target: string | null;
  debug: boolean;
}

export function parseSearchParams(searchParams: Pick<URLSearchParams, "get">): ParsedSearchParams {
  const mode = searchParams.get("mode");
  const date = searchParams.get("date");
  const target = searchParams.get("target");
  const debug = searchParams.get("debug") === "1";

  return {
    mode,
    date: isDateString(date) ? date : null,
    target,
    debug,
  };
}
