# KAIZ educational quality audit — 2026-10-19

## Scope and evidence

All **40 released roadmap lesson identities** were inspected, including their
topic objectives, rendered primary selection, module/guided practice and next
link. These are not 40 unique subjects: profiles intentionally reuse topics with
different durable progress keys. The 85-topic Learning Tree is preserved, not
claimed to have 85 authored lessons. **The 40 lessons are not all educationally
complete.** No curriculum identity, route, progress rule or approved UX is changed.

Grades describe the **primary resource's usefulness for this lesson**, not its
publisher's reputation, an HTTP status, or a student's proficiency:

- **A:** structured course with relevant practice statements inspected.
- **B:** explanatory tutorial with worked examples. An introductory tutorial can
  earn B even when hosted in documentation; API/reference pages do not earn B
  merely because they are official.
- **C:** documentation/reference-only selection; useful support, insufficient
  standalone instruction for the current lesson.
- **D:** unsuitable selection or access not verified enough to recommend as a
  dependable primary. D is **not** a claim of a globally broken URL.

Count each lesson once, not each distinct URL. Before this pass: **A 4 / B 9 /
C 17 / D 10**. After the six-step improvements below: **A 6 / B 10 / C 14 /
D 10**. The subsequent Beginner polish results in **A 5 / B 18 / C 11 /
D 6**. All 15 Beginner primaries are now A/B (one A, fourteen B); the remaining
eleven C and six D selections belong to Intermediate/Advanced. The former broad
Google course A is now a focused introductory B: a narrower lesson is not claimed
to be a complete course. No primary URL was established as permanently dead.

Public source text, examples, course structure and relevant exercise statements
were read. Provider login, submissions, grading, regional availability, video
playback and hosted notebooks were **not** tested. A does not imply those passed.
KAIZ's original worked solutions are executed separately; that does not verify
an external course's grader. All URLs in the table are the resulting primary
URLs, including unchanged gaps; the original selections remain in the repository.

## Complete per-lesson audit

Unless a cell says otherwise, the primary is English, public reading was retrieved,
examples were visible, and local execution needs the packages named in the lesson.
“Local” means original KAIZ practice, not a provider exercise or verified assessment.
“Module only” means the original repeated module-level prompt still needs a
topic-specific exercise. “Next” reports the actual recommendation/module link,
not a prerequisite or access gate. Beginner later DL exercises are previews and
explicitly disclose their additional prerequisites.

### Beginner — 15 identities

| # | Lesson key and skill | Primary resource URL | Grade | Explanation / practice evidence | Level, next step and concrete issue |
|---|---|---|---|---|---|
| 1 | `beginner/python-algebra:python-fundamentals` — variables, values, score mean | [Helsinki variables](https://programming-26.mooc.fi/part-1/3-more-about-variables/) | B | Worked teaching examples; local score-summary exercise, expected output and edge case. Provider grading untested. | New-coder appropriate. List/len/sum bridge linked separately; not the entire MOOC. Next Python Practice. Replaces documentation-only primary. |
| 2 | `beginner/python-algebra:python-control-flow` — conditions and loops | [Helsinki conditions](https://programming-26.mooc.fi/part-1/5-conditional-statements/) | B | Worked comparisons/if; linked for-loop instruction. Original threshold count has explicit 2/1/0 expected outputs. | No functions/import/random prerequisite. Next Functions. Coin experiment retained after Collections as a closed optional extension. |
| 3 | `beginner/python-algebra:python-functions` — reusable inputs/outputs | [Helsinki functions](https://programming-26.mooc.fi/part-4/2-more-functions/) | B | Parameter/return teaching; local mean function, explicit empty-list/ValueError bridge. | After loops, before Collections. Type hints optional; return versus print explained. |
| 4 | `beginner/python-algebra:python-collections` — list/tuple/dict/set distinctions | [Helsinki dictionaries](https://programming-26.mooc.fi/part-5/3-dictionary/) | B | Dictionary/counting teaching with list/tuple units; original frequency exercise; get/set semantics bridged. | Next NumPy, not a maths gate. Optional coin extension follows required function/list/loop knowledge. |
| 5 | `beginner/python-algebra:algebra` — solve and substitute expressions | [OpenStax equations](https://openstax.org/books/elementary-algebra-2e/pages/2-2-solve-equations-using-the-division-and-multiplication-properties-of-equality) | B | Worked equations and Try It exercises; addition/subtraction unit linked first. Original paper-first equation/substitution task. | Supporting study, not a required coding gate. Return to Beginner courses. Separate Mathematics worktree untouched. |
| 6 | `beginner/arrays-dataframes:numpy` — arrays, shapes, vectorized arithmetic | [NumPy absolute basics](https://numpy.org/doc/stable/user/absolute_beginners.html) | B | Explanatory beginner tutorial, not an API dump; local vector exercise and selected NumPy 100 problems. | Python lists/functions required. Exact outputs and axis meanings supplied. Next Pandas. Later NumPy 100 difficulty is not required. |
| 7 | `beginner/arrays-dataframes:pandas` — create/filter/summarize a table | [pandas table tutorial](https://pandas.pydata.org/docs/getting_started/intro_tutorials/01_table_oriented.html) | B | Creates an inline table with explanations. Selection/summary tutorials remain supporting links; local missing-value task. | Python lists/dictionaries required. No Titanic file dependency in KAIZ exercise. Next Data Analysis (Intermediate route). |
| 8 | `beginner/arrays-dataframes:math-functions` — evaluate and compose mappings | [OpenStax function notation](https://openstax.org/books/algebra-and-trigonometry-2e/pages/3-1-functions-and-function-notation) | B | Worked evaluation, input/output tables and Try It exercises. Exact composition unit linked before the second challenge. | Paper-first supporting study, independent of Python functions. Return to Beginner courses; not a mandatory prerequisite chain. |
| 9 | `beginner/first-baseline:ml-fundamentals` — fit and evaluate first classifier | [Inria first model](https://inria.github.io/scikit-learn-mooc/python_scripts/02_numerical_pipeline_introduction.html) | A | Worked fit/predict/split teaching and M1.02; original bundled Iris baseline/tree project. | After exploration, supervised concepts and a plain-Python baseline. Metrics bridge before coding. Next Model Evaluation; estimator difference disclosed. |
| 10 | `beginner/first-baseline:supervised-learning` — features versus labels | [Google supervised learning](https://developers.google.com/machine-learning/intro-to-ml/supervised) | B | Focused explanatory training/inference/classification introduction. Original threshold exercise uses ordinary loops instead of unexplained comprehensions. | After Data Analysis, before Baselines. No prior trained model assumed. Provider grading untested. |
| 11 | `beginner/first-baseline:building-baselines` — majority-class reference | [Inria baseline comparison](https://inria.github.io/scikit-learn-mooc/python_scripts/cross_validation_baseline.html) | B | Bounded baseline motivation; provider uses regression, explicitly distinguished from local classification. Original plain-Python training-majority exercise yields 0.25 test accuracy. | After supervised concepts, before First ML Model. Later provider CV code is optional, not an assumed prerequisite. No baseline/model dependency cycle. |
| 12 | `beginner/first-baseline:model-evaluation` — metrics and class imbalance | [Google accuracy/precision/recall](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) | B | Worked classification metrics; original four-row counterexample. Balanced-accuracy formula bridged locally rather than attributed to provider. | End of recommended core, returns to Beginner review. Readiness includes independently reproducing the train-only baseline/tree evaluation with limitations. DL is not next automatically. |
| 13 | `beginner/training-direction:neural-networks` — weighted sum and activation | [Google nodes and hidden layers](https://developers.google.com/machine-learning/crash-course/neural-networks/nodes-hidden-layers) | B | Focused explanatory node/activation lesson; original standard-Python neuron trace. | Explicit optional next-stage preview after classical ML. No torch needed. Return to courses, no implied DL mastery. |
| 14 | `beginner/training-direction:backpropagation` — one scalar chain-rule gradient | [Google backpropagation](https://developers.google.com/machine-learning/crash-course/neural-networks/backpropagation) | B | Public conceptual text inspected, not embedded-video playback. Original derivative/finite-difference check; supporting calculus course disclosed. | Optional next-stage only. Requires derivatives/chain rule; not standalone calculus instruction or full-network training. Return to courses. |
| 15 | `beginner/training-direction:pytorch` — autograd and gradient accumulation | [PyTorch autograd](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html) | B | Exact requires_grad/backward/accumulation tutorial; original CPU scalar example with recomputed graph. | Optional after scalar chain-rule preparation. Official OS-specific install selector; larger provider example is supplementary. Return to courses, not training mastery. |

### Intermediate — 14 identities

| # | Lesson key and skill | Primary resource URL | Grade | Explanation / practice evidence | Level, next step and concrete issue |
|---|---|---|---|---|---|
| 16 | `intermediate/numerical-data:numpy` — numerical arrays | [NumPy tutorial](https://numpy.org/doc/stable/user/absolute_beginners.html) | B | Same example-led guide and local guided array practice as Beginner. | Appropriate Python-to-arrays bridge, not a distinct intermediate course. Next canonical Pandas (Beginner route); progress keys remain separate. |
| 17 | `intermediate/numerical-data:pandas` — tabular data | [pandas table tutorial](https://pandas.pydata.org/docs/getting_started/intro_tutorials/01_table_oriented.html) | B | Same tutorial and self-contained sensor task as Beginner. | Accessible with Python collections. Next Data Analysis. Shared subject does not combine saved completions across profile identities. |
| 18 | `intermediate/numerical-data:descriptive-statistics` — centre and spread | [ML prework checklist](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework) | D | Prerequisites, not a statistics teaching unit. Module-only table-summary prompt. | Assumes school arithmetic. Next Data Processing; mean/median/variance instruction and a focused exercise are still missing here. |
| 19 | `intermediate/prepare-data:data-processing` — repeatable transformations | [pandas tutorial index](https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html) | C | Navigation catalogue points to examples; no focused processing workflow selected. Module only. | pandas background required. Next Data Cleaning. Needs a chosen pipeline example and input/output contract. |
| 20 | `intermediate/prepare-data:data-cleaning` — missing/inconsistent/duplicate data | [pandas tutorial index](https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html) | D | General index does not provide a selected cleaning lesson. Module-only pipeline prompt. | Requires tables and split discipline. Next Data Analysis. Needs missing/duplicate/type examples and train-only imputation practice. |
| 21 | `intermediate/prepare-data:exploratory-analysis` — distributions and limitations | [Inria data exploration](https://inria.github.io/scikit-learn-mooc/python_scripts/01_tabular_data_exploration.html) | A | Worked exploration plus M1.01 inspected; local synthetic eight-row exercise, chart and numerical checks; concise median/sample-variance bridge. | Shared canonical bridge from Beginner Pandas. Next supervised concepts (existing Beginner route), then Baselines and First ML Model. Provider CSV is not required by local exercise. |
| 22 | `intermediate/prepare-data:feature-engineering` — model-ready representation | [Google ML course](https://developers.google.com/machine-learning/crash-course) | A | Structured course with relevant feature content; module-only KAIZ prompt. | Python and basic modelling required. Next Regression. Needs exact feature unit and leakage-safe worked task; A does not mean this KAIZ lesson is complete. |
| 23 | `intermediate/classical-model:regression` — continuous predictions | [Google ML course](https://developers.google.com/machine-learning/crash-course) | A | Course teaching/exercises available at module level; no specific KAIZ regression exercise. | Algebra, features and labels needed. Next Classification is sensible comparison. Select a regression unit and supplied data instead of a broad landing page. |
| 24 | `intermediate/classical-model:classification` — categorical predictions | [Google ML course](https://developers.google.com/machine-learning/crash-course) | A | Structured relevant material; local practice still shared at module level. | Prior ML needed. Next Building Baselines. Needs a distinct classification task, not an unspecified scikit-learn example. |
| 25 | `intermediate/classical-model:building-baselines` — reference comparison | [scikit-learn gallery](https://scikit-learn.org/stable/auto_examples/index.html) | D | Examples catalogue rather than one baseline teaching resource. Module only. | Modelling background required. Next Model Evaluation. Choose an actual trivial-baseline comparison and fixed split. |
| 26 | `intermediate/classical-model:model-evaluation` — task-appropriate scoring | [Metrics guide](https://scikit-learn.org/stable/modules/model_evaluation.html) | C | Reference with examples, not a worked learning sequence. Module only. | Classification/regression basics needed. Next Cross-Validation. Needs one task/cost scenario and metric interpretation. |
| 27 | `intermediate/validation:cross-validation` — separated folds | [Cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html) | C | Detailed guide/examples; no focused supplied-data practice. | First model required. Next Data Leakage is sensible. Scope sections; distinguish model selection from final test evaluation. |
| 28 | `intermediate/validation:data-leakage` — unavailable future information | [Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) | C | Explanations and good/bad code, but reference-only lesson presentation. Module only. | Preprocessing and validation needed. Next Validation Strategies. Needs a concrete contaminated-versus-clean exercise. |
| 29 | `intermediate/validation:validation-strategies` — match split to task | [Cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html) | C | Broad reference, with grouped/time-aware sections. Module only. | Requires cross-validation. Next roadmap review. Needs explicit grouped/time-series scenarios rather than a generic split prompt. |

### Advanced — 11 identities

| # | Lesson key and skill | Primary resource URL | Grade | Explanation / practice evidence | Level, next step and concrete issue |
|---|---|---|---|---|---|
| 30 | `advanced/evaluation:validation-strategies` — realistic validation | [Cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html) | C | Good reference; module-only justification exercise. | Appropriate reference after modelling, not a complete advanced lesson. Next Data Leakage. Needs task-specific constraints and failure cases. |
| 31 | `advanced/evaluation:data-leakage` — leakage audit | [Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) | C | Examples/reference; module-only audit prompt. | Appropriate for experienced users. Next Model Evaluation. Needs concrete leaked feature/timestamp cases and expected reasoning. |
| 32 | `advanced/evaluation:model-evaluation` — metric trade-offs | [Metrics guide](https://scikit-learn.org/stable/modules/model_evaluation.html) | C | API/theory reference, no bounded advanced exercise. | Prior metrics required. Next Neural Networks changes subject rather than deepening evaluation; needs a worked cost/imbalance comparison. |
| 33 | `advanced/representation:neural-networks` — layers, losses, parameters | [PyTorch Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) | B | Worked beginner-in-framework tutorial. Module-only training-loop task. | Python/ML assumed. Next PyTorch is coherent but overlaps the same primary; needs conceptual depth for Advanced. |
| 34 | `advanced/representation:pytorch` — tensor/autograd/training loop | [PyTorch Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) | B | Workflow code/tutorial; no advanced standalone exercise selected. | Python/NumPy/ML needed. Next Training & Regularization. Scope relevant units and CPU execution; tutorial data setup differs from the local Iris journey. |
| 35 | `advanced/representation:training-regularization` — generalization control | [PyTorch Basics introduction](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) | D | Generic workflow introduction is not a regularization lesson. Module only. | Requires training/validation understanding. Next Experiment Tracking. Needs explicit overfit/regularized comparison and held-out curves. |
| 36 | `advanced/experiments:experiment-tracking` — reproducible comparisons | [scikit-learn gallery](https://scikit-learn.org/stable/auto_examples/index.html) | D | Does not select or teach an experiment-recording workflow. Module-only experiment-table prompt. | Modelling/validation required. Next Hyperparameter Tuning. Supply a concrete log schema and reproducible comparison. |
| 37 | `advanced/experiments:hyperparameter-tuning` — search without test overfit | [Search guide](https://scikit-learn.org/stable/modules/grid_search.html) | C | Useful technical examples; no bounded exercise/dataset selected. | Strong validation background required. Next Ensembles. Needs training-side search and untouched-test task with compute limits. |
| 38 | `advanced/experiments:ensemble-methods` — combine estimators | [Ensemble guide](https://scikit-learn.org/stable/modules/ensemble.html) | C | Extensive reference with code, not one lesson sequence. Module only. | Prior base estimators required. Next Upsolving baseline is a workflow return. Needs a scoped method and fair compute/split comparison. |
| 39 | `advanced/upsolving:building-baselines` — authoritative task baseline | [scikit-learn gallery](https://scikit-learn.org/stable/auto_examples/index.html) | D | No particular olympiad task/baseline selected. Module-only solution-review prompt. | Advanced modelling assumed. Next Model Evaluation. Needs a named task, allowed data/tools, metric and baseline reproduction instructions. |
| 40 | `advanced/upsolving:model-evaluation` — solution-review evidence | [Metrics guide](https://scikit-learn.org/stable/modules/model_evaluation.html) | C | Reference, not a task-specific upsolving review. Module only. | Competition experience assumed. Next roadmap review. Needs an actual solution and generalization/error-analysis evidence. |

## Resource access and selection decisions

- [Kaggle Python](https://www.kaggle.com/learn/python),
  [Pandas](https://www.kaggle.com/learn/pandas),
  [Intro ML](https://www.kaggle.com/learn/intro-to-machine-learning) and
  [Intermediate ML](https://www.kaggle.com/learn/intermediate-machine-learning)
  returned titled pages without readable lesson bodies in this review. Specific
  Python/Pandas/first-model notebook pages also exposed no readable body. This is
  **insufficient verification**, not evidence that students cannot use Kaggle.
  Keep these plan selections with their access caveats; do not silently promote
  them to verified primary actions. Account-based exercise execution remains open.
- [Stepik 58852](https://stepik.org/course/58852) timed out; its public API could
  not be retrieved either. Russian-language course preference is retained, but
  scope, current exercise access and availability are not newly claimed verified.
- Helsinki's linked units have public worked explanations. Login is required for
  some quiz/submission functionality; its grading was not tested. B is deliberately
  conservative because only explanations/examples were directly inspected.
- [NumPy 100](https://github.com/rougier/numpy-100) is a practice collection, not a
  standalone first NumPy course. Exercise numbers 3, 6, 7 and 9 were checked in
  the public problem-only list. Later problems are not compulsory. Solutions are
  linked as source material, never copied into KAIZ exercises.
- Inria's [exploration exercise](https://inria.github.io/scikit-learn-mooc/python_scripts/01_tabular_data_exploration_ex_01.html)
  and [first-model exercise](https://inria.github.io/scikit-learn-mooc/python_scripts/02_numerical_pipeline_ex_00.html)
  contain actual practice statements and worked course context. Their relative
  CSV paths require the provider repository. KAIZ uses independent inline data
  or bundled Iris, so no student is asked to run those paths blindly.
- The [Google decision-tree lesson](https://developers.google.com/machine-learning/decision-forests/decision-trees)
  supplies conceptual support; the first-model tutorial uses a different estimator.
  That mismatch is disclosed, not hidden by renaming provider content.
- Google's public [regression exercise](https://developers.google.com/machine-learning/crash-course/linear-regression/programming-exercise)
  and [classification exercise](https://developers.google.com/machine-learning/crash-course/classification/programming-exercise)
  describe concrete coding tasks and link to Colab. Their hosted execution was
  not tested. The regression exercise uses Keras; these are not claimed to be
  drop-in scikit-learn/Iris instructions or zero-programming beginner lessons.
- [Micrograd](https://github.com/karpathy/micrograd),
  [CS231n](https://cs231n.stanford.edu/),
  [CS224N](https://web.stanford.edu/class/cs224n/) and
  [YSDA NLP](https://github.com/yandexdataschool/nlp_course) have public repository/
  course material. They remain advanced references, not replacements for beginner
  programming or evidence of locally verified full CV/NLP courses. Current Khan,
  3Blue1Brown and MIT unit-level access was not reverified in this pass; earlier
  recorded evidence is not relabelled as a new successful check.

## Improved first journey (earlier six-step pass)

1. **Python Basics:** Helsinki variables plus a bounded lists/len/sum bridge;
   original three-score calculation, one-item and empty-input reasoning.
2. **Python Practice:** teaching unit for functions, loop review and return reference;
   deterministic warm-up before seeded coin simulation and invalid-input handling.
3. **NumPy:** introductory explanations, exact vector/shape/axis outcomes, selected
   NumPy 100 exercises rather than an unbounded collection.
4. **Pandas:** DataFrame-first tutorial, then selection/statistics references;
   fully supplied sensor table, missing-value count and non-mutating cleaning.
5. **Data Analysis:** real course exploration/exercise; local eight-row table,
   equal means/different variances, labelled plot and interpretation limitations.
6. **First ML Model:** fit/predict/holdout teaching plus tree explanation; explicit
   installation help, bundled Iris, majority baseline versus a depth-3 tree,
   class-aware metrics and no test-driven tuning. Next is existing cross-validation.

At that earlier stage, all six used one primary resource and retained original practice/readiness/next
identities. Supplementary documentation stays available. Ten additional Beginner
lessons now have distinct original exercises instead of only a repeated module
prompt. The subsequent Beginner polish below replaces its remaining weak primaries
and corrects the recommended teaching order; the old six-step helper remains for
unrelated profile content, not the Beginner recommendation chain.

## Beginner quality polish

All 15 Beginner identities remain unchanged. The recommended core is:
Basics → Practice (conditions/loops) → Functions → Collections → NumPy → Pandas
→ Data Analysis → Supervised Learning → Baselines → First ML Model → Evaluation.
Data Analysis deliberately keeps its existing Intermediate route and progress key.
The other ten core lessons keep their Beginner keys; no stored completion is moved,
merged, inferred or required to unlock another lesson. Counts still cover the
original 15 Beginner identities, including optional/supporting study.

Algebra and mathematical functions are optional paper-first support with focused
OpenStax worked units and exercises. Functions/Collections use exact Helsinki units.
Baselines uses the bounded Inria baseline motivation (regression), clearly contrasted
with an original classification exercise that needs no trained model. Evaluation
uses Google's exact accuracy/precision/recall unit and local balanced-accuracy bridge.
All replacement public teaching text was retrieved and inspected on 2026-10-19;
hosted grading, video playback and provider notebook execution remain untested.

Practice no longer introduces functions, random generators or seeds before teaching
them. The original coin experiment survives as an optional closed extension after
Collections. The baseline task learns a majority only from training labels and
evaluates on deliberately differently distributed test labels (accuracy 0.25).
Supervised Learning uses ordinary loops instead of unexplained comprehensions.
Pandas defines median locally; Analysis bridges sample variance and box-plot meaning;
First ML defines the reported metrics before the code. Evaluation readiness asks the
student to reproduce the Iris workflow independently, not merely copy a score.

The recommended core ends at Evaluation and returns to review. Neural Networks,
Backpropagation and PyTorch are explicitly optional next-stage preparation, not
required beginner mastery. Their individual pages remain accessible, with specific
concept/autograd teaching, prerequisite disclosures and original scalar exercises.
The backpropagation overview is not a replacement for calculus instruction.

Approved styles, Atlas geometry/animation and navigation controls are unchanged.
Beginner area lesson ordering reflects the teaching sequence; other profiles retain
their area ordering. The existing shared Analysis bridge now recommends supervised
concepts before the first model. All original module resources/objectives remain
available in the closed Topic context, rather than being silently removed.

## Iris independence and safety review

The local setup provides virtual-environment and pip commands; installing
`scikit-learn` provides the `sklearn` import. `load_iris` supplies 150 samples,
four numerical inputs and three labels without network data. The existing
stratified seed-42 split keeps 112 training and 38 held-out rows. DummyClassifier
and the tree fit training rows only. No global normalization/feature selection is
fitted before splitting. Metrics use only the held-out predictions/labels.

Instructions now require any optional model selection **before first test
evaluation**, using training-side validation only. The original “look at test,
then change something” wording risked teaching adaptive test-set tuning even
though the fixed example itself did not leak. Seeds reproduce this exercise;
they do not establish external validity. No fixed accuracy threshold, production
readiness, submission judge or olympiad proficiency is claimed.

## Prioritized remaining gaps

1. Replace the six remaining unsuitable Intermediate/Advanced primaries, especially
   statistics, baseline teaching, cleaning, regularization, experiment logs and
   named-task upsolving. Eleven C reference-only selections also need teaching.
2. Author topic-specific Intermediate/Advanced tasks with supplied data, scoped
   prerequisites, expected reasoning and executable solutions where appropriate.
3. Narrow broad Google course/reference links to independently inspected units;
   separate Beginner orientation from genuine Advanced depth and avoid duplicate
   content promises across profiles.
4. Obtain safe provider-side verification for Kaggle/Stepik practice, regional
   access and language options. Never ask for or embed a student's credentials.
5. Author later CV/NLP/specialization material; references and upcoming coverage
   are not equivalent to complete IOAI preparation. No attempt to solve those
   gaps by editing another developer's Mathematics or production work.

## Verification boundaries

`tests/ioai-content-quality.test.mjs` checks all 40 audit keys, all 15 Beginner
practice selections, six-step preparation/outcomes/hints and rendered controls.
`tests/ioai-practice.python.mjs` runs authored examples in a disposable local
Python environment, not inside the app, and checks numerical/data-boundary
invariants. It does not run students' submissions or external provider graders.
See the final verification record below for the actual execution outcome.

### Earlier audit execution record (before Beginner polish)

- All **16 authored worked examples pass**: six guided steps and ten additional
  Beginner exercises. The checks include empty-input rejection, repeatable coin
  sampling, array/table outputs, sample variances, scalar gradients and CPU autograd.
- The Iris execution observes both real estimator fit calls: both receive
  `X_train`/`y_train`, not held-out arrays. Dataset/split/classes and repeatable
  tree predictions pass; no quality-score target is imposed on the tree.
- Disposable environment: Python 3.12.8, NumPy 2.5.4, pandas 3.0.6,
  Matplotlib 3.11.0, scikit-learn 1.9.1, PyTorch 2.14.1. Only PyTorch and its
  dependencies were newly installed for this pass, in the existing disposable
  `/tmp/kaiz-ioai-practice.sgMpR2` environment. No application dependency changed.
- 241 unit regressions, TypeScript, ESLint without warnings, webpack production
  build and diff check pass. The browser suite passes 375/768/1024/1440px in both
  themes, keyboard/history, reduced motion, course navigation and all 133 stable
  routes (including 40 lessons and 85 topics). Browser tests use guest state and
  loopback-only reads; no hosted service or saved-persistence claim is made.
- The approved styles, Atlas canvas, curriculum/route identities, progress code,
  Mathematics worktree and global-motion worktree are preserved. No hosted
  Supabase, Auth, Problem Archive or production change; no commit, push or PR.

### Beginner polish execution record

- **17 distinct authored examples executed**, including the retained optional coin
  experiment and the new conditions/loop task; 20 executions including threshold
  boundary cases. The training-only Iris fit checks, original numerical checks,
  empty-list guard, finite differences and CPU autograd all pass. No packages were
  installed or upgraded for this polish.
- **244 unit regressions pass**, including prerequisite order, canonical identities,
  header/area consistency, verified primary selections and real-completion-only
  recommendations. Inverting the new progress guard makes its regression fail;
  restoring it passes. Guest/error/owner rendering and existing completion tests
  use local boundary stubs, not hosted accounts or writes.
- TypeScript, zero-warning ESLint, webpack production build and diff check pass.
  The known local Turbopack environment limitation is not changed or worked around
  by altering application configuration.
- Browser checks pass at 375/768/1024/1440px, light/dark, through all eleven core
  steps (including Functions/Collections and the existing Intermediate Analysis
  route) and back to Beginner review. Keyboard/history, all six map areas, connector
  anchors, reduced motion, 200% text and all 133 existing routes pass without
  runtime errors. Additional focused checks cover Functions, Collections, Baselines
  and Evaluation at 375/1440px in both themes, consistent top/bottom Next links,
  and the closed-by-default optional coin extension. Screenshots were inspected.
- No real student pilot, provider grader, video playback or hosted persistence
  was tested. Optional backpropagation still requires explicit calculus preparation;
  Intermediate/Advanced completeness and language/access alternatives remain future
  educational work. No inferred mastery or guarantee of olympiad readiness.
