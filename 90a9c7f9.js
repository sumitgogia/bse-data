const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./62f9c44d.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
