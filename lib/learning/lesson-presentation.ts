import type { getCourseLesson } from "./course";
type Lesson = NonNullable<ReturnType<typeof getCourseLesson>>;
// Summaries of existing module goals; no new assessment or completion rule.
const objectives: Readonly<Record<string, readonly string[]>> = {
  "python-algebra": ["Use loops, functions and collections in small Python programs.", "Study basic algebra alongside programming."],
  "arrays-dataframes": ["Work with numerical arrays, then tabular data frames.", "Inspect a table and calculate a useful column summary."],
  "first-baseline": ["Identify features and labels before training a baseline.", "Evaluate a model on a trustworthy held-out split."],
  "training-direction": ["Explain how a loss and gradients guide training.", "Connect a small training example to PyTorch and later CV/NLP study."],
  "numerical-data": ["Inspect column types, shapes and missing values.", "Summarize numerical data before modelling."],
  "prepare-data": ["Make cleaning and feature transformations repeatable.", "Fit preprocessing only on training data."],
  "classical-model": ["Choose regression or classification for the target.", "Compare a reference model with a simple baseline using the task metric."],
  validation: ["Keep folds separate and recognize data leakage.", "Record the split, seed and preprocessing for reproducible comparisons."],
  evaluation: ["Choose validation that matches the task.", "Audit features for information unavailable at prediction time."],
  representation: ["Understand tensors and a neural-network training loop.", "Distinguish training loss from held-out performance."],
  experiments: ["Compare changes one at a time and track settings.", "Tune without treating the test set as validation."],
  upsolving: ["Start from an authoritative task and a baseline.", "Review validation, experiments and remaining weaknesses."],
};
export function lessonPresentation(value: Lesson) {
  return { objectives: [value.lesson.topic.description, ...(objectives[value.module.id] ?? [])],
    sequence: ["Follow the selected materials below in their displayed order.", "Work through the examples or exercises supplied by the original publishers.", "Try the module practice check, then explicitly record your completion."],
    practice: value.module.milestone, provenance: value.module.goal };
}
