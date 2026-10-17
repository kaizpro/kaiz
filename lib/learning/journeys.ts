export type JourneyLevel = "beginner" | "intermediate" | "advanced";
export type JourneyStep = { id: string; title: string; goal: string; topics: readonly string[]; milestone: string };
export type Journey = {
  level: JourneyLevel; title: string; audience: string; summary: string; outcome: string;
  steps: readonly JourneyStep[]; practiceQuery: string;
  competitionSlugs: readonly string[];
};

// Structured editorial content; not AI-generated personalization or saved progress.
export const journeys: readonly Journey[] = [
  {
    level: "beginner", title: "Beginner", audience: "I am new to Python or machine learning.",
    summary: "Follow the mentor plan from Python to a first ML baseline, with maths alongside.", outcome: "Manipulate a small table, build a first baseline and explain its validation split.",
    practiceQuery: "Machine Learning", competitionSlugs: ["ioai-2026", "apoai-2026"],
    steps: [
      { id: "python-algebra", title: "Python, with algebra alongside", goal: "Source B starts with Python sections 1–8 then 9–16. Use loops, functions and collections; start the separate maths lane with algebra. Stepik is unavailable at the latest check, so the Python documentation and Kaggle course are alternatives.", topics: ["python-fundamentals", "python-control-flow", "python-functions", "python-collections", "algebra"], milestone: "Write a function that computes a list’s mean; test a one-item list and explain what should happen for an empty list." },
      { id: "arrays-dataframes", title: "NumPy, then Pandas", goal: "Follow the plan's array videos and 100 exercises, then data-frame tutorials and Kaggle Pandas. Study limits/calculus in parallel when useful; do not wait to finish university maths before writing code.", topics: ["numpy", "pandas", "math-functions"], milestone: "Load a small table, report its shape and missing values, and compute a column summary using arrays and a data frame." },
      { id: "first-baseline", title: "Build your first ML baseline", goal: "Continue to the selected Andrew Ng videos, Kaggle Intro and Intermediate ML, then the AI Course selection. Identify features, labels and a trustworthy validation split before comparing models.", topics: ["ml-fundamentals", "supervised-learning", "building-baselines", "model-evaluation"], milestone: "Train a simple reference model; record the target, metric and held-out score without using test labels during training." },
      { id: "training-direction", title: "Understand training, then choose a direction", goal: "The plan next selects Micrograd and later AI Course lessons, followed by PyTorch and CV/NLP. Work through a training explanation before choosing those later courses. The full original sequence and parallel maths lane are preserved below.", topics: ["neural-networks", "backpropagation", "pytorch"], milestone: "Explain the role of a loss and a gradient, reproduce a small training example, and choose a next topic without claiming the whole advanced syllabus is complete." },
    ],
  },
  {
    level: "intermediate", title: "Intermediate", audience: "I can write Python and want to build reliable models.",
    summary: "Turn data into a reproducible classical ML baseline.", outcome: "Train and evaluate a baseline without leaking validation data.",
    practiceQuery: "Machine Learning", competitionSlugs: ["ioai-2025", "ioai-2026", "neoai-2026"],
    steps: [
      { id: "numerical-data", title: "Work with numerical and tabular data", goal: "Use arrays and data frames; inspect columns, shapes and missing values before modelling.", topics: ["numpy", "pandas", "descriptive-statistics"], milestone: "Load a table, report its shape and missing values, and compute a summary for one numeric column." },
      { id: "prepare-data", title: "Prepare data deliberately", goal: "Create repeatable cleaning and feature transformations; fit preprocessing only on training data.", topics: ["data-processing", "data-cleaning", "exploratory-analysis", "feature-engineering"], milestone: "Explain each transformation and put preprocessing and modelling into a repeatable pipeline." },
      { id: "classical-model", title: "Build a classical model", goal: "Choose regression or classification, train a simple reference model, and use the task’s metric.", topics: ["regression", "classification", "building-baselines", "model-evaluation"], milestone: "Reproduce one official scikit-learn example and compare the model with a trivial baseline." },
      { id: "validation", title: "Validate before competing", goal: "Use separated folds, recognize leakage and keep validation results comparable.", topics: ["cross-validation", "data-leakage", "validation-strategies"], milestone: "Record the split, random seed, preprocessing and validation score so another run can reproduce your result." },
    ],
  },
  {
    level: "advanced", title: "Advanced", audience: "I have trained models and want olympiad-oriented practice.",
    summary: "Experiment carefully, study official tasks and upsolve.", outcome: "Explain your experiments and improve a solution using trustworthy evaluation.",
    practiceQuery: "", competitionSlugs: ["ioai-2026", "euroai-2026", "apoai-2026"],
    steps: [
      { id: "evaluation", title: "Make evaluation match the task", goal: "Choose an appropriate validation strategy and audit features for information unavailable at prediction time.", topics: ["validation-strategies", "data-leakage", "model-evaluation"], milestone: "Justify your split and metric, then list at least two ways the task could leak information." },
      { id: "representation", title: "Build a trainable representation", goal: "Understand tensors and neural-network training; select deep learning only when the task and constraints justify it.", topics: ["neural-networks", "pytorch", "training-regularization"], milestone: "Reproduce a PyTorch training loop and distinguish training loss from held-out performance." },
      { id: "experiments", title: "Run controlled experiments", goal: "Compare changes one at a time, track configurations, and tune without treating the test set as validation.", topics: ["experiment-tracking", "hyperparameter-tuning", "ensemble-methods"], milestone: "Keep an experiment table containing hypotheses, settings and validation outcomes; explain a rejected change as well as a successful one." },
      { id: "upsolving", title: "Study, solve and upsolve", goal: "Use source-authoritative tasks, start with a baseline and review what an official metric actually measures.", topics: ["building-baselines", "model-evaluation"], milestone: "Write a short solution review: baseline, validation choice, experiments, remaining weaknesses and what you would try next." },
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
