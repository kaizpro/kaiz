// Maintainer check of KAIZ-authored examples, not an in-product judge.
// Supply a disposable local Python environment with numpy/pandas/matplotlib/sklearn.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const python = process.env.KAIZ_PRACTICE_PYTHON;
assert.ok(python, "Set KAIZ_PRACTICE_PYTHON; this script never installs packages");
const { learningSteps } = loadTypescript()("lib/learning/learning-steps.ts");
const { beginnerPractice } = loadTypescript()("lib/learning/beginner-practice.ts");
const checks = [
  "assert count == 3 and mean == 7.0",
  "assert heads_fraction(20) == heads_fraction(20)\nassert 0 <= heads_fraction(2000) <= 1\ntry:\n    heads_fraction(0)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('invalid input accepted')",
  "np.testing.assert_array_equal(a + b, [5, 7, 9])\nassert a @ b == 32\nassert rows.mean(axis=0).shape == (3,)\nassert rows.mean(axis=1).shape == (2,)",
  "assert df['reading'].isna().sum() == 1\nassert clean['reading'].isna().sum() == 0\nassert clean.loc[2, 'reading'] == 12.0\nassert len(df.loc[df['reading'] > 10]) == 2",
  "stats = df.groupby('group')['value'].agg(['mean', 'var'])\nassert stats.loc['A', 'mean'] == stats.loc['B', 'mean'] == 5\nassert stats.loc['A', 'var'] < stats.loc['B', 'var']\nassert len(plt.get_fignums()) == 1",
  "assert len(X_train) == 112 and len(X_test) == 38\nassert X.shape == (150, 4)\nassert set(y_train) == set(y_test) == {0, 1, 2}\nassert len(fit_inputs) == 2\nassert all(a is X_train and b is y_train for a, b in fit_inputs)\nassert all(a is not X_test and b is not y_test for a, b in fit_inputs)\nrepeat = DecisionTreeClassifier(max_depth=3, random_state=42).fit(X_train, y_train)\nassert (repeat.predict(X_test) == models['tree'].predict(X_test)).all()",
];
// Observe the actual example's fit boundary without replacing its estimators.
const observeFits = "from sklearn.dummy import DummyClassifier\nfrom sklearn.tree import DecisionTreeClassifier\nfit_inputs = []\ndef observe_fit(original):\n    def fit(self, X, y, *args, **kwargs):\n        fit_inputs.append((X, y))\n        return original(self, X, y, *args, **kwargs)\n    return fit\nDummyClassifier.fit = observe_fit(DummyClassifier.fit)\nDecisionTreeClassifier.fit = observe_fit(DecisionTreeClassifier.fit)\n";
function execute(title, code, check, prefix = "") {
  const result = spawnSync(python, ["-c", prefix + code + "\n" + check], {
    encoding: "utf8", timeout: 60000, env: { ...process.env, MPLBACKEND: "Agg" },
  });
  assert.equal(result.status, 0, `${title}: ${result.error ?? result.stderr}`);
  console.log(`PASS ${title}: example executed and invariants checked`);
}
for (const [index, step] of learningSteps.entries()) execute(step.title, step.practice.code, checks[index], step.topicId === "ml-fundamentals" ? observeFits : "");
const beginnerChecks = {
  "python-functions": "assert mean_score([4, 8]) == 6.0 and mean_score([7]) == 7.0\ntry:\n    mean_score([])\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('empty mean accepted')",
  "python-collections": "assert scores == [4, 7, 4] and sensor == ('A', 4)\nassert distinct == {4, 7} and counts == {4: 2, 7: 1}",
  algebra: "assert x == y == 4 and 2*x+3 == 11 and 3*y-2 == 10",
  "math-functions": "assert [f(x) for x in [-1, 0, 2]] == [1, 3, 7]\nassert g(f(2)) == 49 and f(g(2)) == 11",
  "supervised-learning": "assert set(train).isdisjoint(test)\nassert threshold == 3.5 and predictions == [0, 1] == [labels[i] for i in test]",
  "building-baselines": "assert counts == {0: 3, 1: 1} and baseline == 0\nassert predictions == [0, 0, 0, 0] and accuracy == 0.25\nassert train_labels == [0, 0, 0, 1] and test_labels == [0, 1, 1, 1]",
  "model-evaluation": "assert accuracy_score(y_true, y_pred) == 0.75\nassert recall_score(y_true, y_pred) == 0\nassert balanced_accuracy_score(y_true, y_pred) == 0.5",
  "neural-networks": "assert score == -1.25 and output == 0\nassert new_score == new_output == 1.25\nassert (new_output - 1)**2 == 0.0625",
  backpropagation: "assert gradient == -4 and abs(numeric-gradient) < 1e-8\nassert abs(new_w - 1.4) < 1e-10\nassert abs(loss(new_w)-0.04) < 1e-10 and loss(new_w) < loss(w)",
  pytorch: "assert first_gradient == w.grad.item() == -4\nassert w.item() == 1 and w.device.type == 'cpu'",
};
assert.deepEqual(Object.keys(beginnerChecks).sort(), Object.keys(beginnerPractice).sort());
for (const [id, practice] of Object.entries(beginnerPractice)) execute(practice.title, practice.code, beginnerChecks[id]);
const { beginnerStep } = loadTypescript()("lib/learning/beginner-learning.ts");
const novice = beginnerStep("python-control-flow").practice;
execute(novice.title, novice.code, "assert count == 2");
for (const [scores, expected] of [["[7]", 1], ["[]", 0], ["[6, 7, 8]", 2]]) execute("Threshold boundary " + scores, novice.code.replace("[4, 7, 10]", scores), `assert count == ${expected}`);
