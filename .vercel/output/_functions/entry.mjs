import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_D0GuCBUP.mjs';
import { manifest } from './manifest_D7W2uWIY.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/admin/users.astro.mjs');
const _page3 = () => import('./pages/admin.astro.mjs');
const _page4 = () => import('./pages/api/admin/users/_id_.astro.mjs');
const _page5 = () => import('./pages/api/auth/_---all_.astro.mjs');
const _page6 = () => import('./pages/api/comments.astro.mjs');
const _page7 = () => import('./pages/en/blog.astro.mjs');
const _page8 = () => import('./pages/en/sign-in.astro.mjs');
const _page9 = () => import('./pages/en/sign-up.astro.mjs');
const _page10 = () => import('./pages/en.astro.mjs');
const _page11 = () => import('./pages/en/_---slug_.astro.mjs');
const _page12 = () => import('./pages/it/blog.astro.mjs');
const _page13 = () => import('./pages/it/sign-in.astro.mjs');
const _page14 = () => import('./pages/it/sign-up.astro.mjs');
const _page15 = () => import('./pages/it.astro.mjs');
const _page16 = () => import('./pages/it/_---slug_.astro.mjs');
const _page17 = () => import('./pages/rss.xml.astro.mjs');
const _page18 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/admin/users.astro", _page2],
    ["src/pages/admin/index.astro", _page3],
    ["src/pages/api/admin/users/[id].ts", _page4],
    ["src/pages/api/auth/[...all].ts", _page5],
    ["src/pages/api/comments.ts", _page6],
    ["src/pages/en/blog.astro", _page7],
    ["src/pages/en/sign-in.astro", _page8],
    ["src/pages/en/sign-up.astro", _page9],
    ["src/pages/en/index.astro", _page10],
    ["src/pages/en/[...slug].astro", _page11],
    ["src/pages/it/blog.astro", _page12],
    ["src/pages/it/sign-in.astro", _page13],
    ["src/pages/it/sign-up.astro", _page14],
    ["src/pages/it/index.astro", _page15],
    ["src/pages/it/[...slug].astro", _page16],
    ["src/pages/rss.xml.js", _page17],
    ["src/pages/index.astro", _page18]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "24c5b29f-58c6-4a45-a872-eaabb416c758",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
