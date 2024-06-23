const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./55e7c29e.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
