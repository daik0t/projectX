import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromeCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const channel = process.env.PLAYWRIGHT_CHANNEL
    ?? (process.platform === 'win32' && chromeCandidates.some(existsSync) ? 'chrome' : undefined);

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:5173',
        headless: true,
        trace: 'retain-on-failure',
        launchOptions: {
            args: ['--no-sandbox', '--disable-gpu'],
        },
        ...(channel ? { channel } : {}),
    },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
