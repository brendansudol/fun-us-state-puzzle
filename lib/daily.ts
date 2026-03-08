import { DAILY_EPOCH, INCLUDED_STATES } from "@/lib/constants";
import { daysBetween } from "@/lib/date";
import type { StateCode } from "@/lib/types";

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function seededShuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function getDailyTargetCode(dateString: string): StateCode {
  const dayIndex = daysBetween(DAILY_EPOCH, dateString);
  const cycleLength = INCLUDED_STATES.length;
  const cycleIndex = Math.floor(dayIndex / cycleLength);
  const slotIndex = mod(dayIndex, cycleLength);
  const seed = fnv1a32(`state-puzzle|v1|${cycleIndex}`);
  const order = seededShuffle([...INCLUDED_STATES], mulberry32(seed));

  return order[slotIndex];
}

export function getDailyPuzzleNumber(dateString: string): number {
  return daysBetween(DAILY_EPOCH, dateString) + 1;
}
