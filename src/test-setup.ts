/**
 * Test setup file
 */
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock crypto.randomUUID for tests
(globalThis as any).crypto.randomUUID = vi.fn(() => 'test-uuid-1234-5678-90ab-cdefghijklmn');

// Clean up after each test
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});
