# IOAI roadmap improvements

## Scope and ownership

Extends the existing Roadmaps system after the user-confirmed handoff from
Tima / Zhunussov to Bekzhan, related to Issues #26 and #28. Tima retains release
ownership. This work does not change Problem Archive, Auth, hosted services,
schema, dependency manifests or global navigation.

Based on main `9709ef8db6fc58d4d18675ada214e66245078e6d`, in a separate
`feature/ioai-roadmap-improvements` worktree. The original checkout and its
uncommitted Mathematics Guided Learning work are not copied, reset or committed.
Mathematics references use the existing stable `/learn/[slug]` topics; integration
of the separate unmerged Mathematics feature is a later review decision.

## One system, not another curriculum

Routes remain `/roadmaps`, `/roadmaps/[level]` and
`/roadmaps/[level]/lessons/[lesson]`; `/start` aliases remain functional.
All 85 topic identities and all 40 released course/progress keys stay unchanged.
No progress RPC, counter, XP calculation or completion behavior is replaced.
Existing saved progress is real self-reporting, not a test of proficiency.

`ioai-curriculum.ts` projects the existing source inventory into six editorial
levels: Foundations, Working with Data, Classical Machine Learning, Deep
Learning, AI Specializations and IOAI Preparation. It reuses the shared
topic registry and retains gaps with no dedicated topic as upcoming, without
creating empty lesson routes. The official categories are checked against the
[IOAI 2026 syllabus, pages 2–3](https://ioai-official.org/wp-content/uploads/2025/10/Syllabus.pdf).
School maths and competition-study habits are separately marked KAIZ
Preparation; they are not misrepresented as official syllabus entries.

Beginner / Intermediate / Advanced are starting recommendations into the same
curriculum. Existing overview and completion records retain these route keys.
They do not gate access or calculate diagnostic proficiency. Strong-maths
students can skip supporting maths; Python users can jump to arrays or the first
model. C++ and competitive programming remain optional.

## First guided journey

`learning-steps.ts` supplies original objectives, practice, readiness and next
actions for Python Basics → Python Practice → NumPy → Pandas → Data Analysis →
First ML Model. These enrich existing course lessons rather than adding progress
identities. Data Analysis uses the existing Intermediate analysis lesson; the
recommended next action returns to the existing Beginner ML lesson. The old
module-order links are a secondary disclosure so they do not compete with the
guided Next action.

Each step has one primary Learn resource, local Practice, self-reported Check
criteria and Next. Additional maths/resources, Python setup and worked examples
are native keyboard-accessible disclosures. Navigation never completes a lesson.
Examples run on the student's machine; no code execution or judging endpoint
exists. The Iris project uses bundled data, a stratified held-out split, a dummy
baseline, a small tree, accuracy/macro-F1, seeds, and leakage/tuning warnings.
It teaches workflow, not full IOAI readiness. No score threshold is promised.

## Resource review — 2026-10-18

`ioai-materials.ts` records provider, exact URL, language, difficulty, type,
prerequisites, access and dated evidence. It annotates existing publisher
selections and adds exact introductory documentation sections where useful.
Verified means public content and topic relevance were inspected, not that
provider enrollment or every exercise was tested. Only verified annotations
produce new active actions. Known uncertain URLs are also held in the existing
lesson-material renderer, without deleting their provenance.

- Verified first-journey materials: Python introduction/control flow; NumPy
  beginner guide and NumPy 100; pandas selection/statistics/plotting tutorials;
  scikit-learn getting started, Iris and leakage guidance.
- Verified later selections: Google ML Crash Course, MIT linear algebra/calculus,
  Harvard Stat 110, Mathematics for ML, Micrograd, PyTorch Basics, Stanford
  CS231n/CS224N, YSDA NLP and the organizer's IOAI 2024 archive. They are labelled
  at their actual difficulty, not promoted as beginner Python lessons.
- Partial checks: Kaggle Python/Pandas/Intro ML/Intermediate ML and Khan Academy
  exposed client-rendered shells; the 3Blue1Brown collection redirected to a
  filtered homepage. CU's public outline is available, but registration-gated
  lessons/historical numbering were not verified.
- Stepik 58852, 272073 and 272087 could not be retrieved. This is an observation
  of the verification attempt, not proof of a global outage.
- The supplied IOAI `/problems/` URL returned 404. The verified
  [2024 organizer archive](https://ioai-official.org/2024-tasks/) is used instead.

The original source catalogues/order and old topic materials are retained.
Unannotated legacy materials keep their previous evidence; they are not
claimed to have been reverified by this milestone.

## Checks

Fast checks: `node --test tests/*.test.mjs`, `npm run typecheck`,
`npm run lint`, `npx --no-install next build --webpack`, `git diff --check`.
The new unit tests cover shared IDs, six levels, all topic/resource references,
three starting profiles, the six-step chain, unknown IDs and held resources.

`tests/ioai-roadmap.browser.mjs` uses an existing Playwright installation via
`KAIZ_PLAYWRIGHT_MODULE` and loopback `KAIZ_LEARNING_URL`. Build/start with
Supabase environment values empty. It blocks external and write requests, tests
the complete keyboard journey, three profiles, tree return, 375/768/1024/1440px,
both themes, reduced motion, 200% text, all 40 lessons and 85 topics.
Screenshots are written outside the repository.

`KAIZ_PRACTICE_PYTHON=/path/to/disposable/python node tests/ioai-practice.python.mjs`
executes the six guided worked examples and ten additional Beginner examples,
including CPU PyTorch autograd, and checks output invariants locally.
It never installs dependencies or calls KAIZ/hosted APIs. These maintainer
checks do not validate a student's submitted work.

## Boundaries

Higher levels retain existing materials but are not claimed to be fully authored
guided courses. Dedicated coverage for the seven source-inventory topic gaps
(including audio) is still upcoming. Browser QA is guest/local only; this task
does not revalidate signed-in database persistence, production access, mobile
hardware or provider login flows.

## Local verification result

TypeScript, ESLint (no warnings), 221/221 unit regressions, webpack production
build and diff checks passed. All six worked examples executed successfully
with local Python 3.12, NumPy 2.5.4, pandas 3.0.6, scikit-learn 1.9.1 and
Matplotlib 3.11.0. The environment is disposable and outside the repository;
no application dependency was added.

The IOAI browser suite passed every requested width/theme, full keyboard
navigation, sticky-header section offsets, reduced motion and 200% text,
plus 133 existing routes. The original Learning Tree browser suite also passed
unchanged, including connector alignment, browser history and 85 topic routes.
Screenshots were inspected in desktop and mobile, light and dark.

Known follow-ups: provider-authenticated verification is still needed for the
seven partially verified resources. Four unavailable-at-check URLs are held.
The existing npm installation reports five high-severity dependency advisories;
no dependency upgrade or security-fix claim is included in this educational task.

## Roadmap UX presentation (earlier iteration)

The entry now has only three large Beginner / Intermediate / Advanced cards.
No syllabus, resource catalogue, progress pitch or educational explanations
precede those choices. Each profile opens six connected area nodes; the suggested
start varies by profile without gating the other nodes.

Selecting a node opens only that area's lesson branch. Selection is represented
by the existing overview route's bounded `?area=1` through `?area=6` query.
Native links retain browser history and a context-aware return from lessons.
The presentation-only `ioai-navigation.ts` projects existing curriculum/course
records, preserving every released lesson identity across the three profiles.
Maths is separated into optional supporting links, not a required numbered Python
sequence. Broader topic references and unavailable dedicated coverage are labelled
separately from real course lessons.

The lesson hierarchy is Learn / Practice / Next. The primary resource is
prominent; objectives, explanations, supplementary materials, syllabus categories
and mentor provenance remain reachable in the lesson rather than the overview.
Readiness criteria, original exercises, setup/safety instructions and completion
controls are retained. Only matching persisted rows show a lesson as completed;
an area highlight means recommended start, not progress or mastery.

Design contract: semantic KAIZ colours and existing icons; three obvious entry
actions; six simple circular area nodes; no resource prose before lesson selection;
visible keyboard focus and 44px-minimum primary targets. Desktop follows a
root-connected six-node atlas; mobile uses a vertical tree with flexible node
heights for enlarged text. Connectors follow layout rather than screenshot
coordinates. Motion uses short node entrances, connector tracing, active/hover
feedback and branch/content reveals, disabled for reduced motion.

References were the clarity of
[Duolingo's path](https://blog.duolingo.com/new-duolingo-home-screen-design/)
and the connected-map idea of
[roadmap.sh](https://roadmap.sh/ai-data-scientist).
Neither branding nor a locked linear progression is adopted.

The browser suite captures A landing, B initial Beginner path, C selected Python
branch and D Python lesson at 375/768/1024/1440px in light/dark. It checks URL
selection, return/history, profile switches, connector geometry, the complete
six-step journey, optional maths, 200% text and existing route integrity.

Final redesigned-presentation checks: 228/228 regressions, TypeScript, ESLint
(no warnings), webpack production build and diff checks passed. The production
browser matrix passed all eight width/theme combinations, 133 routes and
the unchanged full Learning Tree suite. Forty screenshots cover the four
requested screens plus enlarged-text views. Curriculum, resource annotations,
practice data, the 85-topic registry and released course identities are byte-for-byte
unchanged from the pre-redesign version. No Docker or hosted-service tests were
needed for this presentation-only revision.

## Approved Skill Atlas integration (visual foundation)

Concept A is the visual foundation, not a separate curriculum or route system.
The screen's job is to orient a student and expose one useful next action.
The root connects six circular area nodes; selecting an area highlights it and
expands only that area's lessons inside the map. Native links preserve bounded
URL selection, deep links, browser history, profile switching and collapse via
All areas. On smaller screens, only the selected area remains above its branch;
collapsing restores the entire tree. Mathematics is a compact, closed-by-default
optional disclosure rather than a prerequisite lane.

One recommended next lesson is the only guidance borrowed from Concept B.
Within an area it is the first lesson without an available matching persisted
completion. The overview starts at the chosen profile's suggested area and
continues through remaining areas, including earlier areas as open review.
Completion requires both the existing roadmap ID and lesson ID; guests and
unavailable-progress states never treat supplied rows as saved evidence. When
all applicable lessons are complete, no fabricated next lesson is shown.
Recommendations never restrict another lesson or mark anything complete.

The server retains the curriculum and progress rendering. The small client
canvas measures decorative SVG paths with ResizeObserver and a batched animation
frame on layout/size changes, not a per-frame loop. Pixel-coordinate SVG paths
do not stretch when the branch changes the canvas height. Root, node and branch
anchors remain stationary while inner content appears. No graph library,
animation dependency, global design token or backend change is introduced.

Motion uses 150ms feedback, 240ms branch entrances and 330ms node/connector
entrances with a short stagger. Resource hover and lesson-level entrance
feedback do not animate lesson paragraphs individually. Reduced motion removes
these animations/transitions; navigation and native disclosures work without
waiting for any animation to finish. Existing completion/undo/XP controls,
verified resources, original practice and all released identities are retained.

Regression checks cover recommendation identity/isolation, completed areas,
cross-area continuation, the single in-map branch and compact maths. Browser QA
checks normal and reduced motion, all four viewport widths in both themes,
keyboard/focus, geometry, history, all profiles/areas, six guided steps, enlarged
text and all existing lesson/topic routes. Screenshots and preview artifacts
remain outside the repository. Hosted services and the separate Mathematics
worktree are outside this verification's scope.

Atlas verification: 230/230 unit regressions, TypeScript, ESLint, webpack
production build and diff checks pass. The production-browser matrix passes
375/768/1024/1440px in both themes, normal/reduced motion, collapse focus return,
all areas/profiles, history, 200% text, six guided steps and all 133 routes.
Desktop motion sampling records zero initial layout shift and zero branch-anchor
drift in both themes. Forty screenshots cover entry/map/Python/lesson screens
and enlarged text; desktop captures use a full 1440px viewport. No signed-in
hosted persistence or production verification is claimed. Newer main changes
are competition-only and remain unmerged into this uncommitted design branch.

## Current UX: guided entry, courses, then exploration

The navigation refinement supersedes the earlier map-first overview described
above without replacing the approved Atlas. A profile opens one direct next-lesson
action, followed by six compact course links and secondary **Explore Skill Map**.
The screen's job is to start learning, not explain the whole curriculum. It uses
KAIZ's semantic colours, existing icons and local IOAI/Atlas motion tokens;
Kaggle-style clarity is a product principle, not copied branding or a new design.

Existing `?area=1` through `?area=6` URLs now open a standalone course contents
view. `?view=map` retains the complete interactive Atlas; its area links preserve
that mode during expansion/collapse. Both views render the same existing lesson
projection and optional supporting references. Mathematics opens the existing
Mathematics Learning Tree and its existing topics, not a new curriculum.
Native links retain deep linking and browser back/forward behavior.

The primary action says **Continue Learning** only when available matching saved
completion records exist in this profile's projected courses. Guests, failed reads,
unrecognized records and merely opened lessons do not claim completion. When all
projected lessons are complete the action becomes open course review, with no
invented next lesson. Nothing automatically writes progress or locks a lesson.

Lesson pages use one course navigation tree: a compact sticky sidebar from
1100px, or a keyboard-operable **Course Contents** disclosure below that width.
The current lesson has `aria-current="page"` and a text label. Supporting maths
stays distinct from the numbered coding lessons. Previous/next links preserve
the existing guided sequence; older lessons keep their original module sequence.
Learn / Practice / Next and the primary resource remain prominent. Readiness
checks are now a closed native disclosure; all criteria, exercises, worked examples,
setup instructions, provenance and completion controls are retained.

The only added client state controls the mobile course navigation visibility.
Short entrance/disclosure/hover feedback reuses local tokens and is disabled for
reduced motion. No global-motion branch changes or dependencies are integrated.
Browser QA uses a backend-disabled local production build, isolated Chrome
contexts and loopback-only reads. Signed-in rendering is tested with mocked
progress states; real signed-in persistence is not revalidated here.

Refinement verification: 237/237 unit regressions, TypeScript, ESLint (no warnings),
webpack production build and diff check pass. All three requested journeys,
course sidebar/disclosure keyboard navigation, history, connector alignment,
reduced motion and 200% text pass at 375/768/1024/1440px in both themes. All
133 existing entry/profile/lesson/topic routes pass, including 40 lessons and
85 topics, with no browser runtime errors. Overview and lesson initial CLS was
0 at 375px and 1440px in both themes. The Atlas canvas/styles, curriculum,
resources, practice data, progress implementation and both separate Mathematics
and global-motion worktrees are unchanged. No commit, push or hosted action
was performed. Screenshots remain outside Git in `/tmp/kaiz-learning-ux`.

## Educational quality pass

The [complete 40-lesson content audit](educational-quality-audit.md) records
per-lesson primary URLs, evidence-based A/B/C/D grading, practice, access,
level suitability, next steps and remaining gaps. This pass changes resource
selections and authored exercises, not the approved layout or curriculum IDs.
Python now has specific teaching-unit primaries; the first exploration/model
steps use Inria's course. Official reference material stays supplementary.
Every Beginner lesson has a distinct local self-check with prerequisites,
expected outcomes and optional hints; later advanced subjects remain previews,
not a claim of educational completion or olympiad readiness.

## Beginner quality polish — 2026-10-19

The approved UX is unchanged. Beginner recommendations now teach conditions/loops,
functions and collections before data tools; exploration and supervised concepts
lead into a plain-Python baseline, the existing Iris project, then Model Evaluation.
The existing Intermediate Analysis identity is reused, not duplicated. Algebra and
mathematical functions remain supporting study; Deep Learning is optional next-stage
preparation, not mandatory beginner mastery. All 40 lesson IDs, 85 topic routes and
saved-progress semantics are preserved. See `educational-quality-audit.md` for the
current per-lesson resource assessment, teaching scope and verification boundaries.
