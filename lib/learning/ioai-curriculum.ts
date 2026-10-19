import sourceTopics from "@/content/learning/source-topics.json";
import { getTopicBySlug } from "./curriculum";
import { courseFor, lessonHref } from "./course";
import { journeys, type JourneyLevel } from "./journeys";

export const syllabus = {
  title: "IOAI 2026 syllabus",
  href: "https://ioai-official.org/wp-content/uploads/2025/10/Syllabus.pdf",
  checkedAt: "2026-10-18",
  note: "Official Theory / Practice / Both categories checked against pages 2–3. KAIZ levels and preparation topics are editorial, not official IOAI stages.",
} as const;
export type IoaiTopic = {
  id: string; title: string; topicIds: readonly string[];
  mode: "Theory" | "Practice" | "Both" | "Preparation";
  scope: "ioai-2026" | "preparation";
};
export type IoaiLevel = {
  number: number; title: string; summary: string; readiness: string;
  coverage: string; materialIds: readonly string[]; topics: readonly IoaiTopic[];
};
// Reuse the shared 64-entry source inventory; don't introduce another topic registry.
// Maths rows are supporting preparation, not an official IOAI theory classification.
function sourceLevel(cell: string, group: string): number {
  if (cell === "B9") return 1;
  if (["B11", "B12", "B14", "B37"].includes(cell)) return 2;
  if (cell === "B33") return 6;
  if (["B16"].includes(cell) || ["Supervised Learning", "Unsupervised Learning", "Data Science Fundamentals"].includes(group)) return 3;
  if (cell === "B55") return 5;
  if (["B17", "B18", "B19", "B56"].includes(cell) || ["Neural Networks", "Deep Learning"].includes(group)) return 4;
  return 5;
}
const mappedTopics: (IoaiTopic & { level: number })[] = sourceTopics.topics.filter(t => t.group !== "Math").map(t => ({
  id: t.id, title: t.title.replace(" *", ""), topicIds: t.topicIds,
  mode: t.mode as "Theory" | "Practice" | "Both", scope: "ioai-2026", level: sourceLevel(t.cell, t.group),
}));
function preparation(id: string, title: string, topicIds: readonly string[], level: number) {
  mappedTopics.push({ id, title, topicIds, level, mode: "Preparation", scope: "preparation" });
}
preparation("support-functions", "Functions and data structures", ["python-functions", "python-collections"], 1);
preparation("support-algebra", "Basic algebra and functions", ["algebra", "math-functions"], 1);
preparation("support-logic", "Logic and combinatorics", ["logic", "combinatorics"], 1);
preparation("support-probability", "Basic probability", ["basic-probability"], 1);
preparation("support-programming", "Introductory programming problems", ["python-control-flow"], 1);
preparation("support-statistics", "Mean, variance and basic statistics", ["descriptive-statistics"], 2);
preparation("support-linear", "Vectors and matrices", ["vectors", "matrices"], 2);
preparation("support-analysis", "Explore a dataset", ["exploratory-analysis"], 2);
preparation("support-cleaning", "Data cleaning and missing values", ["data-cleaning"], 2);
preparation("support-calculus", "Derivatives for training intuition", ["derivatives", "chain-rule"], 4);
preparation("support-transfer", "Transfer learning", ["training-regularization"], 5);
preparation("support-baseline", "Competition strategy and baselines", ["building-baselines"], 6);
preparation("support-validation", "Validation and leakage", ["validation-strategies", "data-leakage"], 6);
preparation("support-experiments", "Experiment tracking and error analysis", ["experiment-tracking", "model-evaluation"], 6);
preparation("support-ensemble", "Controlled ensembling", ["ensemble-methods"], 6);
preparation("support-timed", "Past IOAI problems and timed upsolving", ["building-baselines"], 6);

const levels = [
  { number: 1, title: "Foundations", summary: "Write small Python programs, with school maths alongside.", readiness: "Write a function over a list and explain an experimental probability.", coverage: "Guided Python steps ready · supporting maths references", materialIds: ["python-intro", "python-flow"] },
  { number: 2, title: "Working with Data", summary: "Turn arrays and tables into questions you can investigate.", readiness: "Inspect, clean and summarize a small table without guessing what missing values mean.", coverage: "Guided NumPy, Pandas and analysis steps ready", materialIds: ["numpy-basics", "numpy-100", "pandas-subset", "pandas-summary", "pandas-plots", "mit-linear", "stat110"] },
  { number: 3, title: "Classical Machine Learning", summary: "Fit a first model, then compare methods with reliable evaluation.", readiness: "Reproduce a held-out comparison with a baseline and explain why test data stays separate.", coverage: "First-model project ready · wider methods are a curriculum preview", materialIds: ["sklearn-start", "iris-data", "google-ml", "sklearn-pitfalls", "mml-book"] },
  { number: 4, title: "Deep Learning", summary: "Understand trainable networks and work with tensors.", readiness: "Explain a loss, follow gradients and reproduce a small train/evaluate loop.", coverage: "Existing selected materials retained · complete guided sequence upcoming", materialIds: ["pytorch-basics", "micrograd", "mit-calculus"] },
  { number: 5, title: "AI Specializations", summary: "Choose vision, language or audio after the core ML workflow.", readiness: "Adapt a relevant model and justify its evaluation. Audio and several vision topics still need KAIZ lessons.", coverage: "Advanced resource previews · several topics have no dedicated KAIZ lesson", materialIds: ["cs231n", "cs224n", "ysda-nlp"] },
  { number: 6, title: "IOAI Preparation", summary: "Build baselines, investigate errors and practise under constraints.", readiness: "Write an experiment log and upsolve an official task with a justified split and metric.", coverage: "Existing preparation lessons and organizer tasks · timed coaching upcoming", materialIds: ["ioai-tasks", "sklearn-pitfalls"] },
] as const;
export const ioaiLevels: readonly IoaiLevel[] = levels.map(level => ({ ...level, topics: mappedTopics.filter(t => t.level === level.number) }));

export const startingProfiles: readonly { id: JourneyLevel; startLevel: number; startTopic: string; reason: string; skipAdvice: string }[] = [
  { id: "beginner", startLevel: 1, startTopic: "python-fundamentals", reason: "Start with a small Python program. Learn only the maths needed for the next task.", skipAdvice: "Strong at school maths? Skip the algebra review and begin with Python practice when ready." },
  { id: "intermediate", startLevel: 2, startTopic: "numpy", reason: "Comfortable with Python and school maths? Begin with arrays, tables and a first model.", skipAdvice: "Already handle tables confidently? Jump directly to the first ML model; review maths as needed." },
  { id: "advanced", startLevel: 6, startTopic: "validation-strategies", reason: "Have ML experience? Focus on validation, controlled experiments and official tasks.", skipAdvice: "Use the six levels to fill specific gaps. Earlier topics remain open." },
];
export function topicDestination(topicId: string, preferred?: JourneyLevel): string | undefined {
  const paths = preferred ? [...journeys.filter(j => j.level === preferred), ...journeys.filter(j => j.level !== preferred)] : journeys;
  for (const path of paths) {
    const lesson = courseFor(path).flatMap(unit => unit.lessons).find(item => item.topic.id === topicId);
    if (lesson) return lessonHref(path.level, lesson.id);
  }
  const topic = getTopicBySlug(topicId);
  return topic ? `/learn/${topic.slug}` : undefined;
}
