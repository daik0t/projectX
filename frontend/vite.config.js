import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';


function parseEnvFile(path) {
    const result = {};

    if (!existsSync(path)) return result;

    for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const line = rawLine.replace(/^\uFEFF/, '').trim();
        if (!line || line.startsWith('#')) continue;

        const eq = line.indexOf('=');
        if (eq === -1) continue;

        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    }

    return result;
}

export default ({ mode }) => {
    const root = process.cwd();
    const envFiles = [
        '.env',
        '.env.local',
        `.env.${mode}`,
        `.env.${mode}.local`,
    ];

    const fileEnv = envFiles.reduce(
        (acc, file) => ({ ...acc, ...parseEnvFile(resolve(root, file)) }),
        {}
    );

    const env = { ...fileEnv, ...process.env };
    const target = env.VITE_API_PROXY || 'http://localhost:8080';

    const proxy = {
        '/api': { target, changeOrigin: true },
        '/oauth2': { target, changeOrigin: true },
        '/login/oauth2': { target, changeOrigin: true },
    };

    return {
        server: {
            port: 5173,
            strictPort: true,
            proxy,
        },
        preview: {
            port: 4173,
            strictPort: true,
            proxy,
        },
    };
};
