export type JourneyLevel = "beginner" | "intermediate" | "advanced";
export type JourneyStep = { title: string; goal: string; topics: readonly string[]; milestone: string };
export type Journey = {
  level: JourneyLevel; title: string; audience: string; summary: string; outcome: string;
  steps: readonly JourneyStep[]; practiceQuery: string;
  competitionSlugs: readonly string[];
};

// Structured editorial content; not AI-generated personalization or saved progress.
export const journeys: readonly Journey[] = [
  {
    level: "beginner", title: "Beginner", audience: "I am new to Python or machine learning.",
    summary: "Build the foundations before your first model.", outcome: "Write a small Python program and explain how a model learns from examples.",
    practiceQuery: "Machine Learning", competitionSlugs: ["ioai-2026", "apoai-2026"],
    steps: [
      { title: "Write your first Python programs", goal: "Use variables, conditions, loops, functions and collections to solve small tasks.", topics: ["python-fundamentals", "python-control-flow", "python-functions", "python-collections"], milestone: "Write a function that computes a list’s mean; test it on a one-item list and explain what should happen for an empty list." },
      { title: "Get comfortable with the mathematics", goal: "Review algebra, functions, vectors and simple probabilities. Start with the prerequisite guide; MIT lectures are optional deeper reading.", topics: ["algebra", "math-functions", "vectors", "basic-probability"], milestone: "Describe a sample as a vector of features and calculate a simple event probability without a model." },
      { title: "Solve a small algorithmic problem", goal: "Compare straightforward search and sorting approaches. You do not need to finish an entire university algorithms course.", topics: ["sorting-searching", "complexity"], milestone: "Search a list, sort it, and explain why larger inputs require more work." },
      { title: "Understand your first ML task", goal: "Identify features and labels, distinguish regression from classification, and explain why test data must be separate.", topics: ["ml-fundamentals", "supervised-learning", "model-evaluation"], milestone: "Choose a prediction task and write down its inputs, target and evaluation metric before training anything." },
    ],
  },
  {
    level: "intermediate", title: "Intermediate", audience: "I can write Python and want to build reliable models.",
    summary: "Turn data into a reproducible classical ML baseline.", outcome: "Train and evaluate a baseline without leaking validation data.",
    practiceQuery: "Machine Learning", competitionSlugs: ["ioai-2025", "ioai-2026", "neoai-2026"],
    steps: [
      { title: "Work with numerical and tabular data", goal: "Use arrays and data frames; inspect columns, shapes and missing values before modelling.", topics: ["numpy", "pandas", "descriptive-statistics"], milestone: "Load a table, report its shape and missing values, and compute a summary for one numeric column." },
      { title: "Prepare data deliberately", goal: "Create repeatable cleaning and feature transformations; fit preprocessing only on training data.", topics: ["data-processing", "data-cleaning", "exploratory-analysis", "feature-engineering"], milestone: "Explain each transformation and put preprocessing and modelling into a repeatable pipeline." },
      { title: "Build a classical model", goal: "Choose regression or classification, train a simple reference model, and use the task’s metric.", topics: ["regression", "classification", "building-baselines", "model-evaluation"], milestone: "Reproduce one official scikit-learn example and compare the model with a trivial baseline." },
      { title: "Validate before competing", goal: "Use separated folds, recognize leakage and keep validation results comparable.", topics: ["cross-validation", "data-leakage", "validation-strategies"], milestone: "Record the split, random seed, preprocessing and validation score so another run can reproduce your result." },
    ],
  },
  {
    level: "advanced", title: "Advanced", audience: "I have trained models and want olympiad-oriented practice.",
    summary: "Experiment carefully, study official tasks and upsolve.", outcome: "Explain your experiments and improve a solution using trustworthy evaluation.",
    practiceQuery: "", competitionSlugs: ["ioai-2026", "euroai-2026", "apoai-2026"],
    steps: [
      { title: "Make evaluation match the task", goal: "Choose an appropriate validation strategy and audit features for information unavailable at prediction time.", topics: ["validation-strategies", "data-leakage", "model-evaluation"], milestone: "Justify your split and metric, then list at least two ways the task could leak information." },
      { title: "Build a trainable representation", goal: "Understand tensors and neural-network training; select deep learning only when the task and constraints justify it.", topics: ["neural-networks", "pytorch", "training-regularization"], milestone: "Reproduce a PyTorch training loop and distinguish training loss from held-out performance." },
      { title: "Run controlled experiments", goal: "Compare changes one at a time, track configurations, and tune without treating the test set as validation.", topics: ["experiment-tracking", "hyperparameter-tuning", "ensemble-methods"], milestone: "Keep an experiment table containing hypotheses, settings and validation outcomes; explain a rejected change as well as a successful one." },
      { title: "Study, solve and upsolve", goal: "Use source-authoritative tasks, start with a baseline and review what an official metric actually measures.", topics: ["building-baselines", "model-evaluation"], milestone: "Write a short solution review: baseline, validation choice, experiments, remaining weaknesses and what you would try next." },
    ],
  },
];

export function getJourney(level: string): Journey | undefined { return journeys.find(path => path.level === level); }
export function journeysForTopic(id: string): readonly Journey[] { return journeys.filter(path => path.steps.some(step => step.topics.includes(id))); }

// Editorial category suggestions only, never pretend these are stored topic links.
const categoryTopics: Readonly<Record<string, readonly string[]>> = {
  "Machine Learning": ["ml-fundamentals", "building-baselines", "model-evaluation"],
  "Computer Vision": ["image-processing", "image-classification", "convolutional-networks"],
  NLP: ["text-processing", "embeddings", "model-evaluation"], LLM: ["transformers", "llm-fundamentals", "model-evaluation"],
  Algorithms: ["complexity", "sorting-searching", "data-structures"],
};
export function preparationTopics(category: string): readonly string[] { return Object.hasOwn(categoryTopics, category) ? categoryTopics[category] : []; }
