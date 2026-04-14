import '@testing-library/jest-dom';
import { expect } from 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';
import { toHaveNoViolations } from 'vitest-axe/dist/matchers.js';

declare module '@vitest/expect' {
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend({ toHaveNoViolations });
