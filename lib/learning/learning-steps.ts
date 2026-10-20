import type { JourneyLevel } from "./journeys";
import { lessonHref } from "./course";

export type PracticeExercise = {
  title: string; prerequisites: readonly string[]; instructions: readonly string[];
  expected: string; hints: readonly string[]; code: string; validation: "self-check";
};
export type LearningStep = {
  topicId: string; title: string; roadmap: JourneyLevel; lessonId: string; level: number;
  objective: string; why: string; primary: string; learnInstruction: string;
  mathTopics: readonly string[]; extraMaterials: readonly string[];
  practice: PracticeExercise;
  readiness: readonly string[]; after?: { title: string; href: string };
  extension?: PracticeExercise;
};
// Original KAIZ practice. These six steps reference released course lessons,
// including the existing Intermediate analysis lesson: no new progress keys.
export const learningSteps: readonly LearningStep[] = [
  {
    topicId: "python-fundamentals", title: "Python Basics", roadmap: "beginner", lessonId: "python-algebra:python-fundamentals", level: 1,
    objective: "Use variables, numbers and a list to describe a tiny dataset.",
    why: "Models need data. First, learn to represent values and check a calculation yourself.",
    primary: "helsinki-variables", learnInstruction: "Read the variables, integers and floating-point sections and predict the examples before running them. Then read the short list introduction in Supporting materials, through len and sum; skip its later functions for now. You do not need to complete the whole MOOC.",
    mathTopics: ["algebra", "math-functions"], extraMaterials: ["helsinki-lists", "python-intro"],
    practice: { title: "Make a score summary", validation: "self-check",
      prerequisites: ["No prior coding; basic addition and division", "Python 3 shell or a local .py file; see Local Python setup"],
      expected: "For [4, 7, 10], print 3 and 7.0. For [5], print 1 and 5.0. Explain why [] has no arithmetic mean; do not divide by zero.",
      hints: ["A list stores several values in square brackets. len(scores) counts them; sum(scores) adds them. Divide the sum by the count.", "Assignment (=) stores a value; print displays it. Run the file from the folder where you saved it, not inside the Python >>> prompt."],
      instructions: ["Open a Python 3 shell or create a file named practice.py. In a terminal run python3 practice.py (on Windows, py practice.py). No account or extra package is needed.",
        "Create a list of three scores: 4, 7 and 10. Print the number of scores and their mean. Predict both results before running it.",
        "Change one value and explain the new mean. Try a one-item list. Do not divide by the length of an empty list.",
        "If you have never coded: = gives a name to a value, [] stores a list, len counts items and print shows a result. Copy the worked example below only after trying it."],
      code: "scores = [4, 7, 10]\ncount = len(scores)\nmean = sum(scores) / count\nprint(count, mean)  # 3 and 7.0\n" },
    readiness: ["I can change a variable and predict what will be printed.", "I can calculate the mean by hand and explain why an empty list needs special handling."],
  },
  {
    topicId: "python-control-flow", title: "Python Practice", roadmap: "beginner", lessonId: "python-algebra:python-control-flow", level: 1,
    objective: "Combine a loop, a condition and a function in a small experiment.",
    why: "Experiments turn repeated calculations into evidence. Random results vary; a seed helps you reproduce a run.",
    primary: "helsinki-functions", learnInstruction: "Read the function-definition recap, parameters and return values; type hints are optional. Review Definite iteration in Supporting materials for for loops and range. Keep Python's function reference for lookup. Try a deterministic function before the random experiment below.",
    mathTopics: ["basic-probability", "combinatorics"], extraMaterials: ["helsinki-loops", "python-flow"],
    practice: { title: "Simulate a coin toss", validation: "self-check",
      prerequisites: ["Python Basics: variables, lists and arithmetic", "Conditions, loops, function parameters and return from the linked lessons"],
      expected: "Return a fraction between 0 and 1 for 20 and 2,000 tosses. Repeating the same n and seed gives the same fraction; n <= 0 raises ValueError. Do not expect exactly 0.5 or guaranteed improvement for a larger sample.",
      hints: ["First write a function that counts 1s in [0, 1, 1, 0] and returns count / len(tosses). Its answer is 0.5.", "from random import Random loads Python's standard-library generator; Random(seed) creates a repeatable stream. rng.choice([0, 1]) draws one value. No package installation is needed.", "raise ValueError rejects an invalid input before division. Keep the running heads count inside the function."],
      instructions: ["Using only Python's standard library, write a function that tosses a fair coin n times and returns the fraction of heads. A list, loop, condition and function should appear in your solution.",
        "Run 20 and 2,000 tosses. Compare with the theoretical probability 0.5; a larger sample is not guaranteed to be closer on every run.",
        "Set a seed, repeat, then change it. Explain what reproducible means. Reject n <= 0 rather than dividing by zero.",
        "Before moving on, review the existing Functions and Python Collections topics if function inputs or lists are unfamiliar."],
      code: "from random import Random\n\ndef heads_fraction(n, seed=7):\n    if n <= 0:\n        raise ValueError('n must be positive')\n    rng = Random(seed)\n    tosses = []\n    for trial in range(n):\n        tosses.append(rng.choice([0, 1]))\n    heads = 0\n    for toss in tosses:\n        if toss == 1:\n            heads += 1\n    return heads / n\n\nprint(heads_fraction(20), heads_fraction(2000))\n" },
    readiness: ["I can write and call a function, loop over a list and handle an invalid input.", "I can distinguish a theoretical probability from one experimental result."],
  },
  {
    topicId: "numpy", title: "NumPy", roadmap: "beginner", lessonId: "arrays-dataframes:numpy", level: 2,
    objective: "Create arrays, inspect their shapes and calculate with whole vectors.",
    why: "An ML dataset is often a numerical matrix. Shape errors can silently change a calculation.",
    primary: "numpy-basics", learnInstruction: "Work through array creation, shape, indexing and basic arithmetic. Then try early exercises from NumPy 100.",
    mathTopics: ["vectors", "matrices"], extraMaterials: ["numpy-100"],
    practice: { title: "From lists to vectors", validation: "self-check",
      prerequisites: ["Python lists, loops and functions", "NumPy installed in your local Python environment"],
      expected: "The sum is [5, 7, 9], elementwise product [4, 10, 18], and dot product 32. The table has shape (2, 3); column means are [2.5, 3.5, 4.5], row means [2.0, 5.0].",
      hints: ["np.array turns a list into an array. * multiplies matching entries; @ adds those products into a dot product.", "axis=0 combines rows, leaving one mean per column; axis=1 combines columns, leaving one per row."],
      instructions: ["In your own Python environment install numpy, pandas, matplotlib and scikit-learn for the remaining journey. See the local setup disclosure below; KAIZ does not execute your code.",
        "Make arrays [1, 2, 3] and [4, 5, 6]. Predict their sum, elementwise product and dot product. Implement each without a loop.",
        "Create a 2-by-3 array and compare mean(axis=0) with mean(axis=1). Explain the output shapes.",
        "Recreate one answer with plain Python. For further practice, attempt NumPy 100 exercises 3, 6, 7 and 9 before opening its solutions; these cover creation, indexing, ranges and reshaping. Later exercises are not required."],
      code: "import numpy as np\na = np.array([1, 2, 3])\nb = np.array([4, 5, 6])\nprint(a + b, a * b, a @ b)\nrows = np.array([a, b])\nprint(rows.shape, rows.mean(axis=0), rows.mean(axis=1))\n" },
    readiness: ["I can explain shape, indexing and the difference between elementwise and dot products.", "I can choose the axis for a per-column summary."],
  },
  {
    topicId: "pandas", title: "Pandas", roadmap: "beginner", lessonId: "arrays-dataframes:pandas", level: 2,
    objective: "Inspect, filter and summarize a small table with missing values.",
    why: "Before modelling you need to know what each row means and which values are missing.",
    primary: "pandas-table", learnInstruction: "Create the small DataFrame in the tutorial to understand rows, columns and Series. Then use the selection and summary tutorials in Supporting materials for filtering and missing-value summaries. Our practice supplies its entire table; no Titanic download is needed.",
    mathTopics: ["descriptive-statistics"], extraMaterials: ["pandas-subset", "pandas-summary"],
    practice: { title: "Inspect a tiny sensor table", validation: "self-check",
      prerequisites: ["Python lists and dictionaries; NumPy step", "pandas installed; None represents the missing reading"],
      expected: "Shape (4, 2); one reading is missing. Filtering readings > 10 keeps B and D. The observed mean is 12; median filling gives C a reading of 12 while the original table still has its missing value.",
      hints: ["pd.DataFrame accepts a dictionary whose keys are column names and whose values are equal-length lists.", "df['reading'].isna().sum() counts missing values. assign returns a new table; do not replace the original df in this exercise."],
      instructions: ["Build a DataFrame with sensor names A, B, C, D and readings 10, 12, missing, 14. Print shape, dtypes and missing-value counts.",
        "Select readings greater than 10; compute the mean using observed readings. Explain how many values contributed.",
        "Create a cleaned copy, replacing the missing value with the observed median. Keep the original table. Explain why missing is not the same as zero.",
        "This table is for exploration, not evaluation. In an ML pipeline, learn imputation statistics on training rows only."],
      code: "import pandas as pd\ndf = pd.DataFrame({'sensor': ['A', 'B', 'C', 'D'],\n                   'reading': [10.0, 12.0, None, 14.0]})\nprint(df.shape, df.dtypes, df.isna().sum(), sep='\\n')\nprint(df.loc[df['reading'] > 10])\nprint(df['reading'].mean())\nclean = df.assign(reading=df['reading'].fillna(df['reading'].median()))\nprint(clean)\n" },
    readiness: ["I can select rows and columns and count missing values.", "I can justify one cleaning choice and preserve the original data."],
  },
  {
    topicId: "exploratory-analysis", title: "Data Analysis", roadmap: "intermediate", lessonId: "prepare-data:exploratory-analysis", level: 2,
    objective: "Ask a question, summarize a distribution and make an informative plot.",
    why: "A pattern is useful only if you understand the measurements and their limitations.",
    primary: "inria-explore", learnInstruction: "Read the course's variables and distribution sections and its linked Exercise M1.01. Its CSV lives in the provider's repository; use our fully supplied synthetic table for local practice instead. Use the pandas summaries and plotting references when needed.",
    mathTopics: ["descriptive-statistics", "vectors"], extraMaterials: ["inria-explore-exercise", "pandas-summary", "pandas-plots"],
    practice: { title: "Investigate variability", validation: "self-check",
      prerequisites: ["Pandas lesson; arithmetic mean", "pandas and matplotlib installed; local plotting or a notebook"],
      expected: "Both groups have count 4, mean 5 and median 5. Sample variance (ddof=1) is 2/3 for A and 40/3 for B. Produce a labelled box plot: equal centres do not imply equal spread.",
      hints: ["Use groupby('group')['value'].agg(['count', 'mean', 'median', 'var']). pandas var uses n-1 by default.", "The eight supplied values are synthetic, not a population study. A notebook or plt.show() displays the chart; for a headless environment save it with plt.savefig('spread.png')."],
      instructions: ["Create two groups of synthetic measurements using the inline data below; no external file or personal data is required.",
        "For each group report count, mean, median and sample variance. Explain which group varies more.",
        "Make a labelled box plot and write two observations plus one limitation: these invented groups are not evidence about real populations.",
        "Keep your code and observations together. If investigating a predictive task, reserve the test set before choosing features or cleaning rules."],
      code: "import pandas as pd\nimport matplotlib.pyplot as plt\ndf = pd.DataFrame({'group': ['A'] * 4 + ['B'] * 4,\n                   'value': [4, 5, 5, 6, 1, 3, 7, 9]})\nprint(df.groupby('group')['value'].agg(['count', 'mean', 'median', 'var']))\ndf.boxplot(column='value', by='group')\nplt.ylabel('Synthetic measurement')\nplt.title('Same centre, different spread')\nplt.suptitle('')\nplt.show()\n" },
    readiness: ["I can distinguish an average from spread and label a chart correctly.", "I can describe a limitation without claiming causation from a small sample."],
  },
  {
    topicId: "ml-fundamentals", title: "First ML Model", roadmap: "beginner", lessonId: "first-baseline:ml-fundamentals", level: 3,
    objective: "Train an Iris classifier and compare it with a simple baseline on held-out data.",
    why: "A useful model must generalize to unseen rows, not just remember examples used in training.",
    primary: "inria-first-model", learnInstruction: "Study how the course separates features and targets, fits a model and evaluates a held-out split. Its worked model is a nearest-neighbour classifier, not our Iris decision tree. Transfer the fit/predict pattern below; use the linked decision-tree explanation and scikit-learn reference as needed. Provider exercises use repository CSV files; our bundled Iris project needs none.",
    mathTopics: ["basic-probability", "descriptive-statistics", "vectors", "matrices"], extraMaterials: ["inria-model-exercise", "google-trees", "sklearn-start", "iris-data", "sklearn-pitfalls"],
    practice: { title: "Build a reproducible Iris baseline", validation: "self-check",
      prerequisites: ["The NumPy, Pandas and Data Analysis steps", "Python 3 with numpy, pandas, matplotlib and scikit-learn; local setup below", "Features are measurements; labels are classes; model.fit learns from training rows"],
      expected: "Load 150 rows with four features and three species labels. Keep 112 training rows and 38 test rows. Report accuracy and macro-F1 for a majority-class baseline and a depth-3 tree; explain the comparison without requiring a particular score. Accuracy is the fraction correct; macro-F1 averages per-class precision/recall balance equally.",
      hints: ["Use python -m pip install scikit-learn inside the activated environment; the Python import is sklearn. A missing sklearn module usually means a different interpreter/environment was used.", "DummyClassifier(strategy='most_frequent') learns the most common TRAINING label; it is a reference, not a useful flower recognizer. DecisionTreeClassifier learns feature-based splits.", "models is a dictionary of named estimators. models.items() gives each name and model; fit learns from training rows and predict returns labels for new rows.", "stratify=y preserves class representation. random_state=42 makes this split repeatable; it does not establish generalization beyond this small dataset.", "Before the first test evaluation, use only training-side cross-validation for any optional tuning. After seeing test results, report them; do not tune again to improve them."],
      instructions: ["Load Iris from sklearn.datasets. X has four measured flower features; y is the species label, not another input feature. No upload or external dataset download is needed.",
        "Split off 25% as test data, stratify by label and set random_state=42. Record your split and library version. This illustrative random split is suitable here, not automatically for time-series or grouped data.",
        "Fit a most-frequent DummyClassifier and a depth-3 decision tree using training data only. A baseline is a simple reference, not a score target.",
        "Evaluate accuracy and macro-F1 on the same held-out rows. Accuracy counts correct predictions; macro-F1 weights each class equally. Explain differences rather than demanding a particular score.",
        "Avoid leakage: never fit on X_test or include y in X. If adding scaling or imputation later, fit it only on training rows via a pipeline.",
        "First choose the fixed baseline and depth-3 tree. If exploring other settings, select them using cross-validation on training data BEFORE the first test evaluation. After seeing test scores, do not use them to choose further changes. Re-running the identical seed/configuration checks reproducibility, not a new experiment.",
        "Save the code, seed, package versions and observations. The Iris exercise teaches workflow; it does not demonstrate olympiad readiness or performance on arbitrary datasets."],
      code: "import sklearn\nfrom sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.dummy import DummyClassifier\nfrom sklearn.tree import DecisionTreeClassifier\nfrom sklearn.metrics import accuracy_score, f1_score\n\nX, y = load_iris(return_X_y=True)\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.25, stratify=y, random_state=42)\nmodels = {\n    'baseline': DummyClassifier(strategy='most_frequent'),\n    'tree': DecisionTreeClassifier(max_depth=3, random_state=42),\n}\nprint('scikit-learn:', sklearn.__version__)\nfor name, model in models.items():\n    model.fit(X_train, y_train)\n    predictions = model.predict(X_test)\n    print(name, 'accuracy:', accuracy_score(y_test, predictions),\n          'macro-F1:', f1_score(y_test, predictions, average='macro'))\n" },
    readiness: ["I can explain features, labels, a held-out test set and why a baseline is needed.", "I can reproduce the comparison, interpret accuracy and macro-F1 and name two sources of data leakage."],
    after: { title: "Improve validation", href: lessonHref("intermediate", "validation:cross-validation") },
  },
];
export function getLearningStep(topicId: string): LearningStep | undefined {
  return learningSteps.find(step => step.topicId === topicId);
}
export function nextLearningStep(topicId: string): LearningStep | undefined {
  const index = learningSteps.findIndex(step => step.topicId === topicId);
  return index < 0 ? undefined : learningSteps[index + 1];
}
export function learningStepHref(step: LearningStep): string { return lessonHref(step.roadmap, step.lessonId); }
