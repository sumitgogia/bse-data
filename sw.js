if(!self.define){let e,c={};const f=(f,d)=>(f=new URL(f+".js",d).href,c[f]||new Promise((c=>{if("document"in self){const e=document.createElement("script");e.src=f,e.onload=c,document.head.appendChild(e)}else e=f,importScripts(f),c()})).then((()=>{let e=c[f];if(!e)throw new Error(`Module ${f} didn’t register its module`);return e})));self.define=(d,s)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(c[i])return;let r={};const b=e=>f(e,i),a={module:{uri:i},exports:r,require:b};c[i]=Promise.all(d.map((e=>a[e]||b(e)))).then((e=>(s(...e),r)))}}define(["./workbox-088bfcc4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"03d6db0f.js",revision:"04b010142a53a6838badeb6f197de732"},{url:"0f5b9f67.css",revision:"cd822b7fd22c8a95a68470c795adea69"},{url:"1b8aa348.js",revision:"b608b851d92c230acc7d7a8df6fb7995"},{url:"46e83a06.js",revision:"71e59b20daca640d8f6edccacdbda15c"},{url:"4e355c87.js",revision:"be2134c6427ec7b79b11cb0bb5cf61c3"},{url:"62f9c44d.js",revision:"bc6f130069819f70c41d3d8eb8f773e5"},{url:"8f2e7f4f.css",revision:"559bd8b2bf4cea9a6b81f30255fb7b7b"},{url:"8fc961f8.js",revision:"8a5205cec2ccf3f8a4c717fde273fe99"},{url:"90a9c7f9.js",revision:"4cb18d773c72be61d4f953d3202fb283"},{url:"9b1ef66e.css",revision:"c483caa95f23c2ff6339b83ea835a4d4"},{url:"9dc5ce16.css",revision:"3caedafd8e52dca668b4620ba7320045"},{url:"b6eb39dc.js",revision:"ae7f97c3e8695a30c1ecb294affa311b"},{url:"bf8524d5.css",revision:"4bd9fd6cadb9c46516839cc73f555420"},{url:"c5e81f2c.js",revision:"4d6f08798b20f21f64d7c2673ddd1099"},{url:"c85db4d4.js",revision:"eca9dc164f85afb7d17f80146488daf5"},{url:"cb17fffd.css",revision:"55e1d560821b4a4b141b0ab6cbb74d26"},{url:"cf490859.css",revision:"f976da6c6d0284822a3258a18b8f8ff5"},{url:"de6f6f05.js",revision:"32aac69c277816b12152878807e17435"},{url:"de729207.js",revision:"a74db29b6d4dbc28117de0e62485eaa9"},{url:"e3ded324.css",revision:"e71c39430469a3eea74514a2b48f6536"},{url:"f852559d.js",revision:"05d006e3e99350cfdbf636ad05286ea6"},{url:"index.html",revision:"059abaecdfac823048f3ab60ee469271"}],{}),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/index.html"))),e.registerRoute("polyfills/*.js",new e.CacheFirst,"GET")}));
//# sourceMappingURL=sw.js.map
