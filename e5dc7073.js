/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function toArray(objectOrArray) {
  objectOrArray = objectOrArray || [];
  return Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
}
function log(msg) {
  return `[Vaadin.Router] ${msg}`;
}
function logValue(value) {
  if (typeof value !== 'object') {
    return String(value);
  }
  const stringType = Object.prototype.toString.call(value).match(/ (.*)\]$/)[1];
  if (stringType === 'Object' || stringType === 'Array') {
    return `${stringType} ${JSON.stringify(value)}`;
  } else {
    return stringType;
  }
}
const MODULE = 'module';
const NOMODULE = 'nomodule';
const bundleKeys = [MODULE, NOMODULE];
function ensureBundle(src) {
  if (!src.match(/.+\.[m]?js$/)) {
    throw new Error(log(`Unsupported type for bundle "${src}": .js or .mjs expected.`));
  }
}
function ensureRoute(route) {
  if (!route || !isString(route.path)) {
    throw new Error(log(`Expected route config to be an object with a "path" string property, or an array of such objects`));
  }
  const bundle = route.bundle;
  const stringKeys = ['component', 'redirect', 'bundle'];
  if (!isFunction(route.action) && !Array.isArray(route.children) && !isFunction(route.children) && !isObject(bundle) && !stringKeys.some(key => isString(route[key]))) {
    throw new Error(log(`Expected route config "${route.path}" to include either "${stringKeys.join('", "')}" ` + `or "action" function but none found.`));
  }
  if (bundle) {
    if (isString(bundle)) {
      ensureBundle(bundle);
    } else if (!bundleKeys.some(key => key in bundle)) {
      throw new Error(log('Expected route bundle to include either "' + NOMODULE + '" or "' + MODULE + '" keys, or both'));
    } else {
      bundleKeys.forEach(key => key in bundle && ensureBundle(bundle[key]));
    }
  }
  if (route.redirect) {
    ['bundle', 'component'].forEach(overriddenProp => {
      if (overriddenProp in route) {
        console.warn(log(`Route config "${route.path}" has both "redirect" and "${overriddenProp}" properties, ` + `and "redirect" will always override the latter. Did you mean to only use "${overriddenProp}"?`));
      }
    });
  }
}
function ensureRoutes(routes) {
  toArray(routes).forEach(route => ensureRoute(route));
}
function loadScript(src, key) {
  let script = document.head.querySelector('script[src="' + src + '"][async]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('src', src);
    if (key === MODULE) {
      script.setAttribute('type', MODULE);
    } else if (key === NOMODULE) {
      script.setAttribute(NOMODULE, '');
    }
    script.async = true;
  }
  return new Promise((resolve, reject) => {
    script.onreadystatechange = script.onload = e => {
      script.__dynamicImportLoaded = true;
      resolve(e);
    };
    script.onerror = e => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(e);
    };
    if (script.parentNode === null) {
      document.head.appendChild(script);
    } else if (script.__dynamicImportLoaded) {
      resolve();
    }
  });
}
function loadBundle(bundle) {
  if (isString(bundle)) {
    return loadScript(bundle);
  } else {
    return Promise.race(bundleKeys.filter(key => key in bundle).map(key => loadScript(bundle[key], key)));
  }
}
function fireRouterEvent(type, detail) {
  return !window.dispatchEvent(new CustomEvent(`vaadin-router-${type}`, {
    cancelable: type === 'go',
    detail
  }));
}
function isObject(o) {
  // guard against null passing the typeof check
  return typeof o === 'object' && !!o;
}
function isFunction(f) {
  return typeof f === 'function';
}
function isString(s) {
  return typeof s === 'string';
}
function getNotFoundError(context) {
  const error = new Error(log(`Page not found (${context.pathname})`));
  error.context = context;
  error.code = 404;
  return error;
}
const notFoundResult = new class NotFoundResult {}();

/* istanbul ignore next: coverage is calculated in Chrome, this code is for IE */
function getAnchorOrigin(anchor) {
  // IE11: on HTTP and HTTPS the default port is not included into
  // window.location.origin, so won't include it here either.
  const port = anchor.port;
  const protocol = anchor.protocol;
  const defaultHttp = protocol === 'http:' && port === '80';
  const defaultHttps = protocol === 'https:' && port === '443';
  const host = defaultHttp || defaultHttps ? anchor.hostname // does not include the port number (e.g. www.example.org)
  : anchor.host; // does include the port number (e.g. www.example.org:80)
  return `${protocol}//${host}`;
}

// The list of checks is not complete:
//  - SVG support is missing
//  - the 'rel' attribute is not considered
function vaadinRouterGlobalClickHandler(event) {
  // ignore the click if the default action is prevented
  if (event.defaultPrevented) {
    return;
  }

  // ignore the click if not with the primary mouse button
  if (event.button !== 0) {
    return;
  }

  // ignore the click if a modifier key is pressed
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  // find the <a> element that the click is at (or within)
  let anchor = event.target;
  const path = event.composedPath ? event.composedPath() : event.path || [];

  // FIXME(web-padawan): `Symbol.iterator` used by webcomponentsjs is broken for arrays
  // example to check: `for...of` loop here throws the "Not yet implemented" error
  for (let i = 0; i < path.length; i++) {
    const target = path[i];
    if (target.nodeName && target.nodeName.toLowerCase() === 'a') {
      anchor = target;
      break;
    }
  }
  while (anchor && anchor.nodeName.toLowerCase() !== 'a') {
    anchor = anchor.parentNode;
  }

  // ignore the click if not at an <a> element
  if (!anchor || anchor.nodeName.toLowerCase() !== 'a') {
    return;
  }

  // ignore the click if the <a> element has a non-default target
  if (anchor.target && anchor.target.toLowerCase() !== '_self') {
    return;
  }

  // ignore the click if the <a> element has the 'download' attribute
  if (anchor.hasAttribute('download')) {
    return;
  }

  // ignore the click if the <a> element has the 'router-ignore' attribute
  if (anchor.hasAttribute('router-ignore')) {
    return;
  }

  // ignore the click if the target URL is a fragment on the current page
  if (anchor.pathname === window.location.pathname && anchor.hash !== '') {
    return;
  }

  // ignore the click if the target is external to the app
  // In IE11 HTMLAnchorElement does not have the `origin` property
  const origin = anchor.origin || getAnchorOrigin(anchor);
  if (origin !== window.location.origin) {
    return;
  }

  // if none of the above, convert the click into a navigation event
  const {
    pathname,
    search,
    hash
  } = anchor;
  if (fireRouterEvent('go', {
    pathname,
    search,
    hash
  })) {
    event.preventDefault();
    // for a click event, the scroll is reset to the top position.
    if (event && event.type === 'click') {
      window.scrollTo(0, 0);
    }
  }
}

/**
 * A navigation trigger for Vaadin Router that translated clicks on `<a>` links
 * into Vaadin Router navigation events.
 *
 * Only regular clicks on in-app links are translated (primary mouse button, no
 * modifier keys, the target href is within the app's URL space).
 *
 * @memberOf Router.NavigationTrigger
 * @type {NavigationTrigger}
 */
const CLICK = {
  activate() {
    window.document.addEventListener('click', vaadinRouterGlobalClickHandler);
  },
  inactivate() {
    window.document.removeEventListener('click', vaadinRouterGlobalClickHandler);
  }
};

// PopStateEvent constructor shim
const isIE = /Trident/.test(navigator.userAgent);

/* istanbul ignore next: coverage is calculated in Chrome, this code is for IE */
if (isIE && !isFunction(window.PopStateEvent)) {
  window.PopStateEvent = function (inType, params) {
    params = params || {};
    var e = document.createEvent('Event');
    e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
    e.state = params.state || null;
    return e;
  };
  window.PopStateEvent.prototype = window.Event.prototype;
}
function vaadinRouterGlobalPopstateHandler(event) {
  if (event.state === 'vaadin-router-ignore') {
    return;
  }
  const {
    pathname,
    search,
    hash
  } = window.location;
  fireRouterEvent('go', {
    pathname,
    search,
    hash
  });
}

/**
 * A navigation trigger for Vaadin Router that translates popstate events into
 * Vaadin Router navigation events.
 *
 * @memberOf Router.NavigationTrigger
 * @type {NavigationTrigger}
 */
const POPSTATE = {
  activate() {
    window.addEventListener('popstate', vaadinRouterGlobalPopstateHandler);
  },
  inactivate() {
    window.removeEventListener('popstate', vaadinRouterGlobalPopstateHandler);
  }
};

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp$1;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * Default configs.
 */
var DEFAULT_DELIMITER = '/';
var DEFAULT_DELIMITERS = './';

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
// Match escaped characters that would otherwise appear in future matches.
// This allows the user to escape special characters that won't transform.
'(\\\\.)',
// Match Express-style parameters and un-named parameters with a prefix
// and optional suffixes. Matches appear as:
//
// ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
// "(\\d+)"  => [undefined, undefined, "\d+", undefined]
'(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse(str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || DEFAULT_DELIMITER;
  var delimiters = options && options.delimiters || DEFAULT_DELIMITERS;
  var pathEscaped = false;
  var res;
  while ((res = PATH_REGEXP.exec(str)) !== null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue;
    }
    var prev = '';
    var next = str[index];
    var name = res[2];
    var capture = res[3];
    var group = res[4];
    var modifier = res[5];
    if (!pathEscaped && path.length) {
      var k = path.length - 1;
      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k];
        path = path.slice(0, k);
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
      pathEscaped = false;
    }
    var partial = prev !== '' && next !== undefined && next !== prev;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = prev || defaultDelimiter;
    var pattern = capture || group;
    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
    });
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }
  return tokens;
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile(str, options) {
  return tokensToFunction(parse(str, options));
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }
  return function (data, options) {
    var path = '';
    var encode = options && options.encode || encodeURIComponent;
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token === 'string') {
        path += token;
        continue;
      }
      var value = data ? data[token.name] : undefined;
      var segment;
      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but got array');
        }
        if (value.length === 0) {
          if (token.optional) continue;
          throw new TypeError('Expected "' + token.name + '" to not be empty');
        }
        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j], token);
          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"');
          }
          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        segment = encode(String(value), token);
        if (!matches[i].test(segment)) {
          throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"');
        }
        path += token.prefix + segment;
        continue;
      }
      if (token.optional) {
        // Prepend partial segment prefixes.
        if (token.partial) path += token.prefix;
        continue;
      }
      throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'));
    }
    return path;
  };
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group) {
  return group.replace(/([=!:$/()])/g, '\\$1');
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags(options) {
  return options && options.sensitive ? '' : 'i';
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {Array=}  keys
 * @return {!RegExp}
 */
function regexpToRegexp(path, keys) {
  if (!keys) return path;

  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);
  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        pattern: null
      });
    }
  }
  return path;
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function arrayToRegexp(path, keys, options) {
  var parts = [];
  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp$1(path[i], keys, options).source);
  }
  return new RegExp('(?:' + parts.join('|') + ')', flags(options));
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function stringToRegexp(path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options);
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp(tokens, keys, options) {
  options = options || {};
  var strict = options.strict;
  var start = options.start !== false;
  var end = options.end !== false;
  var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
  var delimiters = options.delimiters || DEFAULT_DELIMITERS;
  var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
  var route = start ? '^' : '';
  var isEndDelimited = tokens.length === 0;

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (typeof token === 'string') {
      route += escapeString(token);
      isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
    } else {
      var capture = token.repeat ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*' : token.pattern;
      if (keys) keys.push(token);
      if (token.optional) {
        if (token.partial) {
          route += escapeString(token.prefix) + '(' + capture + ')?';
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')';
      }
    }
  }
  if (end) {
    if (!strict) route += '(?:' + delimiter + ')?';
    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
  } else {
    if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
    if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')';
  }
  return new RegExp(route, flags(options));
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {Array=}                keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp$1(path, keys, options) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys);
  }
  if (Array.isArray(path)) {
    return arrayToRegexp( /** @type {!Array} */path, keys, options);
  }
  return stringToRegexp( /** @type {string} */path, keys, options);
}
pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const {
  hasOwnProperty
} = Object.prototype;
const cache$1 = new Map();
// see https://github.com/pillarjs/path-to-regexp/issues/148
cache$1.set('|false', {
  keys: [],
  pattern: /(?:)/
});
function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}
function matchPath(routepath, path, exact, parentKeys, parentParams) {
  exact = !!exact;
  const cacheKey = `${routepath}|${exact}`;
  let regexp = cache$1.get(cacheKey);
  if (!regexp) {
    const keys = [];
    regexp = {
      keys,
      pattern: pathToRegexp_1(routepath, keys, {
        end: exact,
        strict: routepath === ''
      })
    };
    cache$1.set(cacheKey, regexp);
  }
  const m = regexp.pattern.exec(path);
  if (!m) {
    return null;
  }
  const params = Object.assign({}, parentParams);
  for (let i = 1; i < m.length; i++) {
    const key = regexp.keys[i - 1];
    const prop = key.name;
    const value = m[i];
    if (value !== undefined || !hasOwnProperty.call(params, prop)) {
      if (key.repeat) {
        params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
      } else {
        params[prop] = value ? decodeParam(value) : value;
      }
    }
  }
  return {
    path: m[0],
    keys: (parentKeys || []).concat(regexp.keys),
    params
  };
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Traverses the routes tree and matches its nodes to the given pathname from
 * the root down to the leaves. Each match consumes a part of the pathname and
 * the matching process continues for as long as there is a matching child
 * route for the remaining part of the pathname.
 *
 * The returned value is a lazily evaluated iterator.
 *
 * The leading "/" in a route path matters only for the root of the routes
 * tree (or if all parent routes are ""). In all other cases a leading "/" in
 * a child route path has no significance.
 *
 * The trailing "/" in a _route path_ matters only for the leaves of the
 * routes tree. A leaf route with a trailing "/" matches only a pathname that
 * also has a trailing "/".
 *
 * The trailing "/" in a route path does not affect matching of child routes
 * in any way.
 *
 * The trailing "/" in a _pathname_ generally does not matter (except for
 * the case of leaf nodes described above).
 *
 * The "" and "/" routes have special treatment:
 *  1. as a single route
 *     the "" and "/" routes match only the "" and "/" pathnames respectively
 *  2. as a parent in the routes tree
 *     the "" route matches any pathname without consuming any part of it
 *     the "/" route matches any absolute pathname consuming its leading "/"
 *  3. as a leaf in the routes tree
 *     the "" and "/" routes match only if the entire pathname is consumed by
 *         the parent routes chain. In this case "" and "/" are equivalent.
 *  4. several directly nested "" or "/" routes
 *     - directly nested "" or "/" routes are 'squashed' (i.e. nesting two
 *       "/" routes does not require a double "/" in the pathname to match)
 *     - if there are only "" in the parent routes chain, no part of the
 *       pathname is consumed, and the leading "/" in the child routes' paths
 *       remains significant
 *
 * Side effect:
 *   - the routes tree { path: '' } matches only the '' pathname
 *   - the routes tree { path: '', children: [ { path: '' } ] } matches any
 *     pathname (for the tree root)
 *
 * Prefix matching can be enabled also by `children: true`.
 */
function matchRoute(route, pathname, ignoreLeadingSlash, parentKeys, parentParams) {
  let match;
  let childMatches;
  let childIndex = 0;
  let routepath = route.path || '';
  if (routepath.charAt(0) === '/') {
    if (ignoreLeadingSlash) {
      routepath = routepath.substr(1);
    }
    ignoreLeadingSlash = true;
  }
  return {
    next(routeToSkip) {
      if (route === routeToSkip) {
        return {
          done: true
        };
      }
      const children = route.__children = route.__children || route.children;
      if (!match) {
        match = matchPath(routepath, pathname, !children, parentKeys, parentParams);
        if (match) {
          return {
            done: false,
            value: {
              route,
              keys: match.keys,
              params: match.params,
              path: match.path
            }
          };
        }
      }
      if (match && children) {
        while (childIndex < children.length) {
          if (!childMatches) {
            const childRoute = children[childIndex];
            childRoute.parent = route;
            let matchedLength = match.path.length;
            if (matchedLength > 0 && pathname.charAt(matchedLength) === '/') {
              matchedLength += 1;
            }
            childMatches = matchRoute(childRoute, pathname.substr(matchedLength), ignoreLeadingSlash, match.keys, match.params);
          }
          const childMatch = childMatches.next(routeToSkip);
          if (!childMatch.done) {
            return {
              done: false,
              value: childMatch.value
            };
          }
          childMatches = null;
          childIndex++;
        }
      }
      return {
        done: true
      };
    }
  };
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

function resolveRoute(context) {
  if (isFunction(context.route.action)) {
    return context.route.action(context);
  }
  return undefined;
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

function isChildRoute(parentRoute, childRoute) {
  let route = childRoute;
  while (route) {
    route = route.parent;
    if (route === parentRoute) {
      return true;
    }
  }
  return false;
}
function generateErrorMessage(currentContext) {
  let errorMessage = `Path '${currentContext.pathname}' is not properly resolved due to an error.`;
  const routePath = (currentContext.route || {}).path;
  if (routePath) {
    errorMessage += ` Resolution had failed on route: '${routePath}'`;
  }
  return errorMessage;
}
function updateChainForRoute(context, match) {
  const {
    route,
    path
  } = match;
  if (route && !route.__synthetic) {
    const item = {
      path,
      route
    };
    if (!context.chain) {
      context.chain = [];
    } else {
      // Discard old items
      if (route.parent) {
        let i = context.chain.length;
        while (i-- && context.chain[i].route && context.chain[i].route !== route.parent) {
          context.chain.pop();
        }
      }
    }
    context.chain.push(item);
  }
}

/**
 */
class Resolver {
  constructor(routes, options = {}) {
    if (Object(routes) !== routes) {
      throw new TypeError('Invalid routes');
    }
    this.baseUrl = options.baseUrl || '';
    this.errorHandler = options.errorHandler;
    this.resolveRoute = options.resolveRoute || resolveRoute;
    this.context = Object.assign({
      resolver: this
    }, options.context);
    this.root = Array.isArray(routes) ? {
      path: '',
      __children: routes,
      parent: null,
      __synthetic: true
    } : routes;
    this.root.parent = null;
  }

  /**
   * Returns the current list of routes (as a shallow copy). Adding / removing
   * routes to / from the returned array does not affect the routing config,
   * but modifying the route objects does.
   *
   * @return {!Array<!Router.Route>}
   */
  getRoutes() {
    return [...this.root.__children];
  }

  /**
   * Sets the routing config (replacing the existing one).
   *
   * @param {!Array<!Router.Route>|!Router.Route} routes a single route or an array of those
   *    (the array is shallow copied)
   */
  setRoutes(routes) {
    ensureRoutes(routes);
    const newRoutes = [...toArray(routes)];
    this.root.__children = newRoutes;
  }

  /**
   * Appends one or several routes to the routing config and returns the
   * effective routing config after the operation.
   *
   * @param {!Array<!Router.Route>|!Router.Route} routes a single route or an array of those
   *    (the array is shallow copied)
   * @return {!Array<!Router.Route>}
   * @protected
   */
  addRoutes(routes) {
    ensureRoutes(routes);
    this.root.__children.push(...toArray(routes));
    return this.getRoutes();
  }

  /**
   * Removes all existing routes from the routing config.
   */
  removeRoutes() {
    this.setRoutes([]);
  }

  /**
   * Asynchronously resolves the given pathname, i.e. finds all routes matching
   * the pathname and tries resolving them one after another in the order they
   * are listed in the routes config until the first non-null result.
   *
   * Returns a promise that is fulfilled with the return value of an object that consists of the first
   * route handler result that returns something other than `null` or `undefined` and context used to get this result.
   *
   * If no route handlers return a non-null result, or if no route matches the
   * given pathname the returned promise is rejected with a 'page not found'
   * `Error`.
   *
   * @param {!string|!{pathname: !string}} pathnameOrContext the pathname to
   *    resolve or a context object with a `pathname` property and other
   *    properties to pass to the route resolver functions.
   * @return {!Promise<any>}
   */
  resolve(pathnameOrContext) {
    const context = Object.assign({}, this.context, isString(pathnameOrContext) ? {
      pathname: pathnameOrContext
    } : pathnameOrContext);
    const match = matchRoute(this.root, this.__normalizePathname(context.pathname), this.baseUrl);
    const resolve = this.resolveRoute;
    let matches = null;
    let nextMatches = null;
    let currentContext = context;
    function next(resume, parent = matches.value.route, prevResult) {
      const routeToSkip = prevResult === null && matches.value.route;
      matches = nextMatches || match.next(routeToSkip);
      nextMatches = null;
      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches;
          return Promise.resolve(notFoundResult);
        }
      }
      if (matches.done) {
        return Promise.reject(getNotFoundError(context));
      }
      currentContext = Object.assign(currentContext ? {
        chain: currentContext.chain ? currentContext.chain.slice(0) : []
      } : {}, context, matches.value);
      updateChainForRoute(currentContext, matches.value);
      return Promise.resolve(resolve(currentContext)).then(resolution => {
        if (resolution !== null && resolution !== undefined && resolution !== notFoundResult) {
          currentContext.result = resolution.result || resolution;
          return currentContext;
        }
        return next(resume, parent, resolution);
      });
    }
    context.next = next;
    return Promise.resolve().then(() => next(true, this.root)).catch(error => {
      const errorMessage = generateErrorMessage(currentContext);
      if (!error) {
        error = new Error(errorMessage);
      } else {
        console.warn(errorMessage);
      }
      error.context = error.context || currentContext;
      // DOMException has its own code which is read-only
      if (!(error instanceof DOMException)) {
        error.code = error.code || 500;
      }
      if (this.errorHandler) {
        currentContext.result = this.errorHandler(error);
        return currentContext;
      }
      throw error;
    });
  }

  /**
   * URL constructor polyfill hook. Creates and returns an URL instance.
   */
  static __createUrl(url, base) {
    return new URL(url, base);
  }

  /**
   * If the baseUrl property is set, transforms the baseUrl and returns the full
   * actual `base` string for using in the `new URL(path, base);` and for
   * prepernding the paths with. The returned base ends with a trailing slash.
   *
   * Otherwise, returns empty string.
   */
  get __effectiveBaseUrl() {
    return this.baseUrl ? this.constructor.__createUrl(this.baseUrl, document.baseURI || document.URL).href.replace(/[^\/]*$/, '') : '';
  }

  /**
   * If the baseUrl is set, matches the pathname with the router’s baseUrl,
   * and returns the local pathname with the baseUrl stripped out.
   *
   * If the pathname does not match the baseUrl, returns undefined.
   *
   * If the `baseUrl` is not set, returns the unmodified pathname argument.
   */
  __normalizePathname(pathname) {
    if (!this.baseUrl) {
      // No base URL, no need to transform the pathname.
      return pathname;
    }
    const base = this.__effectiveBaseUrl;
    const normalizedUrl = this.constructor.__createUrl(pathname, base).href;
    if (normalizedUrl.slice(0, base.length) === base) {
      return normalizedUrl.slice(base.length);
    }
  }
}
Resolver.pathToRegexp = pathToRegexp_1;

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const {
  pathToRegexp
} = Resolver;
const cache = new Map();
function cacheRoutes(routesByName, route, routes) {
  const name = route.name || route.component;
  if (name) {
    if (routesByName.has(name)) {
      routesByName.get(name).push(route);
    } else {
      routesByName.set(name, [route]);
    }
  }
  if (Array.isArray(routes)) {
    for (let i = 0; i < routes.length; i++) {
      const childRoute = routes[i];
      childRoute.parent = route;
      cacheRoutes(routesByName, childRoute, childRoute.__children || childRoute.children);
    }
  }
}
function getRouteByName(routesByName, routeName) {
  const routes = routesByName.get(routeName);
  if (routes && routes.length > 1) {
    throw new Error(`Duplicate route with name "${routeName}".` + ` Try seting unique 'name' route properties.`);
  }
  return routes && routes[0];
}
function getRoutePath(route) {
  let path = route.path;
  path = Array.isArray(path) ? path[0] : path;
  return path !== undefined ? path : '';
}
function generateUrls(router, options = {}) {
  if (!(router instanceof Resolver)) {
    throw new TypeError('An instance of Resolver is expected');
  }
  const routesByName = new Map();
  return (routeName, params) => {
    let route = getRouteByName(routesByName, routeName);
    if (!route) {
      routesByName.clear(); // clear cache
      cacheRoutes(routesByName, router.root, router.root.__children);
      route = getRouteByName(routesByName, routeName);
      if (!route) {
        throw new Error(`Route "${routeName}" not found`);
      }
    }
    let regexp = cache.get(route.fullPath);
    if (!regexp) {
      let fullPath = getRoutePath(route);
      let rt = route.parent;
      while (rt) {
        const path = getRoutePath(rt);
        if (path) {
          fullPath = path.replace(/\/$/, '') + '/' + fullPath.replace(/^\//, '');
        }
        rt = rt.parent;
      }
      const tokens = pathToRegexp.parse(fullPath);
      const toPath = pathToRegexp.tokensToFunction(tokens);
      const keys = Object.create(null);
      for (let i = 0; i < tokens.length; i++) {
        if (!isString(tokens[i])) {
          keys[tokens[i].name] = true;
        }
      }
      regexp = {
        toPath,
        keys
      };
      cache.set(fullPath, regexp);
      route.fullPath = fullPath;
    }
    let url = regexp.toPath(params, options) || '/';
    if (options.stringifyQueryParams && params) {
      const queryParams = {};
      const keys = Object.keys(params);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!regexp.keys[key]) {
          queryParams[key] = params[key];
        }
      }
      const query = options.stringifyQueryParams(queryParams);
      if (query) {
        url += query.charAt(0) === '?' ? query : `?${query}`;
      }
    }
    return url;
  };
}

/**
 * @typedef NavigationTrigger
 * @type {object}
 * @property {function()} activate
 * @property {function()} inactivate
 */

/** @type {Array<NavigationTrigger>} */
let triggers = [];
function setNavigationTriggers(newTriggers) {
  triggers.forEach(trigger => trigger.inactivate());
  newTriggers.forEach(trigger => trigger.activate());
  triggers = newTriggers;
}
const willAnimate = elem => {
  const name = getComputedStyle(elem).getPropertyValue('animation-name');
  return name && name !== 'none';
};
const waitForAnimation = (elem, cb) => {
  const listener = () => {
    elem.removeEventListener('animationend', listener);
    cb();
  };
  elem.addEventListener('animationend', listener);
};
function animate(elem, className) {
  elem.classList.add(className);
  return new Promise(resolve => {
    if (willAnimate(elem)) {
      const rect = elem.getBoundingClientRect();
      const size = `height: ${rect.bottom - rect.top}px; width: ${rect.right - rect.left}px`;
      elem.setAttribute('style', `position: absolute; ${size}`);
      waitForAnimation(elem, () => {
        elem.classList.remove(className);
        elem.removeAttribute('style');
        resolve();
      });
    } else {
      elem.classList.remove(className);
      resolve();
    }
  });
}
const MAX_REDIRECT_COUNT = 256;
function isResultNotEmpty(result) {
  return result !== null && result !== undefined;
}
function copyContextWithoutNext(context) {
  const copy = Object.assign({}, context);
  delete copy.next;
  return copy;
}
function createLocation({
  pathname = '',
  search = '',
  hash = '',
  chain = [],
  params = {},
  redirectFrom,
  resolver
}, route) {
  const routes = chain.map(item => item.route);
  return {
    baseUrl: resolver && resolver.baseUrl || '',
    pathname,
    search,
    hash,
    routes,
    route: route || routes.length && routes[routes.length - 1] || null,
    params,
    redirectFrom,
    getUrl: (userParams = {}) => getPathnameForRouter(Router.pathToRegexp.compile(getMatchedPath(routes))(Object.assign({}, params, userParams)), resolver)
  };
}
function createRedirect(context, pathname) {
  const params = Object.assign({}, context.params);
  return {
    redirect: {
      pathname,
      from: context.pathname,
      params
    }
  };
}
function renderElement(context, element) {
  element.location = createLocation(context);
  const index = context.chain.map(item => item.route).indexOf(context.route);
  context.chain[index].element = element;
  return element;
}
function runCallbackIfPossible(callback, args, thisArg) {
  if (isFunction(callback)) {
    return callback.apply(thisArg, args);
  }
}
function amend(amendmentFunction, args, element) {
  return amendmentResult => {
    if (amendmentResult && (amendmentResult.cancel || amendmentResult.redirect)) {
      return amendmentResult;
    }
    if (element) {
      return runCallbackIfPossible(element[amendmentFunction], args, element);
    }
  };
}
function processNewChildren(newChildren, route) {
  if (!Array.isArray(newChildren) && !isObject(newChildren)) {
    throw new Error(log(`Incorrect "children" value for the route ${route.path}: expected array or object, but got ${newChildren}`));
  }
  route.__children = [];
  const childRoutes = toArray(newChildren);
  for (let i = 0; i < childRoutes.length; i++) {
    ensureRoute(childRoutes[i]);
    route.__children.push(childRoutes[i]);
  }
}
function removeDomNodes(nodes) {
  if (nodes && nodes.length) {
    const parent = nodes[0].parentNode;
    for (let i = 0; i < nodes.length; i++) {
      parent.removeChild(nodes[i]);
    }
  }
}
function getPathnameForRouter(pathname, router) {
  const base = router.__effectiveBaseUrl;
  return base ? router.constructor.__createUrl(pathname.replace(/^\//, ''), base).pathname : pathname;
}
function getMatchedPath(chain) {
  return chain.map(item => item.path).reduce((a, b) => {
    if (b.length) {
      return a.replace(/\/$/, '') + '/' + b.replace(/^\//, '');
    }
    return a;
  }, '');
}

/**
 * A simple client-side router for single-page applications. It uses
 * express-style middleware and has a first-class support for Web Components and
 * lazy-loading. Works great in Polymer and non-Polymer apps.
 *
 * Use `new Router(outlet, options)` to create a new Router instance.
 *
 * * The `outlet` parameter is a reference to the DOM node to render
 *   the content into.
 *
 * * The `options` parameter is an optional object with options. The following
 *   keys are supported:
 *   * `baseUrl` — the initial value for [
 *     the `baseUrl` property
 *   ](#/classes/Router#property-baseUrl)
 *
 * The Router instance is automatically subscribed to navigation events
 * on `window`.
 *
 * See [Live Examples](#/classes/Router/demos/demo/index.html) for the detailed usage demo and code snippets.
 *
 * See also detailed API docs for the following methods, for the advanced usage:
 *
 * * [setOutlet](#/classes/Router#method-setOutlet) – should be used to configure the outlet.
 * * [setTriggers](#/classes/Router#method-setTriggers) – should be used to configure the navigation events.
 * * [setRoutes](#/classes/Router#method-setRoutes) – should be used to configure the routes.
 *
 * Only `setRoutes` has to be called manually, others are automatically invoked when creating a new instance.
 *
 * @extends Resolver
 * @demo demo/index.html
 * @summary JavaScript class that renders different DOM content depending on
 *    a given path. It can re-render when triggered or automatically on
 *    'popstate' and / or 'click' events.
 */
class Router extends Resolver {
  /**
   * Creates a new Router instance with a given outlet, and
   * automatically subscribes it to navigation events on the `window`.
   * Using a constructor argument or a setter for outlet is equivalent:
   *
   * ```
   * const router = new Router();
   * router.setOutlet(outlet);
   * ```
   * @param {?Node=} outlet
   * @param {?RouterOptions=} options
   */
  constructor(outlet, options) {
    const baseElement = document.head.querySelector('base');
    const baseHref = baseElement && baseElement.getAttribute('href');
    super([], Object.assign({
      // Default options
      baseUrl: baseHref && Resolver.__createUrl(baseHref, document.URL).pathname.replace(/[^\/]*$/, '')
    }, options));
    this.resolveRoute = context => this.__resolveRoute(context);
    const triggers = Router.NavigationTrigger;
    Router.setTriggers.apply(Router, Object.keys(triggers).map(key => triggers[key]));

    /**
     * The base URL for all routes in the router instance. By default,
     * if the base element exists in the `<head>`, vaadin-router
     * takes the `<base href>` attribute value, resolves against current `document.URL`
     * and gets the `pathname` from the result.
     *
     * @public
     * @type {string}
     */
    this.baseUrl;

    /**
     * A promise that is settled after the current render cycle completes. If
     * there is no render cycle in progress the promise is immediately settled
     * with the last render cycle result.
     *
     * @public
     * @type {!Promise<!RouterLocation>}
     */
    this.ready;
    this.ready = Promise.resolve(outlet);

    /**
     * Contains read-only information about the current router location:
     * pathname, active routes, parameters. See the
     * [Location type declaration](#/classes/RouterLocation)
     * for more details.
     *
     * @public
     * @type {!RouterLocation}
     */
    this.location;
    this.location = createLocation({
      resolver: this
    });
    this.__lastStartedRenderId = 0;
    this.__navigationEventHandler = this.__onNavigationEvent.bind(this);
    this.setOutlet(outlet);
    this.subscribe();
    // Using WeakMap instead of WeakSet because WeakSet is not supported by IE11
    this.__createdByRouter = new WeakMap();
    this.__addedByRouter = new WeakMap();
  }
  __resolveRoute(context) {
    const route = context.route;
    let callbacks = Promise.resolve();
    if (isFunction(route.children)) {
      callbacks = callbacks.then(() => route.children(copyContextWithoutNext(context))).then(children => {
        // The route.children() callback might have re-written the
        // route.children property instead of returning a value
        if (!isResultNotEmpty(children) && !isFunction(route.children)) {
          children = route.children;
        }
        processNewChildren(children, route);
      });
    }
    const commands = {
      redirect: path => createRedirect(context, path),
      component: component => {
        const element = document.createElement(component);
        this.__createdByRouter.set(element, true);
        return element;
      }
    };
    return callbacks.then(() => {
      if (this.__isLatestRender(context)) {
        return runCallbackIfPossible(route.action, [context, commands], route);
      }
    }).then(result => {
      if (isResultNotEmpty(result)) {
        // Actions like `() => import('my-view.js')` are not expected to
        // end the resolution, despite the result is not empty. Checking
        // the result with a whitelist of values that end the resolution.
        if (result instanceof HTMLElement || result.redirect || result === notFoundResult) {
          return result;
        }
      }
      if (isString(route.redirect)) {
        return commands.redirect(route.redirect);
      }
      if (route.bundle) {
        return loadBundle(route.bundle).then(() => {}, () => {
          throw new Error(log(`Bundle not found: ${route.bundle}. Check if the file name is correct`));
        });
      }
    }).then(result => {
      if (isResultNotEmpty(result)) {
        return result;
      }
      if (isString(route.component)) {
        return commands.component(route.component);
      }
    });
  }

  /**
   * Sets the router outlet (the DOM node where the content for the current
   * route is inserted). Any content pre-existing in the router outlet is
   * removed at the end of each render pass.
   *
   * NOTE: this method is automatically invoked first time when creating a new Router instance.
   *
   * @param {?Node} outlet the DOM node where the content for the current route
   *     is inserted.
   */
  setOutlet(outlet) {
    if (outlet) {
      this.__ensureOutlet(outlet);
    }
    this.__outlet = outlet;
  }

  /**
   * Returns the current router outlet. The initial value is `undefined`.
   *
   * @return {?Node} the current router outlet (or `undefined`)
   */
  getOutlet() {
    return this.__outlet;
  }

  /**
   * Sets the routing config (replacing the existing one) and triggers a
   * navigation event so that the router outlet is refreshed according to the
   * current `window.location` and the new routing config.
   *
   * Each route object may have the following properties, listed here in the processing order:
   * * `path` – the route path (relative to the parent route if any) in the
   * [express.js syntax](https://expressjs.com/en/guide/routing.html#route-paths").
   *
   * * `children` – an array of nested routes or a function that provides this
   * array at the render time. The function can be synchronous or asynchronous:
   * in the latter case the render is delayed until the returned promise is
   * resolved. The `children` function is executed every time when this route is
   * being rendered. This allows for dynamic route structures (e.g. backend-defined),
   * but it might have a performance impact as well. In order to avoid calling
   * the function on subsequent renders, you can override the `children` property
   * of the route object and save the calculated array there
   * (via `context.route.children = [ route1, route2, ...];`).
   * Parent routes are fully resolved before resolving the children. Children
   * 'path' values are relative to the parent ones.
   *
   * * `action` – the action that is executed before the route is resolved.
   * The value for this property should be a function, accepting `context`
   * and `commands` parameters described below. If present, this function is
   * always invoked first, disregarding of the other properties' presence.
   * The action can return a result directly or within a `Promise`, which
   * resolves to the result. If the action result is an `HTMLElement` instance,
   * a `commands.component(name)` result, a `commands.redirect(path)` result,
   * or a `context.next()` result, the current route resolution is finished,
   * and other route config properties are ignored.
   * See also **Route Actions** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `redirect` – other route's path to redirect to. Passes all route parameters to the redirect target.
   * The target route should also be defined.
   * See also **Redirects** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `bundle` – string containing the path to `.js` or `.mjs` bundle to load before resolving the route,
   * or the object with "module" and "nomodule" keys referring to different bundles.
   * Each bundle is only loaded once. If "module" and "nomodule" are set, only one bundle is loaded,
   * depending on whether the browser supports ES modules or not.
   * The property is ignored when either an `action` returns the result or `redirect` property is present.
   * Any error, e.g. 404 while loading bundle will cause route resolution to throw.
   * See also **Code Splitting** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `component` – the tag name of the Web Component to resolve the route to.
   * The property is ignored when either an `action` returns the result or `redirect` property is present.
   * If route contains the `component` property (or an action that return a component)
   * and its child route also contains the `component` property, child route's component
   * will be rendered as a light dom child of a parent component.
   *
   * * `name` – the string name of the route to use in the
   * [`router.urlForName(name, params)`](#/classes/Router#method-urlForName)
   * navigation helper method.
   *
   * For any route function (`action`, `children`) defined, the corresponding `route` object is available inside the callback
   * through the `this` reference. If you need to access it, make sure you define the callback as a non-arrow function
   * because arrow functions do not have their own `this` reference.
   *
   * `context` object that is passed to `action` function holds the following properties:
   * * `context.pathname` – string with the pathname being resolved
   *
   * * `context.search` – search query string
   *
   * * `context.hash` – hash string
   *
   * * `context.params` – object with route parameters
   *
   * * `context.route` – object that holds the route that is currently being rendered.
   *
   * * `context.next()` – function for asynchronously getting the next route
   * contents from the resolution chain (if any)
   *
   * `commands` object that is passed to `action` function has
   * the following methods:
   *
   * * `commands.redirect(path)` – function that creates a redirect data
   * for the path specified.
   *
   * * `commands.component(component)` – function that creates a new HTMLElement
   * with current context. Note: the component created by this function is reused if visiting the same path twice in row.
   *
   *
   * @param {!Array<!Route>|!Route} routes a single route or an array of those
   * @param {?boolean} skipRender configure the router but skip rendering the
   *     route corresponding to the current `window.location` values
   *
   * @return {!Promise<!Node>}
   */
  setRoutes(routes, skipRender = false) {
    this.__previousContext = undefined;
    this.__urlForName = undefined;
    super.setRoutes(routes);
    if (!skipRender) {
      this.__onNavigationEvent();
    }
    return this.ready;
  }

  /**
   * Asynchronously resolves the given pathname and renders the resolved route
   * component into the router outlet. If no router outlet is set at the time of
   * calling this method, or at the time when the route resolution is completed,
   * a `TypeError` is thrown.
   *
   * Returns a promise that is fulfilled with the router outlet DOM Node after
   * the route component is created and inserted into the router outlet, or
   * rejected if no route matches the given path.
   *
   * If another render pass is started before the previous one is completed, the
   * result of the previous render pass is ignored.
   *
   * @param {!string|!{pathname: !string, search: ?string, hash: ?string}} pathnameOrContext
   *    the pathname to render or a context object with a `pathname` property,
   *    optional `search` and `hash` properties, and other properties
   *    to pass to the resolver.
   * @param {boolean=} shouldUpdateHistory
   *    update browser history with the rendered location
   * @return {!Promise<!Node>}
   */
  render(pathnameOrContext, shouldUpdateHistory) {
    const renderId = ++this.__lastStartedRenderId;
    const context = Object.assign({
      search: '',
      hash: ''
    }, isString(pathnameOrContext) ? {
      pathname: pathnameOrContext
    } : pathnameOrContext, {
      __renderId: renderId
    });

    // Find the first route that resolves to a non-empty result
    this.ready = this.resolve(context)

    // Process the result of this.resolve() and handle all special commands:
    // (redirect / prevent / component). If the result is a 'component',
    // then go deeper and build the entire chain of nested components matching
    // the pathname. Also call all 'on before' callbacks along the way.
    .then(context => this.__fullyResolveChain(context)).then(context => {
      if (this.__isLatestRender(context)) {
        const previousContext = this.__previousContext;

        // Check if the render was prevented and make an early return in that case
        if (context === previousContext) {
          // Replace the history with the previous context
          // to make sure the URL stays the same.
          this.__updateBrowserHistory(previousContext, true);
          return this.location;
        }
        this.location = createLocation(context);
        if (shouldUpdateHistory) {
          // Replace only if first render redirects, so that we don’t leave
          // the redirecting record in the history
          this.__updateBrowserHistory(context, renderId === 1);
        }
        fireRouterEvent('location-changed', {
          router: this,
          location: this.location
        });

        // Skip detaching/re-attaching there are no render changes
        if (context.__skipAttach) {
          this.__copyUnchangedElements(context, previousContext);
          this.__previousContext = context;
          return this.location;
        }
        this.__addAppearingContent(context, previousContext);
        const animationDone = this.__animateIfNeeded(context);
        this.__runOnAfterEnterCallbacks(context);
        this.__runOnAfterLeaveCallbacks(context, previousContext);
        return animationDone.then(() => {
          if (this.__isLatestRender(context)) {
            // If there is another render pass started after this one,
            // the 'disappearing content' would be removed when the other
            // render pass calls `this.__addAppearingContent()`
            this.__removeDisappearingContent();
            this.__previousContext = context;
            return this.location;
          }
        });
      }
    }).catch(error => {
      if (renderId === this.__lastStartedRenderId) {
        if (shouldUpdateHistory) {
          this.__updateBrowserHistory(context);
        }
        removeDomNodes(this.__outlet && this.__outlet.children);
        this.location = createLocation(Object.assign(context, {
          resolver: this
        }));
        fireRouterEvent('error', Object.assign({
          router: this,
          error
        }, context));
        throw error;
      }
    });
    return this.ready;
  }

  // `topOfTheChainContextBeforeRedirects` is a context coming from Resolver.resolve().
  // It would contain a 'redirect' route or the first 'component' route that
  // matched the pathname. There might be more child 'component' routes to be
  // resolved and added into the chain. This method would find and add them.
  // `contextBeforeRedirects` is the context containing such a child component
  // route. It's only necessary when this method is called recursively (otherwise
  // it's the same as the 'top of the chain' context).
  //
  // Apart from building the chain of child components, this method would also
  // handle 'redirect' routes, call 'onBefore' callbacks and handle 'prevent'
  // and 'redirect' callback results.
  __fullyResolveChain(topOfTheChainContextBeforeRedirects, contextBeforeRedirects = topOfTheChainContextBeforeRedirects) {
    return this.__findComponentContextAfterAllRedirects(contextBeforeRedirects)
    // `contextAfterRedirects` is always a context with an `HTMLElement` result
    // In other cases the promise gets rejected and .then() is not called
    .then(contextAfterRedirects => {
      const redirectsHappened = contextAfterRedirects !== contextBeforeRedirects;
      const topOfTheChainContextAfterRedirects = redirectsHappened ? contextAfterRedirects : topOfTheChainContextBeforeRedirects;
      const matchedPath = getPathnameForRouter(getMatchedPath(contextAfterRedirects.chain), contextAfterRedirects.resolver);
      const isFound = matchedPath === contextAfterRedirects.pathname;

      // Recursive method to try matching more child and sibling routes
      const findNextContextIfAny = (context, parent = context.route, prevResult) => {
        return context.next(undefined, parent, prevResult).then(nextContext => {
          if (nextContext === null || nextContext === notFoundResult) {
            // Next context is not found in children, ...
            if (isFound) {
              // ...but original context is already fully matching - use it
              return context;
            } else if (parent.parent !== null) {
              // ...and there is no full match yet - step up to check siblings
              return findNextContextIfAny(context, parent.parent, nextContext);
            } else {
              return nextContext;
            }
          }
          return nextContext;
        });
      };
      return findNextContextIfAny(contextAfterRedirects).then(nextContext => {
        if (nextContext === null || nextContext === notFoundResult) {
          throw getNotFoundError(topOfTheChainContextAfterRedirects);
        }
        return nextContext && nextContext !== notFoundResult && nextContext !== contextAfterRedirects ? this.__fullyResolveChain(topOfTheChainContextAfterRedirects, nextContext) : this.__amendWithOnBeforeCallbacks(contextAfterRedirects);
      });
    });
  }
  __findComponentContextAfterAllRedirects(context) {
    const result = context.result;
    if (result instanceof HTMLElement) {
      renderElement(context, result);
      return Promise.resolve(context);
    } else if (result.redirect) {
      return this.__redirect(result.redirect, context.__redirectCount, context.__renderId).then(context => this.__findComponentContextAfterAllRedirects(context));
    } else if (result instanceof Error) {
      return Promise.reject(result);
    } else {
      return Promise.reject(new Error(log(`Invalid route resolution result for path "${context.pathname}". ` + `Expected redirect object or HTML element, but got: "${logValue(result)}". ` + `Double check the action return value for the route.`)));
    }
  }
  __amendWithOnBeforeCallbacks(contextWithFullChain) {
    return this.__runOnBeforeCallbacks(contextWithFullChain).then(amendedContext => {
      if (amendedContext === this.__previousContext || amendedContext === contextWithFullChain) {
        return amendedContext;
      }
      return this.__fullyResolveChain(amendedContext);
    });
  }
  __runOnBeforeCallbacks(newContext) {
    const previousContext = this.__previousContext || {};
    const previousChain = previousContext.chain || [];
    const newChain = newContext.chain;
    let callbacks = Promise.resolve();
    const prevent = () => ({
      cancel: true
    });
    const redirect = pathname => createRedirect(newContext, pathname);
    newContext.__divergedChainIndex = 0;
    newContext.__skipAttach = false;
    if (previousChain.length) {
      for (let i = 0; i < Math.min(previousChain.length, newChain.length); i = ++newContext.__divergedChainIndex) {
        if (previousChain[i].route !== newChain[i].route || previousChain[i].path !== newChain[i].path && previousChain[i].element !== newChain[i].element || !this.__isReusableElement(previousChain[i].element, newChain[i].element)) {
          break;
        }
      }

      // Skip re-attaching and notifications if element and chain do not change
      newContext.__skipAttach =
      // Same route chain
      newChain.length === previousChain.length && newContext.__divergedChainIndex == newChain.length &&
      // Same element
      this.__isReusableElement(newContext.result, previousContext.result);
      if (newContext.__skipAttach) {
        // execute onBeforeLeave for changed segment element when skipping attach
        for (let i = newChain.length - 1; i >= 0; i--) {
          callbacks = this.__runOnBeforeLeaveCallbacks(callbacks, newContext, {
            prevent
          }, previousChain[i]);
        }
        // execute onBeforeEnter for changed segment element when skipping attach
        for (let i = 0; i < newChain.length; i++) {
          callbacks = this.__runOnBeforeEnterCallbacks(callbacks, newContext, {
            prevent,
            redirect
          }, newChain[i]);
          previousChain[i].element.location = createLocation(newContext, previousChain[i].route);
        }
      } else {
        // execute onBeforeLeave when NOT skipping attach
        for (let i = previousChain.length - 1; i >= newContext.__divergedChainIndex; i--) {
          callbacks = this.__runOnBeforeLeaveCallbacks(callbacks, newContext, {
            prevent
          }, previousChain[i]);
        }
      }
    }
    // execute onBeforeEnter when NOT skipping attach
    if (!newContext.__skipAttach) {
      for (let i = 0; i < newChain.length; i++) {
        if (i < newContext.__divergedChainIndex) {
          if (i < previousChain.length && previousChain[i].element) {
            previousChain[i].element.location = createLocation(newContext, previousChain[i].route);
          }
        } else {
          callbacks = this.__runOnBeforeEnterCallbacks(callbacks, newContext, {
            prevent,
            redirect
          }, newChain[i]);
          if (newChain[i].element) {
            newChain[i].element.location = createLocation(newContext, newChain[i].route);
          }
        }
      }
    }
    return callbacks.then(amendmentResult => {
      if (amendmentResult) {
        if (amendmentResult.cancel) {
          this.__previousContext.__renderId = newContext.__renderId;
          return this.__previousContext;
        }
        if (amendmentResult.redirect) {
          return this.__redirect(amendmentResult.redirect, newContext.__redirectCount, newContext.__renderId);
        }
      }
      return newContext;
    });
  }
  __runOnBeforeLeaveCallbacks(callbacks, newContext, commands, chainElement) {
    const location = createLocation(newContext);
    return callbacks.then(result => {
      if (this.__isLatestRender(newContext)) {
        const afterLeaveFunction = amend('onBeforeLeave', [location, commands, this], chainElement.element);
        return afterLeaveFunction(result);
      }
    }).then(result => {
      if (!(result || {}).redirect) {
        return result;
      }
    });
  }
  __runOnBeforeEnterCallbacks(callbacks, newContext, commands, chainElement) {
    const location = createLocation(newContext, chainElement.route);
    return callbacks.then(result => {
      if (this.__isLatestRender(newContext)) {
        const beforeEnterFunction = amend('onBeforeEnter', [location, commands, this], chainElement.element);
        return beforeEnterFunction(result);
      }
    });
  }
  __isReusableElement(element, otherElement) {
    if (element && otherElement) {
      return this.__createdByRouter.get(element) && this.__createdByRouter.get(otherElement) ? element.localName === otherElement.localName : element === otherElement;
    }
    return false;
  }
  __isLatestRender(context) {
    return context.__renderId === this.__lastStartedRenderId;
  }
  __redirect(redirectData, counter, renderId) {
    if (counter > MAX_REDIRECT_COUNT) {
      throw new Error(log(`Too many redirects when rendering ${redirectData.from}`));
    }
    return this.resolve({
      pathname: this.urlForPath(redirectData.pathname, redirectData.params),
      redirectFrom: redirectData.from,
      __redirectCount: (counter || 0) + 1,
      __renderId: renderId
    });
  }
  __ensureOutlet(outlet = this.__outlet) {
    if (!(outlet instanceof Node)) {
      throw new TypeError(log(`Expected router outlet to be a valid DOM Node (but got ${outlet})`));
    }
  }
  __updateBrowserHistory({
    pathname,
    search = '',
    hash = ''
  }, replace) {
    if (window.location.pathname !== pathname || window.location.search !== search || window.location.hash !== hash) {
      const changeState = replace ? 'replaceState' : 'pushState';
      window.history[changeState](null, document.title, pathname + search + hash);
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: 'vaadin-router-ignore'
      }));
    }
  }
  __copyUnchangedElements(context, previousContext) {
    // Find the deepest common parent between the last and the new component
    // chains. Update references for the unchanged elements in the new chain
    let deepestCommonParent = this.__outlet;
    for (let i = 0; i < context.__divergedChainIndex; i++) {
      const unchangedElement = previousContext && previousContext.chain[i].element;
      if (unchangedElement) {
        if (unchangedElement.parentNode === deepestCommonParent) {
          context.chain[i].element = unchangedElement;
          deepestCommonParent = unchangedElement;
        } else {
          break;
        }
      }
    }
    return deepestCommonParent;
  }
  __addAppearingContent(context, previousContext) {
    this.__ensureOutlet();

    // If the previous 'entering' animation has not completed yet,
    // stop it and remove that content from the DOM before adding new one.
    this.__removeAppearingContent();

    // Copy reusable elements from the previousContext to current
    const deepestCommonParent = this.__copyUnchangedElements(context, previousContext);

    // Keep two lists of DOM elements:
    //  - those that should be removed once the transition animation is over
    //  - and those that should remain
    this.__appearingContent = [];
    this.__disappearingContent = Array.from(deepestCommonParent.children).filter(
    // Only remove layout content that was added by router
    e => this.__addedByRouter.get(e) &&
    // Do not remove the result element to avoid flickering
    e !== context.result);

    // Add new elements (starting after the deepest common parent) to the DOM.
    // That way only the components that are actually different between the two
    // locations are added to the DOM (and those that are common remain in the
    // DOM without first removing and then adding them again).
    let parentElement = deepestCommonParent;
    for (let i = context.__divergedChainIndex; i < context.chain.length; i++) {
      const elementToAdd = context.chain[i].element;
      if (elementToAdd) {
        parentElement.appendChild(elementToAdd);
        this.__addedByRouter.set(elementToAdd, true);
        if (parentElement === deepestCommonParent) {
          this.__appearingContent.push(elementToAdd);
        }
        parentElement = elementToAdd;
      }
    }
  }
  __removeDisappearingContent() {
    if (this.__disappearingContent) {
      removeDomNodes(this.__disappearingContent);
    }
    this.__disappearingContent = null;
    this.__appearingContent = null;
  }
  __removeAppearingContent() {
    if (this.__disappearingContent && this.__appearingContent) {
      removeDomNodes(this.__appearingContent);
      this.__disappearingContent = null;
      this.__appearingContent = null;
    }
  }
  __runOnAfterLeaveCallbacks(currentContext, targetContext) {
    if (!targetContext) {
      return;
    }

    // REVERSE iteration: from Z to A
    for (let i = targetContext.chain.length - 1; i >= currentContext.__divergedChainIndex; i--) {
      if (!this.__isLatestRender(currentContext)) {
        break;
      }
      const currentComponent = targetContext.chain[i].element;
      if (!currentComponent) {
        continue;
      }
      try {
        const location = createLocation(currentContext);
        runCallbackIfPossible(currentComponent.onAfterLeave, [location, {}, targetContext.resolver], currentComponent);
      } finally {
        if (this.__disappearingContent.indexOf(currentComponent) > -1) {
          removeDomNodes(currentComponent.children);
        }
      }
    }
  }
  __runOnAfterEnterCallbacks(currentContext) {
    // forward iteration: from A to Z
    for (let i = currentContext.__divergedChainIndex; i < currentContext.chain.length; i++) {
      if (!this.__isLatestRender(currentContext)) {
        break;
      }
      const currentComponent = currentContext.chain[i].element || {};
      const location = createLocation(currentContext, currentContext.chain[i].route);
      runCallbackIfPossible(currentComponent.onAfterEnter, [location, {}, currentContext.resolver], currentComponent);
    }
  }
  __animateIfNeeded(context) {
    const from = (this.__disappearingContent || [])[0];
    const to = (this.__appearingContent || [])[0];
    const promises = [];
    const chain = context.chain;
    let config;
    for (let i = chain.length; i > 0; i--) {
      if (chain[i - 1].route.animate) {
        config = chain[i - 1].route.animate;
        break;
      }
    }
    if (from && to && config) {
      const leave = isObject(config) && config.leave || 'leaving';
      const enter = isObject(config) && config.enter || 'entering';
      promises.push(animate(from, leave));
      promises.push(animate(to, enter));
    }
    return Promise.all(promises).then(() => context);
  }

  /**
   * Subscribes this instance to navigation events on the `window`.
   *
   * NOTE: beware of resource leaks. For as long as a router instance is
   * subscribed to navigation events, it won't be garbage collected.
   */
  subscribe() {
    window.addEventListener('vaadin-router-go', this.__navigationEventHandler);
  }

  /**
   * Removes the subscription to navigation events created in the `subscribe()`
   * method.
   */
  unsubscribe() {
    window.removeEventListener('vaadin-router-go', this.__navigationEventHandler);
  }
  __onNavigationEvent(event) {
    const {
      pathname,
      search,
      hash
    } = event ? event.detail : window.location;
    if (isString(this.__normalizePathname(pathname))) {
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      this.render({
        pathname,
        search,
        hash
      }, true);
    }
  }

  /**
   * Configures what triggers Router navigation events:
   *  - `POPSTATE`: popstate events on the current `window`
   *  - `CLICK`: click events on `<a>` links leading to the current page
   *
   * This method is invoked with the pre-configured values when creating a new Router instance.
   * By default, both `POPSTATE` and `CLICK` are enabled. This setup is expected to cover most of the use cases.
   *
   * See the `router-config.js` for the default navigation triggers config. Based on it, you can
   * create the own one and only import the triggers you need, instead of pulling in all the code,
   * e.g. if you want to handle `click` differently.
   *
   * See also **Navigation Triggers** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * @param {...NavigationTrigger} triggers
   */
  static setTriggers(...triggers) {
    setNavigationTriggers(triggers);
  }

  /**
   * Generates a URL for the route with the given name, optionally performing
   * substitution of parameters.
   *
   * The route is searched in all the Router instances subscribed to
   * navigation events.
   *
   * **Note:** For child route names, only array children are considered.
   * It is not possible to generate URLs using a name for routes set with
   * a children function.
   *
   * @function urlForName
   * @param {!string} name the route name or the route’s `component` name.
   * @param {Params=} params Optional object with route path parameters.
   * Named parameters are passed by name (`params[name] = value`), unnamed
   * parameters are passed by index (`params[index] = value`).
   *
   * @return {string}
   */
  urlForName(name, params) {
    if (!this.__urlForName) {
      this.__urlForName = generateUrls(this);
    }
    return getPathnameForRouter(this.__urlForName(name, params), this);
  }

  /**
   * Generates a URL for the given route path, optionally performing
   * substitution of parameters.
   *
   * @param {!string} path string route path declared in [express.js syntax](https://expressjs.com/en/guide/routing.html#route-paths").
   * @param {Params=} params Optional object with route path parameters.
   * Named parameters are passed by name (`params[name] = value`), unnamed
   * parameters are passed by index (`params[index] = value`).
   *
   * @return {string}
   */
  urlForPath(path, params) {
    return getPathnameForRouter(Router.pathToRegexp.compile(path)(params), this);
  }

  /**
   * Triggers navigation to a new path. Returns a boolean without waiting until
   * the navigation is complete. Returns `true` if at least one `Router`
   * has handled the navigation (was subscribed and had `baseUrl` matching
   * the `path` argument), otherwise returns `false`.
   *
   * @param {!string|!{pathname: !string, search: (string|undefined), hash: (string|undefined)}} path
   *   a new in-app path string, or an URL-like object with `pathname`
   *   string property, and optional `search` and `hash` string properties.
   * @return {boolean}
   */
  static go(path) {
    const {
      pathname,
      search,
      hash
    } = isString(path) ? this.__createUrl(path, 'http://a') // some base to omit origin
    : path;
    return fireRouterEvent('go', {
      pathname,
      search,
      hash
    });
  }
}
const DEV_MODE_CODE_REGEXP = /\/\*[\*!]\s+vaadin-dev-mode:start([\s\S]*)vaadin-dev-mode:end\s+\*\*\//i;
const FlowClients = window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.clients;
function isMinified() {
  function test() {
    /** vaadin-dev-mode:start
    return false;
    vaadin-dev-mode:end **/
    return true;
  }
  return uncommentAndRun(test);
}
function isDevelopmentMode() {
  try {
    if (isForcedDevelopmentMode()) {
      return true;
    }
    if (!isLocalhost()) {
      return false;
    }
    if (FlowClients) {
      return !isFlowProductionMode();
    }
    return !isMinified();
  } catch (e) {
    // Some error in this code, assume production so no further actions will be taken
    return false;
  }
}
function isForcedDevelopmentMode() {
  return localStorage.getItem("vaadin.developmentmode.force");
}
function isLocalhost() {
  return ["localhost", "127.0.0.1"].indexOf(window.location.hostname) >= 0;
}
function isFlowProductionMode() {
  if (FlowClients) {
    const productionModeApps = Object.keys(FlowClients).map(key => FlowClients[key]).filter(client => client.productionMode);
    if (productionModeApps.length > 0) {
      return true;
    }
  }
  return false;
}
function uncommentAndRun(callback, args) {
  if (typeof callback !== 'function') {
    return;
  }
  const match = DEV_MODE_CODE_REGEXP.exec(callback.toString());
  if (match) {
    try {
      // requires CSP: script-src 'unsafe-eval'
      callback = new Function(match[1]);
    } catch (e) {
      // eat the exception
      console.log('vaadin-development-mode-detector: uncommentAndRun() failed', e);
    }
  }
  return callback(args);
}

// A guard against polymer-modulizer removing the window.Vaadin
// initialization above.
window['Vaadin'] = window['Vaadin'] || {};

/**
 * Inspects the source code of the given `callback` function for
 * specially-marked _commented_ code. If such commented code is found in the
 * callback source, uncomments and runs that code instead of the callback
 * itself. Otherwise runs the callback as is.
 *
 * The optional arguments are passed into the callback / uncommented code,
 * the result is returned.
 *
 * See the `isMinified()` function source code in this file for an example.
 *
 */
const runIfDevelopmentMode = function (callback, args) {
  if (window.Vaadin.developmentMode) {
    return uncommentAndRun(callback, args);
  }
};
if (window.Vaadin.developmentMode === undefined) {
  window.Vaadin.developmentMode = isDevelopmentMode();
}

/* This file is autogenerated from src/vaadin-usage-statistics.tpl.html */

function maybeGatherAndSendStats() {
  /** vaadin-dev-mode:start
  (function () {
  'use strict';
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
  } : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
  };
  var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
   return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
  }();
  var getPolymerVersion = function getPolymerVersion() {
  return window.Polymer && window.Polymer.version;
  };
  var StatisticsGatherer = function () {
  function StatisticsGatherer(logger) {
    classCallCheck(this, StatisticsGatherer);
     this.now = new Date().getTime();
    this.logger = logger;
  }
   createClass(StatisticsGatherer, [{
    key: 'frameworkVersionDetectors',
    value: function frameworkVersionDetectors() {
      return {
        'Flow': function Flow() {
          if (window.Vaadin && window.Vaadin.Flow && window.Vaadin.Flow.clients) {
            var flowVersions = Object.keys(window.Vaadin.Flow.clients).map(function (key) {
              return window.Vaadin.Flow.clients[key];
            }).filter(function (client) {
              return client.getVersionInfo;
            }).map(function (client) {
              return client.getVersionInfo().flow;
            });
            if (flowVersions.length > 0) {
              return flowVersions[0];
            }
          }
        },
        'Vaadin Framework': function VaadinFramework() {
          if (window.vaadin && window.vaadin.clients) {
            var frameworkVersions = Object.values(window.vaadin.clients).filter(function (client) {
              return client.getVersionInfo;
            }).map(function (client) {
              return client.getVersionInfo().vaadinVersion;
            });
            if (frameworkVersions.length > 0) {
              return frameworkVersions[0];
            }
          }
        },
        'AngularJs': function AngularJs() {
          if (window.angular && window.angular.version && window.angular.version) {
            return window.angular.version.full;
          }
        },
        'Angular': function Angular() {
          if (window.ng) {
            var tags = document.querySelectorAll("[ng-version]");
            if (tags.length > 0) {
              return tags[0].getAttribute("ng-version");
            }
            return "Unknown";
          }
        },
        'Backbone.js': function BackboneJs() {
          if (window.Backbone) {
            return window.Backbone.VERSION;
          }
        },
        'React': function React() {
          var reactSelector = '[data-reactroot], [data-reactid]';
          if (!!document.querySelector(reactSelector)) {
            // React does not publish the version by default
            return "unknown";
          }
        },
        'Ember': function Ember() {
          if (window.Em && window.Em.VERSION) {
            return window.Em.VERSION;
          } else if (window.Ember && window.Ember.VERSION) {
            return window.Ember.VERSION;
          }
        },
        'jQuery': function (_jQuery) {
          function jQuery() {
            return _jQuery.apply(this, arguments);
          }
           jQuery.toString = function () {
            return _jQuery.toString();
          };
           return jQuery;
        }(function () {
          if (typeof jQuery === 'function' && jQuery.prototype.jquery !== undefined) {
            return jQuery.prototype.jquery;
          }
        }),
        'Polymer': function Polymer() {
          var version = getPolymerVersion();
          if (version) {
            return version;
          }
        },
        'LitElement': function LitElement() {
          var version = window.litElementVersions && window.litElementVersions[0];
          if (version) {
            return version;
          }
        },
        'LitHtml': function LitHtml() {
          var version = window.litHtmlVersions && window.litHtmlVersions[0];
          if (version) {
            return version;
          }
        },
        'Vue.js': function VueJs() {
          if (window.Vue) {
            return window.Vue.version;
          }
        }
      };
    }
  }, {
    key: 'getUsedVaadinElements',
    value: function getUsedVaadinElements(elements) {
      var version = getPolymerVersion();
      var elementClasses = void 0;
      // NOTE: In case you edit the code here, YOU MUST UPDATE any statistics reporting code in Flow.
      // Check all locations calling the method getEntries() in
      // https://github.com/vaadin/flow/blob/master/flow-server/src/main/java/com/vaadin/flow/internal/UsageStatistics.java#L106
      // Currently it is only used by BootstrapHandler.
      if (version && version.indexOf('2') === 0) {
        // Polymer 2: components classes are stored in window.Vaadin
        elementClasses = Object.keys(window.Vaadin).map(function (c) {
          return window.Vaadin[c];
        }).filter(function (c) {
          return c.is;
        });
      } else {
        // Polymer 3: components classes are stored in window.Vaadin.registrations
        elementClasses = window.Vaadin.registrations || [];
      }
      elementClasses.forEach(function (klass) {
        var version = klass.version ? klass.version : "0.0.0";
        elements[klass.is] = { version: version };
      });
    }
  }, {
    key: 'getUsedVaadinThemes',
    value: function getUsedVaadinThemes(themes) {
      ['Lumo', 'Material'].forEach(function (themeName) {
        var theme;
        var version = getPolymerVersion();
        if (version && version.indexOf('2') === 0) {
          // Polymer 2: themes are stored in window.Vaadin
          theme = window.Vaadin[themeName];
        } else {
          // Polymer 3: themes are stored in custom element registry
          theme = customElements.get('vaadin-' + themeName.toLowerCase() + '-styles');
        }
        if (theme && theme.version) {
          themes[themeName] = { version: theme.version };
        }
      });
    }
  }, {
    key: 'getFrameworks',
    value: function getFrameworks(frameworks) {
      var detectors = this.frameworkVersionDetectors();
      Object.keys(detectors).forEach(function (framework) {
        var detector = detectors[framework];
        try {
          var version = detector();
          if (version) {
            frameworks[framework] = { version: version };
          }
        } catch (e) {}
      });
    }
  }, {
    key: 'gather',
    value: function gather(storage) {
      var storedStats = storage.read();
      var gatheredStats = {};
      var types = ["elements", "frameworks", "themes"];
       types.forEach(function (type) {
        gatheredStats[type] = {};
        if (!storedStats[type]) {
          storedStats[type] = {};
        }
      });
       var previousStats = JSON.stringify(storedStats);
       this.getUsedVaadinElements(gatheredStats.elements);
      this.getFrameworks(gatheredStats.frameworks);
      this.getUsedVaadinThemes(gatheredStats.themes);
       var now = this.now;
      types.forEach(function (type) {
        var keys = Object.keys(gatheredStats[type]);
        keys.forEach(function (key) {
          if (!storedStats[type][key] || _typeof(storedStats[type][key]) != _typeof({})) {
            storedStats[type][key] = { firstUsed: now };
          }
          // Discards any previously logged version number
          storedStats[type][key].version = gatheredStats[type][key].version;
          storedStats[type][key].lastUsed = now;
        });
      });
       var newStats = JSON.stringify(storedStats);
      storage.write(newStats);
      if (newStats != previousStats && Object.keys(storedStats).length > 0) {
        this.logger.debug("New stats: " + newStats);
      }
    }
  }]);
  return StatisticsGatherer;
  }();
  var StatisticsStorage = function () {
  function StatisticsStorage(key) {
    classCallCheck(this, StatisticsStorage);
     this.key = key;
  }
   createClass(StatisticsStorage, [{
    key: 'read',
    value: function read() {
      var localStorageStatsString = localStorage.getItem(this.key);
      try {
        return JSON.parse(localStorageStatsString ? localStorageStatsString : '{}');
      } catch (e) {
        return {};
      }
    }
  }, {
    key: 'write',
    value: function write(data) {
      localStorage.setItem(this.key, data);
    }
  }, {
    key: 'clear',
    value: function clear() {
      localStorage.removeItem(this.key);
    }
  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      var storedStats = this.read();
      var empty = true;
      Object.keys(storedStats).forEach(function (key) {
        if (Object.keys(storedStats[key]).length > 0) {
          empty = false;
        }
      });
       return empty;
    }
  }]);
  return StatisticsStorage;
  }();
  var StatisticsSender = function () {
  function StatisticsSender(url, logger) {
    classCallCheck(this, StatisticsSender);
     this.url = url;
    this.logger = logger;
  }
   createClass(StatisticsSender, [{
    key: 'send',
    value: function send(data, errorHandler) {
      var logger = this.logger;
       if (navigator.onLine === false) {
        logger.debug("Offline, can't send");
        errorHandler();
        return;
      }
      logger.debug("Sending data to " + this.url);
       var req = new XMLHttpRequest();
      req.withCredentials = true;
      req.addEventListener("load", function () {
        // Stats sent, nothing more to do
        logger.debug("Response: " + req.responseText);
      });
      req.addEventListener("error", function () {
        logger.debug("Send failed");
        errorHandler();
      });
      req.addEventListener("abort", function () {
        logger.debug("Send aborted");
        errorHandler();
      });
      req.open("POST", this.url);
      req.setRequestHeader("Content-Type", "application/json");
      req.send(data);
    }
  }]);
  return StatisticsSender;
  }();
  var StatisticsLogger = function () {
  function StatisticsLogger(id) {
    classCallCheck(this, StatisticsLogger);
     this.id = id;
  }
   createClass(StatisticsLogger, [{
    key: '_isDebug',
    value: function _isDebug() {
      return localStorage.getItem("vaadin." + this.id + ".debug");
    }
  }, {
    key: 'debug',
    value: function debug(msg) {
      if (this._isDebug()) {
        console.info(this.id + ": " + msg);
      }
    }
  }]);
  return StatisticsLogger;
  }();
  var UsageStatistics = function () {
  function UsageStatistics() {
    classCallCheck(this, UsageStatistics);
     this.now = new Date();
    this.timeNow = this.now.getTime();
    this.gatherDelay = 10; // Delay between loading this file and gathering stats
    this.initialDelay = 24 * 60 * 60;
     this.logger = new StatisticsLogger("statistics");
    this.storage = new StatisticsStorage("vaadin.statistics.basket");
    this.gatherer = new StatisticsGatherer(this.logger);
    this.sender = new StatisticsSender("https://tools.vaadin.com/usage-stats/submit", this.logger);
  }
   createClass(UsageStatistics, [{
    key: 'maybeGatherAndSend',
    value: function maybeGatherAndSend() {
      var _this = this;
       if (localStorage.getItem(UsageStatistics.optOutKey)) {
        return;
      }
      this.gatherer.gather(this.storage);
      setTimeout(function () {
        _this.maybeSend();
      }, this.gatherDelay * 1000);
    }
  }, {
    key: 'lottery',
    value: function lottery() {
      return true;
    }
  }, {
    key: 'currentMonth',
    value: function currentMonth() {
      return this.now.getYear() * 12 + this.now.getMonth();
    }
  }, {
    key: 'maybeSend',
    value: function maybeSend() {
      var firstUse = Number(localStorage.getItem(UsageStatistics.firstUseKey));
      var monthProcessed = Number(localStorage.getItem(UsageStatistics.monthProcessedKey));
       if (!firstUse) {
        // Use a grace period to avoid interfering with tests, incognito mode etc
        firstUse = this.timeNow;
        localStorage.setItem(UsageStatistics.firstUseKey, firstUse);
      }
       if (this.timeNow < firstUse + this.initialDelay * 1000) {
        this.logger.debug("No statistics will be sent until the initial delay of " + this.initialDelay + "s has passed");
        return;
      }
      if (this.currentMonth() <= monthProcessed) {
        this.logger.debug("This month has already been processed");
        return;
      }
      localStorage.setItem(UsageStatistics.monthProcessedKey, this.currentMonth());
      // Use random sampling
      if (this.lottery()) {
        this.logger.debug("Congratulations, we have a winner!");
      } else {
        this.logger.debug("Sorry, no stats from you this time");
        return;
      }
       this.send();
    }
  }, {
    key: 'send',
    value: function send() {
      // Ensure we have the latest data
      this.gatherer.gather(this.storage);
       // Read, send and clean up
      var data = this.storage.read();
      data["firstUse"] = Number(localStorage.getItem(UsageStatistics.firstUseKey));
      data["usageStatisticsVersion"] = UsageStatistics.version;
      var info = 'This request contains usage statistics gathered from the application running in development mode. \n\nStatistics gathering is automatically disabled and excluded from production builds.\n\nFor details and to opt-out, see https://github.com/vaadin/vaadin-usage-statistics.\n\n\n\n';
      var self = this;
      this.sender.send(info + JSON.stringify(data), function () {
        // Revert the 'month processed' flag
        localStorage.setItem(UsageStatistics.monthProcessedKey, self.currentMonth() - 1);
      });
    }
  }], [{
    key: 'version',
    get: function get$1() {
      return '2.1.2';
    }
  }, {
    key: 'firstUseKey',
    get: function get$1() {
      return 'vaadin.statistics.firstuse';
    }
  }, {
    key: 'monthProcessedKey',
    get: function get$1() {
      return 'vaadin.statistics.monthProcessed';
    }
  }, {
    key: 'optOutKey',
    get: function get$1() {
      return 'vaadin.statistics.optout';
    }
  }]);
  return UsageStatistics;
  }();
  try {
  window.Vaadin = window.Vaadin || {};
  window.Vaadin.usageStatsChecker = window.Vaadin.usageStatsChecker || new UsageStatistics();
  window.Vaadin.usageStatsChecker.maybeGatherAndSend();
  } catch (e) {
  // Intentionally ignored as this is not a problem in the app being developed
  }
  }());
   vaadin-dev-mode:end **/
}
const usageStatistics = function () {
  if (typeof runIfDevelopmentMode === 'function') {
    return runIfDevelopmentMode(maybeGatherAndSendStats);
  }
};
window.Vaadin = window.Vaadin || {};
window.Vaadin.registrations = window.Vaadin.registrations || [];
window.Vaadin.registrations.push({
  is: '@vaadin/router',
  version: '1.7.4'
});
usageStatistics();
Router.NavigationTrigger = {
  POPSTATE,
  CLICK
};

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$5 = window,
  e$b = t$5.ShadowRoot && (void 0 === t$5.ShadyCSS || t$5.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype,
  s$9 = Symbol(),
  n$c = new WeakMap();
class o$9 {
  constructor(t, e, n) {
    if (this._$cssResult$ = !0, n !== s$9) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (e$b && void 0 === t) {
      const e = void 0 !== s && 1 === s.length;
      e && (t = n$c.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && n$c.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
}
const r$7 = t => new o$9("string" == typeof t ? t : t + "", void 0, s$9),
  S$4 = (s, n) => {
    e$b ? s.adoptedStyleSheets = n.map(t => t instanceof CSSStyleSheet ? t : t.styleSheet) : n.forEach(e => {
      const n = document.createElement("style"),
        o = t$5.litNonce;
      void 0 !== o && n.setAttribute("nonce", o), n.textContent = e.cssText, s.appendChild(n);
    });
  },
  c$5 = e$b ? t => t : t => t instanceof CSSStyleSheet ? (t => {
    let e = "";
    for (const s of t.cssRules) e += s.cssText;
    return r$7(e);
  })(t) : t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var s$8;
const e$a = window,
  r$6 = e$a.trustedTypes,
  h$5 = r$6 ? r$6.emptyScript : "",
  o$8 = e$a.reactiveElementPolyfillSupport,
  n$b = {
    toAttribute(t, i) {
      switch (i) {
        case Boolean:
          t = t ? h$5 : null;
          break;
        case Object:
        case Array:
          t = null == t ? t : JSON.stringify(t);
      }
      return t;
    },
    fromAttribute(t, i) {
      let s = t;
      switch (i) {
        case Boolean:
          s = null !== t;
          break;
        case Number:
          s = null === t ? null : Number(t);
          break;
        case Object:
        case Array:
          try {
            s = JSON.parse(t);
          } catch (t) {
            s = null;
          }
      }
      return s;
    }
  },
  a$6 = (t, i) => i !== t && (i == i || t == t),
  l$5 = {
    attribute: !0,
    type: String,
    converter: n$b,
    reflect: !1,
    hasChanged: a$6
  },
  d$5 = "finalized";
class u$5 extends HTMLElement {
  constructor() {
    super(), this._$Ei = new Map(), this.isUpdatePending = !1, this.hasUpdated = !1, this._$El = null, this._$Eu();
  }
  static addInitializer(t) {
    var i;
    this.finalize(), (null !== (i = this.h) && void 0 !== i ? i : this.h = []).push(t);
  }
  static get observedAttributes() {
    this.finalize();
    const t = [];
    return this.elementProperties.forEach((i, s) => {
      const e = this._$Ep(s, i);
      void 0 !== e && (this._$Ev.set(e, s), t.push(e));
    }), t;
  }
  static createProperty(t, i = l$5) {
    if (i.state && (i.attribute = !1), this.finalize(), this.elementProperties.set(t, i), !i.noAccessor && !this.prototype.hasOwnProperty(t)) {
      const s = "symbol" == typeof t ? Symbol() : "__" + t,
        e = this.getPropertyDescriptor(t, s, i);
      void 0 !== e && Object.defineProperty(this.prototype, t, e);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    return {
      get() {
        return this[i];
      },
      set(e) {
        const r = this[t];
        this[i] = e, this.requestUpdate(t, r, s);
      },
      configurable: !0,
      enumerable: !0
    };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) || l$5;
  }
  static finalize() {
    if (this.hasOwnProperty(d$5)) return !1;
    this[d$5] = !0;
    const t = Object.getPrototypeOf(this);
    if (t.finalize(), void 0 !== t.h && (this.h = [...t.h]), this.elementProperties = new Map(t.elementProperties), this._$Ev = new Map(), this.hasOwnProperty("properties")) {
      const t = this.properties,
        i = [...Object.getOwnPropertyNames(t), ...Object.getOwnPropertySymbols(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    return this.elementStyles = this.finalizeStyles(this.styles), !0;
  }
  static finalizeStyles(i) {
    const s = [];
    if (Array.isArray(i)) {
      const e = new Set(i.flat(1 / 0).reverse());
      for (const i of e) s.unshift(c$5(i));
    } else void 0 !== i && s.push(c$5(i));
    return s;
  }
  static _$Ep(t, i) {
    const s = i.attribute;
    return !1 === s ? void 0 : "string" == typeof s ? s : "string" == typeof t ? t.toLowerCase() : void 0;
  }
  _$Eu() {
    var t;
    this._$E_ = new Promise(t => this.enableUpdating = t), this._$AL = new Map(), this._$Eg(), this.requestUpdate(), null === (t = this.constructor.h) || void 0 === t || t.forEach(t => t(this));
  }
  addController(t) {
    var i, s;
    (null !== (i = this._$ES) && void 0 !== i ? i : this._$ES = []).push(t), void 0 !== this.renderRoot && this.isConnected && (null === (s = t.hostConnected) || void 0 === s || s.call(t));
  }
  removeController(t) {
    var i;
    null === (i = this._$ES) || void 0 === i || i.splice(this._$ES.indexOf(t) >>> 0, 1);
  }
  _$Eg() {
    this.constructor.elementProperties.forEach((t, i) => {
      this.hasOwnProperty(i) && (this._$Ei.set(i, this[i]), delete this[i]);
    });
  }
  createRenderRoot() {
    var t;
    const s = null !== (t = this.shadowRoot) && void 0 !== t ? t : this.attachShadow(this.constructor.shadowRootOptions);
    return S$4(s, this.constructor.elementStyles), s;
  }
  connectedCallback() {
    var t;
    void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), null === (t = this._$ES) || void 0 === t || t.forEach(t => {
      var i;
      return null === (i = t.hostConnected) || void 0 === i ? void 0 : i.call(t);
    });
  }
  enableUpdating(t) {}
  disconnectedCallback() {
    var t;
    null === (t = this._$ES) || void 0 === t || t.forEach(t => {
      var i;
      return null === (i = t.hostDisconnected) || void 0 === i ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(t, i, s) {
    this._$AK(t, s);
  }
  _$EO(t, i, s = l$5) {
    var e;
    const r = this.constructor._$Ep(t, s);
    if (void 0 !== r && !0 === s.reflect) {
      const h = (void 0 !== (null === (e = s.converter) || void 0 === e ? void 0 : e.toAttribute) ? s.converter : n$b).toAttribute(i, s.type);
      this._$El = t, null == h ? this.removeAttribute(r) : this.setAttribute(r, h), this._$El = null;
    }
  }
  _$AK(t, i) {
    var s;
    const e = this.constructor,
      r = e._$Ev.get(t);
    if (void 0 !== r && this._$El !== r) {
      const t = e.getPropertyOptions(r),
        h = "function" == typeof t.converter ? {
          fromAttribute: t.converter
        } : void 0 !== (null === (s = t.converter) || void 0 === s ? void 0 : s.fromAttribute) ? t.converter : n$b;
      this._$El = r, this[r] = h.fromAttribute(i, t.type), this._$El = null;
    }
  }
  requestUpdate(t, i, s) {
    let e = !0;
    void 0 !== t && (((s = s || this.constructor.getPropertyOptions(t)).hasChanged || a$6)(this[t], i) ? (this._$AL.has(t) || this._$AL.set(t, i), !0 === s.reflect && this._$El !== t && (void 0 === this._$EC && (this._$EC = new Map()), this._$EC.set(t, s))) : e = !1), !this.isUpdatePending && e && (this._$E_ = this._$Ej());
  }
  async _$Ej() {
    this.isUpdatePending = !0;
    try {
      await this._$E_;
    } catch (t) {
      Promise.reject(t);
    }
    const t = this.scheduleUpdate();
    return null != t && (await t), !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var t;
    if (!this.isUpdatePending) return;
    this.hasUpdated, this._$Ei && (this._$Ei.forEach((t, i) => this[i] = t), this._$Ei = void 0);
    let i = !1;
    const s = this._$AL;
    try {
      i = this.shouldUpdate(s), i ? (this.willUpdate(s), null === (t = this._$ES) || void 0 === t || t.forEach(t => {
        var i;
        return null === (i = t.hostUpdate) || void 0 === i ? void 0 : i.call(t);
      }), this.update(s)) : this._$Ek();
    } catch (t) {
      throw i = !1, this._$Ek(), t;
    }
    i && this._$AE(s);
  }
  willUpdate(t) {}
  _$AE(t) {
    var i;
    null === (i = this._$ES) || void 0 === i || i.forEach(t => {
      var i;
      return null === (i = t.hostUpdated) || void 0 === i ? void 0 : i.call(t);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$Ek() {
    this._$AL = new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$E_;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    void 0 !== this._$EC && (this._$EC.forEach((t, i) => this._$EO(i, this[i], t)), this._$EC = void 0), this._$Ek();
  }
  updated(t) {}
  firstUpdated(t) {}
}
u$5[d$5] = !0, u$5.elementProperties = new Map(), u$5.elementStyles = [], u$5.shadowRootOptions = {
  mode: "open"
}, null == o$8 || o$8({
  ReactiveElement: u$5
}), (null !== (s$8 = e$a.reactiveElementVersions) && void 0 !== s$8 ? s$8 : e$a.reactiveElementVersions = []).push("1.6.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var t$4;
const i$8 = window,
  s$7 = i$8.trustedTypes,
  e$9 = s$7 ? s$7.createPolicy("lit-html", {
    createHTML: t => t
  }) : void 0,
  o$7 = "$lit$",
  n$a = `lit$${(Math.random() + "").slice(9)}$`,
  l$4 = "?" + n$a,
  h$4 = `<${l$4}>`,
  r$5 = document,
  u$4 = () => r$5.createComment(""),
  d$4 = t => null === t || "object" != typeof t && "function" != typeof t,
  c$4 = Array.isArray,
  v$2 = t => c$4(t) || "function" == typeof (null == t ? void 0 : t[Symbol.iterator]),
  a$5 = "[ \t\n\f\r]",
  f$2 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
  _$2 = /-->/g,
  m$3 = />/g,
  p$1 = RegExp(`>|${a$5}(?:([^\\s"'>=/]+)(${a$5}*=${a$5}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"),
  g$3 = /'/g,
  $$3 = /"/g,
  y$3 = /^(?:script|style|textarea|title)$/i,
  T$2 = Symbol.for("lit-noChange"),
  A$3 = Symbol.for("lit-nothing"),
  E$3 = new WeakMap(),
  C$3 = r$5.createTreeWalker(r$5, 129, null, !1);
function P$2(t, i) {
  if (!Array.isArray(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e$9 ? e$9.createHTML(i) : i;
}
const V$3 = (t, i) => {
  const s = t.length - 1,
    e = [];
  let l,
    r = 2 === i ? "<svg>" : "",
    u = f$2;
  for (let i = 0; i < s; i++) {
    const s = t[i];
    let d,
      c,
      v = -1,
      a = 0;
    for (; a < s.length && (u.lastIndex = a, c = u.exec(s), null !== c);) a = u.lastIndex, u === f$2 ? "!--" === c[1] ? u = _$2 : void 0 !== c[1] ? u = m$3 : void 0 !== c[2] ? (y$3.test(c[2]) && (l = RegExp("</" + c[2], "g")), u = p$1) : void 0 !== c[3] && (u = p$1) : u === p$1 ? ">" === c[0] ? (u = null != l ? l : f$2, v = -1) : void 0 === c[1] ? v = -2 : (v = u.lastIndex - c[2].length, d = c[1], u = void 0 === c[3] ? p$1 : '"' === c[3] ? $$3 : g$3) : u === $$3 || u === g$3 ? u = p$1 : u === _$2 || u === m$3 ? u = f$2 : (u = p$1, l = void 0);
    const w = u === p$1 && t[i + 1].startsWith("/>") ? " " : "";
    r += u === f$2 ? s + h$4 : v >= 0 ? (e.push(d), s.slice(0, v) + o$7 + s.slice(v) + n$a + w) : s + n$a + (-2 === v ? (e.push(void 0), i) : w);
  }
  return [P$2(t, r + (t[s] || "<?>") + (2 === i ? "</svg>" : "")), e];
};
class N$3 {
  constructor({
    strings: t,
    _$litType$: i
  }, e) {
    let h;
    this.parts = [];
    let r = 0,
      d = 0;
    const c = t.length - 1,
      v = this.parts,
      [a, f] = V$3(t, i);
    if (this.el = N$3.createElement(a, e), C$3.currentNode = this.el.content, 2 === i) {
      const t = this.el.content,
        i = t.firstChild;
      i.remove(), t.append(...i.childNodes);
    }
    for (; null !== (h = C$3.nextNode()) && v.length < c;) {
      if (1 === h.nodeType) {
        if (h.hasAttributes()) {
          const t = [];
          for (const i of h.getAttributeNames()) if (i.endsWith(o$7) || i.startsWith(n$a)) {
            const s = f[d++];
            if (t.push(i), void 0 !== s) {
              const t = h.getAttribute(s.toLowerCase() + o$7).split(n$a),
                i = /([.?@])?(.*)/.exec(s);
              v.push({
                type: 1,
                index: r,
                name: i[2],
                strings: t,
                ctor: "." === i[1] ? H$3 : "?" === i[1] ? L$3 : "@" === i[1] ? z$2 : k$3
              });
            } else v.push({
              type: 6,
              index: r
            });
          }
          for (const i of t) h.removeAttribute(i);
        }
        if (y$3.test(h.tagName)) {
          const t = h.textContent.split(n$a),
            i = t.length - 1;
          if (i > 0) {
            h.textContent = s$7 ? s$7.emptyScript : "";
            for (let s = 0; s < i; s++) h.append(t[s], u$4()), C$3.nextNode(), v.push({
              type: 2,
              index: ++r
            });
            h.append(t[i], u$4());
          }
        }
      } else if (8 === h.nodeType) if (h.data === l$4) v.push({
        type: 2,
        index: r
      });else {
        let t = -1;
        for (; -1 !== (t = h.data.indexOf(n$a, t + 1));) v.push({
          type: 7,
          index: r
        }), t += n$a.length - 1;
      }
      r++;
    }
  }
  static createElement(t, i) {
    const s = r$5.createElement("template");
    return s.innerHTML = t, s;
  }
}
function S$3(t, i, s = t, e) {
  var o, n, l, h;
  if (i === T$2) return i;
  let r = void 0 !== e ? null === (o = s._$Co) || void 0 === o ? void 0 : o[e] : s._$Cl;
  const u = d$4(i) ? void 0 : i._$litDirective$;
  return (null == r ? void 0 : r.constructor) !== u && (null === (n = null == r ? void 0 : r._$AO) || void 0 === n || n.call(r, !1), void 0 === u ? r = void 0 : (r = new u(t), r._$AT(t, s, e)), void 0 !== e ? (null !== (l = (h = s)._$Co) && void 0 !== l ? l : h._$Co = [])[e] = r : s._$Cl = r), void 0 !== r && (i = S$3(t, r._$AS(t, i.values), r, e)), i;
}
class M$3 {
  constructor(t, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    var i;
    const {
        el: {
          content: s
        },
        parts: e
      } = this._$AD,
      o = (null !== (i = null == t ? void 0 : t.creationScope) && void 0 !== i ? i : r$5).importNode(s, !0);
    C$3.currentNode = o;
    let n = C$3.nextNode(),
      l = 0,
      h = 0,
      u = e[0];
    for (; void 0 !== u;) {
      if (l === u.index) {
        let i;
        2 === u.type ? i = new R$3(n, n.nextSibling, this, t) : 1 === u.type ? i = new u.ctor(n, u.name, u.strings, this, t) : 6 === u.type && (i = new Z$2(n, this, t)), this._$AV.push(i), u = e[++h];
      }
      l !== (null == u ? void 0 : u.index) && (n = C$3.nextNode(), l++);
    }
    return C$3.currentNode = r$5, o;
  }
  v(t) {
    let i = 0;
    for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class R$3 {
  constructor(t, i, s, e) {
    var o;
    this.type = 2, this._$AH = A$3, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cp = null === (o = null == e ? void 0 : e.isConnected) || void 0 === o || o;
  }
  get _$AU() {
    var t, i;
    return null !== (i = null === (t = this._$AM) || void 0 === t ? void 0 : t._$AU) && void 0 !== i ? i : this._$Cp;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return void 0 !== i && 11 === (null == t ? void 0 : t.nodeType) && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = S$3(this, t, i), d$4(t) ? t === A$3 || null == t || "" === t ? (this._$AH !== A$3 && this._$AR(), this._$AH = A$3) : t !== this._$AH && t !== T$2 && this._(t) : void 0 !== t._$litType$ ? this.g(t) : void 0 !== t.nodeType ? this.$(t) : v$2(t) ? this.T(t) : this._(t);
  }
  k(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  $(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.k(t));
  }
  _(t) {
    this._$AH !== A$3 && d$4(this._$AH) ? this._$AA.nextSibling.data = t : this.$(r$5.createTextNode(t)), this._$AH = t;
  }
  g(t) {
    var i;
    const {
        values: s,
        _$litType$: e
      } = t,
      o = "number" == typeof e ? this._$AC(t) : (void 0 === e.el && (e.el = N$3.createElement(P$2(e.h, e.h[0]), this.options)), e);
    if ((null === (i = this._$AH) || void 0 === i ? void 0 : i._$AD) === o) this._$AH.v(s);else {
      const t = new M$3(o, this),
        i = t.u(this.options);
      t.v(s), this.$(i), this._$AH = t;
    }
  }
  _$AC(t) {
    let i = E$3.get(t.strings);
    return void 0 === i && E$3.set(t.strings, i = new N$3(t)), i;
  }
  T(t) {
    c$4(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s,
      e = 0;
    for (const o of t) e === i.length ? i.push(s = new R$3(this.k(u$4()), this.k(u$4()), this, this.options)) : s = i[e], s._$AI(o), e++;
    e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    var s;
    for (null === (s = this._$AP) || void 0 === s || s.call(this, !1, !0, i); t && t !== this._$AB;) {
      const i = t.nextSibling;
      t.remove(), t = i;
    }
  }
  setConnected(t) {
    var i;
    void 0 === this._$AM && (this._$Cp = t, null === (i = this._$AP) || void 0 === i || i.call(this, t));
  }
}
class k$3 {
  constructor(t, i, s, e, o) {
    this.type = 1, this._$AH = A$3, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = o, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = A$3;
  }
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t, i = this, s, e) {
    const o = this.strings;
    let n = !1;
    if (void 0 === o) t = S$3(this, t, i, 0), n = !d$4(t) || t !== this._$AH && t !== T$2, n && (this._$AH = t);else {
      const e = t;
      let l, h;
      for (t = o[0], l = 0; l < o.length - 1; l++) h = S$3(this, e[s + l], i, l), h === T$2 && (h = this._$AH[l]), n || (n = !d$4(h) || h !== this._$AH[l]), h === A$3 ? t = A$3 : t !== A$3 && (t += (null != h ? h : "") + o[l + 1]), this._$AH[l] = h;
    }
    n && !e && this.j(t);
  }
  j(t) {
    t === A$3 ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != t ? t : "");
  }
}
class H$3 extends k$3 {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === A$3 ? void 0 : t;
  }
}
const I$4 = s$7 ? s$7.emptyScript : "";
class L$3 extends k$3 {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    t && t !== A$3 ? this.element.setAttribute(this.name, I$4) : this.element.removeAttribute(this.name);
  }
}
class z$2 extends k$3 {
  constructor(t, i, s, e, o) {
    super(t, i, s, e, o), this.type = 5;
  }
  _$AI(t, i = this) {
    var s;
    if ((t = null !== (s = S$3(this, t, i, 0)) && void 0 !== s ? s : A$3) === T$2) return;
    const e = this._$AH,
      o = t === A$3 && e !== A$3 || t.capture !== e.capture || t.once !== e.once || t.passive !== e.passive,
      n = t !== A$3 && (e === A$3 || o);
    o && this.element.removeEventListener(this.name, this, e), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var i, s;
    "function" == typeof this._$AH ? this._$AH.call(null !== (s = null === (i = this.options) || void 0 === i ? void 0 : i.host) && void 0 !== s ? s : this.element, t) : this._$AH.handleEvent(t);
  }
}
class Z$2 {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S$3(this, t);
  }
}
const j$2 = {
    O: o$7,
    P: n$a,
    A: l$4,
    C: 1,
    M: V$3,
    L: M$3,
    R: v$2,
    D: S$3,
    I: R$3,
    V: k$3,
    H: L$3,
    N: z$2,
    U: H$3,
    F: Z$2
  },
  B$2 = i$8.litHtmlPolyfillSupport;
null == B$2 || B$2(N$3, R$3), (null !== (t$4 = i$8.litHtmlVersions) && void 0 !== t$4 ? t$4 : i$8.litHtmlVersions = []).push("2.8.0");

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$3 = window,
  e$8 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype,
  s$6 = Symbol(),
  n$9 = new WeakMap();
class o$6 {
  constructor(t, e, n) {
    if (this._$cssResult$ = !0, n !== s$6) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (e$8 && void 0 === t) {
      const e = void 0 !== s && 1 === s.length;
      e && (t = n$9.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && n$9.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
}
const r$4 = t => new o$6("string" == typeof t ? t : t + "", void 0, s$6),
  i$7 = (t, ...e) => {
    const n = 1 === t.length ? t[0] : e.reduce((e, s, n) => e + (t => {
      if (!0 === t._$cssResult$) return t.cssText;
      if ("number" == typeof t) return t;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s) + t[n + 1], t[0]);
    return new o$6(n, t, s$6);
  },
  S$2 = (s, n) => {
    e$8 ? s.adoptedStyleSheets = n.map(t => t instanceof CSSStyleSheet ? t : t.styleSheet) : n.forEach(e => {
      const n = document.createElement("style"),
        o = t$3.litNonce;
      void 0 !== o && n.setAttribute("nonce", o), n.textContent = e.cssText, s.appendChild(n);
    });
  },
  c$3 = e$8 ? t => t : t => t instanceof CSSStyleSheet ? (t => {
    let e = "";
    for (const s of t.cssRules) e += s.cssText;
    return r$4(e);
  })(t) : t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var s$5;
const e$7 = window,
  r$3 = e$7.trustedTypes,
  h$3 = r$3 ? r$3.emptyScript : "",
  o$5 = e$7.reactiveElementPolyfillSupport,
  n$8 = {
    toAttribute(t, i) {
      switch (i) {
        case Boolean:
          t = t ? h$3 : null;
          break;
        case Object:
        case Array:
          t = null == t ? t : JSON.stringify(t);
      }
      return t;
    },
    fromAttribute(t, i) {
      let s = t;
      switch (i) {
        case Boolean:
          s = null !== t;
          break;
        case Number:
          s = null === t ? null : Number(t);
          break;
        case Object:
        case Array:
          try {
            s = JSON.parse(t);
          } catch (t) {
            s = null;
          }
      }
      return s;
    }
  },
  a$4 = (t, i) => i !== t && (i == i || t == t),
  l$3 = {
    attribute: !0,
    type: String,
    converter: n$8,
    reflect: !1,
    hasChanged: a$4
  },
  d$3 = "finalized";
class u$3 extends HTMLElement {
  constructor() {
    super(), this._$Ei = new Map(), this.isUpdatePending = !1, this.hasUpdated = !1, this._$El = null, this._$Eu();
  }
  static addInitializer(t) {
    var i;
    this.finalize(), (null !== (i = this.h) && void 0 !== i ? i : this.h = []).push(t);
  }
  static get observedAttributes() {
    this.finalize();
    const t = [];
    return this.elementProperties.forEach((i, s) => {
      const e = this._$Ep(s, i);
      void 0 !== e && (this._$Ev.set(e, s), t.push(e));
    }), t;
  }
  static createProperty(t, i = l$3) {
    if (i.state && (i.attribute = !1), this.finalize(), this.elementProperties.set(t, i), !i.noAccessor && !this.prototype.hasOwnProperty(t)) {
      const s = "symbol" == typeof t ? Symbol() : "__" + t,
        e = this.getPropertyDescriptor(t, s, i);
      void 0 !== e && Object.defineProperty(this.prototype, t, e);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    return {
      get() {
        return this[i];
      },
      set(e) {
        const r = this[t];
        this[i] = e, this.requestUpdate(t, r, s);
      },
      configurable: !0,
      enumerable: !0
    };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) || l$3;
  }
  static finalize() {
    if (this.hasOwnProperty(d$3)) return !1;
    this[d$3] = !0;
    const t = Object.getPrototypeOf(this);
    if (t.finalize(), void 0 !== t.h && (this.h = [...t.h]), this.elementProperties = new Map(t.elementProperties), this._$Ev = new Map(), this.hasOwnProperty("properties")) {
      const t = this.properties,
        i = [...Object.getOwnPropertyNames(t), ...Object.getOwnPropertySymbols(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    return this.elementStyles = this.finalizeStyles(this.styles), !0;
  }
  static finalizeStyles(i) {
    const s = [];
    if (Array.isArray(i)) {
      const e = new Set(i.flat(1 / 0).reverse());
      for (const i of e) s.unshift(c$3(i));
    } else void 0 !== i && s.push(c$3(i));
    return s;
  }
  static _$Ep(t, i) {
    const s = i.attribute;
    return !1 === s ? void 0 : "string" == typeof s ? s : "string" == typeof t ? t.toLowerCase() : void 0;
  }
  _$Eu() {
    var t;
    this._$E_ = new Promise(t => this.enableUpdating = t), this._$AL = new Map(), this._$Eg(), this.requestUpdate(), null === (t = this.constructor.h) || void 0 === t || t.forEach(t => t(this));
  }
  addController(t) {
    var i, s;
    (null !== (i = this._$ES) && void 0 !== i ? i : this._$ES = []).push(t), void 0 !== this.renderRoot && this.isConnected && (null === (s = t.hostConnected) || void 0 === s || s.call(t));
  }
  removeController(t) {
    var i;
    null === (i = this._$ES) || void 0 === i || i.splice(this._$ES.indexOf(t) >>> 0, 1);
  }
  _$Eg() {
    this.constructor.elementProperties.forEach((t, i) => {
      this.hasOwnProperty(i) && (this._$Ei.set(i, this[i]), delete this[i]);
    });
  }
  createRenderRoot() {
    var t;
    const s = null !== (t = this.shadowRoot) && void 0 !== t ? t : this.attachShadow(this.constructor.shadowRootOptions);
    return S$2(s, this.constructor.elementStyles), s;
  }
  connectedCallback() {
    var t;
    void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), null === (t = this._$ES) || void 0 === t || t.forEach(t => {
      var i;
      return null === (i = t.hostConnected) || void 0 === i ? void 0 : i.call(t);
    });
  }
  enableUpdating(t) {}
  disconnectedCallback() {
    var t;
    null === (t = this._$ES) || void 0 === t || t.forEach(t => {
      var i;
      return null === (i = t.hostDisconnected) || void 0 === i ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(t, i, s) {
    this._$AK(t, s);
  }
  _$EO(t, i, s = l$3) {
    var e;
    const r = this.constructor._$Ep(t, s);
    if (void 0 !== r && !0 === s.reflect) {
      const h = (void 0 !== (null === (e = s.converter) || void 0 === e ? void 0 : e.toAttribute) ? s.converter : n$8).toAttribute(i, s.type);
      this._$El = t, null == h ? this.removeAttribute(r) : this.setAttribute(r, h), this._$El = null;
    }
  }
  _$AK(t, i) {
    var s;
    const e = this.constructor,
      r = e._$Ev.get(t);
    if (void 0 !== r && this._$El !== r) {
      const t = e.getPropertyOptions(r),
        h = "function" == typeof t.converter ? {
          fromAttribute: t.converter
        } : void 0 !== (null === (s = t.converter) || void 0 === s ? void 0 : s.fromAttribute) ? t.converter : n$8;
      this._$El = r, this[r] = h.fromAttribute(i, t.type), this._$El = null;
    }
  }
  requestUpdate(t, i, s) {
    let e = !0;
    void 0 !== t && (((s = s || this.constructor.getPropertyOptions(t)).hasChanged || a$4)(this[t], i) ? (this._$AL.has(t) || this._$AL.set(t, i), !0 === s.reflect && this._$El !== t && (void 0 === this._$EC && (this._$EC = new Map()), this._$EC.set(t, s))) : e = !1), !this.isUpdatePending && e && (this._$E_ = this._$Ej());
  }
  async _$Ej() {
    this.isUpdatePending = !0;
    try {
      await this._$E_;
    } catch (t) {
      Promise.reject(t);
    }
    const t = this.scheduleUpdate();
    return null != t && (await t), !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var t;
    if (!this.isUpdatePending) return;
    this.hasUpdated, this._$Ei && (this._$Ei.forEach((t, i) => this[i] = t), this._$Ei = void 0);
    let i = !1;
    const s = this._$AL;
    try {
      i = this.shouldUpdate(s), i ? (this.willUpdate(s), null === (t = this._$ES) || void 0 === t || t.forEach(t => {
        var i;
        return null === (i = t.hostUpdate) || void 0 === i ? void 0 : i.call(t);
      }), this.update(s)) : this._$Ek();
    } catch (t) {
      throw i = !1, this._$Ek(), t;
    }
    i && this._$AE(s);
  }
  willUpdate(t) {}
  _$AE(t) {
    var i;
    null === (i = this._$ES) || void 0 === i || i.forEach(t => {
      var i;
      return null === (i = t.hostUpdated) || void 0 === i ? void 0 : i.call(t);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$Ek() {
    this._$AL = new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$E_;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    void 0 !== this._$EC && (this._$EC.forEach((t, i) => this._$EO(i, this[i], t)), this._$EC = void 0), this._$Ek();
  }
  updated(t) {}
  firstUpdated(t) {}
}
u$3[d$3] = !0, u$3.elementProperties = new Map(), u$3.elementStyles = [], u$3.shadowRootOptions = {
  mode: "open"
}, null == o$5 || o$5({
  ReactiveElement: u$3
}), (null !== (s$5 = e$7.reactiveElementVersions) && void 0 !== s$5 ? s$5 : e$7.reactiveElementVersions = []).push("1.6.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var t$2;
const i$6 = window,
  s$4 = i$6.trustedTypes,
  e$6 = s$4 ? s$4.createPolicy("lit-html", {
    createHTML: t => t
  }) : void 0,
  o$4 = "$lit$",
  n$7 = `lit$${(Math.random() + "").slice(9)}$`,
  l$2 = "?" + n$7,
  h$2 = `<${l$2}>`,
  r$2 = document,
  u$2 = () => r$2.createComment(""),
  d$2 = t => null === t || "object" != typeof t && "function" != typeof t,
  c$2 = Array.isArray,
  v$1 = t => c$2(t) || "function" == typeof (null == t ? void 0 : t[Symbol.iterator]),
  a$3 = "[ \t\n\f\r]",
  f$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
  _$1 = /-->/g,
  m$2 = />/g,
  p = RegExp(`>|${a$3}(?:([^\\s"'>=/]+)(${a$3}*=${a$3}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"),
  g$2 = /'/g,
  $$2 = /"/g,
  y$2 = /^(?:script|style|textarea|title)$/i,
  w$1 = t => (i, ...s) => ({
    _$litType$: t,
    strings: i,
    values: s
  }),
  x$2 = w$1(1),
  T$1 = Symbol.for("lit-noChange"),
  A$2 = Symbol.for("lit-nothing"),
  E$2 = new WeakMap(),
  C$2 = r$2.createTreeWalker(r$2, 129, null, !1);
function P$1(t, i) {
  if (!Array.isArray(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e$6 ? e$6.createHTML(i) : i;
}
const V$2 = (t, i) => {
  const s = t.length - 1,
    e = [];
  let l,
    r = 2 === i ? "<svg>" : "",
    u = f$1;
  for (let i = 0; i < s; i++) {
    const s = t[i];
    let d,
      c,
      v = -1,
      a = 0;
    for (; a < s.length && (u.lastIndex = a, c = u.exec(s), null !== c);) a = u.lastIndex, u === f$1 ? "!--" === c[1] ? u = _$1 : void 0 !== c[1] ? u = m$2 : void 0 !== c[2] ? (y$2.test(c[2]) && (l = RegExp("</" + c[2], "g")), u = p) : void 0 !== c[3] && (u = p) : u === p ? ">" === c[0] ? (u = null != l ? l : f$1, v = -1) : void 0 === c[1] ? v = -2 : (v = u.lastIndex - c[2].length, d = c[1], u = void 0 === c[3] ? p : '"' === c[3] ? $$2 : g$2) : u === $$2 || u === g$2 ? u = p : u === _$1 || u === m$2 ? u = f$1 : (u = p, l = void 0);
    const w = u === p && t[i + 1].startsWith("/>") ? " " : "";
    r += u === f$1 ? s + h$2 : v >= 0 ? (e.push(d), s.slice(0, v) + o$4 + s.slice(v) + n$7 + w) : s + n$7 + (-2 === v ? (e.push(void 0), i) : w);
  }
  return [P$1(t, r + (t[s] || "<?>") + (2 === i ? "</svg>" : "")), e];
};
class N$2 {
  constructor({
    strings: t,
    _$litType$: i
  }, e) {
    let h;
    this.parts = [];
    let r = 0,
      d = 0;
    const c = t.length - 1,
      v = this.parts,
      [a, f] = V$2(t, i);
    if (this.el = N$2.createElement(a, e), C$2.currentNode = this.el.content, 2 === i) {
      const t = this.el.content,
        i = t.firstChild;
      i.remove(), t.append(...i.childNodes);
    }
    for (; null !== (h = C$2.nextNode()) && v.length < c;) {
      if (1 === h.nodeType) {
        if (h.hasAttributes()) {
          const t = [];
          for (const i of h.getAttributeNames()) if (i.endsWith(o$4) || i.startsWith(n$7)) {
            const s = f[d++];
            if (t.push(i), void 0 !== s) {
              const t = h.getAttribute(s.toLowerCase() + o$4).split(n$7),
                i = /([.?@])?(.*)/.exec(s);
              v.push({
                type: 1,
                index: r,
                name: i[2],
                strings: t,
                ctor: "." === i[1] ? H$2 : "?" === i[1] ? L$2 : "@" === i[1] ? z$1 : k$2
              });
            } else v.push({
              type: 6,
              index: r
            });
          }
          for (const i of t) h.removeAttribute(i);
        }
        if (y$2.test(h.tagName)) {
          const t = h.textContent.split(n$7),
            i = t.length - 1;
          if (i > 0) {
            h.textContent = s$4 ? s$4.emptyScript : "";
            for (let s = 0; s < i; s++) h.append(t[s], u$2()), C$2.nextNode(), v.push({
              type: 2,
              index: ++r
            });
            h.append(t[i], u$2());
          }
        }
      } else if (8 === h.nodeType) if (h.data === l$2) v.push({
        type: 2,
        index: r
      });else {
        let t = -1;
        for (; -1 !== (t = h.data.indexOf(n$7, t + 1));) v.push({
          type: 7,
          index: r
        }), t += n$7.length - 1;
      }
      r++;
    }
  }
  static createElement(t, i) {
    const s = r$2.createElement("template");
    return s.innerHTML = t, s;
  }
}
function S$1(t, i, s = t, e) {
  var o, n, l, h;
  if (i === T$1) return i;
  let r = void 0 !== e ? null === (o = s._$Co) || void 0 === o ? void 0 : o[e] : s._$Cl;
  const u = d$2(i) ? void 0 : i._$litDirective$;
  return (null == r ? void 0 : r.constructor) !== u && (null === (n = null == r ? void 0 : r._$AO) || void 0 === n || n.call(r, !1), void 0 === u ? r = void 0 : (r = new u(t), r._$AT(t, s, e)), void 0 !== e ? (null !== (l = (h = s)._$Co) && void 0 !== l ? l : h._$Co = [])[e] = r : s._$Cl = r), void 0 !== r && (i = S$1(t, r._$AS(t, i.values), r, e)), i;
}
class M$2 {
  constructor(t, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    var i;
    const {
        el: {
          content: s
        },
        parts: e
      } = this._$AD,
      o = (null !== (i = null == t ? void 0 : t.creationScope) && void 0 !== i ? i : r$2).importNode(s, !0);
    C$2.currentNode = o;
    let n = C$2.nextNode(),
      l = 0,
      h = 0,
      u = e[0];
    for (; void 0 !== u;) {
      if (l === u.index) {
        let i;
        2 === u.type ? i = new R$2(n, n.nextSibling, this, t) : 1 === u.type ? i = new u.ctor(n, u.name, u.strings, this, t) : 6 === u.type && (i = new Z$1(n, this, t)), this._$AV.push(i), u = e[++h];
      }
      l !== (null == u ? void 0 : u.index) && (n = C$2.nextNode(), l++);
    }
    return C$2.currentNode = r$2, o;
  }
  v(t) {
    let i = 0;
    for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class R$2 {
  constructor(t, i, s, e) {
    var o;
    this.type = 2, this._$AH = A$2, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cp = null === (o = null == e ? void 0 : e.isConnected) || void 0 === o || o;
  }
  get _$AU() {
    var t, i;
    return null !== (i = null === (t = this._$AM) || void 0 === t ? void 0 : t._$AU) && void 0 !== i ? i : this._$Cp;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return void 0 !== i && 11 === (null == t ? void 0 : t.nodeType) && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = S$1(this, t, i), d$2(t) ? t === A$2 || null == t || "" === t ? (this._$AH !== A$2 && this._$AR(), this._$AH = A$2) : t !== this._$AH && t !== T$1 && this._(t) : void 0 !== t._$litType$ ? this.g(t) : void 0 !== t.nodeType ? this.$(t) : v$1(t) ? this.T(t) : this._(t);
  }
  k(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  $(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.k(t));
  }
  _(t) {
    this._$AH !== A$2 && d$2(this._$AH) ? this._$AA.nextSibling.data = t : this.$(r$2.createTextNode(t)), this._$AH = t;
  }
  g(t) {
    var i;
    const {
        values: s,
        _$litType$: e
      } = t,
      o = "number" == typeof e ? this._$AC(t) : (void 0 === e.el && (e.el = N$2.createElement(P$1(e.h, e.h[0]), this.options)), e);
    if ((null === (i = this._$AH) || void 0 === i ? void 0 : i._$AD) === o) this._$AH.v(s);else {
      const t = new M$2(o, this),
        i = t.u(this.options);
      t.v(s), this.$(i), this._$AH = t;
    }
  }
  _$AC(t) {
    let i = E$2.get(t.strings);
    return void 0 === i && E$2.set(t.strings, i = new N$2(t)), i;
  }
  T(t) {
    c$2(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s,
      e = 0;
    for (const o of t) e === i.length ? i.push(s = new R$2(this.k(u$2()), this.k(u$2()), this, this.options)) : s = i[e], s._$AI(o), e++;
    e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    var s;
    for (null === (s = this._$AP) || void 0 === s || s.call(this, !1, !0, i); t && t !== this._$AB;) {
      const i = t.nextSibling;
      t.remove(), t = i;
    }
  }
  setConnected(t) {
    var i;
    void 0 === this._$AM && (this._$Cp = t, null === (i = this._$AP) || void 0 === i || i.call(this, t));
  }
}
class k$2 {
  constructor(t, i, s, e, o) {
    this.type = 1, this._$AH = A$2, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = o, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = A$2;
  }
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t, i = this, s, e) {
    const o = this.strings;
    let n = !1;
    if (void 0 === o) t = S$1(this, t, i, 0), n = !d$2(t) || t !== this._$AH && t !== T$1, n && (this._$AH = t);else {
      const e = t;
      let l, h;
      for (t = o[0], l = 0; l < o.length - 1; l++) h = S$1(this, e[s + l], i, l), h === T$1 && (h = this._$AH[l]), n || (n = !d$2(h) || h !== this._$AH[l]), h === A$2 ? t = A$2 : t !== A$2 && (t += (null != h ? h : "") + o[l + 1]), this._$AH[l] = h;
    }
    n && !e && this.j(t);
  }
  j(t) {
    t === A$2 ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != t ? t : "");
  }
}
class H$2 extends k$2 {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === A$2 ? void 0 : t;
  }
}
const I$3 = s$4 ? s$4.emptyScript : "";
class L$2 extends k$2 {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    t && t !== A$2 ? this.element.setAttribute(this.name, I$3) : this.element.removeAttribute(this.name);
  }
}
class z$1 extends k$2 {
  constructor(t, i, s, e, o) {
    super(t, i, s, e, o), this.type = 5;
  }
  _$AI(t, i = this) {
    var s;
    if ((t = null !== (s = S$1(this, t, i, 0)) && void 0 !== s ? s : A$2) === T$1) return;
    const e = this._$AH,
      o = t === A$2 && e !== A$2 || t.capture !== e.capture || t.once !== e.once || t.passive !== e.passive,
      n = t !== A$2 && (e === A$2 || o);
    o && this.element.removeEventListener(this.name, this, e), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var i, s;
    "function" == typeof this._$AH ? this._$AH.call(null !== (s = null === (i = this.options) || void 0 === i ? void 0 : i.host) && void 0 !== s ? s : this.element, t) : this._$AH.handleEvent(t);
  }
}
class Z$1 {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S$1(this, t);
  }
}
const B$1 = i$6.litHtmlPolyfillSupport;
null == B$1 || B$1(N$2, R$2), (null !== (t$2 = i$6.litHtmlVersions) && void 0 !== t$2 ? t$2 : i$6.litHtmlVersions = []).push("2.8.0");
const D$1 = (t, i, s) => {
  var e, o;
  const n = null !== (e = null == s ? void 0 : s.renderBefore) && void 0 !== e ? e : i;
  let l = n._$litPart$;
  if (void 0 === l) {
    const t = null !== (o = null == s ? void 0 : s.renderBefore) && void 0 !== o ? o : null;
    n._$litPart$ = l = new R$2(i.insertBefore(u$2(), t), t, void 0, null != s ? s : {});
  }
  return l._$AI(t), l;
};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var l$1, o$3;
class s$3 extends u$3 {
  constructor() {
    super(...arguments), this.renderOptions = {
      host: this
    }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t, e;
    const i = super.createRenderRoot();
    return null !== (t = (e = this.renderOptions).renderBefore) && void 0 !== t || (e.renderBefore = i.firstChild), i;
  }
  update(t) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D$1(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), null === (t = this._$Do) || void 0 === t || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), null === (t = this._$Do) || void 0 === t || t.setConnected(!1);
  }
  render() {
    return T$1;
  }
}
s$3.finalized = !0, s$3._$litElement$ = !0, null === (l$1 = globalThis.litElementHydrateSupport) || void 0 === l$1 || l$1.call(globalThis, {
  LitElement: s$3
});
const n$6 = globalThis.litElementPolyfillSupport;
null == n$6 || n$6({
  LitElement: s$3
});
(null !== (o$3 = globalThis.litElementVersions) && void 0 !== o$3 ? o$3 : globalThis.litElementVersions = []).push("3.3.3");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$5 = e => n => "function" == typeof n ? ((e, n) => (customElements.define(e, n), n))(e, n) : ((e, n) => {
  const {
    kind: t,
    elements: s
  } = n;
  return {
    kind: t,
    elements: s,
    finisher(n) {
      customElements.define(e, n);
    }
  };
})(e, n);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const i$5 = (i, e) => "method" === e.kind && e.descriptor && !("value" in e.descriptor) ? {
    ...e,
    finisher(n) {
      n.createProperty(e.key, i);
    }
  } : {
    kind: "field",
    key: Symbol(),
    placement: "own",
    descriptor: {},
    originalKey: e.key,
    initializer() {
      "function" == typeof e.initializer && (this[e.key] = e.initializer.call(this));
    },
    finisher(n) {
      n.createProperty(e.key, i);
    }
  },
  e$4 = (i, e, n) => {
    e.constructor.createProperty(n, i);
  };
function n$5(n) {
  return (t, o) => void 0 !== o ? e$4(n, t, o) : i$5(n, t);
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var n$4;
null != (null === (n$4 = window.HTMLSlotElement) || void 0 === n$4 ? void 0 : n$4.prototype.assignedElements) ? (o, n) => o.assignedElements(n) : (o, n) => o.assignedNodes(n).filter(o => o.nodeType === Node.ELEMENT_NODE);

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class s$2 extends Event {
  constructor(s, t, e) {
    super("context-request", {
      bubbles: !0,
      composed: !0
    }), this.context = s, this.callback = t, this.subscribe = e ?? !1;
  }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function n$3(n) {
  return n;
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class s$1 {
  get value() {
    return this.o;
  }
  set value(s) {
    this.setValue(s);
  }
  setValue(s, t = !1) {
    const i = t || !Object.is(s, this.o);
    this.o = s, i && this.updateObservers();
  }
  constructor(s) {
    this.subscriptions = new Map(), this.updateObservers = () => {
      for (const [s, {
        disposer: t
      }] of this.subscriptions) s(this.o, t);
    }, void 0 !== s && (this.value = s);
  }
  addCallback(s, t, i) {
    if (!i) return void s(this.value);
    this.subscriptions.has(s) || this.subscriptions.set(s, {
      disposer: () => {
        this.subscriptions.delete(s);
      },
      consumerHost: t
    });
    const {
      disposer: h
    } = this.subscriptions.get(s);
    s(this.value, h);
  }
  clearCallbacks() {
    this.subscriptions.clear();
  }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class e$3 extends Event {
  constructor(t) {
    super("context-provider", {
      bubbles: !0,
      composed: !0
    }), this.context = t;
  }
}
class i$4 extends s$1 {
  constructor(s, e, i) {
    super(void 0 !== e.context ? e.initialValue : i), this.onContextRequest = t => {
      const s = t.composedPath()[0];
      t.context === this.context && s !== this.host && (t.stopPropagation(), this.addCallback(t.callback, s, t.subscribe));
    }, this.onProviderRequest = s => {
      const e = s.composedPath()[0];
      if (s.context !== this.context || e === this.host) return;
      const i = new Set();
      for (const [s, {
        consumerHost: e
      }] of this.subscriptions) i.has(s) || (i.add(s), e.dispatchEvent(new s$2(this.context, s, !0)));
      s.stopPropagation();
    }, this.host = s, void 0 !== e.context ? this.context = e.context : this.context = e, this.attachListeners(), this.host.addController?.(this);
  }
  attachListeners() {
    this.host.addEventListener("context-request", this.onContextRequest), this.host.addEventListener("context-provider", this.onProviderRequest);
  }
  hostConnected() {
    this.host.dispatchEvent(new e$3(this.context));
  }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function e$2({
  context: e
}) {
  return (n, i) => {
    const o = new WeakMap();
    if ("object" == typeof i) return i.addInitializer(function () {
      o.set(this, new i$4(this, {
        context: e
      }));
    }), {
      get() {
        return n.get.call(this);
      },
      set(t) {
        return o.get(this)?.setValue(t), n.set.call(this, t);
      },
      init(t) {
        return o.get(this)?.setValue(t), t;
      }
    };
    {
      n.constructor.addInitializer(n => {
        o.set(n, new i$4(n, {
          context: e
        }));
      });
      const r = Object.getOwnPropertyDescriptor(n, i);
      let s;
      if (void 0 === r) {
        const t = new WeakMap();
        s = {
          get: function () {
            return t.get(this);
          },
          set: function (e) {
            o.get(this).setValue(e), t.set(this, e);
          },
          configurable: !0,
          enumerable: !0
        };
      } else {
        const t = r.set;
        s = {
          ...r,
          set: function (e) {
            o.get(this).setValue(e), t?.call(this, e);
          }
        };
      }
      return void Object.defineProperty(n, i, s);
    }
  };
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1 = {
    ATTRIBUTE: 1,
    CHILD: 2,
    PROPERTY: 3,
    BOOLEAN_ATTRIBUTE: 4,
    EVENT: 5,
    ELEMENT: 6
  },
  e$1 = t => (...e) => ({
    _$litDirective$: t,
    values: e
  });
class i$3 {
  constructor(t) {}
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const o$2 = e$1(class extends i$3 {
  constructor(t) {
    var i;
    if (super(t), t.type !== t$1.ATTRIBUTE || "class" !== t.name || (null === (i = t.strings) || void 0 === i ? void 0 : i.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(t) {
    return " " + Object.keys(t).filter(i => t[i]).join(" ") + " ";
  }
  update(i, [s]) {
    var r, o;
    if (void 0 === this.it) {
      this.it = new Set(), void 0 !== i.strings && (this.nt = new Set(i.strings.join(" ").split(/\s/).filter(t => "" !== t)));
      for (const t in s) s[t] && !(null === (r = this.nt) || void 0 === r ? void 0 : r.has(t)) && this.it.add(t);
      return this.render(s);
    }
    const e = i.element.classList;
    this.it.forEach(t => {
      t in s || (e.remove(t), this.it.delete(t));
    });
    for (const t in s) {
      const i = !!s[t];
      i === this.it.has(t) || (null === (o = this.nt) || void 0 === o ? void 0 : o.has(t)) || (i ? (e.add(t), this.it.add(t)) : (e.remove(t), this.it.delete(t)));
    }
    return T$2;
  }
});

function n$2 (t, e, l, n, r) {
  for (e = e.split ? e.split(".") : e, n = 0; n < e.length; n++) t = t ? t[e[n]] : r;
  return t === r ? l : t;
}

var e = "undefined",
  o$1 = "object",
  b$3 = "any",
  m$1 = "*",
  j$1 = "__",
  F$2 = "undefined" != typeof process ? process : {};
  F$2.env && F$2.env.NODE_ENV || "";
  var $$1 = "undefined" != typeof document;
  null != F$2.versions && null != F$2.versions.node;
  "undefined" != typeof Deno && void 0 !== Deno.core;
  $$1 && "nodejs" === window.name || "undefined" != typeof navigator && void 0 !== navigator.userAgent && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
function M$1(n, t) {
  return t.charAt(0)[n]() + t.slice(1);
}
var U$1 = M$1.bind(null, "toUpperCase"),
  H$1 = M$1.bind(null, "toLowerCase");
function J$2(n) {
  return Y$1(n) ? U$1("null") : "object" == typeof n ? yn(n) : Object.prototype.toString.call(n).slice(8, -1);
}
function R$1(n, t) {
  void 0 === t && (t = !0);
  var e = J$2(n);
  return t ? H$1(e) : e;
}
function V$1(n, t) {
  return typeof t === n;
}
var W$1 = V$1.bind(null, "function"),
  q$1 = V$1.bind(null, "string"),
  I$2 = V$1.bind(null, "undefined");
var Q$1 = V$1.bind(null, "boolean");
  V$1.bind(null, "symbol");
function Y$1(n) {
  return null === n;
}
function nn(n) {
  return "number" === R$1(n) && !isNaN(n);
}
function rn(n) {
  return "array" === R$1(n);
}
function on(n) {
  if (!un(n)) return !1;
  for (var t = n; null !== Object.getPrototypeOf(t);) t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(n) === t;
}
function un(n) {
  return n && ("object" == typeof n || null !== n);
}
function yn(n) {
  return W$1(n.constructor) ? n.constructor.name : null;
}
function hn(n) {
  return n instanceof Error || q$1(n.message) && n.constructor && nn(n.constructor.stackTraceLimit);
}
function On(n, t) {
  if ("object" != typeof t || Y$1(t)) return !1;
  if (t instanceof n) return !0;
  var e = R$1(new n(""));
  if (hn(t)) for (; t;) {
    if (R$1(t) === e) return !0;
    t = Object.getPrototypeOf(t);
  }
  return !1;
}
On.bind(null, TypeError);
  On.bind(null, SyntaxError);
function $n(n, t) {
  var e = n instanceof Element || n instanceof HTMLDocument;
  return e && t ? Tn(n, t) : e;
}
function Tn(n, t) {
  return void 0 === t && (t = ""), n && n.nodeName === t.toUpperCase();
}
function _n(n) {
  var t = [].slice.call(arguments, 1);
  return function () {
    return n.apply(void 0, [].slice.call(arguments).concat(t));
  };
}
_n($n, "form");
  _n($n, "button");
  _n($n, "input");
  _n($n, "select");

function n$1(e) {
  try {
    return decodeURIComponent(e.replace(/\+/g, " "));
  } catch (e) {
    return null;
  }
}
function s(r) {
  return function (e) {
    for (var r, t = Object.create(null), o = /([^&=]+)=?([^&]*)/g; r = o.exec(e);) {
      var a = n$1(r[1]),
        i = n$1(r[2]);
      "[]" === a.substring(a.length - 2) ? (t[a = a.substring(0, a.length - 2)] || (t[a] = [])).push(i) : t[a] = "" === i || i;
    }
    for (var u in t) {
      var c = u.split("[");
      c.length > 1 && (m(t, c.map(function (e) {
        return e.replace(/[?[\]\\ ]/g, "");
      }), t[u]), delete t[u]);
    }
    return t;
  }(function (r) {
    if (r) {
      var t = r.match(/\?(.*)/);
      return t && t[1] ? t[1].split("#")[0] : "";
    }
    return $$1 && window.location.search.substring(1);
  }(r));
}
function m(e, r, t) {
  for (var n = r.length - 1, o = 0; o < n; ++o) {
    var a = r[o];
    if ("__proto__" === a || "constructor" === a) break;
    a in e || (e[a] = {}), e = e[a];
  }
  e[r[n]] = t;
}
function y$1() {
  for (var e = "", r = 0, t = 4294967295 * Math.random() | 0; r++ < 36;) {
    var n = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"[r - 1],
      o = 15 & t;
    e += "-" == n || "4" == n ? n : ("x" == n ? o : 3 & o | 8).toString(16), t = r % 8 == 0 ? 4294967295 * Math.random() | 0 : t >> 4;
  }
  return e;
}

var l = "global",
  o = j$1 + "global" + j$1,
  n = typeof self === o$1 && self.self === self && self || typeof global === o$1 && global.global === global && global || void 0;
function a$2(t) {
  return n[o][t];
}
function f(t, e) {
  return n[o][t] = e;
}
function i$2(t) {
  delete n[o][t];
}
function u$1(t, e, r) {
  var l;
  try {
    if (b$2(t)) {
      var o = window[t];
      l = o[e].bind(o);
    }
  } catch (t) {}
  return l || r;
}
n[o] || (n[o] = {});
var c$1 = {};
function b$2(t) {
  if (typeof c$1[t] !== e) return c$1[t];
  try {
    var e$1 = window[t];
    e$1.setItem(e, e), e$1.removeItem(e);
  } catch (e) {
    return c$1[t] = !1;
  }
  return c$1[t] = !0;
}

function g$1() {
  return g$1 = Object.assign || function (e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, g$1.apply(this, arguments);
}
var h$1 = "function",
  v = "undefined",
  y = "@@redux/" + Math.random().toString(36),
  b$1 = /* #__PURE__ */function () {
    return typeof Symbol === h$1 && Symbol.observable || "@@observable";
  }(),
  I$1 = " != " + h$1;
function w(e, t, n) {
  var r;
  if (typeof t === h$1 && typeof n === v && (n = t, t = void 0), typeof n !== v) {
    if (typeof n !== h$1) throw new Error("enhancer" + I$1);
    return n(w)(e, t);
  }
  if (typeof e !== h$1) throw new Error("reducer" + I$1);
  var i = e,
    a = t,
    o = [],
    u = o,
    s = !1;
  function l() {
    u === o && (u = o.slice());
  }
  function f() {
    return a;
  }
  function d(e) {
    if (typeof e !== h$1) throw new Error("Listener" + I$1);
    var t = !0;
    return l(), u.push(e), function () {
      if (t) {
        t = !1, l();
        var n = u.indexOf(e);
        u.splice(n, 1);
      }
    };
  }
  function p(e) {
    if (!on(e)) throw new Error("Act != obj");
    if (typeof e.type === v) throw new Error("ActType " + v);
    if (s) throw new Error("Dispatch in reducer");
    try {
      s = !0, a = i(a, e);
    } finally {
      s = !1;
    }
    for (var t = o = u, n = 0; n < t.length; n++) (0, t[n])();
    return e;
  }
  return p({
    type: "@@redux/INIT"
  }), (r = {
    dispatch: p,
    subscribe: d,
    getState: f,
    replaceReducer: function (e) {
      if (typeof e !== h$1) throw new Error("next reducer" + I$1);
      i = e, p({
        type: "@@redux/INIT"
      });
    }
  })[b$1] = function () {
    var e,
      t = d;
    return (e = {
      subscribe: function (e) {
        if ("object" != typeof e) throw new TypeError("Observer != obj");
        function n() {
          e.next && e.next(f());
        }
        return n(), {
          unsubscribe: t(n)
        };
      }
    })[b$1] = function () {
      return this;
    }, e;
  }, r;
}
function E$1(e, t) {
  var n = t && t.type;
  return "action " + (n && n.toString() || "?") + "reducer " + e + " returns " + v;
}
function P() {
  var e = [].slice.call(arguments);
  return 0 === e.length ? function (e) {
    return e;
  } : 1 === e.length ? e[0] : e.reduce(function (e, t) {
    return function () {
      return e(t.apply(void 0, [].slice.call(arguments)));
    };
  });
}
function S() {
  var e = arguments;
  return function (t) {
    return function (n, r, i) {
      var a,
        o = t(n, r, i),
        u = o.dispatch,
        c = {
          getState: o.getState,
          dispatch: function (e) {
            return u(e);
          }
        };
      return a = [].slice.call(e).map(function (e) {
        return e(c);
      }), g$1({}, o, {
        dispatch: u = P.apply(void 0, a)(o.dispatch)
      });
    };
  };
}
var N$1 = j$1 + "anon_id",
  A$1 = j$1 + "user_id",
  _ = j$1 + "user_traits",
  j = "userId",
  k$1 = "anonymousId",
  x$1 = ["bootstrap", "params", "campaign", "initializeStart", "initialize", "initializeEnd", "ready", "resetStart", "reset", "resetEnd", "pageStart", "page", "pageEnd", "pageAborted", "trackStart", "track", "trackEnd", "trackAborted", "identifyStart", "identify", "identifyEnd", "identifyAborted", "userIdChanged", "registerPlugins", "enablePlugin", "disablePlugin", "online", "offline", "setItemStart", "setItem", "setItemEnd", "setItemAborted", "removeItemStart", "removeItem", "removeItemEnd", "removeItemAborted"],
  T = ["name", "EVENTS", "config", "loaded"],
  z = x$1.reduce(function (e, t) {
    return e[t] = t, e;
  }, {
    registerPluginType: function (e) {
      return "registerPlugin:" + e;
    },
    pluginReadyType: function (e) {
      return "ready:" + e;
    }
  }),
  M = /^utm_/,
  q = /^an_prop_/,
  V = /^an_trait_/;
function C$1(e) {
  var t = e.storage.setItem;
  return function (n) {
    return function (r) {
      return function (i) {
        if (i.type === z.bootstrap) {
          var a = i.params,
            o = i.user,
            u = i.persistedUser,
            c = i.initialUser,
            s = u.userId === o.userId;
          u.anonymousId !== o.anonymousId && t(N$1, o.anonymousId), s || t(A$1, o.userId), c.traits && t(_, g$1({}, s && u.traits ? u.traits : {}, c.traits));
          var l = Object.keys(i.params);
          if (l.length) {
            var f = a.an_uid,
              d = a.an_event,
              p = l.reduce(function (e, t) {
                if (t.match(M) || t.match(/^(d|g)clid/)) {
                  var n = t.replace(M, "");
                  e.campaign["campaign" === n ? "name" : n] = a[t];
                }
                return t.match(q) && (e.props[t.replace(q, "")] = a[t]), t.match(V) && (e.traits[t.replace(V, "")] = a[t]), e;
              }, {
                campaign: {},
                props: {},
                traits: {}
              });
            n.dispatch(g$1({
              type: z.params,
              raw: a
            }, p, f ? {
              userId: f
            } : {})), f && setTimeout(function () {
              return e.identify(f, p.traits);
            }, 0), d && setTimeout(function () {
              return e.track(d, p.props);
            }, 0), Object.keys(p.campaign).length && n.dispatch({
              type: z.campaign,
              campaign: p.campaign
            });
          }
        }
        return r(i);
      };
    };
  };
}
function U(e) {
  return function (t, n) {
    if (void 0 === t && (t = {}), void 0 === n && (n = {}), n.type === z.setItemEnd) {
      if (n.key === N$1) return g$1({}, t, {
        anonymousId: n.value
      });
      if (n.key === A$1) return g$1({}, t, {
        userId: n.value
      });
    }
    switch (n.type) {
      case z.identify:
        return Object.assign({}, t, {
          userId: n.userId,
          traits: g$1({}, t.traits, n.traits)
        });
      case z.reset:
        return [A$1, N$1, _].forEach(function (t) {
          e.removeItem(t);
        }), Object.assign({}, t, {
          userId: null,
          anonymousId: null,
          traits: {}
        });
      default:
        return t;
    }
  };
}
function R(e) {
  return {
    userId: e.getItem(A$1),
    anonymousId: e.getItem(N$1),
    traits: e.getItem(_)
  };
}
var $ = function (e) {
  return j$1 + "TEMP" + j$1 + e;
};
function D(t) {
  var n = t.storage,
    r = n.setItem,
    a = n.removeItem,
    o = n.getItem;
  return function (t) {
    return function (n) {
      return function (u) {
        var c = u.userId,
          s = u.traits,
          l = u.options;
        if (u.type === z.reset && ([A$1, _, N$1].forEach(function (e) {
          a(e);
        }), [j, k$1, "traits"].forEach(function (e) {
          i$2($(e));
        })), u.type === z.identify) {
          o(N$1) || r(N$1, y$1());
          var f = o(A$1),
            d = o(_) || {};
          f && f !== c && t.dispatch({
            type: z.userIdChanged,
            old: {
              userId: f,
              traits: d
            },
            new: {
              userId: c,
              traits: s
            },
            options: l
          }), c && r(A$1, c), s && r(_, g$1({}, d, s));
        }
        return n(u);
      };
    };
  };
}
var B = {};
function L$1(e, t) {
  B[e] && W$1(B[e]) && (B[e](t), delete B[e]);
}
function J$1(e, t, n) {
  return new Promise(function (r, i) {
    return t() ? r(e) : n < 1 ? i(g$1({}, e, {
      queue: !0
    })) : new Promise(function (e) {
      return setTimeout(e, 10);
    }).then(function (a) {
      return J$1(e, t, n - 10).then(r, i);
    });
  });
}
var X = function (e) {
    var t = e.data,
      n = e.action,
      r = e.instance,
      i = e.state,
      a = e.allPlugins,
      o = e.allMatches,
      u = e.store,
      s = e.EVENTS;
    try {
      var f = i.plugins,
        d = i.context,
        p = n.type,
        m = p.match(H),
        h = t.exact.map(function (e) {
          return e.pluginName;
        });
      m && (h = o.during.map(function (e) {
        return e.pluginName;
      }));
      var v = function (e, t) {
          return function (n, r, i) {
            var a = r.config,
              o = r.name,
              u = o + "." + n.type;
            i && (u = i.event);
            var c = n.type.match(H) ? function (e, t, n, r, i) {
              return function (a, o) {
                var u = r ? r.name : e,
                  c = o && te(o) ? o : n;
                if (r && (!(c = o && te(o) ? o : [e]).includes(e) || 1 !== c.length)) throw new Error("Method " + t + " can only abort " + e + " plugin. " + JSON.stringify(c) + " input valid");
                return g$1({}, i, {
                  abort: {
                    reason: a,
                    plugins: c,
                    caller: t,
                    _: u
                  }
                });
              };
            }(o, u, t, i, n) : function (e, t) {
              return function () {
                throw new Error(e.type + " action not cancellable. Remove abort in " + t);
              };
            }(n, u);
            return {
              payload: ie(n),
              instance: e,
              config: a || {},
              abort: c
            };
          };
        }(r, h),
        y = t.exact.reduce(function (e, t) {
          var n = t.pluginName,
            r = t.methodName,
            i = !1;
          return r.match(/^initialize/) || r.match(/^reset/) || (i = !f[n].loaded), d.offline && r.match(/^(page|track|identify)/) && (i = !0), e["" + n] = i, e;
        }, {});
      return Promise.resolve(t.exact.reduce(function (e, i, o) {
        try {
          var u = i.pluginName;
          return Promise.resolve(e).then(function (e) {
            function i() {
              return Promise.resolve(e);
            }
            var o = function () {
              if (t.namespaced && t.namespaced[u]) return Promise.resolve(t.namespaced[u].reduce(function (e, t, n) {
                try {
                  return Promise.resolve(e).then(function (e) {
                    return t.method && W$1(t.method) ? (function (e, t) {
                      var n = re(e);
                      if (n && n.name === t) {
                        var r = re(n.method);
                        throw new Error([t + " plugin is calling method " + e, "Plugins cant call self", "Use " + n.method + " " + (r ? "or " + r.method : "") + " in " + t + " plugin insteadof " + e].join("\n"));
                      }
                    }(t.methodName, t.pluginName), Promise.resolve(t.method({
                      payload: e,
                      instance: r,
                      abort: (n = e, i = u, o = t.pluginName, function (e, t) {
                        return g$1({}, n, {
                          abort: {
                            reason: e,
                            plugins: t || [i],
                            caller: p,
                            from: o || i
                          }
                        });
                      }),
                      config: K(t.pluginName, f, a),
                      plugins: f
                    })).then(function (t) {
                      var n = on(t) ? t : {};
                      return Promise.resolve(g$1({}, e, n));
                    })) : e;
                    var n, i, o;
                  });
                } catch (e) {
                  return Promise.reject(e);
                }
              }, Promise.resolve(n))).then(function (t) {
                e[u] = t;
              });
              e[u] = n;
            }();
            return o && o.then ? o.then(i) : i();
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }, Promise.resolve({}))).then(function (e) {
        return Promise.resolve(t.exact.reduce(function (n, i, o) {
          try {
            var s = t.exact.length === o + 1,
              l = i.pluginName,
              d = a[l];
            return Promise.resolve(n).then(function (t) {
              var n = e[l] ? e[l] : {};
              if (m && (n = t), Z(n, l)) return G$1({
                data: n,
                method: p,
                instance: r,
                pluginName: l,
                store: u
              }), Promise.resolve(t);
              if (Z(t, l)) return s && G$1({
                data: t,
                method: p,
                instance: r,
                store: u
              }), Promise.resolve(t);
              if (y.hasOwnProperty(l) && !0 === y[l]) return u.dispatch({
                type: "queue",
                plugin: l,
                payload: n,
                _: {
                  called: "queue",
                  from: "queueMechanism"
                }
              }), Promise.resolve(t);
              var i = v(e[l], a[l]);
              return Promise.resolve(d[p]({
                abort: i.abort,
                payload: n,
                instance: r,
                config: K(l, f, a),
                plugins: f
              })).then(function (i) {
                var a = on(i) ? i : {},
                  o = g$1({}, t, a),
                  s = e[l];
                if (Z(s, l)) G$1({
                  data: s,
                  method: p,
                  instance: r,
                  pluginName: l,
                  store: u
                });else {
                  var f = p + ":" + l;
                  (f.match(/:/g) || []).length < 2 && !p.match(W) && !p.match(F$1) && r.dispatch(g$1({}, m ? o : n, {
                    type: f,
                    _: {
                      called: f,
                      from: "submethod"
                    }
                  }));
                }
                return Promise.resolve(o);
              });
            });
          } catch (e) {
            return Promise.reject(e);
          }
        }, Promise.resolve(n))).then(function (e) {
          if (!(p.match(H) || p.match(/^registerPlugin/) || p.match(F$1) || p.match(W) || p.match(/^params/) || p.match(/^userIdChanged/))) {
            if (s.plugins.includes(p), e._ && e._.originalAction === p) return e;
            var n = g$1({}, e, {
              _: {
                originalAction: e.type,
                called: e.type,
                from: "engineEnd"
              }
            });
            ee(e, t.exact.length) && !p.match(/End$/) && (n = g$1({}, n, {
              type: e.type + "Aborted"
            })), u.dispatch(n);
          }
          return e;
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },
  H = /Start$/,
  W = /^bootstrap/,
  F$1 = /^ready/;
function G$1(e) {
  var t = e.pluginName,
    n = e.method + "Aborted" + (t ? ":" + t : "");
  e.store.dispatch(g$1({}, e.data, {
    type: n,
    _: {
      called: n,
      from: "abort"
    }
  }));
}
function K(e, t, n) {
  var r = t[e] || n[e];
  return r && r.config ? r.config : {};
}
function Q(e, t) {
  return t.reduce(function (t, n) {
    return n[e] ? t.concat({
      methodName: e,
      pluginName: n.name,
      method: n[e]
    }) : t;
  }, []);
}
function Y(e, t) {
  var n = e.replace(H, ""),
    r = t ? ":" + t : "";
  return ["" + e + r, "" + n + r, n + "End" + r];
}
function Z(e, t) {
  var n = e.abort;
  return !!n && (!0 === n || ne(n, t) || n && ne(n.plugins, t));
}
function ee(e, t) {
  var n = e.abort;
  if (!n) return !1;
  if (!0 === n || q$1(n)) return !0;
  var r = n.plugins;
  return te(n) && n.length === t || te(r) && r.length === t;
}
function te(e) {
  return Array.isArray(e);
}
function ne(e, t) {
  return !(!e || !te(e)) && e.includes(t);
}
function re(e) {
  var t = e.match(/(.*):(.*)/);
  return !!t && {
    method: t[1],
    name: t[2]
  };
}
function ie(e) {
  return Object.keys(e).reduce(function (t, n) {
    return "type" === n || (t[n] = on(e[n]) ? Object.assign({}, e[n]) : e[n]), t;
  }, {});
}
function ae(e, t, n) {
  var r = {};
  return function (i) {
    return function (a) {
      return function (o) {
        try {
          var u,
            c = function (e) {
              return u ? e : a(p);
            },
            s = o.type,
            d = o.plugins,
            p = o;
          if (o.abort) return Promise.resolve(a(o));
          if (s === z.enablePlugin && i.dispatch({
            type: z.initializeStart,
            plugins: d,
            disabled: [],
            fromEnable: !0,
            meta: o.meta
          }), s === z.disablePlugin && setTimeout(function () {
            return L$1(o.meta.rid, {
              payload: o
            });
          }, 0), s === z.initializeEnd) {
            var m = t(),
              h = Object.keys(m),
              v = h.filter(function (e) {
                return d.includes(e);
              }).map(function (e) {
                return m[e];
              }),
              y = [],
              b = [],
              I = o.disabled,
              w = v.map(function (e) {
                var t = e.loaded,
                  n = e.name,
                  a = e.config;
                return J$1(e, function () {
                  return t({
                    config: a
                  });
                }, 1e4).then(function (t) {
                  return r[n] || (i.dispatch({
                    type: z.pluginReadyType(n),
                    name: n,
                    events: Object.keys(e).filter(function (e) {
                      return !T.includes(e);
                    })
                  }), r[n] = !0), y = y.concat(n), e;
                }).catch(function (e) {
                  if (e instanceof Error) throw new Error(e);
                  return b = b.concat(e.name), e;
                });
              });
            Promise.all(w).then(function (e) {
              var t = {
                plugins: y,
                failed: b,
                disabled: I
              };
              setTimeout(function () {
                h.length === w.length + I.length && i.dispatch(g$1({}, {
                  type: z.ready
                }, t));
              }, 0);
            });
          }
          var E = function () {
            if (s !== z.bootstrap) return /^ready:([^:]*)$/.test(s) && setTimeout(function () {
              return function (e, t, n) {
                var r = t(),
                  i = e.getState(),
                  a = i.plugins,
                  o = i.queue,
                  u = i.user;
                if (!i.context.offline && o && o.actions && o.actions.length) {
                  var c = o.actions.reduce(function (e, t, n) {
                    return a[t.plugin].loaded ? (e.process.push(t), e.processIndex.push(n)) : (e.requeue.push(t), e.requeueIndex.push(n)), e;
                  }, {
                    processIndex: [],
                    process: [],
                    requeue: [],
                    requeueIndex: []
                  });
                  if (c.processIndex && c.processIndex.length) {
                    c.processIndex.forEach(function (t) {
                      var i = o.actions[t],
                        c = i.plugin,
                        s = i.payload.type,
                        f = r[c][s];
                      if (f && W$1(f)) {
                        var d = function (e, t) {
                          return void 0 === e && (e = {}), void 0 === t && (t = {}), [j, k$1].reduce(function (n, r) {
                            return e.hasOwnProperty(r) && t[r] && t[r] !== e[r] && (n[r] = t[r]), n;
                          }, e);
                        }(i.payload, u);
                        f({
                          payload: d,
                          config: a[c].config,
                          instance: n
                        });
                        var p = s + ":" + c;
                        e.dispatch(g$1({}, d, {
                          type: p,
                          _: {
                            called: p,
                            from: "queueDrain"
                          }
                        }));
                      }
                    });
                    var s = o.actions.filter(function (e, t) {
                      return !~c.processIndex.indexOf(t);
                    });
                    o.actions = s;
                  }
                }
              }(i, t, e);
            }, 0), Promise.resolve(function (e, t, n, r, i) {
              try {
                var a = W$1(t) ? t() : t,
                  o = e.type,
                  u = o.replace(H, "");
                if (e._ && e._.called) return Promise.resolve(e);
                var c = n.getState(),
                  s = (m = a, void 0 === (h = c.plugins) && (h = {}), void 0 === (v = e.options) && (v = {}), Object.keys(m).filter(function (e) {
                    var t = v.plugins || {};
                    return Q$1(t[e]) ? t[e] : !1 !== t.all && (!h[e] || !1 !== h[e].enabled);
                  }).map(function (e) {
                    return m[e];
                  }));
                o === z.initializeStart && e.fromEnable && (s = Object.keys(c.plugins).filter(function (t) {
                  var n = c.plugins[t];
                  return e.plugins.includes(t) && !n.initialized;
                }).map(function (e) {
                  return a[e];
                }));
                var d = s.map(function (e) {
                    return e.name;
                  }),
                  p = function (e, t, n) {
                    var r = Y(e).map(function (e) {
                      return Q(e, t);
                    });
                    return t.reduce(function (n, r) {
                      var i = r.name,
                        a = Y(e, i).map(function (e) {
                          return Q(e, t);
                        }),
                        o = a[0],
                        u = a[1],
                        c = a[2];
                      return o.length && (n.beforeNS[i] = o), u.length && (n.duringNS[i] = u), c.length && (n.afterNS[i] = c), n;
                    }, {
                      before: r[0],
                      beforeNS: {},
                      during: r[1],
                      duringNS: {},
                      after: r[2],
                      afterNS: {}
                    });
                  }(o, s);
                return Promise.resolve(X({
                  action: e,
                  data: {
                    exact: p.before,
                    namespaced: p.beforeNS
                  },
                  state: c,
                  allPlugins: a,
                  allMatches: p,
                  instance: n,
                  store: r,
                  EVENTS: i
                })).then(function (e) {
                  function t() {
                    var t = function () {
                      if (o.match(H)) return Promise.resolve(X({
                        action: g$1({}, s, {
                          type: u + "End"
                        }),
                        data: {
                          exact: p.after,
                          namespaced: p.afterNS
                        },
                        state: c,
                        allPlugins: a,
                        allMatches: p,
                        instance: n,
                        store: r,
                        EVENTS: i
                      })).then(function (e) {
                        e.meta && e.meta.hasCallback && L$1(e.meta.rid, {
                          payload: e
                        });
                      });
                    }();
                    return t && t.then ? t.then(function () {
                      return e;
                    }) : e;
                  }
                  if (ee(e, d.length)) return e;
                  var s,
                    l = function () {
                      if (o !== u) return Promise.resolve(X({
                        action: g$1({}, e, {
                          type: u
                        }),
                        data: {
                          exact: p.during,
                          namespaced: p.duringNS
                        },
                        state: c,
                        allPlugins: a,
                        allMatches: p,
                        instance: n,
                        store: r,
                        EVENTS: i
                      })).then(function (e) {
                        s = e;
                      });
                      s = e;
                    }();
                  return l && l.then ? l.then(t) : t();
                });
              } catch (e) {
                return Promise.reject(e);
              }
              var m, h, v;
            }(o, t, e, i, n)).then(function (e) {
              return u = 1, a(e);
            });
          }();
          return Promise.resolve(E && E.then ? E.then(c) : c(E));
        } catch (e) {
          return Promise.reject(e);
        }
      };
    };
  };
}
function oe(e) {
  return function (t) {
    return function (t) {
      return function (n) {
        var r = n.type,
          i = n.key,
          a = n.value,
          o = n.options;
        if (r === z.setItem || r === z.removeItem) {
          if (n.abort) return t(n);
          r === z.setItem ? e.setItem(i, a, o) : e.removeItem(i, o);
        }
        return t(n);
      };
    };
  };
}
var ue = function () {
  var e = this;
  this.before = [], this.after = [], this.addMiddleware = function (t, n) {
    e[n] = e[n].concat(t);
  }, this.removeMiddleware = function (t, n) {
    var r = e[n].findIndex(function (e) {
      return e === t;
    });
    -1 !== r && (e[n] = [].concat(e[n].slice(0, r), e[n].slice(r + 1)));
  }, this.dynamicMiddlewares = function (t) {
    return function (n) {
      return function (r) {
        return function (i) {
          var a = {
              getState: n.getState,
              dispatch: function (e) {
                return n.dispatch(e);
              }
            },
            o = e[t].map(function (e) {
              return e(a);
            });
          return P.apply(void 0, o)(r)(i);
        };
      };
    };
  };
};
function ce(e) {
  return function (t, n) {
    void 0 === t && (t = {});
    var r = {};
    if ("initialize:aborted" === n.type) return t;
    if (/^registerPlugin:([^:]*)$/.test(n.type)) {
      var i = se(n.type, "registerPlugin"),
        a = e()[i];
      if (!a || !i) return t;
      var o = n.enabled,
        u = a.config;
      return r[i] = {
        enabled: o,
        initialized: !!o && Boolean(!a.initialize),
        loaded: !!o && Boolean(a.loaded({
          config: u
        })),
        config: u
      }, g$1({}, t, r);
    }
    if (/^initialize:([^:]*)$/.test(n.type)) {
      var c = se(n.type, z.initialize),
        s = e()[c];
      return s && c ? (r[c] = g$1({}, t[c], {
        initialized: !0,
        loaded: Boolean(s.loaded({
          config: s.config
        }))
      }), g$1({}, t, r)) : t;
    }
    if (/^ready:([^:]*)$/.test(n.type)) return r[n.name] = g$1({}, t[n.name], {
      loaded: !0
    }), g$1({}, t, r);
    switch (n.type) {
      case z.disablePlugin:
        return g$1({}, t, le(n.plugins, !1, t));
      case z.enablePlugin:
        return g$1({}, t, le(n.plugins, !0, t));
      default:
        return t;
    }
  };
}
function se(e, t) {
  return e.substring(t.length + 1, e.length);
}
function le(e, t, n) {
  return e.reduce(function (e, r) {
    return e[r] = g$1({}, n[r], {
      enabled: t
    }), e;
  }, n);
}
function fe(e) {
  try {
    return JSON.parse(JSON.stringify(e));
  } catch (e) {}
  return e;
}
var de = {
  last: {},
  history: []
};
function pe(e, t) {
  void 0 === e && (e = de);
  var n = t.options,
    r = t.meta;
  if (t.type === z.track) {
    var i = fe(g$1({
      event: t.event,
      properties: t.properties
    }, Object.keys(n).length && {
      options: n
    }, {
      meta: r
    }));
    return g$1({}, e, {
      last: i,
      history: e.history.concat(i)
    });
  }
  return e;
}
var me = {
  actions: []
};
function ge(e, t) {
  void 0 === e && (e = me);
  var n = t.payload;
  switch (t.type) {
    case "queue":
      var r;
      return r = n && n.type && n.type === z.identify ? [t].concat(e.actions) : e.actions.concat(t), g$1({}, e, {
        actions: r
      });
    case "dequeue":
      return [];
    default:
      return e;
  }
}
var he = /#.*$/;
function ve(e) {
  var t = /(http[s]?:\/\/)?([^\/\s]+\/)(.*)/g.exec(e);
  return "/" + (t && t[3] ? t[3].split("?")[0].replace(he, "") : "");
}
var ye,
  be = function (e) {
    if (void 0 === e && (e = {}), !$$1) return e;
    var t = document,
      n = t.title,
      r = t.referrer,
      i = window,
      a = i.location,
      o = i.innerWidth,
      u = i.innerHeight,
      c = a.hash,
      s = a.search,
      l = function (e) {
        var t = function () {
          if ($$1) for (var e, t = document.getElementsByTagName("link"), n = 0; e = t[n]; n++) if ("canonical" === e.getAttribute("rel")) return e.getAttribute("href");
        }();
        return t ? t.match(/\?/) ? t : t + e : window.location.href.replace(he, "");
      }(s),
      f = {
        title: n,
        url: l,
        path: ve(l),
        hash: c,
        search: s,
        width: o,
        height: u
      };
    return r && "" !== r && (f.referrer = r), g$1({}, f, e);
  },
  Ie = {
    last: {},
    history: []
  };
function we(e, t) {
  void 0 === e && (e = Ie);
  var n = t.options;
  if (t.type === z.page) {
    var r = fe(g$1({
      properties: t.properties,
      meta: t.meta
    }, Object.keys(n).length && {
      options: n
    }));
    return g$1({}, e, {
      last: r,
      history: e.history.concat(r)
    });
  }
  return e;
}
ye = {};
var Ee = {
  initialized: !1,
  sessionId: y$1(),
  app: null,
  version: null,
  debug: !1,
  offline: !!$$1 && !navigator.onLine,
  os: {
    name: "na"
  },
  userAgent: $$1 ? navigator.userAgent : "node",
  library: {
    name: "analytics",
    version: "0.12.5"
  },
  timezone: void 0,
  locale: void 0,
  campaign: {},
  referrer: ye
};
function Pe(e, t) {
  void 0 === e && (e = Ee);
  var n = e.initialized,
    r = t.campaign;
  switch (t.type) {
    case z.campaign:
      return g$1({}, e, {
        campaign: r
      });
    case z.offline:
      return g$1({}, e, {
        offline: !0
      });
    case z.online:
      return g$1({}, e, {
        offline: !1
      });
    default:
      return n ? e : g$1({}, Ee, e, {
        initialized: !0
      });
  }
}
var Se = ["plugins", "reducers", "storage"];
function Ne() {
  return f("analytics", []), function (e) {
    return function (t, n$1, r) {
      var i = e(t, n$1, r),
        a = i.dispatch;
      return Object.assign(i, {
        dispatch: function (e) {
          return n[o].analytics.push(e.action || e), a(e);
        }
      });
    };
  };
}
function Ae(e) {
  return function () {
    return P(P.apply(null, arguments), Ne());
  };
}
function _e(e) {
  return e ? rn(e) ? e : [e] : [];
}
function Oe(t, n, r) {
  void 0 === t && (t = {});
  var i,
    a,
    o = y$1();
  return n && (B[o] = (i = n, a = function (e) {
    for (var t, n = e || Array.prototype.slice.call(arguments), r = 0; r < n.length; r++) if (W$1(n[r])) {
      t = n[r];
      break;
    }
    return t;
  }(r), function (e) {
    a && a(e), i(e);
  })), g$1({}, t, {
    rid: o,
    ts: new Date().getTime()
  }, n ? {
    hasCallback: !0
  } : {});
}
function je(o) {
  void 0 === o && (o = {});
  var u = o.reducers || {},
    s$1 = o.initialUser || {},
    f$1 = (o.plugins || []).reduce(function (e, t) {
      if (W$1(t)) return e.middlewares = e.middlewares.concat(t), e;
      if (t.NAMESPACE && (t.name = t.NAMESPACE), !t.name) throw new Error("https://lytics.dev/errors/1");
      t.config || (t.config = {});
      var n = t.EVENTS ? Object.keys(t.EVENTS).map(function (e) {
        return t.EVENTS[e];
      }) : [];
      e.pluginEnabled[t.name] = !(!1 === t.enabled || !1 === t.config.enabled), delete t.enabled, t.methods && (e.methods[t.name] = Object.keys(t.methods).reduce(function (e, n) {
        var r;
        return e[n] = (r = t.methods[n], function () {
          for (var e = Array.prototype.slice.call(arguments), t = new Array(r.length), n = 0; n < e.length; n++) t[n] = e[n];
          return t[t.length] = K, r.apply({
            instance: K
          }, t);
        }), e;
      }, {}), delete t.methods);
      var r = Object.keys(t).concat(n),
        i = new Set(e.events.concat(r));
      if (e.events = Array.from(i), e.pluginsArray = e.pluginsArray.concat(t), e.plugins[t.name]) throw new Error(t.name + "AlreadyLoaded");
      return e.plugins[t.name] = t, e.plugins[t.name].loaded || (e.plugins[t.name].loaded = function () {
        return !0;
      }), e;
    }, {
      plugins: {},
      pluginEnabled: {},
      methods: {},
      pluginsArray: [],
      middlewares: [],
      events: []
    }),
    m = o.storage ? o.storage : {
      getItem: a$2,
      setItem: f,
      removeItem: i$2
    },
    b = function (e) {
      return function (t, n, i) {
        return n.getState("user")[t] || (i && on(i) && i[t] ? i[t] : R(e)[t] || a$2($(t)) || null);
      };
    }(m),
    I = f$1.plugins,
    A = f$1.events.filter(function (e) {
      return !T.includes(e);
    }).sort(),
    _ = new Set(A.concat(x$1).filter(function (e) {
      return !T.includes(e);
    })),
    O = Array.from(_).sort(),
    M = function () {
      return I;
    },
    q = new ue(),
    V = q.addMiddleware,
    B = q.removeMiddleware,
    L = q.dynamicMiddlewares,
    J = function () {
      throw new Error("Abort disabled inListener");
    },
    X = s(),
    H = R(m),
    W = g$1({}, H, s$1, X.an_uid ? {
      userId: X.an_uid
    } : {}, X.an_aid ? {
      anonymousId: X.an_aid
    } : {});
  W.anonymousId || (W.anonymousId = y$1());
  var F = g$1({
      enable: function (e, t) {
        return new Promise(function (n) {
          le.dispatch({
            type: z.enablePlugin,
            plugins: _e(e),
            _: {
              originalAction: z.enablePlugin
            }
          }, n, [t]);
        });
      },
      disable: function (e, t) {
        return new Promise(function (n) {
          le.dispatch({
            type: z.disablePlugin,
            plugins: _e(e),
            _: {
              originalAction: z.disablePlugin
            }
          }, n, [t]);
        });
      }
    }, f$1.methods),
    G = !1,
    K = {
      identify: function (e, t, n, r) {
        try {
          var i = q$1(e) ? e : null,
            o = on(e) ? e : t,
            u = n || {},
            s = K.user();
          f($(j), i);
          var l = i || o.userId || b(j, K, o);
          return Promise.resolve(new Promise(function (e) {
            le.dispatch(g$1({
              type: z.identifyStart,
              userId: l,
              traits: o || {},
              options: u,
              anonymousId: s.anonymousId
            }, s.id && s.id !== i && {
              previousId: s.id
            }), e, [t, n, r]);
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      },
      track: function (e, t, n, r) {
        try {
          var i = on(e) ? e.event : e;
          if (!i || !q$1(i)) throw new Error("EventMissing");
          var a = on(e) ? e : t || {},
            o = on(n) ? n : {};
          return Promise.resolve(new Promise(function (e) {
            le.dispatch({
              type: z.trackStart,
              event: i,
              properties: a,
              options: o,
              userId: b(j, K, t),
              anonymousId: b(k$1, K, t)
            }, e, [t, n, r]);
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      },
      page: function (e, t, n) {
        try {
          var r = on(e) ? e : {},
            i = on(t) ? t : {};
          return Promise.resolve(new Promise(function (a) {
            le.dispatch({
              type: z.pageStart,
              properties: be(r),
              options: i,
              userId: b(j, K, r),
              anonymousId: b(k$1, K, r)
            }, a, [e, t, n]);
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      },
      user: function (e) {
        if (e === j || "id" === e) return b(j, K);
        if (e === k$1 || "anonId" === e) return b(k$1, K);
        var t = K.getState("user");
        return e ? n$2(t, e) : t;
      },
      reset: function (e) {
        return new Promise(function (t) {
          le.dispatch({
            type: z.resetStart
          }, t, e);
        });
      },
      ready: function (e) {
        return G && e({
          plugins: F,
          instance: K
        }), K.on(z.ready, function (t) {
          e(t), G = !0;
        });
      },
      on: function (e, t) {
        if (!e || !W$1(t)) return !1;
        if (e === z.bootstrap) throw new Error(".on disabled for " + e);
        var n = /Start$|Start:/;
        if ("*" === e) {
          var r = function (e) {
              return function (e) {
                return function (r) {
                  return r.type.match(n) && t({
                    payload: r,
                    instance: K,
                    plugins: I
                  }), e(r);
                };
              };
            },
            i = function (e) {
              return function (e) {
                return function (r) {
                  return r.type.match(n) || t({
                    payload: r,
                    instance: K,
                    plugins: I
                  }), e(r);
                };
              };
            };
          return V(r, ke), V(i, xe), function () {
            B(r, ke), B(i, xe);
          };
        }
        var a = e.match(n) ? ke : xe,
          o = function (n) {
            return function (n) {
              return function (r) {
                return r.type === e && t({
                  payload: r,
                  instance: K,
                  plugins: I,
                  abort: J
                }), n(r);
              };
            };
          };
        return V(o, a), function () {
          return B(o, a);
        };
      },
      once: function (e, t) {
        if (!e || !W$1(t)) return !1;
        if (e === z.bootstrap) throw new Error(".once disabled for " + e);
        var n = K.on(e, function (e) {
          t({
            payload: e.payload,
            instance: K,
            plugins: I,
            abort: J
          }), n();
        });
        return n;
      },
      getState: function (e) {
        var t = le.getState();
        return e ? n$2(t, e) : Object.assign({}, t);
      },
      dispatch: function (e) {
        var t = q$1(e) ? {
          type: e
        } : e;
        if (x$1.includes(t.type)) throw new Error("reserved action " + t.type);
        var n = g$1({}, t, {
          _: g$1({
            originalAction: t.type
          }, e._ || {})
        });
        le.dispatch(n);
      },
      enablePlugin: F.enable,
      disablePlugin: F.disable,
      plugins: F,
      storage: {
        getItem: m.getItem,
        setItem: function (e, t, n) {
          le.dispatch({
            type: z.setItemStart,
            key: e,
            value: t,
            options: n
          });
        },
        removeItem: function (e, t) {
          le.dispatch({
            type: z.removeItemStart,
            key: e,
            options: t
          });
        }
      },
      setAnonymousId: function (e, t) {
        K.storage.setItem(N$1, e, t);
      },
      events: {
        core: x$1,
        plugins: A
      }
    },
    Q = f$1.middlewares.concat([function (e) {
      return function (e) {
        return function (t) {
          return t.meta || (t.meta = Oe()), e(t);
        };
      };
    }, L(ke), ae(K, M, {
      all: O,
      plugins: A
    }), oe(m), C$1(K), D(K), L(xe)]),
    Y = {
      context: Pe,
      user: U(m),
      page: we,
      track: pe,
      plugins: ce(M),
      queue: ge
    },
    Z = P,
    ee = P;
  if ($$1 && o.debug) {
    var te = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    te && (Z = te({
      trace: !0,
      traceLimit: 25
    })), ee = function () {
      return 0 === arguments.length ? Ne() : on(typeof arguments[0]) ? Ae() : Ae().apply(null, arguments);
    };
  }
  var ne,
    re = function (e) {
      return Object.keys(e).reduce(function (t, n) {
        return Se.includes(n) || (t[n] = e[n]), t;
      }, {});
    }(o),
    ie = f$1.pluginsArray.reduce(function (e, t) {
      var n = t.name,
        r = t.config,
        i = t.loaded,
        a = f$1.pluginEnabled[n];
      return e[n] = {
        enabled: a,
        initialized: !!a && Boolean(!t.initialize),
        loaded: Boolean(i({
          config: r
        })),
        config: r
      }, e;
    }, {}),
    se = {
      context: re,
      user: W,
      plugins: ie
    },
    le = w(function (e) {
      for (var t = Object.keys(e), n = {}, r = 0; r < t.length; r++) {
        var i = t[r];
        typeof e[i] === h$1 && (n[i] = e[i]);
      }
      var a,
        o = Object.keys(n);
      try {
        !function (e) {
          Object.keys(e).forEach(function (t) {
            var n = e[t];
            if (typeof n(void 0, {
              type: "@@redux/INIT"
            }) === v || typeof n(void 0, {
              type: y
            }) === v) throw new Error("reducer " + t + " " + v);
          });
        }(n);
      } catch (e) {
        a = e;
      }
      return function (e, t) {
        if (void 0 === e && (e = {}), a) throw a;
        for (var r = !1, i = {}, u = 0; u < o.length; u++) {
          var c = o[u],
            s = e[c],
            l = (0, n[c])(s, t);
          if (typeof l === v) {
            var f = E$1(c, t);
            throw new Error(f);
          }
          i[c] = l, r = r || l !== s;
        }
        return r ? i : e;
      };
    }(g$1({}, Y, u)), se, ee(Z(S.apply(void 0, Q))));
  le.dispatch = (ne = le.dispatch, function (e, t, n) {
    var r = g$1({}, e, {
      meta: Oe(e.meta, t, _e(n))
    });
    return ne.apply(null, [r]);
  });
  var fe = Object.keys(I);
  le.dispatch({
    type: z.bootstrap,
    plugins: fe,
    config: re,
    params: X,
    user: W,
    initialUser: s$1,
    persistedUser: H
  });
  var de = fe.filter(function (e) {
      return f$1.pluginEnabled[e];
    }),
    me = fe.filter(function (e) {
      return !f$1.pluginEnabled[e];
    });
  return le.dispatch({
    type: z.registerPlugins,
    plugins: fe,
    enabled: f$1.pluginEnabled
  }), f$1.pluginsArray.map(function (e, t) {
    var n = e.bootstrap,
      r = e.config,
      i = e.name;
    n && W$1(n) && n({
      instance: K,
      config: r,
      payload: e
    }), le.dispatch({
      type: z.registerPluginType(i),
      name: i,
      enabled: f$1.pluginEnabled[i],
      plugin: e
    }), f$1.pluginsArray.length === t + 1 && le.dispatch({
      type: z.initializeStart,
      plugins: de,
      disabled: me
    });
  }), K;
}
var ke = "before",
  xe = "after";

var t = "cookie",
  i$1 = a$1(),
  r$1 = d$1,
  c = d$1;
function u(o) {
  return i$1 ? d$1(o, "", -1) : i$2(o);
}
function a$1() {
  if (void 0 !== i$1) return i$1;
  var e = "cookiecookie";
  try {
    d$1(e, e), i$1 = -1 !== document.cookie.indexOf(e), u(e);
  } catch (e) {
    i$1 = !1;
  }
  return i$1;
}
function d$1(e, t, r, c, u, a) {
  if ("undefined" != typeof window) {
    var d = arguments.length > 1;
    return !1 === i$1 && (d ? f(e, t) : a$2(e)), d ? document.cookie = e + "=" + encodeURIComponent(t) + (r ? "; expires=" + new Date(+new Date() + 1e3 * r).toUTCString() + (c ? "; path=" + c : "") + (u ? "; domain=" + u : "") + (a ? "; secure" : "") : "") : decodeURIComponent((("; " + document.cookie).split("; " + e + "=")[1] || "").split(";")[0]);
  }
}

var r = "localStorage",
  g = b$2.bind(null, "localStorage");
  u$1("localStorage", "getItem", a$2);
  u$1("localStorage", "setItem", f);
  u$1("localStorage", "removeItem", i$2);

var a = "sessionStorage",
  i = b$2.bind(null, "sessionStorage");
  u$1("sessionStorage", "getItem", a$2);
  u$1("sessionStorage", "setItem", f);
  u$1("sessionStorage", "removeItem", i$2);

function I(t) {
  var o = t;
  try {
    if ("true" === (o = JSON.parse(t))) return !0;
    if ("false" === o) return !1;
    if (on(o)) return o;
    parseFloat(o) === o && (o = parseFloat(o));
  } catch (t) {}
  if (null !== o && "" !== o) return o;
}
var k = g(),
  O = i(),
  x = a$1();
function C(o, e) {
  if (o) {
    var r = A(e),
      a = !N(r),
      i = d(r) ? I(localStorage.getItem(o)) : void 0;
    if (a && !I$2(i)) return i;
    var n = h(r) ? I(r$1(o)) : void 0;
    if (a && n) return n;
    var l = E(r) ? I(sessionStorage.getItem(o)) : void 0;
    if (a && l) return l;
    var u = a$2(o);
    return a ? u : {
      localStorage: i,
      sessionStorage: l,
      cookie: n,
      global: u
    };
  }
}
function L(r$2, a$1, l$1) {
  if (r$2 && !I$2(a$1)) {
    var u = {},
      g = A(l$1),
      m = JSON.stringify(a$1),
      S = !N(g);
    return d(g) && (u[r] = F(r, a$1, I(localStorage.getItem(r$2))), localStorage.setItem(r$2, m), S) ? u[r] : h(g) && (u[t] = F(t, a$1, I(r$1(r$2))), c(r$2, m), S) ? u[t] : E(g) && (u[a] = F(a, a$1, I(sessionStorage.getItem(r$2))), sessionStorage.setItem(r$2, m), S) ? u[a] : (u[l] = F(l, a$1, a$2(r$2)), f(r$2, a$1), S ? u[l] : u);
  }
}
function b(t$1, e) {
  if (t$1) {
    var a$1 = A(e),
      s = C(t$1, m$1),
      n = {};
    return !I$2(s.localStorage) && d(a$1) && (localStorage.removeItem(t$1), n[r] = s.localStorage), !I$2(s.cookie) && h(a$1) && (u(t$1), n[t] = s.cookie), !I$2(s.sessionStorage) && E(a$1) && (sessionStorage.removeItem(t$1), n[a] = s.sessionStorage), !I$2(s.global) && G(a$1, l) && (i$2(t$1), n[l] = s.global), n;
  }
}
function A(t) {
  return t ? q$1(t) ? t : t.storage : b$3;
}
function d(t) {
  return k && G(t, r);
}
function h(t$1) {
  return x && G(t$1, t);
}
function E(t) {
  return O && G(t, a);
}
function N(t) {
  return t === m$1 || "all" === t;
}
function G(t, o) {
  return t === b$3 || t === o || N(t);
}
function F(t, o, e) {
  return {
    location: t,
    current: o,
    previous: e
  };
}
var J = {
  setItem: L,
  getItem: C,
  removeItem: b
};

function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) {
      _defineProperty$1(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function analyticsLib() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var defaultSettings = {
    storage: J
  };
  return je(_objectSpread2(_objectSpread2({}, defaultSettings), opts));
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

/* global, window */
var loadedInstances = {};
/* Location of gtag script */

var gtagScriptSource = 'https://www.googletagmanager.com/gtag/js'; // See https://developers.google.com/analytics/devguides/collection/ga4/reference/config

var defaultGtagConf = {
  // https://support.google.com/analytics/answer/7201382?hl=en#zippy=%2Cglobal-site-tag-websites
  debug_mode: false,
  /**
   * Disable automatic sending of page views, instead let analytics.page() do this
   * https://developers.google.com/analytics/devguides/collection/gtagjs
   */
  send_page_view: false,
  // https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
  anonymize_ip: false,
  /**
   * Disable All Advertising
   * https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_all_advertising_features
   */
  allow_google_signals: true,
  /**
   * Disable Advertising Personalization
   * https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_advertising_personalization
   */
  allow_ad_personalization_signals: true,
  /**
   * https://developers.google.com/analytics/devguides/collection/gtagjs/cookies-user-id#configure_cookie_field_settings
   */
  // cookie_domain: 'auto',
  // cookie_expires
  // cookie_prefix
  // cookie_update
  // cookie_flags

  /**
   * Cookie Flags
   * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_flags
   */
  cookie_flags: ''
};
var defaultConfig = {
  gtagName: 'gtag',
  dataLayerName: 'ga4DataLayer',
  measurementIds: [],
  gtagConfig: defaultGtagConf
};
/**
 * Google analytics plugin
 * @link https://getanalytics.io/plugins/google-analytics/
 * @link https://analytics.google.com/analytics/web/
 * @link https://developers.google.com/analytics/devguides/collection/analyticsjs
 * @param {object}  pluginConfig - Plugin settings
 * @param {string[]} pluginConfig.measurementIds - Google Analytics MEASUREMENT IDs
 * @param {boolean} [pluginConfig.debug] - Enable Google Analytics debug mode
 * @param {string}  [pluginConfig.dataLayerName=ga4DataLayer] - The optional name for dataLayer object. Defaults to ga4DataLayer.
 * @param {string}  [pluginConfig.gtagName=gtag] - The optional name for dataLayer object. Defaults to `gtag`.
 * @param {boolean} [pluginConfig.gtagConfig.anonymize_ip] - Enable [Anonymizing IP addresses](https://bit.ly/3c660Rd) sent to Google Analytics.
 * @param {object}  [pluginConfig.gtagConfig.cookie_domain] - Additional cookie properties for configuring the [ga cookie](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id#configuring_cookie_field_settings)
 * @param {object}  [pluginConfig.gtagConfig.cookie_expires] - Additional cookie properties for configuring the [ga cookie](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id#configuring_cookie_field_settings)
 * @param {object}  [pluginConfig.gtagConfig.cookie_prefix] - Additional cookie properties for configuring the [ga cookie](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id#configuring_cookie_field_settings)
 * @param {object}  [pluginConfig.gtagConfig.cookie_update] - Additional cookie properties for configuring the [ga cookie](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id#configuring_cookie_field_settings)
 * @param {object}  [pluginConfig.gtagConfig.cookie_flags] - Additional cookie properties for configuring the [ga cookie](https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id#configuring_cookie_field_settings)
 * @param {string}  [pluginConfig.customScriptSrc] - Custom URL for google analytics script, if proxying calls
 * @return {*}
 * @example
 *
 * googleAnalytics({
 *   measurementIds: ['G-abc123']
 * })
 */

function googleAnalytics() {
  var pluginConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var pageCallCount = 0;
  var measurementIds = getIds(pluginConfig.measurementIds);
  var initConfig = _objectSpread(_objectSpread({}, defaultConfig), pluginConfig);
  return {
    name: 'google-analytics',
    config: initConfig,
    // Load gtag.js and define gtag
    initialize: function initialize(_ref) {
      var config = _ref.config,
        instance = _ref.instance;
      var dataLayerName = config.dataLayerName,
        customScriptSrc = config.customScriptSrc,
        gtagName = config.gtagName,
        gtagConfig = config.gtagConfig,
        debug = config.debug;
      /* Inject google gtag.js script if not found */

      /* If other gtags are loaded already, add ours anyway */

      var customLayerName = dataLayerName ? "&l=".concat(dataLayerName) : "";
      var src = customScriptSrc || "".concat(gtagScriptSource, "?id=").concat(measurementIds[0]).concat(customLayerName);
      if (!scriptLoaded(src)) {
        var script = document.createElement('script');
        script.async = true;
        script.src = src;
        document.body.appendChild(script);
      }
      /* Set up gtag and datalayer */

      if (!window[dataLayerName]) {
        window[dataLayerName] = window[dataLayerName] || [];
      }
      if (!window[gtagName]) {
        window[gtagName] = function () {
          window[dataLayerName].push(arguments);
        };
      }
      window[gtagName]('js', new Date()); // Initialize tracker instances on page

      var gtagConf = _objectSpread(_objectSpread({}, defaultGtagConf), gtagConfig ? gtagConfig : {}); // You must explicitly delete the debug_mode parameter or all sessions will fire in debug more. Setting it false is not enough.
      // https://support.google.com/analytics/answer/7201382?hl=en&ref_topic=9303319#zippy=%2Cgoogle-tag-websites:~:text=To%20disable%20debug%20mode%2C%20exclude%20the%20%27debug_mode%27%20parameter%3B%20setting%20the%20parameter%20to%20false%20doesn%27t%20disable%20debug%20mode.

      if (debug === true) {
        gtagConf.debug_mode = true;
      } else {
        delete gtagConf.debug_mode;
      }
      /* set custom dimensions from user traits */

      var user = instance.user() || {};
      var traits = user.traits || {};
      if (Object.keys(traits).length) {
        window[gtagName]('set', 'user_properties', traits);
      }
      /* Initialize all measurementIds */

      for (var i = 0; i < measurementIds.length; i++) {
        if (!loadedInstances[measurementIds[i]]) {
          window[gtagName]('config', measurementIds[i], gtagConf);
          loadedInstances[measurementIds[i]] = true;
        }
      }
    },
    // Set parameter scope at user level with 'set' method
    identify: function identify(_ref2) {
      var payload = _ref2.payload,
        config = _ref2.config;
      var gtagName = config.gtagName;
      if (!window[gtagName] || !measurementIds.length) return;
      if (payload.userId) {
        // https://developers.google.com/analytics/devguides/collection/ga4/user-id?platform=websites#send_user_ids
        window[gtagName]('set', {
          user_id: payload.userId
        }); // console.log('Set userid', payload.userId)
      } // TODO verify this
      // https://developers.google.com/analytics/devguides/collection/ga4/user-properties?technology=websites

      if (Object.keys(payload.traits).length) {
        /* gtag('set', 'user_properties', {
          favorite_composer: 'Mahler',
          favorite_instrument: 'double bass',
          season_ticketholder: 'true'
        }) */
        window[gtagName]('set', 'user_properties', payload.traits); // console.log('Set userprops', payload.traits)
      }
    },

    // Set parameter scope at page level with 'config' method
    page: function page(_ref3) {
      var payload = _ref3.payload,
        config = _ref3.config,
        instance = _ref3.instance;
      var gtagName = config.gtagName,
        gtagConfig = config.gtagConfig;
      if (!window[gtagName] || !measurementIds.length) return;
      var properties = payload.properties;
      var send_to = properties.send_to;
      var campaign = instance.getState('context.campaign'); // console.log('ga page properties', properties)

      /* Create pageview-related properties */

      var pageView = {
        page_title: properties.title,
        page_location: properties.url,
        page_path: properties.path || document.location.pathname,
        page_hash: properties.hash,
        page_search: properties.page_search,
        page_referrer: properties.referrer
      };
      var campaignData = addCampaignData(campaign);
      var userId = instance.user('userId');
      var finalPayload = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, send_to ? {
        send_to: send_to
      } : {}), pageView), campaignData), userId ? {
        user_id: userId
      } : {});
      /* If send_page_view true, ignore first analytics.page call */

      if (gtagConfig && gtagConfig.send_page_view && pageCallCount === 0) {
        pageCallCount++; // console.log('ignore first pageCallCount', pageCallCount)

        return;
      } // console.log('Send page_view payload', finalPayload)

      window[gtagName]('event', 'page_view', finalPayload); // Set after initial page view

      pageCallCount++;
    },
    // Set parameter scope at event level with 'event' method
    track: function track(_ref4) {
      var payload = _ref4.payload,
        config = _ref4.config,
        instance = _ref4.instance;
      var properties = payload.properties,
        event = payload.event;
      var campaign = instance.getState('context.campaign');
      var gtagName = config.gtagName;
      if (!window[gtagName] || !measurementIds.length) return;
      var campaignData = addCampaignData(campaign);
      var userId = instance.user('userId'); // Limits https://support.google.com/analytics/answer/9267744

      var finalPayload = _objectSpread(_objectSpread(_objectSpread({}, properties), campaignData), userId ? {
        user_id: userId
      } : {});
      /*
        console.log('finalPayload', finalPayload)
        console.log('event', event)
      */

      /* Send data to Google Analytics
        Signature gtag('event', '<event_name>', {
          <event_params>key: value,
        })
      */

      window[gtagName]('event', event, finalPayload);
    },
    /* Verify gtag loaded and ready to use */
    loaded: function loaded() {
      var dataLayerName = initConfig.dataLayerName,
        customScriptSrc = initConfig.customScriptSrc;
      var hasDataLayer = dataLayerName && window[dataLayerName] && Array.prototype.push === window[dataLayerName].push;
      return scriptLoaded(customScriptSrc || gtagScriptSource) && hasDataLayer;
    },
    /* Custom methods */
    methods: {
      addTag: function addTag(tagId) {
        var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        // https://developers.google.com/tag-platform/devguides/install-gtagjs#add_products_to_your_tag
        if (window[initConfig.gtagName]) {
          window[initConfig.gtagName]('config', tagId, settings); // Add tag id

          if (measurementIds && !measurementIds.includes(tagId)) {
            measurementIds = measurementIds.concat(tagId);
          }
        }
      },
      /* Disable gtag for user */
      disable: function disable(ids) {
        var gaIds = ids ? getIds(ids) : measurementIds;
        for (var i = 0; i < measurementIds.length; i++) {
          var gaId = measurementIds[i];
          if (gaIds.includes(gaId)) {
            // https://developers.google.com/analytics/devguides/collection/gtagjs/user-opt-out
            window["ga-disable-".concat(gaId)] = true;
          }
        }
      },
      /* Enable gtag for user */
      enable: function enable(ids) {
        var gaIds = ids ? getIds(ids) : measurementIds;
        for (var i = 0; i < measurementIds.length; i++) {
          var gaId = measurementIds[i];
          if (gaIds.includes(gaId)) {
            // https://developers.google.com/analytics/devguides/collection/gtagjs/user-opt-out
            window["ga-disable-".concat(gaId)] = false;
          }
        }
      }
    }
  };
}
function getIds(measurementIds) {
  if (!measurementIds) throw new Error('No GA Measurement ID defined');
  if (Array.isArray(measurementIds)) {
    return measurementIds;
  }
  if (typeof measurementIds === 'string') {
    return [measurementIds];
  }
  throw new Error('GA Measurement ID must be string or array of strings');
}
/**
 * Add campaign data to GA payload https://bit.ly/34qFCPn
 * @param {Object} [campaignData={}] [description]
 * @param {String} [campaignData.campaignName] - Name of campaign
 * @param {String} [campaignData.campaignSource] - Source of campaign
 * @param {String} [campaignData.campaignMedium] - Medium of campaign
 * @param {String} [campaignData.campaignContent] - Content of campaign
 * @param {String} [campaignData.campaignKeyword] - Keyword of campaign
 */

function addCampaignData() {
  var campaignData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var campaign = {};
  var id = campaignData.id,
    name = campaignData.name,
    source = campaignData.source,
    medium = campaignData.medium,
    content = campaignData.content,
    keyword = campaignData.keyword;
  if (id) campaign.campaignId = id;
  if (name) campaign.campaignName = name;
  if (source) campaign.campaignSource = source;
  if (medium) campaign.campaignMedium = medium;
  if (content) campaign.campaignContent = content;
  if (keyword) campaign.campaignKeyword = keyword;
  return campaign;
}
function scriptLoaded(scriptSrc) {
  var scripts = document.querySelectorAll('script[src]');
  var regex = new RegExp("^".concat(scriptSrc));
  return Boolean(Object.values(scripts).filter(function (value) {
    return regex.test(value.src);
  }).length);
}

/* This module will shake out unused code + work in browser and node 🎉 */

var index = googleAnalytics;

const analytics = analyticsLib({
  app: "datflat-app",
  debug: true,
  plugins: [index({
    measurementIds: ["G-V8T6J8C7SJ"]
  })]
});

class BaseView extends s$3 {
  createRenderRoot() {
    return this;
  }
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    analytics.page();
  }
}

const loggerContext = n$3("logger");

var DtfEvent;
(function (DtfEvent2) {
  DtfEvent2["LONG_TASK_START"] = "longtask:start";
  DtfEvent2["LONG_TASK_FINISH"] = "longtask:finish";
})(DtfEvent || (DtfEvent = {}));

class LocalStorageService {
  get length() {
    return this.storage.length;
  }
  constructor(storage, prefix) {
    this.storage = storage;
    this.prefix = prefix;
  }
  prefixKey(plainKey) {
    if (this.prefix) {
      return `[${this.prefix}]${plainKey}`;
    }
    return plainKey;
  }
  setItem(key, value) {
    this.storage.setItem(this.prefixKey(key), JSON.stringify({
      value
    }));
  }
  getItem(key, otherwise) {
    const data = this.storage.getItem(this.prefixKey(key));
    if (data !== null) {
      return JSON.parse(data).value;
    }
    if (otherwise) {
      return otherwise;
    }
    return null;
  }
  removeItem(key) {
    this.storage.removeItem(this.prefixKey(key));
  }
  clear() {
    this.storage.clear();
  }
  key(index) {
    return this.storage.key(index);
  }
}

const localStorageContext = n$3("local-storage-service");

var DatflatApp_1;
(async () => {
  await import('./de6f6f05.js');
})();
const logo = new URL(new URL('9529ee57.svg', import.meta.url).href, import.meta.url).href;
let DatflatApp = DatflatApp_1 = class DatflatApp2 extends BaseView {
  constructor() {
    super();
    this.logger = console;
    this.localStorageService = new LocalStorageService(window.localStorage, "datflat/v1");
    this.spinLogo = false;
    let taskCount = 0;
    this.addEventListener(DtfEvent.LONG_TASK_START, e => {
      taskCount += 1;
      this.spinLogo = true;
      this.logger.info(`Task Started: ${e.detail.message}`);
    });
    this.addEventListener(DtfEvent.LONG_TASK_FINISH, e => {
      taskCount -= 1;
      if (!taskCount) {
        this.spinLogo = false;
      }
      this.logger.info(`Task Finished: ${e.detail.message}`);
    });
  }
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    const router = new Router(this.querySelector("main.outlet"));
    router.setRoutes([{
      path: "/",
      redirect: "/bse"
    }, {
      path: "/about",
      component: "about-view"
    }, {
      path: "/bse",
      children: () => import('./a82d96d0.js').then(module => module.routes)
    }
    // { path: '(.*)', redirect: '/' },
    ]);
  }

  render() {
    return x$2`
      <style>
        ${DatflatApp_1.styles.cssText}
      </style>
      <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <img
              src="${logo}"
              alt="Logo"
              width="30"
              height="24"
              class="d-inline-block align-text-top logo ${o$2({
      spin: this.spinLogo
    })}"
            />
            Datflat
          </a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
              <a
                class="nav-link active"
                aria-current="page"
                href="/bse/announcements"
                >BSE Announcements</a
              >
              <a class="nav-link" href="#">BSE Bulks</a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Router outlet -->
      <main class="d-flex flex-grow-1 overflow-auto outlet"></main>

      <footer>
        <p class="col mt-3 text-center">
          <span> Made with <i class="bi bi-heart-fill text-danger"></i> </span>
          by
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/sumitgogia"
          >
            Sumit Gogia </a
          >.
        </p>
      </footer>
    `;
  }
};
DatflatApp.styles = i$7`.navbar-brand .logo.spin{animation:app-logo-spin infinite 1s linear}@keyframes app-logo-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@media (min-height:576px){datf-lat{height:100vh}}`;
__decorate([e$2({
  context: loggerContext
})], DatflatApp.prototype, "logger", void 0);
__decorate([e$2({
  context: localStorageContext
})], DatflatApp.prototype, "localStorageService", void 0);
__decorate([n$5({
  type: Boolean
})], DatflatApp.prototype, "spinLogo", void 0);
DatflatApp = DatflatApp_1 = __decorate([e$5("datf-lat")], DatflatApp);

export { A$3 as A, BaseView as B, DtfEvent as D, T$2 as T, __decorate as _, i$7 as a, e$5 as b, A$2 as c, loggerContext as d, e$1 as e, analytics as f, i$3 as i, j$2 as j, localStorageContext as l, n$5 as n, o$2 as o, s$2 as s, t$1 as t, x$2 as x };
