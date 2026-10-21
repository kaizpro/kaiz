# Lesson practice links — PR #53 final UX

Reviewed 2026-10-21. All 40 released lesson identities were audited; no storage keys, content data, XP rules or RLS changed.

## Verification scope

The supplied Kaggle course/competition/community URLs and each selected exercise URL resolved to the matching public publisher title. Kaggle renders exercise bodies client-side, so titles alone are not treated as full verification: selected Kaggle Learn topics were also checked against their original notebooks in [Kaggle/learntools](https://github.com/Kaggle/learntools). Its README identifies these as Kaggle Learn course materials. Each selection carries its original notebook URL in `lesson-practice-links.ts`. Public lesson relevance was checked; signed-in Kaggle execution, grading and enrollment were **not** tested. No automatic completion/verification is claimed or imported into KAIZ.

The supplied [Intro to Programming](https://www.kaggle.com/learn/intro-to-programming), [Python](https://www.kaggle.com/learn/python), [Pandas](https://www.kaggle.com/learn/pandas) and [Intro to ML](https://www.kaggle.com/learn/intro-to-machine-learning) course homes are navigation references; prefer their specific exercise links below. Existing material-access holds remain unchanged. The NumPy collection is a **third-party community notebook**, not an official Kaggle course. Its public title and subject were checked; notebook execution was not tested. [Titanic](https://www.kaggle.com/competitions/titanic) is an optional classification competition requiring its own account/rules acceptance.

## Per-lesson audit

A dash means no sufficiently appropriate Kaggle equivalent was selected. Those lessons retain their original publisher materials and KAIZ practice: OpenStax for supporting maths, PyTorch for PyTorch, existing experiment materials for tracking. No generic Kaggle homepage substitutes. Related SGD/Keras practice is labelled as such, not as symbolic backpropagation or PyTorch practice. The loops exercise is optional further practice and notes its use of functions from the following lesson. Baseline/evaluation exercises are regression-based complements, not claims of covering every classification metric.

| Stable lesson identity | External practice | Selection/access note |
| --- | --- | --- |
| `beginner/python-algebra:python-fundamentals` | [Arithmetic and variables](https://www.kaggle.com/code/alexisbcook/exercise-arithmetic-and-variables) | Kaggle Learn exercise · account required to run and save |
| `beginner/python-algebra:python-control-flow` | [Loops and list comprehensions](https://www.kaggle.com/code/colinmorris/exercise-loops-and-list-comprehensions) | Kaggle Learn · some exercises also use functions from the next lesson |
| `beginner/python-algebra:python-functions` | [Functions and getting help](https://www.kaggle.com/code/colinmorris/exercise-functions-and-getting-help) | Kaggle Learn exercise · account required to run and save |
| `beginner/python-algebra:python-collections` | [Lists](https://www.kaggle.com/code/colinmorris/exercise-lists) | Kaggle Learn exercise · account required to run and save |
| `beginner/python-algebra:algebra` | —; use retained original publisher / KAIZ practice | No invented Kaggle equivalent; original material and manual completion remain. |
| `beginner/arrays-dataframes:numpy` | [NumPy: 50 exercises and solutions](https://www.kaggle.com/code/themlphdstudent/learn-numpy-numpy-50-exercises-and-solution) | Community notebook by theMLphdStudent · not an official Kaggle course |
| `beginner/arrays-dataframes:pandas` | [Indexing, selecting and assigning](https://www.kaggle.com/code/residentmario/exercise-indexing-selecting-assigning) | Kaggle Learn exercise · account required to run and save |
| `beginner/arrays-dataframes:math-functions` | —; use retained original publisher / KAIZ practice | No invented Kaggle equivalent; original material and manual completion remain. |
| `beginner/first-baseline:ml-fundamentals` | [Your first machine learning model](https://www.kaggle.com/code/dansbecker/exercise-your-first-machine-learning-model) | Kaggle Learn exercise · account required to run and save |
| `beginner/first-baseline:supervised-learning` | [Your first machine learning model](https://www.kaggle.com/code/dansbecker/exercise-your-first-machine-learning-model) | Kaggle Learn exercise · account required to run and save |
| `beginner/first-baseline:building-baselines` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `beginner/first-baseline:model-evaluation` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `beginner/training-direction:neural-networks` | [A single neuron](https://www.kaggle.com/code/ryanholbrook/exercise-a-single-neuron) | Kaggle Learn · Keras, not PyTorch · account required |
| `beginner/training-direction:backpropagation` | [Stochastic gradient descent](https://www.kaggle.com/code/ryanholbrook/exercise-stochastic-gradient-descent) | Related training practice in Keras, not a symbolic backpropagation exercise |
| `beginner/training-direction:pytorch` | —; use retained original publisher / KAIZ practice | No invented Kaggle equivalent; original material and manual completion remain. |
| `intermediate/numerical-data:numpy` | [NumPy: 50 exercises and solutions](https://www.kaggle.com/code/themlphdstudent/learn-numpy-numpy-50-exercises-and-solution) | Community notebook by theMLphdStudent · not an official Kaggle course |
| `intermediate/numerical-data:pandas` | [Indexing, selecting and assigning](https://www.kaggle.com/code/residentmario/exercise-indexing-selecting-assigning) | Kaggle Learn exercise · account required to run and save |
| `intermediate/numerical-data:descriptive-statistics` | [Summary functions and maps](https://www.kaggle.com/code/residentmario/exercise-summary-functions-and-maps) | Kaggle Learn exercise · account required to run and save |
| `intermediate/prepare-data:data-processing` | [Pipelines](https://www.kaggle.com/code/alexisbcook/exercise-pipelines) | Kaggle Learn exercise · account required to run and save |
| `intermediate/prepare-data:data-cleaning` | [Missing values](https://www.kaggle.com/code/alexisbcook/exercise-missing-values) | Kaggle Learn exercise · account required to run and save |
| `intermediate/prepare-data:exploratory-analysis` | [Summary functions and maps](https://www.kaggle.com/code/residentmario/exercise-summary-functions-and-maps) | Kaggle Learn exercise · account required to run and save |
| `intermediate/prepare-data:feature-engineering` | [What is feature engineering?](https://www.kaggle.com/code/ryanholbrook/exercise-what-is-feature-engineering) | Kaggle Learn exercise · account required to run and save |
| `intermediate/classical-model:regression` | [Your first machine learning model](https://www.kaggle.com/code/dansbecker/exercise-your-first-machine-learning-model) | Kaggle Learn exercise · account required to run and save |
| `intermediate/classical-model:classification` | [Titanic: Machine Learning from Disaster](https://www.kaggle.com/competitions/titanic) | Classification competition · Kaggle account and acceptance of competition rules required |
| `intermediate/classical-model:building-baselines` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `intermediate/classical-model:model-evaluation` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `intermediate/validation:cross-validation` | [Cross-validation](https://www.kaggle.com/code/alexisbcook/exercise-cross-validation) | Kaggle Learn exercise · account required to run and save |
| `intermediate/validation:data-leakage` | [Data leakage](https://www.kaggle.com/code/alexisbcook/exercise-data-leakage) | Kaggle Learn exercise · account required to run and save |
| `intermediate/validation:validation-strategies` | [Cross-validation](https://www.kaggle.com/code/alexisbcook/exercise-cross-validation) | Kaggle Learn exercise · account required to run and save |
| `advanced/evaluation:validation-strategies` | [Cross-validation](https://www.kaggle.com/code/alexisbcook/exercise-cross-validation) | Kaggle Learn exercise · account required to run and save |
| `advanced/evaluation:data-leakage` | [Data leakage](https://www.kaggle.com/code/alexisbcook/exercise-data-leakage) | Kaggle Learn exercise · account required to run and save |
| `advanced/evaluation:model-evaluation` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `advanced/representation:neural-networks` | [A single neuron](https://www.kaggle.com/code/ryanholbrook/exercise-a-single-neuron) | Kaggle Learn · Keras, not PyTorch · account required |
| `advanced/representation:pytorch` | —; use retained original publisher / KAIZ practice | No invented Kaggle equivalent; original material and manual completion remain. |
| `advanced/representation:training-regularization` | [Overfitting and underfitting](https://www.kaggle.com/code/ryanholbrook/exercise-overfitting-and-underfitting) | Kaggle Learn exercise · account required to run and save |
| `advanced/experiments:experiment-tracking` | —; use retained original publisher / KAIZ practice | No invented Kaggle equivalent; original material and manual completion remain. |
| `advanced/experiments:hyperparameter-tuning` | [Cross-validation](https://www.kaggle.com/code/alexisbcook/exercise-cross-validation) | Kaggle Learn exercise · account required to run and save |
| `advanced/experiments:ensemble-methods` | [XGBoost](https://www.kaggle.com/code/alexisbcook/exercise-xgboost) | Kaggle Learn exercise · account required to run and save |
| `advanced/upsolving:building-baselines` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |
| `advanced/upsolving:model-evaluation` | [Model validation](https://www.kaggle.com/code/dansbecker/exercise-model-validation) | Kaggle Learn exercise · account required to run and save |

## Compact UX and persistence

Each roadmap row is a single native link with a visible focus outline and an accessible description of saved counts/XP. Study Material and topic-specific Practice on Kaggle actions precede a single existing completion/undo control. Instructions, original expected outputs, hints, worked examples and setup remain available in closed-by-default native disclosures. Completion remains a private self-report. Existing educational content files and stable identities are unchanged.

Personal AI Strategist is discoverable directly in desktop navigation, the responsive mobile/laptop menu and Roadmaps shortcuts. `/strategist` links to `/strategist/olympiads` and `/strategist/preparation`; both are static Coming soon pages with no backend, forms or generated output.
