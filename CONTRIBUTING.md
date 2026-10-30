# Contributing to Minu

Thanks for taking the time to improve Minu. Contributions are welcome — bug
reports, docs fixes, examples, tests, and focused features.

By contributing, you agree that your work is licensed under the MIT license
(see [LICENSE](LICENSE)).

## Code of conduct

Be respectful and constructive. Harassment, personal attacks, and
discriminatory language are not welcome. Assume good intent and keep
discussion focused on the code.

## Before you start

- **Security issue?** Do not open a public issue. Follow
  [SECURITY.md](SECURITY.md) and email the maintainer privately.
- **Bug report?** Open a GitHub issue with a minimal reproduction, the Minu
  version, and the browser/version.
- **Larger feature?** Open an issue first so the scope and size cost can be
  agreed before writing code. Minu is deliberately small.

## Development setup

Node.js 22 or newer is required for the build.

```bash
git clone https://github.com/aotr/minu.git
cd minu
npm ci
npm test
```

`npm test` builds the library and runs the `node:test` suite with jsdom.

To run the example gallery:

```bash
npm run examples
# http://localhost:3000
```

The examples use the zero-dependency server in `example/server.js`; a static
file server will not run the `/demo/*` endpoints.

## Project layout

| Path | Purpose |
|---|---|
| `src/core.js` | All runtime behavior |
| `src/minu.js` | Default entry (basic sanitizer) |
| `src/minu-secure.js` | DOMPurify-backed entry |
| `src/sanitize.js` | Basic sanitizer; not an XSS boundary |
| `build.js` | Vite+ library build and gzip size gate |
| `test/minu.test.js` | Node test suite |
| `example/` | Runnable scenario gallery |
| `docs/` | GitHub Pages project page |

Keep the runtime in one core. Entries should only choose a sanitizer.

## Pull request checklist

- [ ] `npm test` passes.
- [ ] A test covers new behavior (and the test fails without the change).
- [ ] The relevant README/attribute/event docs are updated.
- [ ] The size gate passes. Do not raise it without discussing the tradeoff.
- [ ] No new runtime dependencies. DOMPurify stays an optional peer dependency.
- [ ] The diff is focused; unrelated refactors go in a separate PR.
- [ ] Public behavior stays backward compatible within 1.x where practical.

## Style

- Match the existing four-space, semicolon, plain-JavaScript style.
- Prefer the platform: `fetch`, `AbortController`, `EventSource`,
  `IntersectionObserver`, URL APIs.
- Keep names and control flow boring. Clever code is harder to maintain.
- Add a short comment only when it explains a non-obvious constraint.

## Commit messages

Short imperative subjects are preferred, for example:

```text
fix: restore disabled state after overlapping requests
feat: add minu-oob out-of-band swaps
docs: document SSE reconnect behavior
```

## Questions

Open a GitHub issue for usage questions or design discussion. For anything
security-related, email first: **animesh.aotr@gmail.com**.
