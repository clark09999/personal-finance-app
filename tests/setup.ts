// tests/setup.ts
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend vitest's expect with the jest-dom matchers.
// Using a namespace import avoids ESM/CJS default-import mismatches that
// can cause `matchers` to be undefined in some module resolution setups.
expect.extend((matchers as any).default ?? matchers);

// Ensure DOM is cleaned up after each test to avoid cross-test bleed.
afterEach(() => cleanup());
