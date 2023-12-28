const routes = [{
  path: "/",
  redirect: "/bse/announcement"
}, {
  path: "/announcement",
  children: () => import('./244e29f0.js').then(module => module.routes)
}];

export { routes };
