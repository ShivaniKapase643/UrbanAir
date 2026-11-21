# Contributing

Thank you for helping improve Urban Air Quality Assistant.

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

## Validation

Before submitting a change, run:

```sh
npm run lint
npm test
npm run test:coverage
npm run build
npm audit --audit-level=high
```

## Guidelines

- Keep TypeScript in strict mode.
- Add or update focused tests for behavior changes.
- Preserve accessibility semantics and keyboard operation.
- Do not commit secrets, API keys, coverage output, build output, or screenshots larger than 200 KB.
- Keep API inputs validated and upstream hosts allow-listed.
