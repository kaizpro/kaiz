import type { LearningResource } from "./curriculum";
import { sheetResourcesByTopic } from "./sheet-resources";

// Editorial links, checked against their publishers on 2026-10-14.
// Link original materials; KAIZ does not claim to host or assess these courses.
const article = (id: string, title: string, href: string): LearningResource => ({ id, title, href,
  kind: href.includes("ocw.mit.edu") || id === "google-ml" ? "course" : id === "sklearn-examples" ? "notebook" : "documentation",
  description: href.includes("ocw.mit.edu") ? "Open university course materials for deeper study. Select the relevant section; finishing the entire course is not required by this roadmap." : "Original publisher material. Read the relevant section, then test your understanding with a small example of your own.",
  account: "Public reading; no KAIZ account needed", provenance: "KAIZ editorial selection" });
const pythonIntro = article("python-intro", "Python documentation: your first expressions and programs", "https://docs.python.org/3/tutorial/introduction.html");
const pythonFlow = article("python-flow", "Python documentation: conditions, loops and functions", "https://docs.python.org/3/tutorial/controlflow.html");
const foundations = article("ml-prerequisites", "Google ML Crash Course: mathematics prerequisites and prework", "https://developers.google.com/machine-learning/crash-course/prereqs-and-prework");
const numpy = article("numpy-basics", "NumPy: the absolute basics", "https://numpy.org/doc/stable/user/absolute_beginners.html");
const pandas = article("pandas-tutorials", "pandas: getting-started tutorials", "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html");
const ml = article("google-ml", "Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course");
const metrics = article("sklearn-metrics", "scikit-learn: metrics and scoring", "https://scikit-learn.org/stable/modules/model_evaluation.html");
const validation = article("sklearn-validation", "scikit-learn: cross-validation", "https://scikit-learn.org/stable/modules/cross_validation.html");
const pitfalls = article("sklearn-pitfalls", "scikit-learn: leakage and common pitfalls", "https://scikit-learn.org/stable/common_pitfalls.html");
const pytorch = article("pytorch-basics", "PyTorch: tensors, models and training loops", "https://docs.pytorch.org/tutorials/beginner/basics/intro.html");
const examples = article("sklearn-examples", "scikit-learn: worked examples to reproduce", "https://scikit-learn.org/stable/auto_examples/index.html");

const originalResources: Readonly<Record<string, readonly LearningResource[]>> = {
  "python-fundamentals": [pythonIntro], "python-control-flow": [pythonFlow], "python-functions": [pythonFlow],
  "python-collections": [article("python-collections", "Python documentation: lists, dictionaries and sets", "https://docs.python.org/3/tutorial/datastructures.html")],
  algebra: [foundations], "math-functions": [foundations], "basic-probability": [foundations], "descriptive-statistics": [foundations],
  vectors: [article("mit-linear-algebra", "MIT OpenCourseWare: introductory linear algebra lectures", "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/")],
  "sorting-searching": [article("python-sorting", "Python documentation: sorting techniques", "https://docs.python.org/3/howto/sorting.html")],
  complexity: [article("mit-algorithms", "MIT OpenCourseWare: Introduction to Algorithms", "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/")],
  numpy: [numpy], pandas: [pandas], "data-processing": [pandas], "data-cleaning": [pandas], "exploratory-analysis": [pandas],
  "feature-engineering": [ml], "ml-fundamentals": [ml], "supervised-learning": [ml], regression: [ml], classification: [ml],
  "model-evaluation": [metrics], "cross-validation": [validation], "validation-strategies": [validation], "data-leakage": [pitfalls],
  "building-baselines": [examples], "experiment-tracking": [examples], "neural-networks": [pytorch], pytorch: [pytorch], "training-regularization": [pytorch],
  "ensemble-methods": [article("sklearn-ensembles", "scikit-learn: ensemble methods", "https://scikit-learn.org/stable/modules/ensemble.html")],
  "hyperparameter-tuning": [article("sklearn-tuning", "scikit-learn: tuning model parameters", "https://scikit-learn.org/stable/modules/grid_search.html")],
};

// Preserve existing selections and add source-backed material, deduplicated by URL.
export const resourcesByTopic: Readonly<Record<string, readonly LearningResource[]>> = Object.fromEntries(
  [...new Set([...Object.keys(originalResources), ...Object.keys(sheetResourcesByTopic)])].map(id => [id,
    [...new Map([...(originalResources[id] ?? []), ...(sheetResourcesByTopic[id] ?? [])].map(resource => [resource.href, resource])).values()],
  ]),
);
