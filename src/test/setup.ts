import { afterEach, expect } from "bun:test";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

declare module "bun:test" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Matchers<T = unknown> extends TestingLibraryMatchers<any, T> { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface AsymmetricMatchers extends TestingLibraryMatchers<any, void> { }
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
