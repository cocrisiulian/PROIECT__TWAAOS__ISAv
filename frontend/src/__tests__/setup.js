// Global test setup — imported by Vitest before every test file
// Must explicitly extend Vitest's expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
expect.extend(matchers);
