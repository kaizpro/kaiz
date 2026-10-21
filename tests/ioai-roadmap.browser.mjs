// Loopback-only, guest-only QA. Build/start with backend environment values empty.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadTypescript } from "./helpers/load-typescript.mjs";
const base = new URL(process.env.KAIZ_LEARNING_URL ?? "http://127.0.0.1:3101");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));
assert.ok(process.env.KAIZ_PLAYWRIGHT_MODULE, "Use an already-installed Playwright module");
const { chromium } = await import(pathToFileURL(process.env.KAIZ_PLAYWRIGHT_MODULE).href);
const load = loadTypescript();
const { learningStepHref } = load("lib/learning/learning-steps.ts");
const { beginnerCore: learningSteps } = load("lib/learning/beginner-learning.ts");
const { journeys } = load("lib/learning/journeys.ts");
const { courseFor, lessonHref } = load("lib/learning/course.ts");
const { getTopics } = load("lib/learning/curriculum.ts");
const output = process.env.KAIZ_SCREENSHOTS ?? "/tmp/kaiz-roadmap-ux";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  for (const width of [375, 768, 1024, 1440]) for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "no-preference" });
    await context.addInitScript(value => localStorage.setItem("theme", value), theme);
    await context.route("**/*", route => new URL(route.request().url()).origin === base.origin && ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const go = path => page.goto(base.origin + path);
    async function layout() {
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow: ${width} ${theme} ${page.url()}`);
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
    }
    async function screenshot(name) { await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(480); await page.screenshot({ path: join(output, `${name}-${width}-${theme}.png`), animations: "disabled" }); }
    async function scrollSettled() {
      // Keyboard focus can initiate smooth scrolling independently of the hash.
      // Let that finish before Enter starts a second, competing anchor scroll.
      await page.evaluate(() => new Promise((resolve, reject) => {
        const started = performance.now(); let previous = scrollY, stable = 0;
        function frame() {
          stable = Math.abs(scrollY - previous) < .1 ? stable + 1 : 0;
          previous = scrollY;
          if (stable >= 6 && performance.now() - started >= 120) return resolve();
          if (performance.now() - started > 4000) return reject(new Error('Scroll did not settle'));
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }));
    }
    async function noRunningAnimations(label) {
      // Desktop has no mobile toggle click between navigation and this check.
      // Sample the visible lesson after fonts and two paint frames, not a timer.
      await page.getByRole('heading', {level: 1}).waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => ({name: a.animationName, transition: a.transitionProperty, target: a.effect?.target?.tagName})));
      assert.deepEqual(running, [], label);
    }
    async function pathGeometry() {
      await page.waitForFunction(() => document.querySelector('[data-atlas-connections] path'));
      await page.waitForTimeout(380);
      const geometry = await page.locator('[data-atlas-connections]').evaluate(svg => {
        const bounds=svg.getBoundingClientRect(), root=svg.parentElement.querySelector('[data-atlas-root]').getBoundingClientRect();
        const vertical=getComputedStyle(svg.parentElement).getPropertyValue('--atlas-vertical').trim()==='1';
        const nodes=[...svg.parentElement.querySelectorAll('[data-atlas-orb]')].map(n=>n.getBoundingClientRect()).filter(n=>n.width>0);
        const paths=[...svg.querySelectorAll('path:not([data-active="true"])')];
        return paths.map((path,i)=>{const first=path.getPointAtLength(0),last=path.getPointAtLength(path.getTotalLength()),node=nodes[i];return {startX:bounds.x+first.x,startY:bounds.y+first.y,endX:bounds.x+last.x,endY:bounds.y+last.y,rootX:root.x+root.width/2,rootY:root.bottom,targetX:vertical?node.left:node.x+node.width/2,targetY:vertical?node.y+node.height/2:node.top};});
      });
      assert.ok(geometry.length===6 || geometry.length===1);
      for(const n of geometry){assert.ok(Math.abs(n.startX-n.rootX)<2&&Math.abs(n.startY-n.rootY)<2,'root anchor');assert.ok(Math.abs(n.endX-n.targetX)<2&&Math.abs(n.endY-n.targetY)<2,'node anchor');}
      const active = page.locator('[data-atlas-connections] path[data-active="true"]');
      if(await active.count())assert.equal(await active.evaluate(path=>{const svg=path.ownerSVGElement.getBoundingClientRect(),end=path.getPointAtLength(path.getTotalLength()),panel=document.querySelector('[data-atlas-branch]').getBoundingClientRect();return Math.abs(svg.x+end.x-(panel.x+panel.width/2))<2&&Math.abs(svg.y+end.y-panel.top)<2;}),true,'expanded branch anchor');
    }
    await go("/roadmaps"); await layout();
    assert.equal(await page.locator('section[aria-label$="roadmap progress"]').count(), 3);
    assert.equal(await page.locator("[data-entry-profile], main details, [data-path-area]").count(), 0, "classic entry stays compact, not map/card-first");
    await screenshot("A-landing");
    await page.getByRole('link',{name:'Browse Beginner roadmap',exact:true}).focus(); await page.keyboard.press("Enter");
    await page.waitForURL(url => url.pathname === "/roadmaps/beginner"); await layout();
    assert.equal(await page.locator("[data-course-module]").count(), 4);
    const start = page.locator('[data-classic-next]');
    assert.equal(await start.isVisible(), true);
    assert.ok((await start.boundingBox()).y + (await start.boundingBox()).height < 1000, "primary action is above the fold");
    assert.equal(await page.locator("[data-primary-material]").count(), 0, 'full instructional materials remain on the lesson, not the compact overview');
    await screenshot("B-beginner-path");
    const firstModule=page.locator('[data-course-module]').first();
    await firstModule.locator(':scope > summary').focus();await page.keyboard.press('Enter');
    assert.equal(await firstModule.getAttribute('open'),null);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator("[data-path-area]").count(), 0, "classic module browsing does not require the map");
    assert.equal(await page.locator('[data-classic-next]').count(),1);
    const maths = firstModule.locator('summary').filter({hasText:'Supporting maths'});
    await maths.waitFor();await maths.focus();await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('link',{name:'Open lesson 1.5: Algebra',exact:true}).isVisible(),true);
    await page.keyboard.press('Enter');
    await screenshot("C-classic-modules");
    await start.focus();await page.keyboard.press('Enter');
    for (const [index, step] of learningSteps.entries()) {
      await page.waitForURL(url => decodeURIComponent(url.pathname) === decodeURIComponent(learningStepHref(step)));
      await page.locator('#check > summary').waitFor(); await layout();
      const contents = page.getByRole('navigation',{name:'Course contents',exact:true});
      const toggle = page.locator('summary').filter({hasText:/^Course contents$/});
      assert.equal(await contents.isVisible(),false);
      await toggle.focus();await page.keyboard.press('Enter');
      assert.equal(await contents.isVisible(),true);
      assert.equal(await contents.locator('[aria-current="page"]').count(),1);
      assert.equal(await contents.locator('[aria-current="page"]').getAttribute('href'),learningStepHref(step), 'course entry keeps canonical identity');
      await toggle.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator("[data-primary-material] a[target='_blank']").count(), 1);
      assert.equal(await page.getByRole("progressbar").count(), 0, "no fake guest progress");
      if (index === 0) await screenshot("D-python-lesson");
      if (index === 0) {
        await toggle.click();
        const lessonLink = contents.getByRole('link',{name:/1.2 Python Practice/});
        await lessonLink.focus();assert.notEqual(await lessonLink.evaluate(element=>getComputedStyle(element).outlineStyle),'none');
        await page.keyboard.press('Enter');await page.waitForURL(url=>decodeURIComponent(url.pathname)===decodeURIComponent(learningStepHref(learningSteps[1])));
        await page.goBack();await page.waitForURL(url=>decodeURIComponent(url.pathname)===decodeURIComponent(learningStepHref(step)));
        if(await contents.isVisible()) await toggle.click();
      }
      const practice = page.getByRole('navigation',{name:'Learning step sections'}).getByRole('link',{name:/Practice/});
      await practice.focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.hash==='#practice');
      await page.locator('#check > summary').focus();await page.keyboard.press('Enter');
      await page.getByText(step.readiness[0],{exact:true}).waitFor();
      const why = page.locator("summary").filter({ hasText: "Why this lesson" });
      await why.focus(); await page.keyboard.press("Enter");
      await page.locator("#learn").getByText(step.objective, { exact: true }).waitFor();
      const example = page.locator("#practice > div > details > summary").filter({ hasText: "Worked example" });
      await example.focus(); await page.keyboard.press("Enter");
      assert.equal((await page.locator("#practice pre code").first().innerText()).trimEnd(), step.practice.code.trimEnd());
      const learnLink = page.getByRole("navigation", { name: "Learning step sections" }).getByRole("link", { name: /Learn/ });
      await learnLink.focus(); await scrollSettled(); await page.keyboard.press("Enter");
      try {
        await page.waitForFunction(() => document.querySelector("#learn").getBoundingClientRect().top >= document.querySelector("body > header").getBoundingClientRect().bottom - 1);
      } catch (error) {
        console.error(JSON.stringify({width, theme, step: step.topicId, anchor: await page.evaluate(() => ({top: document.querySelector('#learn').getBoundingClientRect().top, header: document.querySelector('body > header').getBoundingClientRect().bottom, scroll: scrollY, margin: getComputedStyle(document.querySelector('#learn')).scrollMarginTop}))}));
        throw error;
      }
      await layout();
      if (index === 0) {
        await page.getByRole("navigation", { name: "Lesson context" }).getByRole("link", { name: "Beginner roadmap", exact: true }).click();
        await page.waitForURL(url => url.pathname === '/roadmaps/beginner');
        await page.getByRole("list", { name: "Module 1 lessons" }).getByRole("link", { name: /Python Basics/ }).click();
        await page.locator("#next a").waitFor();
      }
      await page.locator("#next a").focus(); await page.keyboard.press("Enter");
    }
    await page.waitForURL("**/roadmaps/beginner");
    for (const [profile, title] of [["intermediate", "NumPy"], ["advanced", "Validation Strategies"]]) {
      await go("/roadmaps/beginner"); await page.getByRole("navigation", { name: "Starting profile" }).getByRole("link", { name: new RegExp(profile, "i") }).click();
      await page.waitForURL(url => url.pathname === "/roadmaps/" + profile);
      assert.ok((await page.locator('[data-classic-next]').innerText()).includes('Start learning'));
      await page.locator('[data-classic-next]').click();
      await page.waitForURL(url => url.pathname.includes('/lessons/'));
      await page.getByRole("heading", { level: 1 }).waitFor(); await layout();
      assert.ok((await page.getByRole('heading',{level:1}).innerText()).endsWith(title), 'existing numbered lesson headings stay valid');
      if(profile==='intermediate') {await page.getByRole('navigation',{name:'Learning step sections'}).getByRole('link',{name:/Practice/}).click();await page.waitForURL(url=>url.hash==='#practice');}
    }
    for (let area = 1; area <= 6; area++) {
      await go("/roadmaps/beginner?area=" + area);
      await page.getByRole('heading',{name:'Beginner AI Olympiad Roadmap',exact:true}).waitFor(); await layout();
      await go("/roadmaps/beginner?view=map&area=" + area);
      await page.locator("#area-heading").waitFor(); await layout();await pathGeometry();
    }
    await go('/roadmaps/beginner');await page.getByRole('link',{name:'Explore Skill Atlas',exact:true}).click();
    await page.waitForURL(url=>url.searchParams.get('view')==='map');await pathGeometry();await screenshot('E-skill-atlas');
    await page.getByRole('link',{name:/^Explore Python/}).click();await pathGeometry();
    await page.getByRole('link',{name:'Collapse Python lessons',exact:true}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.startsWith('Explore Python'));
    await page.goBack();await page.locator('#area-heading').waitFor();await page.goForward();await page.waitForURL(url=>!url.searchParams.has('area'));
    await page.emulateMedia({reducedMotion:'reduce'});await go('/roadmaps/beginner?view=map&area=1');await pathGeometry();
    await noRunningAnimations('reduced motion has no running animation');
    await go(learningStepHref(learningSteps[0]));
    await page.locator('summary').filter({hasText:/^Course contents$/}).click();
    await noRunningAnimations('lesson and contents respect reduced motion');
    await page.addStyleTag({content:'html { font-size: 200% !important; }'});await layout();
    await go('/roadmaps/beginner');await page.addStyleTag({content:'html { font-size: 200% !important; }'});await layout();
    await go("/roadmaps/beginner?view=map");
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" }); await layout(); await pathGeometry();
    await screenshot("text-200");
    await page.getByRole("link", { name: /^Explore Python/ }).focus();
    const focus = await page.getByRole("link", { name: /^Explore Python/ }).evaluate(element => getComputedStyle(element).outlineStyle);
    assert.notEqual(focus, "none", "keyboard focus stays visible");
    await page.getByRole("link", { name: "Mathematics", exact: true }).click();
    await page.waitForURL(url => url.pathname === "/learn");
    assert.equal(new URL(page.url()).searchParams.get('track'),'mathematics');
    await page.locator('#node-math-foundations').click();
    await page.locator('#node-algebra').click();
    await page.waitForURL(url=>url.pathname==='/learn/algebra');
    await page.getByRole('heading',{name:'Algebra',exact:true}).waitFor();await layout();
    await page.goBack();await page.locator('#node-math-foundations').waitFor();
    await context.close();
    console.log(`PASS ${width}px ${theme}: direct CTA, courses/contents, map/connectors, keyboard, history, all three journeys, all areas, 200% text, reduced motion`);
  }
  const context = await browser.newContext();
  const routes = ["/roadmaps", "/start", ...journeys.flatMap(path => [`/roadmaps/${path.level}`, `/start/${path.level}`, ...courseFor(path).flatMap(unit => unit.lessons.map(lesson => lessonHref(path.level, lesson.id)))]), ...getTopics().map(topic => `/learn/${topic.slug}`)];
  for (const path of routes) { const response = await context.request.get(base.origin + path); assert.equal(response.status(), 200, path); assert.match(await response.text(), /<h1/); }
  assert.equal((await context.request.get(base.origin + "/roadmaps/beginner/lessons/not-real")).status(), 404);
  await context.close(); assert.deepEqual(errors, []);
  console.log(`PASS all ${routes.length} routes, including 40 stable lessons and 85 topics; no runtime errors. Screenshots: ${output}`);
} finally { await browser.close(); }
