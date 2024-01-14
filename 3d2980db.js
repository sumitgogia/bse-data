const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./0924aaa9.js').then(function (n) { return n.i; }).then(module => module.routes)
}];

export { routes };
