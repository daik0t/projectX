export default {
    test: {
        environment: 'jsdom',
        pool: 'threads',
        setupFiles: ['./test/setup.js'],
        environmentOptions: {
            jsdom: { url: 'http://localhost/' },
        },
        include: ['test/integration/**/*.test.js'],
        restoreMocks: true,
        clearMocks: true,
    },
};
