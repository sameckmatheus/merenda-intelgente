"use server";

import {
  suggestAlternativeMenus,
  SuggestAlternativeMenusInput,
  SuggestAlternativeMenusOutput,
} from "@/ai/flows/suggest-alternative-menus";

/**
 * A server action to get menu suggestions from the AI model.
 *
 * @param input The input data for the AI flow.
 * @returns A promise that resolves to the AI's suggestions.
 */
export async function getSuggestions(
  input: SuggestAlternativeMenusInput
): Promise<SuggestAlternativeMenusOutput> {
  try {
    const suggestions = await suggestAlternativeMenus(input);
    if (!suggestions) {
      throw new Error("AI did not return a response.");
    }
    return suggestions;
  } catch (error) {
    console.error("Error in getSuggestions action:", error);
    // Re-throw the error to be caught by the client
    throw new Error("Failed to get suggestions from AI.");
  }
}
