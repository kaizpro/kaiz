export const COMPETITION_CATEGORIES = ["Machine Learning", "Computer Vision", "NLP", "LLM", "Algorithms", "Research", "Hackathons"] as const;
export const COMPETITION_FORMATS = ["online", "offline", "hybrid"] as const;
export const COMPETITION_STATUSES = ["upcoming", "active", "completed"] as const;
export const RESULT_SET_STATUSES = ["official", "provisional"] as const;
export const RESULT_SOURCES = ["manual", "official_import", "kaiz", "kaggle"] as const;
export const RESULT_ENTRY_STATUSES = ["ranked", "unranked", "disqualified"] as const;
export const RESULT_PARTICIPANT_TYPES = ["individual", "team"] as const;
export const DISCUSSION_CATEGORIES = ["general", "ai-ml", "olympiads", "resources", "help"] as const;
export const DISCUSSION_CATEGORY_LABELS: Record<(typeof DISCUSSION_CATEGORIES)[number], string> = {
  general: "General",
  "ai-ml": "AI / ML",
  olympiads: "Olympiads",
  resources: "Resources",
  help: "Help",
};
export const RATING_DIVISIONS = [
  { name: "Bronze", min: 0, color: "#b9794b" },
  { name: "Silver", min: 1200, color: "#8b9aac" },
  { name: "Gold", min: 1500, color: "#d6a521" },
  { name: "Diamond", min: 1800, color: "#19b7c9" },
  { name: "Master", min: 2100, color: "#a76cff" },
] as const;

export function divisionFor(rating: number) {
  return [...RATING_DIVISIONS].reverse().find((item) => rating >= item.min) ?? RATING_DIVISIONS[0];
}
