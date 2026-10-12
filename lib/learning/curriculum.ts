export type TrackId = "coding-ai" | "mathematics";
export type LearningResource = {
  id: string;
  title: string;
  kind: "article" | "video" | "exercise";
  href: string;
};
export interface CurriculumNode {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly kind: "root" | "track" | "group" | "topic";
  readonly track: TrackId | null;
  readonly parentId: string | null;
  readonly order: number;
  readonly prerequisites: readonly string[];
  readonly resources: readonly LearningResource[];
  readonly children: readonly CurriculumNode[];
}

type Outline = Pick<CurriculumNode, "id" | "title" | "description" | "kind" | "prerequisites" | "resources"> & { children: readonly Outline[] };
type TopicEntry = readonly [id: string, title: string, description: string, prerequisites?: readonly string[], resources?: readonly LearningResource[]];

function topics(entries: readonly TopicEntry[]): Outline[] {
  return entries.map(([id, title, description, prerequisites = [], resources = []]) => ({ id, title, description, prerequisites, kind: "topic", resources, children: [] }));
}
function group(id: string, title: string, description: string, children: readonly Outline[], prerequisites: readonly string[] = []): Outline {
  return { id, title, description, children, prerequisites, kind: "group", resources: [] };
}

const coding = [
  group("programming", "Programming", "Two independent starting points. Choose a language, then learn to build with it.", [
    group("python", "Python", "From your first program to working with data.", topics([
      ["python-fundamentals", "Python Fundamentals", "Variables, values and the structure of a Python program."],
      ["python-control-flow", "Control Flow", "Make decisions and repeat operations with conditions and loops."],
      ["python-functions", "Functions", "Break a program into reusable pieces with clear inputs and outputs."],
      ["python-collections", "Python Collections", "Work with lists, tuples, dictionaries and sets."],
      ["python-oop", "Object-Oriented Programming", "Represent related data and behavior with classes and objects."],
      ["numpy", "NumPy", "Represent numerical data as arrays and reason about vectorized operations.", ["python-collections", "vectors"]],
      ["pandas", "Pandas", "Organize, transform and inspect tabular data.", ["python-collections"]],
    ])),
    group("cpp", "C++", "A parallel path for efficient programs and algorithmic problem solving.", topics([
      ["cpp-fundamentals", "C++ Fundamentals", "Types, control flow, functions and the compilation model."],
      ["cpp-stl", "The Standard Library", "Use standard containers, iterators and algorithms.", ["cpp-fundamentals", "data-structures", "sorting-searching"]],
      ["cpp-memory", "Memory & Data Representation", "Understand references, ownership and how structures are stored.", ["cpp-fundamentals"]],
    ])),
  ]),
  group("algorithms", "Algorithms & Problem Solving", "Language-independent tools for solving problems efficiently.", topics([
    ["complexity", "Complexity Analysis", "Compare time and space costs as input sizes grow."],
    ["sorting-searching", "Sorting & Searching", "Order data and locate values efficiently."],
    ["data-structures", "Data Structures", "Choose stacks, queues, trees and other structures for a problem."],
    ["graph-algorithms", "Graph Algorithms", "Traverse networks and reason about connectivity and shortest paths.", ["graph-theory"]],
    ["dynamic-programming", "Dynamic Programming", "Combine overlapping subproblems instead of repeating work."],
  ])),
  group("data-science", "Data Science", "Turn raw data into understandable, useful inputs.", topics([
    ["data-processing", "Data Processing", "Build a repeatable sequence of data transformations."],
    ["data-visualization", "Data Visualization", "Use visual representations to communicate patterns and uncertainty."],
    ["exploratory-analysis", "Exploratory Data Analysis", "Investigate distributions, relationships and unexpected values."],
    ["data-cleaning", "Data Cleaning", "Handle missing, inconsistent and duplicated observations."],
    ["feature-engineering", "Feature Engineering", "Represent useful signals in a form a model can learn from."],
  ]), ["pandas", "descriptive-statistics"]),
  group("machine-learning", "Machine Learning", "Learn from data, measure generalization and compare models.", topics([
    ["ml-fundamentals", "ML Fundamentals", "Understand learning objectives, datasets and generalization."],
    ["supervised-learning", "Supervised Learning", "Learn a relationship from labeled examples."],
    ["unsupervised-learning", "Unsupervised Learning", "Discover structure without target labels."],
    ["regression", "Regression", "Predict continuous quantities and evaluate prediction errors."],
    ["classification", "Classification", "Predict categories and understand decision boundaries."],
    ["model-evaluation", "Model Evaluation", "Choose metrics that match a task and its costs."],
    ["cross-validation", "Cross-Validation", "Estimate performance using carefully separated data folds."],
    ["ensemble-methods", "Ensemble Methods", "Combine models to improve prediction reliability."],
  ]), ["python-fundamentals", "vectors", "basic-probability", "data-processing"]),
  group("deep-learning", "Deep Learning", "Build on machine learning with trainable neural representations.", topics([
    ["neural-networks", "Neural Networks", "Understand layers, activations, parameters and losses."],
    ["forward-propagation", "Forward Propagation", "Follow an input through a network to its prediction."],
    ["backpropagation", "Backpropagation", "Compute how each parameter contributes to a loss.", ["chain-rule", "gradient-descent"]],
    ["pytorch", "PyTorch", "Work with tensors, automatic differentiation and training loops."],
    ["training-regularization", "Training & Regularization", "Improve optimization and control overfitting."],
    ["convolutional-networks", "Convolutional Networks", "Learn spatial patterns using convolutional architectures."],
    ["transformers", "Transformers", "Model relationships in sequences using attention.", ["attention"]],
  ]), ["ml-fundamentals", "derivatives", "matrix-operations"]),
  group("ai-specializations", "AI Specializations", "Explore advanced applications after the core foundations.", [
    group("computer-vision", "Computer Vision", "Models that understand visual information.", topics([
      ["image-processing", "Image Processing", "Represent images and apply basic spatial transformations."],
      ["image-classification", "Image Classification", "Assign categories to visual inputs."],
      ["object-detection", "Object Detection", "Locate and classify objects within images."],
      ["image-segmentation", "Image Segmentation", "Assign meaning at the pixel level."],
    ]), ["neural-networks", "convolutional-networks"]),
    group("nlp-llms", "NLP & LLMs", "Models that represent and generate language.", topics([
      ["text-processing", "Text Processing", "Prepare text and reason about tokenization."],
      ["embeddings", "Embeddings", "Represent discrete inputs in a continuous vector space."],
      ["attention", "Attention", "Weight relevant information when building a representation."],
      ["llm-fundamentals", "LLM Fundamentals", "Understand language-model objectives and generation.", ["transformers"]],
    ]), ["neural-networks", "transformers"]),
    group("other-ai", "Beyond Images & Text", "Explore sequential data and learning through interaction.", topics([
      ["time-series", "Time Series", "Model observations over time with time-aware validation."],
      ["reinforcement-learning", "Reinforcement Learning", "Learn decisions from rewards and interaction."],
    ]), ["ml-fundamentals"]),
  ]),
  group("ai-competitions", "AI Competitions", "Bring the foundations together in reproducible competition workflows.", topics([
    ["building-baselines", "Building Baselines", "Establish a simple, reliable starting point."],
    ["validation-strategies", "Validation Strategies", "Make local validation reflect the real prediction task.", ["cross-validation"]],
    ["data-leakage", "Data Leakage", "Recognize information that would not be available at prediction time."],
    ["experiment-tracking", "Experiment Tracking", "Keep results, configurations and comparisons reproducible."],
    ["hyperparameter-tuning", "Hyperparameter Tuning", "Search configuration choices without overfitting validation."],
    ["kaggle-workflows", "Kaggle Workflows", "Organize datasets, experiments, ensembles and submissions.", ["ensemble-methods"]],
  ]), ["model-evaluation", "feature-engineering"]),
];

const mathematics = [
  group("math-foundations", "Mathematical Foundations", "Build the language needed for the rest of the map.", topics([
    ["algebra", "Algebra", "Manipulate expressions and reason about symbolic relationships."],
    ["math-functions", "Functions", "Understand inputs, outputs, graphs and composition."],
    ["equations-inequalities", "Equations & Inequalities", "Solve constraints and interpret their solution sets."],
    ["trigonometry", "Trigonometry", "Connect angles, ratios and periodic functions."],
  ])),
  group("linear-algebra", "Linear Algebra", "The mathematics of vectors, spaces and transformations.", topics([
    ["vectors", "Vectors", "Represent direction, magnitude and coordinates."],
    ["matrices", "Matrices", "Organize linear relationships in rectangular arrays."],
    ["matrix-operations", "Matrix Operations", "Combine matrices and understand multiplication."],
    ["linear-transformations", "Linear Transformations", "Describe mappings that preserve linear structure."],
    ["eigenvalues-eigenvectors", "Eigenvalues & Eigenvectors", "Find directions preserved by a transformation."],
    ["svd", "Singular Value Decomposition", "Decompose a matrix to understand its dominant structure."],
  ]), ["algebra"]),
  group("discrete-math", "Discrete Mathematics", "Reason about finite structures and rigorous arguments.", topics([
    ["logic", "Logic", "Work with propositions, implication and logical statements."],
    ["proofs", "Mathematical Proofs", "Build and evaluate rigorous mathematical arguments."],
    ["combinatorics", "Combinatorics", "Count arrangements and analyze discrete choices."],
    ["graph-theory", "Graph Theory", "Represent relationships as vertices and edges."],
  ]), ["algebra"]),
  group("calculus", "Calculus", "Understand change, accumulation and local sensitivity.", topics([
    ["limits", "Limits", "Reason about behavior as inputs approach a value."],
    ["derivatives", "Derivatives", "Measure instantaneous rates of change."],
    ["integrals", "Integrals", "Accumulate quantities and connect area to change."],
    ["multivariable-calculus", "Multivariable Calculus", "Extend calculus to functions of several variables."],
    ["partial-derivatives", "Partial Derivatives", "Measure change along one input dimension."],
    ["chain-rule", "Chain Rule", "Differentiate compositions of functions."],
  ]), ["math-functions", "trigonometry"]),
  group("probability", "Probability", "Represent uncertainty and reason about random outcomes.", topics([
    ["basic-probability", "Basic Probability", "Work with events, outcomes and probability rules."],
    ["conditional-probability", "Conditional Probability", "Update probabilities when information is given."],
    ["bayes-theorem", "Bayes’ Theorem", "Relate prior beliefs, evidence and posterior probabilities."],
    ["random-variables", "Random Variables", "Represent numerical outcomes of random processes."],
    ["probability-distributions", "Probability Distributions", "Describe how probability is distributed across outcomes."],
  ]), ["math-functions", "combinatorics"]),
  group("statistics", "Statistics", "Draw careful conclusions from observed data.", topics([
    ["descriptive-statistics", "Descriptive Statistics", "Summarize a dataset’s center, spread and shape."],
    ["sampling", "Sampling", "Understand how data selection affects conclusions."],
    ["statistical-inference", "Statistical Inference", "Use observations to reason about a population."],
    ["hypothesis-testing", "Hypothesis Testing", "Evaluate evidence against a stated statistical hypothesis."],
    ["estimation", "Estimation", "Estimate quantities and communicate uncertainty."],
  ]), ["basic-probability", "probability-distributions"]),
  group("optimization", "Optimization", "Find useful solutions by reasoning about objectives and constraints.", topics([
    ["gradients", "Gradients", "Collect partial derivatives into a direction of change."],
    ["gradient-descent", "Gradient Descent", "Improve parameters by stepping against a gradient.", ["gradients"]],
    ["optimization-methods", "Optimization Methods", "Compare strategies for minimizing objectives."],
    ["convex-optimization", "Convex Optimization", "Use convex structure to reason about optimal solutions."],
  ]), ["partial-derivatives", "vectors"]),
];

function materialize(outline: Outline, parentId: string | null, track: TrackId | null, order: number): CurriculumNode {
  const children = outline.children.map((child, index) => materialize(child, outline.id, track, index));
  return { ...outline, slug: outline.id, parentId, track, order, children };
}
const root: CurriculumNode = {
  id: "kaiz-learning", slug: "kaiz-learning", title: "KAIZ Learning", description: "A map of the foundations behind AI.",
  kind: "root", track: null, parentId: null, order: 0, prerequisites: [], resources: [],
  children: [
    materialize({ id: "coding-ai", title: "Coding & AI", description: "From your first program to intelligent systems.", kind: "track", children: coding, prerequisites: [], resources: [] }, "kaiz-learning", "coding-ai", 0),
    materialize({ id: "mathematics", title: "Mathematics", description: "The ideas that make the algorithms work.", kind: "track", children: mathematics, prerequisites: [], resources: [] }, "kaiz-learning", "mathematics", 1),
  ],
};
function flatten(node: CurriculumNode): CurriculumNode[] {
  return [node, ...node.children.flatMap(flatten)];
}
export const curriculum: readonly CurriculumNode[] = flatten(root);
const byId = new Map(curriculum.map((node) => [node.id, node]));
const topicsBySlug = new Map(curriculum.filter((node) => node.kind === "topic").map((node) => [node.slug, node]));
export function getNode(id: string): CurriculumNode | undefined { return byId.get(id); }
export function getTopicBySlug(slug: string): CurriculumNode | undefined { return topicsBySlug.get(slug); }
export function getChildren(id: string): readonly CurriculumNode[] { return getNode(id)?.children ?? []; }
export function getTopics(track?: TrackId): CurriculumNode[] { return curriculum.filter((node) => node.kind === "topic" && (!track || node.track === track)); }
export function getPath(id: string): CurriculumNode[] {
  const path: CurriculumNode[] = [];
  let node = getNode(id);
  while (node) { path.unshift(node); node = node.parentId ? getNode(node.parentId) : undefined; }
  return path;
}
export function topicHref(node: CurriculumNode): string { return `/learn/${node.slug}`; }

// Stages express a suggested reading order, not additional parents or locked prerequisites.
export const stages: Record<TrackId, readonly { label: string; areas: readonly string[] }[]> = {
  "coding-ai": [
    { label: "Build your foundations", areas: ["programming"] },
    { label: "Solve & explore", areas: ["algorithms", "data-science"] },
    { label: "Learn from data", areas: ["machine-learning"] },
    { label: "Go deeper", areas: ["deep-learning"] },
    { label: "Find your direction", areas: ["ai-specializations"] },
    { label: "Put it into practice", areas: ["ai-competitions"] },
  ],
  mathematics: [
    { label: "Build your foundations", areas: ["math-foundations"] },
    { label: "Structures & reasoning", areas: ["linear-algebra", "discrete-math"] },
    { label: "Change & uncertainty", areas: ["calculus", "probability"] },
    { label: "Infer & optimize", areas: ["statistics", "optimization"] },
  ],
};
