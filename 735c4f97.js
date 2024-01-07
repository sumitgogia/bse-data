const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./3975b4f0.js').then(module => module.routes)
}];

export { routes };
