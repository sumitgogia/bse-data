const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./928677f1.js').then(module => module.routes)
}];

export { routes };
