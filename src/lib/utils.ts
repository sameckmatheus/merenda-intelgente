import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SCHOOLS_LIST } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSchoolName(input: string | undefined | null): string | null {
  if (!input) return null;

  // 1. Specific manual overrides (for edge cases not covered by logic)
  if (input.includes('marcosfreiremunicipal')) return 'MARCOS FREIRE';

  // 2. Normalization helper
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const cleanInput = normalize(input);

  // Try to match against official list
  for (const school of SCHOOLS_LIST) {
    const cleanSchool = normalize(school);

    // Exact match of normalized strings
    if (cleanInput === cleanSchool) return school;

    // Check if input starts with school name (e.g. carlosayresmunicipal -> carlosayres)
    if (cleanInput.startsWith(cleanSchool)) return school;

    // Check if school name is contained in input (safer/broader)
    if (cleanInput.includes(cleanSchool)) return school;
  }

  // Fallback: Return null if no match found (caller should handle default)
  return null;
}
