import type { Challenge } from "./types";

const AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%234f46e5'/%3E%3Ctext x='48' y='60' font-size='36' text-anchor='middle' fill='white' font-family='sans-serif'%3EAL%3C/text%3E%3C/svg%3E";

export const challenges: Challenge[] = [
  {
    id: "hello-heading",
    title: "Hello Heading",
    difficulty: "easy",
    brief:
      "Recreate a centered page with a purple main heading and a short paragraph that emphasises the word HTML.",
    hints: [
      "Use <h1> for the main heading and <p> for the paragraph.",
      "Wrap the word HTML in <strong>.",
      "A <style> block can center text with text-align: center.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; text-align: center; }
  h1 { color: #4f46e5; }
</style>

<h1>Hello, Code Mimic!</h1>
<p>I am learning <strong>HTML</strong> one tag at a time.</p>`,
      js: "",
    },
    starter: {
      html: `<style>
  /* your styles */
</style>

<!-- Write your heading and paragraph here -->
`,
      js: "",
    },
    interactions: [],
    tests: [
      {
        name: "Has an <h1> saying “Hello, Code Mimic!”",
        check: `document.querySelector('h1')?.textContent.trim() === 'Hello, Code Mimic!'`,
      },
      {
        name: "HTML is emphasised with <strong>",
        check: `document.querySelector('p strong')?.textContent.trim() === 'HTML'`,
      },
      {
        name: "Heading is purple (#4f46e5)",
        check: `getComputedStyle(document.querySelector('h1')).color === 'rgb(79, 70, 229)'`,
      },
    ],
    betterSolution: {
      html: `<style>
  body { font-family: system-ui, sans-serif; text-align: center; }
  h1 { color: #4f46e5; }
</style>

<main>
  <h1>Hello, Code Mimic!</h1>
  <p>I am learning <strong>HTML</strong> one tag at a time.</p>
</main>`,
      js: "",
      notes: [
        "Wrapping the page content in <main> tells screen readers where the primary content is.",
        "<strong> conveys importance; prefer it over <b>, which is purely visual.",
        "system-ui picks the platform's native font for a cleaner look.",
      ],
    },
  },
  {
    id: "shopping-list",
    title: "Shopping List",
    difficulty: "easy",
    brief:
      "Build a shopping list (unordered) and a set of recipe steps (ordered), each under its own heading.",
    hints: [
      "Unordered lists use <ul>, ordered lists use <ol>, items use <li>.",
      "Give the unordered list the class \"list\".",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  .list { color: #0f766e; }
</style>

<h2>Shopping List</h2>
<ul class="list">
  <li>Apples</li>
  <li>Bread</li>
  <li>Milk</li>
  <li>Eggs</li>
</ul>

<h2>Recipe Steps</h2>
<ol>
  <li>Slice the bread</li>
  <li>Scramble the eggs</li>
  <li>Serve with apple slices</li>
</ol>`,
      js: "",
    },
    starter: {
      html: `<h2>Shopping List</h2>
<!-- add the lists here -->
`,
      js: "",
    },
    interactions: [],
    tests: [
      {
        name: "Unordered list has 4 items",
        check: `document.querySelectorAll('ul li').length === 4`,
      },
      {
        name: "Ordered list has 3 steps",
        check: `document.querySelectorAll('ol li').length === 3`,
      },
      {
        name: "The <ul> has class \"list\"",
        check: `!!document.querySelector('ul.list')`,
      },
    ],
    betterSolution: {
      html: `<style>
  body { font-family: system-ui, sans-serif; }
  .list { color: #0f766e; }
</style>

<section aria-labelledby="shopping">
  <h2 id="shopping">Shopping List</h2>
  <ul class="list">
    <li>Apples</li>
    <li>Bread</li>
    <li>Milk</li>
    <li>Eggs</li>
  </ul>
</section>

<section aria-labelledby="steps">
  <h2 id="steps">Recipe Steps</h2>
  <ol>
    <li>Slice the bread</li>
    <li>Scramble the eggs</li>
    <li>Serve with apple slices</li>
  </ol>
</section>`,
      js: "",
      notes: [
        "Use <ol> whenever the order matters (steps) and <ul> when it does not.",
        "Grouping each list with its heading in a <section> gives the page a clear outline.",
      ],
    },
  },
  {
    id: "profile-card",
    title: "Profile Card",
    difficulty: "easy",
    brief:
      "Make a profile card with an avatar image, a name, a role and a link. The image needs alternative text.",
    hints: [
      "Every <img> needs an alt attribute describing it.",
      "Links use <a href=\"...\">.",
      "Use a <div class=\"card\"> as the container and style it with border and padding.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  .card { width: 220px; padding: 16px; border: 1px solid #ddd; border-radius: 12px; text-align: center; }
  .card img { border-radius: 50%; }
  .role { color: #6b7280; }
</style>

<div class="card">
  <img src="${AVATAR}" alt="Ada Lovelace avatar" width="96" height="96">
  <h2>Ada Lovelace</h2>
  <p class="role">First Programmer</p>
  <a href="https://en.wikipedia.org/wiki/Ada_Lovelace">Read more</a>
</div>`,
      js: "",
    },
    starter: {
      html: `<style>
  .card { }
</style>

<div class="card">
  <!-- avatar, name, role, link -->
</div>
`,
      js: "",
    },
    interactions: [],
    tests: [
      {
        name: "Image has alt text",
        check: `!!document.querySelector('.card img')?.getAttribute('alt')?.trim()`,
      },
      {
        name: "Name is in an <h2>",
        check: `document.querySelector('.card h2')?.textContent.trim() === 'Ada Lovelace'`,
      },
      {
        name: "Card has a link with an href",
        check: `!!document.querySelector('.card a[href]')`,
      },
    ],
    betterSolution: {
      html: `<style>
  body { font-family: system-ui, sans-serif; }
  .card { width: 220px; padding: 16px; border: 1px solid #ddd; border-radius: 12px; text-align: center; }
  .card img { border-radius: 50%; }
  .role { color: #6b7280; }
</style>

<article class="card">
  <img src="${AVATAR}" alt="Ada Lovelace avatar" width="96" height="96">
  <h2>Ada Lovelace</h2>
  <p class="role">First Programmer</p>
  <a href="https://en.wikipedia.org/wiki/Ada_Lovelace">Read more about Ada</a>
</article>`,
      js: "",
      notes: [
        "<article> is a better fit than <div> for a self-contained card.",
        "Setting width and height on <img> reserves space and prevents layout shift while it loads.",
        "Descriptive link text (“Read more about Ada”) helps screen-reader users who navigate by links.",
      ],
    },
  },
  {
    id: "data-table",
    title: "Data Table",
    difficulty: "easy",
    brief:
      "Show a small table of planets with a caption, a header row, and three body rows.",
    hints: [
      "Use <table>, <caption>, <thead>, <tbody>, <tr>, <th> and <td>.",
      "Header cells go in <th>, data cells in <td>.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 6px 12px; }
  th { background-color: #eef2ff; }
</style>

<table>
  <caption>Inner Planets</caption>
  <thead>
    <tr><th>Planet</th><th>Moons</th><th>Day length</th></tr>
  </thead>
  <tbody>
    <tr><td>Mercury</td><td>0</td><td>59 days</td></tr>
    <tr><td>Venus</td><td>0</td><td>243 days</td></tr>
    <tr><td>Earth</td><td>1</td><td>24 hours</td></tr>
  </tbody>
</table>`,
      js: "",
    },
    starter: {
      html: `<table>
  <!-- caption, head and body -->
</table>
`,
      js: "",
    },
    interactions: [],
    tests: [
      { name: "Has a <caption>", check: `!!document.querySelector('table caption')` },
      {
        name: "Header row has 3 <th> cells",
        check: `document.querySelectorAll('thead th').length === 3`,
      },
      {
        name: "Body has 3 rows",
        check: `document.querySelectorAll('tbody tr').length === 3`,
      },
    ],
    betterSolution: {
      html: `<table>
  <caption>Inner Planets</caption>
  <thead>
    <tr><th scope="col">Planet</th><th scope="col">Moons</th><th scope="col">Day length</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Mercury</th><td>0</td><td>59 days</td></tr>
    <tr><th scope="row">Venus</th><td>0</td><td>243 days</td></tr>
    <tr><th scope="row">Earth</th><td>1</td><td>24 hours</td></tr>
  </tbody>
</table>`,
      js: "",
      notes: [
        "scope=\"col\" / scope=\"row\" tells assistive tech which header labels each cell.",
        "The first cell of each row names the row, so it can be a <th scope=\"row\">.",
      ],
    },
  },
  {
    id: "signup-form",
    title: "Signup Form",
    difficulty: "medium",
    brief:
      "Create a signup form with labelled Name, Email and Password fields and a submit button. Use ids name, email and password.",
    hints: [
      "Connect each <label for=\"x\"> to an <input id=\"x\">.",
      "Use type=\"email\" and type=\"password\" so the browser helps the user.",
      "Mark the fields required.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  form { display: grid; gap: 8px; width: 240px; }
  button { background-color: #4f46e5; color: white; border: none; padding: 8px; border-radius: 6px; }
</style>

<form>
  <label for="name">Name</label>
  <input id="name" type="text" required>

  <label for="email">Email</label>
  <input id="email" type="email" required>

  <label for="password">Password</label>
  <input id="password" type="password" minlength="8" required>

  <button type="submit">Sign up</button>
</form>`,
      js: "",
    },
    starter: {
      html: `<form>
  <!-- labels, inputs and a button -->
</form>
`,
      js: "",
    },
    interactions: [],
    tests: [
      {
        name: "Every input has a matching <label for>",
        check: `[...document.querySelectorAll('input')].length === 3 && [...document.querySelectorAll('input')].every(i => i.id && document.querySelector('label[for="' + i.id + '"]'))`,
      },
      {
        name: "Email field uses type=\"email\"",
        check: `document.querySelector('#email')?.type === 'email'`,
      },
      {
        name: "Password field uses type=\"password\"",
        check: `document.querySelector('#password')?.type === 'password'`,
      },
      {
        name: "Has a submit button",
        check: `!!document.querySelector('form button[type="submit"], form button:not([type])')`,
      },
    ],
    betterSolution: {
      html: `<form>
  <label for="name">Name</label>
  <input id="name" name="name" type="text" autocomplete="name" required>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required>

  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>

  <button type="submit">Sign up</button>
</form>`,
      js: "",
      notes: [
        "name attributes are what actually get sent when the form submits.",
        "autocomplete hints let password managers and browsers fill fields correctly.",
        "minlength lets the browser validate password length without any JavaScript.",
      ],
    },
  },
  {
    id: "click-counter",
    title: "Click Counter",
    difficulty: "medium",
    brief:
      "A counter with a +1 button (id inc) and a Reset button (id reset). The number lives in a span with id count.",
    hints: [
      "Keep the count in a variable declared with let.",
      "Use addEventListener('click', ...) on each button.",
      "Update the span with textContent.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  #count { font-weight: bold; font-size: 24px; }
</style>

<p>Count: <span id="count">0</span></p>
<button id="inc">+1</button>
<button id="reset">Reset</button>`,
      js: `const countEl = document.getElementById("count");
let count = 0;

document.getElementById("inc").addEventListener("click", () => {
  count++;
  countEl.textContent = count;
});

document.getElementById("reset").addEventListener("click", () => {
  count = 0;
  countEl.textContent = count;
});`,
    },
    starter: {
      html: `<p>Count: <span id="count">0</span></p>
<!-- buttons -->
`,
      js: `// Make the buttons work
`,
    },
    interactions: [
      { action: "click", selector: "#inc" },
      { action: "click", selector: "#inc" },
      { action: "click", selector: "#inc" },
      { action: "click", selector: "#reset" },
      { action: "click", selector: "#inc" },
      { action: "click", selector: "#inc" },
    ],
    tests: [
      { name: "Has #inc and #reset buttons", check: `!!document.querySelector('button#inc') && !!document.querySelector('button#reset')` },
      {
        name: "Shows 2 after +1 ×3, Reset, +1 ×2",
        check: `document.getElementById('count')?.textContent.trim() === '2'`,
      },
    ],
    betterSolution: {
      html: `<p>Count: <output id="count">0</output></p>
<button id="inc" type="button">+1</button>
<button id="reset" type="button">Reset</button>`,
      js: `const countEl = document.getElementById("count");
let count = 0;

function render() {
  countEl.textContent = String(count);
}

document.getElementById("inc").addEventListener("click", () => {
  count += 1;
  render();
});

document.getElementById("reset").addEventListener("click", () => {
  count = 0;
  render();
});`,
      notes: [
        "A single render() function keeps the DOM in sync with state in one place.",
        "<output> is the semantic element for a calculated value.",
        "type=\"button\" prevents accidental form submission if the buttons end up inside a form.",
      ],
    },
  },
  {
    id: "theme-toggle",
    title: "Theme Toggle",
    difficulty: "medium",
    brief:
      "A button (id toggle) switches the page between light and dark by toggling the class dark on <body>. Its label flips between “Dark mode” and “Light mode”.",
    hints: [
      "document.body.classList.toggle('dark') returns true when the class was added.",
      "Put the dark colours in a body.dark { ... } CSS rule.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; background-color: white; color: #111; }
  body.dark { background-color: #111827; color: #f9fafb; }
</style>

<h1>Theme Toggle</h1>
<p>Click the button to switch themes.</p>
<button id="toggle">Dark mode</button>`,
      js: `const toggle = document.getElementById("toggle");

toggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  toggle.textContent = isDark ? "Light mode" : "Dark mode";
});`,
    },
    starter: {
      html: `<style>
  body.dark { }
</style>

<h1>Theme Toggle</h1>
`,
      js: ``,
    },
    interactions: [{ action: "click", selector: "#toggle" }],
    tests: [
      { name: "Body has class dark after one click", check: `document.body.classList.contains('dark')` },
      { name: "Button now says “Light mode”", check: `document.getElementById('toggle')?.textContent.trim() === 'Light mode'` },
      {
        name: "Dark background applied",
        check: `getComputedStyle(document.body).backgroundColor === 'rgb(17, 24, 39)'`,
      },
    ],
    betterSolution: {
      html: `<style>
  body { font-family: system-ui, sans-serif; background-color: white; color: #111; }
  body.dark { background-color: #111827; color: #f9fafb; }
</style>

<h1>Theme Toggle</h1>
<p>Click the button to switch themes.</p>
<button id="toggle" type="button" aria-pressed="false">Dark mode</button>`,
      js: `const toggle = document.getElementById("toggle");

toggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  toggle.textContent = isDark ? "Light mode" : "Dark mode";
  toggle.setAttribute("aria-pressed", String(isDark));
});`,
      notes: [
        "aria-pressed tells screen readers that this is a toggle and whether it is on.",
        "Using the return value of classList.toggle avoids a separate contains() check.",
      ],
    },
  },
  {
    id: "render-list",
    title: "Render a List from an Array",
    difficulty: "medium",
    brief:
      "Given an array of fruits in JavaScript, render each as a <li> inside <ul id=\"fruits\">, and write the total into <p id=\"total\"> as “4 fruits”.",
    hints: [
      "Loop with for...of or forEach.",
      "Create elements with document.createElement('li') and set textContent.",
      "Use a template literal for the total: `${fruits.length} fruits`.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  #fruits li { padding: 2px 0; }
</style>

<h2>Fruit Basket</h2>
<ul id="fruits"></ul>
<p id="total"></p>`,
      js: `const fruits = [
  { name: "Apple", emoji: "🍎" },
  { name: "Banana", emoji: "🍌" },
  { name: "Cherry", emoji: "🍒" },
  { name: "Grapes", emoji: "🍇" },
];

const list = document.getElementById("fruits");

for (const fruit of fruits) {
  const li = document.createElement("li");
  li.textContent = fruit.emoji + " " + fruit.name;
  list.appendChild(li);
}

document.getElementById("total").textContent = \`\${fruits.length} fruits\`;`,
    },
    starter: {
      html: `<h2>Fruit Basket</h2>
<ul id="fruits"></ul>
<p id="total"></p>
`,
      js: `const fruits = [
  { name: "Apple", emoji: "🍎" },
  { name: "Banana", emoji: "🍌" },
  { name: "Cherry", emoji: "🍒" },
  { name: "Grapes", emoji: "🍇" },
];

// Render the list here
`,
    },
    interactions: [],
    tests: [
      { name: "Renders 4 list items", check: `document.querySelectorAll('#fruits li').length === 4` },
      { name: "First item is “🍎 Apple”", check: `document.querySelector('#fruits li')?.textContent.trim() === '🍎 Apple'` },
      { name: "Total says “4 fruits”", check: `document.getElementById('total')?.textContent.trim() === '4 fruits'` },
    ],
    betterSolution: {
      html: `<h2>Fruit Basket</h2>
<ul id="fruits"></ul>
<p id="total"></p>`,
      js: `const fruits = [
  { name: "Apple", emoji: "🍎" },
  { name: "Banana", emoji: "🍌" },
  { name: "Cherry", emoji: "🍒" },
  { name: "Grapes", emoji: "🍇" },
];

const items = fruits.map(({ name, emoji }) => {
  const li = document.createElement("li");
  li.textContent = \`\${emoji} \${name}\`;
  return li;
});

document.getElementById("fruits").replaceChildren(...items);
document.getElementById("total").textContent = \`\${fruits.length} fruits\`;`,
      notes: [
        "replaceChildren(...items) updates the DOM in one operation instead of one append per item.",
        "textContent (not innerHTML) is safe even if the data contains < or > characters.",
        "Destructuring ({ name, emoji }) keeps the mapping readable.",
      ],
    },
  },
  {
    id: "char-counter",
    title: "Live Character Counter",
    difficulty: "hard",
    brief:
      "A <textarea id=\"msg\" maxlength=\"50\"> with a counter <p id=\"counter\"> showing “N / 50” that updates as you type. Add the class warn to the counter when N is over 40.",
    hints: [
      "Listen for the input event on the textarea.",
      "classList.toggle('warn', condition) adds or removes a class based on a boolean.",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  textarea { width: 260px; height: 80px; }
  #counter { color: #6b7280; }
  #counter.warn { color: #dc2626; font-weight: bold; }
</style>

<label for="msg">Message</label><br>
<textarea id="msg" maxlength="50"></textarea>
<p id="counter">0 / 50</p>`,
      js: `const msg = document.getElementById("msg");
const counter = document.getElementById("counter");
const max = 50;

msg.addEventListener("input", () => {
  const length = msg.value.length;
  counter.textContent = \`\${length} / \${max}\`;
  counter.classList.toggle("warn", length > 40);
});`,
    },
    starter: {
      html: `<textarea id="msg" maxlength="50"></textarea>
<p id="counter">0 / 50</p>
`,
      js: ``,
    },
    interactions: [
      { action: "type", selector: "#msg", value: "Hello world" },
    ],
    tests: [
      { name: "Counter shows “11 / 50” after typing “Hello world”", check: `document.getElementById('counter')?.textContent.trim() === '11 / 50'` },
      { name: "No warn class under 40 characters", check: `!document.getElementById('counter')?.classList.contains('warn')` },
      {
        name: "warn class added over 40 characters",
        check: `(() => { const m = document.getElementById('msg'); m.value = 'x'.repeat(45); m.dispatchEvent(new Event('input', { bubbles: true })); const ok = document.getElementById('counter').classList.contains('warn'); m.value = 'Hello world'; m.dispatchEvent(new Event('input', { bubbles: true })); return ok; })()`,
      },
    ],
    betterSolution: {
      html: `<label for="msg">Message</label><br>
<textarea id="msg" maxlength="50" aria-describedby="counter"></textarea>
<p id="counter" aria-live="polite">0 / 50</p>`,
      js: `const msg = document.getElementById("msg");
const counter = document.getElementById("counter");
const max = msg.maxLength;
const warnAt = 40;

function update() {
  const { length } = msg.value;
  counter.textContent = \`\${length} / \${max}\`;
  counter.classList.toggle("warn", length > warnAt);
}

msg.addEventListener("input", update);
update();`,
      notes: [
        "Reading msg.maxLength keeps the limit defined in one place (the HTML).",
        "aria-live=\"polite\" announces the updated count to screen-reader users.",
        "Calling update() once on load keeps the counter right if the browser restores text.",
      ],
    },
  },
  {
    id: "mini-todo",
    title: "Mini Todo",
    difficulty: "hard",
    brief:
      "A todo list: type in <input id=\"new\">, click <button id=\"add\"> to append an <li> to <ul id=\"todos\">. Each item shows its text in a <span> and has a <button class=\"remove\"> that deletes it. Ignore empty input and clear the field after adding.",
    hints: [
      "Trim the input value and return early if it is empty.",
      "Build each item with createElement so user text is never parsed as HTML.",
      "Attach one click listener to the <ul> and check event.target.closest('.remove') (event delegation).",
    ],
    reference: {
      html: `<style>
  body { font-family: sans-serif; }
  #todos { padding-left: 0; list-style: none; }
  #todos li { display: flex; gap: 8px; padding: 4px 0; }
  .remove { color: #dc2626; }
</style>

<h2>Todos</h2>
<label for="new">New todo</label>
<input id="new" placeholder="What needs doing?">
<button id="add">Add</button>
<ul id="todos"></ul>`,
      js: `const input = document.getElementById("new");
const list = document.getElementById("todos");

document.getElementById("add").addEventListener("click", () => {
  const text = input.value.trim();
  if (text === "") return;

  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  const remove = document.createElement("button");
  remove.className = "remove";
  remove.textContent = "✕";

  li.append(span, remove);
  list.appendChild(li);
  input.value = "";
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".remove");
  if (button) button.parentElement.remove();
});`,
    },
    starter: {
      html: `<h2>Todos</h2>
<label for="new">New todo</label>
<input id="new" placeholder="What needs doing?">
<button id="add">Add</button>
<ul id="todos"></ul>
`,
      js: ``,
    },
    interactions: [
      { action: "type", selector: "#new", value: "Buy milk" },
      { action: "click", selector: "#add" },
      { action: "type", selector: "#new", value: "Walk the dog" },
      { action: "click", selector: "#add" },
      { action: "type", selector: "#new", value: "   " },
      { action: "click", selector: "#add" },
      { action: "click", selector: "#todos li:first-child .remove" },
    ],
    tests: [
      { name: "Blank input is ignored and one item is removed (1 left)", check: `document.querySelectorAll('#todos li').length === 1` },
      { name: "Remaining item is “Walk the dog”", check: `document.querySelector('#todos li span')?.textContent.trim() === 'Walk the dog'` },
      { name: "Each item has a .remove button", check: `document.querySelectorAll('#todos li .remove').length === 1` },
      {
        name: "Adding an item clears the input",
        check: `(() => { const input = document.getElementById('new'); const count = () => document.querySelectorAll('#todos li').length; const before = count(); input.value = 'Temp'; input.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('add').click(); const ok = count() === before + 1 && input.value === ''; if (count() > before) document.querySelector('#todos li:last-child').remove(); return ok; })()`,
      },
    ],
    betterSolution: {
      html: `<style>
  body { font-family: system-ui, sans-serif; }
  #todos { padding-left: 0; list-style: none; }
  #todos li { display: flex; gap: 8px; padding: 4px 0; }
  .remove { color: #dc2626; }
</style>

<h2>Todos</h2>
<form id="todo-form">
  <label for="new">New todo</label>
  <input id="new" placeholder="What needs doing?" autocomplete="off">
  <button id="add">Add</button>
</form>
<ul id="todos"></ul>`,
      js: `const form = document.getElementById("todo-form");
const input = document.getElementById("new");
const list = document.getElementById("todos");

function createTodo(text) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "✕";
  remove.setAttribute("aria-label", \`Remove \${text}\`);

  li.append(span, remove);
  return li;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  list.append(createTodo(text));
  input.value = "";
  input.focus();
});

list.addEventListener("click", (event) => {
  event.target.closest(".remove")?.closest("li").remove();
});`,
      notes: [
        "A <form> with a submit handler makes the Enter key work for free.",
        "createTodo() separates building an item from handling events, so it is easy to reuse and test.",
        "One delegated listener on the <ul> handles every remove button, including ones added later.",
        "aria-label gives each ✕ button a meaningful name for screen readers.",
      ],
    },
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
