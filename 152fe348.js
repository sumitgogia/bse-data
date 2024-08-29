const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./d5666e1e.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
