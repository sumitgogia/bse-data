const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./099b10ac.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
