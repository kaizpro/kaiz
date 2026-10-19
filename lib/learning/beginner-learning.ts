import { courseFor } from "./course";
import { getJourney } from "./journeys";
import { beginnerPractice } from "./beginner-practice";
import { getLearningStep, learningStepHref, type LearningStep } from "./learning-steps";

// A teaching order over existing lessons, NOT a new course/progress identity.
// Maths is supporting study; deep learning is an independently accessible extension.
const coreTopics = ["python-fundamentals", "python-control-flow", "python-functions", "python-collections", "numpy", "pandas", "exploratory-analysis", "supervised-learning", "building-baselines", "ml-fundamentals", "model-evaluation"] as const;
type Teaching = { primary: string; instruction: string; readiness: readonly string[]; extras?: readonly string[] };
const teaching: Readonly<Record<string, Teaching>> = Object.assign(Object.create(null), {
  "python-functions": { primary: "helsinki-functions", instruction: "After Python Practice, study parameters and return values. A parameter names an input; return sends a result to the caller, unlike print. Skip type hints for now. In our guard, if not scores means the list is empty; raise ValueError stops an undefined calculation.", readiness: ["I can call the same function with different lists and use its returned value.", "I can explain why an empty list has no mean."], extras: ["python-flow"] },
  "python-collections": { primary: "helsinki-dictionary", instruction: "Review lists first, then read the dictionary introduction and counting examples. A list keeps ordered values; a dictionary maps keys to values. The tuple unit explains fixed records. In our example, set(scores) removes duplicates and counts.get(score, 0) reads a count, defaulting to zero. No set ordering is promised.", readiness: ["I can count repeated values and build a dictionary of equal-length lists for Pandas."], extras: ["helsinki-lists", "helsinki-tuple"] },
  algebra: { primary: "openstax-equations", instruction: "Supporting maths, not a gate to coding: read the worked equations and Try It exercises. First review the linked addition/subtraction unit, then division and the two-step examples here. Apply the same operation to both sides. You can do this lesson entirely on paper.", readiness: ["I can solve a two-step equation and check it by substitution."], extras: ["openstax-addition"] },
  "math-functions": { primary: "openstax-functions", instruction: "Supporting maths: focus on function notation, evaluating a formula and input/output tables; skip domain/range algebra for now. f(2) means evaluate at input 2, not multiply by 2. For the final composition challenge, read the linked composition examples: evaluate the inner function first. No programming is required.", readiness: ["I can evaluate f(x) at a given input and trace two functions in order."], extras: ["openstax-composition"] },
  "supervised-learning": { primary: "google-supervised", instruction: "Read the labelled-example, training and inference explanations. A feature is an input measurement; a label is the answer known for a training example. Classification predicts a category, regression a number. Reserve test rows before choosing a rule. The small threshold exercise below needs only Python, not a trained library model.", readiness: ["I can separate features from labels and explain why test labels cannot choose the rule."], extras: ["inria-first-model"] },
  "building-baselines": { primary: "inria-baseline", instruction: "Read the motivation and simple-baseline comparison, not the full later cross-validation module. The provider demonstrates regression: predicting a training-set average. Our classification baseline predicts the most common training label instead. Start with the supplied plain-Python example; no trained model is a prerequisite.", readiness: ["I can choose a baseline using training labels only and evaluate it on reserved labels."], extras: ["sklearn-start"] },
  "model-evaluation": { primary: "google-metrics", instruction: "After First ML Model, work through the confusion counts, accuracy and recall examples. Class 1 is the positive class here; recall asks how many actual positives were found. Balanced accuracy is the average recall over classes (both classes occur in our example). A metric must reflect the task, not simply look large.", readiness: ["I can explain why 75% accuracy can hide zero positive recall.", "I can independently reload Iris, split once, fit on training rows only, and report a baseline/tree comparison with limitations."], extras: ["sklearn-pitfalls"] },
  "neural-networks": { primary: "google-neural", instruction: "Optional next-stage preparation, NOT required Beginner mastery. Finish the classical ML core first. Read nodes, weighted sums and activation functions. A dot product multiplies corresponding entries and adds them; a bias is an added offset. ReLU outputs max(0, score). Trace one neuron before considering whole networks.", readiness: ["I can trace a weighted sum and activation without claiming it is a trained model."], extras: ["pytorch-basics"] },
  backpropagation: { primary: "google-backprop", instruction: "Optional next-stage preparation, NOT required Beginner mastery. Read the backpropagation explanation after the neuron preview. Derivatives and the chain rule are additional prerequisites: review the linked calculus course's derivative/chain-rule sections before this challenge. The local scalar example checks one gradient; it does not teach all of calculus or full-network training.", readiness: ["I can explain the sign of one gradient and why a small update may reduce loss."], extras: ["mit-calculus", "micrograd"] },
  pytorch: { primary: "pytorch-autograd", instruction: "Optional next-stage preparation, NOT required Beginner mastery. After the scalar chain-rule exercise, read requires_grad, backward and gradient accumulation. A tensor stores numbers; autograd records operations to compute derivatives. Use the official local installation selector for a CPU environment. The provider's larger graph example is supplementary; our scalar code needs no dataset or GPU.", readiness: ["I can compare an automatic gradient with a hand calculation and clear it before recomputation."], extras: ["pytorch-basics"] },
} satisfies Record<string, Teaching>);

export function beginnerStep(topicId: string): LearningStep | undefined {
  const guided = getLearningStep(topicId);
  if (topicId === "exploratory-analysis") return guided && { ...guided, learnInstruction: `${guided.learnInstruction} Bridge: a median is the middle sorted value (average the middle pair for an even count). Sample variance adds squared distances from the mean and divides by n−1. For A, (1+0+0+1)/3 = 2/3. A box plot summarizes the median and quartiles; compare spread, not just the centre.` };
  if (guided) {
    if (topicId === "python-control-flow") return { ...guided,
      objective: "Use a condition inside a loop to summarize known values.", why: "Repeated decisions prepare you to inspect data without requiring functions or randomness yet.",
      primary: "helsinki-conditions", extraMaterials: ["helsinki-loops", "python-flow"],
      learnInstruction: "After Python Basics, read comparisons and if in the conditions unit, then for loops over a list in Definite iteration. Indentation groups statements. == compares values (unlike assignment =); count = count + 1 updates a counter. Functions and random simulation come later.",
      practice: { title: "Count scores above a threshold", validation: "self-check", prerequisites: ["Python Basics: variables, lists and print", "Read the linked conditions and for-loop examples"], instructions: ["Use scores = [4, 7, 10]. Loop through the scores and count those at least 7, using an if statement. Do not define a function or import a package.", "Predict the result, then try [7] and []. Explain why the counter must start at zero before the loop."], expected: "The counts are 2, 1 and 0 respectively. Exactly 7 qualifies because >= includes equality.", hints: ["Start count = 0. for score in scores visits each value. Indent the if under the loop, and the counter update under the if.", "Use >= 7, then count = count + 1. Print after the loop, not inside it."], code: "scores = [4, 7, 10]\ncount = 0\nfor score in scores:\n    if score >= 7:\n        count = count + 1\nprint(count)  # 2\n" },
      readiness: ["I can trace a loop, explain indentation and test a boundary value."], mathTopics: [],
    };
    if (topicId === "ml-fundamentals") return { ...guided, learnInstruction: `${guided.learnInstruction} Before coding, finish Supervised Learning and Building Baselines. Accuracy is correct predictions / total predictions. Precision measures how many predicted positives are correct; recall measures how many actual positives are found. F1 balances precision and recall; macro-F1 gives each species equal weight. Model Evaluation next revisits these ideas with a four-row example.` };
    if (topicId === "pandas") return { ...guided, learnInstruction: `${guided.learnInstruction} Bridge: None marks a missing measurement, not zero. A median is the middle value after sorting observed values; for an even count, average the middle pair. Here [10, 12, 14] has median 12.` };
    return guided;
  }
  const content = teaching[topicId];
  const lesson = courseFor(getJourney("beginner")!).flatMap(unit => unit.lessons).find(item => item.topic.id === topicId);
  if (!content || !lesson) return undefined;
  return { topicId, title: lesson.topic.title, roadmap: "beginner", lessonId: lesson.id,
    level: ["neural-networks", "backpropagation", "pytorch"].includes(topicId) ? 4 : ["supervised-learning", "building-baselines", "model-evaluation"].includes(topicId) ? 3 : 1,
    primary: content.primary, learnInstruction: content.instruction, objective: lesson.topic.description,
    why: topicId === "model-evaluation" ? "This is the end of the recommended Beginner core: train and evaluate a classical model independently. Deep Learning is optional later study." : "Practise this idea before combining it with a larger model workflow.",
    practice: beginnerPractice[topicId], readiness: content.readiness, extraMaterials: content.extras ?? [], mathTopics: [],
    extension: topicId === "python-collections" ? getLearningStep("python-control-flow")!.practice : undefined,
  };
}
export const beginnerCore = coreTopics.map(id => beginnerStep(id)!);
export function beginnerNeighbors(topicId: string) {
  const index = beginnerCore.findIndex(step => step.topicId === topicId);
  if (index >= 0) return {
    before: index > 0 ? { title: beginnerCore[index - 1].title, href: learningStepHref(beginnerCore[index - 1]) } : undefined,
    after: index < beginnerCore.length - 1 ? { title: beginnerCore[index + 1].title, href: learningStepHref(beginnerCore[index + 1]) } : { title: "Review the Beginner core", href: "/roadmaps/beginner" },
  };
  // Supporting/optional lessons do not imply a compulsory path through deep learning.
  return { before: undefined, after: { title: "Return to Beginner courses", href: "/roadmaps/beginner" } };
}
