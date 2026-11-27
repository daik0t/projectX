import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { resetPage } from '../src/lib/page-lifecycle';
import { resetFilter } from '../src/services/filter';
import { server } from './msw/server';

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
    resetFilter();
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
    window.confirm = vi.fn(() => true);
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: vi.fn(() => Promise.resolve()) },
    });
});

afterEach(() => {
    server.resetHandlers();
    resetFilter();
    resetPage();
    document.body.replaceChildren();
    localStorage.clear();
    history.replaceState({}, '', '/');
    vi.restoreAllMocks();
});

afterAll(() => {
    server.close();
});
