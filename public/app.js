(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var COMMENT_TAG = '!--'
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload || function () {}
    var unload = props.onunload || function () {}
    onload(el, function belOnload () {
      load(el)
    }, function belOnunload () {
      unload(el)
    },
    // We have to use non-standard `caller` to find who invokes `belCreateElement`
    belCreateElement.caller.caller.caller)
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        typeof node === 'function' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"global/document":5,"hyperx":8,"on-load":23}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
/* global HTMLElement */

'use strict'

module.exports = function emptyElement (element) {
  if (!(element instanceof HTMLElement)) {
    throw new TypeError('Expected an element')
  }

  var node
  while ((node = element.lastChild)) element.removeChild(node)
  return element
}

},{}],4:[function(require,module,exports){
//
// Main
//

function memoize (fn, options) {
  var cache = options && options.cache
    ? options.cache
    : cacheDefault

  var serializer = options && options.serializer
    ? options.serializer
    : serializerDefault

  var strategy = options && options.strategy
    ? options.strategy
    : strategyDefault

  return strategy(fn, {
    cache: cache,
    serializer: serializer
  })
}

//
// Strategy
//

function isPrimitive (value) {
  return value == null || typeof value === 'number' || typeof value === 'boolean' // || typeof value === "string" 'unsafe' primitive for our needs
}

function monadic (fn, cache, serializer, arg) {
  var cacheKey = isPrimitive(arg) ? arg : serializer(arg)

  var computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.call(this, arg)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function variadic (fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3)
  var cacheKey = serializer(args)

  var computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.apply(this, args)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function assemble (fn, context, strategy, cache, serialize) {
  return strategy.bind(
    context,
    fn,
    cache,
    serialize
  )
}

function strategyDefault (fn, options) {
  var strategy = fn.length === 1 ? monadic : variadic

  return assemble(
    fn,
    this,
    strategy,
    options.cache.create(),
    options.serializer
  )
}

function strategyVariadic (fn, options) {
  var strategy = variadic

  return assemble(
    fn,
    this,
    strategy,
    options.cache.create(),
    options.serializer
  )
}

function strategyMonadic (fn, options) {
  var strategy = monadic

  return assemble(
    fn,
    this,
    strategy,
    options.cache.create(),
    options.serializer
  )
}

//
// Serializer
//

function serializerDefault () {
  return JSON.stringify(arguments)
}

//
// Cache
//

function ObjectWithoutPrototypeCache () {
  this.cache = Object.create(null)
}

ObjectWithoutPrototypeCache.prototype.has = function (key) {
  return (key in this.cache)
}

ObjectWithoutPrototypeCache.prototype.get = function (key) {
  return this.cache[key]
}

ObjectWithoutPrototypeCache.prototype.set = function (key, value) {
  this.cache[key] = value
}

var cacheDefault = {
  create: function create () {
    return new ObjectWithoutPrototypeCache()
  }
}

//
// API
//

module.exports = memoize
module.exports.strategies = {
  variadic: strategyVariadic,
  monadic: strategyMonadic
}

},{}],5:[function(require,module,exports){
(function (global){(function (){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":2}],6:[function(require,module,exports){
(function (global){(function (){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],8:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":7}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
var tslib_1 = require("tslib");
var parser_1 = require("./src/parser");
var normalize_1 = require("./src/normalize");
tslib_1.__exportStar(require("./src/types"), exports);
tslib_1.__exportStar(require("./src/parser"), exports);
function parse(input, opts) {
    opts = tslib_1.__assign({ normalizeHashtagInPlural: true, shouldParseSkeleton: true }, (opts || {}));
    var els = parser_1.pegParse(input, opts);
    if (opts.normalizeHashtagInPlural) {
        normalize_1.normalizeHashtagInPlural(els);
    }
    return els;
}
exports.parse = parse;

},{"./src/normalize":10,"./src/parser":11,"./src/types":13,"tslib":29}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeHashtagInPlural = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
var parser_1 = require("./parser");
var PLURAL_HASHTAG_REGEX = /(^|[^\\])#/g;
/**
 * Whether to convert `#` in plural rule options
 * to `{var, number}`
 * @param el AST Element
 * @param pluralStack current plural stack
 */
function normalizeHashtagInPlural(els) {
    els.forEach(function (el) {
        // If we're encountering a plural el
        if (!types_1.isPluralElement(el) && !types_1.isSelectElement(el)) {
            return;
        }
        // Go down the options and search for # in any literal element
        Object.keys(el.options).forEach(function (id) {
            var _a;
            var opt = el.options[id];
            // If we got a match, we have to split this
            // and inject a NumberElement in the middle
            var matchingLiteralElIndex = -1;
            var literalEl = undefined;
            for (var i = 0; i < opt.value.length; i++) {
                var el_1 = opt.value[i];
                if (types_1.isLiteralElement(el_1) && PLURAL_HASHTAG_REGEX.test(el_1.value)) {
                    matchingLiteralElIndex = i;
                    literalEl = el_1;
                    break;
                }
            }
            if (literalEl) {
                var newValue = literalEl.value.replace(PLURAL_HASHTAG_REGEX, "$1{" + el.value + ", number}");
                var newEls = parser_1.pegParse(newValue);
                (_a = opt.value).splice.apply(_a, tslib_1.__spreadArrays([matchingLiteralElIndex, 1], newEls));
            }
            normalizeHashtagInPlural(opt.value);
        });
    });
}
exports.normalizeHashtagInPlural = normalizeHashtagInPlural;

},{"./parser":11,"./types":13,"tslib":29}],11:[function(require,module,exports){
"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.pegParse = exports.SyntaxError = void 0;
var tslib_1 = require("tslib");
// @generated
var types_1 = require("./types");
var skeleton_1 = require("./skeleton");
var SyntaxError = /** @class */ (function (_super) {
    tslib_1.__extends(SyntaxError, _super);
    function SyntaxError(message, expected, found, location) {
        var _this = _super.call(this) || this;
        _this.message = message;
        _this.expected = expected;
        _this.found = found;
        _this.location = location;
        _this.name = "SyntaxError";
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(_this, SyntaxError);
        }
        return _this;
    }
    SyntaxError.buildMessage = function (expected, found) {
        function hex(ch) {
            return ch.charCodeAt(0).toString(16).toUpperCase();
        }
        function literalEscape(s) {
            return s
                .replace(/\\/g, "\\\\")
                .replace(/"/g, "\\\"")
                .replace(/\0/g, "\\0")
                .replace(/\t/g, "\\t")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
        }
        function classEscape(s) {
            return s
                .replace(/\\/g, "\\\\")
                .replace(/\]/g, "\\]")
                .replace(/\^/g, "\\^")
                .replace(/-/g, "\\-")
                .replace(/\0/g, "\\0")
                .replace(/\t/g, "\\t")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
        }
        function describeExpectation(expectation) {
            switch (expectation.type) {
                case "literal":
                    return "\"" + literalEscape(expectation.text) + "\"";
                case "class":
                    var escapedParts = expectation.parts.map(function (part) {
                        return Array.isArray(part)
                            ? classEscape(part[0]) + "-" + classEscape(part[1])
                            : classEscape(part);
                    });
                    return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
                case "any":
                    return "any character";
                case "end":
                    return "end of input";
                case "other":
                    return expectation.description;
            }
        }
        function describeExpected(expected1) {
            var descriptions = expected1.map(describeExpectation);
            var i;
            var j;
            descriptions.sort();
            if (descriptions.length > 0) {
                for (i = 1, j = 1; i < descriptions.length; i++) {
                    if (descriptions[i - 1] !== descriptions[i]) {
                        descriptions[j] = descriptions[i];
                        j++;
                    }
                }
                descriptions.length = j;
            }
            switch (descriptions.length) {
                case 1:
                    return descriptions[0];
                case 2:
                    return descriptions[0] + " or " + descriptions[1];
                default:
                    return descriptions.slice(0, -1).join(", ")
                        + ", or "
                        + descriptions[descriptions.length - 1];
            }
        }
        function describeFound(found1) {
            return found1 ? "\"" + literalEscape(found1) + "\"" : "end of input";
        }
        return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    return SyntaxError;
}(Error));
exports.SyntaxError = SyntaxError;
function peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$startRuleFunctions = { start: peg$parsestart };
    var peg$startRuleFunction = peg$parsestart;
    var peg$c0 = function () { return !ignoreTag; };
    var peg$c1 = function (x) { return x; };
    var peg$c2 = function () { return ignoreTag; };
    var peg$c3 = "<";
    var peg$c4 = peg$literalExpectation("<", false);
    var peg$c5 = function (parts) {
        return parts.join('');
    };
    var peg$c6 = function () { return '<'; };
    var peg$c7 = function (messageText) {
        return tslib_1.__assign({ type: types_1.TYPE.literal, value: messageText }, insertLocation());
    };
    var peg$c8 = "#";
    var peg$c9 = peg$literalExpectation("#", false);
    var peg$c10 = function () {
        return tslib_1.__assign({ type: types_1.TYPE.pound }, insertLocation());
    };
    var peg$c11 = peg$otherExpectation("tagElement");
    var peg$c12 = function (open, children, close) {
        if (open !== close) {
            error("Mismatch tag \"" + open + "\" !== \"" + close + "\"", location());
        }
        return tslib_1.__assign({ type: types_1.TYPE.tag, value: open, children: children }, insertLocation());
    };
    var peg$c13 = "/>";
    var peg$c14 = peg$literalExpectation("/>", false);
    var peg$c15 = function (value) {
        return tslib_1.__assign({ type: types_1.TYPE.literal, value: value.join('') }, insertLocation());
    };
    var peg$c16 = ">";
    var peg$c17 = peg$literalExpectation(">", false);
    var peg$c18 = function (tag) { return tag; };
    var peg$c19 = "</";
    var peg$c20 = peg$literalExpectation("</", false);
    var peg$c21 = peg$otherExpectation("argumentElement");
    var peg$c22 = "{";
    var peg$c23 = peg$literalExpectation("{", false);
    var peg$c24 = "}";
    var peg$c25 = peg$literalExpectation("}", false);
    var peg$c26 = function (value) {
        return tslib_1.__assign({ type: types_1.TYPE.argument, value: value }, insertLocation());
    };
    var peg$c27 = peg$otherExpectation("numberSkeletonId");
    var peg$c28 = /^['\/{}]/;
    var peg$c29 = peg$classExpectation(["'", "/", "{", "}"], false, false);
    var peg$c30 = peg$anyExpectation();
    var peg$c31 = peg$otherExpectation("numberSkeletonTokenOption");
    var peg$c32 = "/";
    var peg$c33 = peg$literalExpectation("/", false);
    var peg$c34 = function (option) { return option; };
    var peg$c35 = peg$otherExpectation("numberSkeletonToken");
    var peg$c36 = function (stem, options) {
        return { stem: stem, options: options };
    };
    var peg$c37 = function (tokens) {
        return tslib_1.__assign({ type: 0 /* number */, tokens: tokens, parsedOptions: shouldParseSkeleton ? skeleton_1.parseNumberSkeleton(tokens) : {} }, insertLocation());
    };
    var peg$c38 = "::";
    var peg$c39 = peg$literalExpectation("::", false);
    var peg$c40 = function (skeleton) { return skeleton; };
    var peg$c41 = function () { messageCtx.push('numberArgStyle'); return true; };
    var peg$c42 = function (style) {
        messageCtx.pop();
        return style.replace(/\s*$/, '');
    };
    var peg$c43 = ",";
    var peg$c44 = peg$literalExpectation(",", false);
    var peg$c45 = "number";
    var peg$c46 = peg$literalExpectation("number", false);
    var peg$c47 = function (value, type, style) {
        return tslib_1.__assign({ type: type === 'number' ? types_1.TYPE.number : type === 'date' ? types_1.TYPE.date : types_1.TYPE.time, style: style && style[2], value: value }, insertLocation());
    };
    var peg$c48 = "'";
    var peg$c49 = peg$literalExpectation("'", false);
    var peg$c50 = /^[^']/;
    var peg$c51 = peg$classExpectation(["'"], true, false);
    var peg$c52 = /^[^a-zA-Z'{}]/;
    var peg$c53 = peg$classExpectation([["a", "z"], ["A", "Z"], "'", "{", "}"], true, false);
    var peg$c54 = /^[a-zA-Z]/;
    var peg$c55 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false);
    var peg$c56 = function (pattern) {
        return tslib_1.__assign({ type: 1 /* dateTime */, pattern: pattern, parsedOptions: shouldParseSkeleton ? skeleton_1.parseDateTimeSkeleton(pattern) : {} }, insertLocation());
    };
    var peg$c57 = function () { messageCtx.push('dateOrTimeArgStyle'); return true; };
    var peg$c58 = "date";
    var peg$c59 = peg$literalExpectation("date", false);
    var peg$c60 = "time";
    var peg$c61 = peg$literalExpectation("time", false);
    var peg$c62 = "plural";
    var peg$c63 = peg$literalExpectation("plural", false);
    var peg$c64 = "selectordinal";
    var peg$c65 = peg$literalExpectation("selectordinal", false);
    var peg$c66 = "offset:";
    var peg$c67 = peg$literalExpectation("offset:", false);
    var peg$c68 = function (value, pluralType, offset, options) {
        return tslib_1.__assign({ type: types_1.TYPE.plural, pluralType: pluralType === 'plural' ? 'cardinal' : 'ordinal', value: value, offset: offset ? offset[2] : 0, options: options.reduce(function (all, _a) {
                var id = _a.id, value = _a.value, optionLocation = _a.location;
                if (id in all) {
                    error("Duplicate option \"" + id + "\" in plural element: \"" + text() + "\"", location());
                }
                all[id] = {
                    value: value,
                    location: optionLocation
                };
                return all;
            }, {}) }, insertLocation());
    };
    var peg$c69 = "select";
    var peg$c70 = peg$literalExpectation("select", false);
    var peg$c71 = function (value, options) {
        return tslib_1.__assign({ type: types_1.TYPE.select, value: value, options: options.reduce(function (all, _a) {
                var id = _a.id, value = _a.value, optionLocation = _a.location;
                if (id in all) {
                    error("Duplicate option \"" + id + "\" in select element: \"" + text() + "\"", location());
                }
                all[id] = {
                    value: value,
                    location: optionLocation
                };
                return all;
            }, {}) }, insertLocation());
    };
    var peg$c72 = "=";
    var peg$c73 = peg$literalExpectation("=", false);
    var peg$c74 = function (id) { messageCtx.push('select'); return true; };
    var peg$c75 = function (id, value) {
        messageCtx.pop();
        return tslib_1.__assign({ id: id,
            value: value }, insertLocation());
    };
    var peg$c76 = function (id) { messageCtx.push('plural'); return true; };
    var peg$c77 = function (id, value) {
        messageCtx.pop();
        return tslib_1.__assign({ id: id,
            value: value }, insertLocation());
    };
    var peg$c78 = peg$otherExpectation("whitespace");
    var peg$c79 = /^[\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
    var peg$c80 = peg$classExpectation([["\t", "\r"], " ", "\x85", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u2028", "\u2029", "\u202F", "\u205F", "\u3000"], false, false);
    var peg$c81 = peg$otherExpectation("syntax pattern");
    var peg$c82 = /^[!-\/:-@[-\^`{-~\xA1-\xA7\xA9\xAB\xAC\xAE\xB0\xB1\xB6\xBB\xBF\xD7\xF7\u2010-\u2027\u2030-\u203E\u2041-\u2053\u2055-\u205E\u2190-\u245F\u2500-\u2775\u2794-\u2BFF\u2E00-\u2E7F\u3001-\u3003\u3008-\u3020\u3030\uFD3E\uFD3F\uFE45\uFE46]/;
    var peg$c83 = peg$classExpectation([["!", "/"], [":", "@"], ["[", "^"], "`", ["{", "~"], ["\xA1", "\xA7"], "\xA9", "\xAB", "\xAC", "\xAE", "\xB0", "\xB1", "\xB6", "\xBB", "\xBF", "\xD7", "\xF7", ["\u2010", "\u2027"], ["\u2030", "\u203E"], ["\u2041", "\u2053"], ["\u2055", "\u205E"], ["\u2190", "\u245F"], ["\u2500", "\u2775"], ["\u2794", "\u2BFF"], ["\u2E00", "\u2E7F"], ["\u3001", "\u3003"], ["\u3008", "\u3020"], "\u3030", "\uFD3E", "\uFD3F", "\uFE45", "\uFE46"], false, false);
    var peg$c84 = peg$otherExpectation("optional whitespace");
    var peg$c85 = peg$otherExpectation("number");
    var peg$c86 = "-";
    var peg$c87 = peg$literalExpectation("-", false);
    var peg$c88 = function (negative, num) {
        return num
            ? negative
                ? -num
                : num
            : 0;
    };
    var peg$c89 = peg$otherExpectation("apostrophe");
    var peg$c90 = peg$otherExpectation("double apostrophes");
    var peg$c91 = "''";
    var peg$c92 = peg$literalExpectation("''", false);
    var peg$c93 = function () { return "'"; };
    var peg$c94 = function (escapedChar, quotedChars) {
        return escapedChar + quotedChars.replace("''", "'");
    };
    var peg$c95 = function (x) {
        return (x !== '<' &&
            x !== '{' &&
            !(isInPluralOption() && x === '#') &&
            !(isNestedMessageText() && x === '}'));
    };
    var peg$c96 = "\n";
    var peg$c97 = peg$literalExpectation("\n", false);
    var peg$c98 = function (x) {
        return x === '<' || x === '>' || x === '{' || x === '}' || (isInPluralOption() && x === '#');
    };
    var peg$c99 = peg$otherExpectation("argNameOrNumber");
    var peg$c100 = peg$otherExpectation("validTag");
    var peg$c101 = peg$otherExpectation("argNumber");
    var peg$c102 = "0";
    var peg$c103 = peg$literalExpectation("0", false);
    var peg$c104 = function () { return 0; };
    var peg$c105 = /^[1-9]/;
    var peg$c106 = peg$classExpectation([["1", "9"]], false, false);
    var peg$c107 = /^[0-9]/;
    var peg$c108 = peg$classExpectation([["0", "9"]], false, false);
    var peg$c109 = function (digits) {
        return parseInt(digits.join(''), 10);
    };
    var peg$c110 = peg$otherExpectation("argName");
    var peg$c111 = peg$otherExpectation("tagName");
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [{ line: 1, column: 1 }];
    var peg$maxFailPos = 0;
    var peg$maxFailExpected = [];
    var peg$silentFails = 0;
    var peg$result;
    if (options.startRule !== undefined) {
        if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location1) {
        location1 = location1 !== undefined
            ? location1
            : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location1);
    }
    function error(message, location1) {
        location1 = location1 !== undefined
            ? location1
            : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location1);
    }
    function peg$literalExpectation(text1, ignoreCase) {
        return { type: "literal", text: text1, ignoreCase: ignoreCase };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }
    function peg$anyExpectation() {
        return { type: "any" };
    }
    function peg$endExpectation() {
        return { type: "end" };
    }
    function peg$otherExpectation(description) {
        return { type: "other", description: description };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
            return details;
        }
        else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while (p < pos) {
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                }
                else {
                    details.column++;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        return {
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column
            }
        };
    }
    function peg$fail(expected1) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected1);
    }
    function peg$buildSimpleError(message, location1) {
        return new SyntaxError(message, [], "", location1);
    }
    function peg$buildStructuredError(expected1, found, location1) {
        return new SyntaxError(SyntaxError.buildMessage(expected1, found), expected1, found, location1);
    }
    function peg$parsestart() {
        var s0;
        s0 = peg$parsemessage();
        return s0;
    }
    function peg$parsemessage() {
        var s0, s1;
        s0 = [];
        s1 = peg$parsemessageElement();
        while (s1 !== peg$FAILED) {
            s0.push(s1);
            s1 = peg$parsemessageElement();
        }
        return s0;
    }
    function peg$parsemessageElement() {
        var s0, s1, s2;
        s0 = peg$currPos;
        peg$savedPos = peg$currPos;
        s1 = peg$c0();
        if (s1) {
            s1 = undefined;
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetagElement();
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c1(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parseliteralElement();
            if (s0 === peg$FAILED) {
                s0 = peg$parseargumentElement();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsesimpleFormatElement();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parsepluralElement();
                        if (s0 === peg$FAILED) {
                            s0 = peg$parseselectElement();
                            if (s0 === peg$FAILED) {
                                s0 = peg$parsepoundElement();
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parsemessageText() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        peg$savedPos = peg$currPos;
        s1 = peg$c2();
        if (s1) {
            s1 = undefined;
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsedoubleApostrophes();
            if (s3 === peg$FAILED) {
                s3 = peg$parsequotedString();
                if (s3 === peg$FAILED) {
                    s3 = peg$parseunquotedString();
                    if (s3 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 60) {
                            s3 = peg$c3;
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c4);
                            }
                        }
                    }
                }
            }
            if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parsedoubleApostrophes();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parsequotedString();
                        if (s3 === peg$FAILED) {
                            s3 = peg$parseunquotedString();
                            if (s3 === peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 60) {
                                    s3 = peg$c3;
                                    peg$currPos++;
                                }
                                else {
                                    s3 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c4);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c5(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parsedoubleApostrophes();
            if (s2 === peg$FAILED) {
                s2 = peg$parsequotedString();
                if (s2 === peg$FAILED) {
                    s2 = peg$parseunquotedString();
                    if (s2 === peg$FAILED) {
                        s2 = peg$parsenonTagStartingAngleBracket();
                    }
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parsedoubleApostrophes();
                    if (s2 === peg$FAILED) {
                        s2 = peg$parsequotedString();
                        if (s2 === peg$FAILED) {
                            s2 = peg$parseunquotedString();
                            if (s2 === peg$FAILED) {
                                s2 = peg$parsenonTagStartingAngleBracket();
                            }
                        }
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c5(s1);
            }
            s0 = s1;
        }
        return s0;
    }
    function peg$parsenonTagStartingAngleBracket() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parseopeningTag();
        if (s2 === peg$FAILED) {
            s2 = peg$parseclosingTag();
            if (s2 === peg$FAILED) {
                s2 = peg$parseselfClosingTag();
            }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
            s1 = undefined;
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 60) {
                s2 = peg$c3;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c4);
                }
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c6();
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseliteralElement() {
        var s0, s1;
        s0 = peg$currPos;
        s1 = peg$parsemessageText();
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c7(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parsepoundElement() {
        var s0, s1;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
            s1 = peg$c8;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c9);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c10();
        }
        s0 = s1;
        return s0;
    }
    function peg$parsetagElement() {
        var s0, s1, s2, s3;
        peg$silentFails++;
        s0 = peg$parseselfClosingTag();
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseopeningTag();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsemessage();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseclosingTag();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c12(s1, s2, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c11);
            }
        }
        return s0;
    }
    function peg$parseselfClosingTag() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 60) {
            s2 = peg$c3;
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c4);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = peg$parsevalidTag();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c13) {
                        s5 = peg$c13;
                        peg$currPos += 2;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c14);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s2 = [s2, s3, s4, s5];
                        s1 = s2;
                    }
                    else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c15(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseopeningTag() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 60) {
            s1 = peg$c3;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c4);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsevalidTag();
            if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 62) {
                    s3 = peg$c16;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c17);
                    }
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c18(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseclosingTag() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c19) {
            s1 = peg$c19;
            peg$currPos += 2;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c20);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsevalidTag();
            if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 62) {
                    s3 = peg$c16;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c17);
                    }
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c18(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseargumentElement() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c22;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseargNameOrNumber();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 125) {
                            s5 = peg$c24;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c25);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c26(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c21);
            }
        }
        return s0;
    }
    function peg$parsenumberSkeletonId() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parsewhiteSpace();
        if (s4 === peg$FAILED) {
            if (peg$c28.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c29);
                }
            }
        }
        peg$silentFails--;
        if (s4 === peg$FAILED) {
            s3 = undefined;
        }
        else {
            peg$currPos = s3;
            s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
            if (input.length > peg$currPos) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c30);
                }
            }
            if (s4 !== peg$FAILED) {
                s3 = [s3, s4];
                s2 = s3;
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s2;
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$currPos;
                s3 = peg$currPos;
                peg$silentFails++;
                s4 = peg$parsewhiteSpace();
                if (s4 === peg$FAILED) {
                    if (peg$c28.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c29);
                        }
                    }
                }
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = undefined;
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c30);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s3 = [s3, s4];
                        s2 = s3;
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c27);
            }
        }
        return s0;
    }
    function peg$parsenumberSkeletonTokenOption() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
            s1 = peg$c32;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c33);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsenumberSkeletonId();
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c34(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c31);
            }
        }
        return s0;
    }
    function peg$parsenumberSkeletonToken() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
            s2 = peg$parsenumberSkeletonId();
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$parsenumberSkeletonTokenOption();
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    s4 = peg$parsenumberSkeletonTokenOption();
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c36(s2, s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c35);
            }
        }
        return s0;
    }
    function peg$parsenumberSkeleton() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenumberSkeletonToken();
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$parsenumberSkeletonToken();
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parsenumberArgStyle() {
        var s0, s1, s2;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c38) {
            s1 = peg$c38;
            peg$currPos += 2;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c39);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsenumberSkeleton();
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c40(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            peg$savedPos = peg$currPos;
            s1 = peg$c41();
            if (s1) {
                s1 = undefined;
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsemessageText();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c42(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsenumberFormatElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c22;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseargNameOrNumber();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 44) {
                            s5 = peg$c43;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c44);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                if (input.substr(peg$currPos, 6) === peg$c45) {
                                    s7 = peg$c45;
                                    peg$currPos += 6;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c46);
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse_();
                                    if (s8 !== peg$FAILED) {
                                        s9 = peg$currPos;
                                        if (input.charCodeAt(peg$currPos) === 44) {
                                            s10 = peg$c43;
                                            peg$currPos++;
                                        }
                                        else {
                                            s10 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c44);
                                            }
                                        }
                                        if (s10 !== peg$FAILED) {
                                            s11 = peg$parse_();
                                            if (s11 !== peg$FAILED) {
                                                s12 = peg$parsenumberArgStyle();
                                                if (s12 !== peg$FAILED) {
                                                    s10 = [s10, s11, s12];
                                                    s9 = s10;
                                                }
                                                else {
                                                    peg$currPos = s9;
                                                    s9 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s9;
                                                s9 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s9;
                                            s9 = peg$FAILED;
                                        }
                                        if (s9 === peg$FAILED) {
                                            s9 = null;
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse_();
                                            if (s10 !== peg$FAILED) {
                                                if (input.charCodeAt(peg$currPos) === 125) {
                                                    s11 = peg$c24;
                                                    peg$currPos++;
                                                }
                                                else {
                                                    s11 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                        peg$fail(peg$c25);
                                                    }
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s1 = peg$c47(s3, s7, s9);
                                                    s0 = s1;
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsedateTimeSkeletonLiteral() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 39) {
            s1 = peg$c48;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c49);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsedoubleApostrophes();
            if (s3 === peg$FAILED) {
                if (peg$c50.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c51);
                    }
                }
            }
            if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parsedoubleApostrophes();
                    if (s3 === peg$FAILED) {
                        if (peg$c50.test(input.charAt(peg$currPos))) {
                            s3 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c51);
                            }
                        }
                    }
                }
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 39) {
                    s3 = peg$c48;
                    peg$currPos++;
                }
                else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c49);
                    }
                }
                if (s3 !== peg$FAILED) {
                    s1 = [s1, s2, s3];
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = [];
            s1 = peg$parsedoubleApostrophes();
            if (s1 === peg$FAILED) {
                if (peg$c52.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c53);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                while (s1 !== peg$FAILED) {
                    s0.push(s1);
                    s1 = peg$parsedoubleApostrophes();
                    if (s1 === peg$FAILED) {
                        if (peg$c52.test(input.charAt(peg$currPos))) {
                            s1 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c53);
                            }
                        }
                    }
                }
            }
            else {
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsedateTimeSkeletonPattern() {
        var s0, s1;
        s0 = [];
        if (peg$c54.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c55);
            }
        }
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                if (peg$c54.test(input.charAt(peg$currPos))) {
                    s1 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c55);
                    }
                }
            }
        }
        else {
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsedateTimeSkeleton() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        s3 = peg$parsedateTimeSkeletonLiteral();
        if (s3 === peg$FAILED) {
            s3 = peg$parsedateTimeSkeletonPattern();
        }
        if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parsedateTimeSkeletonLiteral();
                if (s3 === peg$FAILED) {
                    s3 = peg$parsedateTimeSkeletonPattern();
                }
            }
        }
        else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        }
        else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c56(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parsedateOrTimeArgStyle() {
        var s0, s1, s2;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c38) {
            s1 = peg$c38;
            peg$currPos += 2;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c39);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsedateTimeSkeleton();
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c40(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            peg$savedPos = peg$currPos;
            s1 = peg$c57();
            if (s1) {
                s1 = undefined;
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsemessageText();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c42(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsedateOrTimeFormatElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c22;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseargNameOrNumber();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 44) {
                            s5 = peg$c43;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c44);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                if (input.substr(peg$currPos, 4) === peg$c58) {
                                    s7 = peg$c58;
                                    peg$currPos += 4;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c59);
                                    }
                                }
                                if (s7 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 4) === peg$c60) {
                                        s7 = peg$c60;
                                        peg$currPos += 4;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c61);
                                        }
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse_();
                                    if (s8 !== peg$FAILED) {
                                        s9 = peg$currPos;
                                        if (input.charCodeAt(peg$currPos) === 44) {
                                            s10 = peg$c43;
                                            peg$currPos++;
                                        }
                                        else {
                                            s10 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c44);
                                            }
                                        }
                                        if (s10 !== peg$FAILED) {
                                            s11 = peg$parse_();
                                            if (s11 !== peg$FAILED) {
                                                s12 = peg$parsedateOrTimeArgStyle();
                                                if (s12 !== peg$FAILED) {
                                                    s10 = [s10, s11, s12];
                                                    s9 = s10;
                                                }
                                                else {
                                                    peg$currPos = s9;
                                                    s9 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s9;
                                                s9 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s9;
                                            s9 = peg$FAILED;
                                        }
                                        if (s9 === peg$FAILED) {
                                            s9 = null;
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse_();
                                            if (s10 !== peg$FAILED) {
                                                if (input.charCodeAt(peg$currPos) === 125) {
                                                    s11 = peg$c24;
                                                    peg$currPos++;
                                                }
                                                else {
                                                    s11 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                        peg$fail(peg$c25);
                                                    }
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s1 = peg$c47(s3, s7, s9);
                                                    s0 = s1;
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsesimpleFormatElement() {
        var s0;
        s0 = peg$parsenumberFormatElement();
        if (s0 === peg$FAILED) {
            s0 = peg$parsedateOrTimeFormatElement();
        }
        return s0;
    }
    function peg$parsepluralElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c22;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseargNameOrNumber();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 44) {
                            s5 = peg$c43;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c44);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                if (input.substr(peg$currPos, 6) === peg$c62) {
                                    s7 = peg$c62;
                                    peg$currPos += 6;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c63);
                                    }
                                }
                                if (s7 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 13) === peg$c64) {
                                        s7 = peg$c64;
                                        peg$currPos += 13;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c65);
                                        }
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse_();
                                    if (s8 !== peg$FAILED) {
                                        if (input.charCodeAt(peg$currPos) === 44) {
                                            s9 = peg$c43;
                                            peg$currPos++;
                                        }
                                        else {
                                            s9 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c44);
                                            }
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse_();
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$currPos;
                                                if (input.substr(peg$currPos, 7) === peg$c66) {
                                                    s12 = peg$c66;
                                                    peg$currPos += 7;
                                                }
                                                else {
                                                    s12 = peg$FAILED;
                                                    if (peg$silentFails === 0) {
                                                        peg$fail(peg$c67);
                                                    }
                                                }
                                                if (s12 !== peg$FAILED) {
                                                    s13 = peg$parse_();
                                                    if (s13 !== peg$FAILED) {
                                                        s14 = peg$parsenumber();
                                                        if (s14 !== peg$FAILED) {
                                                            s12 = [s12, s13, s14];
                                                            s11 = s12;
                                                        }
                                                        else {
                                                            peg$currPos = s11;
                                                            s11 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s11;
                                                        s11 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s11;
                                                    s11 = peg$FAILED;
                                                }
                                                if (s11 === peg$FAILED) {
                                                    s11 = null;
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parse_();
                                                    if (s12 !== peg$FAILED) {
                                                        s13 = [];
                                                        s14 = peg$parsepluralOption();
                                                        if (s14 !== peg$FAILED) {
                                                            while (s14 !== peg$FAILED) {
                                                                s13.push(s14);
                                                                s14 = peg$parsepluralOption();
                                                            }
                                                        }
                                                        else {
                                                            s13 = peg$FAILED;
                                                        }
                                                        if (s13 !== peg$FAILED) {
                                                            s14 = peg$parse_();
                                                            if (s14 !== peg$FAILED) {
                                                                if (input.charCodeAt(peg$currPos) === 125) {
                                                                    s15 = peg$c24;
                                                                    peg$currPos++;
                                                                }
                                                                else {
                                                                    s15 = peg$FAILED;
                                                                    if (peg$silentFails === 0) {
                                                                        peg$fail(peg$c25);
                                                                    }
                                                                }
                                                                if (s15 !== peg$FAILED) {
                                                                    peg$savedPos = s0;
                                                                    s1 = peg$c68(s3, s7, s11, s13);
                                                                    s0 = s1;
                                                                }
                                                                else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseselectElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c22;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
                s3 = peg$parseargNameOrNumber();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 44) {
                            s5 = peg$c43;
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c44);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                                if (input.substr(peg$currPos, 6) === peg$c69) {
                                    s7 = peg$c69;
                                    peg$currPos += 6;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c70);
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse_();
                                    if (s8 !== peg$FAILED) {
                                        if (input.charCodeAt(peg$currPos) === 44) {
                                            s9 = peg$c43;
                                            peg$currPos++;
                                        }
                                        else {
                                            s9 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c44);
                                            }
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse_();
                                            if (s10 !== peg$FAILED) {
                                                s11 = [];
                                                s12 = peg$parseselectOption();
                                                if (s12 !== peg$FAILED) {
                                                    while (s12 !== peg$FAILED) {
                                                        s11.push(s12);
                                                        s12 = peg$parseselectOption();
                                                    }
                                                }
                                                else {
                                                    s11 = peg$FAILED;
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parse_();
                                                    if (s12 !== peg$FAILED) {
                                                        if (input.charCodeAt(peg$currPos) === 125) {
                                                            s13 = peg$c24;
                                                            peg$currPos++;
                                                        }
                                                        else {
                                                            s13 = peg$FAILED;
                                                            if (peg$silentFails === 0) {
                                                                peg$fail(peg$c25);
                                                            }
                                                        }
                                                        if (s13 !== peg$FAILED) {
                                                            peg$savedPos = s0;
                                                            s1 = peg$c71(s3, s11);
                                                            s0 = s1;
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsepluralRuleSelectValue() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c72;
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c73);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = peg$parsenumber();
            if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parseargName();
        }
        return s0;
    }
    function peg$parseselectOption() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
            s2 = peg$parseargName();
            if (s2 !== peg$FAILED) {
                s3 = peg$parse_();
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 123) {
                        s4 = peg$c22;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c23);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = peg$currPos;
                        s5 = peg$c74(s2);
                        if (s5) {
                            s5 = undefined;
                        }
                        else {
                            s5 = peg$FAILED;
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parsemessage();
                            if (s6 !== peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 125) {
                                    s7 = peg$c24;
                                    peg$currPos++;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c25);
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s1 = peg$c75(s2, s6);
                                    s0 = s1;
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsepluralOption() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
            s2 = peg$parsepluralRuleSelectValue();
            if (s2 !== peg$FAILED) {
                s3 = peg$parse_();
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 123) {
                        s4 = peg$c22;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c23);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = peg$currPos;
                        s5 = peg$c76(s2);
                        if (s5) {
                            s5 = undefined;
                        }
                        else {
                            s5 = peg$FAILED;
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parsemessage();
                            if (s6 !== peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 125) {
                                    s7 = peg$c24;
                                    peg$currPos++;
                                }
                                else {
                                    s7 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$c25);
                                    }
                                }
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s1 = peg$c77(s2, s6);
                                    s0 = s1;
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsewhiteSpace() {
        var s0, s1;
        peg$silentFails++;
        if (peg$c79.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c80);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c78);
            }
        }
        return s0;
    }
    function peg$parsepatternSyntax() {
        var s0, s1;
        peg$silentFails++;
        if (peg$c82.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c83);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c81);
            }
        }
        return s0;
    }
    function peg$parse_() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsewhiteSpace();
        while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parsewhiteSpace();
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c84);
            }
        }
        return s0;
    }
    function peg$parsenumber() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
            s1 = peg$c86;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c87);
            }
        }
        if (s1 === peg$FAILED) {
            s1 = null;
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseargNumber();
            if (s2 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c88(s1, s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c85);
            }
        }
        return s0;
    }
    function peg$parseapostrophe() {
        var s0, s1;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 39) {
            s0 = peg$c48;
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c49);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c89);
            }
        }
        return s0;
    }
    function peg$parsedoubleApostrophes() {
        var s0, s1;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c91) {
            s1 = peg$c91;
            peg$currPos += 2;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c92);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c93();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c90);
            }
        }
        return s0;
    }
    function peg$parsequotedString() {
        var s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 39) {
            s1 = peg$c48;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c49);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseescapedChar();
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                s4 = [];
                if (input.substr(peg$currPos, 2) === peg$c91) {
                    s5 = peg$c91;
                    peg$currPos += 2;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c92);
                    }
                }
                if (s5 === peg$FAILED) {
                    if (peg$c50.test(input.charAt(peg$currPos))) {
                        s5 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c51);
                        }
                    }
                }
                while (s5 !== peg$FAILED) {
                    s4.push(s5);
                    if (input.substr(peg$currPos, 2) === peg$c91) {
                        s5 = peg$c91;
                        peg$currPos += 2;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c92);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (peg$c50.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c51);
                            }
                        }
                    }
                }
                if (s4 !== peg$FAILED) {
                    s3 = input.substring(s3, peg$currPos);
                }
                else {
                    s3 = s4;
                }
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 39) {
                        s4 = peg$c48;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c49);
                        }
                    }
                    if (s4 === peg$FAILED) {
                        s4 = null;
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c94(s2, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseunquotedString() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c30);
            }
        }
        if (s2 !== peg$FAILED) {
            peg$savedPos = peg$currPos;
            s3 = peg$c95(s2);
            if (s3) {
                s3 = undefined;
            }
            else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 10) {
                s1 = peg$c96;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c97);
                }
            }
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        return s0;
    }
    function peg$parseescapedChar() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c30);
            }
        }
        if (s2 !== peg$FAILED) {
            peg$savedPos = peg$currPos;
            s3 = peg$c98(s2);
            if (s3) {
                s3 = undefined;
            }
            else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        return s0;
    }
    function peg$parseargNameOrNumber() {
        var s0, s1;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parseargNumber();
        if (s1 === peg$FAILED) {
            s1 = peg$parseargName();
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c99);
            }
        }
        return s0;
    }
    function peg$parsevalidTag() {
        var s0, s1;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parseargNumber();
        if (s1 === peg$FAILED) {
            s1 = peg$parsetagName();
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c100);
            }
        }
        return s0;
    }
    function peg$parseargNumber() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 48) {
            s1 = peg$c102;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c103);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c104();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (peg$c105.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c106);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                if (peg$c107.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c108);
                    }
                }
                while (s4 !== peg$FAILED) {
                    s3.push(s4);
                    if (peg$c107.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c108);
                        }
                    }
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c109(s1);
            }
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c101);
            }
        }
        return s0;
    }
    function peg$parseargName() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parsewhiteSpace();
        if (s4 === peg$FAILED) {
            s4 = peg$parsepatternSyntax();
        }
        peg$silentFails--;
        if (s4 === peg$FAILED) {
            s3 = undefined;
        }
        else {
            peg$currPos = s3;
            s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
            if (input.length > peg$currPos) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c30);
                }
            }
            if (s4 !== peg$FAILED) {
                s3 = [s3, s4];
                s2 = s3;
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s2;
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$currPos;
                s3 = peg$currPos;
                peg$silentFails++;
                s4 = peg$parsewhiteSpace();
                if (s4 === peg$FAILED) {
                    s4 = peg$parsepatternSyntax();
                }
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = undefined;
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c30);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s3 = [s3, s4];
                        s2 = s3;
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c110);
            }
        }
        return s0;
    }
    function peg$parsetagName() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        if (input.charCodeAt(peg$currPos) === 45) {
            s2 = peg$c86;
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c87);
            }
        }
        if (s2 === peg$FAILED) {
            s2 = peg$currPos;
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parsewhiteSpace();
            if (s4 === peg$FAILED) {
                s4 = peg$parsepatternSyntax();
            }
            peg$silentFails--;
            if (s4 === peg$FAILED) {
                s3 = undefined;
            }
            else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c30);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
        }
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (input.charCodeAt(peg$currPos) === 45) {
                    s2 = peg$c86;
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c87);
                    }
                }
                if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsewhiteSpace();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parsepatternSyntax();
                    }
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c30);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s3 = [s3, s4];
                            s2 = s3;
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c111);
            }
        }
        return s0;
    }
    var messageCtx = ['root'];
    function isNestedMessageText() {
        return messageCtx.length > 1;
    }
    function isInPluralOption() {
        return messageCtx[messageCtx.length - 1] === 'plural';
    }
    function insertLocation() {
        return options && options.captureLocation ? {
            location: location()
        } : {};
    }
    var ignoreTag = options && options.ignoreTag;
    var shouldParseSkeleton = options && options.shouldParseSkeleton;
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    }
    else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
            ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
            : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}
exports.pegParse = peg$parse;

},{"./skeleton":12,"./types":13,"tslib":29}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNumberSkeleton = exports.parseDateTimeSkeleton = void 0;
var tslib_1 = require("tslib");
/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */
var DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
/**
 * Parse Date time skeleton into Intl.DateTimeFormatOptions
 * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * @public
 * @param skeleton skeleton string
 */
function parseDateTimeSkeleton(skeleton) {
    var result = {};
    skeleton.replace(DATE_TIME_REGEX, function (match) {
        var len = match.length;
        switch (match[0]) {
            // Era
            case 'G':
                result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
                break;
            // Year
            case 'y':
                result.year = len === 2 ? '2-digit' : 'numeric';
                break;
            case 'Y':
            case 'u':
            case 'U':
            case 'r':
                throw new RangeError('`Y/u/U/r` (year) patterns are not supported, use `y` instead');
            // Quarter
            case 'q':
            case 'Q':
                throw new RangeError('`q/Q` (quarter) patterns are not supported');
            // Month
            case 'M':
            case 'L':
                result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][len - 1];
                break;
            // Week
            case 'w':
            case 'W':
                throw new RangeError('`w/W` (week) patterns are not supported');
            case 'd':
                result.day = ['numeric', '2-digit'][len - 1];
                break;
            case 'D':
            case 'F':
            case 'g':
                throw new RangeError('`D/F/g` (day) patterns are not supported, use `d` instead');
            // Weekday
            case 'E':
                result.weekday = len === 4 ? 'short' : len === 5 ? 'narrow' : 'short';
                break;
            case 'e':
                if (len < 4) {
                    throw new RangeError('`e..eee` (weekday) patterns are not supported');
                }
                result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
                break;
            case 'c':
                if (len < 4) {
                    throw new RangeError('`c..ccc` (weekday) patterns are not supported');
                }
                result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
                break;
            // Period
            case 'a': // AM, PM
                result.hour12 = true;
                break;
            case 'b': // am, pm, noon, midnight
            case 'B': // flexible day periods
                throw new RangeError('`b/B` (period) patterns are not supported, use `a` instead');
            // Hour
            case 'h':
                result.hourCycle = 'h12';
                result.hour = ['numeric', '2-digit'][len - 1];
                break;
            case 'H':
                result.hourCycle = 'h23';
                result.hour = ['numeric', '2-digit'][len - 1];
                break;
            case 'K':
                result.hourCycle = 'h11';
                result.hour = ['numeric', '2-digit'][len - 1];
                break;
            case 'k':
                result.hourCycle = 'h24';
                result.hour = ['numeric', '2-digit'][len - 1];
                break;
            case 'j':
            case 'J':
            case 'C':
                throw new RangeError('`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead');
            // Minute
            case 'm':
                result.minute = ['numeric', '2-digit'][len - 1];
                break;
            // Second
            case 's':
                result.second = ['numeric', '2-digit'][len - 1];
                break;
            case 'S':
            case 'A':
                throw new RangeError('`S/A` (second) patterns are not supported, use `s` instead');
            // Zone
            case 'z': // 1..3, 4: specific non-location format
                result.timeZoneName = len < 4 ? 'short' : 'long';
                break;
            case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
            case 'O': // 1, 4: miliseconds in day short, long
            case 'v': // 1, 4: generic non-location format
            case 'V': // 1, 2, 3, 4: time zone ID or city
            case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
            case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
                throw new RangeError('`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead');
        }
        return '';
    });
    return result;
}
exports.parseDateTimeSkeleton = parseDateTimeSkeleton;
function icuUnitToEcma(unit) {
    return unit.replace(/^(.*?)-/, '');
}
var FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g;
var SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?$/g;
function parseSignificantPrecision(str) {
    var result = {};
    str.replace(SIGNIFICANT_PRECISION_REGEX, function (_, g1, g2) {
        // @@@ case
        if (typeof g2 !== 'string') {
            result.minimumSignificantDigits = g1.length;
            result.maximumSignificantDigits = g1.length;
        }
        // @@@+ case
        else if (g2 === '+') {
            result.minimumSignificantDigits = g1.length;
        }
        // .### case
        else if (g1[0] === '#') {
            result.maximumSignificantDigits = g1.length;
        }
        // .@@## or .@@@ case
        else {
            result.minimumSignificantDigits = g1.length;
            result.maximumSignificantDigits =
                g1.length + (typeof g2 === 'string' ? g2.length : 0);
        }
        return '';
    });
    return result;
}
function parseSign(str) {
    switch (str) {
        case 'sign-auto':
            return {
                signDisplay: 'auto',
            };
        case 'sign-accounting':
            return {
                currencySign: 'accounting',
            };
        case 'sign-always':
            return {
                signDisplay: 'always',
            };
        case 'sign-accounting-always':
            return {
                signDisplay: 'always',
                currencySign: 'accounting',
            };
        case 'sign-except-zero':
            return {
                signDisplay: 'exceptZero',
            };
        case 'sign-accounting-except-zero':
            return {
                signDisplay: 'exceptZero',
                currencySign: 'accounting',
            };
        case 'sign-never':
            return {
                signDisplay: 'never',
            };
    }
}
function parseNotationOptions(opt) {
    var result = {};
    var signOpts = parseSign(opt);
    if (signOpts) {
        return signOpts;
    }
    return result;
}
/**
 * https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#skeleton-stems-and-options
 */
function parseNumberSkeleton(tokens) {
    var result = {};
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        switch (token.stem) {
            case 'percent':
                result.style = 'percent';
                continue;
            case 'currency':
                result.style = 'currency';
                result.currency = token.options[0];
                continue;
            case 'group-off':
                result.useGrouping = false;
                continue;
            case 'precision-integer':
            case '.':
                result.maximumFractionDigits = 0;
                continue;
            case 'measure-unit':
                result.style = 'unit';
                result.unit = icuUnitToEcma(token.options[0]);
                continue;
            case 'compact-short':
                result.notation = 'compact';
                result.compactDisplay = 'short';
                continue;
            case 'compact-long':
                result.notation = 'compact';
                result.compactDisplay = 'long';
                continue;
            case 'scientific':
                result = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, result), { notation: 'scientific' }), token.options.reduce(function (all, opt) { return (tslib_1.__assign(tslib_1.__assign({}, all), parseNotationOptions(opt))); }, {}));
                continue;
            case 'engineering':
                result = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, result), { notation: 'engineering' }), token.options.reduce(function (all, opt) { return (tslib_1.__assign(tslib_1.__assign({}, all), parseNotationOptions(opt))); }, {}));
                continue;
            case 'notation-simple':
                result.notation = 'standard';
                continue;
            // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
            case 'unit-width-narrow':
                result.currencyDisplay = 'narrowSymbol';
                result.unitDisplay = 'narrow';
                continue;
            case 'unit-width-short':
                result.currencyDisplay = 'code';
                result.unitDisplay = 'short';
                continue;
            case 'unit-width-full-name':
                result.currencyDisplay = 'name';
                result.unitDisplay = 'long';
                continue;
            case 'unit-width-iso-code':
                result.currencyDisplay = 'symbol';
                continue;
        }
        // Precision
        // https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#fraction-precision
        // precision-integer case
        if (FRACTION_PRECISION_REGEX.test(token.stem)) {
            if (token.options.length > 1) {
                throw new RangeError('Fraction-precision stems only accept a single optional option');
            }
            token.stem.replace(FRACTION_PRECISION_REGEX, function (_, g1, g2, g3, g4, g5) {
                // .000* case (before ICU67 it was .000+)
                if (g2 === '*') {
                    result.minimumFractionDigits = g1.length;
                }
                // .### case
                else if (g3 && g3[0] === '#') {
                    result.maximumFractionDigits = g3.length;
                }
                // .00## case
                else if (g4 && g5) {
                    result.minimumFractionDigits = g4.length;
                    result.maximumFractionDigits = g4.length + g5.length;
                }
                else {
                    result.minimumFractionDigits = g1.length;
                    result.maximumFractionDigits = g1.length;
                }
                return '';
            });
            if (token.options.length) {
                result = tslib_1.__assign(tslib_1.__assign({}, result), parseSignificantPrecision(token.options[0]));
            }
            continue;
        }
        if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
            result = tslib_1.__assign(tslib_1.__assign({}, result), parseSignificantPrecision(token.stem));
            continue;
        }
        var signOpts = parseSign(token.stem);
        if (signOpts) {
            result = tslib_1.__assign(tslib_1.__assign({}, result), signOpts);
        }
    }
    return result;
}
exports.parseNumberSkeleton = parseNumberSkeleton;

},{"tslib":29}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNumberElement = exports.createLiteralElement = exports.isDateTimeSkeleton = exports.isNumberSkeleton = exports.isTagElement = exports.isPoundElement = exports.isPluralElement = exports.isSelectElement = exports.isTimeElement = exports.isDateElement = exports.isNumberElement = exports.isArgumentElement = exports.isLiteralElement = exports.SKELETON_TYPE = exports.TYPE = void 0;
var TYPE;
(function (TYPE) {
    /**
     * Raw text
     */
    TYPE[TYPE["literal"] = 0] = "literal";
    /**
     * Variable w/o any format, e.g `var` in `this is a {var}`
     */
    TYPE[TYPE["argument"] = 1] = "argument";
    /**
     * Variable w/ number format
     */
    TYPE[TYPE["number"] = 2] = "number";
    /**
     * Variable w/ date format
     */
    TYPE[TYPE["date"] = 3] = "date";
    /**
     * Variable w/ time format
     */
    TYPE[TYPE["time"] = 4] = "time";
    /**
     * Variable w/ select format
     */
    TYPE[TYPE["select"] = 5] = "select";
    /**
     * Variable w/ plural format
     */
    TYPE[TYPE["plural"] = 6] = "plural";
    /**
     * Only possible within plural argument.
     * This is the `#` symbol that will be substituted with the count.
     */
    TYPE[TYPE["pound"] = 7] = "pound";
    /**
     * XML-like tag
     */
    TYPE[TYPE["tag"] = 8] = "tag";
})(TYPE = exports.TYPE || (exports.TYPE = {}));
var SKELETON_TYPE;
(function (SKELETON_TYPE) {
    SKELETON_TYPE[SKELETON_TYPE["number"] = 0] = "number";
    SKELETON_TYPE[SKELETON_TYPE["dateTime"] = 1] = "dateTime";
})(SKELETON_TYPE = exports.SKELETON_TYPE || (exports.SKELETON_TYPE = {}));
/**
 * Type Guards
 */
function isLiteralElement(el) {
    return el.type === TYPE.literal;
}
exports.isLiteralElement = isLiteralElement;
function isArgumentElement(el) {
    return el.type === TYPE.argument;
}
exports.isArgumentElement = isArgumentElement;
function isNumberElement(el) {
    return el.type === TYPE.number;
}
exports.isNumberElement = isNumberElement;
function isDateElement(el) {
    return el.type === TYPE.date;
}
exports.isDateElement = isDateElement;
function isTimeElement(el) {
    return el.type === TYPE.time;
}
exports.isTimeElement = isTimeElement;
function isSelectElement(el) {
    return el.type === TYPE.select;
}
exports.isSelectElement = isSelectElement;
function isPluralElement(el) {
    return el.type === TYPE.plural;
}
exports.isPluralElement = isPluralElement;
function isPoundElement(el) {
    return el.type === TYPE.pound;
}
exports.isPoundElement = isPoundElement;
function isTagElement(el) {
    return el.type === TYPE.tag;
}
exports.isTagElement = isTagElement;
function isNumberSkeleton(el) {
    return !!(el && typeof el === 'object' && el.type === 0 /* number */);
}
exports.isNumberSkeleton = isNumberSkeleton;
function isDateTimeSkeleton(el) {
    return !!(el && typeof el === 'object' && el.type === 1 /* dateTime */);
}
exports.isDateTimeSkeleton = isDateTimeSkeleton;
function createLiteralElement(value) {
    return {
        type: TYPE.literal,
        value: value,
    };
}
exports.createLiteralElement = createLiteralElement;
function createNumberElement(value, style) {
    return {
        type: TYPE.number,
        value: value,
        style: style,
    };
}
exports.createNumberElement = createNumberElement;

},{}],14:[function(require,module,exports){
"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("./src/core");
tslib_1.__exportStar(require("./src/formatters"), exports);
tslib_1.__exportStar(require("./src/core"), exports);
tslib_1.__exportStar(require("./src/error"), exports);
exports.default = core_1.IntlMessageFormat;

},{"./src/core":15,"./src/error":16,"./src/formatters":17,"tslib":29}],15:[function(require,module,exports){
"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntlMessageFormat = void 0;
var tslib_1 = require("tslib");
var intl_messageformat_parser_1 = require("intl-messageformat-parser");
var memoize = tslib_1.__importStar(require("fast-memoize"));
var formatters_1 = require("./formatters");
// -- MessageFormat --------------------------------------------------------
function mergeConfig(c1, c2) {
    if (!c2) {
        return c1;
    }
    return tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, (c1 || {})), (c2 || {})), Object.keys(c1).reduce(function (all, k) {
        all[k] = tslib_1.__assign(tslib_1.__assign({}, c1[k]), (c2[k] || {}));
        return all;
    }, {}));
}
function mergeConfigs(defaultConfig, configs) {
    if (!configs) {
        return defaultConfig;
    }
    return Object.keys(defaultConfig).reduce(function (all, k) {
        all[k] = mergeConfig(defaultConfig[k], configs[k]);
        return all;
    }, tslib_1.__assign({}, defaultConfig));
}
function createFastMemoizeCache(store) {
    return {
        create: function () {
            return {
                has: function (key) {
                    return key in store;
                },
                get: function (key) {
                    return store[key];
                },
                set: function (key, value) {
                    store[key] = value;
                },
            };
        },
    };
}
// @ts-ignore this is to deal with rollup's default import shenanigans
var _memoizeIntl = memoize.default || memoize;
var memoizeIntl = _memoizeIntl;
function createDefaultFormatters(cache) {
    if (cache === void 0) { cache = {
        number: {},
        dateTime: {},
        pluralRules: {},
    }; }
    return {
        getNumberFormat: memoizeIntl(function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.NumberFormat).bind.apply(_a, tslib_1.__spreadArrays([void 0], args)))();
        }, {
            cache: createFastMemoizeCache(cache.number),
            strategy: memoizeIntl.strategies.variadic,
        }),
        getDateTimeFormat: memoizeIntl(function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.DateTimeFormat).bind.apply(_a, tslib_1.__spreadArrays([void 0], args)))();
        }, {
            cache: createFastMemoizeCache(cache.dateTime),
            strategy: memoizeIntl.strategies.variadic,
        }),
        getPluralRules: memoizeIntl(function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new ((_a = Intl.PluralRules).bind.apply(_a, tslib_1.__spreadArrays([void 0], args)))();
        }, {
            cache: createFastMemoizeCache(cache.pluralRules),
            strategy: memoizeIntl.strategies.variadic,
        }),
    };
}
var IntlMessageFormat = /** @class */ (function () {
    function IntlMessageFormat(message, locales, overrideFormats, opts) {
        var _this = this;
        if (locales === void 0) { locales = IntlMessageFormat.defaultLocale; }
        this.formatterCache = {
            number: {},
            dateTime: {},
            pluralRules: {},
        };
        this.format = function (values) {
            var parts = _this.formatToParts(values);
            // Hot path for straight simple msg translations
            if (parts.length === 1) {
                return parts[0].value;
            }
            var result = parts.reduce(function (all, part) {
                if (!all.length ||
                    part.type !== 0 /* literal */ ||
                    typeof all[all.length - 1] !== 'string') {
                    all.push(part.value);
                }
                else {
                    all[all.length - 1] += part.value;
                }
                return all;
            }, []);
            if (result.length <= 1) {
                return result[0] || '';
            }
            return result;
        };
        this.formatToParts = function (values) {
            return formatters_1.formatToParts(_this.ast, _this.locales, _this.formatters, _this.formats, values, undefined, _this.message);
        };
        this.resolvedOptions = function () { return ({
            locale: Intl.NumberFormat.supportedLocalesOf(_this.locales)[0],
        }); };
        this.getAst = function () { return _this.ast; };
        if (typeof message === 'string') {
            this.message = message;
            if (!IntlMessageFormat.__parse) {
                throw new TypeError('IntlMessageFormat.__parse must be set to process `message` of type `string`');
            }
            // Parse string messages into an AST.
            this.ast = IntlMessageFormat.__parse(message, {
                normalizeHashtagInPlural: false,
                ignoreTag: opts === null || opts === void 0 ? void 0 : opts.ignoreTag,
            });
        }
        else {
            this.ast = message;
        }
        if (!Array.isArray(this.ast)) {
            throw new TypeError('A message must be provided as a String or AST.');
        }
        // Creates a new object with the specified `formats` merged with the default
        // formats.
        this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);
        // Defined first because it's used to build the format pattern.
        this.locales = locales;
        this.formatters =
            (opts && opts.formatters) || createDefaultFormatters(this.formatterCache);
    }
    Object.defineProperty(IntlMessageFormat, "defaultLocale", {
        get: function () {
            if (!IntlMessageFormat.memoizedDefaultLocale) {
                IntlMessageFormat.memoizedDefaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
            }
            return IntlMessageFormat.memoizedDefaultLocale;
        },
        enumerable: false,
        configurable: true
    });
    IntlMessageFormat.memoizedDefaultLocale = null;
    IntlMessageFormat.__parse = intl_messageformat_parser_1.parse;
    // Default format options used as the prototype of the `formats` provided to the
    // constructor. These are used when constructing the internal Intl.NumberFormat
    // and Intl.DateTimeFormat instances.
    IntlMessageFormat.formats = {
        number: {
            currency: {
                style: 'currency',
            },
            percent: {
                style: 'percent',
            },
        },
        date: {
            short: {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
            },
            medium: {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            },
            long: {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            },
            full: {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            },
        },
        time: {
            short: {
                hour: 'numeric',
                minute: 'numeric',
            },
            medium: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
            },
            long: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short',
            },
            full: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short',
            },
        },
    };
    return IntlMessageFormat;
}());
exports.IntlMessageFormat = IntlMessageFormat;

},{"./formatters":17,"fast-memoize":4,"intl-messageformat-parser":9,"tslib":29}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingValueError = exports.InvalidValueTypeError = exports.InvalidValueError = exports.FormatError = exports.ErrorCode = void 0;
var tslib_1 = require("tslib");
var ErrorCode;
(function (ErrorCode) {
    // When we have a placeholder but no value to format
    ErrorCode["MISSING_VALUE"] = "MISSING_VALUE";
    // When value supplied is invalid
    ErrorCode["INVALID_VALUE"] = "INVALID_VALUE";
    // When we need specific Intl API but it's not available
    ErrorCode["MISSING_INTL_API"] = "MISSING_INTL_API";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
var FormatError = /** @class */ (function (_super) {
    tslib_1.__extends(FormatError, _super);
    function FormatError(msg, code, originalMessage) {
        var _this = _super.call(this, msg) || this;
        _this.code = code;
        _this.originalMessage = originalMessage;
        return _this;
    }
    FormatError.prototype.toString = function () {
        return "[formatjs Error: " + this.code + "] " + this.message;
    };
    return FormatError;
}(Error));
exports.FormatError = FormatError;
var InvalidValueError = /** @class */ (function (_super) {
    tslib_1.__extends(InvalidValueError, _super);
    function InvalidValueError(variableId, value, options, originalMessage) {
        return _super.call(this, "Invalid values for \"" + variableId + "\": \"" + value + "\". Options are \"" + Object.keys(options).join('", "') + "\"", "INVALID_VALUE" /* INVALID_VALUE */, originalMessage) || this;
    }
    return InvalidValueError;
}(FormatError));
exports.InvalidValueError = InvalidValueError;
var InvalidValueTypeError = /** @class */ (function (_super) {
    tslib_1.__extends(InvalidValueTypeError, _super);
    function InvalidValueTypeError(value, type, originalMessage) {
        return _super.call(this, "Value for \"" + value + "\" must be of type " + type, "INVALID_VALUE" /* INVALID_VALUE */, originalMessage) || this;
    }
    return InvalidValueTypeError;
}(FormatError));
exports.InvalidValueTypeError = InvalidValueTypeError;
var MissingValueError = /** @class */ (function (_super) {
    tslib_1.__extends(MissingValueError, _super);
    function MissingValueError(variableId, originalMessage) {
        return _super.call(this, "The intl string context variable \"" + variableId + "\" was not provided to the string \"" + originalMessage + "\"", "MISSING_VALUE" /* MISSING_VALUE */, originalMessage) || this;
    }
    return MissingValueError;
}(FormatError));
exports.MissingValueError = MissingValueError;

},{"tslib":29}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToParts = exports.isFormatXMLElementFn = exports.PART_TYPE = void 0;
var intl_messageformat_parser_1 = require("intl-messageformat-parser");
var error_1 = require("./error");
var PART_TYPE;
(function (PART_TYPE) {
    PART_TYPE[PART_TYPE["literal"] = 0] = "literal";
    PART_TYPE[PART_TYPE["object"] = 1] = "object";
})(PART_TYPE = exports.PART_TYPE || (exports.PART_TYPE = {}));
function mergeLiteral(parts) {
    if (parts.length < 2) {
        return parts;
    }
    return parts.reduce(function (all, part) {
        var lastPart = all[all.length - 1];
        if (!lastPart ||
            lastPart.type !== 0 /* literal */ ||
            part.type !== 0 /* literal */) {
            all.push(part);
        }
        else {
            lastPart.value += part.value;
        }
        return all;
    }, []);
}
function isFormatXMLElementFn(el) {
    return typeof el === 'function';
}
exports.isFormatXMLElementFn = isFormatXMLElementFn;
// TODO(skeleton): add skeleton support
function formatToParts(els, locales, formatters, formats, values, currentPluralValue, 
// For debugging
originalMessage) {
    // Hot path for straight simple msg translations
    if (els.length === 1 && intl_messageformat_parser_1.isLiteralElement(els[0])) {
        return [
            {
                type: 0 /* literal */,
                value: els[0].value,
            },
        ];
    }
    var result = [];
    for (var _i = 0, els_1 = els; _i < els_1.length; _i++) {
        var el = els_1[_i];
        // Exit early for string parts.
        if (intl_messageformat_parser_1.isLiteralElement(el)) {
            result.push({
                type: 0 /* literal */,
                value: el.value,
            });
            continue;
        }
        // TODO: should this part be literal type?
        // Replace `#` in plural rules with the actual numeric value.
        if (intl_messageformat_parser_1.isPoundElement(el)) {
            if (typeof currentPluralValue === 'number') {
                result.push({
                    type: 0 /* literal */,
                    value: formatters.getNumberFormat(locales).format(currentPluralValue),
                });
            }
            continue;
        }
        var varName = el.value;
        // Enforce that all required values are provided by the caller.
        if (!(values && varName in values)) {
            throw new error_1.MissingValueError(varName, originalMessage);
        }
        var value = values[varName];
        if (intl_messageformat_parser_1.isArgumentElement(el)) {
            if (!value || typeof value === 'string' || typeof value === 'number') {
                value =
                    typeof value === 'string' || typeof value === 'number'
                        ? String(value)
                        : '';
            }
            result.push({
                type: typeof value === 'string' ? 0 /* literal */ : 1 /* object */,
                value: value,
            });
            continue;
        }
        // Recursively format plural and select parts' option — which can be a
        // nested pattern structure. The choosing of the option to use is
        // abstracted-by and delegated-to the part helper object.
        if (intl_messageformat_parser_1.isDateElement(el)) {
            var style = typeof el.style === 'string'
                ? formats.date[el.style]
                : intl_messageformat_parser_1.isDateTimeSkeleton(el.style)
                    ? el.style.parsedOptions
                    : undefined;
            result.push({
                type: 0 /* literal */,
                value: formatters
                    .getDateTimeFormat(locales, style)
                    .format(value),
            });
            continue;
        }
        if (intl_messageformat_parser_1.isTimeElement(el)) {
            var style = typeof el.style === 'string'
                ? formats.time[el.style]
                : intl_messageformat_parser_1.isDateTimeSkeleton(el.style)
                    ? el.style.parsedOptions
                    : undefined;
            result.push({
                type: 0 /* literal */,
                value: formatters
                    .getDateTimeFormat(locales, style)
                    .format(value),
            });
            continue;
        }
        if (intl_messageformat_parser_1.isNumberElement(el)) {
            var style = typeof el.style === 'string'
                ? formats.number[el.style]
                : intl_messageformat_parser_1.isNumberSkeleton(el.style)
                    ? el.style.parsedOptions
                    : undefined;
            result.push({
                type: 0 /* literal */,
                value: formatters
                    .getNumberFormat(locales, style)
                    .format(value),
            });
            continue;
        }
        if (intl_messageformat_parser_1.isTagElement(el)) {
            var children = el.children, value_1 = el.value;
            var formatFn = values[value_1];
            if (!isFormatXMLElementFn(formatFn)) {
                throw new error_1.InvalidValueTypeError(value_1, 'function', originalMessage);
            }
            var parts = formatToParts(children, locales, formatters, formats, values, currentPluralValue);
            var chunks = formatFn(parts.map(function (p) { return p.value; }));
            if (!Array.isArray(chunks)) {
                chunks = [chunks];
            }
            result.push.apply(result, chunks.map(function (c) {
                return {
                    type: typeof c === 'string' ? 0 /* literal */ : 1 /* object */,
                    value: c,
                };
            }));
        }
        if (intl_messageformat_parser_1.isSelectElement(el)) {
            var opt = el.options[value] || el.options.other;
            if (!opt) {
                throw new error_1.InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
            }
            result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values));
            continue;
        }
        if (intl_messageformat_parser_1.isPluralElement(el)) {
            var opt = el.options["=" + value];
            if (!opt) {
                if (!Intl.PluralRules) {
                    throw new error_1.FormatError("Intl.PluralRules is not available in this environment.\nTry polyfilling it using \"@formatjs/intl-pluralrules\"\n", "MISSING_INTL_API" /* MISSING_INTL_API */, originalMessage);
                }
                var rule = formatters
                    .getPluralRules(locales, { type: el.pluralType })
                    .select(value - (el.offset || 0));
                opt = el.options[rule] || el.options.other;
            }
            if (!opt) {
                throw new error_1.InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
            }
            result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values, value - (el.offset || 0)));
            continue;
        }
    }
    return mergeLiteral(result);
}
exports.formatToParts = formatToParts;

},{"./error":16,"intl-messageformat-parser":9}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
function daysToYears(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return (days * 400) / 146097;
}
// Thanks to date-fns
// https://github.com/date-fns/date-fns
// MIT © Sasha Koss
var MILLISECONDS_IN_MINUTE = 60000;
var MILLISECONDS_IN_DAY = 86400000;
function startOfDay(dirtyDate) {
    var date = new Date(dirtyDate);
    date.setHours(0, 0, 0, 0);
    return date;
}
function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight) {
    var startOfDayLeft = startOfDay(dirtyDateLeft);
    var startOfDayRight = startOfDay(dirtyDateRight);
    var timestampLeft = startOfDayLeft.getTime() -
        startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
    var timestampRight = startOfDayRight.getTime() -
        startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
    // Round the number of days to the nearest integer
    // because the number of milliseconds in a day is not constant
    // (e.g. it's different in the day of the daylight saving time clock shift)
    return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
}
function diff(from, to) {
    // Convert to ms timestamps.
    from = +from;
    to = +to;
    var millisecond = Math.round(to - from), second = Math.round(millisecond / 1000), minute = Math.round(second / 60), hour = Math.round(minute / 60);
    // We expect a more precision in rounding when dealing with
    // days as it feels wrong when something happended 13 hours ago and
    // is regarded as "yesterday" even if the time was this morning.
    var day = differenceInCalendarDays(to, from);
    var week = Math.round(day / 7);
    var rawYears = daysToYears(day), month = Math.round(rawYears * 12), year = Math.round(rawYears);
    return {
        second: second,
        'second-short': second,
        'second-narrow': second,
        minute: minute,
        'minute-short': minute,
        'minute-narrow': minute,
        hour: hour,
        'hour-short': hour,
        'hour-narrow': hour,
        day: day,
        'day-short': day,
        'day-narrow': day,
        week: week,
        'week-short': week,
        'week-narrow': week,
        month: month,
        'month-short': month,
        'month-narrow': month,
        year: year,
        'year-short': year,
        'year-narrow': year
    };
}
exports.default = diff;

},{}],19:[function(require,module,exports){
"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var diff_1 = require("./diff");
// -----------------------------------------------------------------------------
var SUPPORTED_FIELDS = [
    "second" /* second */,
    "second-short" /* secondShort */,
    "minute" /* minute */,
    "minute-short" /* minuteShort */,
    "hour" /* hour */,
    "hour-short" /* hourShort */,
    "day" /* day */,
    "day-short" /* dayShort */,
    "month" /* month */,
    "month-short" /* monthShort */,
    "year" /* year */,
    "year-short" /* yearShort */
];
function isValidUnits(units) {
    if (!units || ~SUPPORTED_FIELDS.indexOf(units)) {
        return true;
    }
    if (typeof units === 'string') {
        var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
        if (suggestion &&
            ~SUPPORTED_FIELDS.indexOf(suggestion)) {
            throw new Error("\"" + units + "\" is not a valid IntlRelativeFormat 'units' value, did you mean: " + suggestion);
        }
    }
    throw new Error("\"" + units + "\" is not a valid IntlRelativeFormat 'units' value, it must be one of: " + SUPPORTED_FIELDS.join('", "'));
}
function resolveStyle(style) {
    // Default to "best fit" style.
    if (!style) {
        return "best fit" /* bestFit */;
    }
    if (style === 'best fit' || style === 'numeric') {
        return style;
    }
    throw new Error("\"" + style + "\" is not a valid IntlRelativeFormat 'style' value, it must be one of: 'best fit' or 'numeric'");
}
function selectUnits(diffReport) {
    var fields = SUPPORTED_FIELDS.filter(function (field) {
        return field.indexOf('-short') < 1;
    });
    var units = fields[0];
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
        units = fields_1[_i];
        if (Math.abs(diffReport[units]) < RelativeFormat.thresholds[units]) {
            break;
        }
    }
    return units;
}
var RelativeFormat = (function (locales, options) {
    if (options === void 0) { options = {}; }
    var resolvedOptions = {
        style: resolveStyle(options.style),
        units: isValidUnits(options.units) && options.units
    };
    var numeric = resolvedOptions.style === 'best fit' ? 'auto' : 'always';
    var rtf = new Intl.RelativeTimeFormat(locales, {
        numeric: numeric
    });
    return {
        format: function (date, options) {
            var now = options && options.now !== undefined
                ? options.now === null
                    ? 0
                    : options.now
                : Date.now();
            if (date === undefined) {
                date = now;
            }
            // Determine if the `date` and optional `now` values are valid, and throw a
            // similar error to what `Intl.DateTimeFormat#format()` would throw.
            if (!isFinite(now)) {
                throw new RangeError('The `now` option provided to IntlRelativeFormat#format() is not ' +
                    'in valid range.');
            }
            if (!isFinite(date)) {
                throw new RangeError('The date value provided to IntlRelativeFormat#format() is not ' +
                    'in valid range.');
            }
            var diffReport = diff_1.default(now, date);
            var units = resolvedOptions.units || selectUnits(diffReport);
            var diffInUnits = diffReport[units];
            var style = units.substring(units.length - 6, units.length) === '-short'
                ? 'narrow'
                : 'long';
            var rtfUnit = units.replace('-short', '');
            return new Intl.RelativeTimeFormat(locales, {
                numeric: numeric,
                style: style
            }).format(diffInUnits, rtfUnit);
        },
        resolvedOptions: function () {
            return {
                locale: rtf.resolvedOptions().locale,
                style: resolvedOptions.style,
                units: resolvedOptions.units
            };
        }
    };
});
// Define public `defaultLocale` property which can be set by the developer, or
// it will be set when the first RelativeFormat instance is created by
// leveraging the resolved locale from `Intl`.
RelativeFormat.defaultLocale = 'en';
RelativeFormat.thresholds = {
    second: 45,
    'second-short': 45,
    minute: 45,
    'minute-short': 45,
    hour: 22,
    'hour-short': 22,
    day: 26,
    'day-short': 26,
    month: 11,
    'month-short': 11 // months to year
};
exports.default = RelativeFormat;

},{"./diff":18}],20:[function(require,module,exports){
/* jshint node:true */

'use strict';

var IntlRelativeFormat = require('./dist').default;

// Re-export `IntlRelativeFormat` as the CommonJS default exports with all the
// locale data registered, and with English set as the default locale. Define
// the `default` prop for use with other compiled ES6 Modules.
exports = module.exports = IntlRelativeFormat;
exports['default'] = exports;

},{"./dist":19}],21:[function(require,module,exports){
'use strict';

var DOCUMENT_FRAGMENT_NODE = 11;

function morphAttrs(fromNode, toNode) {
    var toNodeAttrs = toNode.attributes;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;

    // document-fragments dont have attributes so lets not do anything
    if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return;
    }

    // update attributes on original DOM element
    for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
        attr = toNodeAttrs[i];
        attrName = attr.name;
        attrNamespaceURI = attr.namespaceURI;
        attrValue = attr.value;

        if (attrNamespaceURI) {
            attrName = attr.localName || attrName;
            fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

            if (fromValue !== attrValue) {
                if (attr.prefix === 'xmlns'){
                    attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
                }
                fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
            }
        } else {
            fromValue = fromNode.getAttribute(attrName);

            if (fromValue !== attrValue) {
                fromNode.setAttribute(attrName, attrValue);
            }
        }
    }

    // Remove any extra attributes found on the original DOM element that
    // weren't found on the target element.
    var fromNodeAttrs = fromNode.attributes;

    for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
        attr = fromNodeAttrs[d];
        attrName = attr.name;
        attrNamespaceURI = attr.namespaceURI;

        if (attrNamespaceURI) {
            attrName = attr.localName || attrName;

            if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
                fromNode.removeAttributeNS(attrNamespaceURI, attrName);
            }
        } else {
            if (!toNode.hasAttribute(attrName)) {
                fromNode.removeAttribute(attrName);
            }
        }
    }
}

var range; // Create a range object for efficently rendering strings to elements.
var NS_XHTML = 'http://www.w3.org/1999/xhtml';

var doc = typeof document === 'undefined' ? undefined : document;
var HAS_TEMPLATE_SUPPORT = !!doc && 'content' in doc.createElement('template');
var HAS_RANGE_SUPPORT = !!doc && doc.createRange && 'createContextualFragment' in doc.createRange();

function createFragmentFromTemplate(str) {
    var template = doc.createElement('template');
    template.innerHTML = str;
    return template.content.childNodes[0];
}

function createFragmentFromRange(str) {
    if (!range) {
        range = doc.createRange();
        range.selectNode(doc.body);
    }

    var fragment = range.createContextualFragment(str);
    return fragment.childNodes[0];
}

function createFragmentFromWrap(str) {
    var fragment = doc.createElement('body');
    fragment.innerHTML = str;
    return fragment.childNodes[0];
}

/**
 * This is about the same
 * var html = new DOMParser().parseFromString(str, 'text/html');
 * return html.body.firstChild;
 *
 * @method toElement
 * @param {String} str
 */
function toElement(str) {
    str = str.trim();
    if (HAS_TEMPLATE_SUPPORT) {
      // avoid restrictions on content for things like `<tr><th>Hi</th></tr>` which
      // createContextualFragment doesn't support
      // <template> support not available in IE
      return createFragmentFromTemplate(str);
    } else if (HAS_RANGE_SUPPORT) {
      return createFragmentFromRange(str);
    }

    return createFragmentFromWrap(str);
}

/**
 * Returns true if two node's names are the same.
 *
 * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
 *       nodeName and different namespace URIs.
 *
 * @param {Element} a
 * @param {Element} b The target element
 * @return {boolean}
 */
function compareNodeNames(fromEl, toEl) {
    var fromNodeName = fromEl.nodeName;
    var toNodeName = toEl.nodeName;
    var fromCodeStart, toCodeStart;

    if (fromNodeName === toNodeName) {
        return true;
    }

    fromCodeStart = fromNodeName.charCodeAt(0);
    toCodeStart = toNodeName.charCodeAt(0);

    // If the target element is a virtual DOM node or SVG node then we may
    // need to normalize the tag name before comparing. Normal HTML elements that are
    // in the "http://www.w3.org/1999/xhtml"
    // are converted to upper case
    if (fromCodeStart <= 90 && toCodeStart >= 97) { // from is upper and to is lower
        return fromNodeName === toNodeName.toUpperCase();
    } else if (toCodeStart <= 90 && fromCodeStart >= 97) { // to is upper and from is lower
        return toNodeName === fromNodeName.toUpperCase();
    } else {
        return false;
    }
}

/**
 * Create an element, optionally with a known namespace URI.
 *
 * @param {string} name the element name, e.g. 'div' or 'svg'
 * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
 * its `xmlns` attribute or its inferred namespace.
 *
 * @return {Element}
 */
function createElementNS(name, namespaceURI) {
    return !namespaceURI || namespaceURI === NS_XHTML ?
        doc.createElement(name) :
        doc.createElementNS(namespaceURI, name);
}

/**
 * Copies the children of one DOM element to another DOM element
 */
function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
        var nextChild = curChild.nextSibling;
        toEl.appendChild(curChild);
        curChild = nextChild;
    }
    return toEl;
}

function syncBooleanAttrProp(fromEl, toEl, name) {
    if (fromEl[name] !== toEl[name]) {
        fromEl[name] = toEl[name];
        if (fromEl[name]) {
            fromEl.setAttribute(name, '');
        } else {
            fromEl.removeAttribute(name);
        }
    }
}

var specialElHandlers = {
    OPTION: function(fromEl, toEl) {
        var parentNode = fromEl.parentNode;
        if (parentNode) {
            var parentName = parentNode.nodeName.toUpperCase();
            if (parentName === 'OPTGROUP') {
                parentNode = parentNode.parentNode;
                parentName = parentNode && parentNode.nodeName.toUpperCase();
            }
            if (parentName === 'SELECT' && !parentNode.hasAttribute('multiple')) {
                if (fromEl.hasAttribute('selected') && !toEl.selected) {
                    // Workaround for MS Edge bug where the 'selected' attribute can only be
                    // removed if set to a non-empty value:
                    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12087679/
                    fromEl.setAttribute('selected', 'selected');
                    fromEl.removeAttribute('selected');
                }
                // We have to reset select element's selectedIndex to -1, otherwise setting
                // fromEl.selected using the syncBooleanAttrProp below has no effect.
                // The correct selectedIndex will be set in the SELECT special handler below.
                parentNode.selectedIndex = -1;
            }
        }
        syncBooleanAttrProp(fromEl, toEl, 'selected');
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
        syncBooleanAttrProp(fromEl, toEl, 'checked');
        syncBooleanAttrProp(fromEl, toEl, 'disabled');

        if (fromEl.value !== toEl.value) {
            fromEl.value = toEl.value;
        }

        if (!toEl.hasAttribute('value')) {
            fromEl.removeAttribute('value');
        }
    },

    TEXTAREA: function(fromEl, toEl) {
        var newValue = toEl.value;
        if (fromEl.value !== newValue) {
            fromEl.value = newValue;
        }

        var firstChild = fromEl.firstChild;
        if (firstChild) {
            // Needed for IE. Apparently IE sets the placeholder as the
            // node value and vise versa. This ignores an empty update.
            var oldValue = firstChild.nodeValue;

            if (oldValue == newValue || (!newValue && oldValue == fromEl.placeholder)) {
                return;
            }

            firstChild.nodeValue = newValue;
        }
    },
    SELECT: function(fromEl, toEl) {
        if (!toEl.hasAttribute('multiple')) {
            var selectedIndex = -1;
            var i = 0;
            // We have to loop through children of fromEl, not toEl since nodes can be moved
            // from toEl to fromEl directly when morphing.
            // At the time this special handler is invoked, all children have already been morphed
            // and appended to / removed from fromEl, so using fromEl here is safe and correct.
            var curChild = fromEl.firstChild;
            var optgroup;
            var nodeName;
            while(curChild) {
                nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
                if (nodeName === 'OPTGROUP') {
                    optgroup = curChild;
                    curChild = optgroup.firstChild;
                } else {
                    if (nodeName === 'OPTION') {
                        if (curChild.hasAttribute('selected')) {
                            selectedIndex = i;
                            break;
                        }
                        i++;
                    }
                    curChild = curChild.nextSibling;
                    if (!curChild && optgroup) {
                        curChild = optgroup.nextSibling;
                        optgroup = null;
                    }
                }
            }

            fromEl.selectedIndex = selectedIndex;
        }
    }
};

var ELEMENT_NODE = 1;
var DOCUMENT_FRAGMENT_NODE$1 = 11;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

function noop() {}

function defaultGetNodeKey(node) {
  if (node) {
      return (node.getAttribute && node.getAttribute('id')) || node.id;
  }
}

function morphdomFactory(morphAttrs) {

    return function morphdom(fromNode, toNode, options) {
        if (!options) {
            options = {};
        }

        if (typeof toNode === 'string') {
            if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML' || fromNode.nodeName === 'BODY') {
                var toNodeHtml = toNode;
                toNode = doc.createElement('html');
                toNode.innerHTML = toNodeHtml;
            } else {
                toNode = toElement(toNode);
            }
        }

        var getNodeKey = options.getNodeKey || defaultGetNodeKey;
        var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
        var onNodeAdded = options.onNodeAdded || noop;
        var onBeforeElUpdated = options.onBeforeElUpdated || noop;
        var onElUpdated = options.onElUpdated || noop;
        var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
        var onNodeDiscarded = options.onNodeDiscarded || noop;
        var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
        var childrenOnly = options.childrenOnly === true;

        // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
        var fromNodesLookup = Object.create(null);
        var keyedRemovalList = [];

        function addKeyedRemoval(key) {
            keyedRemovalList.push(key);
        }

        function walkDiscardedChildNodes(node, skipKeyedNodes) {
            if (node.nodeType === ELEMENT_NODE) {
                var curChild = node.firstChild;
                while (curChild) {

                    var key = undefined;

                    if (skipKeyedNodes && (key = getNodeKey(curChild))) {
                        // If we are skipping keyed nodes then we add the key
                        // to a list so that it can be handled at the very end.
                        addKeyedRemoval(key);
                    } else {
                        // Only report the node as discarded if it is not keyed. We do this because
                        // at the end we loop through all keyed elements that were unmatched
                        // and then discard them in one final pass.
                        onNodeDiscarded(curChild);
                        if (curChild.firstChild) {
                            walkDiscardedChildNodes(curChild, skipKeyedNodes);
                        }
                    }

                    curChild = curChild.nextSibling;
                }
            }
        }

        /**
         * Removes a DOM node out of the original DOM
         *
         * @param  {Node} node The node to remove
         * @param  {Node} parentNode The nodes parent
         * @param  {Boolean} skipKeyedNodes If true then elements with keys will be skipped and not discarded.
         * @return {undefined}
         */
        function removeNode(node, parentNode, skipKeyedNodes) {
            if (onBeforeNodeDiscarded(node) === false) {
                return;
            }

            if (parentNode) {
                parentNode.removeChild(node);
            }

            onNodeDiscarded(node);
            walkDiscardedChildNodes(node, skipKeyedNodes);
        }

        // // TreeWalker implementation is no faster, but keeping this around in case this changes in the future
        // function indexTree(root) {
        //     var treeWalker = document.createTreeWalker(
        //         root,
        //         NodeFilter.SHOW_ELEMENT);
        //
        //     var el;
        //     while((el = treeWalker.nextNode())) {
        //         var key = getNodeKey(el);
        //         if (key) {
        //             fromNodesLookup[key] = el;
        //         }
        //     }
        // }

        // // NodeIterator implementation is no faster, but keeping this around in case this changes in the future
        //
        // function indexTree(node) {
        //     var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
        //     var el;
        //     while((el = nodeIterator.nextNode())) {
        //         var key = getNodeKey(el);
        //         if (key) {
        //             fromNodesLookup[key] = el;
        //         }
        //     }
        // }

        function indexTree(node) {
            if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
                var curChild = node.firstChild;
                while (curChild) {
                    var key = getNodeKey(curChild);
                    if (key) {
                        fromNodesLookup[key] = curChild;
                    }

                    // Walk recursively
                    indexTree(curChild);

                    curChild = curChild.nextSibling;
                }
            }
        }

        indexTree(fromNode);

        function handleNodeAdded(el) {
            onNodeAdded(el);

            var curChild = el.firstChild;
            while (curChild) {
                var nextSibling = curChild.nextSibling;

                var key = getNodeKey(curChild);
                if (key) {
                    var unmatchedFromEl = fromNodesLookup[key];
                    // if we find a duplicate #id node in cache, replace `el` with cache value
                    // and morph it to the child node.
                    if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
                        curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
                        morphEl(unmatchedFromEl, curChild);
                    } else {
                      handleNodeAdded(curChild);
                    }
                } else {
                  // recursively call for curChild and it's children to see if we find something in
                  // fromNodesLookup
                  handleNodeAdded(curChild);
                }

                curChild = nextSibling;
            }
        }

        function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
            // We have processed all of the "to nodes". If curFromNodeChild is
            // non-null then we still have some from nodes left over that need
            // to be removed
            while (curFromNodeChild) {
                var fromNextSibling = curFromNodeChild.nextSibling;
                if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
                    // Since the node is keyed it might be matched up later so we defer
                    // the actual removal to later
                    addKeyedRemoval(curFromNodeKey);
                } else {
                    // NOTE: we skip nested keyed nodes from being removed since there is
                    //       still a chance they will be matched up later
                    removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                }
                curFromNodeChild = fromNextSibling;
            }
        }

        function morphEl(fromEl, toEl, childrenOnly) {
            var toElKey = getNodeKey(toEl);

            if (toElKey) {
                // If an element with an ID is being morphed then it will be in the final
                // DOM so clear it out of the saved elements collection
                delete fromNodesLookup[toElKey];
            }

            if (!childrenOnly) {
                // optional
                if (onBeforeElUpdated(fromEl, toEl) === false) {
                    return;
                }

                // update attributes on original DOM element first
                morphAttrs(fromEl, toEl);
                // optional
                onElUpdated(fromEl);

                if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
                    return;
                }
            }

            if (fromEl.nodeName !== 'TEXTAREA') {
              morphChildren(fromEl, toEl);
            } else {
              specialElHandlers.TEXTAREA(fromEl, toEl);
            }
        }

        function morphChildren(fromEl, toEl) {
            var curToNodeChild = toEl.firstChild;
            var curFromNodeChild = fromEl.firstChild;
            var curToNodeKey;
            var curFromNodeKey;

            var fromNextSibling;
            var toNextSibling;
            var matchingFromEl;

            // walk the children
            outer: while (curToNodeChild) {
                toNextSibling = curToNodeChild.nextSibling;
                curToNodeKey = getNodeKey(curToNodeChild);

                // walk the fromNode children all the way through
                while (curFromNodeChild) {
                    fromNextSibling = curFromNodeChild.nextSibling;

                    if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    curFromNodeKey = getNodeKey(curFromNodeChild);

                    var curFromNodeType = curFromNodeChild.nodeType;

                    // this means if the curFromNodeChild doesnt have a match with the curToNodeChild
                    var isCompatible = undefined;

                    if (curFromNodeType === curToNodeChild.nodeType) {
                        if (curFromNodeType === ELEMENT_NODE) {
                            // Both nodes being compared are Element nodes

                            if (curToNodeKey) {
                                // The target node has a key so we want to match it up with the correct element
                                // in the original DOM tree
                                if (curToNodeKey !== curFromNodeKey) {
                                    // The current element in the original DOM tree does not have a matching key so
                                    // let's check our lookup to see if there is a matching element in the original
                                    // DOM tree
                                    if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                                        if (fromNextSibling === matchingFromEl) {
                                            // Special case for single element removals. To avoid removing the original
                                            // DOM node out of the tree (since that can break CSS transitions, etc.),
                                            // we will instead discard the current node and wait until the next
                                            // iteration to properly match up the keyed target element with its matching
                                            // element in the original tree
                                            isCompatible = false;
                                        } else {
                                            // We found a matching keyed element somewhere in the original DOM tree.
                                            // Let's move the original DOM node into the current position and morph
                                            // it.

                                            // NOTE: We use insertBefore instead of replaceChild because we want to go through
                                            // the `removeNode()` function for the node that is being discarded so that
                                            // all lifecycle hooks are correctly invoked
                                            fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                                            // fromNextSibling = curFromNodeChild.nextSibling;

                                            if (curFromNodeKey) {
                                                // Since the node is keyed it might be matched up later so we defer
                                                // the actual removal to later
                                                addKeyedRemoval(curFromNodeKey);
                                            } else {
                                                // NOTE: we skip nested keyed nodes from being removed since there is
                                                //       still a chance they will be matched up later
                                                removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                                            }

                                            curFromNodeChild = matchingFromEl;
                                        }
                                    } else {
                                        // The nodes are not compatible since the "to" node has a key and there
                                        // is no matching keyed node in the source tree
                                        isCompatible = false;
                                    }
                                }
                            } else if (curFromNodeKey) {
                                // The original has a key
                                isCompatible = false;
                            }

                            isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                            if (isCompatible) {
                                // We found compatible DOM elements so transform
                                // the current "from" node to match the current
                                // target DOM node.
                                // MORPH
                                morphEl(curFromNodeChild, curToNodeChild);
                            }

                        } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                            // Both nodes being compared are Text or Comment nodes
                            isCompatible = true;
                            // Simply update nodeValue on the original node to
                            // change the text value
                            if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                                curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                            }

                        }
                    }

                    if (isCompatible) {
                        // Advance both the "to" child and the "from" child since we found a match
                        // Nothing else to do as we already recursively called morphChildren above
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    // No compatible match so remove the old node from the DOM and continue trying to find a
                    // match in the original DOM. However, we only do this if the from node is not keyed
                    // since it is possible that a keyed node might match up with a node somewhere else in the
                    // target tree and we don't want to discard it just yet since it still might find a
                    // home in the final DOM tree. After everything is done we will remove any keyed nodes
                    // that didn't find a home
                    if (curFromNodeKey) {
                        // Since the node is keyed it might be matched up later so we defer
                        // the actual removal to later
                        addKeyedRemoval(curFromNodeKey);
                    } else {
                        // NOTE: we skip nested keyed nodes from being removed since there is
                        //       still a chance they will be matched up later
                        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                    }

                    curFromNodeChild = fromNextSibling;
                } // END: while(curFromNodeChild) {}

                // If we got this far then we did not find a candidate match for
                // our "to node" and we exhausted all of the children "from"
                // nodes. Therefore, we will just append the current "to" node
                // to the end
                if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
                    fromEl.appendChild(matchingFromEl);
                    // MORPH
                    morphEl(matchingFromEl, curToNodeChild);
                } else {
                    var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
                    if (onBeforeNodeAddedResult !== false) {
                        if (onBeforeNodeAddedResult) {
                            curToNodeChild = onBeforeNodeAddedResult;
                        }

                        if (curToNodeChild.actualize) {
                            curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
                        }
                        fromEl.appendChild(curToNodeChild);
                        handleNodeAdded(curToNodeChild);
                    }
                }

                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
            }

            cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);

            var specialElHandler = specialElHandlers[fromEl.nodeName];
            if (specialElHandler) {
                specialElHandler(fromEl, toEl);
            }
        } // END: morphChildren(...)

        var morphedNode = fromNode;
        var morphedNodeType = morphedNode.nodeType;
        var toNodeType = toNode.nodeType;

        if (!childrenOnly) {
            // Handle the case where we are given two DOM nodes that are not
            // compatible (e.g. <div> --> <span> or <div> --> TEXT)
            if (morphedNodeType === ELEMENT_NODE) {
                if (toNodeType === ELEMENT_NODE) {
                    if (!compareNodeNames(fromNode, toNode)) {
                        onNodeDiscarded(fromNode);
                        morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
                    }
                } else {
                    // Going from an element node to a text node
                    morphedNode = toNode;
                }
            } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
                if (toNodeType === morphedNodeType) {
                    if (morphedNode.nodeValue !== toNode.nodeValue) {
                        morphedNode.nodeValue = toNode.nodeValue;
                    }

                    return morphedNode;
                } else {
                    // Text node to something else
                    morphedNode = toNode;
                }
            }
        }

        if (morphedNode === toNode) {
            // The "to node" was not compatible with the "from node" so we had to
            // toss out the "from node" and use the "to node"
            onNodeDiscarded(fromNode);
        } else {
            if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
                return;
            }

            morphEl(morphedNode, toNode, childrenOnly);

            // We now need to loop over any keyed nodes that might need to be
            // removed. We only do the removal if we know that the keyed node
            // never found a match. When a keyed node is matched up we remove
            // it out of fromNodesLookup and we use fromNodesLookup to determine
            // if a keyed node has been matched up or not
            if (keyedRemovalList) {
                for (var i=0, len=keyedRemovalList.length; i<len; i++) {
                    var elToRemove = fromNodesLookup[keyedRemovalList[i]];
                    if (elToRemove) {
                        removeNode(elToRemove, elToRemove.parentNode, false);
                    }
                }
            }
        }

        if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
            if (morphedNode.actualize) {
                morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
            }
            // If we had to swap out the from node with a new node because the old
            // node was not compatible with the target node then we need to
            // replace the old DOM node in the original DOM tree. This is only
            // possible if the original DOM node was part of a DOM tree which
            // we know is the case if it has a parent node.
            fromNode.parentNode.replaceChild(morphedNode, fromNode);
        }

        return morphedNode;
    };
}

var morphdom = morphdomFactory(morphAttrs);

module.exports = morphdom;

},{}],22:[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],23:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var assert = require('assert')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  if (document.body) {
    beginObserve(observer)
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      beginObserve(observer)
    })
  }
}

function beginObserve (observer) {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  assert(document.body, 'on-load: will not work prior to DOMContentLoaded')
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

module.exports.KEY_ATTR = KEY_ATTR
module.exports.KEY_ID = KEY_ID

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  if (watch[mutation.oldValue]) {
    off(mutation.oldValue, mutation.target)
  }
  if (watch[newValue]) {
    on(newValue, mutation.target)
  }
}

function sameOrigin (oldValue, newValue) {
  if (!oldValue || !newValue) return false
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"assert":22,"global/document":5,"global/window":6}],24:[function(require,module,exports){
(function (process){(function (){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.page = factory());
}(this, (function () { 'use strict';

var isarray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

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
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {String} str
 * @return {Array}
 */
function parse (str) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var suffix = res[6];
    var asterisk = res[7];

    var repeat = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';
    var delimiter = prefix || '/';
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: escapeGroup(pattern)
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {String}   str
 * @return {Function}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^' + tokens[i].pattern + '$');
    }
  }

  return function (obj) {
    var path = '';
    var data = obj || {};

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encodeURIComponent(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = encodeURIComponent(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {String} str
 * @return {String}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
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
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path);
  var re = tokensToRegExp(tokens, options);

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i]);
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {Array}  tokens
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';
  var lastToken = tokens[tokens.length - 1];
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = token.pattern;

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (prefix) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || [];

  if (!isarray(keys)) {
    options = keys;
    keys = [];
  } else if (!options) {
    options = {};
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options)
  }

  if (isarray(path)) {
    return arrayToRegexp(path, keys, options)
  }

  return stringToRegexp(path, keys, options)
}

pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/**
   * Module dependencies.
   */

  

  /**
   * Short-cuts for global-object checks
   */

  var hasDocument = ('undefined' !== typeof document);
  var hasWindow = ('undefined' !== typeof window);
  var hasHistory = ('undefined' !== typeof history);
  var hasProcess = typeof process !== 'undefined';

  /**
   * Detect click event
   */
  var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var isLocation = hasWindow && !!(window.history.location || window.location);

  /**
   * The page instance
   * @api private
   */
  function Page() {
    // public things
    this.callbacks = [];
    this.exits = [];
    this.current = '';
    this.len = 0;

    // private things
    this._decodeURLComponents = true;
    this._base = '';
    this._strict = false;
    this._running = false;
    this._hashbang = false;

    // bound functions
    this.clickHandler = this.clickHandler.bind(this);
    this._onpopstate = this._onpopstate.bind(this);
  }

  /**
   * Configure the instance of page. This can be called multiple times.
   *
   * @param {Object} options
   * @api public
   */

  Page.prototype.configure = function(options) {
    var opts = options || {};

    this._window = opts.window || (hasWindow && window);
    this._decodeURLComponents = opts.decodeURLComponents !== false;
    this._popstate = opts.popstate !== false && hasWindow;
    this._click = opts.click !== false && hasDocument;
    this._hashbang = !!opts.hashbang;

    var _window = this._window;
    if(this._popstate) {
      _window.addEventListener('popstate', this._onpopstate, false);
    } else if(hasWindow) {
      _window.removeEventListener('popstate', this._onpopstate, false);
    }

    if (this._click) {
      _window.document.addEventListener(clickEvent, this.clickHandler, false);
    } else if(hasDocument) {
      _window.document.removeEventListener(clickEvent, this.clickHandler, false);
    }

    if(this._hashbang && hasWindow && !hasHistory) {
      _window.addEventListener('hashchange', this._onpopstate, false);
    } else if(hasWindow) {
      _window.removeEventListener('hashchange', this._onpopstate, false);
    }
  };

  /**
   * Get or set basepath to `path`.
   *
   * @param {string} path
   * @api public
   */

  Page.prototype.base = function(path) {
    if (0 === arguments.length) return this._base;
    this._base = path;
  };

  /**
   * Gets the `base`, which depends on whether we are using History or
   * hashbang routing.

   * @api private
   */
  Page.prototype._getBase = function() {
    var base = this._base;
    if(!!base) return base;
    var loc = hasWindow && this._window && this._window.location;

    if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
      base = loc.pathname;
    }

    return base;
  };

  /**
   * Get or set strict path matching to `enable`
   *
   * @param {boolean} enable
   * @api public
   */

  Page.prototype.strict = function(enable) {
    if (0 === arguments.length) return this._strict;
    this._strict = enable;
  };


  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  Page.prototype.start = function(options) {
    var opts = options || {};
    this.configure(opts);

    if (false === opts.dispatch) return;
    this._running = true;

    var url;
    if(isLocation) {
      var window = this._window;
      var loc = window.location;

      if(this._hashbang && ~loc.hash.indexOf('#!')) {
        url = loc.hash.substr(2) + loc.search;
      } else if (this._hashbang) {
        url = loc.search + loc.hash;
      } else {
        url = loc.pathname + loc.search + loc.hash;
      }
    }

    this.replace(url, null, true, opts.dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  Page.prototype.stop = function() {
    if (!this._running) return;
    this.current = '';
    this.len = 0;
    this._running = false;

    var window = this._window;
    this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
    hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
    hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {string} path
   * @param {Object=} state
   * @param {boolean=} dispatch
   * @param {boolean=} push
   * @return {!Context}
   * @api public
   */

  Page.prototype.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state, this),
      prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    if (false !== dispatch) this.dispatch(ctx, prev);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object=} state
   * @api public
   */

  Page.prototype.back = function(path, state) {
    var page = this;
    if (this.len > 0) {
      var window = this._window;
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      hasHistory && window.history.back();
      this.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    } else {
      setTimeout(function() {
        page.show(page._getBase(), state);
      });
    }
  };

  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {string} from - if param 'to' is undefined redirects to 'from'
   * @param {string=} to
   * @api public
   */
  Page.prototype.redirect = function(from, to) {
    var inst = this;

    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page.call(this, from, function(e) {
        setTimeout(function() {
          inst.replace(/** @type {!string} */ (to));
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        inst.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {string} path
   * @param {Object=} state
   * @param {boolean=} init
   * @param {boolean=} dispatch
   * @return {!Context}
   * @api public
   */


  Page.prototype.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state, this),
      prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) this.dispatch(ctx, prev);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Context} ctx
   * @api private
   */

  Page.prototype.dispatch = function(ctx, prev) {
    var i = 0, j = 0, page = this;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled.call(page, ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  Page.prototype.exit = function(path, fn) {
    if (typeof path === 'function') {
      return this.exit('*', path);
    }

    var route = new Route(path, null, this);
    for (var i = 1; i < arguments.length; ++i) {
      this.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Handle "click" events.
   */

  /* jshint +W054 */
  Page.prototype.clickHandler = function(e) {
    if (1 !== this._which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    // use shadow dom when available if not, fall back to composedPath()
    // for browsers that only have shady
    var el = e.target;
    var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

    if(eventPath) {
      for (var i = 0; i < eventPath.length; i++) {
        if (!eventPath[i].nodeName) continue;
        if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
        if (!eventPath[i].href) continue;

        el = eventPath[i];
        break;
      }
    }

    // continue ensure link
    // el.nodeName for svg links are 'a' instead of 'A'
    while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
    if (!el || 'A' !== el.nodeName.toUpperCase()) return;

    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    // svg target is an object and its desired value is in .baseVal property
    if (svg ? el.target.baseVal : el.target) return;

    // x-origin
    // note: svg links that are not relative don't call click events (and skip page.js)
    // consequently, all svg links tested inside page.js are relative and in the same origin
    if (!svg && !this.sameOrigin(el.href)) return;

    // rebuild path
    // There aren't .pathname and .search properties in svg links, so we use href
    // Also, svg href is an object and its desired value is in .baseVal property
    var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

    path = path[0] !== '/' ? '/' + path : path;

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;
    var pageBase = this._getBase();

    if (path.indexOf(pageBase) === 0) {
      path = path.substr(pageBase.length);
    }

    if (this._hashbang) path = path.replace('#!', '');

    if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
      return;
    }

    e.preventDefault();
    this.show(orig);
  };

  /**
   * Handle "populate" events.
   * @api private
   */

  Page.prototype._onpopstate = (function () {
    var loaded = false;
    if ( ! hasWindow ) {
      return function () {};
    }
    if (hasDocument && document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      var page = this;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else if (isLocation) {
        var loc = page._window.location;
        page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
      }
    };
  })();

  /**
   * Event button.
   */
  Page.prototype._which = function(e) {
    e = e || (hasWindow && this._window.event);
    return null == e.which ? e.button : e.which;
  };

  /**
   * Convert to a URL object
   * @api private
   */
  Page.prototype._toURL = function(href) {
    var window = this._window;
    if(typeof URL === 'function' && isLocation) {
      return new URL(href, window.location.toString());
    } else if (hasDocument) {
      var anc = window.document.createElement('a');
      anc.href = href;
      return anc;
    }
  };

  /**
   * Check if `href` is the same origin.
   * @param {string} href
   * @api public
   */
  Page.prototype.sameOrigin = function(href) {
    if(!href || !isLocation) return false;

    var url = this._toURL(href);
    var window = this._window;

    var loc = window.location;

    /*
       When the port is the default http port 80 for http, or 443 for
       https, internet explorer 11 returns an empty string for loc.port,
       so we need to compare loc.port with an empty string if url.port
       is the default port 80 or 443.
       Also the comparition with `port` is changed from `===` to `==` because
       `port` can be a string sometimes. This only applies to ie11.
    */
    return loc.protocol === url.protocol &&
      loc.hostname === url.hostname &&
      (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
  };

  /**
   * @api private
   */
  Page.prototype._samePath = function(url) {
    if(!isLocation) return false;
    var window = this._window;
    var loc = window.location;
    return url.pathname === loc.pathname &&
      url.search === loc.search;
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {string} val - URL component to decode
   * @api private
   */
  Page.prototype._decodeURLEncodedURIComponent = function(val) {
    if (typeof val !== 'string') { return val; }
    return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  };

  /**
   * Create a new `page` instance and function
   */
  function createPage() {
    var pageInstance = new Page();

    function pageFn(/* args */) {
      return page.apply(pageInstance, arguments);
    }

    // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
    pageFn.callbacks = pageInstance.callbacks;
    pageFn.exits = pageInstance.exits;
    pageFn.base = pageInstance.base.bind(pageInstance);
    pageFn.strict = pageInstance.strict.bind(pageInstance);
    pageFn.start = pageInstance.start.bind(pageInstance);
    pageFn.stop = pageInstance.stop.bind(pageInstance);
    pageFn.show = pageInstance.show.bind(pageInstance);
    pageFn.back = pageInstance.back.bind(pageInstance);
    pageFn.redirect = pageInstance.redirect.bind(pageInstance);
    pageFn.replace = pageInstance.replace.bind(pageInstance);
    pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
    pageFn.exit = pageInstance.exit.bind(pageInstance);
    pageFn.configure = pageInstance.configure.bind(pageInstance);
    pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
    pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

    pageFn.create = createPage;

    Object.defineProperty(pageFn, 'len', {
      get: function(){
        return pageInstance.len;
      },
      set: function(val) {
        pageInstance.len = val;
      }
    });

    Object.defineProperty(pageFn, 'current', {
      get: function(){
        return pageInstance.current;
      },
      set: function(val) {
        pageInstance.current = val;
      }
    });

    // In 2.0 these can be named exports
    pageFn.Context = Context;
    pageFn.Route = Route;

    return pageFn;
  }

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {string|!Function|!Object} path
   * @param {Function=} fn
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page.call(this, '*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(/** @type {string} */ (path), null, this);
      for (var i = 1; i < arguments.length; ++i) {
        this.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      this.start(path);
    }
  }

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */
  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;
    var page = this;
    var window = page._window;

    if (page._hashbang) {
      current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
    } else {
      current = isLocation && window.location.pathname + window.location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    isLocation && (window.location.href = ctx.canonicalPath);
  }

  /**
   * Escapes RegExp characters in the given string.
   *
   * @param {string} s
   * @api private
   */
  function escapeRegExp(s) {
    return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @constructor
   * @param {string} path
   * @param {Object=} state
   * @api public
   */

  function Context(path, state, pageInstance) {
    var _page = this.page = pageInstance || page;
    var window = _page._window;
    var hashbang = _page._hashbang;

    var pageBase = _page._getBase();
    if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    var re = new RegExp('^' + escapeRegExp(pageBase));
    this.path = path.replace(re, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = (hasDocument && window.document.title);
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = this.pathname = parts[0];
      this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    var page = this.page;
    var window = page._window;
    var hashbang = page._hashbang;

    page.len++;
    if (hasHistory) {
        window.history.pushState(this.state, this.title,
          hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    var page = this.page;
    if (hasHistory) {
        page._window.history.replaceState(this.state, this.title,
          page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @constructor
   * @param {string} path
   * @param {Object=} options
   * @api private
   */

  function Route(path, options, page) {
    var _page = this.page = page || globalPage;
    var opts = options || {};
    opts.strict = opts.strict || _page._strict;
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
  }

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) {
        ctx.routePath = self.path;
        return fn(ctx, next);
      }
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {string} path
   * @param {Object} params
   * @return {boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    delete params[0];

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = this.page._decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Module exports.
   */

  var globalPage = createPage();
  var page_js = globalPage;
  var default_1 = globalPage;

page_js.default = default_1;

return page_js;

})));

}).call(this)}).call(this,require('_process'))

},{"_process":25}],25:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],26:[function(require,module,exports){
// Utilities
const lowerCase = require('./lower-case')
const specials = require('./specials')

const regex = /(?:(?:(\s?(?:^|[.\(\)!?;:"-])\s*)(\w))|(\w))(\w*[’']*\w*)/g

const convertToRegExp = specials => specials.map(s => [new RegExp(`\\b${s}\\b`, 'gi'), s])

function parseMatch(match) {
  const firstCharacter = match[0]

  // test first character
  if (/\s/.test(firstCharacter)) {
    // if whitespace - trim and return
    return match.substr(1)
  }
  if (/[\(\)]/.test(firstCharacter)) {
    // if parens - this shouldn't be replaced
    return null
  }

  return match
}

module.exports = (str, options = {}) => {
  str = str.toLowerCase().replace(regex, (m, lead = '', forced, lower, rest) => {
    const parsedMatch = parseMatch(m)
    if (!parsedMatch) {
      return m
    }
    if (!forced) {
      const fullLower = lower + rest

      if (lowerCase.has(fullLower)) {
        return parsedMatch
      }
    }

    return lead + (lower || forced).toUpperCase() + rest
  })

  const customSpecials = options.special || []
  const replace = [...specials, ...customSpecials]
  const replaceRegExp = convertToRegExp(replace)

  replaceRegExp.forEach(([pattern, s]) => {
    str = str.replace(pattern, s)
  })

  return str
}

},{"./lower-case":27,"./specials":28}],27:[function(require,module,exports){
const conjunctions = [
  'for',
  'and',
  'nor',
  'but',
  'or',
  'yet',
  'so'
]

const articles = [
  'a',
  'an',
  'the'
]

const prepositions = [
  'aboard',
  'about',
  'above',
  'across',
  'after',
  'against',
  'along',
  'amid',
  'among',
  'anti',
  'around',
  'as',
  'at',
  'before',
  'behind',
  'below',
  'beneath',
  'beside',
  'besides',
  'between',
  'beyond',
  'but',
  'by',
  'concerning',
  'considering',
  'despite',
  'down',
  'during',
  'except',
  'excepting',
  'excluding',
  'following',
  'for',
  'from',
  'in',
  'inside',
  'into',
  'like',
  'minus',
  'near',
  'of',
  'off',
  'on',
  'onto',
  'opposite',
  'over',
  'past',
  'per',
  'plus',
  'regarding',
  'round',
  'save',
  'since',
  'than',
  'through',
  'to',
  'toward',
  'towards',
  'under',
  'underneath',
  'unlike',
  'until',
  'up',
  'upon',
  'versus',
  'via',
  'with',
  'within',
  'without'
]

module.exports = new Set([
  ...conjunctions,
  ...articles,
  ...prepositions
])

},{}],28:[function(require,module,exports){
const intended = [
  'ZEIT',
  'ZEIT Inc.',
  'CLI',
  'API',
  'HTTP',
  'HTTPS',
  'JSX',
  'DNS',
  'URL',
  'now.sh',
  'now.json',
  'CI',
  'CDN',
  'package.json',
  'GitHub',
  'GitLab',
  'CSS',
  'JS',
  'JavaScript',
  'TypeScript',
  'HTML',
  'WordPress',
  'JavaScript',
  'Next.js',
  'Node.js'
]

module.exports = intended

},{}],29:[function(require,module,exports){
(function (global){(function (){
/*! *****************************************************************************
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
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __spreadArrays;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
var __classPrivateFieldGet;
var __classPrivateFieldSet;
var __createBinding;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };

    __extends = function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function(m, o) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
    };

    __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    });

    __values = function (o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    __spreadArrays = function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    __classPrivateFieldGet = function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    };

    __classPrivateFieldSet = function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__createBinding", __createBinding);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__spreadArrays", __spreadArrays);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
    exporter("__classPrivateFieldGet", __classPrivateFieldGet);
    exporter("__classPrivateFieldSet", __classPrivateFieldSet);
});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],30:[function(require,module,exports){
var bel = require('bel') // turns template tag into DOM elements
var morphdom = require('morphdom') // efficiently diffs + morphs two DOM elements
var defaultEvents = require('./update-events.js') // default events to be copied when dom elements update

module.exports = bel

// TODO move this + defaultEvents to a new module once we receive more feedback
module.exports.update = function (fromNode, toNode, opts) {
  if (!opts) opts = {}
  if (opts.events !== false) {
    if (!opts.onBeforeElUpdated) opts.onBeforeElUpdated = copier
  }

  return morphdom(fromNode, toNode, opts)

  // morphdom only copies attributes. we decided we also wanted to copy events
  // that can be set via attributes
  function copier (f, t) {
    // copy events:
    var events = opts.events || defaultEvents
    for (var i = 0; i < events.length; i++) {
      var ev = events[i]
      if (t[ev]) { // if new element has a whitelisted attribute
        f[ev] = t[ev] // update existing element
      } else if (f[ev]) { // if existing element has it and new one doesnt
        f[ev] = undefined // remove it from existing element
      }
    }
    var oldValue = f.value
    var newValue = t.value
    // copy values for form elements
    if ((f.nodeName === 'INPUT' && f.type !== 'file') || f.nodeName === 'SELECT') {
      if (!newValue && !t.hasAttribute('value')) {
        t.value = f.value
      } else if (newValue !== oldValue) {
        f.value = newValue
      }
    } else if (f.nodeName === 'TEXTAREA') {
      if (t.getAttribute('value') === null) f.value = t.value
    }
  }
}

},{"./update-events.js":31,"bel":1,"morphdom":21}],31:[function(require,module,exports){
module.exports = [
  // attribute events (can be set with attributes)
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'ondragstart',
  'ondrag',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondrop',
  'ondragend',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onunload',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onselect',
  'onchange',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'oninput',
  // other common events
  'oncontextmenu',
  'onfocusin',
  'onfocusout'
]

},{}],32:[function(require,module,exports){
const page = require('page');

const template = require('./template');

const empty = require('empty-element');

const title = require('title');

page('/', function (ctx, next) {
  title('Portafolio');
  let main = document.getElementById('main-container');
  /* EN ESTE CASO PONDREMOS UN OBJETO CON LOS DATOS, ICONOS Y USUARIO QUIEN SUBIÓ LA FOTO
   EN LA LÍNEA 21 CREAMOS UNA NUEVA INSTANCIA DE LA CLASE Date, EN DONDE SIGNIFICA 'new Date()' Hoy*/

  const pictures = [{
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 10,
    liked: false,
    createAt: new Date()
  },
  /* EN LA LÍNEA 34, PRIMERO CREAMOS UNA NUEVA INSTANCIA DE LA CLASE "Date()", ENVIÁNDOLE COMO MÉTODO LA FUNCIÓN QUE NOS PERMITE MODIFICAR O CAMBIAR LA HORA ".setDate(new Date().getDate() - 10)" Y DENTRO COMO PARÁMETRO SE LE ENVIA LA FECHA ACTUAL CON "new Date()" Y DESPUÉS DE OBTENER EL DÍA DE HOY CON LA FUNCIÓN "getDate()" LE RESTAMOS LOS DÍAS QUE QUEREMOS.  */
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.jpg'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 1,
    liked: true,
    createAt: new Date().setDate(new Date().getDate() - 10)
  }]; //PASAMOS EN LA LINEA 33 EL ARRAY A EL TEMPLATE DE LA HOMEPAGE

  empty(main).appendChild(template(pictures));
});

},{"./template":33,"empty-element":3,"page":24,"title":26}],33:[function(require,module,exports){
const yo = require('yo-yo'); //EN ESTE CASO NO VAMOS A REQUERIR LA FUNCIÓN landing SINO LA FUNCIÓN layaout.


const layaout = require('../layout');

const picture = require('../picture-card'); //UNA VEZ REQUERIDA EL INDEX DE PICTURE, LA INVOCAMOS CON UNA FUNCIÓN


module.exports = function pictureCard(pictures) {
  let el = yo`<div class="container timeline">
    <div class="row">
      <div class="col s12 m10 offset-m1 l6 offset-l3">
        ${pictures.map(function (pic) {
    return picture(pic);
  })}
      </div>
    </div>
  </div>`;
  return layaout(el);
};

},{"../layout":36,"../picture-card":37,"yo-yo":30}],34:[function(require,module,exports){
//EN ESTE CASO, REQUERIMOS EL MÓDULO PAGE PARA INICIALIZARLO.
const page = require('page');
/* const moment = require('moment');
const { locale } = require('moment');

//DE ESTA FORMA REQUERIMOS EL LENGUAJE EN ESPAÑOL DEL FORMATO DE LA HORA
require('moment/locale/es');

moment.locale('es'); */
//DESPUÉS REQUERIMOS LOS MÓDULOS DE LA HOMEPAGE Y SIGNUP, RESPETANDO EL ORDEN DE LA MISMA.


require('./homepage');

require('./signup');

require('./signin');

page();

},{"./homepage":32,"./signin":38,"./signup":40,"page":24}],35:[function(require,module,exports){
let yo = require('yo-yo'); //NOS RETORNA EL ELEMENTO DEL DOM QUE NOS PROCESA yo


module.exports = function landing(box) {
  return yo`<div class="container landing">
      <div class="row">
        <div class="col s10 push-s1">
          <div class="row">
            <div class="col m5 hide-on-small-only">
              <img class="iphone" src="telefonogram.png" />
            </div>
            ${box}
          </div>
        </div>
      </div>
    </div>`;
};

},{"yo-yo":30}],36:[function(require,module,exports){
const yo = require('yo-yo'); //EN ESTE CASO NECESITAMOS CREAR UNA FUNCIÓN CON UN CONTENIDO QUE SEA EXPORTADA Y REQUERIDA EN LA HOME, SIGNUP Y SIGNIN


module.exports = function layout(content) {
  return yo`<div>
  <nav class="header">
  <div class="nav-wrapper">
    <div class="container">
      <div class="row">
        <div class="col s12 m6 offset-m1">
          <a href="/" class="brand-logo portafolio">Portafolio Digital</a>
        </div>
        <div class="col s2 m6 push-s10 push-m10">
          <a href="#" class="btn btn-large btn-flat dropdown-button" data-activates="drop-user">
          <i class="fas fa-user-circle"></i>
          </a>
          <ul id="drop-user" class="dropdown-content">
            <li><a href="#">Salir</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  </nav>
  <div class="content">
  ${content}
  </div>
</div>`;
};

},{"yo-yo":30}],37:[function(require,module,exports){
const yo = require('yo-yo'); //ESTA LIBRERÍA NOS PERMITE MODIFICAR LA HORA RELATIVA DESDE EL TIEMPO EN QUE SE PUBLICÓ

/* const moment = require('moment'); */


const translate = require('../translate'); //CONTINUAMOS CREANDO UN ARCHIVO INDEX EN DONDE COLOCAREMOS LA LÓGICA DE NUESTRO PROYECTO CON REFERENCIA A LAS IMÁGENES SUBIDAS
//LUEGO CREAMOS UNA FUNCION QUE NOS PERMITA RENDERIZAR LA IMAGEN CADA VEZ HAYA CAMBIOS


module.exports = function pictureCards(pic) {
  let el;

  function render(picture) {
    return yo`<div class="card ${picture.liked ? 'liked' : ''}">
    <div class="card-image waves-effect waves-block waves-light">
      <img class="activator" src="${picture.url}">
    </div>
    <div class="card-content">
      <a href="/user/${picture.user.username}" class="card-title">
        <img src="${picture.user.avatar}" class="avatar" />
        <span class="username">${picture.user.username}</span>
      </a>
      <small class="right time">${translate.date.format(picture.createAt)}</small>
      <p>
        <a class="left" href="#" onclick=${like.bind(null, true)}><i class="far fa-star"></i></a>
        <a class="left" href="#" onclick=${like.bind(null, false)}><i class="fas fa-star"></i></a>
        <span class="left likes">${translate.message('likes', {
      likes: picture.likes
    })}</span>
      </p>
    </div>
  </div>`;
  }

  ;

  function like(liked) {
    //SE TOMA EL ARRAYS Y SE LE AGREGA LA PROPIEDAD.
    pic.liked = liked; //SE LE INDICA A EL OBJETO CON SU PROPIEDAD pic.likes LA SUMA O LA RESTA

    pic.likes += liked ? 1 : -1; //SE CREA LA NUEVA VARIABLE QUE SE VA A ENCARGAR DE GUARDAR LOS NUEVOS CAMBIOS

    let newEl = render(pic); //Y SE UTILIZA EL MÉTODO DE "yo.update()" COLOCANDO COMO PARÁMETRO EL ELEMENTO VIEJO Y EL NUEVO ELEMENTO ACTUALIZADO.

    yo.update(el, newEl); //ESTE RETURN ME PERMITE EVITAR QUE SE VUELVA A REPETIR LA MISMA SENTECIA

    return false;
  }

  ;
  el = render(pic);
  return el;
};

},{"../translate":44,"yo-yo":30}],38:[function(require,module,exports){
const page = require('page');

const template = require('./template');

const empty = require('empty-element');

const title = require('title');

page('/signin', function (ctx, next) {
  title('Portafolio - Signin');
  let main = document.getElementById('main-container');
  empty(main).appendChild(template);
});

},{"./template":39,"empty-element":3,"page":24,"title":26}],39:[function(require,module,exports){
const yo = require('yo-yo'); //NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.


const landing = require('../landing/index');

let signinForm = yo`<div class="col s12 m7">
              <div class="row">
                <div class="signup-box">
                  <h1 class="portafolio">Portafolio Digital</h1>
                  <form class="signup-form">
                    <div class="section">
                      <a class="btn btn-fb hide-on-small-only">Iniciar sesión con Facebook</a>
                      <a class="btn btn-fb hide-on-med-and-up"><i class="fab fa-facebook-square"></i>Iniciar sesión</a>
                    </div>
                    <div class="divider"></div>
                    <div class="section">
                      <input type="text" name="username" placeholder="Nombre de usuario" />
                      <input type="password" name="password" placeholder="Contraseña" />
                      <button class="btn waves-effect waves-light btn-signup" type="submit">Inicia Sesión</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row">
                <div class="login-box">
                  ¿No tienes una cuenta? <a href="/signup">Regístrate</a>
                </div>
              </div>
            </div>`;
module.exports = landing(signinForm);

},{"../landing/index":35,"yo-yo":30}],40:[function(require,module,exports){
const page = require('page');

const template = require('./template');

const empty = require('empty-element');

const title = require('title');

page('/signup', function (ctx, next) {
  title('Portafolio - Signup');
  let main = document.getElementById('main-container');
  empty(main).appendChild(template);
});

},{"./template":41,"empty-element":3,"page":24,"title":26}],41:[function(require,module,exports){
const yo = require('yo-yo'); //NO ES IMPORTANTE COLOCAR EL ARCHIVOS INDEX, YA QUE SI TUVIERA OTRO NOMBRE SÍ FUERA NECESARIO.


const landing = require('../landing/index');

let signupForm = yo`<div class="col s12 m7">
              <div class="row">
                <div class="signup-box">
                  <h1 class="portafolio">Portafolio Digital</h1>
                  <form class="signup-form">
                    <h2>Regístrate para ver los proyectos de los estudiantes del IUTAJS</h2>
                    <div class="section">
                      <a class="btn btn-fb hide-on-small-only">Iniciar sesión con Facebook</a>
                      <a class="btn btn-fb hide-on-med-and-up"><i class="fab fa-facebook-square"></i>Iniciar sesión</a>
                    </div>
                    <div class="divider"></div>
                    <div class="section">
                      <input type="email" name="email" placeholder="Correo electrónico" />
                      <input type="text" name="name" placeholder="Nombre completo" />
                      <input type="text" name="username" placeholder="Nombre de usuario" />
                      <input type="password" name="password" placeholder="Contraseña" />
                      <button class="btn waves-effect waves-light btn-signup" type="submit">Regístrate</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row">
                <div class="login-box">
                  ¿Tienes una cuenta? <a href="/signin">Entrar</a>
                </div>
              </div>
            </div>`;
module.exports = landing(signupForm);

},{"../landing/index":35,"yo-yo":30}],42:[function(require,module,exports){
module.exports = {
  likes: '{ liked, plural,' + '=0 {no likes}' + '=1 {# like}' + '=other { # likes}}'
};

},{}],43:[function(require,module,exports){
module.exports = {
  likes: 'Usted { liked, number} me gusta'
};

},{}],44:[function(require,module,exports){
//ESTE ES PARA LAS FECHAS
const IntlRelativeFormat = require('intl-relativeformat'); //ESTE ES PARA LOS MENSAJES O TEXTOS


const IntlMessageFormat = require('intl-messageformat');
/* const IntlRelativeFormat = windown.IntlRelativeFormat = require('intl-relativeformat');
DE ESTA FORMA SE PUEDE COLOCAR EL FORMATO RELATIVO EN EL OBJETO DE WINDOWS GLOBAL */


let rf = new IntlRelativeFormat('es');
let output = rf.format();

let es = require('./es');

let en = require('./en-US');

const MESSAGES = {};
MESSAGES.es = es;
/* CON LOS CORCHETES EN PARENTESIS, SIRVEN PARA AGREGAR ESPACIOS ENTRE PROPIEDADES O CARACTERES ESPECIALES
MESSAGES['PODEMOS ESCRIBIR ESPACIOS ENTRE PROPIEDADES']
*/

MESSAGES['en-US'] = en; //CREAMOS UNA VARIABLE QUE POR AHORA VA A ESTAR EN ESPAÑOL

let locales = 'es'; //opts = {}, NOS ENVIA UN OBJETO VACIO

module.exports = {
  message: function (text, opts = {}) {
    let msg = new IntlMessageFormat(MESSAGES[locales][text], locales, null);
    return msg.format(opts);
  },
  date: new IntlRelativeFormat(locales)
};
/*  PROBLEMA CON LA INTERNACIONALIZACIÓN 4.20*/

},{"./en-US":42,"./es":43,"intl-messageformat":14,"intl-relativeformat":20}]},{},[34])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmVsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy9lbXB0eS1lbGVtZW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Zhc3QtbWVtb2l6ZS9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2xvYmFsL2RvY3VtZW50LmpzIiwibm9kZV9tb2R1bGVzL2dsb2JhbC93aW5kb3cuanMiLCJub2RlX21vZHVsZXMvaHlwZXJzY3JpcHQtYXR0cmlidXRlLXRvLXByb3BlcnR5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2h5cGVyeC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbnRsLW1lc3NhZ2Vmb3JtYXQtcGFyc2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ludGwtbWVzc2FnZWZvcm1hdC1wYXJzZXIvc3JjL25vcm1hbGl6ZS5qcyIsIm5vZGVfbW9kdWxlcy9pbnRsLW1lc3NhZ2Vmb3JtYXQtcGFyc2VyL3NyYy9wYXJzZXIuanMiLCJub2RlX21vZHVsZXMvaW50bC1tZXNzYWdlZm9ybWF0LXBhcnNlci9zcmMvc2tlbGV0b24uanMiLCJub2RlX21vZHVsZXMvaW50bC1tZXNzYWdlZm9ybWF0LXBhcnNlci9zcmMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvaW50bC1tZXNzYWdlZm9ybWF0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ludGwtbWVzc2FnZWZvcm1hdC9zcmMvY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9pbnRsLW1lc3NhZ2Vmb3JtYXQvc3JjL2Vycm9yLmpzIiwibm9kZV9tb2R1bGVzL2ludGwtbWVzc2FnZWZvcm1hdC9zcmMvZm9ybWF0dGVycy5qcyIsIm5vZGVfbW9kdWxlcy9pbnRsLXJlbGF0aXZlZm9ybWF0L2Rpc3QvZGlmZi5qcyIsIm5vZGVfbW9kdWxlcy9pbnRsLXJlbGF0aXZlZm9ybWF0L2Rpc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW50bC1yZWxhdGl2ZWZvcm1hdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tb3JwaGRvbS9kaXN0L21vcnBoZG9tLmpzIiwibm9kZV9tb2R1bGVzL25hbm9hc3NlcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb24tbG9hZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL3BhZ2UuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RpdGxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90aXRsZS9saWIvbG93ZXItY2FzZS5qcyIsIm5vZGVfbW9kdWxlcy90aXRsZS9saWIvc3BlY2lhbHMuanMiLCJub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuanMiLCJub2RlX21vZHVsZXMveW8teW8vaW5kZXguanMiLCJub2RlX21vZHVsZXMveW8teW8vdXBkYXRlLWV2ZW50cy5qcyIsInNyYy9ob21lcGFnZS9pbmRleC5qcyIsInNyYy9ob21lcGFnZS90ZW1wbGF0ZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9sYW5kaW5nL2luZGV4LmpzIiwic3JjL2xheW91dC9pbmRleC5qcyIsInNyYy9waWN0dXJlLWNhcmQvaW5kZXguanMiLCJzcmMvc2lnbmluL2luZGV4LmpzIiwic3JjL3NpZ25pbi90ZW1wbGF0ZS5qcyIsInNyYy9zaWdudXAvaW5kZXguanMiLCJzcmMvc2lnbnVwL3RlbXBsYXRlLmpzIiwic3JjL3RyYW5zbGF0ZS9lbi1VUy5qcyIsInNyYy90cmFuc2xhdGUvZXMuanMiLCJzcmMvdHJhbnNsYXRlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxaUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNydkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4c0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBcEIsTUFBb0IsQ0FBcEI7O0FBQ0EsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUF4QixZQUF3QixDQUF4Qjs7QUFDQSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQXJCLGVBQXFCLENBQXJCOztBQUNBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBckIsT0FBcUIsQ0FBckI7O0FBR0EsSUFBSSxDQUFBLEdBQUEsRUFBTSxVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQW9CO0FBQzVCLEVBQUEsS0FBSyxDQUFMLFlBQUssQ0FBTDtBQUNBLE1BQUksSUFBSSxHQUFHLFFBQVEsQ0FBUixjQUFBLENBQVgsZ0JBQVcsQ0FBWDtBQUNGO0FBQ0E7O0FBQ0UsUUFBTSxRQUFRLEdBQUcsQ0FDakI7QUFDRSxJQUFBLElBQUksRUFBRTtBQUNKLE1BQUEsUUFBUSxFQURKLFdBQUE7QUFFSixNQUFBLE1BQU0sRUFBRTtBQUZKLEtBRFI7QUFLRSxJQUFBLEdBQUcsRUFMTCw4Q0FBQTtBQU1FLElBQUEsS0FBSyxFQU5QLEVBQUE7QUFPRSxJQUFBLEtBQUssRUFQUCxLQUFBO0FBUUUsSUFBQSxRQUFRLEVBQUUsSUFBQSxJQUFBO0FBUlosR0FEaUI7QUFhakI7QUFDQTtBQUNFLElBQUEsSUFBSSxFQUFFO0FBQ0osTUFBQSxRQUFRLEVBREosV0FBQTtBQUVKLE1BQUEsTUFBTSxFQUFFO0FBRkosS0FEUjtBQUtFLElBQUEsR0FBRyxFQUxMLDhDQUFBO0FBTUUsSUFBQSxLQUFLLEVBTlAsQ0FBQTtBQU9FLElBQUEsS0FBSyxFQVBQLElBQUE7QUFRRSxJQUFBLFFBQVEsRUFBRSxJQUFBLElBQUEsR0FBQSxPQUFBLENBQW1CLElBQUEsSUFBQSxHQUFBLE9BQUEsS0FBbkIsRUFBQTtBQVJaLEdBZGlCLENBQWpCLENBTDRCLENBOEI1Qjs7QUFDQSxFQUFBLEtBQUssQ0FBTCxJQUFLLENBQUwsQ0FBQSxXQUFBLENBQXdCLFFBQVEsQ0FBaEMsUUFBZ0MsQ0FBaEM7QUEvQkYsQ0FBSSxDQUFKOzs7QUNOQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQWxCLE9BQWtCLENBQWxCLEMsQ0FDQTs7O0FBQ0EsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUF2QixXQUF1QixDQUF2Qjs7QUFDQSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQXZCLGlCQUF1QixDQUF2QixDLENBQ0E7OztBQUVBLE1BQU0sQ0FBTixPQUFBLEdBQWlCLFNBQUEsV0FBQSxDQUFBLFFBQUEsRUFBZ0M7QUFDL0MsTUFBSSxFQUFFLEdBQUcsRUFBSTtBQUNmO0FBQ0E7QUFDQSxVQUFVLFFBQVEsQ0FBUixHQUFBLENBQWEsVUFBQSxHQUFBLEVBQWU7QUFDOUIsV0FBTyxPQUFPLENBQWQsR0FBYyxDQUFkO0FBREUsR0FBQSxDQUVDO0FBQ1g7QUFDQTtBQVBFLFNBQUE7QUFTQSxTQUFPLE9BQU8sQ0FBZCxFQUFjLENBQWQ7QUFWRixDQUFBOzs7QUNOQTtBQUNBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBcEIsTUFBb0IsQ0FBcEI7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxPQUFPLENBQVAsWUFBTyxDQUFQOztBQUNBLE9BQU8sQ0FBUCxVQUFPLENBQVA7O0FBQ0EsT0FBTyxDQUFQLFVBQU8sQ0FBUDs7QUFFQSxJQUFJOzs7QUNqQkosSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFoQixPQUFnQixDQUFoQixDLENBRUE7OztBQUNBLE1BQU0sQ0FBTixPQUFBLEdBQWlCLFNBQUEsT0FBQSxDQUFBLEdBQUEsRUFBcUI7QUFDcEMsU0FBTyxFQUFHO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxHQUFJO0FBQ2xCO0FBQ0E7QUFDQTtBQVZFLFdBQUE7QUFERixDQUFBOzs7QUNIQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQWxCLE9BQWtCLENBQWxCLEMsQ0FFQTs7O0FBQ0EsTUFBTSxDQUFOLE9BQUEsR0FBaUIsU0FBQSxNQUFBLENBQUEsT0FBQSxFQUF5QjtBQUN4QyxTQUFPLEVBQUk7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFRO0FBQ1o7QUF0QkUsT0FBQTtBQURGLENBQUE7OztBQ0hBLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBbEIsT0FBa0IsQ0FBbEIsQyxDQUNBOztBQUNBOzs7QUFDQSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQXpCLGNBQXlCLENBQXpCLEMsQ0FDQTtBQUVBOzs7QUFDQSxNQUFNLENBQU4sT0FBQSxHQUFpQixTQUFBLFlBQUEsQ0FBQSxHQUFBLEVBQTJCO0FBQzFDLE1BQUEsRUFBQTs7QUFDQSxXQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQXlCO0FBQ3ZCLFdBQU8sRUFBRyxvQkFBbUIsT0FBTyxDQUFQLEtBQUEsR0FBQSxPQUFBLEdBQTBCLEVBQUc7QUFDOUQ7QUFDQSxvQ0FBb0MsT0FBTyxDQUFDLEdBQUk7QUFDaEQ7QUFDQTtBQUNBLHVCQUF1QixPQUFPLENBQVAsSUFBQSxDQUFhLFFBQVM7QUFDN0Msb0JBQW9CLE9BQU8sQ0FBUCxJQUFBLENBQWEsTUFBTztBQUN4QyxpQ0FBaUMsT0FBTyxDQUFQLElBQUEsQ0FBYSxRQUFTO0FBQ3ZEO0FBQ0Esa0NBQWtDLFNBQVMsQ0FBVCxJQUFBLENBQUEsTUFBQSxDQUFzQixPQUFPLENBQTdCLFFBQUEsQ0FBd0M7QUFDMUU7QUFDQSwyQ0FBMkMsSUFBSSxDQUFKLElBQUEsQ0FBQSxJQUFBLEVBQUEsSUFBQSxDQUFzQjtBQUNqRSwyQ0FBMkMsSUFBSSxDQUFKLElBQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQSxDQUF1QjtBQUNsRSxtQ0FBbUMsU0FBUyxDQUFULE9BQUEsQ0FBQSxPQUFBLEVBQTJCO0FBQUMsTUFBQSxLQUFLLEVBQUUsT0FBTyxDQUFDO0FBQWhCLEtBQTNCLENBQW1EO0FBQ3RGO0FBQ0E7QUFmSSxTQUFBO0FBaUJEOztBQUFBOztBQUVELFdBQUEsSUFBQSxDQUFBLEtBQUEsRUFBcUI7QUFDbkI7QUFDQSxJQUFBLEdBQUcsQ0FBSCxLQUFBLEdBRm1CLEtBRW5CLENBRm1CLENBR25COztBQUNBLElBQUEsR0FBRyxDQUFILEtBQUEsSUFBYSxLQUFLLEdBQUEsQ0FBQSxHQUFPLENBSk4sQ0FJbkIsQ0FKbUIsQ0FLbkI7O0FBQ0EsUUFBSSxLQUFLLEdBQUUsTUFBTSxDQU5FLEdBTUYsQ0FBakIsQ0FObUIsQ0FPbkI7O0FBQ0EsSUFBQSxFQUFFLENBQUYsTUFBQSxDQUFBLEVBQUEsRUFSbUIsS0FRbkIsRUFSbUIsQ0FTbkI7O0FBQ0EsV0FBQSxLQUFBO0FBQ0Q7O0FBQUE7QUFFRCxFQUFBLEVBQUUsR0FBRyxNQUFNLENBQVgsR0FBVyxDQUFYO0FBQ0EsU0FBQSxFQUFBO0FBcENGLENBQUE7OztBQ1BBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBcEIsTUFBb0IsQ0FBcEI7O0FBQ0EsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUF4QixZQUF3QixDQUF4Qjs7QUFDQSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQXJCLGVBQXFCLENBQXJCOztBQUNBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBckIsT0FBcUIsQ0FBckI7O0FBR0EsSUFBSSxDQUFBLFNBQUEsRUFBWSxVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQW9CO0FBQ2xDLEVBQUEsS0FBSyxDQUFMLHFCQUFLLENBQUw7QUFDQSxNQUFJLElBQUksR0FBRyxRQUFRLENBQVIsY0FBQSxDQUFYLGdCQUFXLENBQVg7QUFDQSxFQUFBLEtBQUssQ0FBTCxJQUFLLENBQUwsQ0FBQSxXQUFBLENBQUEsUUFBQTtBQUhGLENBQUksQ0FBSjs7O0FDTkEsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFsQixPQUFrQixDQUFsQixDLENBQ0E7OztBQUNBLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBdkIsa0JBQXVCLENBQXZCOztBQUVBLElBQUksVUFBVSxHQUFHLEVBQUk7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF0QkEsbUJBQUE7QUF5QkEsTUFBTSxDQUFOLE9BQUEsR0FBaUIsT0FBTyxDQUF4QixVQUF3QixDQUF4Qjs7O0FDN0JBLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBcEIsTUFBb0IsQ0FBcEI7O0FBQ0EsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUF4QixZQUF3QixDQUF4Qjs7QUFDQSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQXJCLGVBQXFCLENBQXJCOztBQUNBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBckIsT0FBcUIsQ0FBckI7O0FBR0EsSUFBSSxDQUFBLFNBQUEsRUFBWSxVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQW9CO0FBQ2xDLEVBQUEsS0FBSyxDQUFMLHFCQUFLLENBQUw7QUFDQSxNQUFJLElBQUksR0FBRyxRQUFRLENBQVIsY0FBQSxDQUFYLGdCQUFXLENBQVg7QUFDQSxFQUFBLEtBQUssQ0FBTCxJQUFLLENBQUwsQ0FBQSxXQUFBLENBQUEsUUFBQTtBQUhGLENBQUksQ0FBSjs7O0FDTkEsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFsQixPQUFrQixDQUFsQixDLENBQ0E7OztBQUNBLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBdkIsa0JBQXVCLENBQXZCOztBQUVBLElBQUksVUFBVSxHQUFHLEVBQUk7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF6QkEsbUJBQUE7QUE0QkEsTUFBTSxDQUFOLE9BQUEsR0FBaUIsT0FBTyxDQUF4QixVQUF3QixDQUF4Qjs7O0FDaENBLE1BQU0sQ0FBTixPQUFBLEdBQWlCO0FBQ2YsRUFBQSxLQUFLLEVBQUcscUJBQUEsZUFBQSxHQUFBLGFBQUEsR0FHRTtBQUpLLENBQWpCOzs7QUNBQSxNQUFNLENBQU4sT0FBQSxHQUFpQjtBQUNmLEVBQUEsS0FBSyxFQUFFO0FBRFEsQ0FBakI7OztBQ0FBO0FBQ0EsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQWxDLHFCQUFrQyxDQUFsQyxDLENBQ0E7OztBQUNBLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFqQyxvQkFBaUMsQ0FBakM7QUFDQTtBQUNBOzs7QUFDQSxJQUFJLEVBQUUsR0FBRyxJQUFBLGtCQUFBLENBQVQsSUFBUyxDQUFUO0FBQ0EsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFmLE1BQWEsRUFBYjs7QUFFQSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQWhCLE1BQWdCLENBQWhCOztBQUNBLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBaEIsU0FBZ0IsQ0FBaEI7O0FBRUEsTUFBTSxRQUFRLEdBQWQsRUFBQTtBQUNBLFFBQVEsQ0FBUixFQUFBLEdBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxRQUFRLENBQVIsT0FBUSxDQUFSLEdBQUEsRUFBQSxDLENBQ0E7O0FBQ0EsSUFBSSxPQUFPLEdBQVgsSUFBQSxDLENBRUE7O0FBQ0EsTUFBTSxDQUFOLE9BQUEsR0FBaUI7QUFDZixFQUFBLE9BQU8sRUFBRyxVQUFBLElBQUEsRUFBZ0IsSUFBSSxHQUFwQixFQUFBLEVBQTBCO0FBQ2xDLFFBQUksR0FBRyxHQUFHLElBQUEsaUJBQUEsQ0FBc0IsUUFBUSxDQUFSLE9BQVEsQ0FBUixDQUF0QixJQUFzQixDQUF0QixFQUFBLE9BQUEsRUFBVixJQUFVLENBQVY7QUFDQSxXQUFPLEdBQUcsQ0FBSCxNQUFBLENBQVAsSUFBTyxDQUFQO0FBSGEsR0FBQTtBQUtmLEVBQUEsSUFBSSxFQUFFLElBQUEsa0JBQUEsQ0FBQSxPQUFBO0FBTFMsQ0FBakI7QUFRQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBkb2N1bWVudCA9IHJlcXVpcmUoJ2dsb2JhbC9kb2N1bWVudCcpXG52YXIgaHlwZXJ4ID0gcmVxdWlyZSgnaHlwZXJ4JylcbnZhciBvbmxvYWQgPSByZXF1aXJlKCdvbi1sb2FkJylcblxudmFyIFNWR05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ1xudmFyIFhMSU5LTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaydcblxudmFyIEJPT0xfUFJPUFMgPSB7XG4gIGF1dG9mb2N1czogMSxcbiAgY2hlY2tlZDogMSxcbiAgZGVmYXVsdGNoZWNrZWQ6IDEsXG4gIGRpc2FibGVkOiAxLFxuICBmb3Jtbm92YWxpZGF0ZTogMSxcbiAgaW5kZXRlcm1pbmF0ZTogMSxcbiAgcmVhZG9ubHk6IDEsXG4gIHJlcXVpcmVkOiAxLFxuICBzZWxlY3RlZDogMSxcbiAgd2lsbHZhbGlkYXRlOiAxXG59XG52YXIgQ09NTUVOVF9UQUcgPSAnIS0tJ1xudmFyIFNWR19UQUdTID0gW1xuICAnc3ZnJyxcbiAgJ2FsdEdseXBoJywgJ2FsdEdseXBoRGVmJywgJ2FsdEdseXBoSXRlbScsICdhbmltYXRlJywgJ2FuaW1hdGVDb2xvcicsXG4gICdhbmltYXRlTW90aW9uJywgJ2FuaW1hdGVUcmFuc2Zvcm0nLCAnY2lyY2xlJywgJ2NsaXBQYXRoJywgJ2NvbG9yLXByb2ZpbGUnLFxuICAnY3Vyc29yJywgJ2RlZnMnLCAnZGVzYycsICdlbGxpcHNlJywgJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsXG4gICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLFxuICAnZmVEaXNwbGFjZW1lbnRNYXAnLCAnZmVEaXN0YW50TGlnaHQnLCAnZmVGbG9vZCcsICdmZUZ1bmNBJywgJ2ZlRnVuY0InLFxuICAnZmVGdW5jRycsICdmZUZ1bmNSJywgJ2ZlR2F1c3NpYW5CbHVyJywgJ2ZlSW1hZ2UnLCAnZmVNZXJnZScsICdmZU1lcmdlTm9kZScsXG4gICdmZU1vcnBob2xvZ3knLCAnZmVPZmZzZXQnLCAnZmVQb2ludExpZ2h0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsXG4gICdmZVNwb3RMaWdodCcsICdmZVRpbGUnLCAnZmVUdXJidWxlbmNlJywgJ2ZpbHRlcicsICdmb250JywgJ2ZvbnQtZmFjZScsXG4gICdmb250LWZhY2UtZm9ybWF0JywgJ2ZvbnQtZmFjZS1uYW1lJywgJ2ZvbnQtZmFjZS1zcmMnLCAnZm9udC1mYWNlLXVyaScsXG4gICdmb3JlaWduT2JqZWN0JywgJ2cnLCAnZ2x5cGgnLCAnZ2x5cGhSZWYnLCAnaGtlcm4nLCAnaW1hZ2UnLCAnbGluZScsXG4gICdsaW5lYXJHcmFkaWVudCcsICdtYXJrZXInLCAnbWFzaycsICdtZXRhZGF0YScsICdtaXNzaW5nLWdseXBoJywgJ21wYXRoJyxcbiAgJ3BhdGgnLCAncGF0dGVybicsICdwb2x5Z29uJywgJ3BvbHlsaW5lJywgJ3JhZGlhbEdyYWRpZW50JywgJ3JlY3QnLFxuICAnc2V0JywgJ3N0b3AnLCAnc3dpdGNoJywgJ3N5bWJvbCcsICd0ZXh0JywgJ3RleHRQYXRoJywgJ3RpdGxlJywgJ3RyZWYnLFxuICAndHNwYW4nLCAndXNlJywgJ3ZpZXcnLCAndmtlcm4nXG5dXG5cbmZ1bmN0aW9uIGJlbENyZWF0ZUVsZW1lbnQgKHRhZywgcHJvcHMsIGNoaWxkcmVuKSB7XG4gIHZhciBlbFxuXG4gIC8vIElmIGFuIHN2ZyB0YWcsIGl0IG5lZWRzIGEgbmFtZXNwYWNlXG4gIGlmIChTVkdfVEFHUy5pbmRleE9mKHRhZykgIT09IC0xKSB7XG4gICAgcHJvcHMubmFtZXNwYWNlID0gU1ZHTlNcbiAgfVxuXG4gIC8vIElmIHdlIGFyZSB1c2luZyBhIG5hbWVzcGFjZVxuICB2YXIgbnMgPSBmYWxzZVxuICBpZiAocHJvcHMubmFtZXNwYWNlKSB7XG4gICAgbnMgPSBwcm9wcy5uYW1lc3BhY2VcbiAgICBkZWxldGUgcHJvcHMubmFtZXNwYWNlXG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIGVsZW1lbnRcbiAgaWYgKG5zKSB7XG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIHRhZylcbiAgfSBlbHNlIGlmICh0YWcgPT09IENPTU1FTlRfVEFHKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQocHJvcHMuY29tbWVudClcbiAgfSBlbHNlIHtcbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICB9XG5cbiAgLy8gSWYgYWRkaW5nIG9ubG9hZCBldmVudHNcbiAgaWYgKHByb3BzLm9ubG9hZCB8fCBwcm9wcy5vbnVubG9hZCkge1xuICAgIHZhciBsb2FkID0gcHJvcHMub25sb2FkIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgdmFyIHVubG9hZCA9IHByb3BzLm9udW5sb2FkIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgb25sb2FkKGVsLCBmdW5jdGlvbiBiZWxPbmxvYWQgKCkge1xuICAgICAgbG9hZChlbClcbiAgICB9LCBmdW5jdGlvbiBiZWxPbnVubG9hZCAoKSB7XG4gICAgICB1bmxvYWQoZWwpXG4gICAgfSxcbiAgICAvLyBXZSBoYXZlIHRvIHVzZSBub24tc3RhbmRhcmQgYGNhbGxlcmAgdG8gZmluZCB3aG8gaW52b2tlcyBgYmVsQ3JlYXRlRWxlbWVudGBcbiAgICBiZWxDcmVhdGVFbGVtZW50LmNhbGxlci5jYWxsZXIuY2FsbGVyKVxuICAgIGRlbGV0ZSBwcm9wcy5vbmxvYWRcbiAgICBkZWxldGUgcHJvcHMub251bmxvYWRcbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgcHJvcGVydGllc1xuICBmb3IgKHZhciBwIGluIHByb3BzKSB7XG4gICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICB2YXIga2V5ID0gcC50b0xvd2VyQ2FzZSgpXG4gICAgICB2YXIgdmFsID0gcHJvcHNbcF1cbiAgICAgIC8vIE5vcm1hbGl6ZSBjbGFzc05hbWVcbiAgICAgIGlmIChrZXkgPT09ICdjbGFzc25hbWUnKSB7XG4gICAgICAgIGtleSA9ICdjbGFzcydcbiAgICAgICAgcCA9ICdjbGFzcydcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBmb3IgYXR0cmlidXRlIGdldHMgdHJhbnNmb3JtZWQgdG8gaHRtbEZvciwgYnV0IHdlIGp1c3Qgc2V0IGFzIGZvclxuICAgICAgaWYgKHAgPT09ICdodG1sRm9yJykge1xuICAgICAgICBwID0gJ2ZvcidcbiAgICAgIH1cbiAgICAgIC8vIElmIGEgcHJvcGVydHkgaXMgYm9vbGVhbiwgc2V0IGl0c2VsZiB0byB0aGUga2V5XG4gICAgICBpZiAoQk9PTF9QUk9QU1trZXldKSB7XG4gICAgICAgIGlmICh2YWwgPT09ICd0cnVlJykgdmFsID0ga2V5XG4gICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykgY29udGludWVcbiAgICAgIH1cbiAgICAgIC8vIElmIGEgcHJvcGVydHkgcHJlZmVycyBiZWluZyBzZXQgZGlyZWN0bHkgdnMgc2V0QXR0cmlidXRlXG4gICAgICBpZiAoa2V5LnNsaWNlKDAsIDIpID09PSAnb24nKSB7XG4gICAgICAgIGVsW3BdID0gdmFsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobnMpIHtcbiAgICAgICAgICBpZiAocCA9PT0gJ3hsaW5rOmhyZWYnKSB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhYTElOS05TLCBwLCB2YWwpXG4gICAgICAgICAgfSBlbHNlIGlmICgvXnhtbG5zKCR8OikvaS50ZXN0KHApKSB7XG4gICAgICAgICAgICAvLyBza2lwIHhtbG5zIGRlZmluaXRpb25zXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKG51bGwsIHAsIHZhbClcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwuc2V0QXR0cmlidXRlKHAsIHZhbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZENoaWxkIChjaGlsZHMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2hpbGRzKSkgcmV0dXJuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBub2RlID0gY2hpbGRzW2ldXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xuICAgICAgICBhcHBlbmRDaGlsZChub2RlKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdudW1iZXInIHx8XG4gICAgICAgIHR5cGVvZiBub2RlID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgdHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgICAgbm9kZSBpbnN0YW5jZW9mIERhdGUgfHxcbiAgICAgICAgbm9kZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICBub2RlID0gbm9kZS50b1N0cmluZygpXG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKGVsLmxhc3RDaGlsZCAmJiBlbC5sYXN0Q2hpbGQubm9kZU5hbWUgPT09ICcjdGV4dCcpIHtcbiAgICAgICAgICBlbC5sYXN0Q2hpbGQubm9kZVZhbHVlICs9IG5vZGVcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShub2RlKVxuICAgICAgfVxuXG4gICAgICBpZiAobm9kZSAmJiBub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGVsLmFwcGVuZENoaWxkKG5vZGUpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFwcGVuZENoaWxkKGNoaWxkcmVuKVxuXG4gIHJldHVybiBlbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGh5cGVyeChiZWxDcmVhdGVFbGVtZW50LCB7Y29tbWVudHM6IHRydWV9KVxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IG1vZHVsZS5leHBvcnRzXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVFbGVtZW50ID0gYmVsQ3JlYXRlRWxlbWVudFxuIiwiIiwiLyogZ2xvYmFsIEhUTUxFbGVtZW50ICovXG5cbid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVtcHR5RWxlbWVudCAoZWxlbWVudCkge1xuICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYW4gZWxlbWVudCcpXG4gIH1cblxuICB2YXIgbm9kZVxuICB3aGlsZSAoKG5vZGUgPSBlbGVtZW50Lmxhc3RDaGlsZCkpIGVsZW1lbnQucmVtb3ZlQ2hpbGQobm9kZSlcbiAgcmV0dXJuIGVsZW1lbnRcbn1cbiIsIi8vXG4vLyBNYWluXG4vL1xuXG5mdW5jdGlvbiBtZW1vaXplIChmbiwgb3B0aW9ucykge1xuICB2YXIgY2FjaGUgPSBvcHRpb25zICYmIG9wdGlvbnMuY2FjaGVcbiAgICA/IG9wdGlvbnMuY2FjaGVcbiAgICA6IGNhY2hlRGVmYXVsdFxuXG4gIHZhciBzZXJpYWxpemVyID0gb3B0aW9ucyAmJiBvcHRpb25zLnNlcmlhbGl6ZXJcbiAgICA/IG9wdGlvbnMuc2VyaWFsaXplclxuICAgIDogc2VyaWFsaXplckRlZmF1bHRcblxuICB2YXIgc3RyYXRlZ3kgPSBvcHRpb25zICYmIG9wdGlvbnMuc3RyYXRlZ3lcbiAgICA/IG9wdGlvbnMuc3RyYXRlZ3lcbiAgICA6IHN0cmF0ZWd5RGVmYXVsdFxuXG4gIHJldHVybiBzdHJhdGVneShmbiwge1xuICAgIGNhY2hlOiBjYWNoZSxcbiAgICBzZXJpYWxpemVyOiBzZXJpYWxpemVyXG4gIH0pXG59XG5cbi8vXG4vLyBTdHJhdGVneVxuLy9cblxuZnVuY3Rpb24gaXNQcmltaXRpdmUgKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgLy8gfHwgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICd1bnNhZmUnIHByaW1pdGl2ZSBmb3Igb3VyIG5lZWRzXG59XG5cbmZ1bmN0aW9uIG1vbmFkaWMgKGZuLCBjYWNoZSwgc2VyaWFsaXplciwgYXJnKSB7XG4gIHZhciBjYWNoZUtleSA9IGlzUHJpbWl0aXZlKGFyZykgPyBhcmcgOiBzZXJpYWxpemVyKGFyZylcblxuICB2YXIgY29tcHV0ZWRWYWx1ZSA9IGNhY2hlLmdldChjYWNoZUtleSlcbiAgaWYgKHR5cGVvZiBjb21wdXRlZFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbXB1dGVkVmFsdWUgPSBmbi5jYWxsKHRoaXMsIGFyZylcbiAgICBjYWNoZS5zZXQoY2FjaGVLZXksIGNvbXB1dGVkVmFsdWUpXG4gIH1cblxuICByZXR1cm4gY29tcHV0ZWRWYWx1ZVxufVxuXG5mdW5jdGlvbiB2YXJpYWRpYyAoZm4sIGNhY2hlLCBzZXJpYWxpemVyKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKVxuICB2YXIgY2FjaGVLZXkgPSBzZXJpYWxpemVyKGFyZ3MpXG5cbiAgdmFyIGNvbXB1dGVkVmFsdWUgPSBjYWNoZS5nZXQoY2FjaGVLZXkpXG4gIGlmICh0eXBlb2YgY29tcHV0ZWRWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb21wdXRlZFZhbHVlID0gZm4uYXBwbHkodGhpcywgYXJncylcbiAgICBjYWNoZS5zZXQoY2FjaGVLZXksIGNvbXB1dGVkVmFsdWUpXG4gIH1cblxuICByZXR1cm4gY29tcHV0ZWRWYWx1ZVxufVxuXG5mdW5jdGlvbiBhc3NlbWJsZSAoZm4sIGNvbnRleHQsIHN0cmF0ZWd5LCBjYWNoZSwgc2VyaWFsaXplKSB7XG4gIHJldHVybiBzdHJhdGVneS5iaW5kKFxuICAgIGNvbnRleHQsXG4gICAgZm4sXG4gICAgY2FjaGUsXG4gICAgc2VyaWFsaXplXG4gIClcbn1cblxuZnVuY3Rpb24gc3RyYXRlZ3lEZWZhdWx0IChmbiwgb3B0aW9ucykge1xuICB2YXIgc3RyYXRlZ3kgPSBmbi5sZW5ndGggPT09IDEgPyBtb25hZGljIDogdmFyaWFkaWNcblxuICByZXR1cm4gYXNzZW1ibGUoXG4gICAgZm4sXG4gICAgdGhpcyxcbiAgICBzdHJhdGVneSxcbiAgICBvcHRpb25zLmNhY2hlLmNyZWF0ZSgpLFxuICAgIG9wdGlvbnMuc2VyaWFsaXplclxuICApXG59XG5cbmZ1bmN0aW9uIHN0cmF0ZWd5VmFyaWFkaWMgKGZuLCBvcHRpb25zKSB7XG4gIHZhciBzdHJhdGVneSA9IHZhcmlhZGljXG5cbiAgcmV0dXJuIGFzc2VtYmxlKFxuICAgIGZuLFxuICAgIHRoaXMsXG4gICAgc3RyYXRlZ3ksXG4gICAgb3B0aW9ucy5jYWNoZS5jcmVhdGUoKSxcbiAgICBvcHRpb25zLnNlcmlhbGl6ZXJcbiAgKVxufVxuXG5mdW5jdGlvbiBzdHJhdGVneU1vbmFkaWMgKGZuLCBvcHRpb25zKSB7XG4gIHZhciBzdHJhdGVneSA9IG1vbmFkaWNcblxuICByZXR1cm4gYXNzZW1ibGUoXG4gICAgZm4sXG4gICAgdGhpcyxcbiAgICBzdHJhdGVneSxcbiAgICBvcHRpb25zLmNhY2hlLmNyZWF0ZSgpLFxuICAgIG9wdGlvbnMuc2VyaWFsaXplclxuICApXG59XG5cbi8vXG4vLyBTZXJpYWxpemVyXG4vL1xuXG5mdW5jdGlvbiBzZXJpYWxpemVyRGVmYXVsdCAoKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmd1bWVudHMpXG59XG5cbi8vXG4vLyBDYWNoZVxuLy9cblxuZnVuY3Rpb24gT2JqZWN0V2l0aG91dFByb3RvdHlwZUNhY2hlICgpIHtcbiAgdGhpcy5jYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbClcbn1cblxuT2JqZWN0V2l0aG91dFByb3RvdHlwZUNhY2hlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiAoa2V5IGluIHRoaXMuY2FjaGUpXG59XG5cbk9iamVjdFdpdGhvdXRQcm90b3R5cGVDYWNoZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5jYWNoZVtrZXldXG59XG5cbk9iamVjdFdpdGhvdXRQcm90b3R5cGVDYWNoZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdGhpcy5jYWNoZVtrZXldID0gdmFsdWVcbn1cblxudmFyIGNhY2hlRGVmYXVsdCA9IHtcbiAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUgKCkge1xuICAgIHJldHVybiBuZXcgT2JqZWN0V2l0aG91dFByb3RvdHlwZUNhY2hlKClcbiAgfVxufVxuXG4vL1xuLy8gQVBJXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lbW9pemVcbm1vZHVsZS5leHBvcnRzLnN0cmF0ZWdpZXMgPSB7XG4gIHZhcmlhZGljOiBzdHJhdGVneVZhcmlhZGljLFxuICBtb25hZGljOiBzdHJhdGVneU1vbmFkaWNcbn1cbiIsInZhciB0b3BMZXZlbCA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDpcbiAgICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHt9XG52YXIgbWluRG9jID0gcmVxdWlyZSgnbWluLWRvY3VtZW50Jyk7XG5cbnZhciBkb2NjeTtcblxuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBkb2NjeSA9IGRvY3VtZW50O1xufSBlbHNlIHtcbiAgICBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J107XG5cbiAgICBpZiAoIWRvY2N5KSB7XG4gICAgICAgIGRvY2N5ID0gdG9wTGV2ZWxbJ19fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDQnXSA9IG1pbkRvYztcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZG9jY3k7XG4iLCJ2YXIgd2luO1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHdpbiA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHdpbiA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpe1xuICAgIHdpbiA9IHNlbGY7XG59IGVsc2Uge1xuICAgIHdpbiA9IHt9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpbjtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXR0cmlidXRlVG9Qcm9wZXJ0eVxuXG52YXIgdHJhbnNmb3JtID0ge1xuICAnY2xhc3MnOiAnY2xhc3NOYW1lJyxcbiAgJ2Zvcic6ICdodG1sRm9yJyxcbiAgJ2h0dHAtZXF1aXYnOiAnaHR0cEVxdWl2J1xufVxuXG5mdW5jdGlvbiBhdHRyaWJ1dGVUb1Byb3BlcnR5IChoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGFnTmFtZSwgYXR0cnMsIGNoaWxkcmVuKSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRycykge1xuICAgICAgaWYgKGF0dHIgaW4gdHJhbnNmb3JtKSB7XG4gICAgICAgIGF0dHJzW3RyYW5zZm9ybVthdHRyXV0gPSBhdHRyc1thdHRyXVxuICAgICAgICBkZWxldGUgYXR0cnNbYXR0cl1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGgodGFnTmFtZSwgYXR0cnMsIGNoaWxkcmVuKVxuICB9XG59XG4iLCJ2YXIgYXR0clRvUHJvcCA9IHJlcXVpcmUoJ2h5cGVyc2NyaXB0LWF0dHJpYnV0ZS10by1wcm9wZXJ0eScpXG5cbnZhciBWQVIgPSAwLCBURVhUID0gMSwgT1BFTiA9IDIsIENMT1NFID0gMywgQVRUUiA9IDRcbnZhciBBVFRSX0tFWSA9IDUsIEFUVFJfS0VZX1cgPSA2XG52YXIgQVRUUl9WQUxVRV9XID0gNywgQVRUUl9WQUxVRSA9IDhcbnZhciBBVFRSX1ZBTFVFX1NRID0gOSwgQVRUUl9WQUxVRV9EUSA9IDEwXG52YXIgQVRUUl9FUSA9IDExLCBBVFRSX0JSRUFLID0gMTJcbnZhciBDT01NRU5UID0gMTNcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fVxuICB2YXIgY29uY2F0ID0gb3B0cy5jb25jYXQgfHwgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gU3RyaW5nKGEpICsgU3RyaW5nKGIpXG4gIH1cbiAgaWYgKG9wdHMuYXR0clRvUHJvcCAhPT0gZmFsc2UpIHtcbiAgICBoID0gYXR0clRvUHJvcChoKVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChzdHJpbmdzKSB7XG4gICAgdmFyIHN0YXRlID0gVEVYVCwgcmVnID0gJydcbiAgICB2YXIgYXJnbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBwYXJ0cyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChpIDwgYXJnbGVuIC0gMSkge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2krMV1cbiAgICAgICAgdmFyIHAgPSBwYXJzZShzdHJpbmdzW2ldKVxuICAgICAgICB2YXIgeHN0YXRlID0gc3RhdGVcbiAgICAgICAgaWYgKHhzdGF0ZSA9PT0gQVRUUl9WQUxVRV9EUSkgeHN0YXRlID0gQVRUUl9WQUxVRVxuICAgICAgICBpZiAoeHN0YXRlID09PSBBVFRSX1ZBTFVFX1NRKSB4c3RhdGUgPSBBVFRSX1ZBTFVFXG4gICAgICAgIGlmICh4c3RhdGUgPT09IEFUVFJfVkFMVUVfVykgeHN0YXRlID0gQVRUUl9WQUxVRVxuICAgICAgICBpZiAoeHN0YXRlID09PSBBVFRSKSB4c3RhdGUgPSBBVFRSX0tFWVxuICAgICAgICBpZiAoeHN0YXRlID09PSBPUEVOKSB7XG4gICAgICAgICAgaWYgKHJlZyA9PT0gJy8nKSB7XG4gICAgICAgICAgICBwLnB1c2goWyBPUEVOLCAnLycsIGFyZyBdKVxuICAgICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcC5wdXNoKFsgT1BFTiwgYXJnIF0pXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHhzdGF0ZSA9PT0gQ09NTUVOVCAmJiBvcHRzLmNvbW1lbnRzKSB7XG4gICAgICAgICAgcmVnICs9IFN0cmluZyhhcmcpXG4gICAgICAgIH0gZWxzZSBpZiAoeHN0YXRlICE9PSBDT01NRU5UKSB7XG4gICAgICAgICAgcC5wdXNoKFsgVkFSLCB4c3RhdGUsIGFyZyBdKVxuICAgICAgICB9XG4gICAgICAgIHBhcnRzLnB1c2guYXBwbHkocGFydHMsIHApXG4gICAgICB9IGVsc2UgcGFydHMucHVzaC5hcHBseShwYXJ0cywgcGFyc2Uoc3RyaW5nc1tpXSkpXG4gICAgfVxuXG4gICAgdmFyIHRyZWUgPSBbbnVsbCx7fSxbXV1cbiAgICB2YXIgc3RhY2sgPSBbW3RyZWUsLTFdXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjdXIgPSBzdGFja1tzdGFjay5sZW5ndGgtMV1bMF1cbiAgICAgIHZhciBwID0gcGFydHNbaV0sIHMgPSBwWzBdXG4gICAgICBpZiAocyA9PT0gT1BFTiAmJiAvXlxcLy8udGVzdChwWzFdKSkge1xuICAgICAgICB2YXIgaXggPSBzdGFja1tzdGFjay5sZW5ndGgtMV1bMV1cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgIHN0YWNrW3N0YWNrLmxlbmd0aC0xXVswXVsyXVtpeF0gPSBoKFxuICAgICAgICAgICAgY3VyWzBdLCBjdXJbMV0sIGN1clsyXS5sZW5ndGggPyBjdXJbMl0gOiB1bmRlZmluZWRcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocyA9PT0gT1BFTikge1xuICAgICAgICB2YXIgYyA9IFtwWzFdLHt9LFtdXVxuICAgICAgICBjdXJbMl0ucHVzaChjKVxuICAgICAgICBzdGFjay5wdXNoKFtjLGN1clsyXS5sZW5ndGgtMV0pXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IEFUVFJfS0VZIHx8IChzID09PSBWQVIgJiYgcFsxXSA9PT0gQVRUUl9LRVkpKSB7XG4gICAgICAgIHZhciBrZXkgPSAnJ1xuICAgICAgICB2YXIgY29weUtleVxuICAgICAgICBmb3IgKDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHBhcnRzW2ldWzBdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAga2V5ID0gY29uY2F0KGtleSwgcGFydHNbaV1bMV0pXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tpXVswXSA9PT0gVkFSICYmIHBhcnRzW2ldWzFdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJ0c1tpXVsyXSA9PT0gJ29iamVjdCcgJiYgIWtleSkge1xuICAgICAgICAgICAgICBmb3IgKGNvcHlLZXkgaW4gcGFydHNbaV1bMl0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFydHNbaV1bMl0uaGFzT3duUHJvcGVydHkoY29weUtleSkgJiYgIWN1clsxXVtjb3B5S2V5XSkge1xuICAgICAgICAgICAgICAgICAgY3VyWzFdW2NvcHlLZXldID0gcGFydHNbaV1bMl1bY29weUtleV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGtleSA9IGNvbmNhdChrZXksIHBhcnRzW2ldWzJdKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBicmVha1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0c1tpXVswXSA9PT0gQVRUUl9FUSkgaSsrXG4gICAgICAgIHZhciBqID0gaVxuICAgICAgICBmb3IgKDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHBhcnRzW2ldWzBdID09PSBBVFRSX1ZBTFVFIHx8IHBhcnRzW2ldWzBdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAgaWYgKCFjdXJbMV1ba2V5XSkgY3VyWzFdW2tleV0gPSBzdHJmbihwYXJ0c1tpXVsxXSlcbiAgICAgICAgICAgIGVsc2UgcGFydHNbaV1bMV09PT1cIlwiIHx8IChjdXJbMV1ba2V5XSA9IGNvbmNhdChjdXJbMV1ba2V5XSwgcGFydHNbaV1bMV0pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2ldWzBdID09PSBWQVJcbiAgICAgICAgICAmJiAocGFydHNbaV1bMV0gPT09IEFUVFJfVkFMVUUgfHwgcGFydHNbaV1bMV0gPT09IEFUVFJfS0VZKSkge1xuICAgICAgICAgICAgaWYgKCFjdXJbMV1ba2V5XSkgY3VyWzFdW2tleV0gPSBzdHJmbihwYXJ0c1tpXVsyXSlcbiAgICAgICAgICAgIGVsc2UgcGFydHNbaV1bMl09PT1cIlwiIHx8IChjdXJbMV1ba2V5XSA9IGNvbmNhdChjdXJbMV1ba2V5XSwgcGFydHNbaV1bMl0pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGtleS5sZW5ndGggJiYgIWN1clsxXVtrZXldICYmIGkgPT09IGpcbiAgICAgICAgICAgICYmIChwYXJ0c1tpXVswXSA9PT0gQ0xPU0UgfHwgcGFydHNbaV1bMF0gPT09IEFUVFJfQlJFQUspKSB7XG4gICAgICAgICAgICAgIC8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZnJhc3RydWN0dXJlLmh0bWwjYm9vbGVhbi1hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgIC8vIGVtcHR5IHN0cmluZyBpcyBmYWxzeSwgbm90IHdlbGwgYmVoYXZlZCB2YWx1ZSBpbiBicm93c2VyXG4gICAgICAgICAgICAgIGN1clsxXVtrZXldID0ga2V5LnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJ0c1tpXVswXSA9PT0gQ0xPU0UpIHtcbiAgICAgICAgICAgICAgaS0tXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBBVFRSX0tFWSkge1xuICAgICAgICBjdXJbMV1bcFsxXV0gPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IFZBUiAmJiBwWzFdID09PSBBVFRSX0tFWSkge1xuICAgICAgICBjdXJbMV1bcFsyXV0gPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IENMT1NFKSB7XG4gICAgICAgIGlmIChzZWxmQ2xvc2luZyhjdXJbMF0pICYmIHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBpeCA9IHN0YWNrW3N0YWNrLmxlbmd0aC0xXVsxXVxuICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgc3RhY2tbc3RhY2subGVuZ3RoLTFdWzBdWzJdW2l4XSA9IGgoXG4gICAgICAgICAgICBjdXJbMF0sIGN1clsxXSwgY3VyWzJdLmxlbmd0aCA/IGN1clsyXSA6IHVuZGVmaW5lZFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBWQVIgJiYgcFsxXSA9PT0gVEVYVCkge1xuICAgICAgICBpZiAocFsyXSA9PT0gdW5kZWZpbmVkIHx8IHBbMl0gPT09IG51bGwpIHBbMl0gPSAnJ1xuICAgICAgICBlbHNlIGlmICghcFsyXSkgcFsyXSA9IGNvbmNhdCgnJywgcFsyXSlcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocFsyXVswXSkpIHtcbiAgICAgICAgICBjdXJbMl0ucHVzaC5hcHBseShjdXJbMl0sIHBbMl0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VyWzJdLnB1c2gocFsyXSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBURVhUKSB7XG4gICAgICAgIGN1clsyXS5wdXNoKHBbMV0pXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IEFUVFJfRVEgfHwgcyA9PT0gQVRUUl9CUkVBSykge1xuICAgICAgICAvLyBuby1vcFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmhhbmRsZWQ6ICcgKyBzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0cmVlWzJdLmxlbmd0aCA+IDEgJiYgL15cXHMqJC8udGVzdCh0cmVlWzJdWzBdKSkge1xuICAgICAgdHJlZVsyXS5zaGlmdCgpXG4gICAgfVxuXG4gICAgaWYgKHRyZWVbMl0ubGVuZ3RoID4gMlxuICAgIHx8ICh0cmVlWzJdLmxlbmd0aCA9PT0gMiAmJiAvXFxTLy50ZXN0KHRyZWVbMl1bMV0pKSkge1xuICAgICAgaWYgKG9wdHMuY3JlYXRlRnJhZ21lbnQpIHJldHVybiBvcHRzLmNyZWF0ZUZyYWdtZW50KHRyZWVbMl0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdtdWx0aXBsZSByb290IGVsZW1lbnRzIG11c3QgYmUgd3JhcHBlZCBpbiBhbiBlbmNsb3NpbmcgdGFnJ1xuICAgICAgKVxuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmVlWzJdWzBdKSAmJiB0eXBlb2YgdHJlZVsyXVswXVswXSA9PT0gJ3N0cmluZydcbiAgICAmJiBBcnJheS5pc0FycmF5KHRyZWVbMl1bMF1bMl0pKSB7XG4gICAgICB0cmVlWzJdWzBdID0gaCh0cmVlWzJdWzBdWzBdLCB0cmVlWzJdWzBdWzFdLCB0cmVlWzJdWzBdWzJdKVxuICAgIH1cbiAgICByZXR1cm4gdHJlZVsyXVswXVxuXG4gICAgZnVuY3Rpb24gcGFyc2UgKHN0cikge1xuICAgICAgdmFyIHJlcyA9IFtdXG4gICAgICBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfVykgc3RhdGUgPSBBVFRSXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYyA9IHN0ci5jaGFyQXQoaSlcbiAgICAgICAgaWYgKHN0YXRlID09PSBURVhUICYmIGMgPT09ICc8Jykge1xuICAgICAgICAgIGlmIChyZWcubGVuZ3RoKSByZXMucHVzaChbVEVYVCwgcmVnXSlcbiAgICAgICAgICByZWcgPSAnJ1xuICAgICAgICAgIHN0YXRlID0gT1BFTlxuICAgICAgICB9IGVsc2UgaWYgKGMgPT09ICc+JyAmJiAhcXVvdChzdGF0ZSkgJiYgc3RhdGUgIT09IENPTU1FTlQpIHtcbiAgICAgICAgICBpZiAoc3RhdGUgPT09IE9QRU4gJiYgcmVnLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVzLnB1c2goW09QRU4scmVnXSlcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9WQUxVRSAmJiByZWcubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXMucHVzaChbQVRUUl9WQUxVRSxyZWddKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXMucHVzaChbQ0xPU0VdKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBURVhUXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IENPTU1FTlQgJiYgLy0kLy50ZXN0KHJlZykgJiYgYyA9PT0gJy0nKSB7XG4gICAgICAgICAgaWYgKG9wdHMuY29tbWVudHMpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZy5zdWJzdHIoMCwgcmVnLmxlbmd0aCAtIDEpXSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IFRFWFRcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gT1BFTiAmJiAvXiEtLSQvLnRlc3QocmVnKSkge1xuICAgICAgICAgIGlmIChvcHRzLmNvbW1lbnRzKSB7XG4gICAgICAgICAgICByZXMucHVzaChbT1BFTiwgcmVnXSxbQVRUUl9LRVksJ2NvbW1lbnQnXSxbQVRUUl9FUV0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZyA9IGNcbiAgICAgICAgICBzdGF0ZSA9IENPTU1FTlRcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gVEVYVCB8fCBzdGF0ZSA9PT0gQ09NTUVOVCkge1xuICAgICAgICAgIHJlZyArPSBjXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IE9QRU4gJiYgYyA9PT0gJy8nICYmIHJlZy5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBuby1vcCwgc2VsZiBjbG9zaW5nIHRhZyB3aXRob3V0IGEgc3BhY2UgPGJyLz5cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gT1BFTiAmJiAvXFxzLy50ZXN0KGMpKSB7XG4gICAgICAgICAgaWYgKHJlZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtPUEVOLCByZWddKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZWcgPSAnJ1xuICAgICAgICAgIHN0YXRlID0gQVRUUlxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBPUEVOKSB7XG4gICAgICAgICAgcmVnICs9IGNcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUiAmJiAvW15cXHNcIic9L10vLnRlc3QoYykpIHtcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJfS0VZXG4gICAgICAgICAgcmVnID0gY1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSICYmIC9cXHMvLnRlc3QoYykpIHtcbiAgICAgICAgICBpZiAocmVnLmxlbmd0aCkgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfQlJFQUtdKVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX0tFWSAmJiAvXFxzLy50ZXN0KGMpKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJfS0VZX1dcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkgJiYgYyA9PT0gJz0nKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10sW0FUVFJfRVFdKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFX1dcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkpIHtcbiAgICAgICAgICByZWcgKz0gY1xuICAgICAgICB9IGVsc2UgaWYgKChzdGF0ZSA9PT0gQVRUUl9LRVlfVyB8fCBzdGF0ZSA9PT0gQVRUUikgJiYgYyA9PT0gJz0nKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfRVFdKVxuICAgICAgICAgIHN0YXRlID0gQVRUUl9WQUxVRV9XXG4gICAgICAgIH0gZWxzZSBpZiAoKHN0YXRlID09PSBBVFRSX0tFWV9XIHx8IHN0YXRlID09PSBBVFRSKSAmJiAhL1xccy8udGVzdChjKSkge1xuICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX0JSRUFLXSlcbiAgICAgICAgICBpZiAoL1tcXHctXS8udGVzdChjKSkge1xuICAgICAgICAgICAgcmVnICs9IGNcbiAgICAgICAgICAgIHN0YXRlID0gQVRUUl9LRVlcbiAgICAgICAgICB9IGVsc2Ugc3RhdGUgPSBBVFRSXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfVyAmJiBjID09PSAnXCInKSB7XG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFX0RRXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfVyAmJiBjID09PSBcIidcIikge1xuICAgICAgICAgIHN0YXRlID0gQVRUUl9WQUxVRV9TUVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX0RRICYmIGMgPT09ICdcIicpIHtcbiAgICAgICAgICByZXMucHVzaChbQVRUUl9WQUxVRSxyZWddLFtBVFRSX0JSRUFLXSlcbiAgICAgICAgICByZWcgPSAnJ1xuICAgICAgICAgIHN0YXRlID0gQVRUUlxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX1NRICYmIGMgPT09IFwiJ1wiKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfVkFMVUUscmVnXSxbQVRUUl9CUkVBS10pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9WQUxVRV9XICYmICEvXFxzLy50ZXN0KGMpKSB7XG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFXG4gICAgICAgICAgaS0tXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUUgJiYgL1xccy8udGVzdChjKSkge1xuICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZ10sW0FUVFJfQlJFQUtdKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBBVFRSXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUUgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfU1FcbiAgICAgICAgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfRFEpIHtcbiAgICAgICAgICByZWcgKz0gY1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUgPT09IFRFWFQgJiYgcmVnLmxlbmd0aCkge1xuICAgICAgICByZXMucHVzaChbVEVYVCxyZWddKVxuICAgICAgICByZWcgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9WQUxVRSAmJiByZWcubGVuZ3RoKSB7XG4gICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZ10pXG4gICAgICAgIHJlZyA9ICcnXG4gICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX0RRICYmIHJlZy5sZW5ndGgpIHtcbiAgICAgICAgcmVzLnB1c2goW0FUVFJfVkFMVUUscmVnXSlcbiAgICAgICAgcmVnID0gJydcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfU1EgJiYgcmVnLmxlbmd0aCkge1xuICAgICAgICByZXMucHVzaChbQVRUUl9WQUxVRSxyZWddKVxuICAgICAgICByZWcgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkpIHtcbiAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgIHJlZyA9ICcnXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RyZm4gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09ICdmdW5jdGlvbicpIHJldHVybiB4XG4gICAgZWxzZSBpZiAodHlwZW9mIHggPT09ICdzdHJpbmcnKSByZXR1cm4geFxuICAgIGVsc2UgaWYgKHggJiYgdHlwZW9mIHggPT09ICdvYmplY3QnKSByZXR1cm4geFxuICAgIGVsc2UgaWYgKHggPT09IG51bGwgfHwgeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4geFxuICAgIGVsc2UgcmV0dXJuIGNvbmNhdCgnJywgeClcbiAgfVxufVxuXG5mdW5jdGlvbiBxdW90IChzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUgPT09IEFUVFJfVkFMVUVfU1EgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfRFFcbn1cblxudmFyIGNsb3NlUkUgPSBSZWdFeHAoJ14oJyArIFtcbiAgJ2FyZWEnLCAnYmFzZScsICdiYXNlZm9udCcsICdiZ3NvdW5kJywgJ2JyJywgJ2NvbCcsICdjb21tYW5kJywgJ2VtYmVkJyxcbiAgJ2ZyYW1lJywgJ2hyJywgJ2ltZycsICdpbnB1dCcsICdpc2luZGV4JywgJ2tleWdlbicsICdsaW5rJywgJ21ldGEnLCAncGFyYW0nLFxuICAnc291cmNlJywgJ3RyYWNrJywgJ3dicicsICchLS0nLFxuICAvLyBTVkcgVEFHU1xuICAnYW5pbWF0ZScsICdhbmltYXRlVHJhbnNmb3JtJywgJ2NpcmNsZScsICdjdXJzb3InLCAnZGVzYycsICdlbGxpcHNlJyxcbiAgJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvc2l0ZScsXG4gICdmZUNvbnZvbHZlTWF0cml4JywgJ2ZlRGlmZnVzZUxpZ2h0aW5nJywgJ2ZlRGlzcGxhY2VtZW50TWFwJyxcbiAgJ2ZlRGlzdGFudExpZ2h0JywgJ2ZlRmxvb2QnLCAnZmVGdW5jQScsICdmZUZ1bmNCJywgJ2ZlRnVuY0cnLCAnZmVGdW5jUicsXG4gICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2VOb2RlJywgJ2ZlTW9ycGhvbG9neScsXG4gICdmZU9mZnNldCcsICdmZVBvaW50TGlnaHQnLCAnZmVTcGVjdWxhckxpZ2h0aW5nJywgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsXG4gICdmZVR1cmJ1bGVuY2UnLCAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2UtdXJpJyxcbiAgJ2dseXBoJywgJ2dseXBoUmVmJywgJ2hrZXJuJywgJ2ltYWdlJywgJ2xpbmUnLCAnbWlzc2luZy1nbHlwaCcsICdtcGF0aCcsXG4gICdwYXRoJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmVjdCcsICdzZXQnLCAnc3RvcCcsICd0cmVmJywgJ3VzZScsICd2aWV3JyxcbiAgJ3ZrZXJuJ1xuXS5qb2luKCd8JykgKyAnKSg/OltcXC4jXVthLXpBLVowLTlcXHUwMDdGLVxcdUZGRkZfOi1dKykqJCcpXG5mdW5jdGlvbiBzZWxmQ2xvc2luZyAodGFnKSB7IHJldHVybiBjbG9zZVJFLnRlc3QodGFnKSB9XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMucGFyc2UgPSB2b2lkIDA7XG52YXIgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnZhciBwYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3NyYy9wYXJzZXJcIik7XG52YXIgbm9ybWFsaXplXzEgPSByZXF1aXJlKFwiLi9zcmMvbm9ybWFsaXplXCIpO1xudHNsaWJfMS5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc3JjL3R5cGVzXCIpLCBleHBvcnRzKTtcbnRzbGliXzEuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3NyYy9wYXJzZXJcIiksIGV4cG9ydHMpO1xuZnVuY3Rpb24gcGFyc2UoaW5wdXQsIG9wdHMpIHtcbiAgICBvcHRzID0gdHNsaWJfMS5fX2Fzc2lnbih7IG5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbDogdHJ1ZSwgc2hvdWxkUGFyc2VTa2VsZXRvbjogdHJ1ZSB9LCAob3B0cyB8fCB7fSkpO1xuICAgIHZhciBlbHMgPSBwYXJzZXJfMS5wZWdQYXJzZShpbnB1dCwgb3B0cyk7XG4gICAgaWYgKG9wdHMubm9ybWFsaXplSGFzaHRhZ0luUGx1cmFsKSB7XG4gICAgICAgIG5vcm1hbGl6ZV8xLm5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbChlbHMpO1xuICAgIH1cbiAgICByZXR1cm4gZWxzO1xufVxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLm5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbCA9IHZvaWQgMDtcbnZhciB0c2xpYl8xID0gcmVxdWlyZShcInRzbGliXCIpO1xudmFyIHR5cGVzXzEgPSByZXF1aXJlKFwiLi90eXBlc1wiKTtcbnZhciBwYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3BhcnNlclwiKTtcbnZhciBQTFVSQUxfSEFTSFRBR19SRUdFWCA9IC8oXnxbXlxcXFxdKSMvZztcbi8qKlxuICogV2hldGhlciB0byBjb252ZXJ0IGAjYCBpbiBwbHVyYWwgcnVsZSBvcHRpb25zXG4gKiB0byBge3ZhciwgbnVtYmVyfWBcbiAqIEBwYXJhbSBlbCBBU1QgRWxlbWVudFxuICogQHBhcmFtIHBsdXJhbFN0YWNrIGN1cnJlbnQgcGx1cmFsIHN0YWNrXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbChlbHMpIHtcbiAgICBlbHMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgZW5jb3VudGVyaW5nIGEgcGx1cmFsIGVsXG4gICAgICAgIGlmICghdHlwZXNfMS5pc1BsdXJhbEVsZW1lbnQoZWwpICYmICF0eXBlc18xLmlzU2VsZWN0RWxlbWVudChlbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBHbyBkb3duIHRoZSBvcHRpb25zIGFuZCBzZWFyY2ggZm9yICMgaW4gYW55IGxpdGVyYWwgZWxlbWVudFxuICAgICAgICBPYmplY3Qua2V5cyhlbC5vcHRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgdmFyIG9wdCA9IGVsLm9wdGlvbnNbaWRdO1xuICAgICAgICAgICAgLy8gSWYgd2UgZ290IGEgbWF0Y2gsIHdlIGhhdmUgdG8gc3BsaXQgdGhpc1xuICAgICAgICAgICAgLy8gYW5kIGluamVjdCBhIE51bWJlckVsZW1lbnQgaW4gdGhlIG1pZGRsZVxuICAgICAgICAgICAgdmFyIG1hdGNoaW5nTGl0ZXJhbEVsSW5kZXggPSAtMTtcbiAgICAgICAgICAgIHZhciBsaXRlcmFsRWwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdC52YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlbF8xID0gb3B0LnZhbHVlW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlc18xLmlzTGl0ZXJhbEVsZW1lbnQoZWxfMSkgJiYgUExVUkFMX0hBU0hUQUdfUkVHRVgudGVzdChlbF8xLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ0xpdGVyYWxFbEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgbGl0ZXJhbEVsID0gZWxfMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxpdGVyYWxFbCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IGxpdGVyYWxFbC52YWx1ZS5yZXBsYWNlKFBMVVJBTF9IQVNIVEFHX1JFR0VYLCBcIiQxe1wiICsgZWwudmFsdWUgKyBcIiwgbnVtYmVyfVwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3RWxzID0gcGFyc2VyXzEucGVnUGFyc2UobmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIChfYSA9IG9wdC52YWx1ZSkuc3BsaWNlLmFwcGx5KF9hLCB0c2xpYl8xLl9fc3ByZWFkQXJyYXlzKFttYXRjaGluZ0xpdGVyYWxFbEluZGV4LCAxXSwgbmV3RWxzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub3JtYWxpemVIYXNodGFnSW5QbHVyYWwob3B0LnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5leHBvcnRzLm5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbCA9IG5vcm1hbGl6ZUhhc2h0YWdJblBsdXJhbDtcbiIsIlwidXNlIHN0cmljdFwiO1xuLy8gQHRzLW5vY2hlY2tcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMucGVnUGFyc2UgPSBleHBvcnRzLlN5bnRheEVycm9yID0gdm9pZCAwO1xudmFyIHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG4vLyBAZ2VuZXJhdGVkXG52YXIgdHlwZXNfMSA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpO1xudmFyIHNrZWxldG9uXzEgPSByZXF1aXJlKFwiLi9za2VsZXRvblwiKTtcbnZhciBTeW50YXhFcnJvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICB0c2xpYl8xLl9fZXh0ZW5kcyhTeW50YXhFcnJvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTeW50YXhFcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgZm91bmQsIGxvY2F0aW9uKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICBfdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkO1xuICAgICAgICBfdGhpcy5mb3VuZCA9IGZvdW5kO1xuICAgICAgICBfdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICBfdGhpcy5uYW1lID0gXCJTeW50YXhFcnJvclwiO1xuICAgICAgICBpZiAodHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKF90aGlzLCBTeW50YXhFcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTeW50YXhFcnJvci5idWlsZE1lc3NhZ2UgPSBmdW5jdGlvbiAoZXhwZWN0ZWQsIGZvdW5kKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhleChjaCkge1xuICAgICAgICAgICAgcmV0dXJuIGNoLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbGl0ZXJhbEVzY2FwZShzKSB7XG4gICAgICAgICAgICByZXR1cm4gc1xuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcL2csIFwiXFxcXFxcXFxcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgXCJcXFxcXFxcIlwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXDAvZywgXCJcXFxcMFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHQvZywgXCJcXFxcdFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgXCJcXFxcblwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHIvZywgXCJcXFxcclwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MDAtXFx4MEZdL2csIGZ1bmN0aW9uIChjaCkgeyByZXR1cm4gXCJcXFxceDBcIiArIGhleChjaCk7IH0pXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHgxMC1cXHgxRlxceDdGLVxceDlGXS9nLCBmdW5jdGlvbiAoY2gpIHsgcmV0dXJuIFwiXFxcXHhcIiArIGhleChjaCk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNsYXNzRXNjYXBlKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXF0vZywgXCJcXFxcXVwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXF4vZywgXCJcXFxcXlwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8tL2csIFwiXFxcXC1cIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwwL2csIFwiXFxcXDBcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFx0L2csIFwiXFxcXHRcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuL2csIFwiXFxcXG5cIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxyL2csIFwiXFxcXHJcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvW1xceDAwLVxceDBGXS9nLCBmdW5jdGlvbiAoY2gpIHsgcmV0dXJuIFwiXFxcXHgwXCIgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg3Ri1cXHg5Rl0vZywgZnVuY3Rpb24gKGNoKSB7IHJldHVybiBcIlxcXFx4XCIgKyBoZXgoY2gpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBkZXNjcmliZUV4cGVjdGF0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGV4cGVjdGF0aW9uLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcXFwiXCIgKyBsaXRlcmFsRXNjYXBlKGV4cGVjdGF0aW9uLnRleHQpICsgXCJcXFwiXCI7XG4gICAgICAgICAgICAgICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICAgICAgICAgICAgICAgIHZhciBlc2NhcGVkUGFydHMgPSBleHBlY3RhdGlvbi5wYXJ0cy5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHBhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBjbGFzc0VzY2FwZShwYXJ0WzBdKSArIFwiLVwiICsgY2xhc3NFc2NhcGUocGFydFsxXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNsYXNzRXNjYXBlKHBhcnQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiW1wiICsgKGV4cGVjdGF0aW9uLmludmVydGVkID8gXCJeXCIgOiBcIlwiKSArIGVzY2FwZWRQYXJ0cyArIFwiXVwiO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJhbnlcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYW55IGNoYXJhY3RlclwiO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZW5kIG9mIGlucHV0XCI7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm90aGVyXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbi5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBkZXNjcmliZUV4cGVjdGVkKGV4cGVjdGVkMSkge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9ucyA9IGV4cGVjdGVkMS5tYXAoZGVzY3JpYmVFeHBlY3RhdGlvbik7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIHZhciBqO1xuICAgICAgICAgICAgZGVzY3JpcHRpb25zLnNvcnQoKTtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDEsIGogPSAxOyBpIDwgZGVzY3JpcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXNjcmlwdGlvbnNbaSAtIDFdICE9PSBkZXNjcmlwdGlvbnNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uc1tqXSA9IGRlc2NyaXB0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbnMubGVuZ3RoID0gajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZGVzY3JpcHRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uc1swXTtcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZXNjcmlwdGlvbnNbMF0gKyBcIiBvciBcIiArIGRlc2NyaXB0aW9uc1sxXTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVzY3JpcHRpb25zLnNsaWNlKDAsIC0xKS5qb2luKFwiLCBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICsgXCIsIG9yIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICArIGRlc2NyaXB0aW9uc1tkZXNjcmlwdGlvbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZGVzY3JpYmVGb3VuZChmb3VuZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3VuZDEgPyBcIlxcXCJcIiArIGxpdGVyYWxFc2NhcGUoZm91bmQxKSArIFwiXFxcIlwiIDogXCJlbmQgb2YgaW5wdXRcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJFeHBlY3RlZCBcIiArIGRlc2NyaWJlRXhwZWN0ZWQoZXhwZWN0ZWQpICsgXCIgYnV0IFwiICsgZGVzY3JpYmVGb3VuZChmb3VuZCkgKyBcIiBmb3VuZC5cIjtcbiAgICB9O1xuICAgIHJldHVybiBTeW50YXhFcnJvcjtcbn0oRXJyb3IpKTtcbmV4cG9ydHMuU3ludGF4RXJyb3IgPSBTeW50YXhFcnJvcjtcbmZ1bmN0aW9uIHBlZyRwYXJzZShpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zICE9PSB1bmRlZmluZWQgPyBvcHRpb25zIDoge307XG4gICAgdmFyIHBlZyRGQUlMRUQgPSB7fTtcbiAgICB2YXIgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9ucyA9IHsgc3RhcnQ6IHBlZyRwYXJzZXN0YXJ0IH07XG4gICAgdmFyIHBlZyRzdGFydFJ1bGVGdW5jdGlvbiA9IHBlZyRwYXJzZXN0YXJ0O1xuICAgIHZhciBwZWckYzAgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAhaWdub3JlVGFnOyB9O1xuICAgIHZhciBwZWckYzEgPSBmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfTtcbiAgICB2YXIgcGVnJGMyID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gaWdub3JlVGFnOyB9O1xuICAgIHZhciBwZWckYzMgPSBcIjxcIjtcbiAgICB2YXIgcGVnJGM0ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIjxcIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzUgPSBmdW5jdGlvbiAocGFydHMpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjNiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICc8JzsgfTtcbiAgICB2YXIgcGVnJGM3ID0gZnVuY3Rpb24gKG1lc3NhZ2VUZXh0KSB7XG4gICAgICAgIHJldHVybiB0c2xpYl8xLl9fYXNzaWduKHsgdHlwZTogdHlwZXNfMS5UWVBFLmxpdGVyYWwsIHZhbHVlOiBtZXNzYWdlVGV4dCB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzggPSBcIiNcIjtcbiAgICB2YXIgcGVnJGM5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIiNcIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzEwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IHR5cGVzXzEuVFlQRS5wb3VuZCB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzExID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJ0YWdFbGVtZW50XCIpO1xuICAgIHZhciBwZWckYzEyID0gZnVuY3Rpb24gKG9wZW4sIGNoaWxkcmVuLCBjbG9zZSkge1xuICAgICAgICBpZiAob3BlbiAhPT0gY2xvc2UpIHtcbiAgICAgICAgICAgIGVycm9yKFwiTWlzbWF0Y2ggdGFnIFxcXCJcIiArIG9wZW4gKyBcIlxcXCIgIT09IFxcXCJcIiArIGNsb3NlICsgXCJcXFwiXCIsIGxvY2F0aW9uKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0c2xpYl8xLl9fYXNzaWduKHsgdHlwZTogdHlwZXNfMS5UWVBFLnRhZywgdmFsdWU6IG9wZW4sIGNoaWxkcmVuOiBjaGlsZHJlbiB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzEzID0gXCIvPlwiO1xuICAgIHZhciBwZWckYzE0ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi8+XCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGMxNSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IHR5cGVzXzEuVFlQRS5saXRlcmFsLCB2YWx1ZTogdmFsdWUuam9pbignJykgfSwgaW5zZXJ0TG9jYXRpb24oKSk7XG4gICAgfTtcbiAgICB2YXIgcGVnJGMxNiA9IFwiPlwiO1xuICAgIHZhciBwZWckYzE3ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIj5cIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzE4ID0gZnVuY3Rpb24gKHRhZykgeyByZXR1cm4gdGFnOyB9O1xuICAgIHZhciBwZWckYzE5ID0gXCI8L1wiO1xuICAgIHZhciBwZWckYzIwID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIjwvXCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGMyMSA9IHBlZyRvdGhlckV4cGVjdGF0aW9uKFwiYXJndW1lbnRFbGVtZW50XCIpO1xuICAgIHZhciBwZWckYzIyID0gXCJ7XCI7XG4gICAgdmFyIHBlZyRjMjMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwie1wiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjMjQgPSBcIn1cIjtcbiAgICB2YXIgcGVnJGMyNSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJ9XCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGMyNiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IHR5cGVzXzEuVFlQRS5hcmd1bWVudCwgdmFsdWU6IHZhbHVlIH0sIGluc2VydExvY2F0aW9uKCkpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjMjcgPSBwZWckb3RoZXJFeHBlY3RhdGlvbihcIm51bWJlclNrZWxldG9uSWRcIik7XG4gICAgdmFyIHBlZyRjMjggPSAvXlsnXFwve31dLztcbiAgICB2YXIgcGVnJGMyOSA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtcIidcIiwgXCIvXCIsIFwie1wiLCBcIn1cIl0sIGZhbHNlLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjMzAgPSBwZWckYW55RXhwZWN0YXRpb24oKTtcbiAgICB2YXIgcGVnJGMzMSA9IHBlZyRvdGhlckV4cGVjdGF0aW9uKFwibnVtYmVyU2tlbGV0b25Ub2tlbk9wdGlvblwiKTtcbiAgICB2YXIgcGVnJGMzMiA9IFwiL1wiO1xuICAgIHZhciBwZWckYzMzID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi9cIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzM0ID0gZnVuY3Rpb24gKG9wdGlvbikgeyByZXR1cm4gb3B0aW9uOyB9O1xuICAgIHZhciBwZWckYzM1ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJudW1iZXJTa2VsZXRvblRva2VuXCIpO1xuICAgIHZhciBwZWckYzM2ID0gZnVuY3Rpb24gKHN0ZW0sIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlbTogc3RlbSwgb3B0aW9uczogb3B0aW9ucyB9O1xuICAgIH07XG4gICAgdmFyIHBlZyRjMzcgPSBmdW5jdGlvbiAodG9rZW5zKSB7XG4gICAgICAgIHJldHVybiB0c2xpYl8xLl9fYXNzaWduKHsgdHlwZTogMCAvKiBudW1iZXIgKi8sIHRva2VuczogdG9rZW5zLCBwYXJzZWRPcHRpb25zOiBzaG91bGRQYXJzZVNrZWxldG9uID8gc2tlbGV0b25fMS5wYXJzZU51bWJlclNrZWxldG9uKHRva2VucykgOiB7fSB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzM4ID0gXCI6OlwiO1xuICAgIHZhciBwZWckYzM5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIjo6XCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM0MCA9IGZ1bmN0aW9uIChza2VsZXRvbikgeyByZXR1cm4gc2tlbGV0b247IH07XG4gICAgdmFyIHBlZyRjNDEgPSBmdW5jdGlvbiAoKSB7IG1lc3NhZ2VDdHgucHVzaCgnbnVtYmVyQXJnU3R5bGUnKTsgcmV0dXJuIHRydWU7IH07XG4gICAgdmFyIHBlZyRjNDIgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgICAgbWVzc2FnZUN0eC5wb3AoKTtcbiAgICAgICAgcmV0dXJuIHN0eWxlLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjNDMgPSBcIixcIjtcbiAgICB2YXIgcGVnJGM0NCA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIsXCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM0NSA9IFwibnVtYmVyXCI7XG4gICAgdmFyIHBlZyRjNDYgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwibnVtYmVyXCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM0NyA9IGZ1bmN0aW9uICh2YWx1ZSwgdHlwZSwgc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuIHRzbGliXzEuX19hc3NpZ24oeyB0eXBlOiB0eXBlID09PSAnbnVtYmVyJyA/IHR5cGVzXzEuVFlQRS5udW1iZXIgOiB0eXBlID09PSAnZGF0ZScgPyB0eXBlc18xLlRZUEUuZGF0ZSA6IHR5cGVzXzEuVFlQRS50aW1lLCBzdHlsZTogc3R5bGUgJiYgc3R5bGVbMl0sIHZhbHVlOiB2YWx1ZSB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzQ4ID0gXCInXCI7XG4gICAgdmFyIHBlZyRjNDkgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiJ1wiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjNTAgPSAvXlteJ10vO1xuICAgIHZhciBwZWckYzUxID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1wiJ1wiXSwgdHJ1ZSwgZmFsc2UpO1xuICAgIHZhciBwZWckYzUyID0gL15bXmEtekEtWid7fV0vO1xuICAgIHZhciBwZWckYzUzID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcImFcIiwgXCJ6XCJdLCBbXCJBXCIsIFwiWlwiXSwgXCInXCIsIFwie1wiLCBcIn1cIl0sIHRydWUsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM1NCA9IC9eW2EtekEtWl0vO1xuICAgIHZhciBwZWckYzU1ID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcImFcIiwgXCJ6XCJdLCBbXCJBXCIsIFwiWlwiXV0sIGZhbHNlLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjNTYgPSBmdW5jdGlvbiAocGF0dGVybikge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IDEgLyogZGF0ZVRpbWUgKi8sIHBhdHRlcm46IHBhdHRlcm4sIHBhcnNlZE9wdGlvbnM6IHNob3VsZFBhcnNlU2tlbGV0b24gPyBza2VsZXRvbl8xLnBhcnNlRGF0ZVRpbWVTa2VsZXRvbihwYXR0ZXJuKSA6IHt9IH0sIGluc2VydExvY2F0aW9uKCkpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjNTcgPSBmdW5jdGlvbiAoKSB7IG1lc3NhZ2VDdHgucHVzaCgnZGF0ZU9yVGltZUFyZ1N0eWxlJyk7IHJldHVybiB0cnVlOyB9O1xuICAgIHZhciBwZWckYzU4ID0gXCJkYXRlXCI7XG4gICAgdmFyIHBlZyRjNTkgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiZGF0ZVwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjNjAgPSBcInRpbWVcIjtcbiAgICB2YXIgcGVnJGM2MSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJ0aW1lXCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM2MiA9IFwicGx1cmFsXCI7XG4gICAgdmFyIHBlZyRjNjMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwicGx1cmFsXCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM2NCA9IFwic2VsZWN0b3JkaW5hbFwiO1xuICAgIHZhciBwZWckYzY1ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcInNlbGVjdG9yZGluYWxcIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzY2ID0gXCJvZmZzZXQ6XCI7XG4gICAgdmFyIHBlZyRjNjcgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwib2Zmc2V0OlwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjNjggPSBmdW5jdGlvbiAodmFsdWUsIHBsdXJhbFR5cGUsIG9mZnNldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IHR5cGVzXzEuVFlQRS5wbHVyYWwsIHBsdXJhbFR5cGU6IHBsdXJhbFR5cGUgPT09ICdwbHVyYWwnID8gJ2NhcmRpbmFsJyA6ICdvcmRpbmFsJywgdmFsdWU6IHZhbHVlLCBvZmZzZXQ6IG9mZnNldCA/IG9mZnNldFsyXSA6IDAsIG9wdGlvbnM6IG9wdGlvbnMucmVkdWNlKGZ1bmN0aW9uIChhbGwsIF9hKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gX2EuaWQsIHZhbHVlID0gX2EudmFsdWUsIG9wdGlvbkxvY2F0aW9uID0gX2EubG9jYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKGlkIGluIGFsbCkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcihcIkR1cGxpY2F0ZSBvcHRpb24gXFxcIlwiICsgaWQgKyBcIlxcXCIgaW4gcGx1cmFsIGVsZW1lbnQ6IFxcXCJcIiArIHRleHQoKSArIFwiXFxcIlwiLCBsb2NhdGlvbigpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxsW2lkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogb3B0aW9uTG9jYXRpb25cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGw7XG4gICAgICAgICAgICB9LCB7fSkgfSwgaW5zZXJ0TG9jYXRpb24oKSk7XG4gICAgfTtcbiAgICB2YXIgcGVnJGM2OSA9IFwic2VsZWN0XCI7XG4gICAgdmFyIHBlZyRjNzAgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwic2VsZWN0XCIsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM3MSA9IGZ1bmN0aW9uICh2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdHNsaWJfMS5fX2Fzc2lnbih7IHR5cGU6IHR5cGVzXzEuVFlQRS5zZWxlY3QsIHZhbHVlOiB2YWx1ZSwgb3B0aW9uczogb3B0aW9ucy5yZWR1Y2UoZnVuY3Rpb24gKGFsbCwgX2EpIHtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBfYS5pZCwgdmFsdWUgPSBfYS52YWx1ZSwgb3B0aW9uTG9jYXRpb24gPSBfYS5sb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAoaWQgaW4gYWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKFwiRHVwbGljYXRlIG9wdGlvbiBcXFwiXCIgKyBpZCArIFwiXFxcIiBpbiBzZWxlY3QgZWxlbWVudDogXFxcIlwiICsgdGV4dCgpICsgXCJcXFwiXCIsIGxvY2F0aW9uKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbGxbaWRdID0ge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBvcHRpb25Mb2NhdGlvblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsbDtcbiAgICAgICAgICAgIH0sIHt9KSB9LCBpbnNlcnRMb2NhdGlvbigpKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzcyID0gXCI9XCI7XG4gICAgdmFyIHBlZyRjNzMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiPVwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjNzQgPSBmdW5jdGlvbiAoaWQpIHsgbWVzc2FnZUN0eC5wdXNoKCdzZWxlY3QnKTsgcmV0dXJuIHRydWU7IH07XG4gICAgdmFyIHBlZyRjNzUgPSBmdW5jdGlvbiAoaWQsIHZhbHVlKSB7XG4gICAgICAgIG1lc3NhZ2VDdHgucG9wKCk7XG4gICAgICAgIHJldHVybiB0c2xpYl8xLl9fYXNzaWduKHsgaWQ6IGlkLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlIH0sIGluc2VydExvY2F0aW9uKCkpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjNzYgPSBmdW5jdGlvbiAoaWQpIHsgbWVzc2FnZUN0eC5wdXNoKCdwbHVyYWwnKTsgcmV0dXJuIHRydWU7IH07XG4gICAgdmFyIHBlZyRjNzcgPSBmdW5jdGlvbiAoaWQsIHZhbHVlKSB7XG4gICAgICAgIG1lc3NhZ2VDdHgucG9wKCk7XG4gICAgICAgIHJldHVybiB0c2xpYl8xLl9fYXNzaWduKHsgaWQ6IGlkLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlIH0sIGluc2VydExvY2F0aW9uKCkpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjNzggPSBwZWckb3RoZXJFeHBlY3RhdGlvbihcIndoaXRlc3BhY2VcIik7XG4gICAgdmFyIHBlZyRjNzkgPSAvXltcXHQtXFxyIFxceDg1XFx4QTBcXHUxNjgwXFx1MjAwMC1cXHUyMDBBXFx1MjAyOFxcdTIwMjlcXHUyMDJGXFx1MjA1RlxcdTMwMDBdLztcbiAgICB2YXIgcGVnJGM4MCA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCJcXHRcIiwgXCJcXHJcIl0sIFwiIFwiLCBcIlxceDg1XCIsIFwiXFx4QTBcIiwgXCJcXHUxNjgwXCIsIFtcIlxcdTIwMDBcIiwgXCJcXHUyMDBBXCJdLCBcIlxcdTIwMjhcIiwgXCJcXHUyMDI5XCIsIFwiXFx1MjAyRlwiLCBcIlxcdTIwNUZcIiwgXCJcXHUzMDAwXCJdLCBmYWxzZSwgZmFsc2UpO1xuICAgIHZhciBwZWckYzgxID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJzeW50YXggcGF0dGVyblwiKTtcbiAgICB2YXIgcGVnJGM4MiA9IC9eWyEtXFwvOi1AWy1cXF5gey1+XFx4QTEtXFx4QTdcXHhBOVxceEFCXFx4QUNcXHhBRVxceEIwXFx4QjFcXHhCNlxceEJCXFx4QkZcXHhEN1xceEY3XFx1MjAxMC1cXHUyMDI3XFx1MjAzMC1cXHUyMDNFXFx1MjA0MS1cXHUyMDUzXFx1MjA1NS1cXHUyMDVFXFx1MjE5MC1cXHUyNDVGXFx1MjUwMC1cXHUyNzc1XFx1Mjc5NC1cXHUyQkZGXFx1MkUwMC1cXHUyRTdGXFx1MzAwMS1cXHUzMDAzXFx1MzAwOC1cXHUzMDIwXFx1MzAzMFxcdUZEM0VcXHVGRDNGXFx1RkU0NVxcdUZFNDZdLztcbiAgICB2YXIgcGVnJGM4MyA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCIhXCIsIFwiL1wiXSwgW1wiOlwiLCBcIkBcIl0sIFtcIltcIiwgXCJeXCJdLCBcImBcIiwgW1wie1wiLCBcIn5cIl0sIFtcIlxceEExXCIsIFwiXFx4QTdcIl0sIFwiXFx4QTlcIiwgXCJcXHhBQlwiLCBcIlxceEFDXCIsIFwiXFx4QUVcIiwgXCJcXHhCMFwiLCBcIlxceEIxXCIsIFwiXFx4QjZcIiwgXCJcXHhCQlwiLCBcIlxceEJGXCIsIFwiXFx4RDdcIiwgXCJcXHhGN1wiLCBbXCJcXHUyMDEwXCIsIFwiXFx1MjAyN1wiXSwgW1wiXFx1MjAzMFwiLCBcIlxcdTIwM0VcIl0sIFtcIlxcdTIwNDFcIiwgXCJcXHUyMDUzXCJdLCBbXCJcXHUyMDU1XCIsIFwiXFx1MjA1RVwiXSwgW1wiXFx1MjE5MFwiLCBcIlxcdTI0NUZcIl0sIFtcIlxcdTI1MDBcIiwgXCJcXHUyNzc1XCJdLCBbXCJcXHUyNzk0XCIsIFwiXFx1MkJGRlwiXSwgW1wiXFx1MkUwMFwiLCBcIlxcdTJFN0ZcIl0sIFtcIlxcdTMwMDFcIiwgXCJcXHUzMDAzXCJdLCBbXCJcXHUzMDA4XCIsIFwiXFx1MzAyMFwiXSwgXCJcXHUzMDMwXCIsIFwiXFx1RkQzRVwiLCBcIlxcdUZEM0ZcIiwgXCJcXHVGRTQ1XCIsIFwiXFx1RkU0NlwiXSwgZmFsc2UsIGZhbHNlKTtcbiAgICB2YXIgcGVnJGM4NCA9IHBlZyRvdGhlckV4cGVjdGF0aW9uKFwib3B0aW9uYWwgd2hpdGVzcGFjZVwiKTtcbiAgICB2YXIgcGVnJGM4NSA9IHBlZyRvdGhlckV4cGVjdGF0aW9uKFwibnVtYmVyXCIpO1xuICAgIHZhciBwZWckYzg2ID0gXCItXCI7XG4gICAgdmFyIHBlZyRjODcgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiLVwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjODggPSBmdW5jdGlvbiAobmVnYXRpdmUsIG51bSkge1xuICAgICAgICByZXR1cm4gbnVtXG4gICAgICAgICAgICA/IG5lZ2F0aXZlXG4gICAgICAgICAgICAgICAgPyAtbnVtXG4gICAgICAgICAgICAgICAgOiBudW1cbiAgICAgICAgICAgIDogMDtcbiAgICB9O1xuICAgIHZhciBwZWckYzg5ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJhcG9zdHJvcGhlXCIpO1xuICAgIHZhciBwZWckYzkwID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJkb3VibGUgYXBvc3Ryb3BoZXNcIik7XG4gICAgdmFyIHBlZyRjOTEgPSBcIicnXCI7XG4gICAgdmFyIHBlZyRjOTIgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiJydcIiwgZmFsc2UpO1xuICAgIHZhciBwZWckYzkzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gXCInXCI7IH07XG4gICAgdmFyIHBlZyRjOTQgPSBmdW5jdGlvbiAoZXNjYXBlZENoYXIsIHF1b3RlZENoYXJzKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVkQ2hhciArIHF1b3RlZENoYXJzLnJlcGxhY2UoXCInJ1wiLCBcIidcIik7XG4gICAgfTtcbiAgICB2YXIgcGVnJGM5NSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiAoeCAhPT0gJzwnICYmXG4gICAgICAgICAgICB4ICE9PSAneycgJiZcbiAgICAgICAgICAgICEoaXNJblBsdXJhbE9wdGlvbigpICYmIHggPT09ICcjJykgJiZcbiAgICAgICAgICAgICEoaXNOZXN0ZWRNZXNzYWdlVGV4dCgpICYmIHggPT09ICd9JykpO1xuICAgIH07XG4gICAgdmFyIHBlZyRjOTYgPSBcIlxcblwiO1xuICAgIHZhciBwZWckYzk3ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIlxcblwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjOTggPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PT0gJzwnIHx8IHggPT09ICc+JyB8fCB4ID09PSAneycgfHwgeCA9PT0gJ30nIHx8IChpc0luUGx1cmFsT3B0aW9uKCkgJiYgeCA9PT0gJyMnKTtcbiAgICB9O1xuICAgIHZhciBwZWckYzk5ID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJhcmdOYW1lT3JOdW1iZXJcIik7XG4gICAgdmFyIHBlZyRjMTAwID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJ2YWxpZFRhZ1wiKTtcbiAgICB2YXIgcGVnJGMxMDEgPSBwZWckb3RoZXJFeHBlY3RhdGlvbihcImFyZ051bWJlclwiKTtcbiAgICB2YXIgcGVnJGMxMDIgPSBcIjBcIjtcbiAgICB2YXIgcGVnJGMxMDMgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiMFwiLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjMTA0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gMDsgfTtcbiAgICB2YXIgcGVnJGMxMDUgPSAvXlsxLTldLztcbiAgICB2YXIgcGVnJGMxMDYgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbW1wiMVwiLCBcIjlcIl1dLCBmYWxzZSwgZmFsc2UpO1xuICAgIHZhciBwZWckYzEwNyA9IC9eWzAtOV0vO1xuICAgIHZhciBwZWckYzEwOCA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCIwXCIsIFwiOVwiXV0sIGZhbHNlLCBmYWxzZSk7XG4gICAgdmFyIHBlZyRjMTA5ID0gZnVuY3Rpb24gKGRpZ2l0cykge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoZGlnaXRzLmpvaW4oJycpLCAxMCk7XG4gICAgfTtcbiAgICB2YXIgcGVnJGMxMTAgPSBwZWckb3RoZXJFeHBlY3RhdGlvbihcImFyZ05hbWVcIik7XG4gICAgdmFyIHBlZyRjMTExID0gcGVnJG90aGVyRXhwZWN0YXRpb24oXCJ0YWdOYW1lXCIpO1xuICAgIHZhciBwZWckY3VyclBvcyA9IDA7XG4gICAgdmFyIHBlZyRzYXZlZFBvcyA9IDA7XG4gICAgdmFyIHBlZyRwb3NEZXRhaWxzQ2FjaGUgPSBbeyBsaW5lOiAxLCBjb2x1bW46IDEgfV07XG4gICAgdmFyIHBlZyRtYXhGYWlsUG9zID0gMDtcbiAgICB2YXIgcGVnJG1heEZhaWxFeHBlY3RlZCA9IFtdO1xuICAgIHZhciBwZWckc2lsZW50RmFpbHMgPSAwO1xuICAgIHZhciBwZWckcmVzdWx0O1xuICAgIGlmIChvcHRpb25zLnN0YXJ0UnVsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghKG9wdGlvbnMuc3RhcnRSdWxlIGluIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBzdGFydCBwYXJzaW5nIGZyb20gcnVsZSBcXFwiXCIgKyBvcHRpb25zLnN0YXJ0UnVsZSArIFwiXFxcIi5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uc1tvcHRpb25zLnN0YXJ0UnVsZV07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRleHQoKSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5zdWJzdHJpbmcocGVnJHNhdmVkUG9zLCBwZWckY3VyclBvcyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxvY2F0aW9uKCkge1xuICAgICAgICByZXR1cm4gcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZXhwZWN0ZWQoZGVzY3JpcHRpb24sIGxvY2F0aW9uMSkge1xuICAgICAgICBsb2NhdGlvbjEgPSBsb2NhdGlvbjEgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBsb2NhdGlvbjFcbiAgICAgICAgICAgIDogcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgdGhyb3cgcGVnJGJ1aWxkU3RydWN0dXJlZEVycm9yKFtwZWckb3RoZXJFeHBlY3RhdGlvbihkZXNjcmlwdGlvbildLCBpbnB1dC5zdWJzdHJpbmcocGVnJHNhdmVkUG9zLCBwZWckY3VyclBvcyksIGxvY2F0aW9uMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UsIGxvY2F0aW9uMSkge1xuICAgICAgICBsb2NhdGlvbjEgPSBsb2NhdGlvbjEgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBsb2NhdGlvbjFcbiAgICAgICAgICAgIDogcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgdGhyb3cgcGVnJGJ1aWxkU2ltcGxlRXJyb3IobWVzc2FnZSwgbG9jYXRpb24xKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbih0ZXh0MSwgaWdub3JlQ2FzZSkge1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImxpdGVyYWxcIiwgdGV4dDogdGV4dDEsIGlnbm9yZUNhc2U6IGlnbm9yZUNhc2UgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJGNsYXNzRXhwZWN0YXRpb24ocGFydHMsIGludmVydGVkLCBpZ25vcmVDYXNlKSB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiY2xhc3NcIiwgcGFydHM6IHBhcnRzLCBpbnZlcnRlZDogaW52ZXJ0ZWQsIGlnbm9yZUNhc2U6IGlnbm9yZUNhc2UgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJGFueUV4cGVjdGF0aW9uKCkge1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImFueVwiIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRlbmRFeHBlY3RhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJlbmRcIiB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckb3RoZXJFeHBlY3RhdGlvbihkZXNjcmlwdGlvbikge1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcIm90aGVyXCIsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckY29tcHV0ZVBvc0RldGFpbHMocG9zKSB7XG4gICAgICAgIHZhciBkZXRhaWxzID0gcGVnJHBvc0RldGFpbHNDYWNoZVtwb3NdO1xuICAgICAgICB2YXIgcDtcbiAgICAgICAgaWYgKGRldGFpbHMpIHtcbiAgICAgICAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcCA9IHBvcyAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoIXBlZyRwb3NEZXRhaWxzQ2FjaGVbcF0pIHtcbiAgICAgICAgICAgICAgICBwLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXRhaWxzID0gcGVnJHBvc0RldGFpbHNDYWNoZVtwXTtcbiAgICAgICAgICAgIGRldGFpbHMgPSB7XG4gICAgICAgICAgICAgICAgbGluZTogZGV0YWlscy5saW5lLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogZGV0YWlscy5jb2x1bW5cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3aGlsZSAocCA8IHBvcykge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHApID09PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzLmxpbmUrKztcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlscy5jb2x1bW4gPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlscy5jb2x1bW4rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVnJHBvc0RldGFpbHNDYWNoZVtwb3NdID0gZGV0YWlscztcbiAgICAgICAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRjb21wdXRlTG9jYXRpb24oc3RhcnRQb3MsIGVuZFBvcykge1xuICAgICAgICB2YXIgc3RhcnRQb3NEZXRhaWxzID0gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHN0YXJ0UG9zKTtcbiAgICAgICAgdmFyIGVuZFBvc0RldGFpbHMgPSBwZWckY29tcHV0ZVBvc0RldGFpbHMoZW5kUG9zKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBzdGFydFBvcyxcbiAgICAgICAgICAgICAgICBsaW5lOiBzdGFydFBvc0RldGFpbHMubGluZSxcbiAgICAgICAgICAgICAgICBjb2x1bW46IHN0YXJ0UG9zRGV0YWlscy5jb2x1bW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmQ6IHtcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IGVuZFBvcyxcbiAgICAgICAgICAgICAgICBsaW5lOiBlbmRQb3NEZXRhaWxzLmxpbmUsXG4gICAgICAgICAgICAgICAgY29sdW1uOiBlbmRQb3NEZXRhaWxzLmNvbHVtblxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckZmFpbChleHBlY3RlZDEpIHtcbiAgICAgICAgaWYgKHBlZyRjdXJyUG9zIDwgcGVnJG1heEZhaWxQb3MpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGVnJGN1cnJQb3MgPiBwZWckbWF4RmFpbFBvcykge1xuICAgICAgICAgICAgcGVnJG1heEZhaWxQb3MgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBwZWckbWF4RmFpbEV4cGVjdGVkLnB1c2goZXhwZWN0ZWQxKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJGJ1aWxkU2ltcGxlRXJyb3IobWVzc2FnZSwgbG9jYXRpb24xKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3ludGF4RXJyb3IobWVzc2FnZSwgW10sIFwiXCIsIGxvY2F0aW9uMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRidWlsZFN0cnVjdHVyZWRFcnJvcihleHBlY3RlZDEsIGZvdW5kLCBsb2NhdGlvbjEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTeW50YXhFcnJvcihTeW50YXhFcnJvci5idWlsZE1lc3NhZ2UoZXhwZWN0ZWQxLCBmb3VuZCksIGV4cGVjdGVkMSwgZm91bmQsIGxvY2F0aW9uMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZXN0YXJ0KCkge1xuICAgICAgICB2YXIgczA7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlbWVzc2FnZSgpO1xuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZW1lc3NhZ2UoKSB7XG4gICAgICAgIHZhciBzMCwgczE7XG4gICAgICAgIHMwID0gW107XG4gICAgICAgIHMxID0gcGVnJHBhcnNlbWVzc2FnZUVsZW1lbnQoKTtcbiAgICAgICAgd2hpbGUgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMC5wdXNoKHMxKTtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlbWVzc2FnZUVsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZW1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMjtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgcGVnJHNhdmVkUG9zID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gcGVnJGMwKCk7XG4gICAgICAgIGlmIChzMSkge1xuICAgICAgICAgICAgczEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRwYXJzZXRhZ0VsZW1lbnQoKTtcbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxKHMyKTtcbiAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VsaXRlcmFsRWxlbWVudCgpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2Vhcmd1bWVudEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VzaW1wbGVGb3JtYXRFbGVtZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VwbHVyYWxFbGVtZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZXNlbGVjdEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2Vwb3VuZEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VtZXNzYWdlVGV4dCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2F2ZWRQb3MgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckYzIoKTtcbiAgICAgICAgaWYgKHMxKSB7XG4gICAgICAgICAgICBzMSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gW107XG4gICAgICAgICAgICBzMyA9IHBlZyRwYXJzZWRvdWJsZUFwb3N0cm9waGVzKCk7XG4gICAgICAgICAgICBpZiAoczMgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZXF1b3RlZFN0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZXVucXVvdGVkU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2MCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGMzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2Vkb3VibGVBcG9zdHJvcGhlcygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczMgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlcXVvdGVkU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczMgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZXVucXVvdGVkU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMzID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJGMzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzUoczIpO1xuICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgczEgPSBbXTtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlZG91YmxlQXBvc3Ryb3BoZXMoKTtcbiAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlcXVvdGVkU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNldW5xdW90ZWRTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZW5vblRhZ1N0YXJ0aW5nQW5nbGVCcmFja2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlZG91YmxlQXBvc3Ryb3BoZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZXF1b3RlZFN0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2V1bnF1b3RlZFN0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZW5vblRhZ1N0YXJ0aW5nQW5nbGVCcmFja2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzUoczEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZW5vblRhZ1N0YXJ0aW5nQW5nbGVCcmFja2V0KCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMjtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckY3VyclBvcztcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlb3BlbmluZ1RhZygpO1xuICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlY2xvc2luZ1RhZygpO1xuICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VzZWxmQ2xvc2luZ1RhZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRjMztcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRjNigpO1xuICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VsaXRlcmFsRWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMTtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckcGFyc2VtZXNzYWdlVGV4dCgpO1xuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzcoczEpO1xuICAgICAgICB9XG4gICAgICAgIHMwID0gczE7XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlcG91bmRFbGVtZW50KCkge1xuICAgICAgICB2YXIgczAsIHMxO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM1KSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjODtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzEwKCk7XG4gICAgICAgIH1cbiAgICAgICAgczAgPSBzMTtcbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2V0YWdFbGVtZW50KCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRwYXJzZXNlbGZDbG9zaW5nVGFnKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlb3BlbmluZ1RhZygpO1xuICAgICAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VtZXNzYWdlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlY2xvc2luZ1RhZygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzEyKHMxLCBzMiwgczMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMxMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VzZWxmQ2xvc2luZ1RhZygpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgICAgICAgIHMyID0gcGVnJGMzO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSBwZWckcGFyc2V2YWxpZFRhZygpO1xuICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRjMTM7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBbczIsIHMzLCBzNCwgczVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBzMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxNShzMSk7XG4gICAgICAgIH1cbiAgICAgICAgczAgPSBzMTtcbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VvcGVuaW5nVGFnKCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgICAgICAgIHMxID0gcGVnJGMzO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2V2YWxpZFRhZygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mikge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRjMTY7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzE4KHMyKTtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VjbG9zaW5nVGFnKCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzE5KSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTk7XG4gICAgICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMjApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2V2YWxpZFRhZygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mikge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRjMTY7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzE4KHMyKTtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2Vhcmd1bWVudEVsZW1lbnQoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjMpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJGMyMjtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMyMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlYXJnTmFtZU9yTnVtYmVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTI1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckYzI0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzI1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMjYoczMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMjEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25JZCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gW107XG4gICAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzNCA9IHBlZyRwYXJzZXdoaXRlU3BhY2UoKTtcbiAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAocGVnJGMyOC50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzI5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzMwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMS5wdXNoKHMyKTtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2V3aGl0ZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckYzI4LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMyOSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBbczMsIHM0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMjcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25Ub2tlbk9wdGlvbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczI7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ3KSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMzI7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMzMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2VudW1iZXJTa2VsZXRvbklkKCk7XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMzQoczIpO1xuICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25Ub2tlbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25JZCgpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBbXTtcbiAgICAgICAgICAgICAgICBzNCA9IHBlZyRwYXJzZW51bWJlclNrZWxldG9uVG9rZW5PcHRpb24oKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczMucHVzaChzNCk7XG4gICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25Ub2tlbk9wdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMzNihzMiwgczMpO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMzNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VudW1iZXJTa2VsZXRvbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczI7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gW107XG4gICAgICAgIHMyID0gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25Ub2tlbigpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b25Ub2tlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMzcoczEpO1xuICAgICAgICB9XG4gICAgICAgIHMwID0gczE7XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyQXJnU3R5bGUoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGMzOCkge1xuICAgICAgICAgICAgczEgPSBwZWckYzM4O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzM5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlbnVtYmVyU2tlbGV0b24oKTtcbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJGM0MChzMik7XG4gICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHMxID0gcGVnJGM0MSgpO1xuICAgICAgICAgICAgaWYgKHMxKSB7XG4gICAgICAgICAgICAgICAgczEgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZW1lc3NhZ2VUZXh0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjNDIoczIpO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyRm9ybWF0RWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNywgczgsIHM5LCBzMTAsIHMxMSwgczEyO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgICAgICAgczEgPSBwZWckYzIyO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzIzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2VhcmdOYW1lT3JOdW1iZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzQ1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjNDU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNDYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEwID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNDQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTAgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczExICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTIgPSBwZWckcGFyc2VudW1iZXJBcmdTdHlsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMCA9IFtzMTAsIHMxMSwgczEyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOSA9IHMxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczkgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEwID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEwICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRjMjQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzI1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczExICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzQ3KHMzLCBzNywgczkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VkYXRlVGltZVNrZWxldG9uTGl0ZXJhbCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjNDg7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNDkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBbXTtcbiAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlZG91YmxlQXBvc3Ryb3BoZXMoKTtcbiAgICAgICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChwZWckYzUwLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzUxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2Vkb3VibGVBcG9zdHJvcGhlcygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczMgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckYzUwLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMyA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzkpIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckYzQ4O1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQ5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBbczEsIHMyLCBzM107XG4gICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBbXTtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlZG91YmxlQXBvc3Ryb3BoZXMoKTtcbiAgICAgICAgICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChwZWckYzUyLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzUzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMC5wdXNoKHMxKTtcbiAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckcGFyc2Vkb3VibGVBcG9zdHJvcGhlcygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckYzUyLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZWRhdGVUaW1lU2tlbGV0b25QYXR0ZXJuKCkge1xuICAgICAgICB2YXIgczAsIHMxO1xuICAgICAgICBzMCA9IFtdO1xuICAgICAgICBpZiAocGVnJGM1NC50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgd2hpbGUgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczAucHVzaChzMSk7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRjNTQudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlZGF0ZVRpbWVTa2VsZXRvbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMiA9IFtdO1xuICAgICAgICBzMyA9IHBlZyRwYXJzZWRhdGVUaW1lU2tlbGV0b25MaXRlcmFsKCk7XG4gICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSBwZWckcGFyc2VkYXRlVGltZVNrZWxldG9uUGF0dGVybigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2VkYXRlVGltZVNrZWxldG9uTGl0ZXJhbCgpO1xuICAgICAgICAgICAgICAgIGlmIChzMyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZWRhdGVUaW1lU2tlbGV0b25QYXR0ZXJuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBpbnB1dC5zdWJzdHJpbmcoczEsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gczI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGM1NihzMSk7XG4gICAgICAgIH1cbiAgICAgICAgczAgPSBzMTtcbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VkYXRlT3JUaW1lQXJnU3R5bGUoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGMzOCkge1xuICAgICAgICAgICAgczEgPSBwZWckYzM4O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzM5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlZGF0ZVRpbWVTa2VsZXRvbigpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzQwKHMyKTtcbiAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgczEgPSBwZWckYzU3KCk7XG4gICAgICAgICAgICBpZiAoczEpIHtcbiAgICAgICAgICAgICAgICBzMSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlbWVzc2FnZVRleHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGM0MihzMik7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VkYXRlT3JUaW1lRm9ybWF0RWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNywgczgsIHM5LCBzMTAsIHMxMSwgczEyO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgICAgICAgczEgPSBwZWckYzIyO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzIzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2VhcmdOYW1lT3JOdW1iZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDQpID09PSBwZWckYzU4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjNTg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNCkgPT09IHBlZyRjNjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjNjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNjEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM4ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM4ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMCA9IHBlZyRjNDM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEwICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEyID0gcGVnJHBhcnNlZGF0ZU9yVGltZUFyZ1N0eWxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEwID0gW3MxMCwgczExLCBzMTJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gczEwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzOSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzOSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTAgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTAgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTI1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJGMyNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjNDcoczMsIHM3LCBzOSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZXNpbXBsZUZvcm1hdEVsZW1lbnQoKSB7XG4gICAgICAgIHZhciBzMDtcbiAgICAgICAgczAgPSBwZWckcGFyc2VudW1iZXJGb3JtYXRFbGVtZW50KCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VkYXRlT3JUaW1lRm9ybWF0RWxlbWVudCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlcGx1cmFsRWxlbWVudCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNywgczgsIHM5LCBzMTAsIHMxMSwgczEyLCBzMTMsIHMxNCwgczE1O1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgICAgICAgczEgPSBwZWckYzIyO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzIzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2VhcmdOYW1lT3JOdW1iZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzYyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjNjI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNjMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMTMpID09PSBwZWckYzY0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckYzY0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDEzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM2NSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA3KSA9PT0gcGVnJGM2Nikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRjNjY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzY3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEzID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczE0ID0gcGVnJHBhcnNlbnVtYmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IFtzMTIsIHMxMywgczE0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHMxMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczExO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTEgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTQgPSBwZWckcGFyc2VwbHVyYWxPcHRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHMxNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMy5wdXNoKHMxNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczE0ID0gcGVnJHBhcnNlcGx1cmFsT3B0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTUgPSBwZWckYzI0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczE1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMyNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzY4KHMzLCBzNywgczExLCBzMTMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZXNlbGVjdEVsZW1lbnQoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOSwgczEwLCBzMTEsIHMxMiwgczEzO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgICAgICAgczEgPSBwZWckYzIyO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzIzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckcGFyc2VhcmdOYW1lT3JOdW1iZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzY5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjNjk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJGM0MztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM0NCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczExID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTIgPSBwZWckcGFyc2VzZWxlY3RPcHRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMS5wdXNoKHMxMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRwYXJzZXNlbGVjdE9wdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczExICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxMyA9IHBlZyRjMjQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzI1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGM3MShzMywgczExKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlcGx1cmFsUnVsZVNlbGVjdFZhbHVlKCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjEpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJGM3MjtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM3Myk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRwYXJzZW51bWJlcigpO1xuICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczIgPSBbczIsIHMzXTtcbiAgICAgICAgICAgICAgICBzMSA9IHMyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRwYXJzZWFyZ05hbWUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZXNlbGVjdE9wdGlvbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNztcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2VhcmdOYW1lKCk7XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMyA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJGMyMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMyMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM3NChzMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM2ID0gcGVnJHBhcnNlbWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckYzI0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzI1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzc1KHMyLCBzNik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZXBsdXJhbE9wdGlvbigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNztcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2VwbHVyYWxSdWxlU2VsZWN0VmFsdWUoKTtcbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckYzIyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzIzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckYzc2KHMyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VtZXNzYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMTI1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjMjQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjNzcoczIsIHM2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNld2hpdGVTcGFjZSgpIHtcbiAgICAgICAgdmFyIHMwLCBzMTtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIGlmIChwZWckYzc5LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4MCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNzgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlcGF0dGVyblN5bnRheCgpIHtcbiAgICAgICAgdmFyIHMwLCBzMTtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIGlmIChwZWckYzgyLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgIHMwID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4Myk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjODEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlXygpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczI7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IFtdO1xuICAgICAgICBzMiA9IHBlZyRwYXJzZXdoaXRlU3BhY2UoKTtcbiAgICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMS5wdXNoKHMyKTtcbiAgICAgICAgICAgIHMyID0gcGVnJHBhcnNld2hpdGVTcGFjZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjODQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNlbnVtYmVyKCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMjtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDUpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJGM4NjtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4Nyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRwYXJzZWFyZ051bWJlcigpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzg4KHMxLCBzMik7XG4gICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4NSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VhcG9zdHJvcGhlKCkge1xuICAgICAgICB2YXIgczAsIHMxO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzOSkge1xuICAgICAgICAgICAgczAgPSBwZWckYzQ4O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzQ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4OSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2Vkb3VibGVBcG9zdHJvcGhlcygpIHtcbiAgICAgICAgdmFyIHMwLCBzMTtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzkxKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjOTE7XG4gICAgICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjOTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjOTMoKTtcbiAgICAgICAgfVxuICAgICAgICBzMCA9IHMxO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM5MCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VxdW90ZWRTdHJpbmcoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjNDg7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNDkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2Vlc2NhcGVkQ2hhcigpO1xuICAgICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgICAgICBzNCA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzkxKSB7XG4gICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM5MTtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM5Mik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHM1ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckYzUwLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM1MSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHM0LnB1c2goczUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGM5MSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczUgPSBwZWckYzkxO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzkyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoczUgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckYzUwLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSBpbnB1dC5zdWJzdHJpbmcoczMsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRjNDg7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjNDkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjOTQoczIsIHMzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNldW5xdW90ZWRTdHJpbmcoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyLCBzMztcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBwZWckY3VyclBvcztcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMzApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICBzMyA9IHBlZyRjOTUoczIpO1xuICAgICAgICAgICAgaWYgKHMzKSB7XG4gICAgICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMiA9IFtzMiwgczNdO1xuICAgICAgICAgICAgICAgIHMxID0gczI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEwKSB7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzk2O1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzk3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IGlucHV0LnN1YnN0cmluZyhzMCwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZWVzY2FwZWRDaGFyKCkge1xuICAgICAgICB2YXIgczAsIHMxLCBzMiwgczM7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5sZW5ndGggPiBwZWckY3VyclBvcykge1xuICAgICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzMwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgczMgPSBwZWckYzk4KHMyKTtcbiAgICAgICAgICAgIGlmIChzMykge1xuICAgICAgICAgICAgICAgIHMzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczIgPSBbczIsIHMzXTtcbiAgICAgICAgICAgICAgICBzMSA9IHMyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHMwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZWckcGFyc2VhcmdOYW1lT3JOdW1iZXIoKSB7XG4gICAgICAgIHZhciBzMCwgczE7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IHBlZyRwYXJzZWFyZ051bWJlcigpO1xuICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNlYXJnTmFtZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjOTkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNldmFsaWRUYWcoKSB7XG4gICAgICAgIHZhciBzMCwgczE7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IHBlZyRwYXJzZWFyZ051bWJlcigpO1xuICAgICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJHBhcnNldGFnTmFtZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZWFyZ051bWJlcigpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDgpIHtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxMDI7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTAzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzEwNCgpO1xuICAgICAgICB9XG4gICAgICAgIHMwID0gczE7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICBpZiAocGVnJGMxMDUudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMxMDYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRjMTA3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzEwOCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJGMxMDcudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzEwOCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMyID0gW3MyLCBzM107XG4gICAgICAgICAgICAgICAgICAgIHMxID0gczI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTA5KHMxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMTAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gczA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBlZyRwYXJzZWFyZ05hbWUoKSB7XG4gICAgICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG4gICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMSA9IFtdO1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgczQgPSBwZWckcGFyc2V3aGl0ZVNwYWNlKCk7XG4gICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VwYXR0ZXJuU3ludGF4KCk7XG4gICAgICAgIH1cbiAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzMwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMS5wdXNoKHMyKTtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICAgICAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2V3aGl0ZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHM0ID0gcGVnJHBhcnNlcGF0dGVyblN5bnRheCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgICAgICAgICBpZiAoczQgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gcGVnJGN1cnJQb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMzMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IGlucHV0LnN1YnN0cmluZyhzMCwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMxMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGVnJHBhcnNldGFnTmFtZSgpIHtcbiAgICAgICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcbiAgICAgICAgcGVnJHNpbGVudEZhaWxzKys7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHMxID0gW107XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDUpIHtcbiAgICAgICAgICAgIHMyID0gcGVnJGM4NjtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGM4Nyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgICAgIHBlZyRzaWxlbnRGYWlscysrO1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2V3aGl0ZVNwYWNlKCk7XG4gICAgICAgICAgICBpZiAoczQgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNCA9IHBlZyRwYXJzZXBhdHRlcm5TeW50YXgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlZyRzaWxlbnRGYWlscy0tO1xuICAgICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPiBwZWckY3VyclBvcykge1xuICAgICAgICAgICAgICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjMzApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NSkge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjODY7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRjODcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgICAgICAgICBwZWckc2lsZW50RmFpbHMrKztcbiAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2V3aGl0ZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VwYXR0ZXJuU3ludGF4KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGVnJHNpbGVudEZhaWxzLS07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckZmFpbChwZWckYzMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMyA9IFtzMywgczRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IGlucHV0LnN1YnN0cmluZyhzMCwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfVxuICAgICAgICBwZWckc2lsZW50RmFpbHMtLTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcGVnJGZhaWwocGVnJGMxMTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzMDtcbiAgICB9XG4gICAgdmFyIG1lc3NhZ2VDdHggPSBbJ3Jvb3QnXTtcbiAgICBmdW5jdGlvbiBpc05lc3RlZE1lc3NhZ2VUZXh0KCkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZUN0eC5sZW5ndGggPiAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc0luUGx1cmFsT3B0aW9uKCkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZUN0eFttZXNzYWdlQ3R4Lmxlbmd0aCAtIDFdID09PSAncGx1cmFsJztcbiAgICB9XG4gICAgZnVuY3Rpb24gaW5zZXJ0TG9jYXRpb24oKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zICYmIG9wdGlvbnMuY2FwdHVyZUxvY2F0aW9uID8ge1xuICAgICAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uKClcbiAgICAgICAgfSA6IHt9O1xuICAgIH1cbiAgICB2YXIgaWdub3JlVGFnID0gb3B0aW9ucyAmJiBvcHRpb25zLmlnbm9yZVRhZztcbiAgICB2YXIgc2hvdWxkUGFyc2VTa2VsZXRvbiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5zaG91bGRQYXJzZVNrZWxldG9uO1xuICAgIHBlZyRyZXN1bHQgPSBwZWckc3RhcnRSdWxlRnVuY3Rpb24oKTtcbiAgICBpZiAocGVnJHJlc3VsdCAhPT0gcGVnJEZBSUxFRCAmJiBwZWckY3VyclBvcyA9PT0gaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBwZWckcmVzdWx0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPCBpbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBlZyRmYWlsKHBlZyRlbmRFeHBlY3RhdGlvbigpKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBwZWckYnVpbGRTdHJ1Y3R1cmVkRXJyb3IocGVnJG1heEZhaWxFeHBlY3RlZCwgcGVnJG1heEZhaWxQb3MgPCBpbnB1dC5sZW5ndGggPyBpbnB1dC5jaGFyQXQocGVnJG1heEZhaWxQb3MpIDogbnVsbCwgcGVnJG1heEZhaWxQb3MgPCBpbnB1dC5sZW5ndGhcbiAgICAgICAgICAgID8gcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckbWF4RmFpbFBvcywgcGVnJG1heEZhaWxQb3MgKyAxKVxuICAgICAgICAgICAgOiBwZWckY29tcHV0ZUxvY2F0aW9uKHBlZyRtYXhGYWlsUG9zLCBwZWckbWF4RmFpbFBvcykpO1xuICAgIH1cbn1cbmV4cG9ydHMucGVnUGFyc2UgPSBwZWckcGFyc2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMucGFyc2VOdW1iZXJTa2VsZXRvbiA9IGV4cG9ydHMucGFyc2VEYXRlVGltZVNrZWxldG9uID0gdm9pZCAwO1xudmFyIHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG4vKipcbiAqIGh0dHBzOi8vdW5pY29kZS5vcmcvcmVwb3J0cy90cjM1L3RyMzUtZGF0ZXMuaHRtbCNEYXRlX0ZpZWxkX1N5bWJvbF9UYWJsZVxuICogQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vY2FyaWR5L2ludGwtZGF0ZXRpbWVmb3JtYXQtcGF0dGVybi9ibG9iL21hc3Rlci9pbmRleC5qc1xuICogd2l0aCBzb21lIHR3ZWFrc1xuICovXG52YXIgREFURV9USU1FX1JFR0VYID0gLyg/OltFZWNdezEsNn18R3sxLDV9fFtRcV17MSw1fXwoPzpbeVl1cl0rfFV7MSw1fSl8W01MXXsxLDV9fGR7MSwyfXxEezEsM318RnsxfXxbYWJCXXsxLDV9fFtoa0hLXXsxLDJ9fHd7MSwyfXxXezF9fG17MSwyfXxzezEsMn18W3paT3ZWeFhdezEsNH0pKD89KFteJ10qJ1teJ10qJykqW14nXSokKS9nO1xuLyoqXG4gKiBQYXJzZSBEYXRlIHRpbWUgc2tlbGV0b24gaW50byBJbnRsLkRhdGVUaW1lRm9ybWF0T3B0aW9uc1xuICogUmVmOiBodHRwczovL3VuaWNvZGUub3JnL3JlcG9ydHMvdHIzNS90cjM1LWRhdGVzLmh0bWwjRGF0ZV9GaWVsZF9TeW1ib2xfVGFibGVcbiAqIEBwdWJsaWNcbiAqIEBwYXJhbSBza2VsZXRvbiBza2VsZXRvbiBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gcGFyc2VEYXRlVGltZVNrZWxldG9uKHNrZWxldG9uKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHNrZWxldG9uLnJlcGxhY2UoREFURV9USU1FX1JFR0VYLCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgdmFyIGxlbiA9IG1hdGNoLmxlbmd0aDtcbiAgICAgICAgc3dpdGNoIChtYXRjaFswXSkge1xuICAgICAgICAgICAgLy8gRXJhXG4gICAgICAgICAgICBjYXNlICdHJzpcbiAgICAgICAgICAgICAgICByZXN1bHQuZXJhID0gbGVuID09PSA0ID8gJ2xvbmcnIDogbGVuID09PSA1ID8gJ25hcnJvdycgOiAnc2hvcnQnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gWWVhclxuICAgICAgICAgICAgY2FzZSAneSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0LnllYXIgPSBsZW4gPT09IDIgPyAnMi1kaWdpdCcgOiAnbnVtZXJpYyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdZJzpcbiAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgY2FzZSAnVSc6XG4gICAgICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYFkvdS9VL3JgICh5ZWFyKSBwYXR0ZXJucyBhcmUgbm90IHN1cHBvcnRlZCwgdXNlIGB5YCBpbnN0ZWFkJyk7XG4gICAgICAgICAgICAvLyBRdWFydGVyXG4gICAgICAgICAgICBjYXNlICdxJzpcbiAgICAgICAgICAgIGNhc2UgJ1EnOlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdgcS9RYCAocXVhcnRlcikgcGF0dGVybnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICAgIC8vIE1vbnRoXG4gICAgICAgICAgICBjYXNlICdNJzpcbiAgICAgICAgICAgIGNhc2UgJ0wnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5tb250aCA9IFsnbnVtZXJpYycsICcyLWRpZ2l0JywgJ3Nob3J0JywgJ2xvbmcnLCAnbmFycm93J11bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBXZWVrXG4gICAgICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgICAgIGNhc2UgJ1cnOlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdgdy9XYCAod2VlaykgcGF0dGVybnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5kYXkgPSBbJ251bWVyaWMnLCAnMi1kaWdpdCddW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRCc6XG4gICAgICAgICAgICBjYXNlICdGJzpcbiAgICAgICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdgRC9GL2dgIChkYXkpIHBhdHRlcm5zIGFyZSBub3Qgc3VwcG9ydGVkLCB1c2UgYGRgIGluc3RlYWQnKTtcbiAgICAgICAgICAgIC8vIFdlZWtkYXlcbiAgICAgICAgICAgIGNhc2UgJ0UnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC53ZWVrZGF5ID0gbGVuID09PSA0ID8gJ3Nob3J0JyA6IGxlbiA9PT0gNSA/ICduYXJyb3cnIDogJ3Nob3J0JztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICAgICAgICAgIGlmIChsZW4gPCA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdgZS4uZWVlYCAod2Vla2RheSkgcGF0dGVybnMgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0LndlZWtkYXkgPSBbJ3Nob3J0JywgJ2xvbmcnLCAnbmFycm93JywgJ3Nob3J0J11bbGVuIC0gNF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICAgICAgICBpZiAobGVuIDwgNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYGMuLmNjY2AgKHdlZWtkYXkpIHBhdHRlcm5zIGFyZSBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC53ZWVrZGF5ID0gWydzaG9ydCcsICdsb25nJywgJ25hcnJvdycsICdzaG9ydCddW2xlbiAtIDRdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gUGVyaW9kXG4gICAgICAgICAgICBjYXNlICdhJzogLy8gQU0sIFBNXG4gICAgICAgICAgICAgICAgcmVzdWx0LmhvdXIxMiA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdiJzogLy8gYW0sIHBtLCBub29uLCBtaWRuaWdodFxuICAgICAgICAgICAgY2FzZSAnQic6IC8vIGZsZXhpYmxlIGRheSBwZXJpb2RzXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2BiL0JgIChwZXJpb2QpIHBhdHRlcm5zIGFyZSBub3Qgc3VwcG9ydGVkLCB1c2UgYGFgIGluc3RlYWQnKTtcbiAgICAgICAgICAgIC8vIEhvdXJcbiAgICAgICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5ob3VyQ3ljbGUgPSAnaDEyJztcbiAgICAgICAgICAgICAgICByZXN1bHQuaG91ciA9IFsnbnVtZXJpYycsICcyLWRpZ2l0J11bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdIJzpcbiAgICAgICAgICAgICAgICByZXN1bHQuaG91ckN5Y2xlID0gJ2gyMyc7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmhvdXIgPSBbJ251bWVyaWMnLCAnMi1kaWdpdCddW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnSyc6XG4gICAgICAgICAgICAgICAgcmVzdWx0LmhvdXJDeWNsZSA9ICdoMTEnO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5ob3VyID0gWydudW1lcmljJywgJzItZGlnaXQnXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2snOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5ob3VyQ3ljbGUgPSAnaDI0JztcbiAgICAgICAgICAgICAgICByZXN1bHQuaG91ciA9IFsnbnVtZXJpYycsICcyLWRpZ2l0J11bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdqJzpcbiAgICAgICAgICAgIGNhc2UgJ0onOlxuICAgICAgICAgICAgY2FzZSAnQyc6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2BqL0ovQ2AgKGhvdXIpIHBhdHRlcm5zIGFyZSBub3Qgc3VwcG9ydGVkLCB1c2UgYGgvSC9LL2tgIGluc3RlYWQnKTtcbiAgICAgICAgICAgIC8vIE1pbnV0ZVxuICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm1pbnV0ZSA9IFsnbnVtZXJpYycsICcyLWRpZ2l0J11bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBTZWNvbmRcbiAgICAgICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5zZWNvbmQgPSBbJ251bWVyaWMnLCAnMi1kaWdpdCddW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnUyc6XG4gICAgICAgICAgICBjYXNlICdBJzpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYFMvQWAgKHNlY29uZCkgcGF0dGVybnMgYXJlIG5vdCBzdXBwb3J0ZWQsIHVzZSBgc2AgaW5zdGVhZCcpO1xuICAgICAgICAgICAgLy8gWm9uZVxuICAgICAgICAgICAgY2FzZSAneic6IC8vIDEuLjMsIDQ6IHNwZWNpZmljIG5vbi1sb2NhdGlvbiBmb3JtYXRcbiAgICAgICAgICAgICAgICByZXN1bHQudGltZVpvbmVOYW1lID0gbGVuIDwgNCA/ICdzaG9ydCcgOiAnbG9uZyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdaJzogLy8gMS4uMywgNCwgNTogVGhlIElTTzg2MDEgdmFyaW9zIGZvcm1hdHNcbiAgICAgICAgICAgIGNhc2UgJ08nOiAvLyAxLCA0OiBtaWxpc2Vjb25kcyBpbiBkYXkgc2hvcnQsIGxvbmdcbiAgICAgICAgICAgIGNhc2UgJ3YnOiAvLyAxLCA0OiBnZW5lcmljIG5vbi1sb2NhdGlvbiBmb3JtYXRcbiAgICAgICAgICAgIGNhc2UgJ1YnOiAvLyAxLCAyLCAzLCA0OiB0aW1lIHpvbmUgSUQgb3IgY2l0eVxuICAgICAgICAgICAgY2FzZSAnWCc6IC8vIDEsIDIsIDMsIDQ6IFRoZSBJU084NjAxIHZhcmlvcyBmb3JtYXRzXG4gICAgICAgICAgICBjYXNlICd4JzogLy8gMSwgMiwgMywgNDogVGhlIElTTzg2MDEgdmFyaW9zIGZvcm1hdHNcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYFovTy92L1YvWC94YCAodGltZVpvbmUpIHBhdHRlcm5zIGFyZSBub3Qgc3VwcG9ydGVkLCB1c2UgYHpgIGluc3RlYWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmV4cG9ydHMucGFyc2VEYXRlVGltZVNrZWxldG9uID0gcGFyc2VEYXRlVGltZVNrZWxldG9uO1xuZnVuY3Rpb24gaWN1VW5pdFRvRWNtYSh1bml0KSB7XG4gICAgcmV0dXJuIHVuaXQucmVwbGFjZSgvXiguKj8pLS8sICcnKTtcbn1cbnZhciBGUkFDVElPTl9QUkVDSVNJT05fUkVHRVggPSAvXlxcLig/OigwKykoXFwqKT98KCMrKXwoMCspKCMrKSkkL2c7XG52YXIgU0lHTklGSUNBTlRfUFJFQ0lTSU9OX1JFR0VYID0gL14oQCspPyhcXCt8IyspPyQvZztcbmZ1bmN0aW9uIHBhcnNlU2lnbmlmaWNhbnRQcmVjaXNpb24oc3RyKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHN0ci5yZXBsYWNlKFNJR05JRklDQU5UX1BSRUNJU0lPTl9SRUdFWCwgZnVuY3Rpb24gKF8sIGcxLCBnMikge1xuICAgICAgICAvLyBAQEAgY2FzZVxuICAgICAgICBpZiAodHlwZW9mIGcyICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVzdWx0Lm1pbmltdW1TaWduaWZpY2FudERpZ2l0cyA9IGcxLmxlbmd0aDtcbiAgICAgICAgICAgIHJlc3VsdC5tYXhpbXVtU2lnbmlmaWNhbnREaWdpdHMgPSBnMS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQEBAKyBjYXNlXG4gICAgICAgIGVsc2UgaWYgKGcyID09PSAnKycpIHtcbiAgICAgICAgICAgIHJlc3VsdC5taW5pbXVtU2lnbmlmaWNhbnREaWdpdHMgPSBnMS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gLiMjIyBjYXNlXG4gICAgICAgIGVsc2UgaWYgKGcxWzBdID09PSAnIycpIHtcbiAgICAgICAgICAgIHJlc3VsdC5tYXhpbXVtU2lnbmlmaWNhbnREaWdpdHMgPSBnMS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gLkBAIyMgb3IgLkBAQCBjYXNlXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0Lm1pbmltdW1TaWduaWZpY2FudERpZ2l0cyA9IGcxLmxlbmd0aDtcbiAgICAgICAgICAgIHJlc3VsdC5tYXhpbXVtU2lnbmlmaWNhbnREaWdpdHMgPVxuICAgICAgICAgICAgICAgIGcxLmxlbmd0aCArICh0eXBlb2YgZzIgPT09ICdzdHJpbmcnID8gZzIubGVuZ3RoIDogMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBwYXJzZVNpZ24oc3RyKSB7XG4gICAgc3dpdGNoIChzdHIpIHtcbiAgICAgICAgY2FzZSAnc2lnbi1hdXRvJzpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2lnbkRpc3BsYXk6ICdhdXRvJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgJ3NpZ24tYWNjb3VudGluZyc6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5U2lnbjogJ2FjY291bnRpbmcnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAnc2lnbi1hbHdheXMnOlxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzaWduRGlzcGxheTogJ2Fsd2F5cycsXG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlICdzaWduLWFjY291bnRpbmctYWx3YXlzJzpcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2lnbkRpc3BsYXk6ICdhbHdheXMnLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5U2lnbjogJ2FjY291bnRpbmcnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAnc2lnbi1leGNlcHQtemVybyc6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNpZ25EaXNwbGF5OiAnZXhjZXB0WmVybycsXG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlICdzaWduLWFjY291bnRpbmctZXhjZXB0LXplcm8nOlxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzaWduRGlzcGxheTogJ2V4Y2VwdFplcm8nLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5U2lnbjogJ2FjY291bnRpbmcnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAnc2lnbi1uZXZlcic6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNpZ25EaXNwbGF5OiAnbmV2ZXInLFxuICAgICAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXJzZU5vdGF0aW9uT3B0aW9ucyhvcHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIHNpZ25PcHRzID0gcGFyc2VTaWduKG9wdCk7XG4gICAgaWYgKHNpZ25PcHRzKSB7XG4gICAgICAgIHJldHVybiBzaWduT3B0cztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogaHR0cHM6Ly9naXRodWIuY29tL3VuaWNvZGUtb3JnL2ljdS9ibG9iL21hc3Rlci9kb2NzL3VzZXJndWlkZS9mb3JtYXRfcGFyc2UvbnVtYmVycy9za2VsZXRvbnMubWQjc2tlbGV0b24tc3RlbXMtYW5kLW9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gcGFyc2VOdW1iZXJTa2VsZXRvbih0b2tlbnMpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgX2kgPSAwLCB0b2tlbnNfMSA9IHRva2VuczsgX2kgPCB0b2tlbnNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIHRva2VuID0gdG9rZW5zXzFbX2ldO1xuICAgICAgICBzd2l0Y2ggKHRva2VuLnN0ZW0pIHtcbiAgICAgICAgICAgIGNhc2UgJ3BlcmNlbnQnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdHlsZSA9ICdwZXJjZW50JztcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNhc2UgJ2N1cnJlbmN5JzpcbiAgICAgICAgICAgICAgICByZXN1bHQuc3R5bGUgPSAnY3VycmVuY3knO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jdXJyZW5jeSA9IHRva2VuLm9wdGlvbnNbMF07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICdncm91cC1vZmYnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC51c2VHcm91cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY2FzZSAncHJlY2lzaW9uLWludGVnZXInOlxuICAgICAgICAgICAgY2FzZSAnLic6XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm1heGltdW1GcmFjdGlvbkRpZ2l0cyA9IDA7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICdtZWFzdXJlLXVuaXQnOlxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdHlsZSA9ICd1bml0JztcbiAgICAgICAgICAgICAgICByZXN1bHQudW5pdCA9IGljdVVuaXRUb0VjbWEodG9rZW4ub3B0aW9uc1swXSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICdjb21wYWN0LXNob3J0JzpcbiAgICAgICAgICAgICAgICByZXN1bHQubm90YXRpb24gPSAnY29tcGFjdCc7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBhY3REaXNwbGF5ID0gJ3Nob3J0JztcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNhc2UgJ2NvbXBhY3QtbG9uZyc6XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vdGF0aW9uID0gJ2NvbXBhY3QnO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wYWN0RGlzcGxheSA9ICdsb25nJztcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNhc2UgJ3NjaWVudGlmaWMnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRzbGliXzEuX19hc3NpZ24odHNsaWJfMS5fX2Fzc2lnbih0c2xpYl8xLl9fYXNzaWduKHt9LCByZXN1bHQpLCB7IG5vdGF0aW9uOiAnc2NpZW50aWZpYycgfSksIHRva2VuLm9wdGlvbnMucmVkdWNlKGZ1bmN0aW9uIChhbGwsIG9wdCkgeyByZXR1cm4gKHRzbGliXzEuX19hc3NpZ24odHNsaWJfMS5fX2Fzc2lnbih7fSwgYWxsKSwgcGFyc2VOb3RhdGlvbk9wdGlvbnMob3B0KSkpOyB9LCB7fSkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY2FzZSAnZW5naW5lZXJpbmcnOlxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRzbGliXzEuX19hc3NpZ24odHNsaWJfMS5fX2Fzc2lnbih0c2xpYl8xLl9fYXNzaWduKHt9LCByZXN1bHQpLCB7IG5vdGF0aW9uOiAnZW5naW5lZXJpbmcnIH0pLCB0b2tlbi5vcHRpb25zLnJlZHVjZShmdW5jdGlvbiAoYWxsLCBvcHQpIHsgcmV0dXJuICh0c2xpYl8xLl9fYXNzaWduKHRzbGliXzEuX19hc3NpZ24oe30sIGFsbCksIHBhcnNlTm90YXRpb25PcHRpb25zKG9wdCkpKTsgfSwge30pKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNhc2UgJ25vdGF0aW9uLXNpbXBsZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vdGF0aW9uID0gJ3N0YW5kYXJkJztcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bmljb2RlLW9yZy9pY3UvYmxvYi9tYXN0ZXIvaWN1NGMvc291cmNlL2kxOG4vdW5pY29kZS91bnVtYmVyZm9ybWF0dGVyLmhcbiAgICAgICAgICAgIGNhc2UgJ3VuaXQtd2lkdGgtbmFycm93JzpcbiAgICAgICAgICAgICAgICByZXN1bHQuY3VycmVuY3lEaXNwbGF5ID0gJ25hcnJvd1N5bWJvbCc7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuaXREaXNwbGF5ID0gJ25hcnJvdyc7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICd1bml0LXdpZHRoLXNob3J0JzpcbiAgICAgICAgICAgICAgICByZXN1bHQuY3VycmVuY3lEaXNwbGF5ID0gJ2NvZGUnO1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bml0RGlzcGxheSA9ICdzaG9ydCc7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICd1bml0LXdpZHRoLWZ1bGwtbmFtZSc6XG4gICAgICAgICAgICAgICAgcmVzdWx0LmN1cnJlbmN5RGlzcGxheSA9ICduYW1lJztcbiAgICAgICAgICAgICAgICByZXN1bHQudW5pdERpc3BsYXkgPSAnbG9uZyc7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjYXNlICd1bml0LXdpZHRoLWlzby1jb2RlJzpcbiAgICAgICAgICAgICAgICByZXN1bHQuY3VycmVuY3lEaXNwbGF5ID0gJ3N5bWJvbCc7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUHJlY2lzaW9uXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bmljb2RlLW9yZy9pY3UvYmxvYi9tYXN0ZXIvZG9jcy91c2VyZ3VpZGUvZm9ybWF0X3BhcnNlL251bWJlcnMvc2tlbGV0b25zLm1kI2ZyYWN0aW9uLXByZWNpc2lvblxuICAgICAgICAvLyBwcmVjaXNpb24taW50ZWdlciBjYXNlXG4gICAgICAgIGlmIChGUkFDVElPTl9QUkVDSVNJT05fUkVHRVgudGVzdCh0b2tlbi5zdGVtKSkge1xuICAgICAgICAgICAgaWYgKHRva2VuLm9wdGlvbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdGcmFjdGlvbi1wcmVjaXNpb24gc3RlbXMgb25seSBhY2NlcHQgYSBzaW5nbGUgb3B0aW9uYWwgb3B0aW9uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbi5zdGVtLnJlcGxhY2UoRlJBQ1RJT05fUFJFQ0lTSU9OX1JFR0VYLCBmdW5jdGlvbiAoXywgZzEsIGcyLCBnMywgZzQsIGc1KSB7XG4gICAgICAgICAgICAgICAgLy8gLjAwMCogY2FzZSAoYmVmb3JlIElDVTY3IGl0IHdhcyAuMDAwKylcbiAgICAgICAgICAgICAgICBpZiAoZzIgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQubWluaW11bUZyYWN0aW9uRGlnaXRzID0gZzEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAuIyMjIGNhc2VcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChnMyAmJiBnM1swXSA9PT0gJyMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5tYXhpbXVtRnJhY3Rpb25EaWdpdHMgPSBnMy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIC4wMCMjIGNhc2VcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChnNCAmJiBnNSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQubWluaW11bUZyYWN0aW9uRGlnaXRzID0gZzQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQubWF4aW11bUZyYWN0aW9uRGlnaXRzID0gZzQubGVuZ3RoICsgZzUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm1pbmltdW1GcmFjdGlvbkRpZ2l0cyA9IGcxLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm1heGltdW1GcmFjdGlvbkRpZ2l0cyA9IGcxLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAodG9rZW4ub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0c2xpYl8xLl9fYXNzaWduKHRzbGliXzEuX19hc3NpZ24oe30sIHJlc3VsdCksIHBhcnNlU2lnbmlmaWNhbnRQcmVjaXNpb24odG9rZW4ub3B0aW9uc1swXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFNJR05JRklDQU5UX1BSRUNJU0lPTl9SRUdFWC50ZXN0KHRva2VuLnN0ZW0pKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0c2xpYl8xLl9fYXNzaWduKHRzbGliXzEuX19hc3NpZ24oe30sIHJlc3VsdCksIHBhcnNlU2lnbmlmaWNhbnRQcmVjaXNpb24odG9rZW4uc3RlbSkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNpZ25PcHRzID0gcGFyc2VTaWduKHRva2VuLnN0ZW0pO1xuICAgICAgICBpZiAoc2lnbk9wdHMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRzbGliXzEuX19hc3NpZ24odHNsaWJfMS5fX2Fzc2lnbih7fSwgcmVzdWx0KSwgc2lnbk9wdHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnRzLnBhcnNlTnVtYmVyU2tlbGV0b24gPSBwYXJzZU51bWJlclNrZWxldG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmNyZWF0ZU51bWJlckVsZW1lbnQgPSBleHBvcnRzLmNyZWF0ZUxpdGVyYWxFbGVtZW50ID0gZXhwb3J0cy5pc0RhdGVUaW1lU2tlbGV0b24gPSBleHBvcnRzLmlzTnVtYmVyU2tlbGV0b24gPSBleHBvcnRzLmlzVGFnRWxlbWVudCA9IGV4cG9ydHMuaXNQb3VuZEVsZW1lbnQgPSBleHBvcnRzLmlzUGx1cmFsRWxlbWVudCA9IGV4cG9ydHMuaXNTZWxlY3RFbGVtZW50ID0gZXhwb3J0cy5pc1RpbWVFbGVtZW50ID0gZXhwb3J0cy5pc0RhdGVFbGVtZW50ID0gZXhwb3J0cy5pc051bWJlckVsZW1lbnQgPSBleHBvcnRzLmlzQXJndW1lbnRFbGVtZW50ID0gZXhwb3J0cy5pc0xpdGVyYWxFbGVtZW50ID0gZXhwb3J0cy5TS0VMRVRPTl9UWVBFID0gZXhwb3J0cy5UWVBFID0gdm9pZCAwO1xudmFyIFRZUEU7XG4oZnVuY3Rpb24gKFRZUEUpIHtcbiAgICAvKipcbiAgICAgKiBSYXcgdGV4dFxuICAgICAqL1xuICAgIFRZUEVbVFlQRVtcImxpdGVyYWxcIl0gPSAwXSA9IFwibGl0ZXJhbFwiO1xuICAgIC8qKlxuICAgICAqIFZhcmlhYmxlIHcvbyBhbnkgZm9ybWF0LCBlLmcgYHZhcmAgaW4gYHRoaXMgaXMgYSB7dmFyfWBcbiAgICAgKi9cbiAgICBUWVBFW1RZUEVbXCJhcmd1bWVudFwiXSA9IDFdID0gXCJhcmd1bWVudFwiO1xuICAgIC8qKlxuICAgICAqIFZhcmlhYmxlIHcvIG51bWJlciBmb3JtYXRcbiAgICAgKi9cbiAgICBUWVBFW1RZUEVbXCJudW1iZXJcIl0gPSAyXSA9IFwibnVtYmVyXCI7XG4gICAgLyoqXG4gICAgICogVmFyaWFibGUgdy8gZGF0ZSBmb3JtYXRcbiAgICAgKi9cbiAgICBUWVBFW1RZUEVbXCJkYXRlXCJdID0gM10gPSBcImRhdGVcIjtcbiAgICAvKipcbiAgICAgKiBWYXJpYWJsZSB3LyB0aW1lIGZvcm1hdFxuICAgICAqL1xuICAgIFRZUEVbVFlQRVtcInRpbWVcIl0gPSA0XSA9IFwidGltZVwiO1xuICAgIC8qKlxuICAgICAqIFZhcmlhYmxlIHcvIHNlbGVjdCBmb3JtYXRcbiAgICAgKi9cbiAgICBUWVBFW1RZUEVbXCJzZWxlY3RcIl0gPSA1XSA9IFwic2VsZWN0XCI7XG4gICAgLyoqXG4gICAgICogVmFyaWFibGUgdy8gcGx1cmFsIGZvcm1hdFxuICAgICAqL1xuICAgIFRZUEVbVFlQRVtcInBsdXJhbFwiXSA9IDZdID0gXCJwbHVyYWxcIjtcbiAgICAvKipcbiAgICAgKiBPbmx5IHBvc3NpYmxlIHdpdGhpbiBwbHVyYWwgYXJndW1lbnQuXG4gICAgICogVGhpcyBpcyB0aGUgYCNgIHN5bWJvbCB0aGF0IHdpbGwgYmUgc3Vic3RpdHV0ZWQgd2l0aCB0aGUgY291bnQuXG4gICAgICovXG4gICAgVFlQRVtUWVBFW1wicG91bmRcIl0gPSA3XSA9IFwicG91bmRcIjtcbiAgICAvKipcbiAgICAgKiBYTUwtbGlrZSB0YWdcbiAgICAgKi9cbiAgICBUWVBFW1RZUEVbXCJ0YWdcIl0gPSA4XSA9IFwidGFnXCI7XG59KShUWVBFID0gZXhwb3J0cy5UWVBFIHx8IChleHBvcnRzLlRZUEUgPSB7fSkpO1xudmFyIFNLRUxFVE9OX1RZUEU7XG4oZnVuY3Rpb24gKFNLRUxFVE9OX1RZUEUpIHtcbiAgICBTS0VMRVRPTl9UWVBFW1NLRUxFVE9OX1RZUEVbXCJudW1iZXJcIl0gPSAwXSA9IFwibnVtYmVyXCI7XG4gICAgU0tFTEVUT05fVFlQRVtTS0VMRVRPTl9UWVBFW1wiZGF0ZVRpbWVcIl0gPSAxXSA9IFwiZGF0ZVRpbWVcIjtcbn0pKFNLRUxFVE9OX1RZUEUgPSBleHBvcnRzLlNLRUxFVE9OX1RZUEUgfHwgKGV4cG9ydHMuU0tFTEVUT05fVFlQRSA9IHt9KSk7XG4vKipcbiAqIFR5cGUgR3VhcmRzXG4gKi9cbmZ1bmN0aW9uIGlzTGl0ZXJhbEVsZW1lbnQoZWwpIHtcbiAgICByZXR1cm4gZWwudHlwZSA9PT0gVFlQRS5saXRlcmFsO1xufVxuZXhwb3J0cy5pc0xpdGVyYWxFbGVtZW50ID0gaXNMaXRlcmFsRWxlbWVudDtcbmZ1bmN0aW9uIGlzQXJndW1lbnRFbGVtZW50KGVsKSB7XG4gICAgcmV0dXJuIGVsLnR5cGUgPT09IFRZUEUuYXJndW1lbnQ7XG59XG5leHBvcnRzLmlzQXJndW1lbnRFbGVtZW50ID0gaXNBcmd1bWVudEVsZW1lbnQ7XG5mdW5jdGlvbiBpc051bWJlckVsZW1lbnQoZWwpIHtcbiAgICByZXR1cm4gZWwudHlwZSA9PT0gVFlQRS5udW1iZXI7XG59XG5leHBvcnRzLmlzTnVtYmVyRWxlbWVudCA9IGlzTnVtYmVyRWxlbWVudDtcbmZ1bmN0aW9uIGlzRGF0ZUVsZW1lbnQoZWwpIHtcbiAgICByZXR1cm4gZWwudHlwZSA9PT0gVFlQRS5kYXRlO1xufVxuZXhwb3J0cy5pc0RhdGVFbGVtZW50ID0gaXNEYXRlRWxlbWVudDtcbmZ1bmN0aW9uIGlzVGltZUVsZW1lbnQoZWwpIHtcbiAgICByZXR1cm4gZWwudHlwZSA9PT0gVFlQRS50aW1lO1xufVxuZXhwb3J0cy5pc1RpbWVFbGVtZW50ID0gaXNUaW1lRWxlbWVudDtcbmZ1bmN0aW9uIGlzU2VsZWN0RWxlbWVudChlbCkge1xuICAgIHJldHVybiBlbC50eXBlID09PSBUWVBFLnNlbGVjdDtcbn1cbmV4cG9ydHMuaXNTZWxlY3RFbGVtZW50ID0gaXNTZWxlY3RFbGVtZW50O1xuZnVuY3Rpb24gaXNQbHVyYWxFbGVtZW50KGVsKSB7XG4gICAgcmV0dXJuIGVsLnR5cGUgPT09IFRZUEUucGx1cmFsO1xufVxuZXhwb3J0cy5pc1BsdXJhbEVsZW1lbnQgPSBpc1BsdXJhbEVsZW1lbnQ7XG5mdW5jdGlvbiBpc1BvdW5kRWxlbWVudChlbCkge1xuICAgIHJldHVybiBlbC50eXBlID09PSBUWVBFLnBvdW5kO1xufVxuZXhwb3J0cy5pc1BvdW5kRWxlbWVudCA9IGlzUG91bmRFbGVtZW50O1xuZnVuY3Rpb24gaXNUYWdFbGVtZW50KGVsKSB7XG4gICAgcmV0dXJuIGVsLnR5cGUgPT09IFRZUEUudGFnO1xufVxuZXhwb3J0cy5pc1RhZ0VsZW1lbnQgPSBpc1RhZ0VsZW1lbnQ7XG5mdW5jdGlvbiBpc051bWJlclNrZWxldG9uKGVsKSB7XG4gICAgcmV0dXJuICEhKGVsICYmIHR5cGVvZiBlbCA9PT0gJ29iamVjdCcgJiYgZWwudHlwZSA9PT0gMCAvKiBudW1iZXIgKi8pO1xufVxuZXhwb3J0cy5pc051bWJlclNrZWxldG9uID0gaXNOdW1iZXJTa2VsZXRvbjtcbmZ1bmN0aW9uIGlzRGF0ZVRpbWVTa2VsZXRvbihlbCkge1xuICAgIHJldHVybiAhIShlbCAmJiB0eXBlb2YgZWwgPT09ICdvYmplY3QnICYmIGVsLnR5cGUgPT09IDEgLyogZGF0ZVRpbWUgKi8pO1xufVxuZXhwb3J0cy5pc0RhdGVUaW1lU2tlbGV0b24gPSBpc0RhdGVUaW1lU2tlbGV0b247XG5mdW5jdGlvbiBjcmVhdGVMaXRlcmFsRWxlbWVudCh2YWx1ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFRZUEUubGl0ZXJhbCxcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZUxpdGVyYWxFbGVtZW50ID0gY3JlYXRlTGl0ZXJhbEVsZW1lbnQ7XG5mdW5jdGlvbiBjcmVhdGVOdW1iZXJFbGVtZW50KHZhbHVlLCBzdHlsZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFRZUEUubnVtYmVyLFxuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVOdW1iZXJFbGVtZW50ID0gY3JlYXRlTnVtYmVyRWxlbWVudDtcbiIsIlwidXNlIHN0cmljdFwiO1xuLypcbkNvcHlyaWdodCAoYykgMjAxNCwgWWFob28hIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbkNvcHlyaWdodHMgbGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgTGljZW5zZS5cblNlZSB0aGUgYWNjb21wYW55aW5nIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMuXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIi4vc3JjL2NvcmVcIik7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zcmMvZm9ybWF0dGVyc1wiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zcmMvY29yZVwiKSwgZXhwb3J0cyk7XG50c2xpYl8xLl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zcmMvZXJyb3JcIiksIGV4cG9ydHMpO1xuZXhwb3J0cy5kZWZhdWx0ID0gY29yZV8xLkludGxNZXNzYWdlRm9ybWF0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKlxuQ29weXJpZ2h0IChjKSAyMDE0LCBZYWhvbyEgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuQ29weXJpZ2h0cyBsaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBMaWNlbnNlLlxuU2VlIHRoZSBhY2NvbXBhbnlpbmcgTElDRU5TRSBmaWxlIGZvciB0ZXJtcy5cbiovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkludGxNZXNzYWdlRm9ybWF0ID0gdm9pZCAwO1xudmFyIHRzbGliXzEgPSByZXF1aXJlKFwidHNsaWJcIik7XG52YXIgaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xID0gcmVxdWlyZShcImludGwtbWVzc2FnZWZvcm1hdC1wYXJzZXJcIik7XG52YXIgbWVtb2l6ZSA9IHRzbGliXzEuX19pbXBvcnRTdGFyKHJlcXVpcmUoXCJmYXN0LW1lbW9pemVcIikpO1xudmFyIGZvcm1hdHRlcnNfMSA9IHJlcXVpcmUoXCIuL2Zvcm1hdHRlcnNcIik7XG4vLyAtLSBNZXNzYWdlRm9ybWF0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5mdW5jdGlvbiBtZXJnZUNvbmZpZyhjMSwgYzIpIHtcbiAgICBpZiAoIWMyKSB7XG4gICAgICAgIHJldHVybiBjMTtcbiAgICB9XG4gICAgcmV0dXJuIHRzbGliXzEuX19hc3NpZ24odHNsaWJfMS5fX2Fzc2lnbih0c2xpYl8xLl9fYXNzaWduKHt9LCAoYzEgfHwge30pKSwgKGMyIHx8IHt9KSksIE9iamVjdC5rZXlzKGMxKS5yZWR1Y2UoZnVuY3Rpb24gKGFsbCwgaykge1xuICAgICAgICBhbGxba10gPSB0c2xpYl8xLl9fYXNzaWduKHRzbGliXzEuX19hc3NpZ24oe30sIGMxW2tdKSwgKGMyW2tdIHx8IHt9KSk7XG4gICAgICAgIHJldHVybiBhbGw7XG4gICAgfSwge30pKTtcbn1cbmZ1bmN0aW9uIG1lcmdlQ29uZmlncyhkZWZhdWx0Q29uZmlnLCBjb25maWdzKSB7XG4gICAgaWYgKCFjb25maWdzKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZmlnO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmtleXMoZGVmYXVsdENvbmZpZykucmVkdWNlKGZ1bmN0aW9uIChhbGwsIGspIHtcbiAgICAgICAgYWxsW2tdID0gbWVyZ2VDb25maWcoZGVmYXVsdENvbmZpZ1trXSwgY29uZmlnc1trXSk7XG4gICAgICAgIHJldHVybiBhbGw7XG4gICAgfSwgdHNsaWJfMS5fX2Fzc2lnbih7fSwgZGVmYXVsdENvbmZpZykpO1xufVxuZnVuY3Rpb24gY3JlYXRlRmFzdE1lbW9pemVDYWNoZShzdG9yZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBoYXM6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgIH07XG59XG4vLyBAdHMtaWdub3JlIHRoaXMgaXMgdG8gZGVhbCB3aXRoIHJvbGx1cCdzIGRlZmF1bHQgaW1wb3J0IHNoZW5hbmlnYW5zXG52YXIgX21lbW9pemVJbnRsID0gbWVtb2l6ZS5kZWZhdWx0IHx8IG1lbW9pemU7XG52YXIgbWVtb2l6ZUludGwgPSBfbWVtb2l6ZUludGw7XG5mdW5jdGlvbiBjcmVhdGVEZWZhdWx0Rm9ybWF0dGVycyhjYWNoZSkge1xuICAgIGlmIChjYWNoZSA9PT0gdm9pZCAwKSB7IGNhY2hlID0ge1xuICAgICAgICBudW1iZXI6IHt9LFxuICAgICAgICBkYXRlVGltZToge30sXG4gICAgICAgIHBsdXJhbFJ1bGVzOiB7fSxcbiAgICB9OyB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0TnVtYmVyRm9ybWF0OiBtZW1vaXplSW50bChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3ICgoX2EgPSBJbnRsLk51bWJlckZvcm1hdCkuYmluZC5hcHBseShfYSwgdHNsaWJfMS5fX3NwcmVhZEFycmF5cyhbdm9pZCAwXSwgYXJncykpKSgpO1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBjYWNoZTogY3JlYXRlRmFzdE1lbW9pemVDYWNoZShjYWNoZS5udW1iZXIpLFxuICAgICAgICAgICAgc3RyYXRlZ3k6IG1lbW9pemVJbnRsLnN0cmF0ZWdpZXMudmFyaWFkaWMsXG4gICAgICAgIH0pLFxuICAgICAgICBnZXREYXRlVGltZUZvcm1hdDogbWVtb2l6ZUludGwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyAoKF9hID0gSW50bC5EYXRlVGltZUZvcm1hdCkuYmluZC5hcHBseShfYSwgdHNsaWJfMS5fX3NwcmVhZEFycmF5cyhbdm9pZCAwXSwgYXJncykpKSgpO1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBjYWNoZTogY3JlYXRlRmFzdE1lbW9pemVDYWNoZShjYWNoZS5kYXRlVGltZSksXG4gICAgICAgICAgICBzdHJhdGVneTogbWVtb2l6ZUludGwuc3RyYXRlZ2llcy52YXJpYWRpYyxcbiAgICAgICAgfSksXG4gICAgICAgIGdldFBsdXJhbFJ1bGVzOiBtZW1vaXplSW50bChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3ICgoX2EgPSBJbnRsLlBsdXJhbFJ1bGVzKS5iaW5kLmFwcGx5KF9hLCB0c2xpYl8xLl9fc3ByZWFkQXJyYXlzKFt2b2lkIDBdLCBhcmdzKSkpKCk7XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNhY2hlOiBjcmVhdGVGYXN0TWVtb2l6ZUNhY2hlKGNhY2hlLnBsdXJhbFJ1bGVzKSxcbiAgICAgICAgICAgIHN0cmF0ZWd5OiBtZW1vaXplSW50bC5zdHJhdGVnaWVzLnZhcmlhZGljLFxuICAgICAgICB9KSxcbiAgICB9O1xufVxudmFyIEludGxNZXNzYWdlRm9ybWF0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGxNZXNzYWdlRm9ybWF0KG1lc3NhZ2UsIGxvY2FsZXMsIG92ZXJyaWRlRm9ybWF0cywgb3B0cykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAobG9jYWxlcyA9PT0gdm9pZCAwKSB7IGxvY2FsZXMgPSBJbnRsTWVzc2FnZUZvcm1hdC5kZWZhdWx0TG9jYWxlOyB9XG4gICAgICAgIHRoaXMuZm9ybWF0dGVyQ2FjaGUgPSB7XG4gICAgICAgICAgICBudW1iZXI6IHt9LFxuICAgICAgICAgICAgZGF0ZVRpbWU6IHt9LFxuICAgICAgICAgICAgcGx1cmFsUnVsZXM6IHt9LFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmZvcm1hdCA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IF90aGlzLmZvcm1hdFRvUGFydHModmFsdWVzKTtcbiAgICAgICAgICAgIC8vIEhvdCBwYXRoIGZvciBzdHJhaWdodCBzaW1wbGUgbXNnIHRyYW5zbGF0aW9uc1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0c1swXS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwYXJ0cy5yZWR1Y2UoZnVuY3Rpb24gKGFsbCwgcGFydCkge1xuICAgICAgICAgICAgICAgIGlmICghYWxsLmxlbmd0aCB8fFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LnR5cGUgIT09IDAgLyogbGl0ZXJhbCAqLyB8fFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYWxsW2FsbC5sZW5ndGggLSAxXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsLnB1c2gocGFydC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbGxbYWxsLmxlbmd0aCAtIDFdICs9IHBhcnQudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhbGw7XG4gICAgICAgICAgICB9LCBbXSk7XG4gICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFswXSB8fCAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZm9ybWF0VG9QYXJ0cyA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXR0ZXJzXzEuZm9ybWF0VG9QYXJ0cyhfdGhpcy5hc3QsIF90aGlzLmxvY2FsZXMsIF90aGlzLmZvcm1hdHRlcnMsIF90aGlzLmZvcm1hdHMsIHZhbHVlcywgdW5kZWZpbmVkLCBfdGhpcy5tZXNzYWdlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZXNvbHZlZE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAoe1xuICAgICAgICAgICAgbG9jYWxlOiBJbnRsLk51bWJlckZvcm1hdC5zdXBwb3J0ZWRMb2NhbGVzT2YoX3RoaXMubG9jYWxlcylbMF0sXG4gICAgICAgIH0pOyB9O1xuICAgICAgICB0aGlzLmdldEFzdCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmFzdDsgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIGlmICghSW50bE1lc3NhZ2VGb3JtYXQuX19wYXJzZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludGxNZXNzYWdlRm9ybWF0Ll9fcGFyc2UgbXVzdCBiZSBzZXQgdG8gcHJvY2VzcyBgbWVzc2FnZWAgb2YgdHlwZSBgc3RyaW5nYCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2Ugc3RyaW5nIG1lc3NhZ2VzIGludG8gYW4gQVNULlxuICAgICAgICAgICAgdGhpcy5hc3QgPSBJbnRsTWVzc2FnZUZvcm1hdC5fX3BhcnNlKG1lc3NhZ2UsIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVIYXNodGFnSW5QbHVyYWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlnbm9yZVRhZzogb3B0cyA9PT0gbnVsbCB8fCBvcHRzID09PSB2b2lkIDAgPyB2b2lkIDAgOiBvcHRzLmlnbm9yZVRhZyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hc3QgPSBtZXNzYWdlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmFzdCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgbWVzc2FnZSBtdXN0IGJlIHByb3ZpZGVkIGFzIGEgU3RyaW5nIG9yIEFTVC4nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIHRoZSBzcGVjaWZpZWQgYGZvcm1hdHNgIG1lcmdlZCB3aXRoIHRoZSBkZWZhdWx0XG4gICAgICAgIC8vIGZvcm1hdHMuXG4gICAgICAgIHRoaXMuZm9ybWF0cyA9IG1lcmdlQ29uZmlncyhJbnRsTWVzc2FnZUZvcm1hdC5mb3JtYXRzLCBvdmVycmlkZUZvcm1hdHMpO1xuICAgICAgICAvLyBEZWZpbmVkIGZpcnN0IGJlY2F1c2UgaXQncyB1c2VkIHRvIGJ1aWxkIHRoZSBmb3JtYXQgcGF0dGVybi5cbiAgICAgICAgdGhpcy5sb2NhbGVzID0gbG9jYWxlcztcbiAgICAgICAgdGhpcy5mb3JtYXR0ZXJzID1cbiAgICAgICAgICAgIChvcHRzICYmIG9wdHMuZm9ybWF0dGVycykgfHwgY3JlYXRlRGVmYXVsdEZvcm1hdHRlcnModGhpcy5mb3JtYXR0ZXJDYWNoZSk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShJbnRsTWVzc2FnZUZvcm1hdCwgXCJkZWZhdWx0TG9jYWxlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIUludGxNZXNzYWdlRm9ybWF0Lm1lbW9pemVkRGVmYXVsdExvY2FsZSkge1xuICAgICAgICAgICAgICAgIEludGxNZXNzYWdlRm9ybWF0Lm1lbW9pemVkRGVmYXVsdExvY2FsZSA9IG5ldyBJbnRsLk51bWJlckZvcm1hdCgpLnJlc29sdmVkT3B0aW9ucygpLmxvY2FsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBJbnRsTWVzc2FnZUZvcm1hdC5tZW1vaXplZERlZmF1bHRMb2NhbGU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBJbnRsTWVzc2FnZUZvcm1hdC5tZW1vaXplZERlZmF1bHRMb2NhbGUgPSBudWxsO1xuICAgIEludGxNZXNzYWdlRm9ybWF0Ll9fcGFyc2UgPSBpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEucGFyc2U7XG4gICAgLy8gRGVmYXVsdCBmb3JtYXQgb3B0aW9ucyB1c2VkIGFzIHRoZSBwcm90b3R5cGUgb2YgdGhlIGBmb3JtYXRzYCBwcm92aWRlZCB0byB0aGVcbiAgICAvLyBjb25zdHJ1Y3Rvci4gVGhlc2UgYXJlIHVzZWQgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlIGludGVybmFsIEludGwuTnVtYmVyRm9ybWF0XG4gICAgLy8gYW5kIEludGwuRGF0ZVRpbWVGb3JtYXQgaW5zdGFuY2VzLlxuICAgIEludGxNZXNzYWdlRm9ybWF0LmZvcm1hdHMgPSB7XG4gICAgICAgIG51bWJlcjoge1xuICAgICAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwZXJjZW50OiB7XG4gICAgICAgICAgICAgICAgc3R5bGU6ICdwZXJjZW50JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGU6IHtcbiAgICAgICAgICAgIHNob3J0OiB7XG4gICAgICAgICAgICAgICAgbW9udGg6ICdudW1lcmljJyxcbiAgICAgICAgICAgICAgICBkYXk6ICdudW1lcmljJyxcbiAgICAgICAgICAgICAgICB5ZWFyOiAnMi1kaWdpdCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVkaXVtOiB7XG4gICAgICAgICAgICAgICAgbW9udGg6ICdzaG9ydCcsXG4gICAgICAgICAgICAgICAgZGF5OiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgeWVhcjogJ251bWVyaWMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvbmc6IHtcbiAgICAgICAgICAgICAgICBtb250aDogJ2xvbmcnLFxuICAgICAgICAgICAgICAgIGRheTogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgIHllYXI6ICdudW1lcmljJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsOiB7XG4gICAgICAgICAgICAgICAgd2Vla2RheTogJ2xvbmcnLFxuICAgICAgICAgICAgICAgIG1vbnRoOiAnbG9uZycsXG4gICAgICAgICAgICAgICAgZGF5OiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgeWVhcjogJ251bWVyaWMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZToge1xuICAgICAgICAgICAgc2hvcnQ6IHtcbiAgICAgICAgICAgICAgICBob3VyOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgbWludXRlOiAnbnVtZXJpYycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVkaXVtOiB7XG4gICAgICAgICAgICAgICAgaG91cjogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgIG1pbnV0ZTogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgIHNlY29uZDogJ251bWVyaWMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvbmc6IHtcbiAgICAgICAgICAgICAgICBob3VyOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgbWludXRlOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgc2Vjb25kOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgdGltZVpvbmVOYW1lOiAnc2hvcnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGw6IHtcbiAgICAgICAgICAgICAgICBob3VyOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgbWludXRlOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgc2Vjb25kOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgdGltZVpvbmVOYW1lOiAnc2hvcnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBJbnRsTWVzc2FnZUZvcm1hdDtcbn0oKSk7XG5leHBvcnRzLkludGxNZXNzYWdlRm9ybWF0ID0gSW50bE1lc3NhZ2VGb3JtYXQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWlzc2luZ1ZhbHVlRXJyb3IgPSBleHBvcnRzLkludmFsaWRWYWx1ZVR5cGVFcnJvciA9IGV4cG9ydHMuSW52YWxpZFZhbHVlRXJyb3IgPSBleHBvcnRzLkZvcm1hdEVycm9yID0gZXhwb3J0cy5FcnJvckNvZGUgPSB2b2lkIDA7XG52YXIgdHNsaWJfMSA9IHJlcXVpcmUoXCJ0c2xpYlwiKTtcbnZhciBFcnJvckNvZGU7XG4oZnVuY3Rpb24gKEVycm9yQ29kZSkge1xuICAgIC8vIFdoZW4gd2UgaGF2ZSBhIHBsYWNlaG9sZGVyIGJ1dCBubyB2YWx1ZSB0byBmb3JtYXRcbiAgICBFcnJvckNvZGVbXCJNSVNTSU5HX1ZBTFVFXCJdID0gXCJNSVNTSU5HX1ZBTFVFXCI7XG4gICAgLy8gV2hlbiB2YWx1ZSBzdXBwbGllZCBpcyBpbnZhbGlkXG4gICAgRXJyb3JDb2RlW1wiSU5WQUxJRF9WQUxVRVwiXSA9IFwiSU5WQUxJRF9WQUxVRVwiO1xuICAgIC8vIFdoZW4gd2UgbmVlZCBzcGVjaWZpYyBJbnRsIEFQSSBidXQgaXQncyBub3QgYXZhaWxhYmxlXG4gICAgRXJyb3JDb2RlW1wiTUlTU0lOR19JTlRMX0FQSVwiXSA9IFwiTUlTU0lOR19JTlRMX0FQSVwiO1xufSkoRXJyb3JDb2RlID0gZXhwb3J0cy5FcnJvckNvZGUgfHwgKGV4cG9ydHMuRXJyb3JDb2RlID0ge30pKTtcbnZhciBGb3JtYXRFcnJvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICB0c2xpYl8xLl9fZXh0ZW5kcyhGb3JtYXRFcnJvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBGb3JtYXRFcnJvcihtc2csIGNvZGUsIG9yaWdpbmFsTWVzc2FnZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBtc2cpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmNvZGUgPSBjb2RlO1xuICAgICAgICBfdGhpcy5vcmlnaW5hbE1lc3NhZ2UgPSBvcmlnaW5hbE1lc3NhZ2U7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRm9ybWF0RXJyb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbZm9ybWF0anMgRXJyb3I6IFwiICsgdGhpcy5jb2RlICsgXCJdIFwiICsgdGhpcy5tZXNzYWdlO1xuICAgIH07XG4gICAgcmV0dXJuIEZvcm1hdEVycm9yO1xufShFcnJvcikpO1xuZXhwb3J0cy5Gb3JtYXRFcnJvciA9IEZvcm1hdEVycm9yO1xudmFyIEludmFsaWRWYWx1ZUVycm9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIHRzbGliXzEuX19leHRlbmRzKEludmFsaWRWYWx1ZUVycm9yLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEludmFsaWRWYWx1ZUVycm9yKHZhcmlhYmxlSWQsIHZhbHVlLCBvcHRpb25zLCBvcmlnaW5hbE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIFwiSW52YWxpZCB2YWx1ZXMgZm9yIFxcXCJcIiArIHZhcmlhYmxlSWQgKyBcIlxcXCI6IFxcXCJcIiArIHZhbHVlICsgXCJcXFwiLiBPcHRpb25zIGFyZSBcXFwiXCIgKyBPYmplY3Qua2V5cyhvcHRpb25zKS5qb2luKCdcIiwgXCInKSArIFwiXFxcIlwiLCBcIklOVkFMSURfVkFMVUVcIiAvKiBJTlZBTElEX1ZBTFVFICovLCBvcmlnaW5hbE1lc3NhZ2UpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBJbnZhbGlkVmFsdWVFcnJvcjtcbn0oRm9ybWF0RXJyb3IpKTtcbmV4cG9ydHMuSW52YWxpZFZhbHVlRXJyb3IgPSBJbnZhbGlkVmFsdWVFcnJvcjtcbnZhciBJbnZhbGlkVmFsdWVUeXBlRXJyb3IgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgdHNsaWJfMS5fX2V4dGVuZHMoSW52YWxpZFZhbHVlVHlwZUVycm9yLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEludmFsaWRWYWx1ZVR5cGVFcnJvcih2YWx1ZSwgdHlwZSwgb3JpZ2luYWxNZXNzYWdlKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBcIlZhbHVlIGZvciBcXFwiXCIgKyB2YWx1ZSArIFwiXFxcIiBtdXN0IGJlIG9mIHR5cGUgXCIgKyB0eXBlLCBcIklOVkFMSURfVkFMVUVcIiAvKiBJTlZBTElEX1ZBTFVFICovLCBvcmlnaW5hbE1lc3NhZ2UpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBJbnZhbGlkVmFsdWVUeXBlRXJyb3I7XG59KEZvcm1hdEVycm9yKSk7XG5leHBvcnRzLkludmFsaWRWYWx1ZVR5cGVFcnJvciA9IEludmFsaWRWYWx1ZVR5cGVFcnJvcjtcbnZhciBNaXNzaW5nVmFsdWVFcnJvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICB0c2xpYl8xLl9fZXh0ZW5kcyhNaXNzaW5nVmFsdWVFcnJvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBNaXNzaW5nVmFsdWVFcnJvcih2YXJpYWJsZUlkLCBvcmlnaW5hbE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIFwiVGhlIGludGwgc3RyaW5nIGNvbnRleHQgdmFyaWFibGUgXFxcIlwiICsgdmFyaWFibGVJZCArIFwiXFxcIiB3YXMgbm90IHByb3ZpZGVkIHRvIHRoZSBzdHJpbmcgXFxcIlwiICsgb3JpZ2luYWxNZXNzYWdlICsgXCJcXFwiXCIsIFwiTUlTU0lOR19WQUxVRVwiIC8qIE1JU1NJTkdfVkFMVUUgKi8sIG9yaWdpbmFsTWVzc2FnZSkgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIE1pc3NpbmdWYWx1ZUVycm9yO1xufShGb3JtYXRFcnJvcikpO1xuZXhwb3J0cy5NaXNzaW5nVmFsdWVFcnJvciA9IE1pc3NpbmdWYWx1ZUVycm9yO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmZvcm1hdFRvUGFydHMgPSBleHBvcnRzLmlzRm9ybWF0WE1MRWxlbWVudEZuID0gZXhwb3J0cy5QQVJUX1RZUEUgPSB2b2lkIDA7XG52YXIgaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xID0gcmVxdWlyZShcImludGwtbWVzc2FnZWZvcm1hdC1wYXJzZXJcIik7XG52YXIgZXJyb3JfMSA9IHJlcXVpcmUoXCIuL2Vycm9yXCIpO1xudmFyIFBBUlRfVFlQRTtcbihmdW5jdGlvbiAoUEFSVF9UWVBFKSB7XG4gICAgUEFSVF9UWVBFW1BBUlRfVFlQRVtcImxpdGVyYWxcIl0gPSAwXSA9IFwibGl0ZXJhbFwiO1xuICAgIFBBUlRfVFlQRVtQQVJUX1RZUEVbXCJvYmplY3RcIl0gPSAxXSA9IFwib2JqZWN0XCI7XG59KShQQVJUX1RZUEUgPSBleHBvcnRzLlBBUlRfVFlQRSB8fCAoZXhwb3J0cy5QQVJUX1RZUEUgPSB7fSkpO1xuZnVuY3Rpb24gbWVyZ2VMaXRlcmFsKHBhcnRzKSB7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRzO1xuICAgIH1cbiAgICByZXR1cm4gcGFydHMucmVkdWNlKGZ1bmN0aW9uIChhbGwsIHBhcnQpIHtcbiAgICAgICAgdmFyIGxhc3RQYXJ0ID0gYWxsW2FsbC5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKCFsYXN0UGFydCB8fFxuICAgICAgICAgICAgbGFzdFBhcnQudHlwZSAhPT0gMCAvKiBsaXRlcmFsICovIHx8XG4gICAgICAgICAgICBwYXJ0LnR5cGUgIT09IDAgLyogbGl0ZXJhbCAqLykge1xuICAgICAgICAgICAgYWxsLnB1c2gocGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsYXN0UGFydC52YWx1ZSArPSBwYXJ0LnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGw7XG4gICAgfSwgW10pO1xufVxuZnVuY3Rpb24gaXNGb3JtYXRYTUxFbGVtZW50Rm4oZWwpIHtcbiAgICByZXR1cm4gdHlwZW9mIGVsID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Zvcm1hdFhNTEVsZW1lbnRGbiA9IGlzRm9ybWF0WE1MRWxlbWVudEZuO1xuLy8gVE9ETyhza2VsZXRvbik6IGFkZCBza2VsZXRvbiBzdXBwb3J0XG5mdW5jdGlvbiBmb3JtYXRUb1BhcnRzKGVscywgbG9jYWxlcywgZm9ybWF0dGVycywgZm9ybWF0cywgdmFsdWVzLCBjdXJyZW50UGx1cmFsVmFsdWUsIFxuLy8gRm9yIGRlYnVnZ2luZ1xub3JpZ2luYWxNZXNzYWdlKSB7XG4gICAgLy8gSG90IHBhdGggZm9yIHN0cmFpZ2h0IHNpbXBsZSBtc2cgdHJhbnNsYXRpb25zXG4gICAgaWYgKGVscy5sZW5ndGggPT09IDEgJiYgaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xLmlzTGl0ZXJhbEVsZW1lbnQoZWxzWzBdKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IDAgLyogbGl0ZXJhbCAqLyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogZWxzWzBdLnZhbHVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMCwgZWxzXzEgPSBlbHM7IF9pIDwgZWxzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBlbCA9IGVsc18xW19pXTtcbiAgICAgICAgLy8gRXhpdCBlYXJseSBmb3Igc3RyaW5nIHBhcnRzLlxuICAgICAgICBpZiAoaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xLmlzTGl0ZXJhbEVsZW1lbnQoZWwpKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogMCAvKiBsaXRlcmFsICovLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbC52YWx1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogc2hvdWxkIHRoaXMgcGFydCBiZSBsaXRlcmFsIHR5cGU/XG4gICAgICAgIC8vIFJlcGxhY2UgYCNgIGluIHBsdXJhbCBydWxlcyB3aXRoIHRoZSBhY3R1YWwgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgaWYgKGludGxfbWVzc2FnZWZvcm1hdF9wYXJzZXJfMS5pc1BvdW5kRWxlbWVudChlbCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudFBsdXJhbFZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogMCAvKiBsaXRlcmFsICovLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZm9ybWF0dGVycy5nZXROdW1iZXJGb3JtYXQobG9jYWxlcykuZm9ybWF0KGN1cnJlbnRQbHVyYWxWYWx1ZSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmFyTmFtZSA9IGVsLnZhbHVlO1xuICAgICAgICAvLyBFbmZvcmNlIHRoYXQgYWxsIHJlcXVpcmVkIHZhbHVlcyBhcmUgcHJvdmlkZWQgYnkgdGhlIGNhbGxlci5cbiAgICAgICAgaWYgKCEodmFsdWVzICYmIHZhck5hbWUgaW4gdmFsdWVzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IGVycm9yXzEuTWlzc2luZ1ZhbHVlRXJyb3IodmFyTmFtZSwgb3JpZ2luYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbdmFyTmFtZV07XG4gICAgICAgIGlmIChpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEuaXNBcmd1bWVudEVsZW1lbnQoZWwpKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHZhbHVlID1cbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFN0cmluZyh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IDAgLyogbGl0ZXJhbCAqLyA6IDEgLyogb2JqZWN0ICovLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgZm9ybWF0IHBsdXJhbCBhbmQgc2VsZWN0IHBhcnRzJyBvcHRpb24g4oCUIHdoaWNoIGNhbiBiZSBhXG4gICAgICAgIC8vIG5lc3RlZCBwYXR0ZXJuIHN0cnVjdHVyZS4gVGhlIGNob29zaW5nIG9mIHRoZSBvcHRpb24gdG8gdXNlIGlzXG4gICAgICAgIC8vIGFic3RyYWN0ZWQtYnkgYW5kIGRlbGVnYXRlZC10byB0aGUgcGFydCBoZWxwZXIgb2JqZWN0LlxuICAgICAgICBpZiAoaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xLmlzRGF0ZUVsZW1lbnQoZWwpKSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB0eXBlb2YgZWwuc3R5bGUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgPyBmb3JtYXRzLmRhdGVbZWwuc3R5bGVdXG4gICAgICAgICAgICAgICAgOiBpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEuaXNEYXRlVGltZVNrZWxldG9uKGVsLnN0eWxlKVxuICAgICAgICAgICAgICAgICAgICA/IGVsLnN0eWxlLnBhcnNlZE9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogMCAvKiBsaXRlcmFsICovLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBmb3JtYXR0ZXJzXG4gICAgICAgICAgICAgICAgICAgIC5nZXREYXRlVGltZUZvcm1hdChsb2NhbGVzLCBzdHlsZSlcbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdCh2YWx1ZSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEuaXNUaW1lRWxlbWVudChlbCkpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHR5cGVvZiBlbC5zdHlsZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGZvcm1hdHMudGltZVtlbC5zdHlsZV1cbiAgICAgICAgICAgICAgICA6IGludGxfbWVzc2FnZWZvcm1hdF9wYXJzZXJfMS5pc0RhdGVUaW1lU2tlbGV0b24oZWwuc3R5bGUpXG4gICAgICAgICAgICAgICAgICAgID8gZWwuc3R5bGUucGFyc2VkT3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAwIC8qIGxpdGVyYWwgKi8sXG4gICAgICAgICAgICAgICAgdmFsdWU6IGZvcm1hdHRlcnNcbiAgICAgICAgICAgICAgICAgICAgLmdldERhdGVUaW1lRm9ybWF0KGxvY2FsZXMsIHN0eWxlKVxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0KHZhbHVlKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludGxfbWVzc2FnZWZvcm1hdF9wYXJzZXJfMS5pc051bWJlckVsZW1lbnQoZWwpKSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB0eXBlb2YgZWwuc3R5bGUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgPyBmb3JtYXRzLm51bWJlcltlbC5zdHlsZV1cbiAgICAgICAgICAgICAgICA6IGludGxfbWVzc2FnZWZvcm1hdF9wYXJzZXJfMS5pc051bWJlclNrZWxldG9uKGVsLnN0eWxlKVxuICAgICAgICAgICAgICAgICAgICA/IGVsLnN0eWxlLnBhcnNlZE9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogMCAvKiBsaXRlcmFsICovLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBmb3JtYXR0ZXJzXG4gICAgICAgICAgICAgICAgICAgIC5nZXROdW1iZXJGb3JtYXQobG9jYWxlcywgc3R5bGUpXG4gICAgICAgICAgICAgICAgICAgIC5mb3JtYXQodmFsdWUpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW50bF9tZXNzYWdlZm9ybWF0X3BhcnNlcl8xLmlzVGFnRWxlbWVudChlbCkpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGVsLmNoaWxkcmVuLCB2YWx1ZV8xID0gZWwudmFsdWU7XG4gICAgICAgICAgICB2YXIgZm9ybWF0Rm4gPSB2YWx1ZXNbdmFsdWVfMV07XG4gICAgICAgICAgICBpZiAoIWlzRm9ybWF0WE1MRWxlbWVudEZuKGZvcm1hdEZuKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcl8xLkludmFsaWRWYWx1ZVR5cGVFcnJvcih2YWx1ZV8xLCAnZnVuY3Rpb24nLCBvcmlnaW5hbE1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBhcnRzID0gZm9ybWF0VG9QYXJ0cyhjaGlsZHJlbiwgbG9jYWxlcywgZm9ybWF0dGVycywgZm9ybWF0cywgdmFsdWVzLCBjdXJyZW50UGx1cmFsVmFsdWUpO1xuICAgICAgICAgICAgdmFyIGNodW5rcyA9IGZvcm1hdEZuKHBhcnRzLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcC52YWx1ZTsgfSkpO1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNodW5rcykpIHtcbiAgICAgICAgICAgICAgICBjaHVua3MgPSBbY2h1bmtzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgY2h1bmtzLm1hcChmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVvZiBjID09PSAnc3RyaW5nJyA/IDAgLyogbGl0ZXJhbCAqLyA6IDEgLyogb2JqZWN0ICovLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEuaXNTZWxlY3RFbGVtZW50KGVsKSkge1xuICAgICAgICAgICAgdmFyIG9wdCA9IGVsLm9wdGlvbnNbdmFsdWVdIHx8IGVsLm9wdGlvbnMub3RoZXI7XG4gICAgICAgICAgICBpZiAoIW9wdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcl8xLkludmFsaWRWYWx1ZUVycm9yKGVsLnZhbHVlLCB2YWx1ZSwgT2JqZWN0LmtleXMoZWwub3B0aW9ucyksIG9yaWdpbmFsTWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZvcm1hdFRvUGFydHMob3B0LnZhbHVlLCBsb2NhbGVzLCBmb3JtYXR0ZXJzLCBmb3JtYXRzLCB2YWx1ZXMpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnRsX21lc3NhZ2Vmb3JtYXRfcGFyc2VyXzEuaXNQbHVyYWxFbGVtZW50KGVsKSkge1xuICAgICAgICAgICAgdmFyIG9wdCA9IGVsLm9wdGlvbnNbXCI9XCIgKyB2YWx1ZV07XG4gICAgICAgICAgICBpZiAoIW9wdCkge1xuICAgICAgICAgICAgICAgIGlmICghSW50bC5QbHVyYWxSdWxlcykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JfMS5Gb3JtYXRFcnJvcihcIkludGwuUGx1cmFsUnVsZXMgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50LlxcblRyeSBwb2x5ZmlsbGluZyBpdCB1c2luZyBcXFwiQGZvcm1hdGpzL2ludGwtcGx1cmFscnVsZXNcXFwiXFxuXCIsIFwiTUlTU0lOR19JTlRMX0FQSVwiIC8qIE1JU1NJTkdfSU5UTF9BUEkgKi8sIG9yaWdpbmFsTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBydWxlID0gZm9ybWF0dGVyc1xuICAgICAgICAgICAgICAgICAgICAuZ2V0UGx1cmFsUnVsZXMobG9jYWxlcywgeyB0eXBlOiBlbC5wbHVyYWxUeXBlIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3QodmFsdWUgLSAoZWwub2Zmc2V0IHx8IDApKTtcbiAgICAgICAgICAgICAgICBvcHQgPSBlbC5vcHRpb25zW3J1bGVdIHx8IGVsLm9wdGlvbnMub3RoZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9wdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcl8xLkludmFsaWRWYWx1ZUVycm9yKGVsLnZhbHVlLCB2YWx1ZSwgT2JqZWN0LmtleXMoZWwub3B0aW9ucyksIG9yaWdpbmFsTWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZvcm1hdFRvUGFydHMob3B0LnZhbHVlLCBsb2NhbGVzLCBmb3JtYXR0ZXJzLCBmb3JtYXRzLCB2YWx1ZXMsIHZhbHVlIC0gKGVsLm9mZnNldCB8fCAwKSkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlTGl0ZXJhbChyZXN1bHQpO1xufVxuZXhwb3J0cy5mb3JtYXRUb1BhcnRzID0gZm9ybWF0VG9QYXJ0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLypcbkNvcHlyaWdodCAoYykgMjAxNCwgWWFob28hIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbkNvcHlyaWdodHMgbGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgTGljZW5zZS5cblNlZSB0aGUgYWNjb21wYW55aW5nIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMuXG4qL1xuZnVuY3Rpb24gZGF5c1RvWWVhcnMoZGF5cykge1xuICAgIC8vIDQwMCB5ZWFycyBoYXZlIDE0NjA5NyBkYXlzICh0YWtpbmcgaW50byBhY2NvdW50IGxlYXAgeWVhciBydWxlcylcbiAgICByZXR1cm4gKGRheXMgKiA0MDApIC8gMTQ2MDk3O1xufVxuLy8gVGhhbmtzIHRvIGRhdGUtZm5zXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGF0ZS1mbnMvZGF0ZS1mbnNcbi8vIE1JVCDCqSBTYXNoYSBLb3NzXG52YXIgTUlMTElTRUNPTkRTX0lOX01JTlVURSA9IDYwMDAwO1xudmFyIE1JTExJU0VDT05EU19JTl9EQVkgPSA4NjQwMDAwMDtcbmZ1bmN0aW9uIHN0YXJ0T2ZEYXkoZGlydHlEYXRlKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShkaXJ0eURhdGUpO1xuICAgIGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgcmV0dXJuIGRhdGU7XG59XG5mdW5jdGlvbiBkaWZmZXJlbmNlSW5DYWxlbmRhckRheXMoZGlydHlEYXRlTGVmdCwgZGlydHlEYXRlUmlnaHQpIHtcbiAgICB2YXIgc3RhcnRPZkRheUxlZnQgPSBzdGFydE9mRGF5KGRpcnR5RGF0ZUxlZnQpO1xuICAgIHZhciBzdGFydE9mRGF5UmlnaHQgPSBzdGFydE9mRGF5KGRpcnR5RGF0ZVJpZ2h0KTtcbiAgICB2YXIgdGltZXN0YW1wTGVmdCA9IHN0YXJ0T2ZEYXlMZWZ0LmdldFRpbWUoKSAtXG4gICAgICAgIHN0YXJ0T2ZEYXlMZWZ0LmdldFRpbWV6b25lT2Zmc2V0KCkgKiBNSUxMSVNFQ09ORFNfSU5fTUlOVVRFO1xuICAgIHZhciB0aW1lc3RhbXBSaWdodCA9IHN0YXJ0T2ZEYXlSaWdodC5nZXRUaW1lKCkgLVxuICAgICAgICBzdGFydE9mRGF5UmlnaHQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIE1JTExJU0VDT05EU19JTl9NSU5VVEU7XG4gICAgLy8gUm91bmQgdGhlIG51bWJlciBvZiBkYXlzIHRvIHRoZSBuZWFyZXN0IGludGVnZXJcbiAgICAvLyBiZWNhdXNlIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGEgZGF5IGlzIG5vdCBjb25zdGFudFxuICAgIC8vIChlLmcuIGl0J3MgZGlmZmVyZW50IGluIHRoZSBkYXkgb2YgdGhlIGRheWxpZ2h0IHNhdmluZyB0aW1lIGNsb2NrIHNoaWZ0KVxuICAgIHJldHVybiBNYXRoLnJvdW5kKCh0aW1lc3RhbXBMZWZ0IC0gdGltZXN0YW1wUmlnaHQpIC8gTUlMTElTRUNPTkRTX0lOX0RBWSk7XG59XG5mdW5jdGlvbiBkaWZmKGZyb20sIHRvKSB7XG4gICAgLy8gQ29udmVydCB0byBtcyB0aW1lc3RhbXBzLlxuICAgIGZyb20gPSArZnJvbTtcbiAgICB0byA9ICt0bztcbiAgICB2YXIgbWlsbGlzZWNvbmQgPSBNYXRoLnJvdW5kKHRvIC0gZnJvbSksIHNlY29uZCA9IE1hdGgucm91bmQobWlsbGlzZWNvbmQgLyAxMDAwKSwgbWludXRlID0gTWF0aC5yb3VuZChzZWNvbmQgLyA2MCksIGhvdXIgPSBNYXRoLnJvdW5kKG1pbnV0ZSAvIDYwKTtcbiAgICAvLyBXZSBleHBlY3QgYSBtb3JlIHByZWNpc2lvbiBpbiByb3VuZGluZyB3aGVuIGRlYWxpbmcgd2l0aFxuICAgIC8vIGRheXMgYXMgaXQgZmVlbHMgd3Jvbmcgd2hlbiBzb21ldGhpbmcgaGFwcGVuZGVkIDEzIGhvdXJzIGFnbyBhbmRcbiAgICAvLyBpcyByZWdhcmRlZCBhcyBcInllc3RlcmRheVwiIGV2ZW4gaWYgdGhlIHRpbWUgd2FzIHRoaXMgbW9ybmluZy5cbiAgICB2YXIgZGF5ID0gZGlmZmVyZW5jZUluQ2FsZW5kYXJEYXlzKHRvLCBmcm9tKTtcbiAgICB2YXIgd2VlayA9IE1hdGgucm91bmQoZGF5IC8gNyk7XG4gICAgdmFyIHJhd1llYXJzID0gZGF5c1RvWWVhcnMoZGF5KSwgbW9udGggPSBNYXRoLnJvdW5kKHJhd1llYXJzICogMTIpLCB5ZWFyID0gTWF0aC5yb3VuZChyYXdZZWFycyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2Vjb25kOiBzZWNvbmQsXG4gICAgICAgICdzZWNvbmQtc2hvcnQnOiBzZWNvbmQsXG4gICAgICAgICdzZWNvbmQtbmFycm93Jzogc2Vjb25kLFxuICAgICAgICBtaW51dGU6IG1pbnV0ZSxcbiAgICAgICAgJ21pbnV0ZS1zaG9ydCc6IG1pbnV0ZSxcbiAgICAgICAgJ21pbnV0ZS1uYXJyb3cnOiBtaW51dGUsXG4gICAgICAgIGhvdXI6IGhvdXIsXG4gICAgICAgICdob3VyLXNob3J0JzogaG91cixcbiAgICAgICAgJ2hvdXItbmFycm93JzogaG91cixcbiAgICAgICAgZGF5OiBkYXksXG4gICAgICAgICdkYXktc2hvcnQnOiBkYXksXG4gICAgICAgICdkYXktbmFycm93JzogZGF5LFxuICAgICAgICB3ZWVrOiB3ZWVrLFxuICAgICAgICAnd2Vlay1zaG9ydCc6IHdlZWssXG4gICAgICAgICd3ZWVrLW5hcnJvdyc6IHdlZWssXG4gICAgICAgIG1vbnRoOiBtb250aCxcbiAgICAgICAgJ21vbnRoLXNob3J0JzogbW9udGgsXG4gICAgICAgICdtb250aC1uYXJyb3cnOiBtb250aCxcbiAgICAgICAgeWVhcjogeWVhcixcbiAgICAgICAgJ3llYXItc2hvcnQnOiB5ZWFyLFxuICAgICAgICAneWVhci1uYXJyb3cnOiB5ZWFyXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IGRpZmY7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kaWZmLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuLypcbkNvcHlyaWdodCAoYykgMjAxNCwgWWFob28hIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbkNvcHlyaWdodHMgbGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgTGljZW5zZS5cblNlZSB0aGUgYWNjb21wYW55aW5nIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMuXG4qL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRpZmZfMSA9IHJlcXVpcmUoXCIuL2RpZmZcIik7XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudmFyIFNVUFBPUlRFRF9GSUVMRFMgPSBbXG4gICAgXCJzZWNvbmRcIiAvKiBzZWNvbmQgKi8sXG4gICAgXCJzZWNvbmQtc2hvcnRcIiAvKiBzZWNvbmRTaG9ydCAqLyxcbiAgICBcIm1pbnV0ZVwiIC8qIG1pbnV0ZSAqLyxcbiAgICBcIm1pbnV0ZS1zaG9ydFwiIC8qIG1pbnV0ZVNob3J0ICovLFxuICAgIFwiaG91clwiIC8qIGhvdXIgKi8sXG4gICAgXCJob3VyLXNob3J0XCIgLyogaG91clNob3J0ICovLFxuICAgIFwiZGF5XCIgLyogZGF5ICovLFxuICAgIFwiZGF5LXNob3J0XCIgLyogZGF5U2hvcnQgKi8sXG4gICAgXCJtb250aFwiIC8qIG1vbnRoICovLFxuICAgIFwibW9udGgtc2hvcnRcIiAvKiBtb250aFNob3J0ICovLFxuICAgIFwieWVhclwiIC8qIHllYXIgKi8sXG4gICAgXCJ5ZWFyLXNob3J0XCIgLyogeWVhclNob3J0ICovXG5dO1xuZnVuY3Rpb24gaXNWYWxpZFVuaXRzKHVuaXRzKSB7XG4gICAgaWYgKCF1bml0cyB8fCB+U1VQUE9SVEVEX0ZJRUxEUy5pbmRleE9mKHVuaXRzKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB1bml0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHN1Z2dlc3Rpb24gPSAvcyQvLnRlc3QodW5pdHMpICYmIHVuaXRzLnN1YnN0cigwLCB1bml0cy5sZW5ndGggLSAxKTtcbiAgICAgICAgaWYgKHN1Z2dlc3Rpb24gJiZcbiAgICAgICAgICAgIH5TVVBQT1JURURfRklFTERTLmluZGV4T2Yoc3VnZ2VzdGlvbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJcIiArIHVuaXRzICsgXCJcXFwiIGlzIG5vdCBhIHZhbGlkIEludGxSZWxhdGl2ZUZvcm1hdCAndW5pdHMnIHZhbHVlLCBkaWQgeW91IG1lYW46IFwiICsgc3VnZ2VzdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIlwiICsgdW5pdHMgKyBcIlxcXCIgaXMgbm90IGEgdmFsaWQgSW50bFJlbGF0aXZlRm9ybWF0ICd1bml0cycgdmFsdWUsIGl0IG11c3QgYmUgb25lIG9mOiBcIiArIFNVUFBPUlRFRF9GSUVMRFMuam9pbignXCIsIFwiJykpO1xufVxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlKHN0eWxlKSB7XG4gICAgLy8gRGVmYXVsdCB0byBcImJlc3QgZml0XCIgc3R5bGUuXG4gICAgaWYgKCFzdHlsZSkge1xuICAgICAgICByZXR1cm4gXCJiZXN0IGZpdFwiIC8qIGJlc3RGaXQgKi87XG4gICAgfVxuICAgIGlmIChzdHlsZSA9PT0gJ2Jlc3QgZml0JyB8fCBzdHlsZSA9PT0gJ251bWVyaWMnKSB7XG4gICAgICAgIHJldHVybiBzdHlsZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIlwiICsgc3R5bGUgKyBcIlxcXCIgaXMgbm90IGEgdmFsaWQgSW50bFJlbGF0aXZlRm9ybWF0ICdzdHlsZScgdmFsdWUsIGl0IG11c3QgYmUgb25lIG9mOiAnYmVzdCBmaXQnIG9yICdudW1lcmljJ1wiKTtcbn1cbmZ1bmN0aW9uIHNlbGVjdFVuaXRzKGRpZmZSZXBvcnQpIHtcbiAgICB2YXIgZmllbGRzID0gU1VQUE9SVEVEX0ZJRUxEUy5maWx0ZXIoZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBmaWVsZC5pbmRleE9mKCctc2hvcnQnKSA8IDE7XG4gICAgfSk7XG4gICAgdmFyIHVuaXRzID0gZmllbGRzWzBdO1xuICAgIGZvciAodmFyIF9pID0gMCwgZmllbGRzXzEgPSBmaWVsZHM7IF9pIDwgZmllbGRzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHVuaXRzID0gZmllbGRzXzFbX2ldO1xuICAgICAgICBpZiAoTWF0aC5hYnMoZGlmZlJlcG9ydFt1bml0c10pIDwgUmVsYXRpdmVGb3JtYXQudGhyZXNob2xkc1t1bml0c10pIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bml0cztcbn1cbnZhciBSZWxhdGl2ZUZvcm1hdCA9IChmdW5jdGlvbiAobG9jYWxlcywgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgdmFyIHJlc29sdmVkT3B0aW9ucyA9IHtcbiAgICAgICAgc3R5bGU6IHJlc29sdmVTdHlsZShvcHRpb25zLnN0eWxlKSxcbiAgICAgICAgdW5pdHM6IGlzVmFsaWRVbml0cyhvcHRpb25zLnVuaXRzKSAmJiBvcHRpb25zLnVuaXRzXG4gICAgfTtcbiAgICB2YXIgbnVtZXJpYyA9IHJlc29sdmVkT3B0aW9ucy5zdHlsZSA9PT0gJ2Jlc3QgZml0JyA/ICdhdXRvJyA6ICdhbHdheXMnO1xuICAgIHZhciBydGYgPSBuZXcgSW50bC5SZWxhdGl2ZVRpbWVGb3JtYXQobG9jYWxlcywge1xuICAgICAgICBudW1lcmljOiBudW1lcmljXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAoZGF0ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG5vdyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5ub3cgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5ub3cgPT09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgICAgIDogb3B0aW9ucy5ub3dcbiAgICAgICAgICAgICAgICA6IERhdGUubm93KCk7XG4gICAgICAgICAgICBpZiAoZGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZGF0ZSA9IG5vdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIERldGVybWluZSBpZiB0aGUgYGRhdGVgIGFuZCBvcHRpb25hbCBgbm93YCB2YWx1ZXMgYXJlIHZhbGlkLCBhbmQgdGhyb3cgYVxuICAgICAgICAgICAgLy8gc2ltaWxhciBlcnJvciB0byB3aGF0IGBJbnRsLkRhdGVUaW1lRm9ybWF0I2Zvcm1hdCgpYCB3b3VsZCB0aHJvdy5cbiAgICAgICAgICAgIGlmICghaXNGaW5pdGUobm93KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgYG5vd2Agb3B0aW9uIHByb3ZpZGVkIHRvIEludGxSZWxhdGl2ZUZvcm1hdCNmb3JtYXQoKSBpcyBub3QgJyArXG4gICAgICAgICAgICAgICAgICAgICdpbiB2YWxpZCByYW5nZS4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNGaW5pdGUoZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIGRhdGUgdmFsdWUgcHJvdmlkZWQgdG8gSW50bFJlbGF0aXZlRm9ybWF0I2Zvcm1hdCgpIGlzIG5vdCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2luIHZhbGlkIHJhbmdlLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRpZmZSZXBvcnQgPSBkaWZmXzEuZGVmYXVsdChub3csIGRhdGUpO1xuICAgICAgICAgICAgdmFyIHVuaXRzID0gcmVzb2x2ZWRPcHRpb25zLnVuaXRzIHx8IHNlbGVjdFVuaXRzKGRpZmZSZXBvcnQpO1xuICAgICAgICAgICAgdmFyIGRpZmZJblVuaXRzID0gZGlmZlJlcG9ydFt1bml0c107XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB1bml0cy5zdWJzdHJpbmcodW5pdHMubGVuZ3RoIC0gNiwgdW5pdHMubGVuZ3RoKSA9PT0gJy1zaG9ydCdcbiAgICAgICAgICAgICAgICA/ICduYXJyb3cnXG4gICAgICAgICAgICAgICAgOiAnbG9uZyc7XG4gICAgICAgICAgICB2YXIgcnRmVW5pdCA9IHVuaXRzLnJlcGxhY2UoJy1zaG9ydCcsICcnKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSW50bC5SZWxhdGl2ZVRpbWVGb3JtYXQobG9jYWxlcywge1xuICAgICAgICAgICAgICAgIG51bWVyaWM6IG51bWVyaWMsXG4gICAgICAgICAgICAgICAgc3R5bGU6IHN0eWxlXG4gICAgICAgICAgICB9KS5mb3JtYXQoZGlmZkluVW5pdHMsIHJ0ZlVuaXQpO1xuICAgICAgICB9LFxuICAgICAgICByZXNvbHZlZE9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbG9jYWxlOiBydGYucmVzb2x2ZWRPcHRpb25zKCkubG9jYWxlLFxuICAgICAgICAgICAgICAgIHN0eWxlOiByZXNvbHZlZE9wdGlvbnMuc3R5bGUsXG4gICAgICAgICAgICAgICAgdW5pdHM6IHJlc29sdmVkT3B0aW9ucy51bml0c1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcbi8vIERlZmluZSBwdWJsaWMgYGRlZmF1bHRMb2NhbGVgIHByb3BlcnR5IHdoaWNoIGNhbiBiZSBzZXQgYnkgdGhlIGRldmVsb3Blciwgb3Jcbi8vIGl0IHdpbGwgYmUgc2V0IHdoZW4gdGhlIGZpcnN0IFJlbGF0aXZlRm9ybWF0IGluc3RhbmNlIGlzIGNyZWF0ZWQgYnlcbi8vIGxldmVyYWdpbmcgdGhlIHJlc29sdmVkIGxvY2FsZSBmcm9tIGBJbnRsYC5cblJlbGF0aXZlRm9ybWF0LmRlZmF1bHRMb2NhbGUgPSAnZW4nO1xuUmVsYXRpdmVGb3JtYXQudGhyZXNob2xkcyA9IHtcbiAgICBzZWNvbmQ6IDQ1LFxuICAgICdzZWNvbmQtc2hvcnQnOiA0NSxcbiAgICBtaW51dGU6IDQ1LFxuICAgICdtaW51dGUtc2hvcnQnOiA0NSxcbiAgICBob3VyOiAyMixcbiAgICAnaG91ci1zaG9ydCc6IDIyLFxuICAgIGRheTogMjYsXG4gICAgJ2RheS1zaG9ydCc6IDI2LFxuICAgIG1vbnRoOiAxMSxcbiAgICAnbW9udGgtc2hvcnQnOiAxMSAvLyBtb250aHMgdG8geWVhclxufTtcbmV4cG9ydHMuZGVmYXVsdCA9IFJlbGF0aXZlRm9ybWF0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiLyoganNoaW50IG5vZGU6dHJ1ZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBJbnRsUmVsYXRpdmVGb3JtYXQgPSByZXF1aXJlKCcuL2Rpc3QnKS5kZWZhdWx0O1xuXG4vLyBSZS1leHBvcnQgYEludGxSZWxhdGl2ZUZvcm1hdGAgYXMgdGhlIENvbW1vbkpTIGRlZmF1bHQgZXhwb3J0cyB3aXRoIGFsbCB0aGVcbi8vIGxvY2FsZSBkYXRhIHJlZ2lzdGVyZWQsIGFuZCB3aXRoIEVuZ2xpc2ggc2V0IGFzIHRoZSBkZWZhdWx0IGxvY2FsZS4gRGVmaW5lXG4vLyB0aGUgYGRlZmF1bHRgIHByb3AgZm9yIHVzZSB3aXRoIG90aGVyIGNvbXBpbGVkIEVTNiBNb2R1bGVzLlxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gSW50bFJlbGF0aXZlRm9ybWF0O1xuZXhwb3J0c1snZGVmYXVsdCddID0gZXhwb3J0cztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSAxMTtcblxuZnVuY3Rpb24gbW9ycGhBdHRycyhmcm9tTm9kZSwgdG9Ob2RlKSB7XG4gICAgdmFyIHRvTm9kZUF0dHJzID0gdG9Ob2RlLmF0dHJpYnV0ZXM7XG4gICAgdmFyIGF0dHI7XG4gICAgdmFyIGF0dHJOYW1lO1xuICAgIHZhciBhdHRyTmFtZXNwYWNlVVJJO1xuICAgIHZhciBhdHRyVmFsdWU7XG4gICAgdmFyIGZyb21WYWx1ZTtcblxuICAgIC8vIGRvY3VtZW50LWZyYWdtZW50cyBkb250IGhhdmUgYXR0cmlidXRlcyBzbyBsZXRzIG5vdCBkbyBhbnl0aGluZ1xuICAgIGlmICh0b05vZGUubm9kZVR5cGUgPT09IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgfHwgZnJvbU5vZGUubm9kZVR5cGUgPT09IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgYXR0cmlidXRlcyBvbiBvcmlnaW5hbCBET00gZWxlbWVudFxuICAgIGZvciAodmFyIGkgPSB0b05vZGVBdHRycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhdHRyID0gdG9Ob2RlQXR0cnNbaV07XG4gICAgICAgIGF0dHJOYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICBhdHRyTmFtZXNwYWNlVVJJID0gYXR0ci5uYW1lc3BhY2VVUkk7XG4gICAgICAgIGF0dHJWYWx1ZSA9IGF0dHIudmFsdWU7XG5cbiAgICAgICAgaWYgKGF0dHJOYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIGF0dHJOYW1lID0gYXR0ci5sb2NhbE5hbWUgfHwgYXR0ck5hbWU7XG4gICAgICAgICAgICBmcm9tVmFsdWUgPSBmcm9tTm9kZS5nZXRBdHRyaWJ1dGVOUyhhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChmcm9tVmFsdWUgIT09IGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChhdHRyLnByZWZpeCA9PT0gJ3htbG5zJyl7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJOYW1lID0gYXR0ci5uYW1lOyAvLyBJdCdzIG5vdCBhbGxvd2VkIHRvIHNldCBhbiBhdHRyaWJ1dGUgd2l0aCB0aGUgWE1MTlMgbmFtZXNwYWNlIHdpdGhvdXQgc3BlY2lmeWluZyB0aGUgYHhtbG5zYCBwcmVmaXhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnJvbU5vZGUuc2V0QXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUsIGF0dHJWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcm9tVmFsdWUgPSBmcm9tTm9kZS5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuXG4gICAgICAgICAgICBpZiAoZnJvbVZhbHVlICE9PSBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBmcm9tTm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYW55IGV4dHJhIGF0dHJpYnV0ZXMgZm91bmQgb24gdGhlIG9yaWdpbmFsIERPTSBlbGVtZW50IHRoYXRcbiAgICAvLyB3ZXJlbid0IGZvdW5kIG9uIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICB2YXIgZnJvbU5vZGVBdHRycyA9IGZyb21Ob2RlLmF0dHJpYnV0ZXM7XG5cbiAgICBmb3IgKHZhciBkID0gZnJvbU5vZGVBdHRycy5sZW5ndGggLSAxOyBkID49IDA7IGQtLSkge1xuICAgICAgICBhdHRyID0gZnJvbU5vZGVBdHRyc1tkXTtcbiAgICAgICAgYXR0ck5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgIGF0dHJOYW1lc3BhY2VVUkkgPSBhdHRyLm5hbWVzcGFjZVVSSTtcblxuICAgICAgICBpZiAoYXR0ck5hbWVzcGFjZVVSSSkge1xuICAgICAgICAgICAgYXR0ck5hbWUgPSBhdHRyLmxvY2FsTmFtZSB8fCBhdHRyTmFtZTtcblxuICAgICAgICAgICAgaWYgKCF0b05vZGUuaGFzQXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgZnJvbU5vZGUucmVtb3ZlQXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF0b05vZGUuaGFzQXR0cmlidXRlKGF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgIGZyb21Ob2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciByYW5nZTsgLy8gQ3JlYXRlIGEgcmFuZ2Ugb2JqZWN0IGZvciBlZmZpY2VudGx5IHJlbmRlcmluZyBzdHJpbmdzIHRvIGVsZW1lbnRzLlxudmFyIE5TX1hIVE1MID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnO1xuXG52YXIgZG9jID0gdHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IGRvY3VtZW50O1xudmFyIEhBU19URU1QTEFURV9TVVBQT1JUID0gISFkb2MgJiYgJ2NvbnRlbnQnIGluIGRvYy5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xudmFyIEhBU19SQU5HRV9TVVBQT1JUID0gISFkb2MgJiYgZG9jLmNyZWF0ZVJhbmdlICYmICdjcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQnIGluIGRvYy5jcmVhdGVSYW5nZSgpO1xuXG5mdW5jdGlvbiBjcmVhdGVGcmFnbWVudEZyb21UZW1wbGF0ZShzdHIpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2MuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBzdHI7XG4gICAgcmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQuY2hpbGROb2Rlc1swXTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnRGcm9tUmFuZ2Uoc3RyKSB7XG4gICAgaWYgKCFyYW5nZSkge1xuICAgICAgICByYW5nZSA9IGRvYy5jcmVhdGVSYW5nZSgpO1xuICAgICAgICByYW5nZS5zZWxlY3ROb2RlKGRvYy5ib2R5KTtcbiAgICB9XG5cbiAgICB2YXIgZnJhZ21lbnQgPSByYW5nZS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQoc3RyKTtcbiAgICByZXR1cm4gZnJhZ21lbnQuY2hpbGROb2Rlc1swXTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnRGcm9tV3JhcChzdHIpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuICAgIGZyYWdtZW50LmlubmVySFRNTCA9IHN0cjtcbiAgICByZXR1cm4gZnJhZ21lbnQuY2hpbGROb2Rlc1swXTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGFib3V0IHRoZSBzYW1lXG4gKiB2YXIgaHRtbCA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoc3RyLCAndGV4dC9odG1sJyk7XG4gKiByZXR1cm4gaHRtbC5ib2R5LmZpcnN0Q2hpbGQ7XG4gKlxuICogQG1ldGhvZCB0b0VsZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqL1xuZnVuY3Rpb24gdG9FbGVtZW50KHN0cikge1xuICAgIHN0ciA9IHN0ci50cmltKCk7XG4gICAgaWYgKEhBU19URU1QTEFURV9TVVBQT1JUKSB7XG4gICAgICAvLyBhdm9pZCByZXN0cmljdGlvbnMgb24gY29udGVudCBmb3IgdGhpbmdzIGxpa2UgYDx0cj48dGg+SGk8L3RoPjwvdHI+YCB3aGljaFxuICAgICAgLy8gY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50IGRvZXNuJ3Qgc3VwcG9ydFxuICAgICAgLy8gPHRlbXBsYXRlPiBzdXBwb3J0IG5vdCBhdmFpbGFibGUgaW4gSUVcbiAgICAgIHJldHVybiBjcmVhdGVGcmFnbWVudEZyb21UZW1wbGF0ZShzdHIpO1xuICAgIH0gZWxzZSBpZiAoSEFTX1JBTkdFX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVGcmFnbWVudEZyb21SYW5nZShzdHIpO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVGcmFnbWVudEZyb21XcmFwKHN0cik7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHR3byBub2RlJ3MgbmFtZXMgYXJlIHRoZSBzYW1lLlxuICpcbiAqIE5PVEU6IFdlIGRvbid0IGJvdGhlciBjaGVja2luZyBgbmFtZXNwYWNlVVJJYCBiZWNhdXNlIHlvdSB3aWxsIG5ldmVyIGZpbmQgdHdvIEhUTUwgZWxlbWVudHMgd2l0aCB0aGUgc2FtZVxuICogICAgICAgbm9kZU5hbWUgYW5kIGRpZmZlcmVudCBuYW1lc3BhY2UgVVJJcy5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGFcbiAqIEBwYXJhbSB7RWxlbWVudH0gYiBUaGUgdGFyZ2V0IGVsZW1lbnRcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVOb2RlTmFtZXMoZnJvbUVsLCB0b0VsKSB7XG4gICAgdmFyIGZyb21Ob2RlTmFtZSA9IGZyb21FbC5ub2RlTmFtZTtcbiAgICB2YXIgdG9Ob2RlTmFtZSA9IHRvRWwubm9kZU5hbWU7XG4gICAgdmFyIGZyb21Db2RlU3RhcnQsIHRvQ29kZVN0YXJ0O1xuXG4gICAgaWYgKGZyb21Ob2RlTmFtZSA9PT0gdG9Ob2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBmcm9tQ29kZVN0YXJ0ID0gZnJvbU5vZGVOYW1lLmNoYXJDb2RlQXQoMCk7XG4gICAgdG9Db2RlU3RhcnQgPSB0b05vZGVOYW1lLmNoYXJDb2RlQXQoMCk7XG5cbiAgICAvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSB2aXJ0dWFsIERPTSBub2RlIG9yIFNWRyBub2RlIHRoZW4gd2UgbWF5XG4gICAgLy8gbmVlZCB0byBub3JtYWxpemUgdGhlIHRhZyBuYW1lIGJlZm9yZSBjb21wYXJpbmcuIE5vcm1hbCBIVE1MIGVsZW1lbnRzIHRoYXQgYXJlXG4gICAgLy8gaW4gdGhlIFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiXG4gICAgLy8gYXJlIGNvbnZlcnRlZCB0byB1cHBlciBjYXNlXG4gICAgaWYgKGZyb21Db2RlU3RhcnQgPD0gOTAgJiYgdG9Db2RlU3RhcnQgPj0gOTcpIHsgLy8gZnJvbSBpcyB1cHBlciBhbmQgdG8gaXMgbG93ZXJcbiAgICAgICAgcmV0dXJuIGZyb21Ob2RlTmFtZSA9PT0gdG9Ob2RlTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgIH0gZWxzZSBpZiAodG9Db2RlU3RhcnQgPD0gOTAgJiYgZnJvbUNvZGVTdGFydCA+PSA5NykgeyAvLyB0byBpcyB1cHBlciBhbmQgZnJvbSBpcyBsb3dlclxuICAgICAgICByZXR1cm4gdG9Ob2RlTmFtZSA9PT0gZnJvbU5vZGVOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gZWxlbWVudCwgb3B0aW9uYWxseSB3aXRoIGEga25vd24gbmFtZXNwYWNlIFVSSS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZWxlbWVudCBuYW1lLCBlLmcuICdkaXYnIG9yICdzdmcnXG4gKiBAcGFyYW0ge3N0cmluZ30gW25hbWVzcGFjZVVSSV0gdGhlIGVsZW1lbnQncyBuYW1lc3BhY2UgVVJJLCBpLmUuIHRoZSB2YWx1ZSBvZlxuICogaXRzIGB4bWxuc2AgYXR0cmlidXRlIG9yIGl0cyBpbmZlcnJlZCBuYW1lc3BhY2UuXG4gKlxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWUsIG5hbWVzcGFjZVVSSSkge1xuICAgIHJldHVybiAhbmFtZXNwYWNlVVJJIHx8IG5hbWVzcGFjZVVSSSA9PT0gTlNfWEhUTUwgP1xuICAgICAgICBkb2MuY3JlYXRlRWxlbWVudChuYW1lKSA6XG4gICAgICAgIGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBuYW1lKTtcbn1cblxuLyoqXG4gKiBDb3BpZXMgdGhlIGNoaWxkcmVuIG9mIG9uZSBET00gZWxlbWVudCB0byBhbm90aGVyIERPTSBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIG1vdmVDaGlsZHJlbihmcm9tRWwsIHRvRWwpIHtcbiAgICB2YXIgY3VyQ2hpbGQgPSBmcm9tRWwuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAoY3VyQ2hpbGQpIHtcbiAgICAgICAgdmFyIG5leHRDaGlsZCA9IGN1ckNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICB0b0VsLmFwcGVuZENoaWxkKGN1ckNoaWxkKTtcbiAgICAgICAgY3VyQ2hpbGQgPSBuZXh0Q2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiB0b0VsO1xufVxuXG5mdW5jdGlvbiBzeW5jQm9vbGVhbkF0dHJQcm9wKGZyb21FbCwgdG9FbCwgbmFtZSkge1xuICAgIGlmIChmcm9tRWxbbmFtZV0gIT09IHRvRWxbbmFtZV0pIHtcbiAgICAgICAgZnJvbUVsW25hbWVdID0gdG9FbFtuYW1lXTtcbiAgICAgICAgaWYgKGZyb21FbFtuYW1lXSkge1xuICAgICAgICAgICAgZnJvbUVsLnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcm9tRWwucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgc3BlY2lhbEVsSGFuZGxlcnMgPSB7XG4gICAgT1BUSU9OOiBmdW5jdGlvbihmcm9tRWwsIHRvRWwpIHtcbiAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBmcm9tRWwucGFyZW50Tm9kZTtcbiAgICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnROYW1lID0gcGFyZW50Tm9kZS5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHBhcmVudE5hbWUgPT09ICdPUFRHUk9VUCcpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHBhcmVudE5hbWUgPSBwYXJlbnROb2RlICYmIHBhcmVudE5vZGUubm9kZU5hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJlbnROYW1lID09PSAnU0VMRUNUJyAmJiAhcGFyZW50Tm9kZS5oYXNBdHRyaWJ1dGUoJ211bHRpcGxlJykpIHtcbiAgICAgICAgICAgICAgICBpZiAoZnJvbUVsLmhhc0F0dHJpYnV0ZSgnc2VsZWN0ZWQnKSAmJiAhdG9FbC5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBNUyBFZGdlIGJ1ZyB3aGVyZSB0aGUgJ3NlbGVjdGVkJyBhdHRyaWJ1dGUgY2FuIG9ubHkgYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlZCBpZiBzZXQgdG8gYSBub24tZW1wdHkgdmFsdWU6XG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1pY3Jvc29mdC5jb20vZW4tdXMvbWljcm9zb2Z0LWVkZ2UvcGxhdGZvcm0vaXNzdWVzLzEyMDg3Njc5L1xuICAgICAgICAgICAgICAgICAgICBmcm9tRWwuc2V0QXR0cmlidXRlKCdzZWxlY3RlZCcsICdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICBmcm9tRWwucmVtb3ZlQXR0cmlidXRlKCdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIHRvIHJlc2V0IHNlbGVjdCBlbGVtZW50J3Mgc2VsZWN0ZWRJbmRleCB0byAtMSwgb3RoZXJ3aXNlIHNldHRpbmdcbiAgICAgICAgICAgICAgICAvLyBmcm9tRWwuc2VsZWN0ZWQgdXNpbmcgdGhlIHN5bmNCb29sZWFuQXR0clByb3AgYmVsb3cgaGFzIG5vIGVmZmVjdC5cbiAgICAgICAgICAgICAgICAvLyBUaGUgY29ycmVjdCBzZWxlY3RlZEluZGV4IHdpbGwgYmUgc2V0IGluIHRoZSBTRUxFQ1Qgc3BlY2lhbCBoYW5kbGVyIGJlbG93LlxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleCA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN5bmNCb29sZWFuQXR0clByb3AoZnJvbUVsLCB0b0VsLCAnc2VsZWN0ZWQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFRoZSBcInZhbHVlXCIgYXR0cmlidXRlIGlzIHNwZWNpYWwgZm9yIHRoZSA8aW5wdXQ+IGVsZW1lbnQgc2luY2UgaXQgc2V0c1xuICAgICAqIHRoZSBpbml0aWFsIHZhbHVlLiBDaGFuZ2luZyB0aGUgXCJ2YWx1ZVwiIGF0dHJpYnV0ZSB3aXRob3V0IGNoYW5naW5nIHRoZVxuICAgICAqIFwidmFsdWVcIiBwcm9wZXJ0eSB3aWxsIGhhdmUgbm8gZWZmZWN0IHNpbmNlIGl0IGlzIG9ubHkgdXNlZCB0byB0aGUgc2V0IHRoZVxuICAgICAqIGluaXRpYWwgdmFsdWUuICBTaW1pbGFyIGZvciB0aGUgXCJjaGVja2VkXCIgYXR0cmlidXRlLCBhbmQgXCJkaXNhYmxlZFwiLlxuICAgICAqL1xuICAgIElOUFVUOiBmdW5jdGlvbihmcm9tRWwsIHRvRWwpIHtcbiAgICAgICAgc3luY0Jvb2xlYW5BdHRyUHJvcChmcm9tRWwsIHRvRWwsICdjaGVja2VkJyk7XG4gICAgICAgIHN5bmNCb29sZWFuQXR0clByb3AoZnJvbUVsLCB0b0VsLCAnZGlzYWJsZWQnKTtcblxuICAgICAgICBpZiAoZnJvbUVsLnZhbHVlICE9PSB0b0VsLnZhbHVlKSB7XG4gICAgICAgICAgICBmcm9tRWwudmFsdWUgPSB0b0VsLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0b0VsLmhhc0F0dHJpYnV0ZSgndmFsdWUnKSkge1xuICAgICAgICAgICAgZnJvbUVsLnJlbW92ZUF0dHJpYnV0ZSgndmFsdWUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBURVhUQVJFQTogZnVuY3Rpb24oZnJvbUVsLCB0b0VsKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IHRvRWwudmFsdWU7XG4gICAgICAgIGlmIChmcm9tRWwudmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICBmcm9tRWwudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaXJzdENoaWxkID0gZnJvbUVsLmZpcnN0Q2hpbGQ7XG4gICAgICAgIGlmIChmaXJzdENoaWxkKSB7XG4gICAgICAgICAgICAvLyBOZWVkZWQgZm9yIElFLiBBcHBhcmVudGx5IElFIHNldHMgdGhlIHBsYWNlaG9sZGVyIGFzIHRoZVxuICAgICAgICAgICAgLy8gbm9kZSB2YWx1ZSBhbmQgdmlzZSB2ZXJzYS4gVGhpcyBpZ25vcmVzIGFuIGVtcHR5IHVwZGF0ZS5cbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGZpcnN0Q2hpbGQubm9kZVZhbHVlO1xuXG4gICAgICAgICAgICBpZiAob2xkVmFsdWUgPT0gbmV3VmFsdWUgfHwgKCFuZXdWYWx1ZSAmJiBvbGRWYWx1ZSA9PSBmcm9tRWwucGxhY2Vob2xkZXIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaXJzdENoaWxkLm5vZGVWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBTRUxFQ1Q6IGZ1bmN0aW9uKGZyb21FbCwgdG9FbCkge1xuICAgICAgICBpZiAoIXRvRWwuaGFzQXR0cmlidXRlKCdtdWx0aXBsZScpKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRJbmRleCA9IC0xO1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBsb29wIHRocm91Z2ggY2hpbGRyZW4gb2YgZnJvbUVsLCBub3QgdG9FbCBzaW5jZSBub2RlcyBjYW4gYmUgbW92ZWRcbiAgICAgICAgICAgIC8vIGZyb20gdG9FbCB0byBmcm9tRWwgZGlyZWN0bHkgd2hlbiBtb3JwaGluZy5cbiAgICAgICAgICAgIC8vIEF0IHRoZSB0aW1lIHRoaXMgc3BlY2lhbCBoYW5kbGVyIGlzIGludm9rZWQsIGFsbCBjaGlsZHJlbiBoYXZlIGFscmVhZHkgYmVlbiBtb3JwaGVkXG4gICAgICAgICAgICAvLyBhbmQgYXBwZW5kZWQgdG8gLyByZW1vdmVkIGZyb20gZnJvbUVsLCBzbyB1c2luZyBmcm9tRWwgaGVyZSBpcyBzYWZlIGFuZCBjb3JyZWN0LlxuICAgICAgICAgICAgdmFyIGN1ckNoaWxkID0gZnJvbUVsLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICB2YXIgb3B0Z3JvdXA7XG4gICAgICAgICAgICB2YXIgbm9kZU5hbWU7XG4gICAgICAgICAgICB3aGlsZShjdXJDaGlsZCkge1xuICAgICAgICAgICAgICAgIG5vZGVOYW1lID0gY3VyQ2hpbGQubm9kZU5hbWUgJiYgY3VyQ2hpbGQubm9kZU5hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZU5hbWUgPT09ICdPUFRHUk9VUCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXAgPSBjdXJDaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgY3VyQ2hpbGQgPSBvcHRncm91cC5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlTmFtZSA9PT0gJ09QVElPTicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJDaGlsZC5oYXNBdHRyaWJ1dGUoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdXJDaGlsZCA9IGN1ckNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1ckNoaWxkICYmIG9wdGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJDaGlsZCA9IG9wdGdyb3VwLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXAgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcm9tRWwuc2VsZWN0ZWRJbmRleCA9IHNlbGVjdGVkSW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgRUxFTUVOVF9OT0RFID0gMTtcbnZhciBET0NVTUVOVF9GUkFHTUVOVF9OT0RFJDEgPSAxMTtcbnZhciBURVhUX05PREUgPSAzO1xudmFyIENPTU1FTlRfTk9ERSA9IDg7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBkZWZhdWx0R2V0Tm9kZUtleShub2RlKSB7XG4gIGlmIChub2RlKSB7XG4gICAgICByZXR1cm4gKG5vZGUuZ2V0QXR0cmlidXRlICYmIG5vZGUuZ2V0QXR0cmlidXRlKCdpZCcpKSB8fCBub2RlLmlkO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vcnBoZG9tRmFjdG9yeShtb3JwaEF0dHJzKSB7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbW9ycGhkb20oZnJvbU5vZGUsIHRvTm9kZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdG9Ob2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKGZyb21Ob2RlLm5vZGVOYW1lID09PSAnI2RvY3VtZW50JyB8fCBmcm9tTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnIHx8IGZyb21Ob2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9Ob2RlSHRtbCA9IHRvTm9kZTtcbiAgICAgICAgICAgICAgICB0b05vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgICAgICAgICAgICAgIHRvTm9kZS5pbm5lckhUTUwgPSB0b05vZGVIdG1sO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b05vZGUgPSB0b0VsZW1lbnQodG9Ob2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBnZXROb2RlS2V5ID0gb3B0aW9ucy5nZXROb2RlS2V5IHx8IGRlZmF1bHRHZXROb2RlS2V5O1xuICAgICAgICB2YXIgb25CZWZvcmVOb2RlQWRkZWQgPSBvcHRpb25zLm9uQmVmb3JlTm9kZUFkZGVkIHx8IG5vb3A7XG4gICAgICAgIHZhciBvbk5vZGVBZGRlZCA9IG9wdGlvbnMub25Ob2RlQWRkZWQgfHwgbm9vcDtcbiAgICAgICAgdmFyIG9uQmVmb3JlRWxVcGRhdGVkID0gb3B0aW9ucy5vbkJlZm9yZUVsVXBkYXRlZCB8fCBub29wO1xuICAgICAgICB2YXIgb25FbFVwZGF0ZWQgPSBvcHRpb25zLm9uRWxVcGRhdGVkIHx8IG5vb3A7XG4gICAgICAgIHZhciBvbkJlZm9yZU5vZGVEaXNjYXJkZWQgPSBvcHRpb25zLm9uQmVmb3JlTm9kZURpc2NhcmRlZCB8fCBub29wO1xuICAgICAgICB2YXIgb25Ob2RlRGlzY2FyZGVkID0gb3B0aW9ucy5vbk5vZGVEaXNjYXJkZWQgfHwgbm9vcDtcbiAgICAgICAgdmFyIG9uQmVmb3JlRWxDaGlsZHJlblVwZGF0ZWQgPSBvcHRpb25zLm9uQmVmb3JlRWxDaGlsZHJlblVwZGF0ZWQgfHwgbm9vcDtcbiAgICAgICAgdmFyIGNoaWxkcmVuT25seSA9IG9wdGlvbnMuY2hpbGRyZW5Pbmx5ID09PSB0cnVlO1xuXG4gICAgICAgIC8vIFRoaXMgb2JqZWN0IGlzIHVzZWQgYXMgYSBsb29rdXAgdG8gcXVpY2tseSBmaW5kIGFsbCBrZXllZCBlbGVtZW50cyBpbiB0aGUgb3JpZ2luYWwgRE9NIHRyZWUuXG4gICAgICAgIHZhciBmcm9tTm9kZXNMb29rdXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB2YXIga2V5ZWRSZW1vdmFsTGlzdCA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEtleWVkUmVtb3ZhbChrZXkpIHtcbiAgICAgICAgICAgIGtleWVkUmVtb3ZhbExpc3QucHVzaChrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gd2Fsa0Rpc2NhcmRlZENoaWxkTm9kZXMobm9kZSwgc2tpcEtleWVkTm9kZXMpIHtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyQ2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1ckNoaWxkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2tpcEtleWVkTm9kZXMgJiYgKGtleSA9IGdldE5vZGVLZXkoY3VyQ2hpbGQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIGtleWVkIG5vZGVzIHRoZW4gd2UgYWRkIHRoZSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIGEgbGlzdCBzbyB0aGF0IGl0IGNhbiBiZSBoYW5kbGVkIGF0IHRoZSB2ZXJ5IGVuZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEtleWVkUmVtb3ZhbChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZXBvcnQgdGhlIG5vZGUgYXMgZGlzY2FyZGVkIGlmIGl0IGlzIG5vdCBrZXllZC4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdCB0aGUgZW5kIHdlIGxvb3AgdGhyb3VnaCBhbGwga2V5ZWQgZWxlbWVudHMgdGhhdCB3ZXJlIHVubWF0Y2hlZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHRoZW4gZGlzY2FyZCB0aGVtIGluIG9uZSBmaW5hbCBwYXNzLlxuICAgICAgICAgICAgICAgICAgICAgICAgb25Ob2RlRGlzY2FyZGVkKGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJDaGlsZC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa0Rpc2NhcmRlZENoaWxkTm9kZXMoY3VyQ2hpbGQsIHNraXBLZXllZE5vZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1ckNoaWxkID0gY3VyQ2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgYSBET00gbm9kZSBvdXQgb2YgdGhlIG9yaWdpbmFsIERPTVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtOb2RlfSBub2RlIFRoZSBub2RlIHRvIHJlbW92ZVxuICAgICAgICAgKiBAcGFyYW0gIHtOb2RlfSBwYXJlbnROb2RlIFRoZSBub2RlcyBwYXJlbnRcbiAgICAgICAgICogQHBhcmFtICB7Qm9vbGVhbn0gc2tpcEtleWVkTm9kZXMgSWYgdHJ1ZSB0aGVuIGVsZW1lbnRzIHdpdGgga2V5cyB3aWxsIGJlIHNraXBwZWQgYW5kIG5vdCBkaXNjYXJkZWQuXG4gICAgICAgICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZU5vZGUobm9kZSwgcGFyZW50Tm9kZSwgc2tpcEtleWVkTm9kZXMpIHtcbiAgICAgICAgICAgIGlmIChvbkJlZm9yZU5vZGVEaXNjYXJkZWQobm9kZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9uTm9kZURpc2NhcmRlZChub2RlKTtcbiAgICAgICAgICAgIHdhbGtEaXNjYXJkZWRDaGlsZE5vZGVzKG5vZGUsIHNraXBLZXllZE5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIC8vIFRyZWVXYWxrZXIgaW1wbGVtZW50YXRpb24gaXMgbm8gZmFzdGVyLCBidXQga2VlcGluZyB0aGlzIGFyb3VuZCBpbiBjYXNlIHRoaXMgY2hhbmdlcyBpbiB0aGUgZnV0dXJlXG4gICAgICAgIC8vIGZ1bmN0aW9uIGluZGV4VHJlZShyb290KSB7XG4gICAgICAgIC8vICAgICB2YXIgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoXG4gICAgICAgIC8vICAgICAgICAgcm9vdCxcbiAgICAgICAgLy8gICAgICAgICBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICB2YXIgZWw7XG4gICAgICAgIC8vICAgICB3aGlsZSgoZWwgPSB0cmVlV2Fsa2VyLm5leHROb2RlKCkpKSB7XG4gICAgICAgIC8vICAgICAgICAgdmFyIGtleSA9IGdldE5vZGVLZXkoZWwpO1xuICAgICAgICAvLyAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZnJvbU5vZGVzTG9va3VwW2tleV0gPSBlbDtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyAvLyBOb2RlSXRlcmF0b3IgaW1wbGVtZW50YXRpb24gaXMgbm8gZmFzdGVyLCBidXQga2VlcGluZyB0aGlzIGFyb3VuZCBpbiBjYXNlIHRoaXMgY2hhbmdlcyBpbiB0aGUgZnV0dXJlXG4gICAgICAgIC8vXG4gICAgICAgIC8vIGZ1bmN0aW9uIGluZGV4VHJlZShub2RlKSB7XG4gICAgICAgIC8vICAgICB2YXIgbm9kZUl0ZXJhdG9yID0gZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yKG5vZGUsIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UKTtcbiAgICAgICAgLy8gICAgIHZhciBlbDtcbiAgICAgICAgLy8gICAgIHdoaWxlKChlbCA9IG5vZGVJdGVyYXRvci5uZXh0Tm9kZSgpKSkge1xuICAgICAgICAvLyAgICAgICAgIHZhciBrZXkgPSBnZXROb2RlS2V5KGVsKTtcbiAgICAgICAgLy8gICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGZyb21Ob2Rlc0xvb2t1cFtrZXldID0gZWw7XG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5kZXhUcmVlKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UX05PREUgfHwgbm9kZS5ub2RlVHlwZSA9PT0gRE9DVU1FTlRfRlJBR01FTlRfTk9ERSQxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1ckNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjdXJDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gZ2V0Tm9kZUtleShjdXJDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21Ob2Rlc0xvb2t1cFtrZXldID0gY3VyQ2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBXYWxrIHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICAgICAgICAgIGluZGV4VHJlZShjdXJDaGlsZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY3VyQ2hpbGQgPSBjdXJDaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpbmRleFRyZWUoZnJvbU5vZGUpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZU5vZGVBZGRlZChlbCkge1xuICAgICAgICAgICAgb25Ob2RlQWRkZWQoZWwpO1xuXG4gICAgICAgICAgICB2YXIgY3VyQ2hpbGQgPSBlbC5maXJzdENoaWxkO1xuICAgICAgICAgICAgd2hpbGUgKGN1ckNoaWxkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY3VyQ2hpbGQubmV4dFNpYmxpbmc7XG5cbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gZ2V0Tm9kZUtleShjdXJDaGlsZCk7XG4gICAgICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW5tYXRjaGVkRnJvbUVsID0gZnJvbU5vZGVzTG9va3VwW2tleV07XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGZpbmQgYSBkdXBsaWNhdGUgI2lkIG5vZGUgaW4gY2FjaGUsIHJlcGxhY2UgYGVsYCB3aXRoIGNhY2hlIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZCBtb3JwaCBpdCB0byB0aGUgY2hpbGQgbm9kZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHVubWF0Y2hlZEZyb21FbCAmJiBjb21wYXJlTm9kZU5hbWVzKGN1ckNoaWxkLCB1bm1hdGNoZWRGcm9tRWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJDaGlsZC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh1bm1hdGNoZWRGcm9tRWwsIGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vcnBoRWwodW5tYXRjaGVkRnJvbUVsLCBjdXJDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTm9kZUFkZGVkKGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyByZWN1cnNpdmVseSBjYWxsIGZvciBjdXJDaGlsZCBhbmQgaXQncyBjaGlsZHJlbiB0byBzZWUgaWYgd2UgZmluZCBzb21ldGhpbmcgaW5cbiAgICAgICAgICAgICAgICAgIC8vIGZyb21Ob2Rlc0xvb2t1cFxuICAgICAgICAgICAgICAgICAgaGFuZGxlTm9kZUFkZGVkKGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJDaGlsZCA9IG5leHRTaWJsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cEZyb21FbChmcm9tRWwsIGN1ckZyb21Ob2RlQ2hpbGQsIGN1ckZyb21Ob2RlS2V5KSB7XG4gICAgICAgICAgICAvLyBXZSBoYXZlIHByb2Nlc3NlZCBhbGwgb2YgdGhlIFwidG8gbm9kZXNcIi4gSWYgY3VyRnJvbU5vZGVDaGlsZCBpc1xuICAgICAgICAgICAgLy8gbm9uLW51bGwgdGhlbiB3ZSBzdGlsbCBoYXZlIHNvbWUgZnJvbSBub2RlcyBsZWZ0IG92ZXIgdGhhdCBuZWVkXG4gICAgICAgICAgICAvLyB0byBiZSByZW1vdmVkXG4gICAgICAgICAgICB3aGlsZSAoY3VyRnJvbU5vZGVDaGlsZCkge1xuICAgICAgICAgICAgICAgIHZhciBmcm9tTmV4dFNpYmxpbmcgPSBjdXJGcm9tTm9kZUNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIGlmICgoY3VyRnJvbU5vZGVLZXkgPSBnZXROb2RlS2V5KGN1ckZyb21Ob2RlQ2hpbGQpKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB0aGUgbm9kZSBpcyBrZXllZCBpdCBtaWdodCBiZSBtYXRjaGVkIHVwIGxhdGVyIHNvIHdlIGRlZmVyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhY3R1YWwgcmVtb3ZhbCB0byBsYXRlclxuICAgICAgICAgICAgICAgICAgICBhZGRLZXllZFJlbW92YWwoY3VyRnJvbU5vZGVLZXkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IHdlIHNraXAgbmVzdGVkIGtleWVkIG5vZGVzIGZyb20gYmVpbmcgcmVtb3ZlZCBzaW5jZSB0aGVyZSBpc1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICBzdGlsbCBhIGNoYW5jZSB0aGV5IHdpbGwgYmUgbWF0Y2hlZCB1cCBsYXRlclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVOb2RlKGN1ckZyb21Ob2RlQ2hpbGQsIGZyb21FbCwgdHJ1ZSAvKiBza2lwIGtleWVkIG5vZGVzICovKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZCA9IGZyb21OZXh0U2libGluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG1vcnBoRWwoZnJvbUVsLCB0b0VsLCBjaGlsZHJlbk9ubHkpIHtcbiAgICAgICAgICAgIHZhciB0b0VsS2V5ID0gZ2V0Tm9kZUtleSh0b0VsKTtcblxuICAgICAgICAgICAgaWYgKHRvRWxLZXkpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBhbiBlbGVtZW50IHdpdGggYW4gSUQgaXMgYmVpbmcgbW9ycGhlZCB0aGVuIGl0IHdpbGwgYmUgaW4gdGhlIGZpbmFsXG4gICAgICAgICAgICAgICAgLy8gRE9NIHNvIGNsZWFyIGl0IG91dCBvZiB0aGUgc2F2ZWQgZWxlbWVudHMgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgIGRlbGV0ZSBmcm9tTm9kZXNMb29rdXBbdG9FbEtleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY2hpbGRyZW5Pbmx5KSB7XG4gICAgICAgICAgICAgICAgLy8gb3B0aW9uYWxcbiAgICAgICAgICAgICAgICBpZiAob25CZWZvcmVFbFVwZGF0ZWQoZnJvbUVsLCB0b0VsKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBhdHRyaWJ1dGVzIG9uIG9yaWdpbmFsIERPTSBlbGVtZW50IGZpcnN0XG4gICAgICAgICAgICAgICAgbW9ycGhBdHRycyhmcm9tRWwsIHRvRWwpO1xuICAgICAgICAgICAgICAgIC8vIG9wdGlvbmFsXG4gICAgICAgICAgICAgICAgb25FbFVwZGF0ZWQoZnJvbUVsKTtcblxuICAgICAgICAgICAgICAgIGlmIChvbkJlZm9yZUVsQ2hpbGRyZW5VcGRhdGVkKGZyb21FbCwgdG9FbCkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmcm9tRWwubm9kZU5hbWUgIT09ICdURVhUQVJFQScpIHtcbiAgICAgICAgICAgICAgbW9ycGhDaGlsZHJlbihmcm9tRWwsIHRvRWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3BlY2lhbEVsSGFuZGxlcnMuVEVYVEFSRUEoZnJvbUVsLCB0b0VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG1vcnBoQ2hpbGRyZW4oZnJvbUVsLCB0b0VsKSB7XG4gICAgICAgICAgICB2YXIgY3VyVG9Ob2RlQ2hpbGQgPSB0b0VsLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICB2YXIgY3VyRnJvbU5vZGVDaGlsZCA9IGZyb21FbC5maXJzdENoaWxkO1xuICAgICAgICAgICAgdmFyIGN1clRvTm9kZUtleTtcbiAgICAgICAgICAgIHZhciBjdXJGcm9tTm9kZUtleTtcblxuICAgICAgICAgICAgdmFyIGZyb21OZXh0U2libGluZztcbiAgICAgICAgICAgIHZhciB0b05leHRTaWJsaW5nO1xuICAgICAgICAgICAgdmFyIG1hdGNoaW5nRnJvbUVsO1xuXG4gICAgICAgICAgICAvLyB3YWxrIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgb3V0ZXI6IHdoaWxlIChjdXJUb05vZGVDaGlsZCkge1xuICAgICAgICAgICAgICAgIHRvTmV4dFNpYmxpbmcgPSBjdXJUb05vZGVDaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBjdXJUb05vZGVLZXkgPSBnZXROb2RlS2V5KGN1clRvTm9kZUNoaWxkKTtcblxuICAgICAgICAgICAgICAgIC8vIHdhbGsgdGhlIGZyb21Ob2RlIGNoaWxkcmVuIGFsbCB0aGUgd2F5IHRocm91Z2hcbiAgICAgICAgICAgICAgICB3aGlsZSAoY3VyRnJvbU5vZGVDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tTmV4dFNpYmxpbmcgPSBjdXJGcm9tTm9kZUNoaWxkLm5leHRTaWJsaW5nO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJUb05vZGVDaGlsZC5pc1NhbWVOb2RlICYmIGN1clRvTm9kZUNoaWxkLmlzU2FtZU5vZGUoY3VyRnJvbU5vZGVDaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1clRvTm9kZUNoaWxkID0gdG9OZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1ckZyb21Ob2RlQ2hpbGQgPSBmcm9tTmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1ckZyb21Ob2RlS2V5ID0gZ2V0Tm9kZUtleShjdXJGcm9tTm9kZUNoaWxkKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VyRnJvbU5vZGVUeXBlID0gY3VyRnJvbU5vZGVDaGlsZC5ub2RlVHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIG1lYW5zIGlmIHRoZSBjdXJGcm9tTm9kZUNoaWxkIGRvZXNudCBoYXZlIGEgbWF0Y2ggd2l0aCB0aGUgY3VyVG9Ob2RlQ2hpbGRcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQ29tcGF0aWJsZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyRnJvbU5vZGVUeXBlID09PSBjdXJUb05vZGVDaGlsZC5ub2RlVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1ckZyb21Ob2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQm90aCBub2RlcyBiZWluZyBjb21wYXJlZCBhcmUgRWxlbWVudCBub2Rlc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1clRvTm9kZUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdGFyZ2V0IG5vZGUgaGFzIGEga2V5IHNvIHdlIHdhbnQgdG8gbWF0Y2ggaXQgdXAgd2l0aCB0aGUgY29ycmVjdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSBvcmlnaW5hbCBET00gdHJlZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyVG9Ob2RlS2V5ICE9PSBjdXJGcm9tTm9kZUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGN1cnJlbnQgZWxlbWVudCBpbiB0aGUgb3JpZ2luYWwgRE9NIHRyZWUgZG9lcyBub3QgaGF2ZSBhIG1hdGNoaW5nIGtleSBzb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGV0J3MgY2hlY2sgb3VyIGxvb2t1cCB0byBzZWUgaWYgdGhlcmUgaXMgYSBtYXRjaGluZyBlbGVtZW50IGluIHRoZSBvcmlnaW5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRE9NIHRyZWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobWF0Y2hpbmdGcm9tRWwgPSBmcm9tTm9kZXNMb29rdXBbY3VyVG9Ob2RlS2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnJvbU5leHRTaWJsaW5nID09PSBtYXRjaGluZ0Zyb21FbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIHNpbmdsZSBlbGVtZW50IHJlbW92YWxzLiBUbyBhdm9pZCByZW1vdmluZyB0aGUgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRE9NIG5vZGUgb3V0IG9mIHRoZSB0cmVlIChzaW5jZSB0aGF0IGNhbiBicmVhayBDU1MgdHJhbnNpdGlvbnMsIGV0Yy4pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSB3aWxsIGluc3RlYWQgZGlzY2FyZCB0aGUgY3VycmVudCBub2RlIGFuZCB3YWl0IHVudGlsIHRoZSBuZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiB0byBwcm9wZXJseSBtYXRjaCB1cCB0aGUga2V5ZWQgdGFyZ2V0IGVsZW1lbnQgd2l0aCBpdHMgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxlbWVudCBpbiB0aGUgb3JpZ2luYWwgdHJlZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBhdGlibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBmb3VuZCBhIG1hdGNoaW5nIGtleWVkIGVsZW1lbnQgc29tZXdoZXJlIGluIHRoZSBvcmlnaW5hbCBET00gdHJlZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGV0J3MgbW92ZSB0aGUgb3JpZ2luYWwgRE9NIG5vZGUgaW50byB0aGUgY3VycmVudCBwb3NpdGlvbiBhbmQgbW9ycGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogV2UgdXNlIGluc2VydEJlZm9yZSBpbnN0ZWFkIG9mIHJlcGxhY2VDaGlsZCBiZWNhdXNlIHdlIHdhbnQgdG8gZ28gdGhyb3VnaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgYHJlbW92ZU5vZGUoKWAgZnVuY3Rpb24gZm9yIHRoZSBub2RlIHRoYXQgaXMgYmVpbmcgZGlzY2FyZGVkIHNvIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxsIGxpZmVjeWNsZSBob29rcyBhcmUgY29ycmVjdGx5IGludm9rZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUVsLmluc2VydEJlZm9yZShtYXRjaGluZ0Zyb21FbCwgY3VyRnJvbU5vZGVDaGlsZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbU5leHRTaWJsaW5nID0gY3VyRnJvbU5vZGVDaGlsZC5uZXh0U2libGluZztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyRnJvbU5vZGVLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHRoZSBub2RlIGlzIGtleWVkIGl0IG1pZ2h0IGJlIG1hdGNoZWQgdXAgbGF0ZXIgc28gd2UgZGVmZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBhY3R1YWwgcmVtb3ZhbCB0byBsYXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkS2V5ZWRSZW1vdmFsKGN1ckZyb21Ob2RlS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IHdlIHNraXAgbmVzdGVkIGtleWVkIG5vZGVzIGZyb20gYmVpbmcgcmVtb3ZlZCBzaW5jZSB0aGVyZSBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgc3RpbGwgYSBjaGFuY2UgdGhleSB3aWxsIGJlIG1hdGNoZWQgdXAgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUoY3VyRnJvbU5vZGVDaGlsZCwgZnJvbUVsLCB0cnVlIC8qIHNraXAga2V5ZWQgbm9kZXMgKi8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZCA9IG1hdGNoaW5nRnJvbUVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG5vZGVzIGFyZSBub3QgY29tcGF0aWJsZSBzaW5jZSB0aGUgXCJ0b1wiIG5vZGUgaGFzIGEga2V5IGFuZCB0aGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIG5vIG1hdGNoaW5nIGtleWVkIG5vZGUgaW4gdGhlIHNvdXJjZSB0cmVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNDb21wYXRpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ckZyb21Ob2RlS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBvcmlnaW5hbCBoYXMgYSBrZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNDb21wYXRpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNDb21wYXRpYmxlID0gaXNDb21wYXRpYmxlICE9PSBmYWxzZSAmJiBjb21wYXJlTm9kZU5hbWVzKGN1ckZyb21Ob2RlQ2hpbGQsIGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb21wYXRpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGNvbXBhdGlibGUgRE9NIGVsZW1lbnRzIHNvIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgY3VycmVudCBcImZyb21cIiBub2RlIHRvIG1hdGNoIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRhcmdldCBET00gbm9kZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTU9SUEhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9ycGhFbChjdXJGcm9tTm9kZUNoaWxkLCBjdXJUb05vZGVDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1ckZyb21Ob2RlVHlwZSA9PT0gVEVYVF9OT0RFIHx8IGN1ckZyb21Ob2RlVHlwZSA9PSBDT01NRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCb3RoIG5vZGVzIGJlaW5nIGNvbXBhcmVkIGFyZSBUZXh0IG9yIENvbW1lbnQgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBhdGlibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbXBseSB1cGRhdGUgbm9kZVZhbHVlIG9uIHRoZSBvcmlnaW5hbCBub2RlIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIHRoZSB0ZXh0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1ckZyb21Ob2RlQ2hpbGQubm9kZVZhbHVlICE9PSBjdXJUb05vZGVDaGlsZC5ub2RlVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZC5ub2RlVmFsdWUgPSBjdXJUb05vZGVDaGlsZC5ub2RlVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb21wYXRpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIGJvdGggdGhlIFwidG9cIiBjaGlsZCBhbmQgdGhlIFwiZnJvbVwiIGNoaWxkIHNpbmNlIHdlIGZvdW5kIGEgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGhpbmcgZWxzZSB0byBkbyBhcyB3ZSBhbHJlYWR5IHJlY3Vyc2l2ZWx5IGNhbGxlZCBtb3JwaENoaWxkcmVuIGFib3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJUb05vZGVDaGlsZCA9IHRvTmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkID0gZnJvbU5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBObyBjb21wYXRpYmxlIG1hdGNoIHNvIHJlbW92ZSB0aGUgb2xkIG5vZGUgZnJvbSB0aGUgRE9NIGFuZCBjb250aW51ZSB0cnlpbmcgdG8gZmluZCBhXG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoIGluIHRoZSBvcmlnaW5hbCBET00uIEhvd2V2ZXIsIHdlIG9ubHkgZG8gdGhpcyBpZiB0aGUgZnJvbSBub2RlIGlzIG5vdCBrZXllZFxuICAgICAgICAgICAgICAgICAgICAvLyBzaW5jZSBpdCBpcyBwb3NzaWJsZSB0aGF0IGEga2V5ZWQgbm9kZSBtaWdodCBtYXRjaCB1cCB3aXRoIGEgbm9kZSBzb21ld2hlcmUgZWxzZSBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gdGFyZ2V0IHRyZWUgYW5kIHdlIGRvbid0IHdhbnQgdG8gZGlzY2FyZCBpdCBqdXN0IHlldCBzaW5jZSBpdCBzdGlsbCBtaWdodCBmaW5kIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gaG9tZSBpbiB0aGUgZmluYWwgRE9NIHRyZWUuIEFmdGVyIGV2ZXJ5dGhpbmcgaXMgZG9uZSB3ZSB3aWxsIHJlbW92ZSBhbnkga2V5ZWQgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCBkaWRuJ3QgZmluZCBhIGhvbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ckZyb21Ob2RlS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSB0aGUgbm9kZSBpcyBrZXllZCBpdCBtaWdodCBiZSBtYXRjaGVkIHVwIGxhdGVyIHNvIHdlIGRlZmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgYWN0dWFsIHJlbW92YWwgdG8gbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEtleWVkUmVtb3ZhbChjdXJGcm9tTm9kZUtleSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiB3ZSBza2lwIG5lc3RlZCBrZXllZCBub2RlcyBmcm9tIGJlaW5nIHJlbW92ZWQgc2luY2UgdGhlcmUgaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgIHN0aWxsIGEgY2hhbmNlIHRoZXkgd2lsbCBiZSBtYXRjaGVkIHVwIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVOb2RlKGN1ckZyb21Ob2RlQ2hpbGQsIGZyb21FbCwgdHJ1ZSAvKiBza2lwIGtleWVkIG5vZGVzICovKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1ckZyb21Ob2RlQ2hpbGQgPSBmcm9tTmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgfSAvLyBFTkQ6IHdoaWxlKGN1ckZyb21Ob2RlQ2hpbGQpIHt9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB3ZSBnb3QgdGhpcyBmYXIgdGhlbiB3ZSBkaWQgbm90IGZpbmQgYSBjYW5kaWRhdGUgbWF0Y2ggZm9yXG4gICAgICAgICAgICAgICAgLy8gb3VyIFwidG8gbm9kZVwiIGFuZCB3ZSBleGhhdXN0ZWQgYWxsIG9mIHRoZSBjaGlsZHJlbiBcImZyb21cIlxuICAgICAgICAgICAgICAgIC8vIG5vZGVzLiBUaGVyZWZvcmUsIHdlIHdpbGwganVzdCBhcHBlbmQgdGhlIGN1cnJlbnQgXCJ0b1wiIG5vZGVcbiAgICAgICAgICAgICAgICAvLyB0byB0aGUgZW5kXG4gICAgICAgICAgICAgICAgaWYgKGN1clRvTm9kZUtleSAmJiAobWF0Y2hpbmdGcm9tRWwgPSBmcm9tTm9kZXNMb29rdXBbY3VyVG9Ob2RlS2V5XSkgJiYgY29tcGFyZU5vZGVOYW1lcyhtYXRjaGluZ0Zyb21FbCwgY3VyVG9Ob2RlQ2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21FbC5hcHBlbmRDaGlsZChtYXRjaGluZ0Zyb21FbCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1PUlBIXG4gICAgICAgICAgICAgICAgICAgIG1vcnBoRWwobWF0Y2hpbmdGcm9tRWwsIGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25CZWZvcmVOb2RlQWRkZWRSZXN1bHQgPSBvbkJlZm9yZU5vZGVBZGRlZChjdXJUb05vZGVDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbkJlZm9yZU5vZGVBZGRlZFJlc3VsdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbkJlZm9yZU5vZGVBZGRlZFJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1clRvTm9kZUNoaWxkID0gb25CZWZvcmVOb2RlQWRkZWRSZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJUb05vZGVDaGlsZC5hY3R1YWxpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJUb05vZGVDaGlsZCA9IGN1clRvTm9kZUNoaWxkLmFjdHVhbGl6ZShmcm9tRWwub3duZXJEb2N1bWVudCB8fCBkb2MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUVsLmFwcGVuZENoaWxkKGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZU5vZGVBZGRlZChjdXJUb05vZGVDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJUb05vZGVDaGlsZCA9IHRvTmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZCA9IGZyb21OZXh0U2libGluZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xlYW51cEZyb21FbChmcm9tRWwsIGN1ckZyb21Ob2RlQ2hpbGQsIGN1ckZyb21Ob2RlS2V5KTtcblxuICAgICAgICAgICAgdmFyIHNwZWNpYWxFbEhhbmRsZXIgPSBzcGVjaWFsRWxIYW5kbGVyc1tmcm9tRWwubm9kZU5hbWVdO1xuICAgICAgICAgICAgaWYgKHNwZWNpYWxFbEhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBzcGVjaWFsRWxIYW5kbGVyKGZyb21FbCwgdG9FbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gLy8gRU5EOiBtb3JwaENoaWxkcmVuKC4uLilcblxuICAgICAgICB2YXIgbW9ycGhlZE5vZGUgPSBmcm9tTm9kZTtcbiAgICAgICAgdmFyIG1vcnBoZWROb2RlVHlwZSA9IG1vcnBoZWROb2RlLm5vZGVUeXBlO1xuICAgICAgICB2YXIgdG9Ob2RlVHlwZSA9IHRvTm9kZS5ub2RlVHlwZTtcblxuICAgICAgICBpZiAoIWNoaWxkcmVuT25seSkge1xuICAgICAgICAgICAgLy8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIHdlIGFyZSBnaXZlbiB0d28gRE9NIG5vZGVzIHRoYXQgYXJlIG5vdFxuICAgICAgICAgICAgLy8gY29tcGF0aWJsZSAoZS5nLiA8ZGl2PiAtLT4gPHNwYW4+IG9yIDxkaXY+IC0tPiBURVhUKVxuICAgICAgICAgICAgaWYgKG1vcnBoZWROb2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRvTm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbXBhcmVOb2RlTmFtZXMoZnJvbU5vZGUsIHRvTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTm9kZURpc2NhcmRlZChmcm9tTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb3JwaGVkTm9kZSA9IG1vdmVDaGlsZHJlbihmcm9tTm9kZSwgY3JlYXRlRWxlbWVudE5TKHRvTm9kZS5ub2RlTmFtZSwgdG9Ob2RlLm5hbWVzcGFjZVVSSSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gR29pbmcgZnJvbSBhbiBlbGVtZW50IG5vZGUgdG8gYSB0ZXh0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgbW9ycGhlZE5vZGUgPSB0b05vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtb3JwaGVkTm9kZVR5cGUgPT09IFRFWFRfTk9ERSB8fCBtb3JwaGVkTm9kZVR5cGUgPT09IENPTU1FTlRfTk9ERSkgeyAvLyBUZXh0IG9yIGNvbW1lbnQgbm9kZVxuICAgICAgICAgICAgICAgIGlmICh0b05vZGVUeXBlID09PSBtb3JwaGVkTm9kZVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vcnBoZWROb2RlLm5vZGVWYWx1ZSAhPT0gdG9Ob2RlLm5vZGVWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9ycGhlZE5vZGUubm9kZVZhbHVlID0gdG9Ob2RlLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb3JwaGVkTm9kZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUZXh0IG5vZGUgdG8gc29tZXRoaW5nIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbW9ycGhlZE5vZGUgPSB0b05vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1vcnBoZWROb2RlID09PSB0b05vZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBcInRvIG5vZGVcIiB3YXMgbm90IGNvbXBhdGlibGUgd2l0aCB0aGUgXCJmcm9tIG5vZGVcIiBzbyB3ZSBoYWQgdG9cbiAgICAgICAgICAgIC8vIHRvc3Mgb3V0IHRoZSBcImZyb20gbm9kZVwiIGFuZCB1c2UgdGhlIFwidG8gbm9kZVwiXG4gICAgICAgICAgICBvbk5vZGVEaXNjYXJkZWQoZnJvbU5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRvTm9kZS5pc1NhbWVOb2RlICYmIHRvTm9kZS5pc1NhbWVOb2RlKG1vcnBoZWROb2RlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbW9ycGhFbChtb3JwaGVkTm9kZSwgdG9Ob2RlLCBjaGlsZHJlbk9ubHkpO1xuXG4gICAgICAgICAgICAvLyBXZSBub3cgbmVlZCB0byBsb29wIG92ZXIgYW55IGtleWVkIG5vZGVzIHRoYXQgbWlnaHQgbmVlZCB0byBiZVxuICAgICAgICAgICAgLy8gcmVtb3ZlZC4gV2Ugb25seSBkbyB0aGUgcmVtb3ZhbCBpZiB3ZSBrbm93IHRoYXQgdGhlIGtleWVkIG5vZGVcbiAgICAgICAgICAgIC8vIG5ldmVyIGZvdW5kIGEgbWF0Y2guIFdoZW4gYSBrZXllZCBub2RlIGlzIG1hdGNoZWQgdXAgd2UgcmVtb3ZlXG4gICAgICAgICAgICAvLyBpdCBvdXQgb2YgZnJvbU5vZGVzTG9va3VwIGFuZCB3ZSB1c2UgZnJvbU5vZGVzTG9va3VwIHRvIGRldGVybWluZVxuICAgICAgICAgICAgLy8gaWYgYSBrZXllZCBub2RlIGhhcyBiZWVuIG1hdGNoZWQgdXAgb3Igbm90XG4gICAgICAgICAgICBpZiAoa2V5ZWRSZW1vdmFsTGlzdCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MCwgbGVuPWtleWVkUmVtb3ZhbExpc3QubGVuZ3RoOyBpPGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbFRvUmVtb3ZlID0gZnJvbU5vZGVzTG9va3VwW2tleWVkUmVtb3ZhbExpc3RbaV1dO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxUb1JlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShlbFRvUmVtb3ZlLCBlbFRvUmVtb3ZlLnBhcmVudE5vZGUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hpbGRyZW5Pbmx5ICYmIG1vcnBoZWROb2RlICE9PSBmcm9tTm9kZSAmJiBmcm9tTm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBpZiAobW9ycGhlZE5vZGUuYWN0dWFsaXplKSB7XG4gICAgICAgICAgICAgICAgbW9ycGhlZE5vZGUgPSBtb3JwaGVkTm9kZS5hY3R1YWxpemUoZnJvbU5vZGUub3duZXJEb2N1bWVudCB8fCBkb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgd2UgaGFkIHRvIHN3YXAgb3V0IHRoZSBmcm9tIG5vZGUgd2l0aCBhIG5ldyBub2RlIGJlY2F1c2UgdGhlIG9sZFxuICAgICAgICAgICAgLy8gbm9kZSB3YXMgbm90IGNvbXBhdGlibGUgd2l0aCB0aGUgdGFyZ2V0IG5vZGUgdGhlbiB3ZSBuZWVkIHRvXG4gICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBvbGQgRE9NIG5vZGUgaW4gdGhlIG9yaWdpbmFsIERPTSB0cmVlLiBUaGlzIGlzIG9ubHlcbiAgICAgICAgICAgIC8vIHBvc3NpYmxlIGlmIHRoZSBvcmlnaW5hbCBET00gbm9kZSB3YXMgcGFydCBvZiBhIERPTSB0cmVlIHdoaWNoXG4gICAgICAgICAgICAvLyB3ZSBrbm93IGlzIHRoZSBjYXNlIGlmIGl0IGhhcyBhIHBhcmVudCBub2RlLlxuICAgICAgICAgICAgZnJvbU5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobW9ycGhlZE5vZGUsIGZyb21Ob2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtb3JwaGVkTm9kZTtcbiAgICB9O1xufVxuXG52YXIgbW9ycGhkb20gPSBtb3JwaGRvbUZhY3RvcnkobW9ycGhBdHRycyk7XG5cbm1vZHVsZS5leHBvcnRzID0gbW9ycGhkb207XG4iLCJhc3NlcnQubm90RXF1YWwgPSBub3RFcXVhbFxuYXNzZXJ0Lm5vdE9rID0gbm90T2tcbmFzc2VydC5lcXVhbCA9IGVxdWFsXG5hc3NlcnQub2sgPSBhc3NlcnRcblxubW9kdWxlLmV4cG9ydHMgPSBhc3NlcnRcblxuZnVuY3Rpb24gZXF1YWwgKGEsIGIsIG0pIHtcbiAgYXNzZXJ0KGEgPT0gYiwgbSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuZnVuY3Rpb24gbm90RXF1YWwgKGEsIGIsIG0pIHtcbiAgYXNzZXJ0KGEgIT0gYiwgbSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuZnVuY3Rpb24gbm90T2sgKHQsIG0pIHtcbiAgYXNzZXJ0KCF0LCBtKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHQsIG0pIHtcbiAgaWYgKCF0KSB0aHJvdyBuZXcgRXJyb3IobSB8fCAnQXNzZXJ0aW9uRXJyb3InKVxufVxuIiwiLyogZ2xvYmFsIE11dGF0aW9uT2JzZXJ2ZXIgKi9cbnZhciBkb2N1bWVudCA9IHJlcXVpcmUoJ2dsb2JhbC9kb2N1bWVudCcpXG52YXIgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JylcbnZhciB3YXRjaCA9IE9iamVjdC5jcmVhdGUobnVsbClcbnZhciBLRVlfSUQgPSAnb25sb2FkaWQnICsgKG5ldyBEYXRlKCkgJSA5ZTYpLnRvU3RyaW5nKDM2KVxudmFyIEtFWV9BVFRSID0gJ2RhdGEtJyArIEtFWV9JRFxudmFyIElOREVYID0gMFxuXG5pZiAod2luZG93ICYmIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyKSB7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChtdXRhdGlvbnMpIHtcbiAgICBpZiAoT2JqZWN0LmtleXMod2F0Y2gpLmxlbmd0aCA8IDEpIHJldHVyblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobXV0YXRpb25zW2ldLmF0dHJpYnV0ZU5hbWUgPT09IEtFWV9BVFRSKSB7XG4gICAgICAgIGVhY2hBdHRyKG11dGF0aW9uc1tpXSwgdHVybm9uLCB0dXJub2ZmKVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgZWFjaE11dGF0aW9uKG11dGF0aW9uc1tpXS5yZW1vdmVkTm9kZXMsIHR1cm5vZmYpXG4gICAgICBlYWNoTXV0YXRpb24obXV0YXRpb25zW2ldLmFkZGVkTm9kZXMsIHR1cm5vbilcbiAgICB9XG4gIH0pXG4gIGlmIChkb2N1bWVudC5ib2R5KSB7XG4gICAgYmVnaW5PYnNlcnZlKG9ic2VydmVyKVxuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGJlZ2luT2JzZXJ2ZShvYnNlcnZlcilcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGJlZ2luT2JzZXJ2ZSAob2JzZXJ2ZXIpIHtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZSxcbiAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiB0cnVlLFxuICAgIGF0dHJpYnV0ZUZpbHRlcjogW0tFWV9BVFRSXVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9ubG9hZCAoZWwsIG9uLCBvZmYsIGNhbGxlcikge1xuICBhc3NlcnQoZG9jdW1lbnQuYm9keSwgJ29uLWxvYWQ6IHdpbGwgbm90IHdvcmsgcHJpb3IgdG8gRE9NQ29udGVudExvYWRlZCcpXG4gIG9uID0gb24gfHwgZnVuY3Rpb24gKCkge31cbiAgb2ZmID0gb2ZmIHx8IGZ1bmN0aW9uICgpIHt9XG4gIGVsLnNldEF0dHJpYnV0ZShLRVlfQVRUUiwgJ28nICsgSU5ERVgpXG4gIHdhdGNoWydvJyArIElOREVYXSA9IFtvbiwgb2ZmLCAwLCBjYWxsZXIgfHwgb25sb2FkLmNhbGxlcl1cbiAgSU5ERVggKz0gMVxuICByZXR1cm4gZWxcbn1cblxubW9kdWxlLmV4cG9ydHMuS0VZX0FUVFIgPSBLRVlfQVRUUlxubW9kdWxlLmV4cG9ydHMuS0VZX0lEID0gS0VZX0lEXG5cbmZ1bmN0aW9uIHR1cm5vbiAoaW5kZXgsIGVsKSB7XG4gIGlmICh3YXRjaFtpbmRleF1bMF0gJiYgd2F0Y2hbaW5kZXhdWzJdID09PSAwKSB7XG4gICAgd2F0Y2hbaW5kZXhdWzBdKGVsKVxuICAgIHdhdGNoW2luZGV4XVsyXSA9IDFcbiAgfVxufVxuXG5mdW5jdGlvbiB0dXJub2ZmIChpbmRleCwgZWwpIHtcbiAgaWYgKHdhdGNoW2luZGV4XVsxXSAmJiB3YXRjaFtpbmRleF1bMl0gPT09IDEpIHtcbiAgICB3YXRjaFtpbmRleF1bMV0oZWwpXG4gICAgd2F0Y2hbaW5kZXhdWzJdID0gMFxuICB9XG59XG5cbmZ1bmN0aW9uIGVhY2hBdHRyIChtdXRhdGlvbiwgb24sIG9mZikge1xuICB2YXIgbmV3VmFsdWUgPSBtdXRhdGlvbi50YXJnZXQuZ2V0QXR0cmlidXRlKEtFWV9BVFRSKVxuICBpZiAoc2FtZU9yaWdpbihtdXRhdGlvbi5vbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgd2F0Y2hbbmV3VmFsdWVdID0gd2F0Y2hbbXV0YXRpb24ub2xkVmFsdWVdXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHdhdGNoW211dGF0aW9uLm9sZFZhbHVlXSkge1xuICAgIG9mZihtdXRhdGlvbi5vbGRWYWx1ZSwgbXV0YXRpb24udGFyZ2V0KVxuICB9XG4gIGlmICh3YXRjaFtuZXdWYWx1ZV0pIHtcbiAgICBvbihuZXdWYWx1ZSwgbXV0YXRpb24udGFyZ2V0KVxuICB9XG59XG5cbmZ1bmN0aW9uIHNhbWVPcmlnaW4gKG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICBpZiAoIW9sZFZhbHVlIHx8ICFuZXdWYWx1ZSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB3YXRjaFtvbGRWYWx1ZV1bM10gPT09IHdhdGNoW25ld1ZhbHVlXVszXVxufVxuXG5mdW5jdGlvbiBlYWNoTXV0YXRpb24gKG5vZGVzLCBmbikge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHdhdGNoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLmdldEF0dHJpYnV0ZSAmJiBub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoS0VZX0FUVFIpKSB7XG4gICAgICB2YXIgb25sb2FkaWQgPSBub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoS0VZX0FUVFIpXG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKG9ubG9hZGlkID09PSBrKSB7XG4gICAgICAgICAgZm4oaywgbm9kZXNbaV0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChub2Rlc1tpXS5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGVhY2hNdXRhdGlvbihub2Rlc1tpXS5jaGlsZE5vZGVzLCBmbilcbiAgICB9XG4gIH1cbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5wYWdlID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNhcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG52YXIgcGF0aFRvUmVnZXhwXzEgPSBwYXRoVG9SZWdleHA7XG52YXIgcGFyc2VfMSA9IHBhcnNlO1xudmFyIGNvbXBpbGVfMSA9IGNvbXBpbGU7XG52YXIgdG9rZW5zVG9GdW5jdGlvbl8xID0gdG9rZW5zVG9GdW5jdGlvbjtcbnZhciB0b2tlbnNUb1JlZ0V4cF8xID0gdG9rZW5zVG9SZWdFeHA7XG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKTtcblxuLyoqXG4gKiBQYXJzZSBhIHN0cmluZyBmb3IgdGhlIHJhdyB0b2tlbnMuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5mdW5jdGlvbiBwYXJzZSAoc3RyKSB7XG4gIHZhciB0b2tlbnMgPSBbXTtcbiAgdmFyIGtleSA9IDA7XG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBwYXRoID0gJyc7XG4gIHZhciByZXM7XG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXTtcbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXTtcbiAgICB2YXIgb2Zmc2V0ID0gcmVzLmluZGV4O1xuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpO1xuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGg7XG5cbiAgICAvLyBJZ25vcmUgYWxyZWFkeSBlc2NhcGVkIHNlcXVlbmNlcy5cbiAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgcGF0aCArPSBlc2NhcGVkWzFdO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKTtcbiAgICAgIHBhdGggPSAnJztcbiAgICB9XG5cbiAgICB2YXIgcHJlZml4ID0gcmVzWzJdO1xuICAgIHZhciBuYW1lID0gcmVzWzNdO1xuICAgIHZhciBjYXB0dXJlID0gcmVzWzRdO1xuICAgIHZhciBncm91cCA9IHJlc1s1XTtcbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdO1xuICAgIHZhciBhc3RlcmlzayA9IHJlc1s3XTtcblxuICAgIHZhciByZXBlYXQgPSBzdWZmaXggPT09ICcrJyB8fCBzdWZmaXggPT09ICcqJztcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJztcbiAgICB2YXIgZGVsaW1pdGVyID0gcHJlZml4IHx8ICcvJztcbiAgICB2YXIgcGF0dGVybiA9IGNhcHR1cmUgfHwgZ3JvdXAgfHwgKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBkZWxpbWl0ZXIgKyAnXSs/Jyk7XG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE1hdGNoIGFueSBjaGFyYWN0ZXJzIHN0aWxsIHJlbWFpbmluZy5cbiAgaWYgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIHBhdGggKz0gc3RyLnN1YnN0cihpbmRleCk7XG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpO1xuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpO1xuXG4gIC8vIENvbXBpbGUgYWxsIHRoZSBwYXR0ZXJucyBiZWZvcmUgY29tcGlsYXRpb24uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbnNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXRjaGVzW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0b2tlbnNbaV0ucGF0dGVybiArICckJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcGF0aCA9ICcnO1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGF0aCArPSB0b2tlbjtcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdO1xuICAgICAgdmFyIHNlZ21lbnQ7XG5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBiZSBkZWZpbmVkJylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNhcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCByZXBlYXQsIGJ1dCByZWNlaXZlZCBcIicgKyB2YWx1ZSArICdcIicpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCBiZSBlbXB0eScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWVbal0pO1xuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcblxuICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICB9XG5cbiAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzO1xuICByZXR1cm4gcmVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZsYWdzIGZvciBhIHJlZ2V4cCBmcm9tIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBmbGFncyAob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtSZWdFeHB9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZyk7XG5cbiAgaWYgKGdyb3Vwcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXlzLnB1c2goe1xuICAgICAgICBuYW1lOiBpLFxuICAgICAgICBwcmVmaXg6IG51bGwsXG4gICAgICAgIGRlbGltaXRlcjogbnVsbCxcbiAgICAgICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgICAgICByZXBlYXQ6IGZhbHNlLFxuICAgICAgICBwYXR0ZXJuOiBudWxsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICBwYXJ0cy5wdXNoKHBhdGhUb1JlZ2V4cChwYXRoW2ldLCBrZXlzLCBvcHRpb25zKS5zb3VyY2UpO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKTtcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aCk7XG4gIHZhciByZSA9IHRva2Vuc1RvUmVnRXhwKHRva2Vucywgb3B0aW9ucyk7XG5cbiAgLy8gQXR0YWNoIGtleXMgYmFjayB0byB0aGUgcmVnZXhwLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAga2V5cy5wdXNoKHRva2Vuc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3Q7XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2U7XG4gIHZhciByb3V0ZSA9ICcnO1xuICB2YXIgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcbiAgdmFyIGVuZHNXaXRoU2xhc2ggPSB0eXBlb2YgbGFzdFRva2VuID09PSAnc3RyaW5nJyAmJiAvXFwvJC8udGVzdChsYXN0VG9rZW4pO1xuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwcmVmaXggPSBlc2NhcGVTdHJpbmcodG9rZW4ucHJlZml4KTtcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVybjtcblxuICAgICAgaWYgKHRva2VuLnJlcGVhdCkge1xuICAgICAgICBjYXB0dXJlICs9ICcoPzonICsgcHJlZml4ICsgY2FwdHVyZSArICcpKic7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAocHJlZml4KSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/JztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSc7XG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmU7XG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/JztcbiAgfVxuXG4gIGlmIChlbmQpIHtcbiAgICByb3V0ZSArPSAnJCc7XG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aFNsYXNoID8gJycgOiAnKD89XFxcXC98JCknO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdO1xuXG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSBrZXlzO1xuICAgIGtleXMgPSBbXTtcbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbn1cblxucGF0aFRvUmVnZXhwXzEucGFyc2UgPSBwYXJzZV8xO1xucGF0aFRvUmVnZXhwXzEuY29tcGlsZSA9IGNvbXBpbGVfMTtcbnBhdGhUb1JlZ2V4cF8xLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXzE7XG5wYXRoVG9SZWdleHBfMS50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXzE7XG5cbi8qKlxuICAgKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICAgKi9cblxuICBcblxuICAvKipcbiAgICogU2hvcnQtY3V0cyBmb3IgZ2xvYmFsLW9iamVjdCBjaGVja3NcbiAgICovXG5cbiAgdmFyIGhhc0RvY3VtZW50ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQpO1xuICB2YXIgaGFzV2luZG93ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KTtcbiAgdmFyIGhhc0hpc3RvcnkgPSAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBoaXN0b3J5KTtcbiAgdmFyIGhhc1Byb2Nlc3MgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCc7XG5cbiAgLyoqXG4gICAqIERldGVjdCBjbGljayBldmVudFxuICAgKi9cbiAgdmFyIGNsaWNrRXZlbnQgPSBoYXNEb2N1bWVudCAmJiBkb2N1bWVudC5vbnRvdWNoc3RhcnQgPyAndG91Y2hzdGFydCcgOiAnY2xpY2snO1xuXG4gIC8qKlxuICAgKiBUbyB3b3JrIHByb3Blcmx5IHdpdGggdGhlIFVSTFxuICAgKiBoaXN0b3J5LmxvY2F0aW9uIGdlbmVyYXRlZCBwb2x5ZmlsbCBpbiBodHRwczovL2dpdGh1Yi5jb20vZGV2b3RlL0hUTUw1LUhpc3RvcnktQVBJXG4gICAqL1xuXG4gIHZhciBpc0xvY2F0aW9uID0gaGFzV2luZG93ICYmICEhKHdpbmRvdy5oaXN0b3J5LmxvY2F0aW9uIHx8IHdpbmRvdy5sb2NhdGlvbik7XG5cbiAgLyoqXG4gICAqIFRoZSBwYWdlIGluc3RhbmNlXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gUGFnZSgpIHtcbiAgICAvLyBwdWJsaWMgdGhpbmdzXG4gICAgdGhpcy5jYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLmV4aXRzID0gW107XG4gICAgdGhpcy5jdXJyZW50ID0gJyc7XG4gICAgdGhpcy5sZW4gPSAwO1xuXG4gICAgLy8gcHJpdmF0ZSB0aGluZ3NcbiAgICB0aGlzLl9kZWNvZGVVUkxDb21wb25lbnRzID0gdHJ1ZTtcbiAgICB0aGlzLl9iYXNlID0gJyc7XG4gICAgdGhpcy5fc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX2hhc2hiYW5nID0gZmFsc2U7XG5cbiAgICAvLyBib3VuZCBmdW5jdGlvbnNcbiAgICB0aGlzLmNsaWNrSGFuZGxlciA9IHRoaXMuY2xpY2tIYW5kbGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fb25wb3BzdGF0ZSA9IHRoaXMuX29ucG9wc3RhdGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgdGhlIGluc3RhbmNlIG9mIHBhZ2UuIFRoaXMgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgUGFnZS5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXMuX3dpbmRvdyA9IG9wdHMud2luZG93IHx8IChoYXNXaW5kb3cgJiYgd2luZG93KTtcbiAgICB0aGlzLl9kZWNvZGVVUkxDb21wb25lbnRzID0gb3B0cy5kZWNvZGVVUkxDb21wb25lbnRzICE9PSBmYWxzZTtcbiAgICB0aGlzLl9wb3BzdGF0ZSA9IG9wdHMucG9wc3RhdGUgIT09IGZhbHNlICYmIGhhc1dpbmRvdztcbiAgICB0aGlzLl9jbGljayA9IG9wdHMuY2xpY2sgIT09IGZhbHNlICYmIGhhc0RvY3VtZW50O1xuICAgIHRoaXMuX2hhc2hiYW5nID0gISFvcHRzLmhhc2hiYW5nO1xuXG4gICAgdmFyIF93aW5kb3cgPSB0aGlzLl93aW5kb3c7XG4gICAgaWYodGhpcy5fcG9wc3RhdGUpIHtcbiAgICAgIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9vbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmKGhhc1dpbmRvdykge1xuICAgICAgX3dpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuX29ucG9wc3RhdGUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY2xpY2spIHtcbiAgICAgIF93aW5kb3cuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihjbGlja0V2ZW50LCB0aGlzLmNsaWNrSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZihoYXNEb2N1bWVudCkge1xuICAgICAgX3dpbmRvdy5kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIHRoaXMuY2xpY2tIYW5kbGVyLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYodGhpcy5faGFzaGJhbmcgJiYgaGFzV2luZG93ICYmICFoYXNIaXN0b3J5KSB7XG4gICAgICBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCB0aGlzLl9vbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmKGhhc1dpbmRvdykge1xuICAgICAgX3dpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgdGhpcy5fb25wb3BzdGF0ZSwgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogR2V0IG9yIHNldCBiYXNlcGF0aCB0byBgcGF0aGAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFBhZ2UucHJvdG90eXBlLmJhc2UgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9iYXNlO1xuICAgIHRoaXMuX2Jhc2UgPSBwYXRoO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBgYmFzZWAsIHdoaWNoIGRlcGVuZHMgb24gd2hldGhlciB3ZSBhcmUgdXNpbmcgSGlzdG9yeSBvclxuICAgKiBoYXNoYmFuZyByb3V0aW5nLlxuXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgUGFnZS5wcm90b3R5cGUuX2dldEJhc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmFzZSA9IHRoaXMuX2Jhc2U7XG4gICAgaWYoISFiYXNlKSByZXR1cm4gYmFzZTtcbiAgICB2YXIgbG9jID0gaGFzV2luZG93ICYmIHRoaXMuX3dpbmRvdyAmJiB0aGlzLl93aW5kb3cubG9jYXRpb247XG5cbiAgICBpZihoYXNXaW5kb3cgJiYgdGhpcy5faGFzaGJhbmcgJiYgbG9jICYmIGxvYy5wcm90b2NvbCA9PT0gJ2ZpbGU6Jykge1xuICAgICAgYmFzZSA9IGxvYy5wYXRobmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYmFzZTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IG9yIHNldCBzdHJpY3QgcGF0aCBtYXRjaGluZyB0byBgZW5hYmxlYFxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGVuYWJsZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5zdHJpY3QgPSBmdW5jdGlvbihlbmFibGUpIHtcbiAgICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3N0cmljdDtcbiAgICB0aGlzLl9zdHJpY3QgPSBlbmFibGU7XG4gIH07XG5cblxuICAvKipcbiAgICogQmluZCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgIC0gYGNsaWNrYCBiaW5kIHRvIGNsaWNrIGV2ZW50cyBbdHJ1ZV1cbiAgICogICAgLSBgcG9wc3RhdGVgIGJpbmQgdG8gcG9wc3RhdGUgW3RydWVdXG4gICAqICAgIC0gYGRpc3BhdGNoYCBwZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2ggW3RydWVdXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFBhZ2UucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmNvbmZpZ3VyZShvcHRzKTtcblxuICAgIGlmIChmYWxzZSA9PT0gb3B0cy5kaXNwYXRjaCkgcmV0dXJuO1xuICAgIHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIHVybDtcbiAgICBpZihpc0xvY2F0aW9uKSB7XG4gICAgICB2YXIgd2luZG93ID0gdGhpcy5fd2luZG93O1xuICAgICAgdmFyIGxvYyA9IHdpbmRvdy5sb2NhdGlvbjtcblxuICAgICAgaWYodGhpcy5faGFzaGJhbmcgJiYgfmxvYy5oYXNoLmluZGV4T2YoJyMhJykpIHtcbiAgICAgICAgdXJsID0gbG9jLmhhc2guc3Vic3RyKDIpICsgbG9jLnNlYXJjaDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzaGJhbmcpIHtcbiAgICAgICAgdXJsID0gbG9jLnNlYXJjaCArIGxvYy5oYXNoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJsID0gbG9jLnBhdGhuYW1lICsgbG9jLnNlYXJjaCArIGxvYy5oYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmVwbGFjZSh1cmwsIG51bGwsIHRydWUsIG9wdHMuZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl9ydW5uaW5nKSByZXR1cm47XG4gICAgdGhpcy5jdXJyZW50ID0gJyc7XG4gICAgdGhpcy5sZW4gPSAwO1xuICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcblxuICAgIHZhciB3aW5kb3cgPSB0aGlzLl93aW5kb3c7XG4gICAgdGhpcy5fY2xpY2sgJiYgd2luZG93LmRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgdGhpcy5jbGlja0hhbmRsZXIsIGZhbHNlKTtcbiAgICBoYXNXaW5kb3cgJiYgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5fb25wb3BzdGF0ZSwgZmFsc2UpO1xuICAgIGhhc1dpbmRvdyAmJiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHRoaXMuX29ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBzdGF0ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBkaXNwYXRjaFxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBwdXNoXG4gICAqIEByZXR1cm4geyFDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoLCBwdXNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlLCB0aGlzKSxcbiAgICAgIHByZXYgPSB0aGlzLnByZXZDb250ZXh0O1xuICAgIHRoaXMucHJldkNvbnRleHQgPSBjdHg7XG4gICAgdGhpcy5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgdGhpcy5kaXNwYXRjaChjdHgsIHByZXYpO1xuICAgIGlmIChmYWxzZSAhPT0gY3R4LmhhbmRsZWQgJiYgZmFsc2UgIT09IHB1c2gpIGN0eC5wdXNoU3RhdGUoKTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBHb2VzIGJhY2sgaW4gdGhlIGhpc3RvcnlcbiAgICogQmFjayBzaG91bGQgYWx3YXlzIGxldCB0aGUgY3VycmVudCByb3V0ZSBwdXNoIHN0YXRlIGFuZCB0aGVuIGdvIGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gZmFsbGJhY2sgcGF0aCB0byBnbyBiYWNrIGlmIG5vIG1vcmUgaGlzdG9yeSBleGlzdHMsIGlmIHVuZGVmaW5lZCBkZWZhdWx0cyB0byBwYWdlLmJhc2VcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5iYWNrID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUpIHtcbiAgICB2YXIgcGFnZSA9IHRoaXM7XG4gICAgaWYgKHRoaXMubGVuID4gMCkge1xuICAgICAgdmFyIHdpbmRvdyA9IHRoaXMuX3dpbmRvdztcbiAgICAgIC8vIHRoaXMgbWF5IG5lZWQgbW9yZSB0ZXN0aW5nIHRvIHNlZSBpZiBhbGwgYnJvd3NlcnNcbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXh0IHRpY2sgdG8gZ28gYmFjayBpbiBoaXN0b3J5XG4gICAgICBoYXNIaXN0b3J5ICYmIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICAgIHRoaXMubGVuLS07XG4gICAgfSBlbHNlIGlmIChwYXRoKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3cocGF0aCwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhwYWdlLl9nZXRCYXNlKCksIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgcm91dGUgdG8gcmVkaXJlY3QgZnJvbSBvbmUgcGF0aCB0byBvdGhlclxuICAgKiBvciBqdXN0IHJlZGlyZWN0IHRvIGFub3RoZXIgcm91dGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZyb20gLSBpZiBwYXJhbSAndG8nIGlzIHVuZGVmaW5lZCByZWRpcmVjdHMgdG8gJ2Zyb20nXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gdG9cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIFBhZ2UucHJvdG90eXBlLnJlZGlyZWN0ID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICB2YXIgaW5zdCA9IHRoaXM7XG5cbiAgICAvLyBEZWZpbmUgcm91dGUgZnJvbSBhIHBhdGggdG8gYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3N0cmluZycgPT09IHR5cGVvZiB0bykge1xuICAgICAgcGFnZS5jYWxsKHRoaXMsIGZyb20sIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpbnN0LnJlcGxhY2UoLyoqIEB0eXBlIHshc3RyaW5nfSAqLyAodG8pKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciB0aGUgcHVzaCBzdGF0ZSBhbmQgcmVwbGFjZSBpdCB3aXRoIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICd1bmRlZmluZWQnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGluc3QucmVwbGFjZShmcm9tKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVwbGFjZSBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBzdGF0ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW49fSBpbml0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGRpc3BhdGNoXG4gICAqIEByZXR1cm4geyFDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuXG4gIFBhZ2UucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgaW5pdCwgZGlzcGF0Y2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUsIHRoaXMpLFxuICAgICAgcHJldiA9IHRoaXMucHJldkNvbnRleHQ7XG4gICAgdGhpcy5wcmV2Q29udGV4dCA9IGN0eDtcbiAgICB0aGlzLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBjdHguaW5pdCA9IGluaXQ7XG4gICAgY3R4LnNhdmUoKTsgLy8gc2F2ZSBiZWZvcmUgZGlzcGF0Y2hpbmcsIHdoaWNoIG1heSByZWRpcmVjdFxuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHRoaXMuZGlzcGF0Y2goY3R4LCBwcmV2KTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCB0aGUgZ2l2ZW4gYGN0eGAuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29udGV4dH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKGN0eCwgcHJldikge1xuICAgIHZhciBpID0gMCwgaiA9IDAsIHBhZ2UgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbmV4dEV4aXQoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmV4aXRzW2orK107XG4gICAgICBpZiAoIWZuKSByZXR1cm4gbmV4dEVudGVyKCk7XG4gICAgICBmbihwcmV2LCBuZXh0RXhpdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV4dEVudGVyKCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5jYWxsYmFja3NbaSsrXTtcblxuICAgICAgaWYgKGN0eC5wYXRoICE9PSBwYWdlLmN1cnJlbnQpIHtcbiAgICAgICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFmbikgcmV0dXJuIHVuaGFuZGxlZC5jYWxsKHBhZ2UsIGN0eCk7XG4gICAgICBmbihjdHgsIG5leHRFbnRlcik7XG4gICAgfVxuXG4gICAgaWYgKHByZXYpIHtcbiAgICAgIG5leHRFeGl0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRFbnRlcigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gZXhpdCByb3V0ZSBvbiBgcGF0aGAgd2l0aFxuICAgKiBjYWxsYmFjayBgZm4oKWAsIHdoaWNoIHdpbGwgYmUgY2FsbGVkXG4gICAqIG9uIHRoZSBwcmV2aW91cyBjb250ZXh0IHdoZW4gYSBuZXdcbiAgICogcGFnZSBpcyB2aXNpdGVkLlxuICAgKi9cbiAgUGFnZS5wcm90b3R5cGUuZXhpdCA9IGZ1bmN0aW9uKHBhdGgsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGl0KCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgsIG51bGwsIHRoaXMpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB0aGlzLmV4aXRzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcImNsaWNrXCIgZXZlbnRzLlxuICAgKi9cblxuICAvKiBqc2hpbnQgK1cwNTQgKi9cbiAgUGFnZS5wcm90b3R5cGUuY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuICAgIGlmICgxICE9PSB0aGlzLl93aGljaChlKSkgcmV0dXJuO1xuXG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkgfHwgZS5zaGlmdEtleSkgcmV0dXJuO1xuICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBsaW5rXG4gICAgLy8gdXNlIHNoYWRvdyBkb20gd2hlbiBhdmFpbGFibGUgaWYgbm90LCBmYWxsIGJhY2sgdG8gY29tcG9zZWRQYXRoKClcbiAgICAvLyBmb3IgYnJvd3NlcnMgdGhhdCBvbmx5IGhhdmUgc2hhZHlcbiAgICB2YXIgZWwgPSBlLnRhcmdldDtcbiAgICB2YXIgZXZlbnRQYXRoID0gZS5wYXRoIHx8IChlLmNvbXBvc2VkUGF0aCA/IGUuY29tcG9zZWRQYXRoKCkgOiBudWxsKTtcblxuICAgIGlmKGV2ZW50UGF0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFldmVudFBhdGhbaV0ubm9kZU5hbWUpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZXZlbnRQYXRoW2ldLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgIT09ICdBJykgY29udGludWU7XG4gICAgICAgIGlmICghZXZlbnRQYXRoW2ldLmhyZWYpIGNvbnRpbnVlO1xuXG4gICAgICAgIGVsID0gZXZlbnRQYXRoW2ldO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb250aW51ZSBlbnN1cmUgbGlua1xuICAgIC8vIGVsLm5vZGVOYW1lIGZvciBzdmcgbGlua3MgYXJlICdhJyBpbnN0ZWFkIG9mICdBJ1xuICAgIHdoaWxlIChlbCAmJiAnQScgIT09IGVsLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkpIGVsID0gZWwucGFyZW50Tm9kZTtcbiAgICBpZiAoIWVsIHx8ICdBJyAhPT0gZWwubm9kZU5hbWUudG9VcHBlckNhc2UoKSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgaWYgbGluayBpcyBpbnNpZGUgYW4gc3ZnXG4gICAgLy8gaW4gdGhpcyBjYXNlLCBib3RoIGhyZWYgYW5kIHRhcmdldCBhcmUgYWx3YXlzIGluc2lkZSBhbiBvYmplY3RcbiAgICB2YXIgc3ZnID0gKHR5cGVvZiBlbC5ocmVmID09PSAnb2JqZWN0JykgJiYgZWwuaHJlZi5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU1ZHQW5pbWF0ZWRTdHJpbmcnO1xuXG4gICAgLy8gSWdub3JlIGlmIHRhZyBoYXNcbiAgICAvLyAxLiBcImRvd25sb2FkXCIgYXR0cmlidXRlXG4gICAgLy8gMi4gcmVsPVwiZXh0ZXJuYWxcIiBhdHRyaWJ1dGVcbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYoIXRoaXMuX2hhc2hiYW5nICYmIHRoaXMuX3NhbWVQYXRoKGVsKSAmJiAoZWwuaGFzaCB8fCAnIycgPT09IGxpbmspKSByZXR1cm47XG5cbiAgICAvLyBDaGVjayBmb3IgbWFpbHRvOiBpbiB0aGUgaHJlZlxuICAgIGlmIChsaW5rICYmIGxpbmsuaW5kZXhPZignbWFpbHRvOicpID4gLTEpIHJldHVybjtcblxuICAgIC8vIGNoZWNrIHRhcmdldFxuICAgIC8vIHN2ZyB0YXJnZXQgaXMgYW4gb2JqZWN0IGFuZCBpdHMgZGVzaXJlZCB2YWx1ZSBpcyBpbiAuYmFzZVZhbCBwcm9wZXJ0eVxuICAgIGlmIChzdmcgPyBlbC50YXJnZXQuYmFzZVZhbCA6IGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICAvLyBub3RlOiBzdmcgbGlua3MgdGhhdCBhcmUgbm90IHJlbGF0aXZlIGRvbid0IGNhbGwgY2xpY2sgZXZlbnRzIChhbmQgc2tpcCBwYWdlLmpzKVxuICAgIC8vIGNvbnNlcXVlbnRseSwgYWxsIHN2ZyBsaW5rcyB0ZXN0ZWQgaW5zaWRlIHBhZ2UuanMgYXJlIHJlbGF0aXZlIGFuZCBpbiB0aGUgc2FtZSBvcmlnaW5cbiAgICBpZiAoIXN2ZyAmJiAhdGhpcy5zYW1lT3JpZ2luKGVsLmhyZWYpKSByZXR1cm47XG5cbiAgICAvLyByZWJ1aWxkIHBhdGhcbiAgICAvLyBUaGVyZSBhcmVuJ3QgLnBhdGhuYW1lIGFuZCAuc2VhcmNoIHByb3BlcnRpZXMgaW4gc3ZnIGxpbmtzLCBzbyB3ZSB1c2UgaHJlZlxuICAgIC8vIEFsc28sIHN2ZyBocmVmIGlzIGFuIG9iamVjdCBhbmQgaXRzIGRlc2lyZWQgdmFsdWUgaXMgaW4gLmJhc2VWYWwgcHJvcGVydHlcbiAgICB2YXIgcGF0aCA9IHN2ZyA/IGVsLmhyZWYuYmFzZVZhbCA6IChlbC5wYXRobmFtZSArIGVsLnNlYXJjaCArIChlbC5oYXNoIHx8ICcnKSk7XG5cbiAgICBwYXRoID0gcGF0aFswXSAhPT0gJy8nID8gJy8nICsgcGF0aCA6IHBhdGg7XG5cbiAgICAvLyBzdHJpcCBsZWFkaW5nIFwiL1tkcml2ZSBsZXR0ZXJdOlwiIG9uIE5XLmpzIG9uIFdpbmRvd3NcbiAgICBpZiAoaGFzUHJvY2VzcyAmJiBwYXRoLm1hdGNoKC9eXFwvW2EtekEtWl06XFwvLykpIHtcbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9bYS16QS1aXTpcXC8vLCAnLycpO1xuICAgIH1cblxuICAgIC8vIHNhbWUgcGFnZVxuICAgIHZhciBvcmlnID0gcGF0aDtcbiAgICB2YXIgcGFnZUJhc2UgPSB0aGlzLl9nZXRCYXNlKCk7XG5cbiAgICBpZiAocGF0aC5pbmRleE9mKHBhZ2VCYXNlKSA9PT0gMCkge1xuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKHBhZ2VCYXNlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2hhc2hiYW5nKSBwYXRoID0gcGF0aC5yZXBsYWNlKCcjIScsICcnKTtcblxuICAgIGlmIChwYWdlQmFzZSAmJiBvcmlnID09PSBwYXRoICYmICghaXNMb2NhdGlvbiB8fCB0aGlzLl93aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgIT09ICdmaWxlOicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuc2hvdyhvcmlnKTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIFwicG9wdWxhdGVcIiBldmVudHMuXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBQYWdlLnByb3RvdHlwZS5fb25wb3BzdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIGlmICggISBoYXNXaW5kb3cgKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge307XG4gICAgfVxuICAgIGlmIChoYXNEb2N1bWVudCAmJiBkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICBsb2FkZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBvbnBvcHN0YXRlKGUpIHtcbiAgICAgIGlmICghbG9hZGVkKSByZXR1cm47XG4gICAgICB2YXIgcGFnZSA9IHRoaXM7XG4gICAgICBpZiAoZS5zdGF0ZSkge1xuICAgICAgICB2YXIgcGF0aCA9IGUuc3RhdGUucGF0aDtcbiAgICAgICAgcGFnZS5yZXBsYWNlKHBhdGgsIGUuc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChpc0xvY2F0aW9uKSB7XG4gICAgICAgIHZhciBsb2MgPSBwYWdlLl93aW5kb3cubG9jYXRpb247XG4gICAgICAgIHBhZ2Uuc2hvdyhsb2MucGF0aG5hbWUgKyBsb2Muc2VhcmNoICsgbG9jLmhhc2gsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoKTtcblxuICAvKipcbiAgICogRXZlbnQgYnV0dG9uLlxuICAgKi9cbiAgUGFnZS5wcm90b3R5cGUuX3doaWNoID0gZnVuY3Rpb24oZSkge1xuICAgIGUgPSBlIHx8IChoYXNXaW5kb3cgJiYgdGhpcy5fd2luZG93LmV2ZW50KTtcbiAgICByZXR1cm4gbnVsbCA9PSBlLndoaWNoID8gZS5idXR0b24gOiBlLndoaWNoO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRvIGEgVVJMIG9iamVjdFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIFBhZ2UucHJvdG90eXBlLl90b1VSTCA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgd2luZG93ID0gdGhpcy5fd2luZG93O1xuICAgIGlmKHR5cGVvZiBVUkwgPT09ICdmdW5jdGlvbicgJiYgaXNMb2NhdGlvbikge1xuICAgICAgcmV0dXJuIG5ldyBVUkwoaHJlZiwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCkpO1xuICAgIH0gZWxzZSBpZiAoaGFzRG9jdW1lbnQpIHtcbiAgICAgIHZhciBhbmMgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgYW5jLmhyZWYgPSBocmVmO1xuICAgICAgcmV0dXJuIGFuYztcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGBocmVmYCBpcyB0aGUgc2FtZSBvcmlnaW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBocmVmXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBQYWdlLnByb3RvdHlwZS5zYW1lT3JpZ2luID0gZnVuY3Rpb24oaHJlZikge1xuICAgIGlmKCFocmVmIHx8ICFpc0xvY2F0aW9uKSByZXR1cm4gZmFsc2U7XG5cbiAgICB2YXIgdXJsID0gdGhpcy5fdG9VUkwoaHJlZik7XG4gICAgdmFyIHdpbmRvdyA9IHRoaXMuX3dpbmRvdztcblxuICAgIHZhciBsb2MgPSB3aW5kb3cubG9jYXRpb247XG5cbiAgICAvKlxuICAgICAgIFdoZW4gdGhlIHBvcnQgaXMgdGhlIGRlZmF1bHQgaHR0cCBwb3J0IDgwIGZvciBodHRwLCBvciA0NDMgZm9yXG4gICAgICAgaHR0cHMsIGludGVybmV0IGV4cGxvcmVyIDExIHJldHVybnMgYW4gZW1wdHkgc3RyaW5nIGZvciBsb2MucG9ydCxcbiAgICAgICBzbyB3ZSBuZWVkIHRvIGNvbXBhcmUgbG9jLnBvcnQgd2l0aCBhbiBlbXB0eSBzdHJpbmcgaWYgdXJsLnBvcnRcbiAgICAgICBpcyB0aGUgZGVmYXVsdCBwb3J0IDgwIG9yIDQ0My5cbiAgICAgICBBbHNvIHRoZSBjb21wYXJpdGlvbiB3aXRoIGBwb3J0YCBpcyBjaGFuZ2VkIGZyb20gYD09PWAgdG8gYD09YCBiZWNhdXNlXG4gICAgICAgYHBvcnRgIGNhbiBiZSBhIHN0cmluZyBzb21ldGltZXMuIFRoaXMgb25seSBhcHBsaWVzIHRvIGllMTEuXG4gICAgKi9cbiAgICByZXR1cm4gbG9jLnByb3RvY29sID09PSB1cmwucHJvdG9jb2wgJiZcbiAgICAgIGxvYy5ob3N0bmFtZSA9PT0gdXJsLmhvc3RuYW1lICYmXG4gICAgICAobG9jLnBvcnQgPT09IHVybC5wb3J0IHx8IGxvYy5wb3J0ID09PSAnJyAmJiAodXJsLnBvcnQgPT0gODAgfHwgdXJsLnBvcnQgPT0gNDQzKSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICB9O1xuXG4gIC8qKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIFBhZ2UucHJvdG90eXBlLl9zYW1lUGF0aCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIGlmKCFpc0xvY2F0aW9uKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHdpbmRvdyA9IHRoaXMuX3dpbmRvdztcbiAgICB2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uO1xuICAgIHJldHVybiB1cmwucGF0aG5hbWUgPT09IGxvYy5wYXRobmFtZSAmJlxuICAgICAgdXJsLnNlYXJjaCA9PT0gbG9jLnNlYXJjaDtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIFVSTCBlbmNvZGluZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAgICogQWNjb21tb2RhdGVzIHdoaXRlc3BhY2UgaW4gYm90aCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICogYW5kIHJlZ3VsYXIgcGVyY2VudC1lbmNvZGVkIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWwgLSBVUkwgY29tcG9uZW50IHRvIGRlY29kZVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIFBhZ2UucHJvdG90eXBlLl9kZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50ID0gZnVuY3Rpb24odmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7IHJldHVybiB2YWw7IH1cbiAgICByZXR1cm4gdGhpcy5fZGVjb2RlVVJMQ29tcG9uZW50cyA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWwucmVwbGFjZSgvXFwrL2csICcgJykpIDogdmFsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYHBhZ2VgIGluc3RhbmNlIGFuZCBmdW5jdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlUGFnZSgpIHtcbiAgICB2YXIgcGFnZUluc3RhbmNlID0gbmV3IFBhZ2UoKTtcblxuICAgIGZ1bmN0aW9uIHBhZ2VGbigvKiBhcmdzICovKSB7XG4gICAgICByZXR1cm4gcGFnZS5hcHBseShwYWdlSW5zdGFuY2UsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgLy8gQ29weSBhbGwgb2YgdGhlIHRoaW5ncyBvdmVyLiBJbiAyLjAgbWF5YmUgd2UgdXNlIHNldFByb3RvdHlwZU9mXG4gICAgcGFnZUZuLmNhbGxiYWNrcyA9IHBhZ2VJbnN0YW5jZS5jYWxsYmFja3M7XG4gICAgcGFnZUZuLmV4aXRzID0gcGFnZUluc3RhbmNlLmV4aXRzO1xuICAgIHBhZ2VGbi5iYXNlID0gcGFnZUluc3RhbmNlLmJhc2UuYmluZChwYWdlSW5zdGFuY2UpO1xuICAgIHBhZ2VGbi5zdHJpY3QgPSBwYWdlSW5zdGFuY2Uuc3RyaWN0LmJpbmQocGFnZUluc3RhbmNlKTtcbiAgICBwYWdlRm4uc3RhcnQgPSBwYWdlSW5zdGFuY2Uuc3RhcnQuYmluZChwYWdlSW5zdGFuY2UpO1xuICAgIHBhZ2VGbi5zdG9wID0gcGFnZUluc3RhbmNlLnN0b3AuYmluZChwYWdlSW5zdGFuY2UpO1xuICAgIHBhZ2VGbi5zaG93ID0gcGFnZUluc3RhbmNlLnNob3cuYmluZChwYWdlSW5zdGFuY2UpO1xuICAgIHBhZ2VGbi5iYWNrID0gcGFnZUluc3RhbmNlLmJhY2suYmluZChwYWdlSW5zdGFuY2UpO1xuICAgIHBhZ2VGbi5yZWRpcmVjdCA9IHBhZ2VJbnN0YW5jZS5yZWRpcmVjdC5iaW5kKHBhZ2VJbnN0YW5jZSk7XG4gICAgcGFnZUZuLnJlcGxhY2UgPSBwYWdlSW5zdGFuY2UucmVwbGFjZS5iaW5kKHBhZ2VJbnN0YW5jZSk7XG4gICAgcGFnZUZuLmRpc3BhdGNoID0gcGFnZUluc3RhbmNlLmRpc3BhdGNoLmJpbmQocGFnZUluc3RhbmNlKTtcbiAgICBwYWdlRm4uZXhpdCA9IHBhZ2VJbnN0YW5jZS5leGl0LmJpbmQocGFnZUluc3RhbmNlKTtcbiAgICBwYWdlRm4uY29uZmlndXJlID0gcGFnZUluc3RhbmNlLmNvbmZpZ3VyZS5iaW5kKHBhZ2VJbnN0YW5jZSk7XG4gICAgcGFnZUZuLnNhbWVPcmlnaW4gPSBwYWdlSW5zdGFuY2Uuc2FtZU9yaWdpbi5iaW5kKHBhZ2VJbnN0YW5jZSk7XG4gICAgcGFnZUZuLmNsaWNrSGFuZGxlciA9IHBhZ2VJbnN0YW5jZS5jbGlja0hhbmRsZXIuYmluZChwYWdlSW5zdGFuY2UpO1xuXG4gICAgcGFnZUZuLmNyZWF0ZSA9IGNyZWF0ZVBhZ2U7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocGFnZUZuLCAnbGVuJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gcGFnZUluc3RhbmNlLmxlbjtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBwYWdlSW5zdGFuY2UubGVuID0gdmFsO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBhZ2VGbiwgJ2N1cnJlbnQnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBwYWdlSW5zdGFuY2UuY3VycmVudDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBwYWdlSW5zdGFuY2UuY3VycmVudCA9IHZhbDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEluIDIuMCB0aGVzZSBjYW4gYmUgbmFtZWQgZXhwb3J0c1xuICAgIHBhZ2VGbi5Db250ZXh0ID0gQ29udGV4dDtcbiAgICBwYWdlRm4uUm91dGUgPSBSb3V0ZTtcblxuICAgIHJldHVybiBwYWdlRm47XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYHBhdGhgIHdpdGggY2FsbGJhY2sgYGZuKClgLFxuICAgKiBvciByb3V0ZSBgcGF0aGAsIG9yIHJlZGlyZWN0aW9uLFxuICAgKiBvciBgcGFnZS5zdGFydCgpYC5cbiAgICpcbiAgICogICBwYWdlKGZuKTtcbiAgICogICBwYWdlKCcqJywgZm4pO1xuICAgKiAgIHBhZ2UoJy91c2VyLzppZCcsIGxvYWQsIHVzZXIpO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkLCB7IHNvbWU6ICd0aGluZycgfSk7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQpO1xuICAgKiAgIHBhZ2UoJy9mcm9tJywgJy90bycpXG4gICAqICAgcGFnZSgpO1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3whRnVuY3Rpb258IU9iamVjdH0gcGF0aFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9uPX0gZm5cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gcGFnZShwYXRoLCBmbikge1xuICAgIC8vIDxjYWxsYmFjaz5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHJldHVybiBwYWdlLmNhbGwodGhpcywgJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyByb3V0ZSA8cGF0aD4gdG8gPGNhbGxiYWNrIC4uLj5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZuKSB7XG4gICAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChwYXRoKSwgbnVsbCwgdGhpcyk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgICB9XG4gICAgICAvLyBzaG93IDxwYXRoPiB3aXRoIFtzdGF0ZV1cbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgdGhpc1snc3RyaW5nJyA9PT0gdHlwZW9mIGZuID8gJ3JlZGlyZWN0JyA6ICdzaG93J10ocGF0aCwgZm4pO1xuICAgICAgLy8gc3RhcnQgW29wdGlvbnNdXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhcnQocGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaGFuZGxlZCBgY3R4YC4gV2hlbiBpdCdzIG5vdCB0aGUgaW5pdGlhbFxuICAgKiBwb3BzdGF0ZSB0aGVuIHJlZGlyZWN0LiBJZiB5b3Ugd2lzaCB0byBoYW5kbGVcbiAgICogNDA0cyBvbiB5b3VyIG93biB1c2UgYHBhZ2UoJyonLCBjYWxsYmFjaylgLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbnRleHR9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICBpZiAoY3R4LmhhbmRsZWQpIHJldHVybjtcbiAgICB2YXIgY3VycmVudDtcbiAgICB2YXIgcGFnZSA9IHRoaXM7XG4gICAgdmFyIHdpbmRvdyA9IHBhZ2UuX3dpbmRvdztcblxuICAgIGlmIChwYWdlLl9oYXNoYmFuZykge1xuICAgICAgY3VycmVudCA9IGlzTG9jYXRpb24gJiYgdGhpcy5fZ2V0QmFzZSgpICsgd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIyEnLCAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnQgPSBpc0xvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IGN0eC5jYW5vbmljYWxQYXRoKSByZXR1cm47XG4gICAgcGFnZS5zdG9wKCk7XG4gICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICBpc0xvY2F0aW9uICYmICh3aW5kb3cubG9jYXRpb24uaHJlZiA9IGN0eC5jYW5vbmljYWxQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFc2NhcGVzIFJlZ0V4cCBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfC9cXFxcXSkvZywgJ1xcXFwkMScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBuZXcgXCJyZXF1ZXN0XCIgYENvbnRleHRgXG4gICAqIHdpdGggdGhlIGdpdmVuIGBwYXRoYCBhbmQgb3B0aW9uYWwgaW5pdGlhbCBgc3RhdGVgLlxuICAgKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBDb250ZXh0KHBhdGgsIHN0YXRlLCBwYWdlSW5zdGFuY2UpIHtcbiAgICB2YXIgX3BhZ2UgPSB0aGlzLnBhZ2UgPSBwYWdlSW5zdGFuY2UgfHwgcGFnZTtcbiAgICB2YXIgd2luZG93ID0gX3BhZ2UuX3dpbmRvdztcbiAgICB2YXIgaGFzaGJhbmcgPSBfcGFnZS5faGFzaGJhbmc7XG5cbiAgICB2YXIgcGFnZUJhc2UgPSBfcGFnZS5fZ2V0QmFzZSgpO1xuICAgIGlmICgnLycgPT09IHBhdGhbMF0gJiYgMCAhPT0gcGF0aC5pbmRleE9mKHBhZ2VCYXNlKSkgcGF0aCA9IHBhZ2VCYXNlICsgKGhhc2hiYW5nID8gJyMhJyA6ICcnKSArIHBhdGg7XG4gICAgdmFyIGkgPSBwYXRoLmluZGV4T2YoJz8nKTtcblxuICAgIHRoaXMuY2Fub25pY2FsUGF0aCA9IHBhdGg7XG4gICAgdmFyIHJlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAocGFnZUJhc2UpKTtcbiAgICB0aGlzLnBhdGggPSBwYXRoLnJlcGxhY2UocmUsICcnKSB8fCAnLyc7XG4gICAgaWYgKGhhc2hiYW5nKSB0aGlzLnBhdGggPSB0aGlzLnBhdGgucmVwbGFjZSgnIyEnLCAnJykgfHwgJy8nO1xuXG4gICAgdGhpcy50aXRsZSA9IChoYXNEb2N1bWVudCAmJiB3aW5kb3cuZG9jdW1lbnQudGl0bGUpO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICB0aGlzLnN0YXRlLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucXVlcnlzdHJpbmcgPSB+aSA/IF9wYWdlLl9kZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhdGguc2xpY2UoaSArIDEpKSA6ICcnO1xuICAgIHRoaXMucGF0aG5hbWUgPSBfcGFnZS5fZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh+aSA/IHBhdGguc2xpY2UoMCwgaSkgOiBwYXRoKTtcbiAgICB0aGlzLnBhcmFtcyA9IHt9O1xuXG4gICAgLy8gZnJhZ21lbnRcbiAgICB0aGlzLmhhc2ggPSAnJztcbiAgICBpZiAoIWhhc2hiYW5nKSB7XG4gICAgICBpZiAoIX50aGlzLnBhdGguaW5kZXhPZignIycpKSByZXR1cm47XG4gICAgICB2YXIgcGFydHMgPSB0aGlzLnBhdGguc3BsaXQoJyMnKTtcbiAgICAgIHRoaXMucGF0aCA9IHRoaXMucGF0aG5hbWUgPSBwYXJ0c1swXTtcbiAgICAgIHRoaXMuaGFzaCA9IF9wYWdlLl9kZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhcnRzWzFdKSB8fCAnJztcbiAgICAgIHRoaXMucXVlcnlzdHJpbmcgPSB0aGlzLnF1ZXJ5c3RyaW5nLnNwbGl0KCcjJylbMF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFB1c2ggc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGFnZSA9IHRoaXMucGFnZTtcbiAgICB2YXIgd2luZG93ID0gcGFnZS5fd2luZG93O1xuICAgIHZhciBoYXNoYmFuZyA9IHBhZ2UuX2hhc2hiYW5nO1xuXG4gICAgcGFnZS5sZW4rKztcbiAgICBpZiAoaGFzSGlzdG9yeSkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSxcbiAgICAgICAgICBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgY29udGV4dCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwYWdlID0gdGhpcy5wYWdlO1xuICAgIGlmIChoYXNIaXN0b3J5KSB7XG4gICAgICAgIHBhZ2UuX3dpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLFxuICAgICAgICAgIHBhZ2UuX2hhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGBSb3V0ZWAgd2l0aCB0aGUgZ2l2ZW4gSFRUUCBgcGF0aGAsXG4gICAqIGFuZCBhbiBhcnJheSBvZiBgY2FsbGJhY2tzYCBhbmQgYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgIC0gYHNlbnNpdGl2ZWAgICAgZW5hYmxlIGNhc2Utc2Vuc2l0aXZlIHJvdXRlc1xuICAgKiAgIC0gYHN0cmljdGAgICAgICAgZW5hYmxlIHN0cmljdCBtYXRjaGluZyBmb3IgdHJhaWxpbmcgc2xhc2hlc1xuICAgKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiBSb3V0ZShwYXRoLCBvcHRpb25zLCBwYWdlKSB7XG4gICAgdmFyIF9wYWdlID0gdGhpcy5wYWdlID0gcGFnZSB8fCBnbG9iYWxQYWdlO1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRzLnN0cmljdCA9IG9wdHMuc3RyaWN0IHx8IF9wYWdlLl9zdHJpY3Q7XG4gICAgdGhpcy5wYXRoID0gKHBhdGggPT09ICcqJykgPyAnKC4qKScgOiBwYXRoO1xuICAgIHRoaXMubWV0aG9kID0gJ0dFVCc7XG4gICAgdGhpcy5yZWdleHAgPSBwYXRoVG9SZWdleHBfMSh0aGlzLnBhdGgsIHRoaXMua2V5cyA9IFtdLCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gcm91dGUgbWlkZGxld2FyZSB3aXRoXG4gICAqIHRoZSBnaXZlbiBjYWxsYmFjayBgZm4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWlkZGxld2FyZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbihjdHgsIG5leHQpIHtcbiAgICAgIGlmIChzZWxmLm1hdGNoKGN0eC5wYXRoLCBjdHgucGFyYW1zKSkge1xuICAgICAgICBjdHgucm91dGVQYXRoID0gc2VsZi5wYXRoO1xuICAgICAgICByZXR1cm4gZm4oY3R4LCBuZXh0KTtcbiAgICAgIH1cbiAgICAgIG5leHQoKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIHJvdXRlIG1hdGNoZXMgYHBhdGhgLCBpZiBzb1xuICAgKiBwb3B1bGF0ZSBgcGFyYW1zYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24ocGF0aCwgcGFyYW1zKSB7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXMsXG4gICAgICBxc0luZGV4ID0gcGF0aC5pbmRleE9mKCc/JyksXG4gICAgICBwYXRobmFtZSA9IH5xc0luZGV4ID8gcGF0aC5zbGljZSgwLCBxc0luZGV4KSA6IHBhdGgsXG4gICAgICBtID0gdGhpcy5yZWdleHAuZXhlYyhkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpKTtcblxuICAgIGlmICghbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZGVsZXRlIHBhcmFtc1swXTtcblxuICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBtLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV07XG4gICAgICB2YXIgdmFsID0gdGhpcy5wYWdlLl9kZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KG1baV0pO1xuICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkIHx8ICEoaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbXMsIGtleS5uYW1lKSkpIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBNb2R1bGUgZXhwb3J0cy5cbiAgICovXG5cbiAgdmFyIGdsb2JhbFBhZ2UgPSBjcmVhdGVQYWdlKCk7XG4gIHZhciBwYWdlX2pzID0gZ2xvYmFsUGFnZTtcbiAgdmFyIGRlZmF1bHRfMSA9IGdsb2JhbFBhZ2U7XG5cbnBhZ2VfanMuZGVmYXVsdCA9IGRlZmF1bHRfMTtcblxucmV0dXJuIHBhZ2VfanM7XG5cbn0pKSk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gVXRpbGl0aWVzXG5jb25zdCBsb3dlckNhc2UgPSByZXF1aXJlKCcuL2xvd2VyLWNhc2UnKVxuY29uc3Qgc3BlY2lhbHMgPSByZXF1aXJlKCcuL3NwZWNpYWxzJylcblxuY29uc3QgcmVnZXggPSAvKD86KD86KFxccz8oPzpefFsuXFwoXFwpIT87OlwiLV0pXFxzKikoXFx3KSl8KFxcdykpKFxcdypb4oCZJ10qXFx3KikvZ1xuXG5jb25zdCBjb252ZXJ0VG9SZWdFeHAgPSBzcGVjaWFscyA9PiBzcGVjaWFscy5tYXAocyA9PiBbbmV3IFJlZ0V4cChgXFxcXGIke3N9XFxcXGJgLCAnZ2knKSwgc10pXG5cbmZ1bmN0aW9uIHBhcnNlTWF0Y2gobWF0Y2gpIHtcbiAgY29uc3QgZmlyc3RDaGFyYWN0ZXIgPSBtYXRjaFswXVxuXG4gIC8vIHRlc3QgZmlyc3QgY2hhcmFjdGVyXG4gIGlmICgvXFxzLy50ZXN0KGZpcnN0Q2hhcmFjdGVyKSkge1xuICAgIC8vIGlmIHdoaXRlc3BhY2UgLSB0cmltIGFuZCByZXR1cm5cbiAgICByZXR1cm4gbWF0Y2guc3Vic3RyKDEpXG4gIH1cbiAgaWYgKC9bXFwoXFwpXS8udGVzdChmaXJzdENoYXJhY3RlcikpIHtcbiAgICAvLyBpZiBwYXJlbnMgLSB0aGlzIHNob3VsZG4ndCBiZSByZXBsYWNlZFxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gbWF0Y2hcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBvcHRpb25zID0ge30pID0+IHtcbiAgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCkucmVwbGFjZShyZWdleCwgKG0sIGxlYWQgPSAnJywgZm9yY2VkLCBsb3dlciwgcmVzdCkgPT4ge1xuICAgIGNvbnN0IHBhcnNlZE1hdGNoID0gcGFyc2VNYXRjaChtKVxuICAgIGlmICghcGFyc2VkTWF0Y2gpIHtcbiAgICAgIHJldHVybiBtXG4gICAgfVxuICAgIGlmICghZm9yY2VkKSB7XG4gICAgICBjb25zdCBmdWxsTG93ZXIgPSBsb3dlciArIHJlc3RcblxuICAgICAgaWYgKGxvd2VyQ2FzZS5oYXMoZnVsbExvd2VyKSkge1xuICAgICAgICByZXR1cm4gcGFyc2VkTWF0Y2hcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGVhZCArIChsb3dlciB8fCBmb3JjZWQpLnRvVXBwZXJDYXNlKCkgKyByZXN0XG4gIH0pXG5cbiAgY29uc3QgY3VzdG9tU3BlY2lhbHMgPSBvcHRpb25zLnNwZWNpYWwgfHwgW11cbiAgY29uc3QgcmVwbGFjZSA9IFsuLi5zcGVjaWFscywgLi4uY3VzdG9tU3BlY2lhbHNdXG4gIGNvbnN0IHJlcGxhY2VSZWdFeHAgPSBjb252ZXJ0VG9SZWdFeHAocmVwbGFjZSlcblxuICByZXBsYWNlUmVnRXhwLmZvckVhY2goKFtwYXR0ZXJuLCBzXSkgPT4ge1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKHBhdHRlcm4sIHMpXG4gIH0pXG5cbiAgcmV0dXJuIHN0clxufVxuIiwiY29uc3QgY29uanVuY3Rpb25zID0gW1xuICAnZm9yJyxcbiAgJ2FuZCcsXG4gICdub3InLFxuICAnYnV0JyxcbiAgJ29yJyxcbiAgJ3lldCcsXG4gICdzbydcbl1cblxuY29uc3QgYXJ0aWNsZXMgPSBbXG4gICdhJyxcbiAgJ2FuJyxcbiAgJ3RoZSdcbl1cblxuY29uc3QgcHJlcG9zaXRpb25zID0gW1xuICAnYWJvYXJkJyxcbiAgJ2Fib3V0JyxcbiAgJ2Fib3ZlJyxcbiAgJ2Fjcm9zcycsXG4gICdhZnRlcicsXG4gICdhZ2FpbnN0JyxcbiAgJ2Fsb25nJyxcbiAgJ2FtaWQnLFxuICAnYW1vbmcnLFxuICAnYW50aScsXG4gICdhcm91bmQnLFxuICAnYXMnLFxuICAnYXQnLFxuICAnYmVmb3JlJyxcbiAgJ2JlaGluZCcsXG4gICdiZWxvdycsXG4gICdiZW5lYXRoJyxcbiAgJ2Jlc2lkZScsXG4gICdiZXNpZGVzJyxcbiAgJ2JldHdlZW4nLFxuICAnYmV5b25kJyxcbiAgJ2J1dCcsXG4gICdieScsXG4gICdjb25jZXJuaW5nJyxcbiAgJ2NvbnNpZGVyaW5nJyxcbiAgJ2Rlc3BpdGUnLFxuICAnZG93bicsXG4gICdkdXJpbmcnLFxuICAnZXhjZXB0JyxcbiAgJ2V4Y2VwdGluZycsXG4gICdleGNsdWRpbmcnLFxuICAnZm9sbG93aW5nJyxcbiAgJ2ZvcicsXG4gICdmcm9tJyxcbiAgJ2luJyxcbiAgJ2luc2lkZScsXG4gICdpbnRvJyxcbiAgJ2xpa2UnLFxuICAnbWludXMnLFxuICAnbmVhcicsXG4gICdvZicsXG4gICdvZmYnLFxuICAnb24nLFxuICAnb250bycsXG4gICdvcHBvc2l0ZScsXG4gICdvdmVyJyxcbiAgJ3Bhc3QnLFxuICAncGVyJyxcbiAgJ3BsdXMnLFxuICAncmVnYXJkaW5nJyxcbiAgJ3JvdW5kJyxcbiAgJ3NhdmUnLFxuICAnc2luY2UnLFxuICAndGhhbicsXG4gICd0aHJvdWdoJyxcbiAgJ3RvJyxcbiAgJ3Rvd2FyZCcsXG4gICd0b3dhcmRzJyxcbiAgJ3VuZGVyJyxcbiAgJ3VuZGVybmVhdGgnLFxuICAndW5saWtlJyxcbiAgJ3VudGlsJyxcbiAgJ3VwJyxcbiAgJ3Vwb24nLFxuICAndmVyc3VzJyxcbiAgJ3ZpYScsXG4gICd3aXRoJyxcbiAgJ3dpdGhpbicsXG4gICd3aXRob3V0J1xuXVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTZXQoW1xuICAuLi5jb25qdW5jdGlvbnMsXG4gIC4uLmFydGljbGVzLFxuICAuLi5wcmVwb3NpdGlvbnNcbl0pXG4iLCJjb25zdCBpbnRlbmRlZCA9IFtcbiAgJ1pFSVQnLFxuICAnWkVJVCBJbmMuJyxcbiAgJ0NMSScsXG4gICdBUEknLFxuICAnSFRUUCcsXG4gICdIVFRQUycsXG4gICdKU1gnLFxuICAnRE5TJyxcbiAgJ1VSTCcsXG4gICdub3cuc2gnLFxuICAnbm93Lmpzb24nLFxuICAnQ0knLFxuICAnQ0ROJyxcbiAgJ3BhY2thZ2UuanNvbicsXG4gICdHaXRIdWInLFxuICAnR2l0TGFiJyxcbiAgJ0NTUycsXG4gICdKUycsXG4gICdKYXZhU2NyaXB0JyxcbiAgJ1R5cGVTY3JpcHQnLFxuICAnSFRNTCcsXG4gICdXb3JkUHJlc3MnLFxuICAnSmF2YVNjcmlwdCcsXG4gICdOZXh0LmpzJyxcbiAgJ05vZGUuanMnXG5dXG5cbm1vZHVsZS5leHBvcnRzID0gaW50ZW5kZWRcbiIsIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBnbG9iYWwsIGRlZmluZSwgU3lzdGVtLCBSZWZsZWN0LCBQcm9taXNlICovXHJcbnZhciBfX2V4dGVuZHM7XHJcbnZhciBfX2Fzc2lnbjtcclxudmFyIF9fcmVzdDtcclxudmFyIF9fZGVjb3JhdGU7XHJcbnZhciBfX3BhcmFtO1xyXG52YXIgX19tZXRhZGF0YTtcclxudmFyIF9fYXdhaXRlcjtcclxudmFyIF9fZ2VuZXJhdG9yO1xyXG52YXIgX19leHBvcnRTdGFyO1xyXG52YXIgX192YWx1ZXM7XHJcbnZhciBfX3JlYWQ7XHJcbnZhciBfX3NwcmVhZDtcclxudmFyIF9fc3ByZWFkQXJyYXlzO1xyXG52YXIgX19hd2FpdDtcclxudmFyIF9fYXN5bmNHZW5lcmF0b3I7XHJcbnZhciBfX2FzeW5jRGVsZWdhdG9yO1xyXG52YXIgX19hc3luY1ZhbHVlcztcclxudmFyIF9fbWFrZVRlbXBsYXRlT2JqZWN0O1xyXG52YXIgX19pbXBvcnRTdGFyO1xyXG52YXIgX19pbXBvcnREZWZhdWx0O1xyXG52YXIgX19jbGFzc1ByaXZhdGVGaWVsZEdldDtcclxudmFyIF9fY2xhc3NQcml2YXRlRmllbGRTZXQ7XHJcbnZhciBfX2NyZWF0ZUJpbmRpbmc7XHJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xyXG4gICAgdmFyIHJvb3QgPSB0eXBlb2YgZ2xvYmFsID09PSBcIm9iamVjdFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgPT09IFwib2JqZWN0XCIgPyBzZWxmIDogdHlwZW9mIHRoaXMgPT09IFwib2JqZWN0XCIgPyB0aGlzIDoge307XHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoXCJ0c2xpYlwiLCBbXCJleHBvcnRzXCJdLCBmdW5jdGlvbiAoZXhwb3J0cykgeyBmYWN0b3J5KGNyZWF0ZUV4cG9ydGVyKHJvb3QsIGNyZWF0ZUV4cG9ydGVyKGV4cG9ydHMpKSk7IH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBmYWN0b3J5KGNyZWF0ZUV4cG9ydGVyKHJvb3QsIGNyZWF0ZUV4cG9ydGVyKG1vZHVsZS5leHBvcnRzKSkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgZmFjdG9yeShjcmVhdGVFeHBvcnRlcihyb290KSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBjcmVhdGVFeHBvcnRlcihleHBvcnRzLCBwcmV2aW91cykge1xyXG4gICAgICAgIGlmIChleHBvcnRzICE9PSByb290KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaWQsIHYpIHsgcmV0dXJuIGV4cG9ydHNbaWRdID0gcHJldmlvdXMgPyBwcmV2aW91cyhpZCwgdikgOiB2OyB9O1xyXG4gICAgfVxyXG59KVxyXG4oZnVuY3Rpb24gKGV4cG9ydGVyKSB7XHJcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG5cclxuICAgIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH07XHJcblxyXG4gICAgX19yZXN0ID0gZnVuY3Rpb24gKHMsIGUpIHtcclxuICAgICAgICB2YXIgdCA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcclxuICAgICAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfTtcclxuXHJcbiAgICBfX2RlY29yYXRlID0gZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICAgICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgICAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICAgICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxuICAgIH07XHJcblxyXG4gICAgX19wYXJhbSA9IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxuICAgIH07XHJcblxyXG4gICAgX19tZXRhZGF0YSA9IGZ1bmN0aW9uIChtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fYXdhaXRlciA9IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgICAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgICAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBfX2dlbmVyYXRvciA9IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XHJcbiAgICAgICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgICAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgICAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIF9fZXhwb3J0U3RhciA9IGZ1bmN0aW9uKG0sIG8pIHtcclxuICAgICAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgICAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxuICAgIH0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICAgICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgICAgICBvW2syXSA9IG1ba107XHJcbiAgICB9KTtcclxuXHJcbiAgICBfX3ZhbHVlcyA9IGZ1bmN0aW9uIChvKSB7XHJcbiAgICAgICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgICAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgICAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIH07XHJcblxyXG4gICAgX19yZWFkID0gZnVuY3Rpb24gKG8sIG4pIHtcclxuICAgICAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICAgICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgICAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFyO1xyXG4gICAgfTtcclxuXHJcbiAgICBfX3NwcmVhZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgICAgIHJldHVybiBhcjtcclxuICAgIH07XHJcblxyXG4gICAgX19zcHJlYWRBcnJheXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcbiAgICBfX2F3YWl0ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxuICAgIH07XHJcblxyXG4gICAgX19hc3luY0dlbmVyYXRvciA9IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgICAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICAgICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7ICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgICAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIF9fYXN5bmNEZWxlZ2F0b3IgPSBmdW5jdGlvbiAobykge1xyXG4gICAgICAgIHZhciBpLCBwO1xyXG4gICAgICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICAgICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogbiA9PT0gXCJyZXR1cm5cIiB9IDogZiA/IGYodikgOiB2OyB9IDogZjsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBfX2FzeW5jVmFsdWVzID0gZnVuY3Rpb24gKG8pIHtcclxuICAgICAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICAgICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cclxuICAgICAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIF9fbWFrZVRlbXBsYXRlT2JqZWN0ID0gZnVuY3Rpb24gKGNvb2tlZCwgcmF3KSB7XHJcbiAgICAgICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgICAgICByZXR1cm4gY29va2VkO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG4gICAgfSkgOiBmdW5jdGlvbihvLCB2KSB7XHJcbiAgICAgICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG4gICAgfTtcclxuXHJcbiAgICBfX2ltcG9ydFN0YXIgPSBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICAgICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgX19pbXBvcnREZWZhdWx0ID0gZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0ID0gZnVuY3Rpb24gKHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICAgICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBnZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwcml2YXRlTWFwLmdldChyZWNlaXZlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRTZXQgPSBmdW5jdGlvbiAocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBzZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGVNYXAuc2V0KHJlY2VpdmVyLCB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHBvcnRlcihcIl9fZXh0ZW5kc1wiLCBfX2V4dGVuZHMpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2Fzc2lnblwiLCBfX2Fzc2lnbik7XHJcbiAgICBleHBvcnRlcihcIl9fcmVzdFwiLCBfX3Jlc3QpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2RlY29yYXRlXCIsIF9fZGVjb3JhdGUpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX3BhcmFtXCIsIF9fcGFyYW0pO1xyXG4gICAgZXhwb3J0ZXIoXCJfX21ldGFkYXRhXCIsIF9fbWV0YWRhdGEpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2F3YWl0ZXJcIiwgX19hd2FpdGVyKTtcclxuICAgIGV4cG9ydGVyKFwiX19nZW5lcmF0b3JcIiwgX19nZW5lcmF0b3IpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2V4cG9ydFN0YXJcIiwgX19leHBvcnRTdGFyKTtcclxuICAgIGV4cG9ydGVyKFwiX19jcmVhdGVCaW5kaW5nXCIsIF9fY3JlYXRlQmluZGluZyk7XHJcbiAgICBleHBvcnRlcihcIl9fdmFsdWVzXCIsIF9fdmFsdWVzKTtcclxuICAgIGV4cG9ydGVyKFwiX19yZWFkXCIsIF9fcmVhZCk7XHJcbiAgICBleHBvcnRlcihcIl9fc3ByZWFkXCIsIF9fc3ByZWFkKTtcclxuICAgIGV4cG9ydGVyKFwiX19zcHJlYWRBcnJheXNcIiwgX19zcHJlYWRBcnJheXMpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2F3YWl0XCIsIF9fYXdhaXQpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2FzeW5jR2VuZXJhdG9yXCIsIF9fYXN5bmNHZW5lcmF0b3IpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2FzeW5jRGVsZWdhdG9yXCIsIF9fYXN5bmNEZWxlZ2F0b3IpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2FzeW5jVmFsdWVzXCIsIF9fYXN5bmNWYWx1ZXMpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX21ha2VUZW1wbGF0ZU9iamVjdFwiLCBfX21ha2VUZW1wbGF0ZU9iamVjdCk7XHJcbiAgICBleHBvcnRlcihcIl9faW1wb3J0U3RhclwiLCBfX2ltcG9ydFN0YXIpO1xyXG4gICAgZXhwb3J0ZXIoXCJfX2ltcG9ydERlZmF1bHRcIiwgX19pbXBvcnREZWZhdWx0KTtcclxuICAgIGV4cG9ydGVyKFwiX19jbGFzc1ByaXZhdGVGaWVsZEdldFwiLCBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KTtcclxuICAgIGV4cG9ydGVyKFwiX19jbGFzc1ByaXZhdGVGaWVsZFNldFwiLCBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KTtcclxufSk7XHJcbiIsInZhciBiZWwgPSByZXF1aXJlKCdiZWwnKSAvLyB0dXJucyB0ZW1wbGF0ZSB0YWcgaW50byBET00gZWxlbWVudHNcbnZhciBtb3JwaGRvbSA9IHJlcXVpcmUoJ21vcnBoZG9tJykgLy8gZWZmaWNpZW50bHkgZGlmZnMgKyBtb3JwaHMgdHdvIERPTSBlbGVtZW50c1xudmFyIGRlZmF1bHRFdmVudHMgPSByZXF1aXJlKCcuL3VwZGF0ZS1ldmVudHMuanMnKSAvLyBkZWZhdWx0IGV2ZW50cyB0byBiZSBjb3BpZWQgd2hlbiBkb20gZWxlbWVudHMgdXBkYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gYmVsXG5cbi8vIFRPRE8gbW92ZSB0aGlzICsgZGVmYXVsdEV2ZW50cyB0byBhIG5ldyBtb2R1bGUgb25jZSB3ZSByZWNlaXZlIG1vcmUgZmVlZGJhY2tcbm1vZHVsZS5leHBvcnRzLnVwZGF0ZSA9IGZ1bmN0aW9uIChmcm9tTm9kZSwgdG9Ob2RlLCBvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIGlmIChvcHRzLmV2ZW50cyAhPT0gZmFsc2UpIHtcbiAgICBpZiAoIW9wdHMub25CZWZvcmVFbFVwZGF0ZWQpIG9wdHMub25CZWZvcmVFbFVwZGF0ZWQgPSBjb3BpZXJcbiAgfVxuXG4gIHJldHVybiBtb3JwaGRvbShmcm9tTm9kZSwgdG9Ob2RlLCBvcHRzKVxuXG4gIC8vIG1vcnBoZG9tIG9ubHkgY29waWVzIGF0dHJpYnV0ZXMuIHdlIGRlY2lkZWQgd2UgYWxzbyB3YW50ZWQgdG8gY29weSBldmVudHNcbiAgLy8gdGhhdCBjYW4gYmUgc2V0IHZpYSBhdHRyaWJ1dGVzXG4gIGZ1bmN0aW9uIGNvcGllciAoZiwgdCkge1xuICAgIC8vIGNvcHkgZXZlbnRzOlxuICAgIHZhciBldmVudHMgPSBvcHRzLmV2ZW50cyB8fCBkZWZhdWx0RXZlbnRzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBldiA9IGV2ZW50c1tpXVxuICAgICAgaWYgKHRbZXZdKSB7IC8vIGlmIG5ldyBlbGVtZW50IGhhcyBhIHdoaXRlbGlzdGVkIGF0dHJpYnV0ZVxuICAgICAgICBmW2V2XSA9IHRbZXZdIC8vIHVwZGF0ZSBleGlzdGluZyBlbGVtZW50XG4gICAgICB9IGVsc2UgaWYgKGZbZXZdKSB7IC8vIGlmIGV4aXN0aW5nIGVsZW1lbnQgaGFzIGl0IGFuZCBuZXcgb25lIGRvZXNudFxuICAgICAgICBmW2V2XSA9IHVuZGVmaW5lZCAvLyByZW1vdmUgaXQgZnJvbSBleGlzdGluZyBlbGVtZW50XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBvbGRWYWx1ZSA9IGYudmFsdWVcbiAgICB2YXIgbmV3VmFsdWUgPSB0LnZhbHVlXG4gICAgLy8gY29weSB2YWx1ZXMgZm9yIGZvcm0gZWxlbWVudHNcbiAgICBpZiAoKGYubm9kZU5hbWUgPT09ICdJTlBVVCcgJiYgZi50eXBlICE9PSAnZmlsZScpIHx8IGYubm9kZU5hbWUgPT09ICdTRUxFQ1QnKSB7XG4gICAgICBpZiAoIW5ld1ZhbHVlICYmICF0Lmhhc0F0dHJpYnV0ZSgndmFsdWUnKSkge1xuICAgICAgICB0LnZhbHVlID0gZi52YWx1ZVxuICAgICAgfSBlbHNlIGlmIChuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgZi52YWx1ZSA9IG5ld1ZhbHVlXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmLm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICBpZiAodC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwpIGYudmFsdWUgPSB0LnZhbHVlXG4gICAgfVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgLy8gYXR0cmlidXRlIGV2ZW50cyAoY2FuIGJlIHNldCB3aXRoIGF0dHJpYnV0ZXMpXG4gICdvbmNsaWNrJyxcbiAgJ29uZGJsY2xpY2snLFxuICAnb25tb3VzZWRvd24nLFxuICAnb25tb3VzZXVwJyxcbiAgJ29ubW91c2VvdmVyJyxcbiAgJ29ubW91c2Vtb3ZlJyxcbiAgJ29ubW91c2VvdXQnLFxuICAnb25kcmFnc3RhcnQnLFxuICAnb25kcmFnJyxcbiAgJ29uZHJhZ2VudGVyJyxcbiAgJ29uZHJhZ2xlYXZlJyxcbiAgJ29uZHJhZ292ZXInLFxuICAnb25kcm9wJyxcbiAgJ29uZHJhZ2VuZCcsXG4gICdvbmtleWRvd24nLFxuICAnb25rZXlwcmVzcycsXG4gICdvbmtleXVwJyxcbiAgJ29udW5sb2FkJyxcbiAgJ29uYWJvcnQnLFxuICAnb25lcnJvcicsXG4gICdvbnJlc2l6ZScsXG4gICdvbnNjcm9sbCcsXG4gICdvbnNlbGVjdCcsXG4gICdvbmNoYW5nZScsXG4gICdvbnN1Ym1pdCcsXG4gICdvbnJlc2V0JyxcbiAgJ29uZm9jdXMnLFxuICAnb25ibHVyJyxcbiAgJ29uaW5wdXQnLFxuICAvLyBvdGhlciBjb21tb24gZXZlbnRzXG4gICdvbmNvbnRleHRtZW51JyxcbiAgJ29uZm9jdXNpbicsXG4gICdvbmZvY3Vzb3V0J1xuXVxuIiwiY29uc3QgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKTtcbmNvbnN0IHRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuY29uc3QgZW1wdHkgPSByZXF1aXJlKCdlbXB0eS1lbGVtZW50Jyk7XG5jb25zdCB0aXRsZSA9IHJlcXVpcmUoJ3RpdGxlJyk7XG5cblxucGFnZSgnLycsIGZ1bmN0aW9uIChjdHgsIG5leHQpe1xuICB0aXRsZSgnUG9ydGFmb2xpbycpO1xuICBsZXQgbWFpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWNvbnRhaW5lcicpO1xuLyogRU4gRVNURSBDQVNPIFBPTkRSRU1PUyBVTiBPQkpFVE8gQ09OIExPUyBEQVRPUywgSUNPTk9TIFkgVVNVQVJJTyBRVUlFTiBTVUJJw5MgTEEgRk9UT1xuIEVOIExBIEzDjU5FQSAyMSBDUkVBTU9TIFVOQSBOVUVWQSBJTlNUQU5DSUEgREUgTEEgQ0xBU0UgRGF0ZSwgRU4gRE9OREUgU0lHTklGSUNBICduZXcgRGF0ZSgpJyBIb3kqLyAgXG4gIGNvbnN0IHBpY3R1cmVzID0gW1xuICB7XG4gICAgdXNlcjoge1xuICAgICAgdXNlcm5hbWU6ICdqbW9udGlsbGEnLFxuICAgICAgYXZhdGFyOiAnZm90b3BlcmZpbC5qcGcnXG4gICAgfSxcbiAgICB1cmw6ICdodHRwczovL21hdGVyaWFsaXplY3NzLmNvbS9pbWFnZXMvb2ZmaWNlLmpwZycsXG4gICAgbGlrZXM6IDEwLFxuICAgIGxpa2VkOiBmYWxzZSxcbiAgICBjcmVhdGVBdDogbmV3IERhdGUoKVxuICB9LFxuXG5cbiAgLyogRU4gTEEgTMONTkVBIDM0LCBQUklNRVJPIENSRUFNT1MgVU5BIE5VRVZBIElOU1RBTkNJQSBERSBMQSBDTEFTRSBcIkRhdGUoKVwiLCBFTlZJw4FORE9MRSBDT01PIE3DiVRPRE8gTEEgRlVOQ0nDk04gUVVFIE5PUyBQRVJNSVRFIE1PRElGSUNBUiBPIENBTUJJQVIgTEEgSE9SQSBcIi5zZXREYXRlKG5ldyBEYXRlKCkuZ2V0RGF0ZSgpIC0gMTApXCIgWSBERU5UUk8gQ09NTyBQQVLDgU1FVFJPIFNFIExFIEVOVklBIExBIEZFQ0hBIEFDVFVBTCBDT04gXCJuZXcgRGF0ZSgpXCIgWSBERVNQVcOJUyBERSBPQlRFTkVSIEVMIETDjUEgREUgSE9ZIENPTiBMQSBGVU5DScOTTiBcImdldERhdGUoKVwiIExFIFJFU1RBTU9TIExPUyBEw41BUyBRVUUgUVVFUkVNT1MuICAqL1xuICB7XG4gICAgdXNlcjoge1xuICAgICAgdXNlcm5hbWU6ICdqbW9udGlsbGEnLFxuICAgICAgYXZhdGFyOiAnZm90b3BlcmZpbC5qcGcnXG4gICAgfSxcbiAgICB1cmw6ICdodHRwczovL21hdGVyaWFsaXplY3NzLmNvbS9pbWFnZXMvb2ZmaWNlLmpwZycsXG4gICAgbGlrZXM6IDEsXG4gICAgbGlrZWQ6IHRydWUsXG4gICAgY3JlYXRlQXQ6IG5ldyBEYXRlKCkuc2V0RGF0ZShuZXcgRGF0ZSgpLmdldERhdGUoKS0gMTApXG4gIH0sXG4gIF07XG4gIC8vUEFTQU1PUyBFTiBMQSBMSU5FQSAzMyBFTCBBUlJBWSBBIEVMIFRFTVBMQVRFIERFIExBIEhPTUVQQUdFXG4gIGVtcHR5KG1haW4pLmFwcGVuZENoaWxkKHRlbXBsYXRlKHBpY3R1cmVzKSk7XG59KTsiLCJjb25zdCB5byA9IHJlcXVpcmUoJ3lvLXlvJyk7XG4vL0VOIEVTVEUgQ0FTTyBOTyBWQU1PUyBBIFJFUVVFUklSIExBIEZVTkNJw5NOIGxhbmRpbmcgU0lOTyBMQSBGVU5DScOTTiBsYXlhb3V0LlxuY29uc3QgbGF5YW91dCA9IHJlcXVpcmUoJy4uL2xheW91dCcpO1xuY29uc3QgcGljdHVyZSA9IHJlcXVpcmUoJy4uL3BpY3R1cmUtY2FyZCcpO1xuLy9VTkEgVkVaIFJFUVVFUklEQSBFTCBJTkRFWCBERSBQSUNUVVJFLCBMQSBJTlZPQ0FNT1MgQ09OIFVOQSBGVU5DScOTTlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBpY3R1cmVDYXJkIChwaWN0dXJlcykge1xuICBsZXQgZWwgPSB5byBgPGRpdiBjbGFzcz1cImNvbnRhaW5lciB0aW1lbGluZVwiPlxuICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjb2wgczEyIG0xMCBvZmZzZXQtbTEgbDYgb2Zmc2V0LWwzXCI+XG4gICAgICAgICR7cGljdHVyZXMubWFwKGZ1bmN0aW9uIChwaWMpIHtcbiAgICAgICAgcmV0dXJuIHBpY3R1cmUocGljKTtcbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+YDtcbiAgcmV0dXJuIGxheWFvdXQoZWwpO1xufTsgXG4iLCIvL0VOIEVTVEUgQ0FTTywgUkVRVUVSSU1PUyBFTCBNw5NEVUxPIFBBR0UgUEFSQSBJTklDSUFMSVpBUkxPLlxuY29uc3QgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKTtcblxuXG5cbi8qIGNvbnN0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuY29uc3QgeyBsb2NhbGUgfSA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG4vL0RFIEVTVEEgRk9STUEgUkVRVUVSSU1PUyBFTCBMRU5HVUFKRSBFTiBFU1BBw5FPTCBERUwgRk9STUFUTyBERSBMQSBIT1JBXG5yZXF1aXJlKCdtb21lbnQvbG9jYWxlL2VzJyk7XG5cbm1vbWVudC5sb2NhbGUoJ2VzJyk7ICovXG4vL0RFU1BVw4lTIFJFUVVFUklNT1MgTE9TIE3Dk0RVTE9TIERFIExBIEhPTUVQQUdFIFkgU0lHTlVQLCBSRVNQRVRBTkRPIEVMIE9SREVOIERFIExBIE1JU01BLlxucmVxdWlyZSgnLi9ob21lcGFnZScpO1xucmVxdWlyZSgnLi9zaWdudXAnKTtcbnJlcXVpcmUoJy4vc2lnbmluJyk7XG5cbnBhZ2UoKTsiLCJsZXQgeW8gPSByZXF1aXJlKCd5by15bycpO1xuXG4vL05PUyBSRVRPUk5BIEVMIEVMRU1FTlRPIERFTCBET00gUVVFIE5PUyBQUk9DRVNBIHlvXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxhbmRpbmcoYm94KXtcbiAgcmV0dXJuIHlvYDxkaXYgY2xhc3M9XCJjb250YWluZXIgbGFuZGluZ1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29sIHMxMCBwdXNoLXMxXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbCBtNSBoaWRlLW9uLXNtYWxsLW9ubHlcIj5cbiAgICAgICAgICAgICAgPGltZyBjbGFzcz1cImlwaG9uZVwiIHNyYz1cInRlbGVmb25vZ3JhbS5wbmdcIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAke2JveH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gO1xufTtcbiIsImNvbnN0IHlvID0gcmVxdWlyZSgneW8teW8nKTtcblxuLy9FTiBFU1RFIENBU08gTkVDRVNJVEFNT1MgQ1JFQVIgVU5BIEZVTkNJw5NOIENPTiBVTiBDT05URU5JRE8gUVVFIFNFQSBFWFBPUlRBREEgWSBSRVFVRVJJREEgRU4gTEEgSE9NRSwgU0lHTlVQIFkgU0lHTklOXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxheW91dChjb250ZW50KSB7XG4gIHJldHVybiB5byBgPGRpdj5cbiAgPG5hdiBjbGFzcz1cImhlYWRlclwiPlxuICA8ZGl2IGNsYXNzPVwibmF2LXdyYXBwZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjb2wgczEyIG02IG9mZnNldC1tMVwiPlxuICAgICAgICAgIDxhIGhyZWY9XCIvXCIgY2xhc3M9XCJicmFuZC1sb2dvIHBvcnRhZm9saW9cIj5Qb3J0YWZvbGlvIERpZ2l0YWw8L2E+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29sIHMyIG02IHB1c2gtczEwIHB1c2gtbTEwXCI+XG4gICAgICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ0biBidG4tbGFyZ2UgYnRuLWZsYXQgZHJvcGRvd24tYnV0dG9uXCIgZGF0YS1hY3RpdmF0ZXM9XCJkcm9wLXVzZXJcIj5cbiAgICAgICAgICA8aSBjbGFzcz1cImZhcyBmYS11c2VyLWNpcmNsZVwiPjwvaT5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPHVsIGlkPVwiZHJvcC11c2VyXCIgY2xhc3M9XCJkcm9wZG93bi1jb250ZW50XCI+XG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5TYWxpcjwvYT48L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8L25hdj5cbiAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgJHtjb250ZW50fVxuICA8L2Rpdj5cbjwvZGl2PmA7XG59XG5cbiIsImNvbnN0IHlvID0gcmVxdWlyZSgneW8teW8nKTtcbi8vRVNUQSBMSUJSRVLDjUEgTk9TIFBFUk1JVEUgTU9ESUZJQ0FSIExBIEhPUkEgUkVMQVRJVkEgREVTREUgRUwgVElFTVBPIEVOIFFVRSBTRSBQVUJMSUPDk1xuLyogY29uc3QgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7ICovXG5jb25zdCB0cmFuc2xhdGUgPSByZXF1aXJlKCcuLi90cmFuc2xhdGUnKTtcbi8vQ09OVElOVUFNT1MgQ1JFQU5ETyBVTiBBUkNISVZPIElOREVYIEVOIERPTkRFIENPTE9DQVJFTU9TIExBIEzDk0dJQ0EgREUgTlVFU1RSTyBQUk9ZRUNUTyBDT04gUkVGRVJFTkNJQSBBIExBUyBJTcOBR0VORVMgU1VCSURBU1xuXG4vL0xVRUdPIENSRUFNT1MgVU5BIEZVTkNJT04gUVVFIE5PUyBQRVJNSVRBIFJFTkRFUklaQVIgTEEgSU1BR0VOIENBREEgVkVaIEhBWUEgQ0FNQklPU1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwaWN0dXJlQ2FyZHMocGljKSB7IFxuICBsZXQgZWw7XG4gIGZ1bmN0aW9uIHJlbmRlcihwaWN0dXJlKSB7XG4gICAgcmV0dXJuIHlvYDxkaXYgY2xhc3M9XCJjYXJkICR7cGljdHVyZS5saWtlZCA/ICdsaWtlZCcgOiAnJ31cIj5cbiAgICA8ZGl2IGNsYXNzPVwiY2FyZC1pbWFnZSB3YXZlcy1lZmZlY3Qgd2F2ZXMtYmxvY2sgd2F2ZXMtbGlnaHRcIj5cbiAgICAgIDxpbWcgY2xhc3M9XCJhY3RpdmF0b3JcIiBzcmM9XCIke3BpY3R1cmUudXJsfVwiPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJjYXJkLWNvbnRlbnRcIj5cbiAgICAgIDxhIGhyZWY9XCIvdXNlci8ke3BpY3R1cmUudXNlci51c2VybmFtZX1cIiBjbGFzcz1cImNhcmQtdGl0bGVcIj5cbiAgICAgICAgPGltZyBzcmM9XCIke3BpY3R1cmUudXNlci5hdmF0YXJ9XCIgY2xhc3M9XCJhdmF0YXJcIiAvPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInVzZXJuYW1lXCI+JHtwaWN0dXJlLnVzZXIudXNlcm5hbWV9PC9zcGFuPlxuICAgICAgPC9hPlxuICAgICAgPHNtYWxsIGNsYXNzPVwicmlnaHQgdGltZVwiPiR7dHJhbnNsYXRlLmRhdGUuZm9ybWF0KHBpY3R1cmUuY3JlYXRlQXQpfTwvc21hbGw+XG4gICAgICA8cD5cbiAgICAgICAgPGEgY2xhc3M9XCJsZWZ0XCIgaHJlZj1cIiNcIiBvbmNsaWNrPSR7bGlrZS5iaW5kKG51bGwsIHRydWUpfT48aSBjbGFzcz1cImZhciBmYS1zdGFyXCI+PC9pPjwvYT5cbiAgICAgICAgPGEgY2xhc3M9XCJsZWZ0XCIgaHJlZj1cIiNcIiBvbmNsaWNrPSR7bGlrZS5iaW5kKG51bGwsIGZhbHNlKX0+PGkgY2xhc3M9XCJmYXMgZmEtc3RhclwiPjwvaT48L2E+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibGVmdCBsaWtlc1wiPiR7dHJhbnNsYXRlLm1lc3NhZ2UoJ2xpa2VzJywge2xpa2VzOiBwaWN0dXJlLmxpa2VzfSl9PC9zcGFuPlxuICAgICAgPC9wPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5gO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGxpa2UobGlrZWQpIHtcbiAgICAvL1NFIFRPTUEgRUwgQVJSQVlTIFkgU0UgTEUgQUdSRUdBIExBIFBST1BJRURBRC5cbiAgICBwaWMubGlrZWQgPSBsaWtlZDtcbiAgICAvL1NFIExFIElORElDQSBBIEVMIE9CSkVUTyBDT04gU1UgUFJPUElFREFEIHBpYy5saWtlcyBMQSBTVU1BIE8gTEEgUkVTVEFcbiAgICBwaWMubGlrZXMgKz0gbGlrZWQgPyAxIDogLTE7XG4gICAgLy9TRSBDUkVBIExBIE5VRVZBIFZBUklBQkxFIFFVRSBTRSBWQSBBIEVOQ0FSR0FSIERFIEdVQVJEQVIgTE9TIE5VRVZPUyBDQU1CSU9TXG4gICAgbGV0IG5ld0VsPSByZW5kZXIocGljKTtcbiAgICAvL1kgU0UgVVRJTElaQSBFTCBNw4lUT0RPIERFIFwieW8udXBkYXRlKClcIiBDT0xPQ0FORE8gQ09NTyBQQVLDgU1FVFJPIEVMIEVMRU1FTlRPIFZJRUpPIFkgRUwgTlVFVk8gRUxFTUVOVE8gQUNUVUFMSVpBRE8uXG4gICAgeW8udXBkYXRlKGVsLCBuZXdFbCk7XG4gICAgLy9FU1RFIFJFVFVSTiBNRSBQRVJNSVRFIEVWSVRBUiBRVUUgU0UgVlVFTFZBIEEgUkVQRVRJUiBMQSBNSVNNQSBTRU5URUNJQVxuICAgIHJldHVybiBmYWxzZVxuICB9O1xuXG4gIGVsID0gcmVuZGVyKHBpYyk7XG4gIHJldHVybiBlbDtcblxufTsiLCJjb25zdCBwYWdlID0gcmVxdWlyZSgncGFnZScpO1xuY29uc3QgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJyk7XG5jb25zdCBlbXB0eSA9IHJlcXVpcmUoJ2VtcHR5LWVsZW1lbnQnKTtcbmNvbnN0IHRpdGxlID0gcmVxdWlyZSgndGl0bGUnKTtcblxuXG5wYWdlKCcvc2lnbmluJywgZnVuY3Rpb24gKGN0eCwgbmV4dCl7XG4gIHRpdGxlKCdQb3J0YWZvbGlvIC0gU2lnbmluJyk7XG4gIGxldCBtYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tY29udGFpbmVyJyk7XG4gIGVtcHR5KG1haW4pLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcbn0pOyIsImNvbnN0IHlvID0gcmVxdWlyZSgneW8teW8nKTtcbi8vTk8gRVMgSU1QT1JUQU5URSBDT0xPQ0FSIEVMIEFSQ0hJVk9TIElOREVYLCBZQSBRVUUgU0kgVFVWSUVSQSBPVFJPIE5PTUJSRSBTw40gRlVFUkEgTkVDRVNBUklPLlxuY29uc3QgbGFuZGluZyA9IHJlcXVpcmUoJy4uL2xhbmRpbmcvaW5kZXgnKTtcblxubGV0IHNpZ25pbkZvcm0gPSB5byBgPGRpdiBjbGFzcz1cImNvbCBzMTIgbTdcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzaWdudXAtYm94XCI+XG4gICAgICAgICAgICAgICAgICA8aDEgY2xhc3M9XCJwb3J0YWZvbGlvXCI+UG9ydGFmb2xpbyBEaWdpdGFsPC9oMT5cbiAgICAgICAgICAgICAgICAgIDxmb3JtIGNsYXNzPVwic2lnbnVwLWZvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz1cImJ0biBidG4tZmIgaGlkZS1vbi1zbWFsbC1vbmx5XCI+SW5pY2lhciBzZXNpw7NuIGNvbiBGYWNlYm9vazwvYT5cbiAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz1cImJ0biBidG4tZmIgaGlkZS1vbi1tZWQtYW5kLXVwXCI+PGkgY2xhc3M9XCJmYWIgZmEtZmFjZWJvb2stc3F1YXJlXCI+PC9pPkluaWNpYXIgc2VzacOzbjwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkaXZpZGVyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInVzZXJuYW1lXCIgcGxhY2Vob2xkZXI9XCJOb21icmUgZGUgdXN1YXJpb1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIG5hbWU9XCJwYXNzd29yZFwiIHBsYWNlaG9sZGVyPVwiQ29udHJhc2XDsWFcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gd2F2ZXMtZWZmZWN0IHdhdmVzLWxpZ2h0IGJ0bi1zaWdudXBcIiB0eXBlPVwic3VibWl0XCI+SW5pY2lhIFNlc2nDs248L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ2luLWJveFwiPlxuICAgICAgICAgICAgICAgICAgwr9ObyB0aWVuZXMgdW5hIGN1ZW50YT8gPGEgaHJlZj1cIi9zaWdudXBcIj5SZWfDrXN0cmF0ZTwvYT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5gO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxhbmRpbmcoc2lnbmluRm9ybSk7IiwiY29uc3QgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKTtcbmNvbnN0IHRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuY29uc3QgZW1wdHkgPSByZXF1aXJlKCdlbXB0eS1lbGVtZW50Jyk7XG5jb25zdCB0aXRsZSA9IHJlcXVpcmUoJ3RpdGxlJyk7XG5cblxucGFnZSgnL3NpZ251cCcsIGZ1bmN0aW9uIChjdHgsIG5leHQpe1xuICB0aXRsZSgnUG9ydGFmb2xpbyAtIFNpZ251cCcpO1xuICBsZXQgbWFpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWNvbnRhaW5lcicpO1xuICBlbXB0eShtYWluKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZSk7XG59KTsiLCJjb25zdCB5byA9IHJlcXVpcmUoJ3lvLXlvJyk7XG4vL05PIEVTIElNUE9SVEFOVEUgQ09MT0NBUiBFTCBBUkNISVZPUyBJTkRFWCwgWUEgUVVFIFNJIFRVVklFUkEgT1RSTyBOT01CUkUgU8ONIEZVRVJBIE5FQ0VTQVJJTy5cbmNvbnN0IGxhbmRpbmcgPSByZXF1aXJlKCcuLi9sYW5kaW5nL2luZGV4Jyk7XG5cbmxldCBzaWdudXBGb3JtID0geW8gYDxkaXYgY2xhc3M9XCJjb2wgczEyIG03XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2lnbnVwLWJveFwiPlxuICAgICAgICAgICAgICAgICAgPGgxIGNsYXNzPVwicG9ydGFmb2xpb1wiPlBvcnRhZm9saW8gRGlnaXRhbDwvaDE+XG4gICAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzcz1cInNpZ251cC1mb3JtXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoMj5SZWfDrXN0cmF0ZSBwYXJhIHZlciBsb3MgcHJveWVjdG9zIGRlIGxvcyBlc3R1ZGlhbnRlcyBkZWwgSVVUQUpTPC9oMj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz1cImJ0biBidG4tZmIgaGlkZS1vbi1zbWFsbC1vbmx5XCI+SW5pY2lhciBzZXNpw7NuIGNvbiBGYWNlYm9vazwvYT5cbiAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzcz1cImJ0biBidG4tZmIgaGlkZS1vbi1tZWQtYW5kLXVwXCI+PGkgY2xhc3M9XCJmYWIgZmEtZmFjZWJvb2stc3F1YXJlXCI+PC9pPkluaWNpYXIgc2VzacOzbjwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkaXZpZGVyXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJlbWFpbFwiIG5hbWU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiQ29ycmVvIGVsZWN0csOzbmljb1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cIm5hbWVcIiBwbGFjZWhvbGRlcj1cIk5vbWJyZSBjb21wbGV0b1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInVzZXJuYW1lXCIgcGxhY2Vob2xkZXI9XCJOb21icmUgZGUgdXN1YXJpb1wiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiIG5hbWU9XCJwYXNzd29yZFwiIHBsYWNlaG9sZGVyPVwiQ29udHJhc2XDsWFcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4gd2F2ZXMtZWZmZWN0IHdhdmVzLWxpZ2h0IGJ0bi1zaWdudXBcIiB0eXBlPVwic3VibWl0XCI+UmVnw61zdHJhdGU8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvZ2luLWJveFwiPlxuICAgICAgICAgICAgICAgICAgwr9UaWVuZXMgdW5hIGN1ZW50YT8gPGEgaHJlZj1cIi9zaWduaW5cIj5FbnRyYXI8L2E+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+YDtcblxubW9kdWxlLmV4cG9ydHMgPSBsYW5kaW5nKHNpZ251cEZvcm0pOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBsaWtlcyA6ICd7IGxpa2VkLCBwbHVyYWwsJyArXG4gICAgICAgICAgICAnPTAge25vIGxpa2VzfScgK1xuICAgICAgICAgICAgJz0xIHsjIGxpa2V9JyArXG4gICAgICAgICAgICAnPW90aGVyIHsgIyBsaWtlc319J1xufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBsaWtlczogJ1VzdGVkIHsgbGlrZWQsIG51bWJlcn0gbWUgZ3VzdGEnXG59IiwiLy9FU1RFIEVTIFBBUkEgTEFTIEZFQ0hBU1xuY29uc3QgSW50bFJlbGF0aXZlRm9ybWF0ID0gcmVxdWlyZSgnaW50bC1yZWxhdGl2ZWZvcm1hdCcpO1xuLy9FU1RFIEVTIFBBUkEgTE9TIE1FTlNBSkVTIE8gVEVYVE9TXG5jb25zdCBJbnRsTWVzc2FnZUZvcm1hdCA9IHJlcXVpcmUoJ2ludGwtbWVzc2FnZWZvcm1hdCcpO1xuLyogY29uc3QgSW50bFJlbGF0aXZlRm9ybWF0ID0gd2luZG93bi5JbnRsUmVsYXRpdmVGb3JtYXQgPSByZXF1aXJlKCdpbnRsLXJlbGF0aXZlZm9ybWF0Jyk7XG5ERSBFU1RBIEZPUk1BIFNFIFBVRURFIENPTE9DQVIgRUwgRk9STUFUTyBSRUxBVElWTyBFTiBFTCBPQkpFVE8gREUgV0lORE9XUyBHTE9CQUwgKi9cbmxldCByZiA9IG5ldyBJbnRsUmVsYXRpdmVGb3JtYXQoJ2VzJyk7XG5sZXQgb3V0cHV0ID0gcmYuZm9ybWF0KCk7XG5cbmxldCBlcyA9IHJlcXVpcmUoJy4vZXMnKTtcbmxldCBlbiA9IHJlcXVpcmUoJy4vZW4tVVMnKTtcblxuY29uc3QgTUVTU0FHRVMgPSB7fTtcbk1FU1NBR0VTLmVzID0gZXM7XG4vKiBDT04gTE9TIENPUkNIRVRFUyBFTiBQQVJFTlRFU0lTLCBTSVJWRU4gUEFSQSBBR1JFR0FSIEVTUEFDSU9TIEVOVFJFIFBST1BJRURBREVTIE8gQ0FSQUNURVJFUyBFU1BFQ0lBTEVTXG5NRVNTQUdFU1snUE9ERU1PUyBFU0NSSUJJUiBFU1BBQ0lPUyBFTlRSRSBQUk9QSUVEQURFUyddXG4qL1xuTUVTU0FHRVNbJ2VuLVVTJ10gPSBlbjtcbi8vQ1JFQU1PUyBVTkEgVkFSSUFCTEUgUVVFIFBPUiBBSE9SQSBWQSBBIEVTVEFSIEVOIEVTUEHDkU9MXG5sZXQgbG9jYWxlcyA9ICdlcyc7XG5cbi8vb3B0cyA9IHt9LCBOT1MgRU5WSUEgVU4gT0JKRVRPIFZBQ0lPXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWVzc2FnZSA6IGZ1bmN0aW9uICh0ZXh0LCBvcHRzID0ge30pe1xuICAgIGxldCBtc2cgPSBuZXcgSW50bE1lc3NhZ2VGb3JtYXQoTUVTU0FHRVNbbG9jYWxlc11bdGV4dF0sIGxvY2FsZXMsIG51bGwpO1xuICAgIHJldHVybiBtc2cuZm9ybWF0KG9wdHMpXG4gIH0sXG4gIGRhdGU6IG5ldyBJbnRsUmVsYXRpdmVGb3JtYXQobG9jYWxlcylcbn1cblxuLyogIFBST0JMRU1BIENPTiBMQSBJTlRFUk5BQ0lPTkFMSVpBQ0nDk04gNC4yMCovXG4iXX0=
