// Lint fixture: the engine must not import React. Excluded from `pnpm lint`;
// tests/engine-boundary.test.ts lints it directly and expects an error.
import { version } from 'react'

export const reactVersion = version
