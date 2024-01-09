const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./94457d78.js').then(module => module.routes)
}];

export { routes };
