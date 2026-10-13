# YouTube script — Session 3: Functions, Closures, `this` & Immutability

A 12–13 minute recorded demo session. It teaches closures, `debounce`, `this`
and immutable updates for real, using the ShopScope Lite cart, and shows where
each idea lives in React and Angular code.

---

## 1. Video metadata

**Title options**

1. Why Your Button Throws "Cannot read properties of undefined" (JavaScript `this`, Explained)
2. Closures, `this` and Immutability: the JavaScript Behind React Hooks and Angular Services
3. One Cart, Built Twice: React-Hook Style vs Angular-Service Style in Plain JavaScript

**Thumbnail text (max 5 words):** `this` IS UNDEFINED?!

**YouTube description**

> Why does a perfectly good class method throw "Cannot read properties of
> undefined" the moment you pass it to a button? And why do React and Angular
> keep telling you not to mutate state?
>
> In this session we build a shopping cart twice in plain JavaScript: once as a
> closure-based store (the way React hooks work) and once as a class service
> (the way Angular works). Along the way you'll write debounce from scratch,
> fix the classic `this` bug three ways, and see why `prev === next` is how
> frameworks detect change cheaply.
>
> Chapters
> 00:00 The bug: "Cannot read properties of undefined"
> 00:30 What we're building
> 01:15 Closures and debounce, from scratch
> 03:45 A closure-based store with immutable updates
> 06:15 A class service and the `this` bug
> 08:45 Where you'll meet this in React and Angular
> 11:15 Recap
>
> This is Session 3 of JavaScript & TypeScript Foundations, the 5-day
> preparation track for the React and Angular programs at Deesha Tech Academy,
> taught by Vishal Shah (20 years in the industry).
>
> Register at deeshatechacademy.com
> https://deeshatechacademy.com

**Tags:** javascript closures, javascript this keyword, cannot read properties of undefined, debounce javascript, javascript bind, arrow functions vs regular functions, javascript classes private fields, immutability javascript, react stale closure, react usestate functional update, useSyncExternalStore, angular services, angular onpush, rxjs behaviorsubject, react vs angular, deesha tech academy, vishal shah

---

## 2. Recording setup

- **Browser (left, about 60% of the screen):** the *solution* app running with
  `npm run dev` at `http://localhost:5173`. DevTools docked at the bottom,
  **Console** tab open, cleared.
- **Editor (right, about 40%):** the *solution* folder open, with these tabs
  in order: `src/store/CartService.js`, `src/lib/fn.js`,
  `src/store/createCartStore.js`, `src/lib/cart.js`, `src/main.js`.
- **Before you hit record:** in `CartService.js`, comment out the five
  `this.x = this.x.bind(this);` lines in the constructor and save. The cold
  open needs the bug. Empty the cart, set the panel to **createCartStore**.
- **Font size:** editor 18–20 px, browser zoom 125%, DevTools font bumped
  (`Ctrl/Cmd +` inside DevTools). Hide bookmarks bar, notifications off.
- **Snippets:** copy the four React and Angular snippets from Segment 4 into a
  scratch editor tab before recording, so you paste instead of typing.

---

## 3. The script

### [00:00–00:30] Cold open: the `this` bug

**ON SCREEN**
- Browser. Click the **CartService · Angular service style** toggle in the cart panel.
- Click **Add to cart** on the mascara. Nothing happens in the cart.
- Point at the Console: red `Uncaught TypeError: Cannot read properties of undefined (reading '#lines')`.
- Cut to the editor, `CartService.js`: highlight `add(product) {` and `this.#lines` inside it.

**SAY**
> "Here's a cart. I click Add to cart... and nothing. The console says
> *Cannot read properties of undefined*. But look at the code: `add` is right
> here, in the class, and `this.#lines` is right there. So how can `this` be
> undefined? If you've ever written React or Angular, you've probably hit this
> exact error. Let's fix it, and understand it properly this time."

**ON SCREEN**
- Uncomment the five `bind` lines, save. Click **Add to cart** again: the line appears, the badge says 1.

**SAY**
> "Five lines, and it works. By the end of this video you'll know exactly why."

---

### [00:30–01:15] Intro

**ON SCREEN**
- Full browser view of the app header: "Functions, Closures, `this` & Immutability", then the chips.
- Slowly scroll: toolbar, grid, cart panel with the toggle and the Reference check log.

**SAY**
> "I'm Vishal Shah, founder of Deesha Tech Academy, and this is Session 3 of
> our JavaScript and TypeScript Foundations track. Today is the JavaScript
> that React hooks and Angular services are built on: closures, `this`, and
> immutability.
>
> We're building ShopScope Lite: a product catalogue with a debounced search
> and a real cart. And here's the twist: the cart is implemented *twice*. Once
> as a closure-based store, the way React hooks work. Once as a class service,
> the way Angular works. Same buttons, same interface. This toggle switches
> between them, live."

---

### [01:15–03:45] Segment 1: Closures and debounce

**ON SCREEN**
- Editor, `fn.js`: show `makeCounter` first.

**SAY**
> "A closure is a function plus the variables it can see from where it was
> written. Watch. `makeCounter` creates a `count` variable and returns three
> little functions. Then `makeCounter` *finishes*. Normally `count` would be
> gone. But these arrows still use it, so it stays alive, and nothing else in
> the program can touch it. That's private state, with no class."

**ON SCREEN**
- In the browser console type:
  ```js
  const { makeCounter, debounce } = await import("/src/lib/fn.js");
  const a = makeCounter(); a.increment(); a.increment(); a.value();
  a.count;
  ```
- Results: `2`, then `undefined`.

**SAY**
> "Two. And `a.count`? Undefined. There's no way in except those functions."

**ON SCREEN**
- Editor: scroll to `debounce`. Highlight `let timer;`, then `clearTimeout(timer)`.

**SAY**
> "Now the useful one. Debounce. Every call to the function it returns shares
> *one* `timer`, because they all closed over the same variable. So each new
> call cancels the previous timer and starts a fresh one. Only the last call
> survives."

**ON SCREEN**
- Browser: type "essence" fast in the search box. Point at the meter:
  **7 keystrokes · 1 searches run**. Then type slowly, and the two numbers climb together.

**SAY**
> "Seven keystrokes. One search. In Session 4 that search hits a real API, and
> this is the difference between one request and seven."

**AHA**
> "And here's the misconception to drop: closures don't *copy* values. They
> keep a live link to the variable. That's why the timer works, and it's also
> the reason for React's stale state bug. We'll come back to that."

---

### [03:45–06:15] Segment 2: A closure-based store with immutable updates

**ON SCREEN**
- Editor, `createCartStore.js`. Highlight `let lines`, `const listeners = new Set()`, then `setLines`.

**SAY**
> "Here's the React-hook-style cart. Same trick, bigger: private `lines`, a set
> of listeners, and one function, `setLines`, that's the only place state ever
> changes. It swaps the variable and tells every listener."

**ON SCREEN**
- Highlight the returned object: `getState`, `subscribe`, the five actions. Then open `lib/cart.js` and highlight `changeQty`'s `lines.map((l) => (l.id === id ? { ...l, qty } : l))`.

**SAY**
> "And the actions don't *edit* anything. `changeQty` never does `qty++`. It
> returns a brand-new array, with a new object for the one line that changed,
> and every other line reused exactly as it was. These cart functions are
> pure: lines in, new lines out, no side effects. The store is the only part
> with side effects, and it's tiny."

**ON SCREEN**
- Browser, panel on **createCartStore**. Add mascara, eyeshadow, sofa. Click + on the eyeshadow.
- Point at the **Reference check** log: `prev === next → false · 2 of 3 line objects reused`.

**SAY**
> "Every change logs one comparison: is the old array the same as the new one?
> Always false, because we always build a new one. And two of three lines
> were reused: only the changed path is new."

**ON SCREEN**
- Click **Mutate in place (the wrong way)**. The log shows
  `mutate blocked → TypeError: Cannot assign to read only property 'qty'…`.

**AHA**
> "And if someone tries to cheat and edit a line directly? Blocked. The store
> freezes everything it hands out. Why go to all this trouble? Because now
> 'did anything change?' is a single `===`. Hold on to that; it's exactly how
> React and Angular decide what to re-render."

---

### [06:15–08:45] Segment 3: The class service and `this`

**ON SCREEN**
- Editor, `CartService.js`. Highlight `#lines`, `#listeners`, the methods, `#set`.

**SAY**
> "Now the Angular-service style. A class, with private fields: the hash means
> private, enforced by the language, not by a naming convention. Same five
> methods, same pure helpers from `cart.js`. Only the packaging changes."

**ON SCREEN**
- Comment out the five `bind` lines again, save. Browser: toggle to **CartService**, click **Add to cart**: the error returns.
- Editor, `main.js`: highlight `onAdd: cart.add` inside `renderAll()`.

**SAY**
> "Back to our bug. Look at this line: `onAdd: cart.add`. We're not handing over
> 'add, on this cart'. We're handing over just the function. The dot is gone.
> Later, the card calls `onAdd(product)`, a plain call."

**ON SCREEN**
- Show a lower-third with the four rules table:
  `new` → the new object · `call/apply/bind` → what you pass · `obj.method()` → obj · plain call → undefined.

**SAY**
> "In JavaScript, `this` isn't decided where a function is written. It's
> decided by *how it's called*. Four rules. Called with `new`? `this` is the new
> object. With `call`, `apply` or `bind`? Whatever you pass. With a dot?
> The thing before the dot. And a plain call, in a module or a class? `undefined`.
> Our card makes a plain call. So `this` is undefined."

**ON SCREEN**
- `main.js`: change `onAdd: cart.add` to `onAdd: (product) => cart.add(product)`. Save, click Add: works. Undo.
- `CartService.js`: uncomment the five `bind` lines. Save, click Add, −, +, Clear: all work.

**SAY**
> "Three fixes. One: an arrow wrapper at the call site, so the call keeps its
> dot. That works, but only here. Two: bind in the constructor: every instance
> gets its own copy with `this` pinned. Three: arrow class fields. Arrows don't
> have their own `this`; they use the one around them, which inside a class
> field is the instance."

**AHA**
> "And notice: the closure store never had this bug. It has no `this` at all.
> That's one of the quiet reasons React moved to functions and hooks."

**ON SCREEN**
- Add two items, toggle to **createCartStore** and back. Point at the log line
  "switched to …, same 2-line array handed over".

**SAY**
> "And because nothing is ever mutated, both stores can safely share the very
> same array when I switch."

---

### [08:45–11:15] Segment 4: Where you'll meet this in React and Angular

**ON SCREEN**
- Paste React snippet 1 into a blank editor tab (title card: **React**):
  ```jsx
  setCount(count + 1);
  setCount(count + 1);        // still +1: both read this render's snapshot
  setCount((c) => c + 1);     // functional update: always the latest value
  ```

**SAY**
> "In React, every render is a new call to your component, and every handler
> closes over *that* render's values. React calls it a snapshot. That's why
> calling `setCount(count + 1)` twice only adds one, and why the fix is to pass
> a function."

**ON SCREEN**
- Paste React snippet 2:
  ```jsx
  const lines = useSyncExternalStore(cart.subscribe, cart.getState);
  setLines((prev) => [...prev, line]);                 // new reference → re-render
  const onAdd = useCallback((p) => cart.add(p), []);   // same identity every render
  ```

**SAY**
> "Our store plugs straight into React's `useSyncExternalStore`: subscribe and
> getState, the exact same shape. React re-renders when the reference changes,
> which is why you never `push` into state. And `useCallback` and `useMemo`
> exist because a function or object created during render is a new reference
> every time."

**ON SCREEN**
- Paste Angular snippet side by side (title card: **Angular**):
  ```ts
  @Injectable({ providedIn: "root" })
  export class CartService {
    readonly #lines = new BehaviorSubject<CartLine[]>([]);
    readonly lines$ = this.#lines.asObservable();
    add(product: Product) {
      this.#lines.next(addLine(this.#lines.value, product));
    }
  }
  ```

**SAY**
> "In Angular, services are classes, created for you by dependency injection.
> A BehaviorSubject is our `lines` variable and our listener set in one object,
> and the update is the same pure `addLine`. In templates,
> `(click)="cart.add(product)"` keeps the dot, so it's fine. The bug comes back
> the moment you pass a method reference to `subscribe` or `setTimeout`."

**ON SCREEN**
- Paste Angular snippet 2:
  ```ts
  @Component({ changeDetection: ChangeDetectionStrategy.OnPush, /* … */ })
  export class CartPanelComponent {
    @Input() lines: CartLine[] = [];
  }
  // parent: this.lines = [...this.lines, line];   ✔   this.lines.push(line);   ✘
  ```

**AHA**
> "And OnPush change detection? It checks an input by reference. Push into the
> array and the child never updates. Give it a new array and it does. It's the
> same `===` we've been logging all along. React and Angular, one idea."

---

### [11:15–11:45] Recap

**ON SCREEN**
- Three bullets appear one by one over the app:
  1. A closure remembers where it was written: private state, debounce, hooks.
  2. `this` is decided by how a function is called: bind, or use arrows.
  3. Never mutate: a new reference is how frameworks see change.

**SAY**
> "Three things. A closure remembers the variables from where it was written:
> that's private state, debounce, and every React hook. `this` is decided by
> how a function is called, so when you pass methods around, bind them or use
> arrows. And never mutate state: a new reference is how React and Angular know
> something changed."

---

### [11:45–12:15] Call to action

**ON SCREEN**
- End card: Deesha Tech Academy logo, "deeshatechacademy.com", the five session titles with Session 3 highlighted.

**SAY**
> "This is Session 3 of our 5-day JavaScript & TypeScript Foundations program,
> the preparation track for our React and Angular programs at Deesha Tech
> Academy. Register at deeshatechacademy.com, link in the description. Next
> session: async JavaScript and the event loop, with a live API. See you there."

---

## 4. B-roll, on-screen text and pinned comment

**B-roll suggestions**
- Slow zoom on the error line in the Console during the cold open.
- A split-screen of `createCartStore.js` and `CartService.js` with the matching
  actions highlighted in the same colour (add/add, increment/increment…).
- The keystroke meter ticking while the search count stays at 1.
- The Reference check log filling up line by line.
- The mode toggle switching while the cart stays the same.

**On-screen text suggestions**
- 00:10 — `this` is decided by HOW a function is called
- 01:40 — Closure = function + the variables it can see
- 02:50 — Closures capture variables, not copies
- 04:40 — Pure: lines in, new lines out
- 05:40 — prev === next → false
- 07:10 — `onAdd: cart.add` passes the function, not the object
- 08:00 — Fixes: bind · arrow field · arrow wrapper
- 09:10 — React state is a snapshot
- 10:40 — OnPush compares references

**Pinned comment**
> Quick challenge from the video: in `CartService`, replace the five `bind`
> lines with arrow class fields, then check `Object.getOwnPropertyNames(CartService.prototype)`.
> What disappeared, and why? Answer in the replies.
>
> This is Session 3 of JavaScript & TypeScript Foundations, the preparation
> track for our React and Angular programs. Register at deeshatechacademy.com
