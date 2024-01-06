const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./b609225b.js').then(module => module.routes)
}];

export { routes };
