import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock requestAnimationFrame and cancelAnimationFrame
vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(() => cb(Date.now()), 16)));
vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));
