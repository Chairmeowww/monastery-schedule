# Monastery Schedule Helper

A small, local-first weekly schedule for a religious community. The week IS the
interface — fill in duty cells from a sister palette, see conflicts inline,
print the result for the kitchen wall.

- **Live:** opens in any modern browser. No account, no install, no server.
- **Local-first:** every week's data lives in `localStorage` on the device that
  edited it.
- **Validated:** 22 named rules from the brief, encoded as pure functions in
  [`src/rules/`](src/rules/index.ts). The §11 scenarios are covered by
  [`rules.test.ts`](src/rules/rules.test.ts).

## Run locally

```sh
npm install
npm run dev
```

## Test

```sh
npx vitest run
```

## Build

```sh
npm run build
```

The `dist/` folder is a static site — open `dist/index.html` directly, drop it
on a USB stick, or deploy to any static host. GitHub Pages deployment runs on
every push to `main` via `.github/workflows/deploy.yml`.
