const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./d4d7e807.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
