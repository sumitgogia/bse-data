const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./dfaf4e58.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
