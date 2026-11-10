# dsh-prompt-shelf

[中文](README.md) | **English**

Keep frequently used prompts inside DSH: a "Saved prompts" button sits in the composer toolbar and
opens a list window where you can save the current draft or send an entry straight into the composer.

## Where it lives

In the composer's bottom toolbar, right of the permission selector: the text "Saved prompts" plus a count.
New-session blank pages show it too.

## Using it

- **Save**: "Save current input" stores whatever is in the composer. The button is disabled while the
  composer is empty, and identical text is not stored twice.
- **Write**: "＋ New" lets you write an entry in the window itself (title + body) without touching the composer.
- **Find**: the search box filters by title and body.
- **Use**: each card has **Insert** (append at the cursor, leaving what you typed intact) and **Replace**
  (swap the whole composer content). Inserting keeps the window open, so you can pick several in a row.
- **Edit**: expand the card to edit title and body; an empty title falls back to the first line of the body.
- **Delete**: entries go to a trash that keeps them 3 days by default. The "Trash" view shows how many days
  each entry has left and can restore it; the retention period is adjustable (1–365 days) and applies immediately.
- **Close**: the × in the corner, a click on the dimmed area outside, or Esc (Esc leaves editing first).

## Variables

Write `{{name}}` or `{{name=default}}` in the body and that spot becomes an input field on the card:
inserting substitutes the filled value, falling back to the default, and same-named variables share one value.
A variable box also accepts `@` to reference workspace files (see below).

Editing a card shows the raw `{{…}}` template, which is where you change it. While creating or editing,
"＋ Variable" below the body box inserts `{{variable}}` at the cursor and selects the word, so typing renames it.
In that body box, **Alt+V** (or Ctrl+Alt+V) does the same; it only works there, not globally.

## Picking from the @ menu

- In the task composer, typing `@` lists the saved prompts directly (most recently used first); typing
  further filters by title and body keyword, and picking a row drops its body at the cursor.
- In the card editor's title and body inputs, typing `@` lists "Saved prompts / Files and folders / Chats /
  Plugins"; the tab bar above the list narrows it to one kind. Picking a saved prompt inserts its title in
  the title input and its full body in the body input; picking a file inserts `@path` (folders end with a
  slash, and a path containing spaces is written as `@"path"`). Arrow keys move, Enter or Tab picks, Esc closes.
- In a card's **variable box**, typing `@` lists the same kinds (the list floats below the input and flips
  above when there is no room); picking a saved prompt fills the variable with its body, and picking a file
  fills it with `@path`, so after inserting or replacing into the composer the model reads the file as an
  @ reference.

## Where the data lives

The source of truth is `$DSH_HOME/data/dsh-prompt-shelf/state.json` on the host side (written to `.tmp`
then renamed, with the previous version kept as `.bak`), read and written through this plugin's local routes.
The browser keeps a localStorage cache (`dsh.prompt-shelf.v1`) for the first paint.

Why not localStorage alone: it is per origin, and the desktop app uses a different port on every start, so
entries would disappear after a refresh or restart. Data is kept separately from the package, so reinstalling
or upgrading the plugin does not lose entries.

## Install

```sh
dsh plugin --profile desktop add github:taoziliyouchong/dsh-prompt-shelf
```

Once published to npm, this also works:

```sh
dsh plugin --profile desktop add dsh-prompt-shelf
```

Restart DSH afterwards. Replace `desktop` with your own profile name if you use another one.
Requirements: DSH 0.2.1 or later, desktop app or `dsh web` (verified on 0.2.1-alpha.3 and 0.2.2-rc.1). Requires DSH >= 0.2.1-alpha.1 (lower bound inferred from the services and slots the plugin uses, all present in alpha.1); verified on 0.2.1-alpha.3 and 0.2.2-rc.1, later versions untested.

## How it works

- The UI mounts at the list slot `conversation.input.left` (session-scoped, rendered after permission / plan);
  the window is a `createPortal` overlay on `document.body` — the composer container clips, so a portal is required.
- The host half registers three loopback-only routes:
  - `GET /dsh-prompt-shelf/api/state` and `POST` on the same path (read and write entries)
  - `GET /dsh-prompt-shelf/api/files` (list workspace files by query; 3 levels deep, capped at 400 entries)
  - `GET /dsh-prompt-shelf/api/plugins` (third-party plugins from the loader's live table)
- Reading and writing the composer uses the slot's standard props only: `useInput` for the draft,
  `inputActions.captureInsertion()` / `insertText(text, span)` to insert at the cursor, `setDraft(text)`
  to replace everything. The editor DOM is never touched.
- No network access, nothing uploaded; everything stays on your machine.

## Known limits

- Up to 5000 entries and 1MB per write; larger writes are rejected with a message.
- Loopback only: on a DSH reachable from other machines the routes answer 403.
- "Replace" overwrites the whole composer; "Insert" does not.

## Development

```sh
npm install
npm run build:client    # regenerate lib/client.js from src/entry.jsx
npm run check:client    # verify the committed artifact matches the source
npm run check           # syntax
npm run smoke           # structure / bundle declaration / host routes / authorization / artifact / companion
```

`lib/client.js` is a build artifact committed to the repository: installing from GitHub does not run a build,
and without it the UI does not load. Keep `react`, `react/jsx-runtime` and `react-dom` external (the DSH
client module table provides them); the `id` inside the `window.__ModuleLoader__.load({ id, factory })`
envelope must equal the package name.

Source layout:

- `src/entry.jsx` — the browser half (button, window, cards, variables, the window's @ picker)
- `index.js` — the host half (three loopback routes, state-file read/write)

## Feedback

- Open an issue: https://github.com/taoziliyouchong/dsh-prompt-shelf/issues
- Or reach me on QQ: **2171960697** (mention which plugin you installed when adding the contact).

Please include: DSH version, plugin version, the exact error text, and a screenshot.

## License

MIT
