import { clsx, type ClassValue } from "clsx"
import { Timestamp } from "firebase/firestore"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function timestampToDate(timestamp: Timestamp) {
  return timestamp.toDate()
}

export function dateToTimestamp(date: Date) {
  return Timestamp.fromDate(date)
}