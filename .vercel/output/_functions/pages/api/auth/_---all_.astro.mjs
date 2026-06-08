import { a as auth } from '../../../chunks/auth_CQIN-q-N.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ALL = ({ request }) => auth.handler(request);

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	ALL,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
