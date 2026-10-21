// Topic-specific external practice, reviewed 2026-10-21 against the publisher.
// Public titles/official source notebooks were checked; signed-in execution was not.
// These are optional exercises, never a KAIZ assessment or completion signal.
export type PracticeLink = { title: string; href: string; note: string; evidence: string };
const kaggle = (author: string, slug: string, title: string, source: string, note = "Kaggle Learn exercise · account required to run and save"): PracticeLink => ({
  title, href: `https://www.kaggle.com/code/${author}/${slug}`, note,
  evidence: `https://github.com/Kaggle/learntools/blob/master/${source}`,
});
const variables = kaggle("alexisbcook", "exercise-arithmetic-and-variables", "Arithmetic and variables", "notebooks/intro_to_programming/raw/ex1.ipynb");
const loops = kaggle("colinmorris", "exercise-loops-and-list-comprehensions", "Loops and list comprehensions", "notebooks/python/raw/ex_5.ipynb", "Kaggle Learn · some exercises also use functions from the next lesson");
const functions = kaggle("colinmorris", "exercise-functions-and-getting-help", "Functions and getting help", "notebooks/python/raw/ex_2.ipynb");
const lists = kaggle("colinmorris", "exercise-lists", "Lists", "notebooks/python/raw/ex_4.ipynb");
const numpy: PracticeLink = { title: "NumPy: 50 exercises and solutions", href: "https://www.kaggle.com/code/themlphdstudent/learn-numpy-numpy-50-exercises-and-solution", note: "Community notebook by theMLphdStudent · not an official Kaggle course", evidence: "https://www.kaggle.com/code/themlphdstudent/learn-numpy-numpy-50-exercises-and-solution" };
const pandas = kaggle("residentmario", "exercise-indexing-selecting-assigning", "Indexing, selecting and assigning", "notebooks/pandas/raw/ex_1.ipynb");
const summaries = kaggle("residentmario", "exercise-summary-functions-and-maps", "Summary functions and maps", "notebooks/pandas/raw/ex_2.ipynb");
const model = kaggle("dansbecker", "exercise-your-first-machine-learning-model", "Your first machine learning model", "notebooks/machine_learning/raw/ex3.ipynb");
const validation = kaggle("dansbecker", "exercise-model-validation", "Model validation", "notebooks/machine_learning/raw/ex4.ipynb");
const crossValidation = kaggle("alexisbcook", "exercise-cross-validation", "Cross-validation", "notebooks/ml_intermediate/raw/ex5.ipynb");
const leakage = kaggle("alexisbcook", "exercise-data-leakage", "Data leakage", "notebooks/ml_intermediate/raw/ex7.ipynb");
const neuron = kaggle("ryanholbrook", "exercise-a-single-neuron", "A single neuron", "notebooks/deep_learning_intro/raw/ex1.ipynb", "Kaggle Learn · Keras, not PyTorch · account required");
const gradients = kaggle("ryanholbrook", "exercise-stochastic-gradient-descent", "Stochastic gradient descent", "notebooks/deep_learning_intro/raw/ex3.ipynb", "Related training practice in Keras, not a symbolic backpropagation exercise");

// Explicit exceptions keep a relevant original publisher exercise rather than
// inventing a Kaggle equivalent for supporting maths, PyTorch or tracking.
export const lessonPracticeLinks: Readonly<Record<string, PracticeLink | null>> = {
  "python-fundamentals": variables, "python-control-flow": loops, "python-functions": functions, "python-collections": lists,
  algebra: null, "math-functions": null, numpy, pandas,
  "descriptive-statistics": summaries, "exploratory-analysis": summaries,
  "ml-fundamentals": model, "supervised-learning": model, "building-baselines": validation, "model-evaluation": validation,
  "data-processing": kaggle("alexisbcook", "exercise-pipelines", "Pipelines", "notebooks/ml_intermediate/raw/ex4.ipynb"),
  "data-cleaning": kaggle("alexisbcook", "exercise-missing-values", "Missing values", "notebooks/ml_intermediate/raw/ex2.ipynb"),
  "feature-engineering": kaggle("ryanholbrook", "exercise-what-is-feature-engineering", "What is feature engineering?", "notebooks/feature_engineering_new/raw/what_is_feature_engineering_ex.ipynb"),
  regression: model, classification: { title: "Titanic: Machine Learning from Disaster", href: "https://www.kaggle.com/competitions/titanic", note: "Classification competition · Kaggle account and acceptance of competition rules required", evidence: "https://www.kaggle.com/competitions/titanic" }, "cross-validation": crossValidation, "validation-strategies": crossValidation,
  "data-leakage": leakage, "neural-networks": neuron, backpropagation: gradients, pytorch: null,
  "training-regularization": kaggle("ryanholbrook", "exercise-overfitting-and-underfitting", "Overfitting and underfitting", "notebooks/deep_learning_intro/raw/ex4.ipynb"),
  "experiment-tracking": null, "hyperparameter-tuning": crossValidation,
  "ensemble-methods": kaggle("alexisbcook", "exercise-xgboost", "XGBoost", "notebooks/ml_intermediate/raw/ex6.ipynb"),
};
export function practiceLinkFor(topicId: string) { return Object.hasOwn(lessonPracticeLinks, topicId) ? lessonPracticeLinks[topicId] : null; }
