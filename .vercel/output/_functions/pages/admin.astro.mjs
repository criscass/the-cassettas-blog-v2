import { b as createAstro, c as createComponent } from '../chunks/astro/server_B1FHXCvi.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("http://www.cassettas-reboot.xyz/");
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return Astro2.redirect("/admin/users");
}, "/Users/cristiancassetta/DEV/websites and apps/The-Cassettas-blog/the-cassettas-blog-v2/src/pages/admin/index.astro", void 0);

const $$file = "/Users/cristiancassetta/DEV/websites and apps/The-Cassettas-blog/the-cassettas-blog-v2/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
