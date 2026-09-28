import { z } from "zod";

export const ReviewSchema = z.object({
  summary: z.string().describe("Two or three encouraging sentences on how close the player got and the most important thing to fix."),
  issues: z
    .array(
      z.object({
        severity: z.enum(["error", "warning", "tip"]),
        lang: z.enum(["html", "js"]),
        line: z.number().int().nullable().describe("1-based line in the player's code, or null if not tied to a line."),
        problem: z.string(),
        fix: z.string().describe("Concrete fix, with a short code snippet when helpful."),
      }),
    )
    .describe("Most important first. At most 8."),
  betterSolution: z.object({
    html: z.string(),
    js: z.string(),
    explanation: z.string().describe("Why this version is better, as a short bulleted list in plain text."),
  }),
});

export type Review = z.infer<typeof ReviewSchema>;
