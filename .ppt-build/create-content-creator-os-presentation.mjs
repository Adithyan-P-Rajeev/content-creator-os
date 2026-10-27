import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Content Creator OS';
pptx.subject = 'Project seminar presentation';
pptx.title = 'Content Creator OS';
pptx.company = 'Content Creator OS';
pptx.lang = 'en-IN';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-IN',
};
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';

const C = { navy: '101828', ink: '263238', muted: '5E6B78', blue: '5B6EF5', pale: 'EEF1FF', green: '0F9D78', light: 'F7F8FC', white: 'FFFFFF', line: 'D9DFE8' };
const W = 13.333;

function addFooter(slide, n) {
  slide.addText('Content Creator OS  |  Project Seminar', { x: 0.55, y: 7.08, w: 5.5, h: 0.18, fontFace: 'Aptos', fontSize: 8, color: '8792A2', margin: 0 });
  slide.addText(String(n), { x: 12.25, y: 7.05, w: 0.5, h: 0.2, fontFace: 'Aptos', fontSize: 9, color: '8792A2', align: 'right', margin: 0 });
}

function addTitle(slide, title, subtitle = '') {
  slide.background = { color: C.white };
  slide.addText(title, { x: 0.7, y: 0.48, w: 11.8, h: 0.52, fontFace: 'Aptos Display', fontSize: 27, bold: true, color: C.navy, margin: 0 });
  if (subtitle) slide.addText(subtitle, { x: 0.72, y: 1.08, w: 11.3, h: 0.3, fontFace: 'Aptos', fontSize: 12, color: C.muted, margin: 0 });
  slide.addShape(pptx.ShapeType.line, { x: 0.7, y: 1.48, w: 11.95, h: 0, line: { color: C.line, width: 1 } });
}

function addBullets(slide, bullets, x = 0.9, y = 1.85, w = 11.3, size = 19) {
  const runs = [];
  bullets.forEach((b, i) => {
    runs.push({ text: b, options: { bullet: { indent: 16 }, breakLine: i < bullets.length - 1 } });
  });
  slide.addText(runs, { x, y, w, h: 4.55, fontFace: 'Aptos', fontSize: size, color: C.ink, breakLine: false, paraSpaceAfterPt: 15, margin: 0.03, valign: 'top' });
}

function addCode(slide, code, x, y, w, h) {
  slide.addText(code, { x, y, w, h, fontFace: 'Courier New', fontSize: 14, color: 'E6EDF3', fill: { color: '18222E' }, margin: 0.2, breakLine: false, fit: 'shrink' });
}

// 1
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };
  s.addImage({ path: 'public/workflow.png', x: 7.65, y: 0, w: 5.683, h: 7.5, transparency: 22 });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 7.5, fill: { color: C.navy, transparency: 18 }, line: { color: C.navy, transparency: 100 } });
  s.addText('Content Creator OS', { x: 0.78, y: 1.55, w: 6.4, h: 0.8, fontFace: 'Aptos Display', fontSize: 37, bold: true, color: C.white, margin: 0 });
  s.addText('Project Seminar Presentation', { x: 0.82, y: 2.55, w: 5.8, h: 0.35, fontFace: 'Aptos', fontSize: 18, color: 'D8DEFF', margin: 0 });
  s.addText('A simple workflow app for planning content from idea to published', { x: 0.82, y: 3.15, w: 5.9, h: 0.75, fontFace: 'Aptos', fontSize: 20, color: C.white, breakLine: false, margin: 0 });
  s.addText('React  •  Vite  •  Axios  •  json-server', { x: 0.82, y: 5.82, w: 5.5, h: 0.28, fontFace: 'Aptos', fontSize: 13, color: 'B9C4FF', margin: 0 });
}

// 2
{
  const s = pptx.addSlide(); addTitle(s, 'Project Overview', 'What this application solves');
  addBullets(s, [
    'I built this project for content creators who need one place to manage their work.',
    'The user can capture an idea, add research, plan recordings, and mark content as published.',
    'The main goal is to make the content workflow clear and easy to follow.',
    'The dashboard keeps every content item connected to one stage.'
  ], 0.9, 1.85, 7.0, 18);
  s.addText('Idea', { x: 8.65, y: 2.0, w: 2.5, h: 0.38, fontSize: 24, bold: true, color: C.blue, align: 'center', margin: 0 });
  s.addText('Research', { x: 8.65, y: 2.9, w: 2.5, h: 0.38, fontSize: 24, bold: true, color: C.green, align: 'center', margin: 0 });
  s.addText('Recordings', { x: 8.65, y: 3.8, w: 2.5, h: 0.38, fontSize: 24, bold: true, color: C.blue, align: 'center', margin: 0 });
  s.addText('Published', { x: 8.65, y: 4.7, w: 2.5, h: 0.38, fontSize: 24, bold: true, color: C.green, align: 'center', margin: 0 });
  addFooter(s, 2);
}

// 3
{
  const s = pptx.addSlide(); addTitle(s, 'Technology Used', 'The frontend, API layer, and local data store');
  addBullets(s, [
    'React builds the screen with small reusable components.',
    'Vite runs and builds the React project quickly.',
    'CSS controls the layout, colours, forms, cards, and responsive design.',
    'Axios sends requests from React to the backend API.',
    'json-server reads and updates items stored in the db.json file.'
  ], 0.9, 1.85, 8.2, 18);
  addCode(s, "React UI\n   ↓\nAxios API calls\n   ↓\njson-server on port 3001\n   ↓\ndb.json", 9.45, 2.0, 2.65, 2.55);
  addFooter(s, 3);
}

// 4
{
  const s = pptx.addSlide(); addTitle(s, 'First Screen: Landing Page', 'The first screen introduces the product before the dashboard opens');
  addBullets(s, [
    'The first page shows the project name, a workflow background, Log in, and Launch app buttons.',
    'The Header component contains the brand and main actions.',
    'The Footer component shows the four workflow steps: Idea, Research, Record, and Publish.',
    'The LoginModal component opens when the user clicks Log in.'
  ], 0.9, 1.85, 7.3, 18);
  addCode(s, "page === 'landing'\n  ? <Landing />\n  : <Dashboard />", 8.9, 2.25, 2.75, 1.15);
  s.addText('I use this condition to switch between the landing page and dashboard without a separate router.', { x: 8.9, y: 3.75, w: 3.2, h: 1.1, fontSize: 16, color: C.muted, margin: 0 });
  addFooter(s, 4);
}

// 5
{
  const s = pptx.addSlide(); addTitle(s, 'Dashboard and Stage Navigation', 'The screen changes when the selected stage changes');
  addBullets(s, [
    'The sidebar displays item counts for Total, In Progress, and Published.',
    'I store the selected stage in state: const [stage, setStage] = useState(\'Idea\').',
    'When I click a stage button, setStage changes the current stage.',
    'The visible cards update automatically because React renders the new state.'
  ], 0.9, 1.85, 7.3, 18);
  addCode(s, "const stages = [\n  'Idea', 'Research',\n  'Recordings', 'Published'\n]\n\nstages.map(s => ...) ", 8.85, 1.95, 3.25, 2.35);
  s.addText('map() creates the stage buttons from one array. I used it so I do not need to write the same button four times.', { x: 8.85, y: 4.7, w: 3.25, h: 1.05, fontSize: 15.5, color: C.muted, margin: 0 });
  addFooter(s, 5);
}

// 6
{
  const s = pptx.addSlide(); addTitle(s, 'Adding and Editing an Idea', 'New ideas begin in the Idea stage');
  addBullets(s, [
    'When I click New Idea, showForm changes and React displays the form.',
    'The form stores title, start date, and due date using useState.',
    'When I submit, addItem() creates a new item and sends it to the API.',
    'The Edit button opens a modal. saveEdit() updates the title and dates.'
  ], 0.9, 1.85, 7.25, 18);
  addCode(s, "async function addItem(e) {\n  e.preventDefault()\n  const created = await\n    itemsApi.create(payload)\n  setItems(prev =>\n    [...prev, created])\n}", 8.85, 1.9, 3.3, 2.6);
  s.addText('preventDefault() stops the page refresh. The spread operator keeps old items and adds the new item to the list.', { x: 8.85, y: 4.95, w: 3.3, h: 0.95, fontSize: 15.5, color: C.muted, margin: 0 });
  addFooter(s, 6);
}

// 7
{
  const s = pptx.addSlide(); addTitle(s, 'Search, Filter, and Delete', 'The user sees only the matching cards');
  addBullets(s, [
    'The search box stores the typed value in the search state.',
    'filter() keeps only items in the selected stage and items that match the search text.',
    'toLowerCase() makes search work with capital or small letters.',
    'When I click Delete, deleteItem() calls the API and filter() removes that card from the screen.'
  ], 0.9, 1.85, 7.3, 18);
  addCode(s, "const visible = items.filter(i => {\n  if (i.stage !== stage) return false\n  return i.title\n    .toLowerCase().includes(q)\n})", 8.85, 1.9, 3.3, 2.2);
  s.addText('This project does not use pagination or slice(). It displays all cards that match the selected stage and search.', { x: 8.85, y: 4.7, w: 3.2, h: 1.0, fontSize: 15.5, color: C.muted, margin: 0 });
  addFooter(s, 7);
}

// 8
{
  const s = pptx.addSlide(); addTitle(s, 'Moving Through the Workflow', 'Next and Back update the stage field for one item');
  addBullets(s, [
    'Each card has Next and Back buttons based on its current stage.',
    'indexOf() finds the current stage position in the stages array.',
    'moveItem() calls patchItem() with the next or previous stage.',
    'PATCH updates only the changed field instead of replacing the full item.'
  ], 0.9, 1.85, 7.15, 18);
  addCode(s, "const stageIdx =\n  stages.indexOf(stage)\n\nmoveItem(item.id,\n  stages[stageIdx + 1])\n\napi.patch(`/items/${id}`, body)", 8.75, 1.9, 3.45, 2.55);
  s.addText('This is why a card moves from Idea to Research, then Recordings, and finally Published.', { x: 8.75, y: 4.95, w: 3.45, h: 0.8, fontSize: 15.5, color: C.muted, margin: 0 });
  addFooter(s, 8);
}

// 9
{
  const s = pptx.addSlide(); addTitle(s, 'Research and Recording Features', 'Different stages show different tools');
  addBullets(s, [
    'In Research, the user writes notes and can add reference images.',
    'FileReader changes an uploaded image into data that the app can save with the item.',
    'In Recordings, checkboxes track Intro, Main Content, Closing, and B-Roll.',
    'includes() checks whether a recording section exists. filter() removes it when unchecked.'
  ], 0.9, 1.85, 7.25, 18);
  addCode(s, "const recs = current.includes(section)\n  ? current.filter(r => r !== section)\n  : [...current, section]", 8.85, 2.1, 3.25, 1.45);
  s.addText('I used stage conditions so users see research tools only in Research and recording tools only in Recordings.', { x: 8.85, y: 4.4, w: 3.25, h: 1.05, fontSize: 15.5, color: C.muted, margin: 0 });
  addFooter(s, 9);
}

// 10
{
  const s = pptx.addSlide(); addTitle(s, 'Conclusion and Future Improvement', 'What I completed and what I can add next');
  addBullets(s, [
    'Content Creator OS manages content from the first idea until publishing.',
    'React state connects user actions to immediate screen updates.',
    'Axios and json-server keep the item data saved locally through API calls.',
    'In the next version, I can add real login, user-specific content, cloud image storage, and a calendar view.'
  ], 0.9, 1.85, 10.9, 19);
  s.addText('Thank you', { x: 0.9, y: 5.85, w: 4.2, h: 0.6, fontFace: 'Aptos Display', fontSize: 31, bold: true, color: C.blue, margin: 0 });
  addFooter(s, 10);
}

await pptx.writeFile({ fileName: 'deliverables/content-creator-os-seminar-presentation.pptx' });
