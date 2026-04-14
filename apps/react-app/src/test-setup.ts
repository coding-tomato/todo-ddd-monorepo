import "@testing-library/jest-dom";
import { expect } from "vitest";
import { toHaveNoViolations } from "vitest-axe/dist/matchers.js";
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "@vitest/expect" {
  // biome-ignore lint/suspicious/noExplicitAny: must match @vitest/expect's Assertion<T = any> for declaration merging
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend({ toHaveNoViolations });
