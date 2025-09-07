(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/ajv/dist/compile/codegen/code.js
  var require_code = __commonJS({
    "node_modules/ajv/dist/compile/codegen/code.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
      var _CodeOrName = class {
      };
      exports._CodeOrName = _CodeOrName;
      exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
      var Name = class extends _CodeOrName {
        constructor(s) {
          super();
          if (!exports.IDENTIFIER.test(s))
            throw new Error("CodeGen: name must be a valid identifier");
          this.str = s;
        }
        toString() {
          return this.str;
        }
        emptyStr() {
          return false;
        }
        get names() {
          return { [this.str]: 1 };
        }
      };
      exports.Name = Name;
      var _Code = class extends _CodeOrName {
        constructor(code) {
          super();
          this._items = typeof code === "string" ? [code] : code;
        }
        toString() {
          return this.str;
        }
        emptyStr() {
          if (this._items.length > 1)
            return false;
          const item = this._items[0];
          return item === "" || item === '""';
        }
        get str() {
          var _a;
          return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
        }
        get names() {
          var _a;
          return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
            if (c instanceof Name)
              names[c.str] = (names[c.str] || 0) + 1;
            return names;
          }, {});
        }
      };
      exports._Code = _Code;
      exports.nil = new _Code("");
      function _(strs, ...args) {
        const code = [strs[0]];
        let i = 0;
        while (i < args.length) {
          addCodeArg(code, args[i]);
          code.push(strs[++i]);
        }
        return new _Code(code);
      }
      exports._ = _;
      var plus = new _Code("+");
      function str(strs, ...args) {
        const expr = [safeStringify(strs[0])];
        let i = 0;
        while (i < args.length) {
          expr.push(plus);
          addCodeArg(expr, args[i]);
          expr.push(plus, safeStringify(strs[++i]));
        }
        optimize(expr);
        return new _Code(expr);
      }
      exports.str = str;
      function addCodeArg(code, arg) {
        if (arg instanceof _Code)
          code.push(...arg._items);
        else if (arg instanceof Name)
          code.push(arg);
        else
          code.push(interpolate(arg));
      }
      exports.addCodeArg = addCodeArg;
      function optimize(expr) {
        let i = 1;
        while (i < expr.length - 1) {
          if (expr[i] === plus) {
            const res = mergeExprItems(expr[i - 1], expr[i + 1]);
            if (res !== void 0) {
              expr.splice(i - 1, 3, res);
              continue;
            }
            expr[i++] = "+";
          }
          i++;
        }
      }
      function mergeExprItems(a, b) {
        if (b === '""')
          return a;
        if (a === '""')
          return b;
        if (typeof a == "string") {
          if (b instanceof Name || a[a.length - 1] !== '"')
            return;
          if (typeof b != "string")
            return `${a.slice(0, -1)}${b}"`;
          if (b[0] === '"')
            return a.slice(0, -1) + b.slice(1);
          return;
        }
        if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
          return `"${a}${b.slice(1)}`;
        return;
      }
      function strConcat(c1, c2) {
        return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
      }
      exports.strConcat = strConcat;
      function interpolate(x) {
        return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
      }
      function stringify(x) {
        return new _Code(safeStringify(x));
      }
      exports.stringify = stringify;
      function safeStringify(x) {
        return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
      }
      exports.safeStringify = safeStringify;
      function getProperty(key) {
        return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
      }
      exports.getProperty = getProperty;
      function getEsmExportName(key) {
        if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
          return new _Code(`${key}`);
        }
        throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
      }
      exports.getEsmExportName = getEsmExportName;
      function regexpCode(rx) {
        return new _Code(rx.toString());
      }
      exports.regexpCode = regexpCode;
    }
  });

  // node_modules/ajv/dist/compile/codegen/scope.js
  var require_scope = __commonJS({
    "node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
      var code_1 = require_code();
      var ValueError = class extends Error {
        constructor(name) {
          super(`CodeGen: "code" for ${name} not defined`);
          this.value = name.value;
        }
      };
      var UsedValueState;
      (function(UsedValueState2) {
        UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
        UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
      })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
      exports.varKinds = {
        const: new code_1.Name("const"),
        let: new code_1.Name("let"),
        var: new code_1.Name("var")
      };
      var Scope = class {
        constructor({ prefixes, parent } = {}) {
          this._names = {};
          this._prefixes = prefixes;
          this._parent = parent;
        }
        toName(nameOrPrefix) {
          return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
        }
        name(prefix) {
          return new code_1.Name(this._newName(prefix));
        }
        _newName(prefix) {
          const ng = this._names[prefix] || this._nameGroup(prefix);
          return `${prefix}${ng.index++}`;
        }
        _nameGroup(prefix) {
          var _a, _b;
          if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
            throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
          }
          return this._names[prefix] = { prefix, index: 0 };
        }
      };
      exports.Scope = Scope;
      var ValueScopeName = class extends code_1.Name {
        constructor(prefix, nameStr) {
          super(nameStr);
          this.prefix = prefix;
        }
        setValue(value, { property, itemIndex }) {
          this.value = value;
          this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
        }
      };
      exports.ValueScopeName = ValueScopeName;
      var line = (0, code_1._)`\n`;
      var ValueScope = class extends Scope {
        constructor(opts) {
          super(opts);
          this._values = {};
          this._scope = opts.scope;
          this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
        }
        get() {
          return this._scope;
        }
        name(prefix) {
          return new ValueScopeName(prefix, this._newName(prefix));
        }
        value(nameOrPrefix, value) {
          var _a;
          if (value.ref === void 0)
            throw new Error("CodeGen: ref must be passed in value");
          const name = this.toName(nameOrPrefix);
          const { prefix } = name;
          const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
          let vs = this._values[prefix];
          if (vs) {
            const _name = vs.get(valueKey);
            if (_name)
              return _name;
          } else {
            vs = this._values[prefix] = /* @__PURE__ */ new Map();
          }
          vs.set(valueKey, name);
          const s = this._scope[prefix] || (this._scope[prefix] = []);
          const itemIndex = s.length;
          s[itemIndex] = value.ref;
          name.setValue(value, { property: prefix, itemIndex });
          return name;
        }
        getValue(prefix, keyOrRef) {
          const vs = this._values[prefix];
          if (!vs)
            return;
          return vs.get(keyOrRef);
        }
        scopeRefs(scopeName, values = this._values) {
          return this._reduceValues(values, (name) => {
            if (name.scopePath === void 0)
              throw new Error(`CodeGen: name "${name}" has no value`);
            return (0, code_1._)`${scopeName}${name.scopePath}`;
          });
        }
        scopeCode(values = this._values, usedValues, getCode) {
          return this._reduceValues(values, (name) => {
            if (name.value === void 0)
              throw new Error(`CodeGen: name "${name}" has no value`);
            return name.value.code;
          }, usedValues, getCode);
        }
        _reduceValues(values, valueCode, usedValues = {}, getCode) {
          let code = code_1.nil;
          for (const prefix in values) {
            const vs = values[prefix];
            if (!vs)
              continue;
            const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
            vs.forEach((name) => {
              if (nameSet.has(name))
                return;
              nameSet.set(name, UsedValueState.Started);
              let c = valueCode(name);
              if (c) {
                const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
                code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
              } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
                code = (0, code_1._)`${code}${c}${this.opts._n}`;
              } else {
                throw new ValueError(name);
              }
              nameSet.set(name, UsedValueState.Completed);
            });
          }
          return code;
        }
      };
      exports.ValueScope = ValueScope;
    }
  });

  // node_modules/ajv/dist/compile/codegen/index.js
  var require_codegen = __commonJS({
    "node_modules/ajv/dist/compile/codegen/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
      var code_1 = require_code();
      var scope_1 = require_scope();
      var code_2 = require_code();
      Object.defineProperty(exports, "_", { enumerable: true, get: function() {
        return code_2._;
      } });
      Object.defineProperty(exports, "str", { enumerable: true, get: function() {
        return code_2.str;
      } });
      Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
        return code_2.strConcat;
      } });
      Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
        return code_2.nil;
      } });
      Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
        return code_2.getProperty;
      } });
      Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
        return code_2.stringify;
      } });
      Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
        return code_2.regexpCode;
      } });
      Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
        return code_2.Name;
      } });
      var scope_2 = require_scope();
      Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
        return scope_2.Scope;
      } });
      Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
        return scope_2.ValueScope;
      } });
      Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
        return scope_2.ValueScopeName;
      } });
      Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
        return scope_2.varKinds;
      } });
      exports.operators = {
        GT: new code_1._Code(">"),
        GTE: new code_1._Code(">="),
        LT: new code_1._Code("<"),
        LTE: new code_1._Code("<="),
        EQ: new code_1._Code("==="),
        NEQ: new code_1._Code("!=="),
        NOT: new code_1._Code("!"),
        OR: new code_1._Code("||"),
        AND: new code_1._Code("&&"),
        ADD: new code_1._Code("+")
      };
      var Node = class {
        optimizeNodes() {
          return this;
        }
        optimizeNames(_names, _constants) {
          return this;
        }
      };
      var Def = class extends Node {
        constructor(varKind, name, rhs) {
          super();
          this.varKind = varKind;
          this.name = name;
          this.rhs = rhs;
        }
        render({ es5, _n }) {
          const varKind = es5 ? scope_1.varKinds.var : this.varKind;
          const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
          return `${varKind} ${this.name}${rhs};` + _n;
        }
        optimizeNames(names, constants) {
          if (!names[this.name.str])
            return;
          if (this.rhs)
            this.rhs = optimizeExpr(this.rhs, names, constants);
          return this;
        }
        get names() {
          return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
        }
      };
      var Assign = class extends Node {
        constructor(lhs, rhs, sideEffects) {
          super();
          this.lhs = lhs;
          this.rhs = rhs;
          this.sideEffects = sideEffects;
        }
        render({ _n }) {
          return `${this.lhs} = ${this.rhs};` + _n;
        }
        optimizeNames(names, constants) {
          if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
            return;
          this.rhs = optimizeExpr(this.rhs, names, constants);
          return this;
        }
        get names() {
          const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
          return addExprNames(names, this.rhs);
        }
      };
      var AssignOp = class extends Assign {
        constructor(lhs, op, rhs, sideEffects) {
          super(lhs, rhs, sideEffects);
          this.op = op;
        }
        render({ _n }) {
          return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
        }
      };
      var Label = class extends Node {
        constructor(label) {
          super();
          this.label = label;
          this.names = {};
        }
        render({ _n }) {
          return `${this.label}:` + _n;
        }
      };
      var Break = class extends Node {
        constructor(label) {
          super();
          this.label = label;
          this.names = {};
        }
        render({ _n }) {
          const label = this.label ? ` ${this.label}` : "";
          return `break${label};` + _n;
        }
      };
      var Throw = class extends Node {
        constructor(error) {
          super();
          this.error = error;
        }
        render({ _n }) {
          return `throw ${this.error};` + _n;
        }
        get names() {
          return this.error.names;
        }
      };
      var AnyCode = class extends Node {
        constructor(code) {
          super();
          this.code = code;
        }
        render({ _n }) {
          return `${this.code};` + _n;
        }
        optimizeNodes() {
          return `${this.code}` ? this : void 0;
        }
        optimizeNames(names, constants) {
          this.code = optimizeExpr(this.code, names, constants);
          return this;
        }
        get names() {
          return this.code instanceof code_1._CodeOrName ? this.code.names : {};
        }
      };
      var ParentNode = class extends Node {
        constructor(nodes = []) {
          super();
          this.nodes = nodes;
        }
        render(opts) {
          return this.nodes.reduce((code, n) => code + n.render(opts), "");
        }
        optimizeNodes() {
          const { nodes } = this;
          let i = nodes.length;
          while (i--) {
            const n = nodes[i].optimizeNodes();
            if (Array.isArray(n))
              nodes.splice(i, 1, ...n);
            else if (n)
              nodes[i] = n;
            else
              nodes.splice(i, 1);
          }
          return nodes.length > 0 ? this : void 0;
        }
        optimizeNames(names, constants) {
          const { nodes } = this;
          let i = nodes.length;
          while (i--) {
            const n = nodes[i];
            if (n.optimizeNames(names, constants))
              continue;
            subtractNames(names, n.names);
            nodes.splice(i, 1);
          }
          return nodes.length > 0 ? this : void 0;
        }
        get names() {
          return this.nodes.reduce((names, n) => addNames(names, n.names), {});
        }
      };
      var BlockNode = class extends ParentNode {
        render(opts) {
          return "{" + opts._n + super.render(opts) + "}" + opts._n;
        }
      };
      var Root = class extends ParentNode {
      };
      var Else = class extends BlockNode {
      };
      Else.kind = "else";
      var If = class _If extends BlockNode {
        constructor(condition, nodes) {
          super(nodes);
          this.condition = condition;
        }
        render(opts) {
          let code = `if(${this.condition})` + super.render(opts);
          if (this.else)
            code += "else " + this.else.render(opts);
          return code;
        }
        optimizeNodes() {
          super.optimizeNodes();
          const cond = this.condition;
          if (cond === true)
            return this.nodes;
          let e = this.else;
          if (e) {
            const ns = e.optimizeNodes();
            e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
          }
          if (e) {
            if (cond === false)
              return e instanceof _If ? e : e.nodes;
            if (this.nodes.length)
              return this;
            return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
          }
          if (cond === false || !this.nodes.length)
            return void 0;
          return this;
        }
        optimizeNames(names, constants) {
          var _a;
          this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
          if (!(super.optimizeNames(names, constants) || this.else))
            return;
          this.condition = optimizeExpr(this.condition, names, constants);
          return this;
        }
        get names() {
          const names = super.names;
          addExprNames(names, this.condition);
          if (this.else)
            addNames(names, this.else.names);
          return names;
        }
      };
      If.kind = "if";
      var For = class extends BlockNode {
      };
      For.kind = "for";
      var ForLoop = class extends For {
        constructor(iteration) {
          super();
          this.iteration = iteration;
        }
        render(opts) {
          return `for(${this.iteration})` + super.render(opts);
        }
        optimizeNames(names, constants) {
          if (!super.optimizeNames(names, constants))
            return;
          this.iteration = optimizeExpr(this.iteration, names, constants);
          return this;
        }
        get names() {
          return addNames(super.names, this.iteration.names);
        }
      };
      var ForRange = class extends For {
        constructor(varKind, name, from, to) {
          super();
          this.varKind = varKind;
          this.name = name;
          this.from = from;
          this.to = to;
        }
        render(opts) {
          const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
          const { name, from, to } = this;
          return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
        }
        get names() {
          const names = addExprNames(super.names, this.from);
          return addExprNames(names, this.to);
        }
      };
      var ForIter = class extends For {
        constructor(loop, varKind, name, iterable) {
          super();
          this.loop = loop;
          this.varKind = varKind;
          this.name = name;
          this.iterable = iterable;
        }
        render(opts) {
          return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
        }
        optimizeNames(names, constants) {
          if (!super.optimizeNames(names, constants))
            return;
          this.iterable = optimizeExpr(this.iterable, names, constants);
          return this;
        }
        get names() {
          return addNames(super.names, this.iterable.names);
        }
      };
      var Func = class extends BlockNode {
        constructor(name, args, async) {
          super();
          this.name = name;
          this.args = args;
          this.async = async;
        }
        render(opts) {
          const _async = this.async ? "async " : "";
          return `${_async}function ${this.name}(${this.args})` + super.render(opts);
        }
      };
      Func.kind = "func";
      var Return = class extends ParentNode {
        render(opts) {
          return "return " + super.render(opts);
        }
      };
      Return.kind = "return";
      var Try = class extends BlockNode {
        render(opts) {
          let code = "try" + super.render(opts);
          if (this.catch)
            code += this.catch.render(opts);
          if (this.finally)
            code += this.finally.render(opts);
          return code;
        }
        optimizeNodes() {
          var _a, _b;
          super.optimizeNodes();
          (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
          (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
          return this;
        }
        optimizeNames(names, constants) {
          var _a, _b;
          super.optimizeNames(names, constants);
          (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
          (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
          return this;
        }
        get names() {
          const names = super.names;
          if (this.catch)
            addNames(names, this.catch.names);
          if (this.finally)
            addNames(names, this.finally.names);
          return names;
        }
      };
      var Catch = class extends BlockNode {
        constructor(error) {
          super();
          this.error = error;
        }
        render(opts) {
          return `catch(${this.error})` + super.render(opts);
        }
      };
      Catch.kind = "catch";
      var Finally = class extends BlockNode {
        render(opts) {
          return "finally" + super.render(opts);
        }
      };
      Finally.kind = "finally";
      var CodeGen = class {
        constructor(extScope, opts = {}) {
          this._values = {};
          this._blockStarts = [];
          this._constants = {};
          this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
          this._extScope = extScope;
          this._scope = new scope_1.Scope({ parent: extScope });
          this._nodes = [new Root()];
        }
        toString() {
          return this._root.render(this.opts);
        }
        // returns unique name in the internal scope
        name(prefix) {
          return this._scope.name(prefix);
        }
        // reserves unique name in the external scope
        scopeName(prefix) {
          return this._extScope.name(prefix);
        }
        // reserves unique name in the external scope and assigns value to it
        scopeValue(prefixOrName, value) {
          const name = this._extScope.value(prefixOrName, value);
          const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
          vs.add(name);
          return name;
        }
        getScopeValue(prefix, keyOrRef) {
          return this._extScope.getValue(prefix, keyOrRef);
        }
        // return code that assigns values in the external scope to the names that are used internally
        // (same names that were returned by gen.scopeName or gen.scopeValue)
        scopeRefs(scopeName) {
          return this._extScope.scopeRefs(scopeName, this._values);
        }
        scopeCode() {
          return this._extScope.scopeCode(this._values);
        }
        _def(varKind, nameOrPrefix, rhs, constant) {
          const name = this._scope.toName(nameOrPrefix);
          if (rhs !== void 0 && constant)
            this._constants[name.str] = rhs;
          this._leafNode(new Def(varKind, name, rhs));
          return name;
        }
        // `const` declaration (`var` in es5 mode)
        const(nameOrPrefix, rhs, _constant) {
          return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
        }
        // `let` declaration with optional assignment (`var` in es5 mode)
        let(nameOrPrefix, rhs, _constant) {
          return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
        }
        // `var` declaration with optional assignment
        var(nameOrPrefix, rhs, _constant) {
          return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
        }
        // assignment code
        assign(lhs, rhs, sideEffects) {
          return this._leafNode(new Assign(lhs, rhs, sideEffects));
        }
        // `+=` code
        add(lhs, rhs) {
          return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
        }
        // appends passed SafeExpr to code or executes Block
        code(c) {
          if (typeof c == "function")
            c();
          else if (c !== code_1.nil)
            this._leafNode(new AnyCode(c));
          return this;
        }
        // returns code for object literal for the passed argument list of key-value pairs
        object(...keyValues) {
          const code = ["{"];
          for (const [key, value] of keyValues) {
            if (code.length > 1)
              code.push(",");
            code.push(key);
            if (key !== value || this.opts.es5) {
              code.push(":");
              (0, code_1.addCodeArg)(code, value);
            }
          }
          code.push("}");
          return new code_1._Code(code);
        }
        // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
        if(condition, thenBody, elseBody) {
          this._blockNode(new If(condition));
          if (thenBody && elseBody) {
            this.code(thenBody).else().code(elseBody).endIf();
          } else if (thenBody) {
            this.code(thenBody).endIf();
          } else if (elseBody) {
            throw new Error('CodeGen: "else" body without "then" body');
          }
          return this;
        }
        // `else if` clause - invalid without `if` or after `else` clauses
        elseIf(condition) {
          return this._elseNode(new If(condition));
        }
        // `else` clause - only valid after `if` or `else if` clauses
        else() {
          return this._elseNode(new Else());
        }
        // end `if` statement (needed if gen.if was used only with condition)
        endIf() {
          return this._endBlockNode(If, Else);
        }
        _for(node, forBody) {
          this._blockNode(node);
          if (forBody)
            this.code(forBody).endFor();
          return this;
        }
        // a generic `for` clause (or statement if `forBody` is passed)
        for(iteration, forBody) {
          return this._for(new ForLoop(iteration), forBody);
        }
        // `for` statement for a range of values
        forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
          const name = this._scope.toName(nameOrPrefix);
          return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
        }
        // `for-of` statement (in es5 mode replace with a normal for loop)
        forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
          const name = this._scope.toName(nameOrPrefix);
          if (this.opts.es5) {
            const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
            return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
              this.var(name, (0, code_1._)`${arr}[${i}]`);
              forBody(name);
            });
          }
          return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
        }
        // `for-in` statement.
        // With option `ownProperties` replaced with a `for-of` loop for object keys
        forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
          if (this.opts.ownProperties) {
            return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
          }
          const name = this._scope.toName(nameOrPrefix);
          return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
        }
        // end `for` loop
        endFor() {
          return this._endBlockNode(For);
        }
        // `label` statement
        label(label) {
          return this._leafNode(new Label(label));
        }
        // `break` statement
        break(label) {
          return this._leafNode(new Break(label));
        }
        // `return` statement
        return(value) {
          const node = new Return();
          this._blockNode(node);
          this.code(value);
          if (node.nodes.length !== 1)
            throw new Error('CodeGen: "return" should have one node');
          return this._endBlockNode(Return);
        }
        // `try` statement
        try(tryBody, catchCode, finallyCode) {
          if (!catchCode && !finallyCode)
            throw new Error('CodeGen: "try" without "catch" and "finally"');
          const node = new Try();
          this._blockNode(node);
          this.code(tryBody);
          if (catchCode) {
            const error = this.name("e");
            this._currNode = node.catch = new Catch(error);
            catchCode(error);
          }
          if (finallyCode) {
            this._currNode = node.finally = new Finally();
            this.code(finallyCode);
          }
          return this._endBlockNode(Catch, Finally);
        }
        // `throw` statement
        throw(error) {
          return this._leafNode(new Throw(error));
        }
        // start self-balancing block
        block(body, nodeCount) {
          this._blockStarts.push(this._nodes.length);
          if (body)
            this.code(body).endBlock(nodeCount);
          return this;
        }
        // end the current self-balancing block
        endBlock(nodeCount) {
          const len = this._blockStarts.pop();
          if (len === void 0)
            throw new Error("CodeGen: not in self-balancing block");
          const toClose = this._nodes.length - len;
          if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
            throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
          }
          this._nodes.length = len;
          return this;
        }
        // `function` heading (or definition if funcBody is passed)
        func(name, args = code_1.nil, async, funcBody) {
          this._blockNode(new Func(name, args, async));
          if (funcBody)
            this.code(funcBody).endFunc();
          return this;
        }
        // end function definition
        endFunc() {
          return this._endBlockNode(Func);
        }
        optimize(n = 1) {
          while (n-- > 0) {
            this._root.optimizeNodes();
            this._root.optimizeNames(this._root.names, this._constants);
          }
        }
        _leafNode(node) {
          this._currNode.nodes.push(node);
          return this;
        }
        _blockNode(node) {
          this._currNode.nodes.push(node);
          this._nodes.push(node);
        }
        _endBlockNode(N1, N2) {
          const n = this._currNode;
          if (n instanceof N1 || N2 && n instanceof N2) {
            this._nodes.pop();
            return this;
          }
          throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
        }
        _elseNode(node) {
          const n = this._currNode;
          if (!(n instanceof If)) {
            throw new Error('CodeGen: "else" without "if"');
          }
          this._currNode = n.else = node;
          return this;
        }
        get _root() {
          return this._nodes[0];
        }
        get _currNode() {
          const ns = this._nodes;
          return ns[ns.length - 1];
        }
        set _currNode(node) {
          const ns = this._nodes;
          ns[ns.length - 1] = node;
        }
      };
      exports.CodeGen = CodeGen;
      function addNames(names, from) {
        for (const n in from)
          names[n] = (names[n] || 0) + (from[n] || 0);
        return names;
      }
      function addExprNames(names, from) {
        return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
      }
      function optimizeExpr(expr, names, constants) {
        if (expr instanceof code_1.Name)
          return replaceName(expr);
        if (!canOptimize(expr))
          return expr;
        return new code_1._Code(expr._items.reduce((items, c) => {
          if (c instanceof code_1.Name)
            c = replaceName(c);
          if (c instanceof code_1._Code)
            items.push(...c._items);
          else
            items.push(c);
          return items;
        }, []));
        function replaceName(n) {
          const c = constants[n.str];
          if (c === void 0 || names[n.str] !== 1)
            return n;
          delete names[n.str];
          return c;
        }
        function canOptimize(e) {
          return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
        }
      }
      function subtractNames(names, from) {
        for (const n in from)
          names[n] = (names[n] || 0) - (from[n] || 0);
      }
      function not(x) {
        return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
      }
      exports.not = not;
      var andCode = mappend(exports.operators.AND);
      function and(...args) {
        return args.reduce(andCode);
      }
      exports.and = and;
      var orCode = mappend(exports.operators.OR);
      function or(...args) {
        return args.reduce(orCode);
      }
      exports.or = or;
      function mappend(op) {
        return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
      }
      function par(x) {
        return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
      }
    }
  });

  // node_modules/ajv/dist/compile/util.js
  var require_util = __commonJS({
    "node_modules/ajv/dist/compile/util.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
      var codegen_1 = require_codegen();
      var code_1 = require_code();
      function toHash(arr) {
        const hash = {};
        for (const item of arr)
          hash[item] = true;
        return hash;
      }
      exports.toHash = toHash;
      function alwaysValidSchema(it, schema) {
        if (typeof schema == "boolean")
          return schema;
        if (Object.keys(schema).length === 0)
          return true;
        checkUnknownRules(it, schema);
        return !schemaHasRules(schema, it.self.RULES.all);
      }
      exports.alwaysValidSchema = alwaysValidSchema;
      function checkUnknownRules(it, schema = it.schema) {
        const { opts, self } = it;
        if (!opts.strictSchema)
          return;
        if (typeof schema === "boolean")
          return;
        const rules = self.RULES.keywords;
        for (const key in schema) {
          if (!rules[key])
            checkStrictMode(it, `unknown keyword: "${key}"`);
        }
      }
      exports.checkUnknownRules = checkUnknownRules;
      function schemaHasRules(schema, rules) {
        if (typeof schema == "boolean")
          return !schema;
        for (const key in schema)
          if (rules[key])
            return true;
        return false;
      }
      exports.schemaHasRules = schemaHasRules;
      function schemaHasRulesButRef(schema, RULES) {
        if (typeof schema == "boolean")
          return !schema;
        for (const key in schema)
          if (key !== "$ref" && RULES.all[key])
            return true;
        return false;
      }
      exports.schemaHasRulesButRef = schemaHasRulesButRef;
      function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
        if (!$data) {
          if (typeof schema == "number" || typeof schema == "boolean")
            return schema;
          if (typeof schema == "string")
            return (0, codegen_1._)`${schema}`;
        }
        return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
      }
      exports.schemaRefOrVal = schemaRefOrVal;
      function unescapeFragment(str) {
        return unescapeJsonPointer(decodeURIComponent(str));
      }
      exports.unescapeFragment = unescapeFragment;
      function escapeFragment(str) {
        return encodeURIComponent(escapeJsonPointer(str));
      }
      exports.escapeFragment = escapeFragment;
      function escapeJsonPointer(str) {
        if (typeof str == "number")
          return `${str}`;
        return str.replace(/~/g, "~0").replace(/\//g, "~1");
      }
      exports.escapeJsonPointer = escapeJsonPointer;
      function unescapeJsonPointer(str) {
        return str.replace(/~1/g, "/").replace(/~0/g, "~");
      }
      exports.unescapeJsonPointer = unescapeJsonPointer;
      function eachItem(xs, f) {
        if (Array.isArray(xs)) {
          for (const x of xs)
            f(x);
        } else {
          f(xs);
        }
      }
      exports.eachItem = eachItem;
      function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
        return (gen, from, to, toName) => {
          const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
          return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
        };
      }
      exports.mergeEvaluated = {
        props: makeMergeEvaluated({
          mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
            gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
          }),
          mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
            if (from === true) {
              gen.assign(to, true);
            } else {
              gen.assign(to, (0, codegen_1._)`${to} || {}`);
              setEvaluated(gen, to, from);
            }
          }),
          mergeValues: (from, to) => from === true ? true : { ...from, ...to },
          resultToName: evaluatedPropsToName
        }),
        items: makeMergeEvaluated({
          mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
          mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
          mergeValues: (from, to) => from === true ? true : Math.max(from, to),
          resultToName: (gen, items) => gen.var("items", items)
        })
      };
      function evaluatedPropsToName(gen, ps) {
        if (ps === true)
          return gen.var("props", true);
        const props = gen.var("props", (0, codegen_1._)`{}`);
        if (ps !== void 0)
          setEvaluated(gen, props, ps);
        return props;
      }
      exports.evaluatedPropsToName = evaluatedPropsToName;
      function setEvaluated(gen, props, ps) {
        Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
      }
      exports.setEvaluated = setEvaluated;
      var snippets = {};
      function useFunc(gen, f) {
        return gen.scopeValue("func", {
          ref: f,
          code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
        });
      }
      exports.useFunc = useFunc;
      var Type;
      (function(Type2) {
        Type2[Type2["Num"] = 0] = "Num";
        Type2[Type2["Str"] = 1] = "Str";
      })(Type || (exports.Type = Type = {}));
      function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
        if (dataProp instanceof codegen_1.Name) {
          const isNumber = dataPropType === Type.Num;
          return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
        }
        return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
      }
      exports.getErrorPath = getErrorPath;
      function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
        if (!mode)
          return;
        msg = `strict mode: ${msg}`;
        if (mode === true)
          throw new Error(msg);
        it.self.logger.warn(msg);
      }
      exports.checkStrictMode = checkStrictMode;
    }
  });

  // node_modules/ajv/dist/compile/names.js
  var require_names = __commonJS({
    "node_modules/ajv/dist/compile/names.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var names = {
        // validation function arguments
        data: new codegen_1.Name("data"),
        // data passed to validation function
        // args passed from referencing schema
        valCxt: new codegen_1.Name("valCxt"),
        // validation/data context - should not be used directly, it is destructured to the names below
        instancePath: new codegen_1.Name("instancePath"),
        parentData: new codegen_1.Name("parentData"),
        parentDataProperty: new codegen_1.Name("parentDataProperty"),
        rootData: new codegen_1.Name("rootData"),
        // root data - same as the data passed to the first/top validation function
        dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
        // used to support recursiveRef and dynamicRef
        // function scoped variables
        vErrors: new codegen_1.Name("vErrors"),
        // null or array of validation errors
        errors: new codegen_1.Name("errors"),
        // counter of validation errors
        this: new codegen_1.Name("this"),
        // "globals"
        self: new codegen_1.Name("self"),
        scope: new codegen_1.Name("scope"),
        // JTD serialize/parse name for JSON string and position
        json: new codegen_1.Name("json"),
        jsonPos: new codegen_1.Name("jsonPos"),
        jsonLen: new codegen_1.Name("jsonLen"),
        jsonPart: new codegen_1.Name("jsonPart")
      };
      exports.default = names;
    }
  });

  // node_modules/ajv/dist/compile/errors.js
  var require_errors = __commonJS({
    "node_modules/ajv/dist/compile/errors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var names_1 = require_names();
      exports.keywordError = {
        message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
      };
      exports.keyword$DataError = {
        message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
      };
      function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
        const { it } = cxt;
        const { gen, compositeRule, allErrors } = it;
        const errObj = errorObjectCode(cxt, error, errorPaths);
        if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
          addError(gen, errObj);
        } else {
          returnErrors(it, (0, codegen_1._)`[${errObj}]`);
        }
      }
      exports.reportError = reportError;
      function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
        const { it } = cxt;
        const { gen, compositeRule, allErrors } = it;
        const errObj = errorObjectCode(cxt, error, errorPaths);
        addError(gen, errObj);
        if (!(compositeRule || allErrors)) {
          returnErrors(it, names_1.default.vErrors);
        }
      }
      exports.reportExtraError = reportExtraError;
      function resetErrorsCount(gen, errsCount) {
        gen.assign(names_1.default.errors, errsCount);
        gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
      }
      exports.resetErrorsCount = resetErrorsCount;
      function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
        if (errsCount === void 0)
          throw new Error("ajv implementation error");
        const err = gen.name("err");
        gen.forRange("i", errsCount, names_1.default.errors, (i) => {
          gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
          gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
          gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
          if (it.opts.verbose) {
            gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
            gen.assign((0, codegen_1._)`${err}.data`, data);
          }
        });
      }
      exports.extendErrors = extendErrors;
      function addError(gen, errObj) {
        const err = gen.const("err", errObj);
        gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
        gen.code((0, codegen_1._)`${names_1.default.errors}++`);
      }
      function returnErrors(it, errs) {
        const { gen, validateName, schemaEnv } = it;
        if (schemaEnv.$async) {
          gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
        } else {
          gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
          gen.return(false);
        }
      }
      var E = {
        keyword: new codegen_1.Name("keyword"),
        schemaPath: new codegen_1.Name("schemaPath"),
        // also used in JTD errors
        params: new codegen_1.Name("params"),
        propertyName: new codegen_1.Name("propertyName"),
        message: new codegen_1.Name("message"),
        schema: new codegen_1.Name("schema"),
        parentSchema: new codegen_1.Name("parentSchema")
      };
      function errorObjectCode(cxt, error, errorPaths) {
        const { createErrors } = cxt.it;
        if (createErrors === false)
          return (0, codegen_1._)`{}`;
        return errorObject(cxt, error, errorPaths);
      }
      function errorObject(cxt, error, errorPaths = {}) {
        const { gen, it } = cxt;
        const keyValues = [
          errorInstancePath(it, errorPaths),
          errorSchemaPath(cxt, errorPaths)
        ];
        extraErrorProps(cxt, error, keyValues);
        return gen.object(...keyValues);
      }
      function errorInstancePath({ errorPath }, { instancePath }) {
        const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
        return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
      }
      function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
        let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
        if (schemaPath) {
          schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
        }
        return [E.schemaPath, schPath];
      }
      function extraErrorProps(cxt, { params, message }, keyValues) {
        const { keyword, data, schemaValue, it } = cxt;
        const { opts, propertyName, topSchemaRef, schemaPath } = it;
        keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
        if (opts.messages) {
          keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
        }
        if (opts.verbose) {
          keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
        }
        if (propertyName)
          keyValues.push([E.propertyName, propertyName]);
      }
    }
  });

  // node_modules/ajv/dist/compile/validate/boolSchema.js
  var require_boolSchema = __commonJS({
    "node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
      var errors_1 = require_errors();
      var codegen_1 = require_codegen();
      var names_1 = require_names();
      var boolError = {
        message: "boolean schema is false"
      };
      function topBoolOrEmptySchema(it) {
        const { gen, schema, validateName } = it;
        if (schema === false) {
          falseSchemaError(it, false);
        } else if (typeof schema == "object" && schema.$async === true) {
          gen.return(names_1.default.data);
        } else {
          gen.assign((0, codegen_1._)`${validateName}.errors`, null);
          gen.return(true);
        }
      }
      exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
      function boolOrEmptySchema(it, valid) {
        const { gen, schema } = it;
        if (schema === false) {
          gen.var(valid, false);
          falseSchemaError(it);
        } else {
          gen.var(valid, true);
        }
      }
      exports.boolOrEmptySchema = boolOrEmptySchema;
      function falseSchemaError(it, overrideAllErrors) {
        const { gen, data } = it;
        const cxt = {
          gen,
          keyword: "false schema",
          data,
          schema: false,
          schemaCode: false,
          schemaValue: false,
          params: {},
          it
        };
        (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
      }
    }
  });

  // node_modules/ajv/dist/compile/rules.js
  var require_rules = __commonJS({
    "node_modules/ajv/dist/compile/rules.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getRules = exports.isJSONType = void 0;
      var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
      var jsonTypes = new Set(_jsonTypes);
      function isJSONType(x) {
        return typeof x == "string" && jsonTypes.has(x);
      }
      exports.isJSONType = isJSONType;
      function getRules() {
        const groups = {
          number: { type: "number", rules: [] },
          string: { type: "string", rules: [] },
          array: { type: "array", rules: [] },
          object: { type: "object", rules: [] }
        };
        return {
          types: { ...groups, integer: true, boolean: true, null: true },
          rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
          post: { rules: [] },
          all: {},
          keywords: {}
        };
      }
      exports.getRules = getRules;
    }
  });

  // node_modules/ajv/dist/compile/validate/applicability.js
  var require_applicability = __commonJS({
    "node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
      function schemaHasRulesForType({ schema, self }, type) {
        const group = self.RULES.types[type];
        return group && group !== true && shouldUseGroup(schema, group);
      }
      exports.schemaHasRulesForType = schemaHasRulesForType;
      function shouldUseGroup(schema, group) {
        return group.rules.some((rule) => shouldUseRule(schema, rule));
      }
      exports.shouldUseGroup = shouldUseGroup;
      function shouldUseRule(schema, rule) {
        var _a;
        return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
      }
      exports.shouldUseRule = shouldUseRule;
    }
  });

  // node_modules/ajv/dist/compile/validate/dataType.js
  var require_dataType = __commonJS({
    "node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
      var rules_1 = require_rules();
      var applicability_1 = require_applicability();
      var errors_1 = require_errors();
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var DataType;
      (function(DataType2) {
        DataType2[DataType2["Correct"] = 0] = "Correct";
        DataType2[DataType2["Wrong"] = 1] = "Wrong";
      })(DataType || (exports.DataType = DataType = {}));
      function getSchemaTypes(schema) {
        const types = getJSONTypes(schema.type);
        const hasNull = types.includes("null");
        if (hasNull) {
          if (schema.nullable === false)
            throw new Error("type: null contradicts nullable: false");
        } else {
          if (!types.length && schema.nullable !== void 0) {
            throw new Error('"nullable" cannot be used without "type"');
          }
          if (schema.nullable === true)
            types.push("null");
        }
        return types;
      }
      exports.getSchemaTypes = getSchemaTypes;
      function getJSONTypes(ts) {
        const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
        if (types.every(rules_1.isJSONType))
          return types;
        throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
      }
      exports.getJSONTypes = getJSONTypes;
      function coerceAndCheckDataType(it, types) {
        const { gen, data, opts } = it;
        const coerceTo = coerceToTypes(types, opts.coerceTypes);
        const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
        if (checkTypes) {
          const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
          gen.if(wrongType, () => {
            if (coerceTo.length)
              coerceData(it, types, coerceTo);
            else
              reportTypeError(it);
          });
        }
        return checkTypes;
      }
      exports.coerceAndCheckDataType = coerceAndCheckDataType;
      var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
      function coerceToTypes(types, coerceTypes) {
        return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
      }
      function coerceData(it, types, coerceTo) {
        const { gen, data, opts } = it;
        const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
        const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
        if (opts.coerceTypes === "array") {
          gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
        }
        gen.if((0, codegen_1._)`${coerced} !== undefined`);
        for (const t of coerceTo) {
          if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
            coerceSpecificType(t);
          }
        }
        gen.else();
        reportTypeError(it);
        gen.endIf();
        gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
          gen.assign(data, coerced);
          assignParentData(it, coerced);
        });
        function coerceSpecificType(t) {
          switch (t) {
            case "string":
              gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
              return;
            case "number":
              gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
              return;
            case "integer":
              gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
              return;
            case "boolean":
              gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
              return;
            case "null":
              gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
              gen.assign(coerced, null);
              return;
            case "array":
              gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
          }
        }
      }
      function assignParentData({ gen, parentData, parentDataProperty }, expr) {
        gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
      }
      function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
        const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
        let cond;
        switch (dataType) {
          case "null":
            return (0, codegen_1._)`${data} ${EQ} null`;
          case "array":
            cond = (0, codegen_1._)`Array.isArray(${data})`;
            break;
          case "object":
            cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
            break;
          case "integer":
            cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
            break;
          case "number":
            cond = numCond();
            break;
          default:
            return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
        }
        return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
        function numCond(_cond = codegen_1.nil) {
          return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
        }
      }
      exports.checkDataType = checkDataType;
      function checkDataTypes(dataTypes, data, strictNums, correct) {
        if (dataTypes.length === 1) {
          return checkDataType(dataTypes[0], data, strictNums, correct);
        }
        let cond;
        const types = (0, util_1.toHash)(dataTypes);
        if (types.array && types.object) {
          const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
          cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
          delete types.null;
          delete types.array;
          delete types.object;
        } else {
          cond = codegen_1.nil;
        }
        if (types.number)
          delete types.integer;
        for (const t in types)
          cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
        return cond;
      }
      exports.checkDataTypes = checkDataTypes;
      var typeError = {
        message: ({ schema }) => `must be ${schema}`,
        params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
      };
      function reportTypeError(it) {
        const cxt = getTypeErrorContext(it);
        (0, errors_1.reportError)(cxt, typeError);
      }
      exports.reportTypeError = reportTypeError;
      function getTypeErrorContext(it) {
        const { gen, data, schema } = it;
        const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
        return {
          gen,
          keyword: "type",
          data,
          schema: schema.type,
          schemaCode,
          schemaValue: schemaCode,
          parentSchema: schema,
          params: {},
          it
        };
      }
    }
  });

  // node_modules/ajv/dist/compile/validate/defaults.js
  var require_defaults = __commonJS({
    "node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.assignDefaults = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      function assignDefaults(it, ty) {
        const { properties, items } = it.schema;
        if (ty === "object" && properties) {
          for (const key in properties) {
            assignDefault(it, key, properties[key].default);
          }
        } else if (ty === "array" && Array.isArray(items)) {
          items.forEach((sch, i) => assignDefault(it, i, sch.default));
        }
      }
      exports.assignDefaults = assignDefaults;
      function assignDefault(it, prop, defaultValue) {
        const { gen, compositeRule, data, opts } = it;
        if (defaultValue === void 0)
          return;
        const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
        if (compositeRule) {
          (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
          return;
        }
        let condition = (0, codegen_1._)`${childData} === undefined`;
        if (opts.useDefaults === "empty") {
          condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
        }
        gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
      }
    }
  });

  // node_modules/ajv/dist/vocabularies/code.js
  var require_code2 = __commonJS({
    "node_modules/ajv/dist/vocabularies/code.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var names_1 = require_names();
      var util_2 = require_util();
      function checkReportMissingProp(cxt, prop) {
        const { gen, data, it } = cxt;
        gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
          cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
          cxt.error();
        });
      }
      exports.checkReportMissingProp = checkReportMissingProp;
      function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
        return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
      }
      exports.checkMissingProp = checkMissingProp;
      function reportMissingProp(cxt, missing) {
        cxt.setParams({ missingProperty: missing }, true);
        cxt.error();
      }
      exports.reportMissingProp = reportMissingProp;
      function hasPropFunc(gen) {
        return gen.scopeValue("func", {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          ref: Object.prototype.hasOwnProperty,
          code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
        });
      }
      exports.hasPropFunc = hasPropFunc;
      function isOwnProperty(gen, data, property) {
        return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
      }
      exports.isOwnProperty = isOwnProperty;
      function propertyInData(gen, data, property, ownProperties) {
        const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
        return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
      }
      exports.propertyInData = propertyInData;
      function noPropertyInData(gen, data, property, ownProperties) {
        const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
        return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
      }
      exports.noPropertyInData = noPropertyInData;
      function allSchemaProperties(schemaMap) {
        return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
      }
      exports.allSchemaProperties = allSchemaProperties;
      function schemaProperties(it, schemaMap) {
        return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
      }
      exports.schemaProperties = schemaProperties;
      function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
        const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
        const valCxt = [
          [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
          [names_1.default.parentData, it.parentData],
          [names_1.default.parentDataProperty, it.parentDataProperty],
          [names_1.default.rootData, names_1.default.rootData]
        ];
        if (it.opts.dynamicRef)
          valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
        const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
        return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
      }
      exports.callValidateCode = callValidateCode;
      var newRegExp = (0, codegen_1._)`new RegExp`;
      function usePattern({ gen, it: { opts } }, pattern) {
        const u = opts.unicodeRegExp ? "u" : "";
        const { regExp } = opts.code;
        const rx = regExp(pattern, u);
        return gen.scopeValue("pattern", {
          key: rx.toString(),
          ref: rx,
          code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
        });
      }
      exports.usePattern = usePattern;
      function validateArray(cxt) {
        const { gen, data, keyword, it } = cxt;
        const valid = gen.name("valid");
        if (it.allErrors) {
          const validArr = gen.let("valid", true);
          validateItems(() => gen.assign(validArr, false));
          return validArr;
        }
        gen.var(valid, true);
        validateItems(() => gen.break());
        return valid;
        function validateItems(notValid) {
          const len = gen.const("len", (0, codegen_1._)`${data}.length`);
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword,
              dataProp: i,
              dataPropType: util_1.Type.Num
            }, valid);
            gen.if((0, codegen_1.not)(valid), notValid);
          });
        }
      }
      exports.validateArray = validateArray;
      function validateUnion(cxt) {
        const { gen, schema, keyword, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
        if (alwaysValid && !it.opts.unevaluated)
          return;
        const valid = gen.let("valid", false);
        const schValid = gen.name("_valid");
        gen.block(() => schema.forEach((_sch, i) => {
          const schCxt = cxt.subschema({
            keyword,
            schemaProp: i,
            compositeRule: true
          }, schValid);
          gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
          const merged = cxt.mergeValidEvaluated(schCxt, schValid);
          if (!merged)
            gen.if((0, codegen_1.not)(valid));
        }));
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      }
      exports.validateUnion = validateUnion;
    }
  });

  // node_modules/ajv/dist/compile/validate/keyword.js
  var require_keyword = __commonJS({
    "node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
      var codegen_1 = require_codegen();
      var names_1 = require_names();
      var code_1 = require_code2();
      var errors_1 = require_errors();
      function macroKeywordCode(cxt, def) {
        const { gen, keyword, schema, parentSchema, it } = cxt;
        const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
        const schemaRef = useKeyword(gen, keyword, macroSchema);
        if (it.opts.validateSchema !== false)
          it.self.validateSchema(macroSchema, true);
        const valid = gen.name("valid");
        cxt.subschema({
          schema: macroSchema,
          schemaPath: codegen_1.nil,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`,
          topSchemaRef: schemaRef,
          compositeRule: true
        }, valid);
        cxt.pass(valid, () => cxt.error(true));
      }
      exports.macroKeywordCode = macroKeywordCode;
      function funcKeywordCode(cxt, def) {
        var _a;
        const { gen, keyword, schema, parentSchema, $data, it } = cxt;
        checkAsyncKeyword(it, def);
        const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
        const validateRef = useKeyword(gen, keyword, validate);
        const valid = gen.let("valid");
        cxt.block$data(valid, validateKeyword);
        cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
        function validateKeyword() {
          if (def.errors === false) {
            assignValid();
            if (def.modifying)
              modifyData(cxt);
            reportErrs(() => cxt.error());
          } else {
            const ruleErrs = def.async ? validateAsync() : validateSync();
            if (def.modifying)
              modifyData(cxt);
            reportErrs(() => addErrs(cxt, ruleErrs));
          }
        }
        function validateAsync() {
          const ruleErrs = gen.let("ruleErrs", null);
          gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
          return ruleErrs;
        }
        function validateSync() {
          const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
          gen.assign(validateErrs, null);
          assignValid(codegen_1.nil);
          return validateErrs;
        }
        function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
          const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
          const passSchema = !("compile" in def && !$data || def.schema === false);
          gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
        }
        function reportErrs(errors) {
          var _a2;
          gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
        }
      }
      exports.funcKeywordCode = funcKeywordCode;
      function modifyData(cxt) {
        const { gen, data, it } = cxt;
        gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
      }
      function addErrs(cxt, errs) {
        const { gen } = cxt;
        gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
          gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
          (0, errors_1.extendErrors)(cxt);
        }, () => cxt.error());
      }
      function checkAsyncKeyword({ schemaEnv }, def) {
        if (def.async && !schemaEnv.$async)
          throw new Error("async keyword in sync schema");
      }
      function useKeyword(gen, keyword, result) {
        if (result === void 0)
          throw new Error(`keyword "${keyword}" failed to compile`);
        return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
      }
      function validSchemaType(schema, schemaType, allowUndefined = false) {
        return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
      }
      exports.validSchemaType = validSchemaType;
      function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
        if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
          throw new Error("ajv implementation error");
        }
        const deps = def.dependencies;
        if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
          throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
        }
        if (def.validateSchema) {
          const valid = def.validateSchema(schema[keyword]);
          if (!valid) {
            const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
            if (opts.validateSchema === "log")
              self.logger.error(msg);
            else
              throw new Error(msg);
          }
        }
      }
      exports.validateKeywordUsage = validateKeywordUsage;
    }
  });

  // node_modules/ajv/dist/compile/validate/subschema.js
  var require_subschema = __commonJS({
    "node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
        if (keyword !== void 0 && schema !== void 0) {
          throw new Error('both "keyword" and "schema" passed, only one allowed');
        }
        if (keyword !== void 0) {
          const sch = it.schema[keyword];
          return schemaProp === void 0 ? {
            schema: sch,
            schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
            errSchemaPath: `${it.errSchemaPath}/${keyword}`
          } : {
            schema: sch[schemaProp],
            schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
            errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
          };
        }
        if (schema !== void 0) {
          if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
            throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
          }
          return {
            schema,
            schemaPath,
            topSchemaRef,
            errSchemaPath
          };
        }
        throw new Error('either "keyword" or "schema" must be passed');
      }
      exports.getSubschema = getSubschema;
      function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
        if (data !== void 0 && dataProp !== void 0) {
          throw new Error('both "data" and "dataProp" passed, only one allowed');
        }
        const { gen } = it;
        if (dataProp !== void 0) {
          const { errorPath, dataPathArr, opts } = it;
          const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
          dataContextProps(nextData);
          subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
          subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
          subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
        }
        if (data !== void 0) {
          const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
          dataContextProps(nextData);
          if (propertyName !== void 0)
            subschema.propertyName = propertyName;
        }
        if (dataTypes)
          subschema.dataTypes = dataTypes;
        function dataContextProps(_nextData) {
          subschema.data = _nextData;
          subschema.dataLevel = it.dataLevel + 1;
          subschema.dataTypes = [];
          it.definedProperties = /* @__PURE__ */ new Set();
          subschema.parentData = it.data;
          subschema.dataNames = [...it.dataNames, _nextData];
        }
      }
      exports.extendSubschemaData = extendSubschemaData;
      function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
        if (compositeRule !== void 0)
          subschema.compositeRule = compositeRule;
        if (createErrors !== void 0)
          subschema.createErrors = createErrors;
        if (allErrors !== void 0)
          subschema.allErrors = allErrors;
        subschema.jtdDiscriminator = jtdDiscriminator;
        subschema.jtdMetadata = jtdMetadata;
      }
      exports.extendSubschemaMode = extendSubschemaMode;
    }
  });

  // node_modules/fast-deep-equal/index.js
  var require_fast_deep_equal = __commonJS({
    "node_modules/fast-deep-equal/index.js"(exports, module) {
      "use strict";
      module.exports = function equal(a, b) {
        if (a === b) return true;
        if (a && b && typeof a == "object" && typeof b == "object") {
          if (a.constructor !== b.constructor) return false;
          var length, i, keys;
          if (Array.isArray(a)) {
            length = a.length;
            if (length != b.length) return false;
            for (i = length; i-- !== 0; )
              if (!equal(a[i], b[i])) return false;
            return true;
          }
          if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
          if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
          if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
          keys = Object.keys(a);
          length = keys.length;
          if (length !== Object.keys(b).length) return false;
          for (i = length; i-- !== 0; )
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
          for (i = length; i-- !== 0; ) {
            var key = keys[i];
            if (!equal(a[key], b[key])) return false;
          }
          return true;
        }
        return a !== a && b !== b;
      };
    }
  });

  // node_modules/json-schema-traverse/index.js
  var require_json_schema_traverse = __commonJS({
    "node_modules/json-schema-traverse/index.js"(exports, module) {
      "use strict";
      var traverse = module.exports = function(schema, opts, cb) {
        if (typeof opts == "function") {
          cb = opts;
          opts = {};
        }
        cb = opts.cb || cb;
        var pre = typeof cb == "function" ? cb : cb.pre || function() {
        };
        var post = cb.post || function() {
        };
        _traverse(opts, pre, post, schema, "", schema);
      };
      traverse.keywords = {
        additionalItems: true,
        items: true,
        contains: true,
        additionalProperties: true,
        propertyNames: true,
        not: true,
        if: true,
        then: true,
        else: true
      };
      traverse.arrayKeywords = {
        items: true,
        allOf: true,
        anyOf: true,
        oneOf: true
      };
      traverse.propsKeywords = {
        $defs: true,
        definitions: true,
        properties: true,
        patternProperties: true,
        dependencies: true
      };
      traverse.skipKeywords = {
        default: true,
        enum: true,
        const: true,
        required: true,
        maximum: true,
        minimum: true,
        exclusiveMaximum: true,
        exclusiveMinimum: true,
        multipleOf: true,
        maxLength: true,
        minLength: true,
        pattern: true,
        format: true,
        maxItems: true,
        minItems: true,
        uniqueItems: true,
        maxProperties: true,
        minProperties: true
      };
      function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
        if (schema && typeof schema == "object" && !Array.isArray(schema)) {
          pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
          for (var key in schema) {
            var sch = schema[key];
            if (Array.isArray(sch)) {
              if (key in traverse.arrayKeywords) {
                for (var i = 0; i < sch.length; i++)
                  _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
              }
            } else if (key in traverse.propsKeywords) {
              if (sch && typeof sch == "object") {
                for (var prop in sch)
                  _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
              }
            } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
              _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
            }
          }
          post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        }
      }
      function escapeJsonPtr(str) {
        return str.replace(/~/g, "~0").replace(/\//g, "~1");
      }
    }
  });

  // node_modules/ajv/dist/compile/resolve.js
  var require_resolve = __commonJS({
    "node_modules/ajv/dist/compile/resolve.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
      var util_1 = require_util();
      var equal = require_fast_deep_equal();
      var traverse = require_json_schema_traverse();
      var SIMPLE_INLINED = /* @__PURE__ */ new Set([
        "type",
        "format",
        "pattern",
        "maxLength",
        "minLength",
        "maxProperties",
        "minProperties",
        "maxItems",
        "minItems",
        "maximum",
        "minimum",
        "uniqueItems",
        "multipleOf",
        "required",
        "enum",
        "const"
      ]);
      function inlineRef(schema, limit = true) {
        if (typeof schema == "boolean")
          return true;
        if (limit === true)
          return !hasRef(schema);
        if (!limit)
          return false;
        return countKeys(schema) <= limit;
      }
      exports.inlineRef = inlineRef;
      var REF_KEYWORDS = /* @__PURE__ */ new Set([
        "$ref",
        "$recursiveRef",
        "$recursiveAnchor",
        "$dynamicRef",
        "$dynamicAnchor"
      ]);
      function hasRef(schema) {
        for (const key in schema) {
          if (REF_KEYWORDS.has(key))
            return true;
          const sch = schema[key];
          if (Array.isArray(sch) && sch.some(hasRef))
            return true;
          if (typeof sch == "object" && hasRef(sch))
            return true;
        }
        return false;
      }
      function countKeys(schema) {
        let count = 0;
        for (const key in schema) {
          if (key === "$ref")
            return Infinity;
          count++;
          if (SIMPLE_INLINED.has(key))
            continue;
          if (typeof schema[key] == "object") {
            (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
          }
          if (count === Infinity)
            return Infinity;
        }
        return count;
      }
      function getFullPath(resolver, id = "", normalize) {
        if (normalize !== false)
          id = normalizeId(id);
        const p = resolver.parse(id);
        return _getFullPath(resolver, p);
      }
      exports.getFullPath = getFullPath;
      function _getFullPath(resolver, p) {
        const serialized = resolver.serialize(p);
        return serialized.split("#")[0] + "#";
      }
      exports._getFullPath = _getFullPath;
      var TRAILING_SLASH_HASH = /#\/?$/;
      function normalizeId(id) {
        return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
      }
      exports.normalizeId = normalizeId;
      function resolveUrl(resolver, baseId, id) {
        id = normalizeId(id);
        return resolver.resolve(baseId, id);
      }
      exports.resolveUrl = resolveUrl;
      var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
      function getSchemaRefs(schema, baseId) {
        if (typeof schema == "boolean")
          return {};
        const { schemaId, uriResolver } = this.opts;
        const schId = normalizeId(schema[schemaId] || baseId);
        const baseIds = { "": schId };
        const pathPrefix = getFullPath(uriResolver, schId, false);
        const localRefs = {};
        const schemaRefs = /* @__PURE__ */ new Set();
        traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
          if (parentJsonPtr === void 0)
            return;
          const fullPath = pathPrefix + jsonPtr;
          let innerBaseId = baseIds[parentJsonPtr];
          if (typeof sch[schemaId] == "string")
            innerBaseId = addRef.call(this, sch[schemaId]);
          addAnchor.call(this, sch.$anchor);
          addAnchor.call(this, sch.$dynamicAnchor);
          baseIds[jsonPtr] = innerBaseId;
          function addRef(ref) {
            const _resolve = this.opts.uriResolver.resolve;
            ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
            if (schemaRefs.has(ref))
              throw ambiguos(ref);
            schemaRefs.add(ref);
            let schOrRef = this.refs[ref];
            if (typeof schOrRef == "string")
              schOrRef = this.refs[schOrRef];
            if (typeof schOrRef == "object") {
              checkAmbiguosRef(sch, schOrRef.schema, ref);
            } else if (ref !== normalizeId(fullPath)) {
              if (ref[0] === "#") {
                checkAmbiguosRef(sch, localRefs[ref], ref);
                localRefs[ref] = sch;
              } else {
                this.refs[ref] = fullPath;
              }
            }
            return ref;
          }
          function addAnchor(anchor) {
            if (typeof anchor == "string") {
              if (!ANCHOR.test(anchor))
                throw new Error(`invalid anchor "${anchor}"`);
              addRef.call(this, `#${anchor}`);
            }
          }
        });
        return localRefs;
        function checkAmbiguosRef(sch1, sch2, ref) {
          if (sch2 !== void 0 && !equal(sch1, sch2))
            throw ambiguos(ref);
        }
        function ambiguos(ref) {
          return new Error(`reference "${ref}" resolves to more than one schema`);
        }
      }
      exports.getSchemaRefs = getSchemaRefs;
    }
  });

  // node_modules/ajv/dist/compile/validate/index.js
  var require_validate = __commonJS({
    "node_modules/ajv/dist/compile/validate/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
      var boolSchema_1 = require_boolSchema();
      var dataType_1 = require_dataType();
      var applicability_1 = require_applicability();
      var dataType_2 = require_dataType();
      var defaults_1 = require_defaults();
      var keyword_1 = require_keyword();
      var subschema_1 = require_subschema();
      var codegen_1 = require_codegen();
      var names_1 = require_names();
      var resolve_1 = require_resolve();
      var util_1 = require_util();
      var errors_1 = require_errors();
      function validateFunctionCode(it) {
        if (isSchemaObj(it)) {
          checkKeywords(it);
          if (schemaCxtHasRules(it)) {
            topSchemaObjCode(it);
            return;
          }
        }
        validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
      }
      exports.validateFunctionCode = validateFunctionCode;
      function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
        if (opts.code.es5) {
          gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
            gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
            destructureValCxtES5(gen, opts);
            gen.code(body);
          });
        } else {
          gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
        }
      }
      function destructureValCxt(opts) {
        return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
      }
      function destructureValCxtES5(gen, opts) {
        gen.if(names_1.default.valCxt, () => {
          gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
          gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
          gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
          gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
          if (opts.dynamicRef)
            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
        }, () => {
          gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
          gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
          gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
          gen.var(names_1.default.rootData, names_1.default.data);
          if (opts.dynamicRef)
            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
        });
      }
      function topSchemaObjCode(it) {
        const { schema, opts, gen } = it;
        validateFunction(it, () => {
          if (opts.$comment && schema.$comment)
            commentKeyword(it);
          checkNoDefault(it);
          gen.let(names_1.default.vErrors, null);
          gen.let(names_1.default.errors, 0);
          if (opts.unevaluated)
            resetEvaluated(it);
          typeAndKeywords(it);
          returnResults(it);
        });
        return;
      }
      function resetEvaluated(it) {
        const { gen, validateName } = it;
        it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
        gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
        gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
      }
      function funcSourceUrl(schema, opts) {
        const schId = typeof schema == "object" && schema[opts.schemaId];
        return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
      }
      function subschemaCode(it, valid) {
        if (isSchemaObj(it)) {
          checkKeywords(it);
          if (schemaCxtHasRules(it)) {
            subSchemaObjCode(it, valid);
            return;
          }
        }
        (0, boolSchema_1.boolOrEmptySchema)(it, valid);
      }
      function schemaCxtHasRules({ schema, self }) {
        if (typeof schema == "boolean")
          return !schema;
        for (const key in schema)
          if (self.RULES.all[key])
            return true;
        return false;
      }
      function isSchemaObj(it) {
        return typeof it.schema != "boolean";
      }
      function subSchemaObjCode(it, valid) {
        const { schema, gen, opts } = it;
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        updateContext(it);
        checkAsyncSchema(it);
        const errsCount = gen.const("_errs", names_1.default.errors);
        typeAndKeywords(it, errsCount);
        gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      }
      function checkKeywords(it) {
        (0, util_1.checkUnknownRules)(it);
        checkRefsAndKeywords(it);
      }
      function typeAndKeywords(it, errsCount) {
        if (it.opts.jtd)
          return schemaKeywords(it, [], false, errsCount);
        const types = (0, dataType_1.getSchemaTypes)(it.schema);
        const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
        schemaKeywords(it, types, !checkedTypes, errsCount);
      }
      function checkRefsAndKeywords(it) {
        const { schema, errSchemaPath, opts, self } = it;
        if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
          self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
        }
      }
      function checkNoDefault(it) {
        const { schema, opts } = it;
        if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
          (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
        }
      }
      function updateContext(it) {
        const schId = it.schema[it.opts.schemaId];
        if (schId)
          it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
      }
      function checkAsyncSchema(it) {
        if (it.schema.$async && !it.schemaEnv.$async)
          throw new Error("async schema in sync schema");
      }
      function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
        const msg = schema.$comment;
        if (opts.$comment === true) {
          gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
        } else if (typeof opts.$comment == "function") {
          const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
          const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
          gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
        }
      }
      function returnResults(it) {
        const { gen, schemaEnv, validateName, ValidationError, opts } = it;
        if (schemaEnv.$async) {
          gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
        } else {
          gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
          if (opts.unevaluated)
            assignEvaluated(it);
          gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
        }
      }
      function assignEvaluated({ gen, evaluated, props, items }) {
        if (props instanceof codegen_1.Name)
          gen.assign((0, codegen_1._)`${evaluated}.props`, props);
        if (items instanceof codegen_1.Name)
          gen.assign((0, codegen_1._)`${evaluated}.items`, items);
      }
      function schemaKeywords(it, types, typeErrors, errsCount) {
        const { gen, schema, data, allErrors, opts, self } = it;
        const { RULES } = self;
        if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
          gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
          return;
        }
        if (!opts.jtd)
          checkStrictTypes(it, types);
        gen.block(() => {
          for (const group of RULES.rules)
            groupKeywords(group);
          groupKeywords(RULES.post);
        });
        function groupKeywords(group) {
          if (!(0, applicability_1.shouldUseGroup)(schema, group))
            return;
          if (group.type) {
            gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
            iterateKeywords(it, group);
            if (types.length === 1 && types[0] === group.type && typeErrors) {
              gen.else();
              (0, dataType_2.reportTypeError)(it);
            }
            gen.endIf();
          } else {
            iterateKeywords(it, group);
          }
          if (!allErrors)
            gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
        }
      }
      function iterateKeywords(it, group) {
        const { gen, schema, opts: { useDefaults } } = it;
        if (useDefaults)
          (0, defaults_1.assignDefaults)(it, group.type);
        gen.block(() => {
          for (const rule of group.rules) {
            if ((0, applicability_1.shouldUseRule)(schema, rule)) {
              keywordCode(it, rule.keyword, rule.definition, group.type);
            }
          }
        });
      }
      function checkStrictTypes(it, types) {
        if (it.schemaEnv.meta || !it.opts.strictTypes)
          return;
        checkContextTypes(it, types);
        if (!it.opts.allowUnionTypes)
          checkMultipleTypes(it, types);
        checkKeywordTypes(it, it.dataTypes);
      }
      function checkContextTypes(it, types) {
        if (!types.length)
          return;
        if (!it.dataTypes.length) {
          it.dataTypes = types;
          return;
        }
        types.forEach((t) => {
          if (!includesType(it.dataTypes, t)) {
            strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
          }
        });
        narrowSchemaTypes(it, types);
      }
      function checkMultipleTypes(it, ts) {
        if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
          strictTypesError(it, "use allowUnionTypes to allow union type keyword");
        }
      }
      function checkKeywordTypes(it, ts) {
        const rules = it.self.RULES.all;
        for (const keyword in rules) {
          const rule = rules[keyword];
          if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
            const { type } = rule.definition;
            if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
              strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
            }
          }
        }
      }
      function hasApplicableType(schTs, kwdT) {
        return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
      }
      function includesType(ts, t) {
        return ts.includes(t) || t === "integer" && ts.includes("number");
      }
      function narrowSchemaTypes(it, withTypes) {
        const ts = [];
        for (const t of it.dataTypes) {
          if (includesType(withTypes, t))
            ts.push(t);
          else if (withTypes.includes("integer") && t === "number")
            ts.push("integer");
        }
        it.dataTypes = ts;
      }
      function strictTypesError(it, msg) {
        const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
        msg += ` at "${schemaPath}" (strictTypes)`;
        (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
      }
      var KeywordCxt = class {
        constructor(it, def, keyword) {
          (0, keyword_1.validateKeywordUsage)(it, def, keyword);
          this.gen = it.gen;
          this.allErrors = it.allErrors;
          this.keyword = keyword;
          this.data = it.data;
          this.schema = it.schema[keyword];
          this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
          this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
          this.schemaType = def.schemaType;
          this.parentSchema = it.schema;
          this.params = {};
          this.it = it;
          this.def = def;
          if (this.$data) {
            this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
          } else {
            this.schemaCode = this.schemaValue;
            if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
              throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
            }
          }
          if ("code" in def ? def.trackErrors : def.errors !== false) {
            this.errsCount = it.gen.const("_errs", names_1.default.errors);
          }
        }
        result(condition, successAction, failAction) {
          this.failResult((0, codegen_1.not)(condition), successAction, failAction);
        }
        failResult(condition, successAction, failAction) {
          this.gen.if(condition);
          if (failAction)
            failAction();
          else
            this.error();
          if (successAction) {
            this.gen.else();
            successAction();
            if (this.allErrors)
              this.gen.endIf();
          } else {
            if (this.allErrors)
              this.gen.endIf();
            else
              this.gen.else();
          }
        }
        pass(condition, failAction) {
          this.failResult((0, codegen_1.not)(condition), void 0, failAction);
        }
        fail(condition) {
          if (condition === void 0) {
            this.error();
            if (!this.allErrors)
              this.gen.if(false);
            return;
          }
          this.gen.if(condition);
          this.error();
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
        fail$data(condition) {
          if (!this.$data)
            return this.fail(condition);
          const { schemaCode } = this;
          this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
        }
        error(append, errorParams, errorPaths) {
          if (errorParams) {
            this.setParams(errorParams);
            this._error(append, errorPaths);
            this.setParams({});
            return;
          }
          this._error(append, errorPaths);
        }
        _error(append, errorPaths) {
          ;
          (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
        }
        $dataError() {
          (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
        }
        reset() {
          if (this.errsCount === void 0)
            throw new Error('add "trackErrors" to keyword definition');
          (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
        }
        ok(cond) {
          if (!this.allErrors)
            this.gen.if(cond);
        }
        setParams(obj, assign) {
          if (assign)
            Object.assign(this.params, obj);
          else
            this.params = obj;
        }
        block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
          this.gen.block(() => {
            this.check$data(valid, $dataValid);
            codeBlock();
          });
        }
        check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
          if (!this.$data)
            return;
          const { gen, schemaCode, schemaType, def } = this;
          gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
          if (valid !== codegen_1.nil)
            gen.assign(valid, true);
          if (schemaType.length || def.validateSchema) {
            gen.elseIf(this.invalid$data());
            this.$dataError();
            if (valid !== codegen_1.nil)
              gen.assign(valid, false);
          }
          gen.else();
        }
        invalid$data() {
          const { gen, schemaCode, schemaType, def, it } = this;
          return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
          function wrong$DataType() {
            if (schemaType.length) {
              if (!(schemaCode instanceof codegen_1.Name))
                throw new Error("ajv implementation error");
              const st = Array.isArray(schemaType) ? schemaType : [schemaType];
              return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
            }
            return codegen_1.nil;
          }
          function invalid$DataSchema() {
            if (def.validateSchema) {
              const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
              return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
            }
            return codegen_1.nil;
          }
        }
        subschema(appl, valid) {
          const subschema = (0, subschema_1.getSubschema)(this.it, appl);
          (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
          (0, subschema_1.extendSubschemaMode)(subschema, appl);
          const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
          subschemaCode(nextContext, valid);
          return nextContext;
        }
        mergeEvaluated(schemaCxt, toName) {
          const { it, gen } = this;
          if (!it.opts.unevaluated)
            return;
          if (it.props !== true && schemaCxt.props !== void 0) {
            it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
          }
          if (it.items !== true && schemaCxt.items !== void 0) {
            it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
          }
        }
        mergeValidEvaluated(schemaCxt, valid) {
          const { it, gen } = this;
          if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
            gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
            return true;
          }
        }
      };
      exports.KeywordCxt = KeywordCxt;
      function keywordCode(it, keyword, def, ruleType) {
        const cxt = new KeywordCxt(it, def, keyword);
        if ("code" in def) {
          def.code(cxt, ruleType);
        } else if (cxt.$data && def.validate) {
          (0, keyword_1.funcKeywordCode)(cxt, def);
        } else if ("macro" in def) {
          (0, keyword_1.macroKeywordCode)(cxt, def);
        } else if (def.compile || def.validate) {
          (0, keyword_1.funcKeywordCode)(cxt, def);
        }
      }
      var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
      var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
      function getData($data, { dataLevel, dataNames, dataPathArr }) {
        let jsonPointer;
        let data;
        if ($data === "")
          return names_1.default.rootData;
        if ($data[0] === "/") {
          if (!JSON_POINTER.test($data))
            throw new Error(`Invalid JSON-pointer: ${$data}`);
          jsonPointer = $data;
          data = names_1.default.rootData;
        } else {
          const matches = RELATIVE_JSON_POINTER.exec($data);
          if (!matches)
            throw new Error(`Invalid JSON-pointer: ${$data}`);
          const up = +matches[1];
          jsonPointer = matches[2];
          if (jsonPointer === "#") {
            if (up >= dataLevel)
              throw new Error(errorMsg("property/index", up));
            return dataPathArr[dataLevel - up];
          }
          if (up > dataLevel)
            throw new Error(errorMsg("data", up));
          data = dataNames[dataLevel - up];
          if (!jsonPointer)
            return data;
        }
        let expr = data;
        const segments = jsonPointer.split("/");
        for (const segment of segments) {
          if (segment) {
            data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
            expr = (0, codegen_1._)`${expr} && ${data}`;
          }
        }
        return expr;
        function errorMsg(pointerType, up) {
          return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
        }
      }
      exports.getData = getData;
    }
  });

  // node_modules/ajv/dist/runtime/validation_error.js
  var require_validation_error = __commonJS({
    "node_modules/ajv/dist/runtime/validation_error.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var ValidationError = class extends Error {
        constructor(errors) {
          super("validation failed");
          this.errors = errors;
          this.ajv = this.validation = true;
        }
      };
      exports.default = ValidationError;
    }
  });

  // node_modules/ajv/dist/compile/ref_error.js
  var require_ref_error = __commonJS({
    "node_modules/ajv/dist/compile/ref_error.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var resolve_1 = require_resolve();
      var MissingRefError = class extends Error {
        constructor(resolver, baseId, ref, msg) {
          super(msg || `can't resolve reference ${ref} from id ${baseId}`);
          this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
          this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
        }
      };
      exports.default = MissingRefError;
    }
  });

  // node_modules/ajv/dist/compile/index.js
  var require_compile = __commonJS({
    "node_modules/ajv/dist/compile/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
      var codegen_1 = require_codegen();
      var validation_error_1 = require_validation_error();
      var names_1 = require_names();
      var resolve_1 = require_resolve();
      var util_1 = require_util();
      var validate_1 = require_validate();
      var SchemaEnv = class {
        constructor(env) {
          var _a;
          this.refs = {};
          this.dynamicAnchors = {};
          let schema;
          if (typeof env.schema == "object")
            schema = env.schema;
          this.schema = env.schema;
          this.schemaId = env.schemaId;
          this.root = env.root || this;
          this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
          this.schemaPath = env.schemaPath;
          this.localRefs = env.localRefs;
          this.meta = env.meta;
          this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
          this.refs = {};
        }
      };
      exports.SchemaEnv = SchemaEnv;
      function compileSchema(sch) {
        const _sch = getCompilingSchema.call(this, sch);
        if (_sch)
          return _sch;
        const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
        const { es5, lines } = this.opts.code;
        const { ownProperties } = this.opts;
        const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
        let _ValidationError;
        if (sch.$async) {
          _ValidationError = gen.scopeValue("Error", {
            ref: validation_error_1.default,
            code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
          });
        }
        const validateName = gen.scopeName("validate");
        sch.validateName = validateName;
        const schemaCxt = {
          gen,
          allErrors: this.opts.allErrors,
          data: names_1.default.data,
          parentData: names_1.default.parentData,
          parentDataProperty: names_1.default.parentDataProperty,
          dataNames: [names_1.default.data],
          dataPathArr: [codegen_1.nil],
          // TODO can its length be used as dataLevel if nil is removed?
          dataLevel: 0,
          dataTypes: [],
          definedProperties: /* @__PURE__ */ new Set(),
          topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
          validateName,
          ValidationError: _ValidationError,
          schema: sch.schema,
          schemaEnv: sch,
          rootId,
          baseId: sch.baseId || rootId,
          schemaPath: codegen_1.nil,
          errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
          errorPath: (0, codegen_1._)`""`,
          opts: this.opts,
          self: this
        };
        let sourceCode;
        try {
          this._compilations.add(sch);
          (0, validate_1.validateFunctionCode)(schemaCxt);
          gen.optimize(this.opts.code.optimize);
          const validateCode = gen.toString();
          sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
          if (this.opts.code.process)
            sourceCode = this.opts.code.process(sourceCode, sch);
          const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
          const validate = makeValidate(this, this.scope.get());
          this.scope.value(validateName, { ref: validate });
          validate.errors = null;
          validate.schema = sch.schema;
          validate.schemaEnv = sch;
          if (sch.$async)
            validate.$async = true;
          if (this.opts.code.source === true) {
            validate.source = { validateName, validateCode, scopeValues: gen._values };
          }
          if (this.opts.unevaluated) {
            const { props, items } = schemaCxt;
            validate.evaluated = {
              props: props instanceof codegen_1.Name ? void 0 : props,
              items: items instanceof codegen_1.Name ? void 0 : items,
              dynamicProps: props instanceof codegen_1.Name,
              dynamicItems: items instanceof codegen_1.Name
            };
            if (validate.source)
              validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
          }
          sch.validate = validate;
          return sch;
        } catch (e) {
          delete sch.validate;
          delete sch.validateName;
          if (sourceCode)
            this.logger.error("Error compiling schema, function code:", sourceCode);
          throw e;
        } finally {
          this._compilations.delete(sch);
        }
      }
      exports.compileSchema = compileSchema;
      function resolveRef(root, baseId, ref) {
        var _a;
        ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
        const schOrFunc = root.refs[ref];
        if (schOrFunc)
          return schOrFunc;
        let _sch = resolve.call(this, root, ref);
        if (_sch === void 0) {
          const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
          const { schemaId } = this.opts;
          if (schema)
            _sch = new SchemaEnv({ schema, schemaId, root, baseId });
        }
        if (_sch === void 0)
          return;
        return root.refs[ref] = inlineOrCompile.call(this, _sch);
      }
      exports.resolveRef = resolveRef;
      function inlineOrCompile(sch) {
        if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
          return sch.schema;
        return sch.validate ? sch : compileSchema.call(this, sch);
      }
      function getCompilingSchema(schEnv) {
        for (const sch of this._compilations) {
          if (sameSchemaEnv(sch, schEnv))
            return sch;
        }
      }
      exports.getCompilingSchema = getCompilingSchema;
      function sameSchemaEnv(s1, s2) {
        return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
      }
      function resolve(root, ref) {
        let sch;
        while (typeof (sch = this.refs[ref]) == "string")
          ref = sch;
        return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
      }
      function resolveSchema(root, ref) {
        const p = this.opts.uriResolver.parse(ref);
        const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
        let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
        if (Object.keys(root.schema).length > 0 && refPath === baseId) {
          return getJsonPointer.call(this, p, root);
        }
        const id = (0, resolve_1.normalizeId)(refPath);
        const schOrRef = this.refs[id] || this.schemas[id];
        if (typeof schOrRef == "string") {
          const sch = resolveSchema.call(this, root, schOrRef);
          if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
            return;
          return getJsonPointer.call(this, p, sch);
        }
        if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
          return;
        if (!schOrRef.validate)
          compileSchema.call(this, schOrRef);
        if (id === (0, resolve_1.normalizeId)(ref)) {
          const { schema } = schOrRef;
          const { schemaId } = this.opts;
          const schId = schema[schemaId];
          if (schId)
            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
          return new SchemaEnv({ schema, schemaId, root, baseId });
        }
        return getJsonPointer.call(this, p, schOrRef);
      }
      exports.resolveSchema = resolveSchema;
      var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
        "properties",
        "patternProperties",
        "enum",
        "dependencies",
        "definitions"
      ]);
      function getJsonPointer(parsedRef, { baseId, schema, root }) {
        var _a;
        if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
          return;
        for (const part of parsedRef.fragment.slice(1).split("/")) {
          if (typeof schema === "boolean")
            return;
          const partSchema = schema[(0, util_1.unescapeFragment)(part)];
          if (partSchema === void 0)
            return;
          schema = partSchema;
          const schId = typeof schema === "object" && schema[this.opts.schemaId];
          if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
          }
        }
        let env;
        if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
          const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
          env = resolveSchema.call(this, root, $ref);
        }
        const { schemaId } = this.opts;
        env = env || new SchemaEnv({ schema, schemaId, root, baseId });
        if (env.schema !== env.root.schema)
          return env;
        return void 0;
      }
    }
  });

  // node_modules/ajv/dist/refs/data.json
  var require_data = __commonJS({
    "node_modules/ajv/dist/refs/data.json"(exports, module) {
      module.exports = {
        $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
        description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
        type: "object",
        required: ["$data"],
        properties: {
          $data: {
            type: "string",
            anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
          }
        },
        additionalProperties: false
      };
    }
  });

  // node_modules/fast-uri/lib/utils.js
  var require_utils = __commonJS({
    "node_modules/fast-uri/lib/utils.js"(exports, module) {
      "use strict";
      var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
      var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
      function stringArrayToHexStripped(input) {
        let acc = "";
        let code = 0;
        let i = 0;
        for (i = 0; i < input.length; i++) {
          code = input[i].charCodeAt(0);
          if (code === 48) {
            continue;
          }
          if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
            return "";
          }
          acc += input[i];
          break;
        }
        for (i += 1; i < input.length; i++) {
          code = input[i].charCodeAt(0);
          if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
            return "";
          }
          acc += input[i];
        }
        return acc;
      }
      var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
      function consumeIsZone(buffer) {
        buffer.length = 0;
        return true;
      }
      function consumeHextets(buffer, address, output) {
        if (buffer.length) {
          const hex = stringArrayToHexStripped(buffer);
          if (hex !== "") {
            address.push(hex);
          } else {
            output.error = true;
            return false;
          }
          buffer.length = 0;
        }
        return true;
      }
      function getIPV6(input) {
        let tokenCount = 0;
        const output = { error: false, address: "", zone: "" };
        const address = [];
        const buffer = [];
        let endipv6Encountered = false;
        let endIpv6 = false;
        let consume = consumeHextets;
        for (let i = 0; i < input.length; i++) {
          const cursor = input[i];
          if (cursor === "[" || cursor === "]") {
            continue;
          }
          if (cursor === ":") {
            if (endipv6Encountered === true) {
              endIpv6 = true;
            }
            if (!consume(buffer, address, output)) {
              break;
            }
            if (++tokenCount > 7) {
              output.error = true;
              break;
            }
            if (i > 0 && input[i - 1] === ":") {
              endipv6Encountered = true;
            }
            address.push(":");
            continue;
          } else if (cursor === "%") {
            if (!consume(buffer, address, output)) {
              break;
            }
            consume = consumeIsZone;
          } else {
            buffer.push(cursor);
            continue;
          }
        }
        if (buffer.length) {
          if (consume === consumeIsZone) {
            output.zone = buffer.join("");
          } else if (endIpv6) {
            address.push(buffer.join(""));
          } else {
            address.push(stringArrayToHexStripped(buffer));
          }
        }
        output.address = address.join("");
        return output;
      }
      function normalizeIPv6(host) {
        if (findToken(host, ":") < 2) {
          return { host, isIPV6: false };
        }
        const ipv6 = getIPV6(host);
        if (!ipv6.error) {
          let newHost = ipv6.address;
          let escapedHost = ipv6.address;
          if (ipv6.zone) {
            newHost += "%" + ipv6.zone;
            escapedHost += "%25" + ipv6.zone;
          }
          return { host: newHost, isIPV6: true, escapedHost };
        } else {
          return { host, isIPV6: false };
        }
      }
      function findToken(str, token) {
        let ind = 0;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === token) ind++;
        }
        return ind;
      }
      function removeDotSegments(path) {
        let input = path;
        const output = [];
        let nextSlash = -1;
        let len = 0;
        while (len = input.length) {
          if (len === 1) {
            if (input === ".") {
              break;
            } else if (input === "/") {
              output.push("/");
              break;
            } else {
              output.push(input);
              break;
            }
          } else if (len === 2) {
            if (input[0] === ".") {
              if (input[1] === ".") {
                break;
              } else if (input[1] === "/") {
                input = input.slice(2);
                continue;
              }
            } else if (input[0] === "/") {
              if (input[1] === "." || input[1] === "/") {
                output.push("/");
                break;
              }
            }
          } else if (len === 3) {
            if (input === "/..") {
              if (output.length !== 0) {
                output.pop();
              }
              output.push("/");
              break;
            }
          }
          if (input[0] === ".") {
            if (input[1] === ".") {
              if (input[2] === "/") {
                input = input.slice(3);
                continue;
              }
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === ".") {
              if (input[2] === "/") {
                input = input.slice(2);
                continue;
              } else if (input[2] === ".") {
                if (input[3] === "/") {
                  input = input.slice(3);
                  if (output.length !== 0) {
                    output.pop();
                  }
                  continue;
                }
              }
            }
          }
          if ((nextSlash = input.indexOf("/", 1)) === -1) {
            output.push(input);
            break;
          } else {
            output.push(input.slice(0, nextSlash));
            input = input.slice(nextSlash);
          }
        }
        return output.join("");
      }
      function normalizeComponentEncoding(component, esc) {
        const func = esc !== true ? escape : unescape;
        if (component.scheme !== void 0) {
          component.scheme = func(component.scheme);
        }
        if (component.userinfo !== void 0) {
          component.userinfo = func(component.userinfo);
        }
        if (component.host !== void 0) {
          component.host = func(component.host);
        }
        if (component.path !== void 0) {
          component.path = func(component.path);
        }
        if (component.query !== void 0) {
          component.query = func(component.query);
        }
        if (component.fragment !== void 0) {
          component.fragment = func(component.fragment);
        }
        return component;
      }
      function recomposeAuthority(component) {
        const uriTokens = [];
        if (component.userinfo !== void 0) {
          uriTokens.push(component.userinfo);
          uriTokens.push("@");
        }
        if (component.host !== void 0) {
          let host = unescape(component.host);
          if (!isIPv4(host)) {
            const ipV6res = normalizeIPv6(host);
            if (ipV6res.isIPV6 === true) {
              host = `[${ipV6res.escapedHost}]`;
            } else {
              host = component.host;
            }
          }
          uriTokens.push(host);
        }
        if (typeof component.port === "number" || typeof component.port === "string") {
          uriTokens.push(":");
          uriTokens.push(String(component.port));
        }
        return uriTokens.length ? uriTokens.join("") : void 0;
      }
      module.exports = {
        nonSimpleDomain,
        recomposeAuthority,
        normalizeComponentEncoding,
        removeDotSegments,
        isIPv4,
        isUUID,
        normalizeIPv6,
        stringArrayToHexStripped
      };
    }
  });

  // node_modules/fast-uri/lib/schemes.js
  var require_schemes = __commonJS({
    "node_modules/fast-uri/lib/schemes.js"(exports, module) {
      "use strict";
      var { isUUID } = require_utils();
      var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
      var supportedSchemeNames = (
        /** @type {const} */
        [
          "http",
          "https",
          "ws",
          "wss",
          "urn",
          "urn:uuid"
        ]
      );
      function isValidSchemeName(name) {
        return supportedSchemeNames.indexOf(
          /** @type {*} */
          name
        ) !== -1;
      }
      function wsIsSecure(wsComponent) {
        if (wsComponent.secure === true) {
          return true;
        } else if (wsComponent.secure === false) {
          return false;
        } else if (wsComponent.scheme) {
          return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
        } else {
          return false;
        }
      }
      function httpParse(component) {
        if (!component.host) {
          component.error = component.error || "HTTP URIs must have a host.";
        }
        return component;
      }
      function httpSerialize(component) {
        const secure = String(component.scheme).toLowerCase() === "https";
        if (component.port === (secure ? 443 : 80) || component.port === "") {
          component.port = void 0;
        }
        if (!component.path) {
          component.path = "/";
        }
        return component;
      }
      function wsParse(wsComponent) {
        wsComponent.secure = wsIsSecure(wsComponent);
        wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
        wsComponent.path = void 0;
        wsComponent.query = void 0;
        return wsComponent;
      }
      function wsSerialize(wsComponent) {
        if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
          wsComponent.port = void 0;
        }
        if (typeof wsComponent.secure === "boolean") {
          wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
          wsComponent.secure = void 0;
        }
        if (wsComponent.resourceName) {
          const [path, query] = wsComponent.resourceName.split("?");
          wsComponent.path = path && path !== "/" ? path : void 0;
          wsComponent.query = query;
          wsComponent.resourceName = void 0;
        }
        wsComponent.fragment = void 0;
        return wsComponent;
      }
      function urnParse(urnComponent, options) {
        if (!urnComponent.path) {
          urnComponent.error = "URN can not be parsed";
          return urnComponent;
        }
        const matches = urnComponent.path.match(URN_REG);
        if (matches) {
          const scheme = options.scheme || urnComponent.scheme || "urn";
          urnComponent.nid = matches[1].toLowerCase();
          urnComponent.nss = matches[2];
          const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
          const schemeHandler = getSchemeHandler(urnScheme);
          urnComponent.path = void 0;
          if (schemeHandler) {
            urnComponent = schemeHandler.parse(urnComponent, options);
          }
        } else {
          urnComponent.error = urnComponent.error || "URN can not be parsed.";
        }
        return urnComponent;
      }
      function urnSerialize(urnComponent, options) {
        if (urnComponent.nid === void 0) {
          throw new Error("URN without nid cannot be serialized");
        }
        const scheme = options.scheme || urnComponent.scheme || "urn";
        const nid = urnComponent.nid.toLowerCase();
        const urnScheme = `${scheme}:${options.nid || nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        if (schemeHandler) {
          urnComponent = schemeHandler.serialize(urnComponent, options);
        }
        const uriComponent = urnComponent;
        const nss = urnComponent.nss;
        uriComponent.path = `${nid || options.nid}:${nss}`;
        options.skipEscape = true;
        return uriComponent;
      }
      function urnuuidParse(urnComponent, options) {
        const uuidComponent = urnComponent;
        uuidComponent.uuid = uuidComponent.nss;
        uuidComponent.nss = void 0;
        if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
          uuidComponent.error = uuidComponent.error || "UUID is not valid.";
        }
        return uuidComponent;
      }
      function urnuuidSerialize(uuidComponent) {
        const urnComponent = uuidComponent;
        urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
        return urnComponent;
      }
      var http = (
        /** @type {SchemeHandler} */
        {
          scheme: "http",
          domainHost: true,
          parse: httpParse,
          serialize: httpSerialize
        }
      );
      var https = (
        /** @type {SchemeHandler} */
        {
          scheme: "https",
          domainHost: http.domainHost,
          parse: httpParse,
          serialize: httpSerialize
        }
      );
      var ws = (
        /** @type {SchemeHandler} */
        {
          scheme: "ws",
          domainHost: true,
          parse: wsParse,
          serialize: wsSerialize
        }
      );
      var wss = (
        /** @type {SchemeHandler} */
        {
          scheme: "wss",
          domainHost: ws.domainHost,
          parse: ws.parse,
          serialize: ws.serialize
        }
      );
      var urn = (
        /** @type {SchemeHandler} */
        {
          scheme: "urn",
          parse: urnParse,
          serialize: urnSerialize,
          skipNormalize: true
        }
      );
      var urnuuid = (
        /** @type {SchemeHandler} */
        {
          scheme: "urn:uuid",
          parse: urnuuidParse,
          serialize: urnuuidSerialize,
          skipNormalize: true
        }
      );
      var SCHEMES = (
        /** @type {Record<SchemeName, SchemeHandler>} */
        {
          http,
          https,
          ws,
          wss,
          urn,
          "urn:uuid": urnuuid
        }
      );
      Object.setPrototypeOf(SCHEMES, null);
      function getSchemeHandler(scheme) {
        return scheme && (SCHEMES[
          /** @type {SchemeName} */
          scheme
        ] || SCHEMES[
          /** @type {SchemeName} */
          scheme.toLowerCase()
        ]) || void 0;
      }
      module.exports = {
        wsIsSecure,
        SCHEMES,
        isValidSchemeName,
        getSchemeHandler
      };
    }
  });

  // node_modules/fast-uri/index.js
  var require_fast_uri = __commonJS({
    "node_modules/fast-uri/index.js"(exports, module) {
      "use strict";
      var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
      var { SCHEMES, getSchemeHandler } = require_schemes();
      function normalize(uri, options) {
        if (typeof uri === "string") {
          uri = /** @type {T} */
          serialize(parse2(uri, options), options);
        } else if (typeof uri === "object") {
          uri = /** @type {T} */
          parse2(serialize(uri, options), options);
        }
        return uri;
      }
      function resolve(baseURI, relativeURI, options) {
        const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
        const resolved = resolveComponent(parse2(baseURI, schemelessOptions), parse2(relativeURI, schemelessOptions), schemelessOptions, true);
        schemelessOptions.skipEscape = true;
        return serialize(resolved, schemelessOptions);
      }
      function resolveComponent(base, relative, options, skipNormalization) {
        const target = {};
        if (!skipNormalization) {
          base = parse2(serialize(base, options), options);
          relative = parse2(serialize(relative, options), options);
        }
        options = options || {};
        if (!options.tolerant && relative.scheme) {
          target.scheme = relative.scheme;
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
            target.userinfo = relative.userinfo;
            target.host = relative.host;
            target.port = relative.port;
            target.path = removeDotSegments(relative.path || "");
            target.query = relative.query;
          } else {
            if (!relative.path) {
              target.path = base.path;
              if (relative.query !== void 0) {
                target.query = relative.query;
              } else {
                target.query = base.query;
              }
            } else {
              if (relative.path[0] === "/") {
                target.path = removeDotSegments(relative.path);
              } else {
                if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                  target.path = "/" + relative.path;
                } else if (!base.path) {
                  target.path = relative.path;
                } else {
                  target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
                }
                target.path = removeDotSegments(target.path);
              }
              target.query = relative.query;
            }
            target.userinfo = base.userinfo;
            target.host = base.host;
            target.port = base.port;
          }
          target.scheme = base.scheme;
        }
        target.fragment = relative.fragment;
        return target;
      }
      function equal(uriA, uriB, options) {
        if (typeof uriA === "string") {
          uriA = unescape(uriA);
          uriA = serialize(normalizeComponentEncoding(parse2(uriA, options), true), { ...options, skipEscape: true });
        } else if (typeof uriA === "object") {
          uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
        }
        if (typeof uriB === "string") {
          uriB = unescape(uriB);
          uriB = serialize(normalizeComponentEncoding(parse2(uriB, options), true), { ...options, skipEscape: true });
        } else if (typeof uriB === "object") {
          uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
        }
        return uriA.toLowerCase() === uriB.toLowerCase();
      }
      function serialize(cmpts, opts) {
        const component = {
          host: cmpts.host,
          scheme: cmpts.scheme,
          userinfo: cmpts.userinfo,
          port: cmpts.port,
          path: cmpts.path,
          query: cmpts.query,
          nid: cmpts.nid,
          nss: cmpts.nss,
          uuid: cmpts.uuid,
          fragment: cmpts.fragment,
          reference: cmpts.reference,
          resourceName: cmpts.resourceName,
          secure: cmpts.secure,
          error: ""
        };
        const options = Object.assign({}, opts);
        const uriTokens = [];
        const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
        if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
        if (component.path !== void 0) {
          if (!options.skipEscape) {
            component.path = escape(component.path);
            if (component.scheme !== void 0) {
              component.path = component.path.split("%3A").join(":");
            }
          } else {
            component.path = unescape(component.path);
          }
        }
        if (options.reference !== "suffix" && component.scheme) {
          uriTokens.push(component.scheme, ":");
        }
        const authority = recomposeAuthority(component);
        if (authority !== void 0) {
          if (options.reference !== "suffix") {
            uriTokens.push("//");
          }
          uriTokens.push(authority);
          if (component.path && component.path[0] !== "/") {
            uriTokens.push("/");
          }
        }
        if (component.path !== void 0) {
          let s = component.path;
          if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
            s = removeDotSegments(s);
          }
          if (authority === void 0 && s[0] === "/" && s[1] === "/") {
            s = "/%2F" + s.slice(2);
          }
          uriTokens.push(s);
        }
        if (component.query !== void 0) {
          uriTokens.push("?", component.query);
        }
        if (component.fragment !== void 0) {
          uriTokens.push("#", component.fragment);
        }
        return uriTokens.join("");
      }
      var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
      function parse2(uri, opts) {
        const options = Object.assign({}, opts);
        const parsed = {
          scheme: void 0,
          userinfo: void 0,
          host: "",
          port: void 0,
          path: "",
          query: void 0,
          fragment: void 0
        };
        let isIP = false;
        if (options.reference === "suffix") {
          if (options.scheme) {
            uri = options.scheme + ":" + uri;
          } else {
            uri = "//" + uri;
          }
        }
        const matches = uri.match(URI_PARSE);
        if (matches) {
          parsed.scheme = matches[1];
          parsed.userinfo = matches[3];
          parsed.host = matches[4];
          parsed.port = parseInt(matches[5], 10);
          parsed.path = matches[6] || "";
          parsed.query = matches[7];
          parsed.fragment = matches[8];
          if (isNaN(parsed.port)) {
            parsed.port = matches[5];
          }
          if (parsed.host) {
            const ipv4result = isIPv4(parsed.host);
            if (ipv4result === false) {
              const ipv6result = normalizeIPv6(parsed.host);
              parsed.host = ipv6result.host.toLowerCase();
              isIP = ipv6result.isIPV6;
            } else {
              isIP = true;
            }
          }
          if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
            parsed.reference = "same-document";
          } else if (parsed.scheme === void 0) {
            parsed.reference = "relative";
          } else if (parsed.fragment === void 0) {
            parsed.reference = "absolute";
          } else {
            parsed.reference = "uri";
          }
          if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
            parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
          }
          const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
          if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
            if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
              try {
                parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
              } catch (e) {
                parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
              }
            }
          }
          if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
            if (uri.indexOf("%") !== -1) {
              if (parsed.scheme !== void 0) {
                parsed.scheme = unescape(parsed.scheme);
              }
              if (parsed.host !== void 0) {
                parsed.host = unescape(parsed.host);
              }
            }
            if (parsed.path) {
              parsed.path = escape(unescape(parsed.path));
            }
            if (parsed.fragment) {
              parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
            }
          }
          if (schemeHandler && schemeHandler.parse) {
            schemeHandler.parse(parsed, options);
          }
        } else {
          parsed.error = parsed.error || "URI can not be parsed.";
        }
        return parsed;
      }
      var fastUri = {
        SCHEMES,
        normalize,
        resolve,
        resolveComponent,
        equal,
        serialize,
        parse: parse2
      };
      module.exports = fastUri;
      module.exports.default = fastUri;
      module.exports.fastUri = fastUri;
    }
  });

  // node_modules/ajv/dist/runtime/uri.js
  var require_uri = __commonJS({
    "node_modules/ajv/dist/runtime/uri.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var uri = require_fast_uri();
      uri.code = 'require("ajv/dist/runtime/uri").default';
      exports.default = uri;
    }
  });

  // node_modules/ajv/dist/core.js
  var require_core = __commonJS({
    "node_modules/ajv/dist/core.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
      var validate_1 = require_validate();
      Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
        return validate_1.KeywordCxt;
      } });
      var codegen_1 = require_codegen();
      Object.defineProperty(exports, "_", { enumerable: true, get: function() {
        return codegen_1._;
      } });
      Object.defineProperty(exports, "str", { enumerable: true, get: function() {
        return codegen_1.str;
      } });
      Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
        return codegen_1.stringify;
      } });
      Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
        return codegen_1.nil;
      } });
      Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
        return codegen_1.Name;
      } });
      Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
        return codegen_1.CodeGen;
      } });
      var validation_error_1 = require_validation_error();
      var ref_error_1 = require_ref_error();
      var rules_1 = require_rules();
      var compile_1 = require_compile();
      var codegen_2 = require_codegen();
      var resolve_1 = require_resolve();
      var dataType_1 = require_dataType();
      var util_1 = require_util();
      var $dataRefSchema = require_data();
      var uri_1 = require_uri();
      var defaultRegExp = (str, flags) => new RegExp(str, flags);
      defaultRegExp.code = "new RegExp";
      var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
      var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
        "validate",
        "serialize",
        "parse",
        "wrapper",
        "root",
        "schema",
        "keyword",
        "pattern",
        "formats",
        "validate$data",
        "func",
        "obj",
        "Error"
      ]);
      var removedOptions = {
        errorDataPath: "",
        format: "`validateFormats: false` can be used instead.",
        nullable: '"nullable" keyword is supported by default.',
        jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
        extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
        missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
        processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
        sourceCode: "Use option `code: {source: true}`",
        strictDefaults: "It is default now, see option `strict`.",
        strictKeywords: "It is default now, see option `strict`.",
        uniqueItems: '"uniqueItems" keyword is always validated.',
        unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
        cache: "Map is used as cache, schema object as key.",
        serialize: "Map is used as cache, schema object as key.",
        ajvErrors: "It is default now."
      };
      var deprecatedOptions = {
        ignoreKeywordsWithRef: "",
        jsPropertySyntax: "",
        unicode: '"minLength"/"maxLength" account for unicode characters by default.'
      };
      var MAX_EXPRESSION = 200;
      function requiredOptions(o) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        const s = o.strict;
        const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
        const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
        const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
        const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
        return {
          strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
          strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
          strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
          strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
          strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
          code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
          loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
          loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
          meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
          messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
          inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
          schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
          addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
          validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
          validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
          unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
          int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
          uriResolver
        };
      }
      var Ajv2 = class {
        constructor(opts = {}) {
          this.schemas = {};
          this.refs = {};
          this.formats = {};
          this._compilations = /* @__PURE__ */ new Set();
          this._loading = {};
          this._cache = /* @__PURE__ */ new Map();
          opts = this.opts = { ...opts, ...requiredOptions(opts) };
          const { es5, lines } = this.opts.code;
          this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
          this.logger = getLogger(opts.logger);
          const formatOpt = opts.validateFormats;
          opts.validateFormats = false;
          this.RULES = (0, rules_1.getRules)();
          checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
          checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
          this._metaOpts = getMetaSchemaOptions.call(this);
          if (opts.formats)
            addInitialFormats.call(this);
          this._addVocabularies();
          this._addDefaultMetaSchema();
          if (opts.keywords)
            addInitialKeywords.call(this, opts.keywords);
          if (typeof opts.meta == "object")
            this.addMetaSchema(opts.meta);
          addInitialSchemas.call(this);
          opts.validateFormats = formatOpt;
        }
        _addVocabularies() {
          this.addKeyword("$async");
        }
        _addDefaultMetaSchema() {
          const { $data, meta, schemaId } = this.opts;
          let _dataRefSchema = $dataRefSchema;
          if (schemaId === "id") {
            _dataRefSchema = { ...$dataRefSchema };
            _dataRefSchema.id = _dataRefSchema.$id;
            delete _dataRefSchema.$id;
          }
          if (meta && $data)
            this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
        }
        defaultMeta() {
          const { meta, schemaId } = this.opts;
          return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
        }
        validate(schemaKeyRef, data) {
          let v;
          if (typeof schemaKeyRef == "string") {
            v = this.getSchema(schemaKeyRef);
            if (!v)
              throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
          } else {
            v = this.compile(schemaKeyRef);
          }
          const valid = v(data);
          if (!("$async" in v))
            this.errors = v.errors;
          return valid;
        }
        compile(schema, _meta) {
          const sch = this._addSchema(schema, _meta);
          return sch.validate || this._compileSchemaEnv(sch);
        }
        compileAsync(schema, meta) {
          if (typeof this.opts.loadSchema != "function") {
            throw new Error("options.loadSchema should be a function");
          }
          const { loadSchema } = this.opts;
          return runCompileAsync.call(this, schema, meta);
          async function runCompileAsync(_schema, _meta) {
            await loadMetaSchema.call(this, _schema.$schema);
            const sch = this._addSchema(_schema, _meta);
            return sch.validate || _compileAsync.call(this, sch);
          }
          async function loadMetaSchema($ref) {
            if ($ref && !this.getSchema($ref)) {
              await runCompileAsync.call(this, { $ref }, true);
            }
          }
          async function _compileAsync(sch) {
            try {
              return this._compileSchemaEnv(sch);
            } catch (e) {
              if (!(e instanceof ref_error_1.default))
                throw e;
              checkLoaded.call(this, e);
              await loadMissingSchema.call(this, e.missingSchema);
              return _compileAsync.call(this, sch);
            }
          }
          function checkLoaded({ missingSchema: ref, missingRef }) {
            if (this.refs[ref]) {
              throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
            }
          }
          async function loadMissingSchema(ref) {
            const _schema = await _loadSchema.call(this, ref);
            if (!this.refs[ref])
              await loadMetaSchema.call(this, _schema.$schema);
            if (!this.refs[ref])
              this.addSchema(_schema, ref, meta);
          }
          async function _loadSchema(ref) {
            const p = this._loading[ref];
            if (p)
              return p;
            try {
              return await (this._loading[ref] = loadSchema(ref));
            } finally {
              delete this._loading[ref];
            }
          }
        }
        // Adds schema to the instance
        addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
          if (Array.isArray(schema)) {
            for (const sch of schema)
              this.addSchema(sch, void 0, _meta, _validateSchema);
            return this;
          }
          let id;
          if (typeof schema === "object") {
            const { schemaId } = this.opts;
            id = schema[schemaId];
            if (id !== void 0 && typeof id != "string") {
              throw new Error(`schema ${schemaId} must be string`);
            }
          }
          key = (0, resolve_1.normalizeId)(key || id);
          this._checkUnique(key);
          this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
          return this;
        }
        // Add schema that will be used to validate other schemas
        // options in META_IGNORE_OPTIONS are alway set to false
        addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
          this.addSchema(schema, key, true, _validateSchema);
          return this;
        }
        //  Validate schema against its meta-schema
        validateSchema(schema, throwOrLogError) {
          if (typeof schema == "boolean")
            return true;
          let $schema;
          $schema = schema.$schema;
          if ($schema !== void 0 && typeof $schema != "string") {
            throw new Error("$schema must be a string");
          }
          $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
          if (!$schema) {
            this.logger.warn("meta-schema not available");
            this.errors = null;
            return true;
          }
          const valid = this.validate($schema, schema);
          if (!valid && throwOrLogError) {
            const message = "schema is invalid: " + this.errorsText();
            if (this.opts.validateSchema === "log")
              this.logger.error(message);
            else
              throw new Error(message);
          }
          return valid;
        }
        // Get compiled schema by `key` or `ref`.
        // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
        getSchema(keyRef) {
          let sch;
          while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
            keyRef = sch;
          if (sch === void 0) {
            const { schemaId } = this.opts;
            const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
            sch = compile_1.resolveSchema.call(this, root, keyRef);
            if (!sch)
              return;
            this.refs[keyRef] = sch;
          }
          return sch.validate || this._compileSchemaEnv(sch);
        }
        // Remove cached schema(s).
        // If no parameter is passed all schemas but meta-schemas are removed.
        // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
        // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
        removeSchema(schemaKeyRef) {
          if (schemaKeyRef instanceof RegExp) {
            this._removeAllSchemas(this.schemas, schemaKeyRef);
            this._removeAllSchemas(this.refs, schemaKeyRef);
            return this;
          }
          switch (typeof schemaKeyRef) {
            case "undefined":
              this._removeAllSchemas(this.schemas);
              this._removeAllSchemas(this.refs);
              this._cache.clear();
              return this;
            case "string": {
              const sch = getSchEnv.call(this, schemaKeyRef);
              if (typeof sch == "object")
                this._cache.delete(sch.schema);
              delete this.schemas[schemaKeyRef];
              delete this.refs[schemaKeyRef];
              return this;
            }
            case "object": {
              const cacheKey = schemaKeyRef;
              this._cache.delete(cacheKey);
              let id = schemaKeyRef[this.opts.schemaId];
              if (id) {
                id = (0, resolve_1.normalizeId)(id);
                delete this.schemas[id];
                delete this.refs[id];
              }
              return this;
            }
            default:
              throw new Error("ajv.removeSchema: invalid parameter");
          }
        }
        // add "vocabulary" - a collection of keywords
        addVocabulary(definitions) {
          for (const def of definitions)
            this.addKeyword(def);
          return this;
        }
        addKeyword(kwdOrDef, def) {
          let keyword;
          if (typeof kwdOrDef == "string") {
            keyword = kwdOrDef;
            if (typeof def == "object") {
              this.logger.warn("these parameters are deprecated, see docs for addKeyword");
              def.keyword = keyword;
            }
          } else if (typeof kwdOrDef == "object" && def === void 0) {
            def = kwdOrDef;
            keyword = def.keyword;
            if (Array.isArray(keyword) && !keyword.length) {
              throw new Error("addKeywords: keyword must be string or non-empty array");
            }
          } else {
            throw new Error("invalid addKeywords parameters");
          }
          checkKeyword.call(this, keyword, def);
          if (!def) {
            (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
            return this;
          }
          keywordMetaschema.call(this, def);
          const definition = {
            ...def,
            type: (0, dataType_1.getJSONTypes)(def.type),
            schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
          };
          (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
          return this;
        }
        getKeyword(keyword) {
          const rule = this.RULES.all[keyword];
          return typeof rule == "object" ? rule.definition : !!rule;
        }
        // Remove keyword
        removeKeyword(keyword) {
          const { RULES } = this;
          delete RULES.keywords[keyword];
          delete RULES.all[keyword];
          for (const group of RULES.rules) {
            const i = group.rules.findIndex((rule) => rule.keyword === keyword);
            if (i >= 0)
              group.rules.splice(i, 1);
          }
          return this;
        }
        // Add format
        addFormat(name, format) {
          if (typeof format == "string")
            format = new RegExp(format);
          this.formats[name] = format;
          return this;
        }
        errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
          if (!errors || errors.length === 0)
            return "No errors";
          return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
        }
        $dataMetaSchema(metaSchema, keywordsJsonPointers) {
          const rules = this.RULES.all;
          metaSchema = JSON.parse(JSON.stringify(metaSchema));
          for (const jsonPointer of keywordsJsonPointers) {
            const segments = jsonPointer.split("/").slice(1);
            let keywords = metaSchema;
            for (const seg of segments)
              keywords = keywords[seg];
            for (const key in rules) {
              const rule = rules[key];
              if (typeof rule != "object")
                continue;
              const { $data } = rule.definition;
              const schema = keywords[key];
              if ($data && schema)
                keywords[key] = schemaOrData(schema);
            }
          }
          return metaSchema;
        }
        _removeAllSchemas(schemas, regex) {
          for (const keyRef in schemas) {
            const sch = schemas[keyRef];
            if (!regex || regex.test(keyRef)) {
              if (typeof sch == "string") {
                delete schemas[keyRef];
              } else if (sch && !sch.meta) {
                this._cache.delete(sch.schema);
                delete schemas[keyRef];
              }
            }
          }
        }
        _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
          let id;
          const { schemaId } = this.opts;
          if (typeof schema == "object") {
            id = schema[schemaId];
          } else {
            if (this.opts.jtd)
              throw new Error("schema must be object");
            else if (typeof schema != "boolean")
              throw new Error("schema must be object or boolean");
          }
          let sch = this._cache.get(schema);
          if (sch !== void 0)
            return sch;
          baseId = (0, resolve_1.normalizeId)(id || baseId);
          const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
          sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
          this._cache.set(sch.schema, sch);
          if (addSchema && !baseId.startsWith("#")) {
            if (baseId)
              this._checkUnique(baseId);
            this.refs[baseId] = sch;
          }
          if (validateSchema)
            this.validateSchema(schema, true);
          return sch;
        }
        _checkUnique(id) {
          if (this.schemas[id] || this.refs[id]) {
            throw new Error(`schema with key or id "${id}" already exists`);
          }
        }
        _compileSchemaEnv(sch) {
          if (sch.meta)
            this._compileMetaSchema(sch);
          else
            compile_1.compileSchema.call(this, sch);
          if (!sch.validate)
            throw new Error("ajv implementation error");
          return sch.validate;
        }
        _compileMetaSchema(sch) {
          const currentOpts = this.opts;
          this.opts = this._metaOpts;
          try {
            compile_1.compileSchema.call(this, sch);
          } finally {
            this.opts = currentOpts;
          }
        }
      };
      Ajv2.ValidationError = validation_error_1.default;
      Ajv2.MissingRefError = ref_error_1.default;
      exports.default = Ajv2;
      function checkOptions(checkOpts, options, msg, log = "error") {
        for (const key in checkOpts) {
          const opt = key;
          if (opt in options)
            this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
        }
      }
      function getSchEnv(keyRef) {
        keyRef = (0, resolve_1.normalizeId)(keyRef);
        return this.schemas[keyRef] || this.refs[keyRef];
      }
      function addInitialSchemas() {
        const optsSchemas = this.opts.schemas;
        if (!optsSchemas)
          return;
        if (Array.isArray(optsSchemas))
          this.addSchema(optsSchemas);
        else
          for (const key in optsSchemas)
            this.addSchema(optsSchemas[key], key);
      }
      function addInitialFormats() {
        for (const name in this.opts.formats) {
          const format = this.opts.formats[name];
          if (format)
            this.addFormat(name, format);
        }
      }
      function addInitialKeywords(defs) {
        if (Array.isArray(defs)) {
          this.addVocabulary(defs);
          return;
        }
        this.logger.warn("keywords option as map is deprecated, pass array");
        for (const keyword in defs) {
          const def = defs[keyword];
          if (!def.keyword)
            def.keyword = keyword;
          this.addKeyword(def);
        }
      }
      function getMetaSchemaOptions() {
        const metaOpts = { ...this.opts };
        for (const opt of META_IGNORE_OPTIONS)
          delete metaOpts[opt];
        return metaOpts;
      }
      var noLogs = { log() {
      }, warn() {
      }, error() {
      } };
      function getLogger(logger) {
        if (logger === false)
          return noLogs;
        if (logger === void 0)
          return console;
        if (logger.log && logger.warn && logger.error)
          return logger;
        throw new Error("logger must implement log, warn and error methods");
      }
      var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
      function checkKeyword(keyword, def) {
        const { RULES } = this;
        (0, util_1.eachItem)(keyword, (kwd) => {
          if (RULES.keywords[kwd])
            throw new Error(`Keyword ${kwd} is already defined`);
          if (!KEYWORD_NAME.test(kwd))
            throw new Error(`Keyword ${kwd} has invalid name`);
        });
        if (!def)
          return;
        if (def.$data && !("code" in def || "validate" in def)) {
          throw new Error('$data keyword must have "code" or "validate" function');
        }
      }
      function addRule(keyword, definition, dataType) {
        var _a;
        const post = definition === null || definition === void 0 ? void 0 : definition.post;
        if (dataType && post)
          throw new Error('keyword with "post" flag cannot have "type"');
        const { RULES } = this;
        let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
        if (!ruleGroup) {
          ruleGroup = { type: dataType, rules: [] };
          RULES.rules.push(ruleGroup);
        }
        RULES.keywords[keyword] = true;
        if (!definition)
          return;
        const rule = {
          keyword,
          definition: {
            ...definition,
            type: (0, dataType_1.getJSONTypes)(definition.type),
            schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
          }
        };
        if (definition.before)
          addBeforeRule.call(this, ruleGroup, rule, definition.before);
        else
          ruleGroup.rules.push(rule);
        RULES.all[keyword] = rule;
        (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
      }
      function addBeforeRule(ruleGroup, rule, before) {
        const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
        if (i >= 0) {
          ruleGroup.rules.splice(i, 0, rule);
        } else {
          ruleGroup.rules.push(rule);
          this.logger.warn(`rule ${before} is not defined`);
        }
      }
      function keywordMetaschema(def) {
        let { metaSchema } = def;
        if (metaSchema === void 0)
          return;
        if (def.$data && this.opts.$data)
          metaSchema = schemaOrData(metaSchema);
        def.validateSchema = this.compile(metaSchema, true);
      }
      var $dataRef = {
        $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
      };
      function schemaOrData(schema) {
        return { anyOf: [schema, $dataRef] };
      }
    }
  });

  // node_modules/ajv/dist/vocabularies/core/id.js
  var require_id = __commonJS({
    "node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var def = {
        keyword: "id",
        code() {
          throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/core/ref.js
  var require_ref = __commonJS({
    "node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.callRef = exports.getValidate = void 0;
      var ref_error_1 = require_ref_error();
      var code_1 = require_code2();
      var codegen_1 = require_codegen();
      var names_1 = require_names();
      var compile_1 = require_compile();
      var util_1 = require_util();
      var def = {
        keyword: "$ref",
        schemaType: "string",
        code(cxt) {
          const { gen, schema: $ref, it } = cxt;
          const { baseId, schemaEnv: env, validateName, opts, self } = it;
          const { root } = env;
          if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
            return callRootRef();
          const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
          if (schOrEnv === void 0)
            throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
          if (schOrEnv instanceof compile_1.SchemaEnv)
            return callValidate(schOrEnv);
          return inlineRefSchema(schOrEnv);
          function callRootRef() {
            if (env === root)
              return callRef(cxt, validateName, env, env.$async);
            const rootName = gen.scopeValue("root", { ref: root });
            return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
          }
          function callValidate(sch) {
            const v = getValidate(cxt, sch);
            callRef(cxt, v, sch, sch.$async);
          }
          function inlineRefSchema(sch) {
            const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
            const valid = gen.name("valid");
            const schCxt = cxt.subschema({
              schema: sch,
              dataTypes: [],
              schemaPath: codegen_1.nil,
              topSchemaRef: schName,
              errSchemaPath: $ref
            }, valid);
            cxt.mergeEvaluated(schCxt);
            cxt.ok(valid);
          }
        }
      };
      function getValidate(cxt, sch) {
        const { gen } = cxt;
        return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
      }
      exports.getValidate = getValidate;
      function callRef(cxt, v, sch, $async) {
        const { gen, it } = cxt;
        const { allErrors, schemaEnv: env, opts } = it;
        const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
        if ($async)
          callAsyncRef();
        else
          callSyncRef();
        function callAsyncRef() {
          if (!env.$async)
            throw new Error("async schema referenced by sync schema");
          const valid = gen.let("valid");
          gen.try(() => {
            gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
            addEvaluatedFrom(v);
            if (!allErrors)
              gen.assign(valid, true);
          }, (e) => {
            gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
            addErrorsFrom(e);
            if (!allErrors)
              gen.assign(valid, false);
          });
          cxt.ok(valid);
        }
        function callSyncRef() {
          cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
        }
        function addErrorsFrom(source) {
          const errs = (0, codegen_1._)`${source}.errors`;
          gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
          gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        }
        function addEvaluatedFrom(source) {
          var _a;
          if (!it.opts.unevaluated)
            return;
          const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
          if (it.props !== true) {
            if (schEvaluated && !schEvaluated.dynamicProps) {
              if (schEvaluated.props !== void 0) {
                it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
              }
            } else {
              const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
              it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
            }
          }
          if (it.items !== true) {
            if (schEvaluated && !schEvaluated.dynamicItems) {
              if (schEvaluated.items !== void 0) {
                it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
              }
            } else {
              const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
              it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
            }
          }
        }
      }
      exports.callRef = callRef;
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/core/index.js
  var require_core2 = __commonJS({
    "node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var id_1 = require_id();
      var ref_1 = require_ref();
      var core = [
        "$schema",
        "$id",
        "$defs",
        "$vocabulary",
        { keyword: "$comment" },
        "definitions",
        id_1.default,
        ref_1.default
      ];
      exports.default = core;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/limitNumber.js
  var require_limitNumber = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var ops = codegen_1.operators;
      var KWDs = {
        maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
        minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
        exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
        exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
      };
      var error = {
        message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
        params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
      };
      var def = {
        keyword: Object.keys(KWDs),
        type: "number",
        schemaType: "number",
        $data: true,
        error,
        code(cxt) {
          const { keyword, data, schemaCode } = cxt;
          cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/multipleOf.js
  var require_multipleOf = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var error = {
        message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
        params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
      };
      var def = {
        keyword: "multipleOf",
        type: "number",
        schemaType: "number",
        $data: true,
        error,
        code(cxt) {
          const { gen, data, schemaCode, it } = cxt;
          const prec = it.opts.multipleOfPrecision;
          const res = gen.let("res");
          const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
          cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/runtime/ucs2length.js
  var require_ucs2length = __commonJS({
    "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      function ucs2length(str) {
        const len = str.length;
        let length = 0;
        let pos = 0;
        let value;
        while (pos < len) {
          length++;
          value = str.charCodeAt(pos++);
          if (value >= 55296 && value <= 56319 && pos < len) {
            value = str.charCodeAt(pos);
            if ((value & 64512) === 56320)
              pos++;
          }
        }
        return length;
      }
      exports.default = ucs2length;
      ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/limitLength.js
  var require_limitLength = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var ucs2length_1 = require_ucs2length();
      var error = {
        message({ keyword, schemaCode }) {
          const comp = keyword === "maxLength" ? "more" : "fewer";
          return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
        },
        params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
      };
      var def = {
        keyword: ["maxLength", "minLength"],
        type: "string",
        schemaType: "number",
        $data: true,
        error,
        code(cxt) {
          const { keyword, data, schemaCode, it } = cxt;
          const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
          const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
          cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/pattern.js
  var require_pattern = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var code_1 = require_code2();
      var codegen_1 = require_codegen();
      var error = {
        message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
        params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
      };
      var def = {
        keyword: "pattern",
        type: "string",
        schemaType: "string",
        $data: true,
        error,
        code(cxt) {
          const { data, $data, schema, schemaCode, it } = cxt;
          const u = it.opts.unicodeRegExp ? "u" : "";
          const regExp = $data ? (0, codegen_1._)`(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
          cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/limitProperties.js
  var require_limitProperties = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var error = {
        message({ keyword, schemaCode }) {
          const comp = keyword === "maxProperties" ? "more" : "fewer";
          return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
        },
        params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
      };
      var def = {
        keyword: ["maxProperties", "minProperties"],
        type: "object",
        schemaType: "number",
        $data: true,
        error,
        code(cxt) {
          const { keyword, data, schemaCode } = cxt;
          const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
          cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/required.js
  var require_required = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var code_1 = require_code2();
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
        params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
      };
      var def = {
        keyword: "required",
        type: "object",
        schemaType: "array",
        $data: true,
        error,
        code(cxt) {
          const { gen, schema, schemaCode, data, $data, it } = cxt;
          const { opts } = it;
          if (!$data && schema.length === 0)
            return;
          const useLoop = schema.length >= opts.loopRequired;
          if (it.allErrors)
            allErrorsMode();
          else
            exitOnErrorMode();
          if (opts.strictRequired) {
            const props = cxt.parentSchema.properties;
            const { definedProperties } = cxt.it;
            for (const requiredKey of schema) {
              if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
                const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
                const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
                (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
              }
            }
          }
          function allErrorsMode() {
            if (useLoop || $data) {
              cxt.block$data(codegen_1.nil, loopAllRequired);
            } else {
              for (const prop of schema) {
                (0, code_1.checkReportMissingProp)(cxt, prop);
              }
            }
          }
          function exitOnErrorMode() {
            const missing = gen.let("missing");
            if (useLoop || $data) {
              const valid = gen.let("valid", true);
              cxt.block$data(valid, () => loopUntilMissing(missing, valid));
              cxt.ok(valid);
            } else {
              gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
              (0, code_1.reportMissingProp)(cxt, missing);
              gen.else();
            }
          }
          function loopAllRequired() {
            gen.forOf("prop", schemaCode, (prop) => {
              cxt.setParams({ missingProperty: prop });
              gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
            });
          }
          function loopUntilMissing(missing, valid) {
            cxt.setParams({ missingProperty: missing });
            gen.forOf(missing, schemaCode, () => {
              gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.error();
                gen.break();
              });
            }, codegen_1.nil);
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/limitItems.js
  var require_limitItems = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var error = {
        message({ keyword, schemaCode }) {
          const comp = keyword === "maxItems" ? "more" : "fewer";
          return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
        },
        params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
      };
      var def = {
        keyword: ["maxItems", "minItems"],
        type: "array",
        schemaType: "number",
        $data: true,
        error,
        code(cxt) {
          const { keyword, data, schemaCode } = cxt;
          const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
          cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/runtime/equal.js
  var require_equal = __commonJS({
    "node_modules/ajv/dist/runtime/equal.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var equal = require_fast_deep_equal();
      equal.code = 'require("ajv/dist/runtime/equal").default';
      exports.default = equal;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
  var require_uniqueItems = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var dataType_1 = require_dataType();
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var equal_1 = require_equal();
      var error = {
        message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
        params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
      };
      var def = {
        keyword: "uniqueItems",
        type: "array",
        schemaType: "boolean",
        $data: true,
        error,
        code(cxt) {
          const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
          if (!$data && !schema)
            return;
          const valid = gen.let("valid");
          const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
          cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
          cxt.ok(valid);
          function validateUniqueItems() {
            const i = gen.let("i", (0, codegen_1._)`${data}.length`);
            const j = gen.let("j");
            cxt.setParams({ i, j });
            gen.assign(valid, true);
            gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
          }
          function canOptimize() {
            return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
          }
          function loopN(i, j) {
            const item = gen.name("item");
            const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
            const indices = gen.const("indices", (0, codegen_1._)`{}`);
            gen.for((0, codegen_1._)`;${i}--;`, () => {
              gen.let(item, (0, codegen_1._)`${data}[${i}]`);
              gen.if(wrongType, (0, codegen_1._)`continue`);
              if (itemTypes.length > 1)
                gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
              gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
                gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
                cxt.error();
                gen.assign(valid, false).break();
              }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
            });
          }
          function loopN2(i, j) {
            const eql = (0, util_1.useFunc)(gen, equal_1.default);
            const outer = gen.name("outer");
            gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
              cxt.error();
              gen.assign(valid, false).break(outer);
            })));
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/const.js
  var require_const = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var equal_1 = require_equal();
      var error = {
        message: "must be equal to constant",
        params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
      };
      var def = {
        keyword: "const",
        $data: true,
        error,
        code(cxt) {
          const { gen, data, $data, schemaCode, schema } = cxt;
          if ($data || schema && typeof schema == "object") {
            cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
          } else {
            cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/enum.js
  var require_enum = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var equal_1 = require_equal();
      var error = {
        message: "must be equal to one of the allowed values",
        params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
      };
      var def = {
        keyword: "enum",
        schemaType: "array",
        $data: true,
        error,
        code(cxt) {
          const { gen, data, $data, schema, schemaCode, it } = cxt;
          if (!$data && schema.length === 0)
            throw new Error("enum must have non-empty array");
          const useLoop = schema.length >= it.opts.loopEnum;
          let eql;
          const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
          let valid;
          if (useLoop || $data) {
            valid = gen.let("valid");
            cxt.block$data(valid, loopEnum);
          } else {
            if (!Array.isArray(schema))
              throw new Error("ajv implementation error");
            const vSchema = gen.const("vSchema", schemaCode);
            valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
          }
          cxt.pass(valid);
          function loopEnum() {
            gen.assign(valid, false);
            gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
          }
          function equalCode(vSchema, i) {
            const sch = schema[i];
            return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/validation/index.js
  var require_validation = __commonJS({
    "node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var limitNumber_1 = require_limitNumber();
      var multipleOf_1 = require_multipleOf();
      var limitLength_1 = require_limitLength();
      var pattern_1 = require_pattern();
      var limitProperties_1 = require_limitProperties();
      var required_1 = require_required();
      var limitItems_1 = require_limitItems();
      var uniqueItems_1 = require_uniqueItems();
      var const_1 = require_const();
      var enum_1 = require_enum();
      var validation = [
        // number
        limitNumber_1.default,
        multipleOf_1.default,
        // string
        limitLength_1.default,
        pattern_1.default,
        // object
        limitProperties_1.default,
        required_1.default,
        // array
        limitItems_1.default,
        uniqueItems_1.default,
        // any
        { keyword: "type", schemaType: ["string", "array"] },
        { keyword: "nullable", schemaType: "boolean" },
        const_1.default,
        enum_1.default
      ];
      exports.default = validation;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
  var require_additionalItems = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateAdditionalItems = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
        params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
      };
      var def = {
        keyword: "additionalItems",
        type: "array",
        schemaType: ["boolean", "object"],
        before: "uniqueItems",
        error,
        code(cxt) {
          const { parentSchema, it } = cxt;
          const { items } = parentSchema;
          if (!Array.isArray(items)) {
            (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
            return;
          }
          validateAdditionalItems(cxt, items);
        }
      };
      function validateAdditionalItems(cxt, items) {
        const { gen, schema, data, keyword, it } = cxt;
        it.items = true;
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        if (schema === false) {
          cxt.setParams({ len: items.length });
          cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
        } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
          gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
          cxt.ok(valid);
        }
        function validateItems(valid) {
          gen.forRange("i", items.length, len, (i) => {
            cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
            if (!it.allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          });
        }
      }
      exports.validateAdditionalItems = validateAdditionalItems;
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/items.js
  var require_items = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateTuple = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var code_1 = require_code2();
      var def = {
        keyword: "items",
        type: "array",
        schemaType: ["object", "array", "boolean"],
        before: "uniqueItems",
        code(cxt) {
          const { schema, it } = cxt;
          if (Array.isArray(schema))
            return validateTuple(cxt, "additionalItems", schema);
          it.items = true;
          if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
          cxt.ok((0, code_1.validateArray)(cxt));
        }
      };
      function validateTuple(cxt, extraItems, schArr = cxt.schema) {
        const { gen, parentSchema, data, keyword, it } = cxt;
        checkStrictTuple(parentSchema);
        if (it.opts.unevaluated && schArr.length && it.items !== true) {
          it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
        }
        const valid = gen.name("valid");
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        schArr.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
            keyword,
            schemaProp: i,
            dataProp: i
          }, valid));
          cxt.ok(valid);
        });
        function checkStrictTuple(sch) {
          const { opts, errSchemaPath } = it;
          const l = schArr.length;
          const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
          if (opts.strictTuples && !fullTuple) {
            const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
            (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
          }
        }
      }
      exports.validateTuple = validateTuple;
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
  var require_prefixItems = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var items_1 = require_items();
      var def = {
        keyword: "prefixItems",
        type: "array",
        schemaType: ["array"],
        before: "uniqueItems",
        code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/items2020.js
  var require_items2020 = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var code_1 = require_code2();
      var additionalItems_1 = require_additionalItems();
      var error = {
        message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
        params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
      };
      var def = {
        keyword: "items",
        type: "array",
        schemaType: ["object", "boolean"],
        before: "uniqueItems",
        error,
        code(cxt) {
          const { schema, parentSchema, it } = cxt;
          const { prefixItems } = parentSchema;
          it.items = true;
          if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
          if (prefixItems)
            (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
          else
            cxt.ok((0, code_1.validateArray)(cxt));
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/contains.js
  var require_contains = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
        params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
      };
      var def = {
        keyword: "contains",
        type: "array",
        schemaType: ["object", "boolean"],
        before: "uniqueItems",
        trackErrors: true,
        error,
        code(cxt) {
          const { gen, schema, parentSchema, data, it } = cxt;
          let min;
          let max;
          const { minContains, maxContains } = parentSchema;
          if (it.opts.next) {
            min = minContains === void 0 ? 1 : minContains;
            max = maxContains;
          } else {
            min = 1;
          }
          const len = gen.const("len", (0, codegen_1._)`${data}.length`);
          cxt.setParams({ min, max });
          if (max === void 0 && min === 0) {
            (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
            return;
          }
          if (max !== void 0 && min > max) {
            (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
            cxt.fail();
            return;
          }
          if ((0, util_1.alwaysValidSchema)(it, schema)) {
            let cond = (0, codegen_1._)`${len} >= ${min}`;
            if (max !== void 0)
              cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
            cxt.pass(cond);
            return;
          }
          it.items = true;
          const valid = gen.name("valid");
          if (max === void 0 && min === 1) {
            validateItems(valid, () => gen.if(valid, () => gen.break()));
          } else if (min === 0) {
            gen.let(valid, true);
            if (max !== void 0)
              gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
          } else {
            gen.let(valid, false);
            validateItemsWithCount();
          }
          cxt.result(valid, () => cxt.reset());
          function validateItemsWithCount() {
            const schValid = gen.name("_valid");
            const count = gen.let("count", 0);
            validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
          }
          function validateItems(_valid, block) {
            gen.forRange("i", 0, len, (i) => {
              cxt.subschema({
                keyword: "contains",
                dataProp: i,
                dataPropType: util_1.Type.Num,
                compositeRule: true
              }, _valid);
              block();
            });
          }
          function checkLimits(count) {
            gen.code((0, codegen_1._)`${count}++`);
            if (max === void 0) {
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
            } else {
              gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
              if (min === 1)
                gen.assign(valid, true);
              else
                gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
            }
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/dependencies.js
  var require_dependencies = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var code_1 = require_code2();
      exports.error = {
        message: ({ params: { property, depsCount, deps } }) => {
          const property_ies = depsCount === 1 ? "property" : "properties";
          return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
        },
        params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
        // TODO change to reference
      };
      var def = {
        keyword: "dependencies",
        type: "object",
        schemaType: "object",
        error: exports.error,
        code(cxt) {
          const [propDeps, schDeps] = splitDependencies(cxt);
          validatePropertyDeps(cxt, propDeps);
          validateSchemaDeps(cxt, schDeps);
        }
      };
      function splitDependencies({ schema }) {
        const propertyDeps = {};
        const schemaDeps = {};
        for (const key in schema) {
          if (key === "__proto__")
            continue;
          const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
          deps[key] = schema[key];
        }
        return [propertyDeps, schemaDeps];
      }
      function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
        const { gen, data, it } = cxt;
        if (Object.keys(propertyDeps).length === 0)
          return;
        const missing = gen.let("missing");
        for (const prop in propertyDeps) {
          const deps = propertyDeps[prop];
          if (deps.length === 0)
            continue;
          const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
          cxt.setParams({
            property: prop,
            depsCount: deps.length,
            deps: deps.join(", ")
          });
          if (it.allErrors) {
            gen.if(hasProperty, () => {
              for (const depProp of deps) {
                (0, code_1.checkReportMissingProp)(cxt, depProp);
              }
            });
          } else {
            gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
      }
      exports.validatePropertyDeps = validatePropertyDeps;
      function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
        const { gen, data, keyword, it } = cxt;
        const valid = gen.name("valid");
        for (const prop in schemaDeps) {
          if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
            continue;
          gen.if(
            (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
            () => {
              const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
              cxt.mergeValidEvaluated(schCxt, valid);
            },
            () => gen.var(valid, true)
            // TODO var
          );
          cxt.ok(valid);
        }
      }
      exports.validateSchemaDeps = validateSchemaDeps;
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
  var require_propertyNames = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: "property name must be valid",
        params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
      };
      var def = {
        keyword: "propertyNames",
        type: "object",
        schemaType: ["object", "boolean"],
        error,
        code(cxt) {
          const { gen, schema, data, it } = cxt;
          if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
          const valid = gen.name("valid");
          gen.forIn("key", data, (key) => {
            cxt.setParams({ propertyName: key });
            cxt.subschema({
              keyword: "propertyNames",
              data: key,
              dataTypes: ["string"],
              propertyName: key,
              compositeRule: true
            }, valid);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error(true);
              if (!it.allErrors)
                gen.break();
            });
          });
          cxt.ok(valid);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
  var require_additionalProperties = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var code_1 = require_code2();
      var codegen_1 = require_codegen();
      var names_1 = require_names();
      var util_1 = require_util();
      var error = {
        message: "must NOT have additional properties",
        params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
      };
      var def = {
        keyword: "additionalProperties",
        type: ["object"],
        schemaType: ["boolean", "object"],
        allowUndefined: true,
        trackErrors: true,
        error,
        code(cxt) {
          const { gen, schema, parentSchema, data, errsCount, it } = cxt;
          if (!errsCount)
            throw new Error("ajv implementation error");
          const { allErrors, opts } = it;
          it.props = true;
          if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
            return;
          const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
          const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
          checkAdditionalProperties();
          cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
          function checkAdditionalProperties() {
            gen.forIn("key", data, (key) => {
              if (!props.length && !patProps.length)
                additionalPropertyCode(key);
              else
                gen.if(isAdditional(key), () => additionalPropertyCode(key));
            });
          }
          function isAdditional(key) {
            let definedProp;
            if (props.length > 8) {
              const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
              definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
            } else if (props.length) {
              definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
            } else {
              definedProp = codegen_1.nil;
            }
            if (patProps.length) {
              definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
            }
            return (0, codegen_1.not)(definedProp);
          }
          function deleteAdditional(key) {
            gen.code((0, codegen_1._)`delete ${data}[${key}]`);
          }
          function additionalPropertyCode(key) {
            if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
              deleteAdditional(key);
              return;
            }
            if (schema === false) {
              cxt.setParams({ additionalProperty: key });
              cxt.error();
              if (!allErrors)
                gen.break();
              return;
            }
            if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
              const valid = gen.name("valid");
              if (opts.removeAdditional === "failing") {
                applyAdditionalSchema(key, valid, false);
                gen.if((0, codegen_1.not)(valid), () => {
                  cxt.reset();
                  deleteAdditional(key);
                });
              } else {
                applyAdditionalSchema(key, valid);
                if (!allErrors)
                  gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            }
          }
          function applyAdditionalSchema(key, valid, errors) {
            const subschema = {
              keyword: "additionalProperties",
              dataProp: key,
              dataPropType: util_1.Type.Str
            };
            if (errors === false) {
              Object.assign(subschema, {
                compositeRule: true,
                createErrors: false,
                allErrors: false
              });
            }
            cxt.subschema(subschema, valid);
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/properties.js
  var require_properties = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var validate_1 = require_validate();
      var code_1 = require_code2();
      var util_1 = require_util();
      var additionalProperties_1 = require_additionalProperties();
      var def = {
        keyword: "properties",
        type: "object",
        schemaType: "object",
        code(cxt) {
          const { gen, schema, parentSchema, data, it } = cxt;
          if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
            additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
          }
          const allProps = (0, code_1.allSchemaProperties)(schema);
          for (const prop of allProps) {
            it.definedProperties.add(prop);
          }
          if (it.opts.unevaluated && allProps.length && it.props !== true) {
            it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
          }
          const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
          if (properties.length === 0)
            return;
          const valid = gen.name("valid");
          for (const prop of properties) {
            if (hasDefault(prop)) {
              applyPropertySchema(prop);
            } else {
              gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
              applyPropertySchema(prop);
              if (!it.allErrors)
                gen.else().var(valid, true);
              gen.endIf();
            }
            cxt.it.definedProperties.add(prop);
            cxt.ok(valid);
          }
          function hasDefault(prop) {
            return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
          }
          function applyPropertySchema(prop) {
            cxt.subschema({
              keyword: "properties",
              schemaProp: prop,
              dataProp: prop
            }, valid);
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
  var require_patternProperties = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var code_1 = require_code2();
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var util_2 = require_util();
      var def = {
        keyword: "patternProperties",
        type: "object",
        schemaType: "object",
        code(cxt) {
          const { gen, schema, data, parentSchema, it } = cxt;
          const { opts } = it;
          const patterns = (0, code_1.allSchemaProperties)(schema);
          const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
          if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
            return;
          }
          const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
          const valid = gen.name("valid");
          if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
            it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
          }
          const { props } = it;
          validatePatternProperties();
          function validatePatternProperties() {
            for (const pat of patterns) {
              if (checkProperties)
                checkMatchingProperties(pat);
              if (it.allErrors) {
                validateProperties(pat);
              } else {
                gen.var(valid, true);
                validateProperties(pat);
                gen.if(valid);
              }
            }
          }
          function checkMatchingProperties(pat) {
            for (const prop in checkProperties) {
              if (new RegExp(pat).test(prop)) {
                (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
              }
            }
          }
          function validateProperties(pat) {
            gen.forIn("key", data, (key) => {
              gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
                const alwaysValid = alwaysValidPatterns.includes(pat);
                if (!alwaysValid) {
                  cxt.subschema({
                    keyword: "patternProperties",
                    schemaProp: pat,
                    dataProp: key,
                    dataPropType: util_2.Type.Str
                  }, valid);
                }
                if (it.opts.unevaluated && props !== true) {
                  gen.assign((0, codegen_1._)`${props}[${key}]`, true);
                } else if (!alwaysValid && !it.allErrors) {
                  gen.if((0, codegen_1.not)(valid), () => gen.break());
                }
              });
            });
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/not.js
  var require_not = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var util_1 = require_util();
      var def = {
        keyword: "not",
        schemaType: ["object", "boolean"],
        trackErrors: true,
        code(cxt) {
          const { gen, schema, it } = cxt;
          if ((0, util_1.alwaysValidSchema)(it, schema)) {
            cxt.fail();
            return;
          }
          const valid = gen.name("valid");
          cxt.subschema({
            keyword: "not",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, valid);
          cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
        },
        error: { message: "must NOT be valid" }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/anyOf.js
  var require_anyOf = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var code_1 = require_code2();
      var def = {
        keyword: "anyOf",
        schemaType: "array",
        trackErrors: true,
        code: code_1.validateUnion,
        error: { message: "must match a schema in anyOf" }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/oneOf.js
  var require_oneOf = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: "must match exactly one schema in oneOf",
        params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
      };
      var def = {
        keyword: "oneOf",
        schemaType: "array",
        trackErrors: true,
        error,
        code(cxt) {
          const { gen, schema, parentSchema, it } = cxt;
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          if (it.opts.discriminator && parentSchema.discriminator)
            return;
          const schArr = schema;
          const valid = gen.let("valid", false);
          const passing = gen.let("passing", null);
          const schValid = gen.name("_valid");
          cxt.setParams({ passing });
          gen.block(validateOneOf);
          cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
          function validateOneOf() {
            schArr.forEach((sch, i) => {
              let schCxt;
              if ((0, util_1.alwaysValidSchema)(it, sch)) {
                gen.var(schValid, true);
              } else {
                schCxt = cxt.subschema({
                  keyword: "oneOf",
                  schemaProp: i,
                  compositeRule: true
                }, schValid);
              }
              if (i > 0) {
                gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
              }
              gen.if(schValid, () => {
                gen.assign(valid, true);
                gen.assign(passing, i);
                if (schCxt)
                  cxt.mergeEvaluated(schCxt, codegen_1.Name);
              });
            });
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/allOf.js
  var require_allOf = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var util_1 = require_util();
      var def = {
        keyword: "allOf",
        schemaType: "array",
        code(cxt) {
          const { gen, schema, it } = cxt;
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const valid = gen.name("valid");
          schema.forEach((sch, i) => {
            if ((0, util_1.alwaysValidSchema)(it, sch))
              return;
            const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
            cxt.ok(valid);
            cxt.mergeEvaluated(schCxt);
          });
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/if.js
  var require_if = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var util_1 = require_util();
      var error = {
        message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
        params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
      };
      var def = {
        keyword: "if",
        schemaType: ["object", "boolean"],
        trackErrors: true,
        error,
        code(cxt) {
          const { gen, parentSchema, it } = cxt;
          if (parentSchema.then === void 0 && parentSchema.else === void 0) {
            (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
          }
          const hasThen = hasSchema(it, "then");
          const hasElse = hasSchema(it, "else");
          if (!hasThen && !hasElse)
            return;
          const valid = gen.let("valid", true);
          const schValid = gen.name("_valid");
          validateIf();
          cxt.reset();
          if (hasThen && hasElse) {
            const ifClause = gen.let("ifClause");
            cxt.setParams({ ifClause });
            gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
          } else if (hasThen) {
            gen.if(schValid, validateClause("then"));
          } else {
            gen.if((0, codegen_1.not)(schValid), validateClause("else"));
          }
          cxt.pass(valid, () => cxt.error(true));
          function validateIf() {
            const schCxt = cxt.subschema({
              keyword: "if",
              compositeRule: true,
              createErrors: false,
              allErrors: false
            }, schValid);
            cxt.mergeEvaluated(schCxt);
          }
          function validateClause(keyword, ifClause) {
            return () => {
              const schCxt = cxt.subschema({ keyword }, schValid);
              gen.assign(valid, schValid);
              cxt.mergeValidEvaluated(schCxt, valid);
              if (ifClause)
                gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
              else
                cxt.setParams({ ifClause: keyword });
            };
          }
        }
      };
      function hasSchema(it, keyword) {
        const schema = it.schema[keyword];
        return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
      }
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/thenElse.js
  var require_thenElse = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var util_1 = require_util();
      var def = {
        keyword: ["then", "else"],
        schemaType: ["object", "boolean"],
        code({ keyword, parentSchema, it }) {
          if (parentSchema.if === void 0)
            (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/applicator/index.js
  var require_applicator = __commonJS({
    "node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var additionalItems_1 = require_additionalItems();
      var prefixItems_1 = require_prefixItems();
      var items_1 = require_items();
      var items2020_1 = require_items2020();
      var contains_1 = require_contains();
      var dependencies_1 = require_dependencies();
      var propertyNames_1 = require_propertyNames();
      var additionalProperties_1 = require_additionalProperties();
      var properties_1 = require_properties();
      var patternProperties_1 = require_patternProperties();
      var not_1 = require_not();
      var anyOf_1 = require_anyOf();
      var oneOf_1 = require_oneOf();
      var allOf_1 = require_allOf();
      var if_1 = require_if();
      var thenElse_1 = require_thenElse();
      function getApplicator(draft2020 = false) {
        const applicator = [
          // any
          not_1.default,
          anyOf_1.default,
          oneOf_1.default,
          allOf_1.default,
          if_1.default,
          thenElse_1.default,
          // object
          propertyNames_1.default,
          additionalProperties_1.default,
          dependencies_1.default,
          properties_1.default,
          patternProperties_1.default
        ];
        if (draft2020)
          applicator.push(prefixItems_1.default, items2020_1.default);
        else
          applicator.push(additionalItems_1.default, items_1.default);
        applicator.push(contains_1.default);
        return applicator;
      }
      exports.default = getApplicator;
    }
  });

  // node_modules/ajv/dist/vocabularies/format/format.js
  var require_format = __commonJS({
    "node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var error = {
        message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
        params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
      };
      var def = {
        keyword: "format",
        type: ["number", "string"],
        schemaType: "string",
        $data: true,
        error,
        code(cxt, ruleType) {
          const { gen, data, $data, schema, schemaCode, it } = cxt;
          const { opts, errSchemaPath, schemaEnv, self } = it;
          if (!opts.validateFormats)
            return;
          if ($data)
            validate$DataFormat();
          else
            validateFormat();
          function validate$DataFormat() {
            const fmts = gen.scopeValue("formats", {
              ref: self.formats,
              code: opts.code.formats
            });
            const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
            const fType = gen.let("fType");
            const format = gen.let("format");
            gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
            cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
            function unknownFmt() {
              if (opts.strictSchema === false)
                return codegen_1.nil;
              return (0, codegen_1._)`${schemaCode} && !${format}`;
            }
            function invalidFmt() {
              const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
              const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
              return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
            }
          }
          function validateFormat() {
            const formatDef = self.formats[schema];
            if (!formatDef) {
              unknownFormat();
              return;
            }
            if (formatDef === true)
              return;
            const [fmtType, format, fmtRef] = getFormat(formatDef);
            if (fmtType === ruleType)
              cxt.pass(validCondition());
            function unknownFormat() {
              if (opts.strictSchema === false) {
                self.logger.warn(unknownMsg());
                return;
              }
              throw new Error(unknownMsg());
              function unknownMsg() {
                return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
              }
            }
            function getFormat(fmtDef) {
              const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
              const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
              if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
                return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
              }
              return ["string", fmtDef, fmt];
            }
            function validCondition() {
              if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
                if (!schemaEnv.$async)
                  throw new Error("async format in sync schema");
                return (0, codegen_1._)`await ${fmtRef}(${data})`;
              }
              return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
            }
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/vocabularies/format/index.js
  var require_format2 = __commonJS({
    "node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var format_1 = require_format();
      var format = [format_1.default];
      exports.default = format;
    }
  });

  // node_modules/ajv/dist/vocabularies/metadata.js
  var require_metadata = __commonJS({
    "node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.contentVocabulary = exports.metadataVocabulary = void 0;
      exports.metadataVocabulary = [
        "title",
        "description",
        "default",
        "deprecated",
        "readOnly",
        "writeOnly",
        "examples"
      ];
      exports.contentVocabulary = [
        "contentMediaType",
        "contentEncoding",
        "contentSchema"
      ];
    }
  });

  // node_modules/ajv/dist/vocabularies/draft7.js
  var require_draft7 = __commonJS({
    "node_modules/ajv/dist/vocabularies/draft7.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var core_1 = require_core2();
      var validation_1 = require_validation();
      var applicator_1 = require_applicator();
      var format_1 = require_format2();
      var metadata_1 = require_metadata();
      var draft7Vocabularies = [
        core_1.default,
        validation_1.default,
        (0, applicator_1.default)(),
        format_1.default,
        metadata_1.metadataVocabulary,
        metadata_1.contentVocabulary
      ];
      exports.default = draft7Vocabularies;
    }
  });

  // node_modules/ajv/dist/vocabularies/discriminator/types.js
  var require_types = __commonJS({
    "node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DiscrError = void 0;
      var DiscrError;
      (function(DiscrError2) {
        DiscrError2["Tag"] = "tag";
        DiscrError2["Mapping"] = "mapping";
      })(DiscrError || (exports.DiscrError = DiscrError = {}));
    }
  });

  // node_modules/ajv/dist/vocabularies/discriminator/index.js
  var require_discriminator = __commonJS({
    "node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var codegen_1 = require_codegen();
      var types_1 = require_types();
      var compile_1 = require_compile();
      var ref_error_1 = require_ref_error();
      var util_1 = require_util();
      var error = {
        message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
        params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
      };
      var def = {
        keyword: "discriminator",
        type: "object",
        schemaType: "object",
        error,
        code(cxt) {
          const { gen, data, schema, parentSchema, it } = cxt;
          const { oneOf } = parentSchema;
          if (!it.opts.discriminator) {
            throw new Error("discriminator: requires discriminator option");
          }
          const tagName = schema.propertyName;
          if (typeof tagName != "string")
            throw new Error("discriminator: requires propertyName");
          if (schema.mapping)
            throw new Error("discriminator: mapping is not supported");
          if (!oneOf)
            throw new Error("discriminator: requires oneOf keyword");
          const valid = gen.let("valid", false);
          const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
          gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
          cxt.ok(valid);
          function validateMapping() {
            const mapping = getMapping();
            gen.if(false);
            for (const tagValue in mapping) {
              gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
              gen.assign(valid, applyTagSchema(mapping[tagValue]));
            }
            gen.else();
            cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
            gen.endIf();
          }
          function applyTagSchema(schemaProp) {
            const _valid = gen.name("valid");
            const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
            cxt.mergeEvaluated(schCxt, codegen_1.Name);
            return _valid;
          }
          function getMapping() {
            var _a;
            const oneOfMapping = {};
            const topRequired = hasRequired(parentSchema);
            let tagRequired = true;
            for (let i = 0; i < oneOf.length; i++) {
              let sch = oneOf[i];
              if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
                const ref = sch.$ref;
                sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
                if (sch instanceof compile_1.SchemaEnv)
                  sch = sch.schema;
                if (sch === void 0)
                  throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
              }
              const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
              if (typeof propSch != "object") {
                throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
              }
              tagRequired = tagRequired && (topRequired || hasRequired(sch));
              addMappings(propSch, i);
            }
            if (!tagRequired)
              throw new Error(`discriminator: "${tagName}" must be required`);
            return oneOfMapping;
            function hasRequired({ required }) {
              return Array.isArray(required) && required.includes(tagName);
            }
            function addMappings(sch, i) {
              if (sch.const) {
                addMapping(sch.const, i);
              } else if (sch.enum) {
                for (const tagValue of sch.enum) {
                  addMapping(tagValue, i);
                }
              } else {
                throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
              }
            }
            function addMapping(tagValue, i) {
              if (typeof tagValue != "string" || tagValue in oneOfMapping) {
                throw new Error(`discriminator: "${tagName}" values must be unique strings`);
              }
              oneOfMapping[tagValue] = i;
            }
          }
        }
      };
      exports.default = def;
    }
  });

  // node_modules/ajv/dist/refs/json-schema-draft-07.json
  var require_json_schema_draft_07 = __commonJS({
    "node_modules/ajv/dist/refs/json-schema-draft-07.json"(exports, module) {
      module.exports = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://json-schema.org/draft-07/schema#",
        title: "Core schema meta-schema",
        definitions: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: { $ref: "#" }
          },
          nonNegativeInteger: {
            type: "integer",
            minimum: 0
          },
          nonNegativeIntegerDefault0: {
            allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
          },
          simpleTypes: {
            enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
          },
          stringArray: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            default: []
          }
        },
        type: ["object", "boolean"],
        properties: {
          $id: {
            type: "string",
            format: "uri-reference"
          },
          $schema: {
            type: "string",
            format: "uri"
          },
          $ref: {
            type: "string",
            format: "uri-reference"
          },
          $comment: {
            type: "string"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: true,
          readOnly: {
            type: "boolean",
            default: false
          },
          examples: {
            type: "array",
            items: true
          },
          multipleOf: {
            type: "number",
            exclusiveMinimum: 0
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "number"
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "number"
          },
          maxLength: { $ref: "#/definitions/nonNegativeInteger" },
          minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
          pattern: {
            type: "string",
            format: "regex"
          },
          additionalItems: { $ref: "#" },
          items: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
            default: true
          },
          maxItems: { $ref: "#/definitions/nonNegativeInteger" },
          minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          contains: { $ref: "#" },
          maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
          minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
          required: { $ref: "#/definitions/stringArray" },
          additionalProperties: { $ref: "#" },
          definitions: {
            type: "object",
            additionalProperties: { $ref: "#" },
            default: {}
          },
          properties: {
            type: "object",
            additionalProperties: { $ref: "#" },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: { $ref: "#" },
            propertyNames: { format: "regex" },
            default: {}
          },
          dependencies: {
            type: "object",
            additionalProperties: {
              anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
            }
          },
          propertyNames: { $ref: "#" },
          const: true,
          enum: {
            type: "array",
            items: true,
            minItems: 1,
            uniqueItems: true
          },
          type: {
            anyOf: [
              { $ref: "#/definitions/simpleTypes" },
              {
                type: "array",
                items: { $ref: "#/definitions/simpleTypes" },
                minItems: 1,
                uniqueItems: true
              }
            ]
          },
          format: { type: "string" },
          contentMediaType: { type: "string" },
          contentEncoding: { type: "string" },
          if: { $ref: "#" },
          then: { $ref: "#" },
          else: { $ref: "#" },
          allOf: { $ref: "#/definitions/schemaArray" },
          anyOf: { $ref: "#/definitions/schemaArray" },
          oneOf: { $ref: "#/definitions/schemaArray" },
          not: { $ref: "#" }
        },
        default: true
      };
    }
  });

  // node_modules/ajv/dist/ajv.js
  var require_ajv = __commonJS({
    "node_modules/ajv/dist/ajv.js"(exports, module) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
      var core_1 = require_core();
      var draft7_1 = require_draft7();
      var discriminator_1 = require_discriminator();
      var draft7MetaSchema = require_json_schema_draft_07();
      var META_SUPPORT_DATA = ["/properties"];
      var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
      var Ajv2 = class extends core_1.default {
        _addVocabularies() {
          super._addVocabularies();
          draft7_1.default.forEach((v) => this.addVocabulary(v));
          if (this.opts.discriminator)
            this.addKeyword(discriminator_1.default);
        }
        _addDefaultMetaSchema() {
          super._addDefaultMetaSchema();
          if (!this.opts.meta)
            return;
          const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
          this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
          this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
        }
        defaultMeta() {
          return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
        }
      };
      exports.Ajv = Ajv2;
      module.exports = exports = Ajv2;
      module.exports.Ajv = Ajv2;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = Ajv2;
      var validate_1 = require_validate();
      Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
        return validate_1.KeywordCxt;
      } });
      var codegen_1 = require_codegen();
      Object.defineProperty(exports, "_", { enumerable: true, get: function() {
        return codegen_1._;
      } });
      Object.defineProperty(exports, "str", { enumerable: true, get: function() {
        return codegen_1.str;
      } });
      Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
        return codegen_1.stringify;
      } });
      Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
        return codegen_1.nil;
      } });
      Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
        return codegen_1.Name;
      } });
      Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
        return codegen_1.CodeGen;
      } });
      var validation_error_1 = require_validation_error();
      Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
        return validation_error_1.default;
      } });
      var ref_error_1 = require_ref_error();
      Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
        return ref_error_1.default;
      } });
    }
  });

  // src/dom.js
  var byId = (id) => document.getElementById(id);
  var els = {
    track: byId("track"),
    ghost: byId("ghost"),
    tipStart: byId("tipStart"),
    tipEnd: byId("tipEnd"),
    tipCenter: byId("tipCenter"),
    ticks: byId("ticks"),
    rows: byId("rows"),
    empty: byId("empty"),
    // Collapsible sections
    entriesCard: byId("entriesCard"),
    entriesToggle: byId("entriesToggle"),
    entriesBody: byId("entriesBody"),
    modal: byId("modal"),
    startField: byId("startField"),
    endField: byId("endField"),
    bucketField: byId("bucketField"),
    // Prefer new dual-editor note field when present
    noteField: document.getElementById("noteField2") || byId("noteField"),
    notePreview: document.getElementById("notePreview2") || byId("notePreview"),
    notePreviewToggle: document.getElementById("notePreviewToggle2") || byId("notePreviewToggle"),
    // Bucket persistent note (edit modal)
    bucketNoteField: byId("bucketNoteField"),
    bucketNotePreview: byId("bucketNotePreview"),
    bucketNotePreviewToggle: byId("bucketNotePreviewToggle"),
    modalForm: byId("modalForm"),
    modalCancel: byId("modalCancel"),
    modalClose: byId("modalClose"),
    modalTitle: document.querySelector(".modal-title"),
    modalFooter: document.querySelector(".modal-footer"),
    modalDelete: byId("modalDelete"),
    modalStatusWrap: byId("modalStatusWrap"),
    modalStatusBtn: byId("modalStatusBtn"),
    modalStatusMenu: byId("modalStatusMenu"),
    // Schedule in edit modal
    scheduleField: byId("scheduleField"),
    scheduleList: byId("scheduleList"),
    scheduleCombo: byId("scheduleCombo"),
    scheduleToggle: byId("scheduleToggle"),
    scheduleMenu: byId("scheduleMenu"),
    // Note modal
    noteModal: byId("noteModal"),
    noteModalTitle: document.getElementById("noteModalTitle"),
    noteModalClose: byId("noteModalClose"),
    // Punch note viewer/editor (note modal)
    noteViewer: byId("noteViewer"),
    noteEditorWrap: byId("noteEditorWrap"),
    noteEditor: byId("noteEditor"),
    // Bucket note viewer/editor (note modal)
    bucketNoteViewer: byId("bucketNoteViewer"),
    bucketNoteEditorWrap: byId("bucketNoteEditorWrap"),
    bucketNoteEditor: byId("bucketNoteEditor"),
    noteEditToggle: byId("noteEditToggle"),
    noteSave: byId("noteSave"),
    noteCancel: byId("noteCancel"),
    // Recurrence controls
    repeatEnabled: byId("repeatEnabled"),
    repeatFields: byId("repeatFields"),
    repeatFreq: byId("repeatFreq"),
    repeatUntil: byId("repeatUntil"),
    repeatUntilWrap: byId("repeatUntilWrap"),
    repeatDowWrap: byId("repeatDowWrap"),
    repeatDow: byId("repeatDow"),
    btnDowWeekdays: byId("btnDowWeekdays"),
    btnDowAll: byId("btnDowAll"),
    applyScopeWrap: byId("applyScopeWrap"),
    applyScopeOne: byId("applyScopeOne"),
    applyScopeSeries: byId("applyScopeSeries"),
    extendWrap: byId("extendWrap"),
    extendUntil: byId("extendUntil"),
    btnExtendSeries: byId("btnExtendSeries"),
    total: byId("total"),
    toast: byId("toast"),
    viewHelp: byId("viewHelp"),
    btnBucketBackTop: byId("btnBucketBackTop"),
    view24: byId("view24"),
    viewDefault: byId("viewDefault"),
    btnCopyChart: byId("btnCopyChart"),
    // Calendar / header controls
    btnCalendar: byId("btnCalendar"),
    btnCalendar2: byId("btnCalendar2"),
    btnCalendarFab: byId("btnCalendarFab"),
    btnCopyChartTop: byId("btnCopyChartTop"),
    btnCopyChartTable: byId("btnCopyChartTable"),
    dayLabel: byId("dayLabel"),
    calendarCard: byId("calendarCard"),
    // (Customizable dashboards removed)
    calendarGrid: byId("calendarGrid"),
    calWeekdays: byId("calWeekdays"),
    calMonthLabel: byId("calMonthLabel"),
    calPrev: byId("calPrev"),
    calNext: byId("calNext"),
    // Mobile controls
    mobileControls: byId("mobileControls"),
    mobileScrollbar: byId("mobileScrollbar"),
    mobileWindow: byId("mobileWindow"),
    mobileZoomIn: byId("mobileZoomIn"),
    mobileZoomOut: byId("mobileZoomOut"),
    mobileZoomRange: byId("mobileZoomRange"),
    // Bucket reports
    bucketDayCard: byId("bucketDayCard"),
    bucketDayToggle: byId("bucketDayToggle"),
    bucketDayBody: byId("bucketDayBody"),
    bucketDayEmpty: byId("bucketDayEmpty"),
    bucketMonthCard: byId("bucketMonthCard"),
    bucketMonthBody: byId("bucketMonthBody"),
    bucketMonthEmpty: byId("bucketMonthEmpty"),
    bucketMonthTitle: byId("bucketMonthTitle"),
    // Bucket view
    bucketViewCard: byId("bucketViewCard"),
    bucketViewTitle: byId("bucketViewTitle"),
    bucketViewTotal: byId("bucketViewTotal"),
    bucketViewBody: byId("bucketViewBody"),
    bucketViewEmpty: byId("bucketViewEmpty"),
    btnBucketBack: byId("btnBucketBack"),
    btnBucketDelete: byId("btnBucketDelete"),
    // Settings
    btnSettings: byId("btnSettings"),
    settingsModal: byId("settingsModal"),
    settingsClose: byId("settingsClose"),
    settingsCancel: byId("settingsCancel"),
    btnExport: byId("btnExport"),
    btnImport: byId("btnImport"),
    importFile: byId("importFile"),
    btnEraseAll: byId("btnEraseAll"),
    themeSelect: byId("themeSelect"),
    lblBackup: byId("lblBackup"),
    lblRestore: byId("lblRestore"),
    // Settings: schedules (dashboard customization and move-between-schedules removed)
    settingsSchedList: byId("settingsSchedList"),
    settingsRenameSched: byId("settingsRenameSched"),
    settingsDeleteSched: byId("settingsDeleteSched"),
    settingsSchedNameWrap: byId("settingsSchedNameWrap"),
    settingsSchedName: byId("settingsSchedName"),
    settingsSchedMsg: byId("settingsSchedMsg"),
    settingsDeleteConfirm: byId("settingsDeleteConfirm"),
    settingsDeleteConfirmText: byId("settingsDeleteConfirmText"),
    settingsDeleteYes: byId("settingsDeleteYes"),
    settingsDeleteNo: byId("settingsDeleteNo"),
    // Settings: schedule views
    settingsViewList: byId("settingsViewList"),
    settingsViewNameWrap: byId("settingsViewNameWrap"),
    settingsViewName: byId("settingsViewName"),
    settingsViewSchedChecks: byId("settingsViewSchedChecks"),
    settingsAddView: byId("settingsAddView"),
    settingsRenameView: byId("settingsRenameView"),
    settingsDeleteView: byId("settingsDeleteView"),
    settingsSaveView: byId("settingsSaveView"),
    settingsViewMsg: byId("settingsViewMsg"),
    // Schedules
    scheduleSelect: byId("scheduleSelect"),
    btnAddSchedule: byId("btnAddSchedule"),
    btnRenameSchedule: byId("btnRenameSchedule"),
    btnDeleteSchedule: byId("btnDeleteSchedule")
    // (Module modal removed)
  };

  // src/state.js
  var state = {
    punches: [],
    schedules: [],
    scheduleViews: [],
    currentScheduleId: null,
    // active schedule for main views
    currentScheduleViewId: null,
    // active saved view (overrides currentScheduleId when set)
    // (Customizable dashboards removed)
    dragging: null,
    resizing: null,
    moving: null,
    pendingRange: null,
    editingId: null,
    // Timeline viewport (minutes from start of day)
    viewStartMin: 6 * 60,
    // default 6:00am
    viewEndMin: 18 * 60,
    // default 6:00pm
    // Hover flag used to route wheel events when over the track
    overTrack: false,
    // Date/calendar state
    currentDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    // YYYY-MM-DD selected day
    viewMode: "calendar",
    // 'day' | 'calendar' | 'bucket'
    calendarYear: (/* @__PURE__ */ new Date()).getFullYear(),
    calendarMonth: (/* @__PURE__ */ new Date()).getMonth(),
    // 0-11
    // Calendar sub-view: 'days' | 'months' | 'years'
    calendarMode: "days",
    // Start year for the visible year grid (in 'years' mode). Initialized to a 12-year block containing today.
    yearGridStart: Math.floor((/* @__PURE__ */ new Date()).getFullYear() / 12) * 12,
    // Bucket view state
    bucketFilter: "",
    // exact bucket label being viewed ('' = no bucket)
    lastViewMode: "day"
    // where to return when leaving bucket view
  };

  // src/config.js
  var DAY_MIN = 24 * 60;
  var SNAP_MIN = 15;
  var VIEW_START_MIN = 6 * 60;
  var VIEW_END_MIN = 18 * 60;
  var VIEW_MINUTES = VIEW_END_MIN - VIEW_START_MIN;
  var VIEW_START_H = VIEW_START_MIN / 60;
  var VIEW_END_H = VIEW_END_MIN / 60;

  // src/time.js
  var clamp = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min)));
  var snap = (min) => Math.max(0, Math.min(DAY_MIN, Math.round(min / SNAP_MIN) * SNAP_MIN));
  var toLabel = (mins) => {
    const m = clamp(mins);
    const h24 = Math.floor(m / 60) % 24;
    const mm = (m % 60).toString().padStart(2, "0");
    const ampm = h24 >= 12 ? "pm" : "am";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${mm}${ampm}`;
  };
  var durationLabel = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}h${m}m`;
  };
  var hourLabel = (h) => {
    const ampm = h >= 12 ? "pm" : "am";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${ampm}`;
  };
  var parse = (input) => {
    if (input == null) return null;
    let s = String(input).trim().toLowerCase();
    if (!s) return null;
    s = s.replace(/\u2013|\u2014|–|—/g, "-");
    let ampm = null;
    const mAm = s.match(/\b(a\.?m?\.?|am)\b/);
    const mPm = s.match(/\b(p\.?m?\.?|pm)\b/);
    if (mAm && mPm) return null;
    if (mAm) ampm = "am";
    if (mPm) ampm = "pm";
    s = s.replace(/\b(a\.?m?\.?|am|p\.?m?\.?|pm)\b/g, "").trim();
    let h = 0, m = 0;
    const colon = s.match(/^\s*(\d{1,2})\s*[:\.]\s*(\d{1,2})\s*$/);
    if (colon) {
      h = Number(colon[1]);
      m = Number(colon[2]);
    } else {
      const compact = s.match(/^\s*(\d{1,4})\s*$/);
      if (!compact) return null;
      const raw = compact[1];
      if (raw.length <= 2) {
        h = Number(raw);
        m = 0;
      } else if (raw.length === 3) {
        h = Number(raw.slice(0, 1));
        m = Number(raw.slice(1));
      } else {
        h = Number(raw.slice(0, 2));
        m = Number(raw.slice(2));
      }
    }
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (m < 0 || m > 59) return null;
    if (ampm === "am") {
      if (h === 12) h = 0;
    } else if (ampm === "pm") {
      if (h !== 12) h += 12;
    }
    if (ampm == null) {
      if (h < 0) return null;
      if (h > 24) return null;
    }
    let mins = h * 60 + m;
    if (mins < 0) mins = 0;
    if (mins > DAY_MIN) mins = DAY_MIN;
    return Math.round(mins);
  };
  var time = { clamp, snap, toLabel, durationLabel, hourLabel, parse };

  // src/dates.js
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function todayStr() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function toDateStr(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function parseDate(str) {
    const [y, m, day] = (str || "").split("-").map((x) => Number(x));
    if (!y || !m || !day) return null;
    return new Date(y, m - 1, day);
  }
  function getPunchDate(p) {
    if (p.date) return p.date;
    if (p.createdAt) return (p.createdAt + "").slice(0, 10);
    return todayStr();
  }

  // src/nowIndicator.js
  function getView() {
    const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes };
  }
  function nowMinutes() {
    const d = /* @__PURE__ */ new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }
  function ensureElIn(container) {
    if (!container) return null;
    let el = container.querySelector(":scope > .now-indicator");
    if (!el) {
      el = document.createElement("div");
      el.className = "now-indicator";
      el.setAttribute("aria-hidden", "true");
      container.appendChild(el);
    }
    return el;
  }
  function update() {
    var _a, _b, _c;
    const view = getView();
    const mins = nowMinutes();
    const isInView = !(mins < view.start || mins > view.end);
    const isToday = (state.currentDate || todayStr()) === todayStr();
    const pct = (mins - view.start) / view.minutes * 100;
    const trackEl = ensureElIn(els.track);
    if (trackEl) {
      if (isInView) {
        trackEl.style.left = pct + "%";
        trackEl.style.display = "block";
        if (isToday) trackEl.classList.remove("not-today");
        else trackEl.classList.add("not-today");
      } else {
        trackEl.style.display = "none";
      }
    }
    try {
      document.querySelectorAll(".punch.is-active").forEach((n) => n.classList.remove("is-active"));
      (_a = els.rows) == null ? void 0 : _a.querySelectorAll("tr.is-active").forEach((n) => n.classList.remove("is-active"));
    } catch (e) {
    }
    if (isToday) {
      try {
        const day = todayStr();
        const active = state.punches.find((p) => getPunchDate(p) === day && p.start <= mins && mins < p.end);
        if (active) {
          const punchEl = (_b = els.track) == null ? void 0 : _b.querySelector(`.punch[data-id="${active.id}"]`);
          if (punchEl) punchEl.classList.add("is-active");
          const rowEl = (_c = els.rows) == null ? void 0 : _c.querySelector(`tr[data-id="${active.id}"]`);
          if (rowEl) rowEl.classList.add("is-active");
        }
      } catch (e) {
      }
    }
  }
  var _timer = null;
  function init() {
    ensureElIn(els.track);
    update();
    if (_timer) clearInterval(_timer);
    _timer = setInterval(update, 3e4);
    try {
      window.addEventListener("resize", update, { passive: true });
    } catch (e) {
    }
  }
  var nowIndicator = { init, update };

  // src/calendar.js
  function summarizeByDate() {
    const map = /* @__PURE__ */ new Map();
    const sched = state.currentScheduleId != null ? Number(state.currentScheduleId) : null;
    for (const p of state.punches) {
      if (sched != null && Number(p.scheduleId) !== sched) continue;
      const d = getPunchDate(p);
      const prev = map.get(d) || { count: 0, totalMin: 0 };
      map.set(d, {
        count: prev.count + 1,
        totalMin: prev.totalMin + Math.max(0, (p.end || 0) - (p.start || 0))
      });
    }
    return map;
  }
  function buildMonthGrid(year, monthIndex) {
    const first = new Date(year, monthIndex, 1);
    const start = new Date(first);
    const firstDow = first.getDay();
    start.setDate(first.getDate() - firstDow);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }
  function renderCalendar() {
    if (!els.calendarGrid || !els.calMonthLabel) return;
    try {
      els.calendarGrid.style.opacity = "0";
    } catch (e) {
    }
    const y = state.calendarYear;
    const m = state.calendarMonth;
    const mode = state.calendarMode || "days";
    if (mode !== "days") {
      if (els.calWeekdays) els.calWeekdays.style.display = "none";
      els.calendarGrid.innerHTML = "";
      if (mode === "months") {
        els.calMonthLabel.innerHTML = `
        <span class="cal-nav" data-cal-nav="prev" title="Previous year">\u2039</span>
        <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
        <span class="cal-nav" data-cal-nav="next" title="Next year">\u203A</span>`;
        els.calendarGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
        const today3 = /* @__PURE__ */ new Date();
        const currentMonth = today3.getMonth();
        const currentYear2 = today3.getFullYear();
        for (let i = 0; i < 12; i++) {
          const cell = document.createElement("div");
          cell.className = "cal-day";
          const label = new Date(y, i, 1).toLocaleString(void 0, { month: "short" });
          const num = document.createElement("div");
          num.className = "cal-num";
          num.textContent = label;
          cell.appendChild(num);
          if (y === currentYear2 && i === currentMonth) cell.classList.add("today");
          if (i === state.calendarMonth && y === state.calendarYear) cell.classList.add("selected");
          cell.addEventListener("click", () => {
            state.calendarYear = y;
            state.calendarMonth = i;
            state.calendarMode = "days";
            try {
              window.dispatchEvent(new Event("calendar:modeChanged"));
            } catch (e) {
            }
            renderCalendar();
          });
          els.calendarGrid.appendChild(cell);
        }
        requestAnimationFrame(() => {
          try {
            els.calendarGrid.style.opacity = "1";
          } catch (e) {
          }
        });
        try {
          window.dispatchEvent(new Event("calendar:rendered"));
        } catch (e) {
          window.dispatchEvent(new Event("calendar:rendered"));
        }
        return;
      }
      const start = state.yearGridStart || Math.floor(state.calendarYear / 12) * 12;
      state.yearGridStart = start;
      const end = start + 11;
      els.calMonthLabel.innerHTML = `
      <span class="cal-nav" data-cal-nav="prev" title="Previous 12 years">\u2039</span>
      <span class="cal-range">${start}\u2013${end}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next 12 years">\u203A</span>`;
      els.calendarGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
      const today2 = /* @__PURE__ */ new Date();
      const currentYear = today2.getFullYear();
      for (let i = 0; i < 12; i++) {
        const yy = start + i;
        const cell = document.createElement("div");
        cell.className = "cal-day";
        const num = document.createElement("div");
        num.className = "cal-num";
        num.textContent = String(yy);
        cell.appendChild(num);
        if (yy === currentYear) cell.classList.add("today");
        if (yy === state.calendarYear) cell.classList.add("selected");
        cell.addEventListener("click", () => {
          state.calendarYear = yy;
          state.calendarMode = "months";
          try {
            window.dispatchEvent(new Event("calendar:modeChanged"));
          } catch (e) {
          }
          renderCalendar();
        });
        els.calendarGrid.appendChild(cell);
      }
      requestAnimationFrame(() => {
        try {
          els.calendarGrid.style.opacity = "1";
        } catch (e) {
        }
      });
      try {
        window.dispatchEvent(new Event("calendar:rendered"));
      } catch (e) {
        window.dispatchEvent(new Event("calendar:rendered"));
      }
      return;
    }
    if (els.calWeekdays) els.calWeekdays.style.display = "grid";
    els.calMonthLabel.innerHTML = (() => {
      const d = new Date(y, m, 1);
      const monthName = d.toLocaleString(void 0, { month: "long" });
      return `
      <span class="cal-nav" data-cal-nav="prev" title="Previous month">\u2039</span>
      <span class="cal-link" data-cal-click="month" title="Select month">${monthName}</span>
      <span class="cal-link" data-cal-click="year" title="Select year">${y}</span>
      <span class="cal-nav" data-cal-nav="next" title="Next month">\u203A</span>`;
    })();
    els.calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
    requestAnimationFrame(() => {
      try {
        els.calendarGrid.style.opacity = "1";
      } catch (e) {
      }
    });
    const days = buildMonthGrid(y, m);
    const summaries = summarizeByDate();
    const selected = state.currentDate || todayStr();
    const today = todayStr();
    els.calendarGrid.innerHTML = "";
    for (const d of days) {
      const ds = toDateStr(d);
      const cell = document.createElement("div");
      cell.className = "cal-day";
      cell.tabIndex = 0;
      const inMonth = d.getMonth() === m;
      if (!inMonth) cell.classList.add("other-month");
      if (ds === selected) cell.classList.add("selected");
      if (ds === today && d.getMonth() === m && d.getFullYear() === y) cell.classList.add("today");
      const sum = summaries.get(ds);
      if (sum && sum.count) cell.classList.add("has-items");
      const num = document.createElement("div");
      num.className = "cal-num";
      num.textContent = String(d.getDate());
      cell.appendChild(num);
      try {
        const sched = state.currentScheduleId != null ? Number(state.currentScheduleId) : null;
        const dayItems = state.punches.filter((p) => getPunchDate(p) === ds && (sched == null || Number(p.scheduleId) === sched)).sort((a, b) => (a.start || 0) - (b.start || 0));
        const seen = /* @__PURE__ */ new Set();
        const buckets = [];
        for (const p of dayItems) {
          const label = String(p.bucket || "(no bucket)").trim();
          if (!seen.has(label)) {
            seen.add(label);
            buckets.push(label);
          }
        }
        if (buckets.length) {
          const wrap = document.createElement("div");
          wrap.className = "cal-buckets";
          for (const b of buckets) {
            const row = document.createElement("div");
            row.className = "cal-bucket";
            row.textContent = b;
            wrap.appendChild(row);
          }
          cell.appendChild(wrap);
        }
      } catch (e) {
      }
      cell.addEventListener("click", () => {
        state.currentDate = ds;
        state.viewMode = "day";
        try {
          const ev = new CustomEvent("calendar:daySelected");
          window.dispatchEvent(ev);
        } catch (e) {
          window.dispatchEvent(new Event("calendar:daySelected"));
        }
      });
      els.calendarGrid.appendChild(cell);
    }
    try {
      window.dispatchEvent(new Event("calendar:rendered"));
    } catch (e) {
      window.dispatchEvent(new Event("calendar:rendered"));
    }
  }
  function nextMonth() {
    let y = state.calendarYear;
    let m = state.calendarMonth + 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    state.calendarYear = y;
    state.calendarMonth = m;
    renderCalendar();
  }
  function prevMonth() {
    let y = state.calendarYear;
    let m = state.calendarMonth - 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    state.calendarYear = y;
    state.calendarMonth = m;
    renderCalendar();
  }
  function nextYear() {
    state.calendarYear = state.calendarYear + 1;
    renderCalendar();
  }
  function prevYear() {
    state.calendarYear = state.calendarYear - 1;
    renderCalendar();
  }
  var calendar = { renderCalendar, nextMonth, prevMonth, nextYear, prevYear };

  // src/storage.js
  var DB_NAME = "timeTrackerDB";
  var DB_VERSION = 4;
  var openDb = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("punches")) {
        db.createObjectStore("punches", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("buckets")) {
        db.createObjectStore("buckets", { keyPath: "name" });
      }
      if (!db.objectStoreNames.contains("schedules")) {
        db.createObjectStore("schedules", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("scheduleViews")) {
        db.createObjectStore("scheduleViews", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  var withStore = (storeName, mode, fn) => openDb().then(
    (db) => new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const ret = fn(store);
        tx.oncomplete = () => resolve(ret);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    })
  );
  var add = (punch) => withStore("punches", "readwrite", (store) => store.add(punch));
  var put = (punch) => withStore("punches", "readwrite", (store) => store.put(punch));
  var remove = (id) => withStore("punches", "readwrite", (store) => store.delete(id));
  var clear = () => withStore("punches", "readwrite", (store) => store.clear());
  var all = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      const tx = db.transaction("punches", "readonly");
      const store = tx.objectStore("punches");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    })
  );
  var getBucket = (name) => openDb().then(
    (db) => new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("buckets", "readonly");
        const store = tx.objectStore("buckets");
        const req = store.get(String(name != null ? name : ""));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve(null);
      }
    })
  );
  var setBucketNote = (name, note) => withStore("buckets", "readwrite", (store) => {
    const key = String(name != null ? name : "");
    const rec = { name: key, note: String(note != null ? note : "") };
    if (!rec.note.trim()) {
      try {
        store.delete(key);
      } catch (e) {
      }
    } else {
      store.put(rec);
    }
  });
  var deleteBucket = (name) => withStore("buckets", "readwrite", (store) => store.delete(String(name != null ? name : "")));
  var allBuckets = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("buckets", "readonly");
        const store = tx.objectStore("buckets");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve([]);
      }
    })
  );
  var clearBuckets = () => withStore("buckets", "readwrite", (store) => store.clear());
  var idb = { add, put, remove, clear, all, getBucket, setBucketNote, deleteBucket, allBuckets, clearBuckets };
  var addSchedule = (rec) => withStore("schedules", "readwrite", (store) => store.add(rec));
  var putSchedule = (rec) => withStore("schedules", "readwrite", (store) => store.put(rec));
  var removeSchedule = (id) => withStore("schedules", "readwrite", (store) => store.delete(id));
  var allSchedules = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("schedules", "readonly");
        const store = tx.objectStore("schedules");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve([]);
      }
    })
  );
  var schedulesDb = { addSchedule, putSchedule, removeSchedule, allSchedules };
  var addScheduleView = (rec) => withStore("scheduleViews", "readwrite", (store) => store.add(rec));
  var putScheduleView = (rec) => withStore("scheduleViews", "readwrite", (store) => store.put(rec));
  var removeScheduleView = (id) => withStore("scheduleViews", "readwrite", (store) => store.delete(id));
  var allScheduleViews = () => openDb().then(
    (db) => new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("scheduleViews", "readonly");
        const store = tx.objectStore("scheduleViews");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve([]);
      }
    })
  );
  var scheduleViewsDb = { addScheduleView, putScheduleView, removeScheduleView, allScheduleViews };
  function destroy() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
        req.onblocked = () => {
          resolve(false);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // src/ui.js
  var escapeHtml = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  function markdownToHtml(md) {
    const text = String(md || "");
    if (!text.trim()) return "";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        const raw = window.marked.parse(text);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") return window.DOMPurify.sanitize(raw);
        return raw;
      }
    } catch (e) {
    }
    return escapeHtml(text).replace(/\n/g, "<br>");
  }
  function hideNotePopover() {
    const existing = document.querySelector(".note-popover");
    if (existing) existing.remove();
  }
  function toggleNotePopover(id, anchorEl = null) {
    const anchor = anchorEl || els.track.querySelector(`.punch[data-id="${id}"]`);
    if (!anchor) return;
    const existing = document.querySelector(".note-popover");
    if (existing && Number(existing.dataset.id) === Number(id)) {
      existing.remove();
      return;
    }
    if (existing) existing.remove();
    const p = state.punches.find((x) => x.id === id);
    if (!p || !p.note) return;
    const pop = document.createElement("div");
    pop.className = "note-popover";
    pop.dataset.id = String(id);
    pop.innerHTML = `
    <div class="note-actions" role="toolbar" aria-label="Note actions">
      <button class="note-edit" title="Edit note" aria-label="Edit note">\u270E</button>
      <button class="note-close" aria-label="Close">\u2715</button>
    </div>
    <div class="note-content"></div>`;
    const content = pop.querySelector(".note-content");
    content.innerHTML = markdownToHtml(p.note);
    document.body.appendChild(pop);
    const elRect = anchor.getBoundingClientRect();
    const approxW = 280;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    let left0 = elRect.left + elRect.width / 2 - approxW / 2;
    left0 = Math.max(6, Math.min(left0, vw - approxW - 6));
    pop.style.left = left0 + "px";
    pop.style.top = "6px";
    requestAnimationFrame(() => {
      const pr = pop.getBoundingClientRect();
      const vw2 = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      let left = elRect.left + elRect.width / 2 - pr.width / 2;
      left = Math.max(6, Math.min(left, vw2 - pr.width - 6));
      let top = elRect.top - pr.height - 10;
      if (top < 8) top = elRect.bottom + 10;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    });
    const enterEditMode = () => {
      if (pop.dataset.mode === "edit") return;
      pop.dataset.mode = "edit";
      const p2 = state.punches.find((x) => x.id === id);
      const current = p2 && p2.note || "";
      content.innerHTML = `
      <textarea class="note-editarea" aria-label="Edit note">${escapeHtml(current)}</textarea>
      <div class="note-edit-actions">
        <button class="btn primary note-save" type="button">Save</button>
        <button class="btn ghost note-cancel" type="button">Cancel</button>
      </div>`;
      try {
        const ta = content.querySelector(".note-editarea");
        if (ta) {
          ta.style.height = "auto";
          const h = Math.max(96, Math.min(360, ta.scrollHeight || 96));
          ta.style.height = h + "px";
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      } catch (e) {
      }
    };
    const exitEditMode = () => {
      delete pop.dataset.mode;
      const p3 = state.punches.find((x) => x.id === id);
      content.innerHTML = markdownToHtml((p3 == null ? void 0 : p3.note) || "");
    };
    pop.addEventListener("click", async (e) => {
      if (e.target.closest(".note-close")) {
        hideNotePopover();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-edit")) {
        enterEditMode();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-cancel")) {
        exitEditMode();
        e.stopPropagation();
        return;
      }
      if (e.target.closest(".note-save")) {
        const ta = pop.querySelector(".note-editarea");
        const newText = String((ta == null ? void 0 : ta.value) || "").trim();
        const idx = state.punches.findIndex((x) => x.id === id);
        if (idx !== -1) {
          const updated = { ...state.punches[idx], note: newText };
          await idb.put(updated);
          state.punches[idx] = updated;
          try {
            if (!newText) {
              hideNotePopover();
            } else {
              exitEditMode();
            }
            renderAll();
          } catch (e2) {
          }
        }
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
    });
  }
  var quillInstance = null;
  function ensureQuill() {
    try {
      if (!quillInstance && window.Quill && els.noteEditor) {
        quillInstance = new window.Quill(els.noteEditor, {
          theme: "snow",
          modules: {
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "code-block"],
              [{ header: [2, 3, false] }]
            ]
          }
        });
      }
    } catch (e) {
    }
    return quillInstance;
  }
  var quillBucket = null;
  function ensureBucketQuill() {
    try {
      if (!quillBucket && window.Quill && els.bucketNoteEditor) {
        quillBucket = new window.Quill(els.bucketNoteEditor, {
          theme: "snow",
          modules: {
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "code-block"],
              [{ header: [2, 3, false] }]
            ]
          }
        });
      }
    } catch (e) {
    }
    return quillBucket;
  }
  var quillEditPunch = null;
  var quillEditBucket = null;
  function ensureEditQuills() {
    try {
      if (!quillEditPunch && window.Quill && els.noteField) {
        try {
          els.noteField.style.display = "none";
        } catch (e) {
        }
        let host = document.getElementById("modalNoteEditor");
        if (!host) {
          host = document.createElement("div");
          host.id = "modalNoteEditor";
          host.className = "rich-editor";
          try {
            els.noteField.insertAdjacentElement("afterend", host);
          } catch (e) {
            document.body.appendChild(host);
          }
        }
        quillEditPunch = host.__quill || new window.Quill(host, {
          theme: "snow",
          modules: {
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "code-block"],
              [{ header: [2, 3, false] }]
            ]
          }
        });
        try {
          if (els.notePreview) els.notePreview.style.display = "none";
        } catch (e) {
        }
        try {
          if (els.notePreviewToggle) els.notePreviewToggle.style.display = "none";
        } catch (e) {
        }
      }
    } catch (e) {
    }
    try {
      if (!quillEditBucket && window.Quill && els.bucketNoteField) {
        try {
          els.bucketNoteField.style.display = "none";
        } catch (e) {
        }
        let hostB = document.getElementById("modalBucketNoteEditor");
        if (!hostB) {
          hostB = document.createElement("div");
          hostB.id = "modalBucketNoteEditor";
          hostB.className = "rich-editor";
          try {
            els.bucketNoteField.insertAdjacentElement("afterend", hostB);
          } catch (e) {
            document.body.appendChild(hostB);
          }
        }
        quillEditBucket = hostB.__quill || new window.Quill(hostB, {
          theme: "snow",
          modules: {
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "code-block"],
              [{ header: [2, 3, false] }]
            ]
          }
        });
        try {
          if (els.bucketNotePreview) els.bucketNotePreview.style.display = "none";
        } catch (e) {
        }
        try {
          if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.style.display = "none";
        } catch (e) {
        }
      }
    } catch (e) {
    }
    return { quillEditPunch, quillEditBucket };
  }
  function openNoteModal(id) {
    const p = state.punches.find((x) => x.id === id);
    if (!p) return;
    hideNotePopover();
    if (!els.noteModal) return;
    els.noteModal.dataset.id = String(id);
    try {
      if (els.noteModalTitle) els.noteModalTitle.textContent = `Note \u2014 ${p.bucket || "(no bucket)"}`;
    } catch (e) {
    }
    const html = markdownToHtml(p.note || "");
    if (els.noteViewer) els.noteViewer.innerHTML = html;
    const q = ensureQuill();
    if (q) {
      try {
        q.setContents([]);
      } catch (e) {
      }
      try {
        q.clipboard.dangerouslyPasteHTML(html || "");
      } catch (e) {
        try {
          q.root.innerHTML = html || "";
        } catch (e2) {
        }
      }
    }
    if (els.noteEditorWrap) els.noteEditorWrap.style.display = "";
    if (els.noteViewer) els.noteViewer.style.display = "none";
    if (els.noteEditToggle) {
      els.noteEditToggle.style.display = "";
      els.noteEditToggle.textContent = "View";
    }
    els.noteModal.style.display = "flex";
    try {
      const bucketName = String(p.bucket || "");
      const bq = ensureBucketQuill();
      if (els.bucketNoteViewer) els.bucketNoteViewer.innerHTML = "";
      idb.getBucket(bucketName).then((rec) => {
        const raw = rec && rec.note || "";
        const html2 = markdownToHtml(raw || "");
        try {
          if (els.bucketNoteViewer) els.bucketNoteViewer.innerHTML = html2;
        } catch (e) {
        }
        try {
          if (bq) {
            bq.setContents([]);
            bq.clipboard.dangerouslyPasteHTML(html2 || "");
          }
        } catch (e) {
          try {
            if (bq == null ? void 0 : bq.root) bq.root.innerHTML = html2 || "";
          } catch (e2) {
          }
        }
      }).catch(() => {
      });
      if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = "";
      if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = "none";
    } catch (e) {
    }
  }
  function closeNoteModal() {
    if (els.noteModal) {
      els.noteModal.style.display = "none";
      delete els.noteModal.dataset.id;
    }
  }
  function getView2() {
    const start = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const end = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes, startH: Math.floor(s / 60), endH: Math.ceil(e / 60) };
  }
  function renderMobileControls() {
    if (!els.mobileWindow || !els.mobileScrollbar) return;
    const view = getView2();
    const total = 24 * 60;
    const leftPct = view.start / total * 100;
    const widthPct = view.minutes / total * 100;
    els.mobileWindow.style.left = leftPct + "%";
    els.mobileWindow.style.width = widthPct + "%";
    try {
      els.mobileWindow.setAttribute("aria-valuenow", String(view.start));
    } catch (e) {
    }
    try {
      if (els.mobileZoomRange) {
        els.mobileZoomRange.min = "45";
        els.mobileZoomRange.max = String(total);
        els.mobileZoomRange.step = "15";
        els.mobileZoomRange.value = String(view.minutes);
      }
    } catch (e) {
    }
  }
  function renderTicks() {
    els.ticks.innerHTML = "";
    const view = getView2();
    const firstHour = Math.ceil(view.start / 60);
    const lastHour = Math.floor(view.end / 60);
    for (let h = firstHour; h <= lastHour; h++) {
      const minutes = h * 60;
      const pct = (minutes - view.start) / view.minutes * 100;
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.left = pct + "%";
      const line = document.createElement("div");
      line.className = "tick-line";
      const label = document.createElement("div");
      label.className = "tick-label";
      label.textContent = time.hourLabel(h % 24);
      if (view.start % 60 === 0 && h === view.start / 60) tick.dataset.edge = "start";
      if (view.end % 60 === 0 && h === view.end / 60) tick.dataset.edge = "end";
      tick.appendChild(line);
      tick.appendChild(label);
      els.ticks.appendChild(tick);
    }
  }
  function currentDay() {
    return state.currentDate || todayStr();
  }
  function getScheduleFilterIds() {
    const vid = state.currentScheduleViewId;
    if (vid != null) {
      const v = (state.scheduleViews || []).find((x) => Number(x.id) === Number(vid));
      if (v && Array.isArray(v.scheduleIds) && v.scheduleIds.length) return v.scheduleIds.map(Number);
      return null;
    }
    const id = state.currentScheduleId;
    return id == null ? null : [Number(id)];
  }
  function filterBySchedules(items, scheduleIds = null) {
    if (!scheduleIds) return items;
    const set = new Set(scheduleIds.map(Number));
    return items.filter((p) => p && p.scheduleId != null && set.has(Number(p.scheduleId)));
  }
  function renderTimeline() {
    var _a;
    hideNotePopover();
    els.track.querySelectorAll(".punch").forEach((n) => n.remove());
    const existingLayer = els.track.querySelector(".label-layer");
    if (existingLayer) existingLayer.remove();
    const labelLayer = document.createElement("div");
    labelLayer.className = "label-layer";
    const narrowItems = [];
    const rect = els.track.getBoundingClientRect();
    const trackWidth = rect.width || 1;
    const view = getView2();
    const day = currentDay();
    const scheduleIds = getScheduleFilterIds();
    const sorted = filterBySchedules(
      [...state.punches].filter((p) => getPunchDate(p) === day),
      scheduleIds
    ).sort((a, b) => a.start - b.start);
    for (const p of sorted) {
      const startClamped = Math.max(p.start, view.start);
      const endClamped = Math.min(p.end, view.end);
      if (endClamped <= startClamped) continue;
      const leftPct = (startClamped - view.start) / view.minutes * 100;
      const widthPct = (endClamped - startClamped) / view.minutes * 100;
      const el = document.createElement("div");
      el.className = "punch";
      el.style.left = leftPct + "%";
      el.style.width = widthPct + "%";
      el.dataset.id = p.id;
      const status = p.status || "default";
      el.classList.add(`status-${status}`);
      const leftHandle = document.createElement("div");
      leftHandle.className = "handle left";
      leftHandle.dataset.edge = "left";
      leftHandle.tabIndex = 0;
      leftHandle.setAttribute("aria-label", "Resize left edge");
      const label = document.createElement("div");
      label.className = "punch-label";
      label.textContent = p.bucket || "(no bucket)";
      label.dataset.id = p.id;
      try {
        const sched = (state.schedules || []).find((s) => Number(s.id) === Number(p.scheduleId));
        const schedName = (sched == null ? void 0 : sched.name) || (p.scheduleId != null ? `Schedule ${p.scheduleId}` : "Schedule");
        const chip = document.createElement("button");
        chip.className = "schedule-chip";
        chip.type = "button";
        chip.title = `Switch to schedule: ${schedName}`;
        chip.textContent = schedName;
        chip.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const sid = Number(p.scheduleId);
          if (!Number.isFinite(sid)) return;
          state.currentScheduleId = sid;
          state.currentScheduleViewId = null;
          try {
            localStorage.setItem("currentScheduleId", String(sid));
          } catch (e) {
          }
          try {
            localStorage.removeItem("currentScheduleViewId");
          } catch (e) {
          }
          try {
            if (els.scheduleSelect) els.scheduleSelect.value = String(sid);
          } catch (e) {
          }
          try {
            renderScheduleSelect == null ? void 0 : renderScheduleSelect();
          } catch (e) {
          }
          try {
            renderAll == null ? void 0 : renderAll();
          } catch (e) {
          }
        });
        el.appendChild(chip);
      } catch (e) {
      }
      const rightHandle = document.createElement("div");
      rightHandle.className = "handle right";
      rightHandle.dataset.edge = "right";
      rightHandle.tabIndex = 0;
      rightHandle.setAttribute("aria-label", "Resize right edge");
      const controls = document.createElement("div");
      controls.className = "controls";
      const editBtn = document.createElement("button");
      editBtn.className = "control-btn edit";
      editBtn.title = "Edit";
      editBtn.textContent = "\u270E";
      editBtn.dataset.id = p.id;
      const delBtn = document.createElement("button");
      delBtn.className = "control-btn delete";
      delBtn.title = "Delete";
      delBtn.textContent = "\u2715";
      delBtn.dataset.id = p.id;
      controls.append(editBtn, delBtn);
      el.append(label, controls);
      const pxWidth = widthPct / 100 * trackWidth;
      let edgeW = 8;
      if (pxWidth >= 48) edgeW = 16;
      else if (pxWidth >= 28) edgeW = 14;
      else if (pxWidth >= 18) edgeW = 12;
      else {
        edgeW = Math.max(6, Math.floor(pxWidth / 3));
        const centerMin = 4;
        if (edgeW * 2 > pxWidth - centerMin) edgeW = Math.max(4, Math.floor((pxWidth - centerMin) / 2));
        edgeW = Math.max(4, Math.min(18, edgeW));
      }
      if (!Number.isFinite(edgeW) || edgeW <= 0) edgeW = 6;
      leftHandle.style.width = edgeW + "px";
      rightHandle.style.width = edgeW + "px";
      leftHandle.style.left = "0px";
      rightHandle.style.right = "0px";
      const leftBar = document.createElement("div");
      leftBar.className = "handle-bar";
      const rightBar = document.createElement("div");
      rightBar.className = "handle-bar";
      leftHandle.appendChild(leftBar);
      rightHandle.appendChild(rightBar);
      try {
        leftBar.style.left = "0px";
        leftBar.style.right = "";
        leftBar.style.borderTopLeftRadius = "8px";
        leftBar.style.borderBottomLeftRadius = "8px";
        rightBar.style.right = "0px";
        rightBar.style.left = "";
        rightBar.style.borderTopRightRadius = "8px";
        rightBar.style.borderBottomRightRadius = "8px";
      } catch (e) {
      }
      el.append(leftHandle, rightHandle);
      try {
        if (window.DEBUG_HANDLES) {
          leftBar.style.background = "rgba(255,0,0,0.12)";
          leftBar.style.outline = "1px solid rgba(255,0,0,0.35)";
          rightBar.style.background = "rgba(0,255,0,0.12)";
          rightBar.style.outline = "1px solid rgba(0,255,0,0.35)";
          leftBar.title = `Left handle (w=${edgeW}px) - anchored left`;
          rightBar.title = `Right handle (w=${edgeW}px) - anchored right`;
          console.log("HANDLE_DEBUG", { id: p.id, pxWidth, edgeW, leftPct, widthPct });
        }
      } catch (e) {
      }
      const noteBtn = document.createElement("button");
      noteBtn.className = "note-dot";
      noteBtn.title = p.note && String(p.note).trim() ? "Show note" : "Add note";
      noteBtn.type = "button";
      noteBtn.dataset.id = p.id;
      el.appendChild(noteBtn);
      els.track.appendChild(el);
      try {
        requestAnimationFrame(() => {
          const elRect = el.getBoundingClientRect();
          const leftBarRect = leftBar.getBoundingClientRect();
          const rightBarRect = rightBar.getBoundingClientRect();
          const centerX = elRect.left + elRect.width / 2;
          if (leftBarRect.left > centerX) {
            leftBar.style.left = "0px";
            leftBar.style.right = "";
            if (window.DEBUG_HANDLES) console.log("HANDLE_AUTOFLIP: corrected left (anchor left) for", p.id);
          }
          if (rightBarRect.right < centerX) {
            rightBar.style.right = "0px";
            rightBar.style.left = "";
            if (window.DEBUG_HANDLES) console.log("HANDLE_AUTOFLIP: corrected right (anchor right) for", p.id);
          }
        });
      } catch (e) {
      }
      if (widthPct < 6) el.classList.add("narrow");
      else el.classList.remove("narrow");
      if (widthPct < 6) {
        const centerPct = leftPct + widthPct / 2;
        narrowItems.push({ punch: p, leftPct, widthPct, centerPct });
      }
    }
    const placed = [];
    for (const it of narrowItems) {
      const centerPx = it.centerPct / 100 * trackWidth;
      let row = 0;
      for (; ; row++) {
        const conflict = (_a = placed[row]) == null ? void 0 : _a.some((px) => Math.abs(px - centerPx) < 120);
        if (!conflict) break;
      }
      placed[row] = placed[row] || [];
      placed[row].push(centerPx);
      it.row = row;
      it.centerPx = centerPx;
    }
    for (const it of narrowItems) {
      const pop = document.createElement("div");
      pop.className = "label-popper";
      const pxLeft = Math.max(6, it.centerPx - 55);
      pop.style.left = pxLeft + "px";
      pop.style.top = 8 + it.row * 40 + "px";
      pop.dataset.id = it.punch.id;
      pop.innerHTML = `<div class="label-text">${escapeHtml(it.punch.bucket || "(no bucket)")}</div><div class="controls"><button class="control-btn edit" title="Edit">\u270E</button><button class="control-btn delete" title="Delete">\u2715</button></div>`;
      pop.style.display = "none";
      const conn = document.createElement("div");
      conn.className = "label-connector";
      conn.style.left = it.centerPx - 1 + "px";
      conn.style.top = "0px";
      conn.style.height = 16 + it.row * 40 + "px";
      conn.style.display = "none";
      labelLayer.appendChild(conn);
      labelLayer.appendChild(pop);
      it._pop = pop;
      it._conn = conn;
    }
    if (narrowItems.length) els.track.appendChild(labelLayer);
    for (const it of narrowItems) {
      const id = it.punch.id;
      const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (!punchEl) continue;
      const pop = it._pop;
      const conn = it._conn;
      punchEl.addEventListener("mouseenter", () => {
        pop.style.display = "grid";
        conn.style.display = "block";
      });
      punchEl.addEventListener("mouseleave", () => {
        pop.style.display = "none";
        conn.style.display = "none";
      });
    }
  }
  function renderTable() {
    els.rows.innerHTML = "";
    const day = currentDay();
    const scheduleIds = getScheduleFilterIds();
    const sorted = filterBySchedules(
      [...state.punches].filter((p) => getPunchDate(p) === day),
      scheduleIds
    ).sort((a, b) => a.start - b.start);
    for (const p of sorted) {
      const tr = document.createElement("tr");
      tr.dataset.id = p.id;
      const status = p.status || "default";
      tr.classList.add(`status-${status}`);
      const dur = p.end - p.start;
      tr.innerHTML = `
      <td class="status-cell"><div class="status-wrap"><button class="status-btn status-${status}" data-id="${p.id}" aria-label="Status"></button>
        <div class="status-menu" data-id="${p.id}">
          <div class="status-option" data-value="default" title="Default"></div>
          <div class="status-option" data-value="green" title="Green (transparent)"></div>
          <div class="status-option" data-value="green-solid" title="Green"></div>
          <div class="status-option" data-value="yellow" title="Yellow (transparent)"></div>
          <div class="status-option" data-value="yellow-solid" title="Yellow"></div>
          <div class="status-option" data-value="red" title="Red (transparent)"></div>
          <div class="status-option" data-value="red-solid" title="Red"></div>
          <div class="status-option" data-value="blue" title="Blue (transparent)"></div>
          <div class="status-option" data-value="blue-solid" title="Blue"></div>
          <div class="status-option" data-value="purple" title="Purple (transparent)"></div>
          <div class="status-option" data-value="purple-solid" title="Purple"></div>
        </div></div></td>
      <td class="cell-start copy-cell" title="Click to copy start">${time.toLabel(p.start)}</td>
      <td class="cell-end copy-cell" title="Click to copy stop">${time.toLabel(p.end)}</td>
      <td class="cell-duration copy-cell" title="Click to copy duration">${time.durationLabel(dur)}</td>
      <td class="cell-bucket copy-cell" title="Click to copy bucket">${escapeHtml(p.bucket || "")}</td>
      <td class="note"><div class="note-window" role="region" aria-label="Note preview"><div class="note-html">${markdownToHtml(p.note || "")}</div></div></td>
      <td class="table-actions">
        <button class="row-action edit" title="Edit" data-id="${p.id}">Edit</button>
        <button class="row-action delete" title="Delete" data-id="${p.id}">Delete</button>
      </td>`;
      els.rows.appendChild(tr);
    }
    els.empty.style.display = sorted.length ? "none" : "block";
  }
  function renderTotal() {
    const day = currentDay();
    const scheduleIds = getScheduleFilterIds();
    const totalMin = filterBySchedules(state.punches.filter((p) => getPunchDate(p) === day), scheduleIds).reduce((s, p) => s + (p.end - p.start), 0);
    els.total.textContent = totalMin ? `Total: ${time.durationLabel(totalMin)}` : "";
  }
  function summarizeByBucket(punches) {
    const map = /* @__PURE__ */ new Map();
    for (const p of punches) {
      const key = String(p.bucket || "").trim();
      const prev = map.get(key) || { totalMin: 0, count: 0 };
      const add2 = Math.max(0, (p.end || 0) - (p.start || 0));
      map.set(key, { totalMin: prev.totalMin + add2, count: prev.count + 1 });
    }
    return map;
  }
  function renderBucketDay() {
    if (!els.bucketDayBody || !els.bucketDayCard) return;
    const day = currentDay();
    const scheduleIds = getScheduleFilterIds();
    const items = filterBySchedules(state.punches.filter((p) => getPunchDate(p) === day), scheduleIds);
    const sums = summarizeByBucket(items);
    const sorted = Array.from(sums.entries()).filter(([_, v]) => v.totalMin > 0).sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
    els.bucketDayBody.innerHTML = "";
    for (const [bucket, info] of sorted) {
      const tr = document.createElement("tr");
      tr.dataset.bucket = bucket;
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
      els.bucketDayBody.appendChild(tr);
    }
    if (els.bucketDayEmpty) els.bucketDayEmpty.style.display = sorted.length ? "none" : "block";
    els.bucketDayCard.style.display = state.viewMode === "calendar" ? "none" : "";
  }
  function renderBucketMonth() {
    if (!els.bucketMonthBody || !els.bucketMonthCard) return;
    const y = state.calendarYear;
    const m = state.calendarMonth;
    const scheduleIds = getScheduleFilterIds();
    const items = filterBySchedules(state.punches.filter((p) => {
      const d = (p.date || "").split("-");
      if (d.length !== 3) return false;
      const yy = Number(d[0]);
      const mm = Number(d[1]) - 1;
      return yy === y && mm === m;
    }), scheduleIds);
    const sums = summarizeByBucket(items);
    const sorted = Array.from(sums.entries()).filter(([_, v]) => v.totalMin > 0).sort((a, b) => b[1].totalMin - a[1].totalMin || a[0].localeCompare(b[0]));
    els.bucketMonthBody.innerHTML = "";
    for (const [bucket, info] of sorted) {
      const tr = document.createElement("tr");
      tr.dataset.bucket = bucket;
      const label = bucket || "(no bucket)";
      tr.innerHTML = `<td><a href="#" class="bucket-link">${escapeHtml(label)}</a></td><td>${time.durationLabel(info.totalMin)}</td>`;
      els.bucketMonthBody.appendChild(tr);
    }
    if (els.bucketMonthEmpty) els.bucketMonthEmpty.style.display = sorted.length ? "none" : "block";
    if (els.bucketMonthTitle) {
      try {
        const d = new Date(y, m, 1);
        const monthName = d.toLocaleString(void 0, { month: "long", year: "numeric" });
        els.bucketMonthTitle.textContent = `\u2013 ${monthName}`;
      } catch (e) {
        els.bucketMonthTitle.textContent = "";
      }
    }
    const show = state.viewMode === "calendar" && (state.calendarMode || "days") === "days";
    els.bucketMonthCard.style.display = show ? "" : "none";
  }
  function renderBucketView() {
    if (!els.bucketViewCard || !els.bucketViewBody) return;
    const name = String(state.bucketFilter || "");
    const label = name || "(no bucket)";
    if (els.bucketViewTitle) els.bucketViewTitle.textContent = label;
    const scheduleIds = getScheduleFilterIds();
    const items = filterBySchedules(
      state.punches.filter((p) => String(p.bucket || "").trim() === name),
      scheduleIds
    ).slice().sort((a, b) => {
      const ad = String(a.date || "").localeCompare(String(b.date || ""));
      if (ad !== 0) return ad;
      return (a.start || 0) - (b.start || 0);
    });
    try {
      const totalMin = items.reduce((s, p) => s + Math.max(0, (p.end || 0) - (p.start || 0)), 0);
      if (els.bucketViewTotal) els.bucketViewTotal.textContent = totalMin ? `\u2014 Total: ${time.durationLabel(totalMin)}` : "";
    } catch (e) {
    }
    els.bucketViewBody.innerHTML = "";
    for (const p of items) {
      const tr = document.createElement("tr");
      tr.dataset.id = p.id;
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      tr.innerHTML = `
      <td>${escapeHtml(p.date || "")}</td>
      <td>${time.toLabel(p.start || 0)}</td>
      <td>${time.toLabel(p.end || 0)}</td>
      <td>${time.durationLabel(dur)}</td>
      <td class="note"><div class="note-html">${markdownToHtml(p.note || "")}</div></td>`;
      els.bucketViewBody.appendChild(tr);
    }
    if (els.bucketViewEmpty) els.bucketViewEmpty.style.display = items.length ? "none" : "block";
  }
  function renderDayLabel() {
    if (!els.dayLabel) return;
    if (state.viewMode === "calendar" || state.viewMode === "bucket") {
      els.dayLabel.style.display = "none";
      try {
        els.dayLabel.classList.remove("clickable");
      } catch (e) {
      }
      return;
    }
    els.dayLabel.style.display = "";
    try {
      els.dayLabel.classList.add("clickable");
    } catch (e) {
    }
    const day = currentDay();
    const d = parseDate(day) || /* @__PURE__ */ new Date();
    const label = d.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    els.dayLabel.textContent = `Day: ${label}`;
  }
  function updateHelpText() {
    if (!els.viewHelp) return;
    if (state.viewMode === "calendar") {
      const mode = state.calendarMode || "days";
      if (mode === "days") {
        els.viewHelp.textContent = "Calendar: click a day to open \xB7 Use Prev/Next to change month \xB7 Click month/year to change mode";
      } else if (mode === "months") {
        els.viewHelp.textContent = "Months: click a month to view days \xB7 Use Prev/Next to change year \xB7 Click year to pick year range";
      } else {
        els.viewHelp.textContent = "Years: click a year to view months \xB7 Use Prev/Next to change 12-year range";
      }
      return;
    }
    if (state.viewMode === "bucket") {
      els.viewHelp.textContent = "Bucket: click Back to Calendar to return A\uFFFD Use Delete Bucket to remove all entries";
      return;
    }
    els.viewHelp.textContent = "Drag to create \xB7 Resize with side handles \xB7 Snaps to 15m \xB7 Scroll to zoom \xB7 Shift+Scroll to pan \xB7 Click the day title to open calendar";
  }
  function updateViewMode() {
    const timelineCard = document.querySelector(".timeline");
    const mainTableCard = els.rows ? els.rows.closest(".table-card") : document.querySelector(".table-card");
    if (state.viewMode === "calendar") {
      const d = parseDate(currentDay());
      if (d) {
        state.calendarYear = d.getFullYear();
        state.calendarMonth = d.getMonth();
      }
      if (timelineCard) timelineCard.style.display = "none";
      if (mainTableCard) mainTableCard.style.display = "none";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "none";
      if (els.calendarCard) els.calendarCard.style.display = "block";
      if (els.btnCalendar) els.btnCalendar.textContent = "Back to Day";
      calendar.renderCalendar();
      if (els.bucketMonthCard) {
        const show = (state.calendarMode || "days") === "days";
        els.bucketMonthCard.style.display = show ? "" : "none";
      }
      if (els.bucketViewCard) els.bucketViewCard.style.display = "none";
      renderBucketMonth();
    } else if (state.viewMode === "bucket") {
      if (timelineCard) timelineCard.style.display = "none";
      if (mainTableCard) mainTableCard.style.display = "none";
      if (els.calendarCard) els.calendarCard.style.display = "none";
      if (els.btnCalendar) els.btnCalendar.textContent = "Calendar";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "none";
      if (els.bucketMonthCard) els.bucketMonthCard.style.display = "none";
      if (els.bucketViewCard) els.bucketViewCard.style.display = "";
      try {
        renderBucketView();
      } catch (e) {
      }
    } else {
      if (timelineCard) timelineCard.style.display = "";
      if (mainTableCard) mainTableCard.style.display = "";
      if (els.calendarCard) els.calendarCard.style.display = "none";
      if (els.btnCalendar) els.btnCalendar.textContent = "Calendar";
      if (els.bucketDayCard) els.bucketDayCard.style.display = "";
      if (els.bucketMonthCard) els.bucketMonthCard.style.display = "none";
      if (els.bucketViewCard) els.bucketViewCard.style.display = "none";
      renderTicks();
      renderTimeline();
      renderTable();
      renderTotal();
      nowIndicator.update();
      renderBucketDay();
    }
    try {
      if (els.btnBucketBackTop) els.btnBucketBackTop.style.display = state.viewMode === "bucket" ? "" : "none";
    } catch (e) {
    }
    renderDayLabel();
    updateHelpText();
    try {
      if (state.viewMode === "bucket" && els.viewHelp) {
        els.viewHelp.textContent = "Bucket: Click 'Back to Calendar' to return; click 'Delete Bucket' to remove all entries.";
      }
    } catch (e) {
    }
    try {
      renderMobileControls();
    } catch (e) {
    }
    try {
      fitMobileViewport();
    } catch (e) {
    }
  }
  function showGhost(a, b) {
    const [start, end] = a < b ? [a, b] : [b, a];
    const view = getView2();
    const leftPct = (start - view.start) / view.minutes * 100;
    const widthPct = (end - view.start) / view.minutes * 100 - leftPct;
    Object.assign(els.ghost.style, { display: "block", left: leftPct + "%", width: widthPct + "%" });
    showTips(start, end);
  }
  function hideGhost() {
    els.ghost.style.display = "none";
    hideTips();
  }
  function showTips(start, end) {
    const view = getView2();
    const leftPct = (start - view.start) / view.minutes * 100;
    const rightPct = (end - view.start) / view.minutes * 100;
    const centerPct = ((start + end) / 2 - view.start) / view.minutes * 100;
    els.tipStart.textContent = time.toLabel(start);
    els.tipEnd.textContent = time.toLabel(end);
    els.tipCenter.textContent = time.durationLabel(Math.max(0, end - start));
    els.tipStart.style.left = leftPct + "%";
    els.tipEnd.style.left = rightPct + "%";
    els.tipCenter.style.left = centerPct + "%";
    els.tipStart.style.display = "block";
    els.tipEnd.style.display = "block";
    els.tipCenter.style.display = "block";
  }
  function hideTips() {
    els.tipStart.style.display = "none";
    els.tipEnd.style.display = "none";
    els.tipCenter.style.display = "none";
  }
  function openModal(range) {
    var _a, _b, _c;
    state.editingId = null;
    state.pendingRange = range;
    els.startField.value = time.toLabel(range.startMin);
    els.endField.value = time.toLabel(range.endMin);
    els.bucketField.value = "";
    els.noteField.value = "";
    try {
      const { quillEditPunch: quillEditPunch2, quillEditBucket: quillEditBucket2 } = ensureEditQuills();
      if (quillEditPunch2) {
        try {
          quillEditPunch2.setContents([]);
        } catch (e) {
        }
      }
      if (quillEditBucket2) {
        try {
          quillEditBucket2.setContents([]);
        } catch (e) {
        }
      }
    } catch (e) {
    }
    try {
      const curId = state.currentScheduleId != null ? Number(state.currentScheduleId) : (_c = (_b = (_a = state.schedules) == null ? void 0 : _a[0]) == null ? void 0 : _b.id) != null ? _c : null;
      const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
      if (els.scheduleField) els.scheduleField.value = (cur == null ? void 0 : cur.name) || "";
    } catch (e) {
    }
    try {
      const menu = els.scheduleMenu;
      if (menu) {
        menu.innerHTML = "";
        for (const s of state.schedules || []) {
          const item = document.createElement("div");
          item.className = "dropdown-item";
          const name = String(s.name || `Schedule ${s.id}`);
          item.textContent = name;
          item.dataset.value = name;
          menu.appendChild(item);
        }
      }
    } catch (e) {
    }
    try {
      if (els.bucketNoteField) els.bucketNoteField.value = "";
      if (els.bucketNotePreview) {
        els.bucketNotePreview.style.display = "none";
        els.bucketNotePreview.innerHTML = "";
      }
      if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = "Preview";
    } catch (e) {
    }
    try {
      if (els.repeatEnabled) els.repeatEnabled.checked = false;
      if (els.repeatFields) els.repeatFields.style.display = "none";
      if (els.applyScopeWrap) els.applyScopeWrap.style.display = "none";
      if (els.repeatFreq) els.repeatFreq.value = "weekly";
      if (els.repeatUntil) els.repeatUntil.value = "";
      if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
    } catch (e) {
    }
    try {
      if (els.notePreview) {
        els.notePreview.style.display = "none";
        els.notePreview.innerHTML = "";
      }
      if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
      if (els.noteField) {
        els.noteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
        els.noteField.style.height = h + "px";
      }
    } catch (e) {
    }
    if (els.modalStatusBtn) {
      els.modalStatusBtn.dataset.value = "default";
      els.modalStatusBtn.className = "status-btn status-default";
    }
    try {
      if (els.repeatEnabled) els.repeatEnabled.disabled = false;
      if (els.repeatFreq) els.repeatFreq.disabled = false;
      if (els.repeatUntil) els.repeatUntil.disabled = false;
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
      if (els.repeatDow) els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = false);
      if (els.extendWrap) els.extendWrap.style.display = "none";
    } catch (e) {
    }
    if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
    if (els.modalDelete) els.modalDelete.style.display = "none";
    if (els.modalTitle) els.modalTitle.textContent = "New Time Block";
    els.modal.style.display = "flex";
    els.bucketField.focus();
  }
  function closeModal() {
    els.modal.style.display = "none";
    state.pendingRange = null;
    state.editingId = null;
    if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
  }
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.style.display = "block";
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(() => els.toast.style.display = "none", 2400);
  }
  function renderAll() {
    try {
      renderScheduleSelect();
    } catch (e) {
    }
    updateViewMode();
  }
  function fitMobileViewport() {
    const isMobile = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth) <= 720;
    if (!isMobile) {
      if (els.track) els.track.style.height = "";
      return;
    }
    if (!els.track) return;
    const headerEl = document.querySelector(".header");
    const topControls = document.getElementById("topControls");
    const mobileControls = els.mobileControls;
    const vh = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const topH = topControls && topControls.offsetParent !== null ? topControls.getBoundingClientRect().height : 0;
    const mobileH = mobileControls && mobileControls.offsetParent !== null ? mobileControls.getBoundingClientRect().height : 0;
    const margins = 24;
    const available = Math.max(120, vh - headerH - topH - mobileH - margins);
    const desired = Math.max(96, Math.min(180, Math.floor(available)));
    els.track.style.height = desired + "px";
  }
  function renderScheduleSelect() {
    const sel = els.scheduleSelect;
    if (!sel) return;
    const curSched = state.currentScheduleId != null ? Number(state.currentScheduleId) : null;
    const curView = state.currentScheduleViewId != null ? Number(state.currentScheduleViewId) : null;
    sel.innerHTML = "";
    const views = (state.scheduleViews || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    if (views.length) {
      const group = document.createElement("optgroup");
      group.label = "Views";
      for (const v of views) {
        const opt = document.createElement("option");
        opt.value = `view:${v.id}`;
        opt.textContent = v.name || `View ${v.id}`;
        if (curView != null && Number(v.id) === curView) opt.selected = true;
        group.appendChild(opt);
      }
      sel.appendChild(group);
    }
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All Schedules";
    if (curView == null && curSched == null) optAll.selected = true;
    sel.appendChild(optAll);
    for (const s of state.schedules || []) {
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = s.name || `Schedule ${s.id}`;
      if (curView == null && curSched != null && Number(s.id) === curSched) opt.selected = true;
      sel.appendChild(opt);
    }
  }
  var ui = {
    renderAll,
    renderTicks,
    renderTimeline,
    renderTable,
    renderTotal,
    toggleNotePopover,
    hideNotePopover,
    openNoteModal,
    closeNoteModal,
    showGhost,
    hideGhost,
    showTips,
    hideTips,
    openModal,
    closeModal,
    toast,
    renderDayLabel,
    updateViewMode,
    updateHelpText,
    renderBucketDay,
    renderBucketMonth,
    renderBucketView,
    renderMobileControls,
    renderScheduleSelect,
    // Expose to allow actions to initialize editors inside Edit modal
    ensureEditQuills
  };

  // src/validate.js
  var import_ajv = __toESM(require_ajv());

  // src/schema.js
  var scheduleSchema = {
    $id: "Schedule",
    type: "object",
    additionalProperties: false,
    properties: {
      id: { anyOf: [{ type: "integer" }, { type: "null" }] },
      name: { type: "string", minLength: 1, maxLength: 200 }
    },
    required: ["name"]
  };
  var scheduleViewSchema = {
    $id: "ScheduleView",
    type: "object",
    additionalProperties: false,
    properties: {
      id: { anyOf: [{ type: "integer" }, { type: "null" }] },
      name: { type: "string", minLength: 1, maxLength: 200 },
      scheduleIds: {
        type: "array",
        items: { type: "integer" }
      }
    },
    required: ["name", "scheduleIds"]
  };
  var punchSchema = {
    $id: "Punch",
    type: "object",
    additionalProperties: true,
    properties: {
      id: { anyOf: [{ type: "integer" }, { type: "null" }] },
      start: { type: "integer", minimum: 0, maximum: 1440 },
      end: { type: "integer", minimum: 0, maximum: 1440 },
      bucket: { type: "string" },
      note: { type: "string" },
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      scheduleId: { anyOf: [{ type: "integer" }, { type: "null" }] }
    },
    required: ["start", "end", "date"]
  };
  var backupSchema = {
    $id: "Backup",
    type: "object",
    additionalProperties: true,
    properties: {
      app: { type: "string" },
      kind: { type: "string" },
      version: { type: "integer", minimum: 2 },
      exportedAt: { type: "string" },
      count: { type: "integer" },
      punches: {
        type: "array",
        items: punchSchema
      },
      buckets: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            name: { type: "string" },
            note: { type: "string" }
          }
        }
      },
      schedules: {
        type: "array",
        items: scheduleSchema
      },
      scheduleViews: {
        type: "array",
        items: scheduleViewSchema
      }
    },
    required: ["punches"]
  };

  // src/validate.js
  var ajv = new import_ajv.default({ allErrors: true, strict: false });
  ajv.addSchema(scheduleSchema).addSchema(scheduleViewSchema).addSchema(punchSchema).addSchema(backupSchema);
  var vSchedule = ajv.getSchema("Schedule") || ajv.compile(scheduleSchema);
  var vScheduleView = ajv.getSchema("ScheduleView") || ajv.compile(scheduleViewSchema);
  var vPunch = ajv.getSchema("Punch") || ajv.compile(punchSchema);
  var vBackup = ajv.getSchema("Backup") || ajv.compile(backupSchema);
  function formatErrors(errors) {
    try {
      return (errors || []).map((e) => `${e.instancePath || e.schemaPath}: ${e.message}`).join("; ");
    } catch (e) {
      return "Validation failed";
    }
  }
  function validateSchedule(obj) {
    var _a;
    const data = { ...obj, name: String((_a = obj == null ? void 0 : obj.name) != null ? _a : "").trim() };
    const ok = vSchedule(data);
    return { valid: !!ok, errors: ok ? null : vSchedule.errors };
  }
  function assertSchedule(obj) {
    const { valid, errors } = validateSchedule(obj);
    if (!valid) {
      const msg = formatErrors(errors);
      const err = new Error(`ValidationError: Schedule invalid \u2013 ${msg}`);
      err.name = "ValidationError";
      err.details = errors;
      throw err;
    }
  }
  function validateScheduleView(obj) {
    var _a;
    const data = { ...obj, name: String((_a = obj == null ? void 0 : obj.name) != null ? _a : "").trim(), scheduleIds: Array.isArray(obj == null ? void 0 : obj.scheduleIds) ? obj.scheduleIds.map(Number) : [] };
    const ok = vScheduleView(data);
    return { valid: !!ok, errors: ok ? null : vScheduleView.errors };
  }
  function assertScheduleView(obj) {
    const { valid, errors } = validateScheduleView(obj);
    if (!valid) {
      const msg = formatErrors(errors);
      const err = new Error(`ValidationError: ScheduleView invalid \u2013 ${msg}`);
      err.name = "ValidationError";
      err.details = errors;
      throw err;
    }
  }
  function validateBackup(obj) {
    try {
      const ok = vBackup(obj);
      return { valid: !!ok, errors: ok ? null : vBackup.errors };
    } catch (err) {
      return { valid: false, errors: [{ message: (err == null ? void 0 : err.message) || "Backup validation error" }] };
    }
  }

  // src/recur.js
  function addDays(d, days) {
    const nd = new Date(d.getTime());
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }
  function addMonthsClamped(d, months) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const targetM = m + months;
    const targetY = y + Math.floor(targetM / 12);
    const normM = (targetM % 12 + 12) % 12;
    const dim = daysInMonth(targetY, normM);
    const clampedDay = Math.min(day, dim);
    return new Date(targetY, normM, clampedDay);
  }
  function addYearsClamped(d, years) {
    const y = d.getFullYear() + years;
    const m = d.getMonth();
    const day = d.getDate();
    const dim = daysInMonth(y, m);
    const clampedDay = Math.min(day, dim);
    return new Date(y, m, clampedDay);
  }
  function expandDates(startDateStr, rule) {
    const out = [];
    const start = parseDate(startDateStr);
    if (!start) return out;
    const freq = (rule == null ? void 0 : rule.freq) || "weekly";
    const interval = Math.max(1, Math.floor(Number((rule == null ? void 0 : rule.interval) || 1)));
    const until = (rule == null ? void 0 : rule.until) ? parseDate(rule.until) : null;
    const count = (rule == null ? void 0 : rule.count) ? Math.max(1, Math.floor(Number(rule.count))) : null;
    const byWeekday = Array.isArray(rule == null ? void 0 : rule.byWeekday) ? [...new Set(rule.byWeekday.map((n) => (Number(n) % 7 + 7) % 7))].sort((a, b) => a - b) : null;
    let i = 0;
    let cur = new Date(start.getTime());
    const startStr = toDateStr(start);
    if (freq === "weekly" && byWeekday && byWeekday.length) {
      let guard = 0;
      while (true) {
        const curStr = toDateStr(cur);
        const daysSince = Math.floor((cur - start) / 864e5);
        const weekIndex = Math.floor(daysSince / 7);
        const isSelectedDow = byWeekday.includes(cur.getDay());
        const onIntervalWeek = weekIndex % interval === 0;
        if (isSelectedDow && onIntervalWeek) {
          out.push(curStr);
          i++;
          if (count && i >= count) break;
        }
        if (until && curStr >= toDateStr(until)) break;
        cur = addDays(cur, 1);
        guard++;
        if (guard > 2e4 || out.length > 5e3) break;
      }
    } else {
      while (true) {
        const curStr = toDateStr(cur);
        out.push(curStr);
        i++;
        if (count && i >= count) break;
        if (until && curStr >= toDateStr(until)) break;
        if (freq === "daily") cur = addDays(cur, interval);
        else if (freq === "weekly") cur = addDays(cur, 7 * interval);
        else if (freq === "monthly") cur = addMonthsClamped(cur, interval);
        else if (freq === "yearly") cur = addYearsClamped(cur, interval);
        else cur = addDays(cur, 7 * interval);
        if (out.length > 2e3) break;
      }
    }
    return out;
  }

  // src/actions/helpers.js
  var getView3 = () => {
    const start = Math.max(0, Math.min(24 * 60, state.viewStartMin | 0));
    const end = Math.max(0, Math.min(24 * 60, state.viewEndMin | 0));
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    const minutes = Math.max(1, e - s);
    return { start: s, end: e, minutes };
  };
  var pxToMinutes = (clientX) => {
    const rect = els.track.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    const view = getView3();
    const mins = view.start + pct * view.minutes;
    return Math.max(view.start, Math.min(view.end, Math.round(mins)));
  };
  var overlapsAny = (start, end, excludeId = null) => {
    var _a, _b;
    const day = state.currentDate || todayStr();
    let schedId = null;
    if (excludeId != null) {
      const base = state.punches.find((x) => x.id === excludeId);
      if (base && base.scheduleId != null) schedId = Number(base.scheduleId);
    }
    if (schedId == null) {
      if (state.currentScheduleId != null) schedId = Number(state.currentScheduleId);
      else {
        const first = (_b = (_a = state.schedules) == null ? void 0 : _a[0]) == null ? void 0 : _b.id;
        if (first != null) schedId = Number(first);
      }
    }
    return state.punches.some(
      (p) => p.id !== excludeId && getPunchDate(p) === day && (schedId == null || Number(p.scheduleId) === schedId) && start < (p.end || 0) && end > (p.start || 0)
    );
  };
  var nearestBounds = (forId) => {
    const day = state.currentDate || todayStr();
    const base = state.punches.find((x) => x.id === forId);
    const schedId = base && base.scheduleId != null ? Number(base.scheduleId) : null;
    const sorted = [...state.punches].filter((p) => p.id !== forId && getPunchDate(p) === day && (schedId == null || Number(p.scheduleId) === schedId)).sort((a, b) => a.start - b.start);
    return {
      leftLimitAt: (start) => {
        const leftNeighbor = [...sorted].filter((p) => (p.end || 0) <= start).pop();
        return leftNeighbor ? leftNeighbor.end || getView3().start : getView3().start;
      },
      rightLimitAt: (end) => {
        const rightNeighbor = [...sorted].find((p) => (p.start || 0) >= end);
        return rightNeighbor ? rightNeighbor.start || getView3().end : getView3().end;
      }
    };
  };

  // src/actions/drag.js
  var startDrag = (e) => {
    if (e.target.closest(".handle")) return;
    if (e.target.closest(".punch")) return;
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const snapped = time.snap(raw);
    state.dragging = { anchor: snapped, last: snapped };
    ui.showGhost(snapped, snapped);
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
  };
  var onDragMove = (e) => {
    if (!state.dragging) return;
    if (e.cancelable) e.preventDefault();
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const snapped = time.snap(raw);
    state.dragging.last = snapped;
    ui.showGhost(state.dragging.anchor, snapped);
  };
  var endDrag = () => {
    if (!state.dragging) return;
    const a = state.dragging.anchor;
    const b = state.dragging.last;
    state.dragging = null;
    ui.hideGhost();
    const startMin = Math.min(a, b);
    const endMin = Math.max(a, b);
    if (endMin - startMin < 1) return;
    if (overlapsAny(startMin, endMin)) {
      ui.toast("That range overlaps another block.");
      return;
    }
    ui.openModal({ startMin, endMin });
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchend", endDrag);
  };
  var startMove = (e) => {
    const handle = e.target.closest(".handle");
    if (handle) return;
    const punchEl = e.target.closest(".punch");
    if (!punchEl) return;
    const id = Number(punchEl.dataset.id);
    const p = state.punches.find((x) => x.id === id);
    if (!p) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pointerMin = pxToMinutes(clientX);
    const duration = p.end - p.start;
    const offset = pointerMin - p.start;
    state.moving = {
      id,
      duration,
      offset,
      startStart: p.start,
      startEnd: p.end,
      startClientX: clientX,
      moved: false
    };
    window.addEventListener("mousemove", onMoveMove);
    window.addEventListener("touchmove", onMoveMove, { passive: false });
    window.addEventListener("mouseup", endMove);
    window.addEventListener("touchend", endMove);
  };
  var onMoveMove = (e) => {
    if (!state.moving) return;
    if (e.cancelable) e.preventDefault();
    const { id, duration, offset, startClientX } = state.moving;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - startClientX) > 3) state.moving.moved = true;
    const m = time.snap(pxToMinutes(clientX));
    let desiredStart = m - offset;
    desiredStart = time.snap(desiredStart);
    const desiredEnd = desiredStart + duration;
    const bounds = nearestBounds(id);
    const leftLimit = bounds.leftLimitAt(desiredStart);
    const rightLimit = bounds.rightLimitAt(desiredEnd);
    const minStart = leftLimit;
    const maxStart = rightLimit - duration;
    const clampedStart = Math.max(minStart, Math.min(maxStart, desiredStart));
    const newStart = time.snap(clampedStart);
    const newEnd = newStart + duration;
    const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
    const el = els.track.querySelector(`.punch[data-id="${id}"]`);
    const view = getView3();
    const leftPct = (Math.max(newStart, view.start) - view.start) / view.minutes * 100;
    const widthPct = (Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes * 100;
    el.style.left = leftPct + "%";
    el.style.width = widthPct + "%";
    el.classList.toggle("invalid", invalid);
    state.moving.preview = { newStart, newEnd, invalid };
    ui.showTips(newStart, newEnd);
  };
  var endMove = async () => {
    if (!state.moving) return;
    const { id, moved } = state.moving;
    const preview = state.moving.preview;
    state.moving = null;
    window.removeEventListener("mousemove", onMoveMove);
    window.removeEventListener("touchmove", onMoveMove);
    window.removeEventListener("mouseup", endMove);
    window.removeEventListener("touchend", endMove);
    ui.hideTips();
    if (!moved) return;
    if (!preview || preview.invalid) {
      ui.renderTimeline();
      if (preview == null ? void 0 : preview.invalid) ui.toast("Move would overlap another block.");
      return;
    }
    const idx = state.punches.findIndex((p) => p.id === id);
    state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
    await idb.put(state.punches[idx]);
    ui.renderAll();
  };
  var onWheel = (e) => {
    if (!state.overTrack) return;
    e.preventDefault();
    const rect = els.track.getBoundingClientRect();
    const view = getView3();
    const pointerX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, pointerX / Math.max(1, rect.width)));
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const delta2 = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      const panMin = delta2 * 0.03;
      let newStart2 = view.start + panMin;
      let newEnd2 = view.end + panMin;
      const span = view.minutes;
      if (newStart2 < 0) {
        newStart2 = 0;
        newEnd2 = span;
      } else if (newEnd2 > 24 * 60) {
        newEnd2 = 24 * 60;
        newStart2 = newEnd2 - span;
      }
      state.viewStartMin = Math.floor(newStart2);
      state.viewEndMin = Math.floor(newEnd2);
      ui.renderAll();
      return;
    }
    const delta = e.ctrlKey ? e.deltaY : e.deltaY;
    const factor = Math.exp(delta * 7e-4);
    const minSpan = 45;
    const maxSpan = 24 * 60;
    let newSpan = Math.min(maxSpan, Math.max(minSpan, Math.round(view.minutes * factor)));
    const anchorMin = view.start + pct * view.minutes;
    let newStart = Math.round(anchorMin - pct * newSpan);
    let newEnd = newStart + newSpan;
    if (newStart < 0) {
      newStart = 0;
      newEnd = newSpan;
    }
    if (newEnd > 24 * 60) {
      newEnd = 24 * 60;
      newStart = newEnd - newSpan;
    }
    state.viewStartMin = newStart;
    state.viewEndMin = newEnd;
    ui.renderAll();
  };
  var dragActions = {
    attach: () => {
      els.track.addEventListener("mousedown", startDrag);
      els.track.addEventListener("touchstart", startDrag, { passive: true });
      els.track.addEventListener("mousedown", startMove);
      els.track.addEventListener("touchstart", startMove, { passive: true });
      els.track.addEventListener("mouseenter", () => state.overTrack = true);
      els.track.addEventListener("mouseleave", () => state.overTrack = false);
      window.addEventListener("wheel", onWheel, { passive: false });
    }
  };

  // src/actions/resize.js
  var startResize = (e) => {
    const handle = e.target.closest(".handle");
    if (!handle) return;
    const punchEl = handle.closest(".punch");
    const id = Number(punchEl.dataset.id);
    const p = state.punches.find((x) => x.id === id);
    state.resizing = { id, edge: handle.dataset.edge, startStart: p.start, startEnd: p.end };
    if (handle.dataset.edge === "left") punchEl.classList.add("resizing-left");
    if (handle.dataset.edge === "right") punchEl.classList.add("resizing-right");
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("touchmove", onResizeMove, { passive: false });
    window.addEventListener("mouseup", endResize);
    window.addEventListener("touchend", endResize);
    e.stopPropagation();
  };
  var onResizeMove = (e) => {
    if (!state.resizing) return;
    if (e.cancelable) e.preventDefault();
    const { id, edge, startStart, startEnd } = state.resizing;
    const raw = e.touches ? pxToMinutes(e.touches[0].clientX) : pxToMinutes(e.clientX);
    const m = time.snap(raw);
    const bounds = nearestBounds(id);
    let newStart = startStart;
    let newEnd = startEnd;
    if (edge === "left") {
      const minL = bounds.leftLimitAt(startStart);
      const maxL = startEnd - 1;
      newStart = Math.min(maxL, Math.max(minL, m));
      newStart = time.snap(newStart);
    }
    if (edge === "right") {
      const minR = startStart + 1;
      const maxR = bounds.rightLimitAt(startEnd);
      newEnd = Math.max(minR, Math.min(maxR, m));
      newEnd = time.snap(newEnd);
    }
    const invalid = overlapsAny(newStart, newEnd, id) || newEnd <= newStart;
    const el = els.track.querySelector(`.punch[data-id="${id}"]`);
    const view = getView3();
    const leftPct = (Math.max(newStart, view.start) - view.start) / view.minutes * 100;
    const widthPctRaw = (Math.min(newEnd, view.end) - Math.max(newStart, view.start)) / view.minutes * 100;
    const widthPct = Math.max(0, widthPctRaw);
    el.style.left = leftPct + "%";
    el.style.width = widthPct + "%";
    el.classList.toggle("invalid", invalid);
    state.resizing.preview = { newStart, newEnd, invalid };
    ui.showTips(newStart, newEnd);
  };
  var endResize = async () => {
    if (!state.resizing) return;
    const { id } = state.resizing;
    const preview = state.resizing.preview;
    const punchEl = els.track.querySelector(`.punch[data-id="${id}"]`);
    if (punchEl) punchEl.classList.remove("resizing-left", "resizing-right");
    state.resizing = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("touchmove", onResizeMove);
    window.removeEventListener("mouseup", endResize);
    window.removeEventListener("touchend", endResize);
    ui.hideTips();
    if (!preview || preview.invalid) {
      ui.renderTimeline();
      if (preview == null ? void 0 : preview.invalid) ui.toast("Adjust would overlap another block.");
      return;
    }
    const idx = state.punches.findIndex((p) => p.id === id);
    state.punches[idx] = { ...state.punches[idx], start: preview.newStart, end: preview.newEnd };
    await idb.put(state.punches[idx]);
    ui.renderAll();
  };
  var resizeActions = {
    attach: () => {
      els.track.addEventListener("mousedown", startResize);
      els.track.addEventListener("touchstart", startResize, { passive: true });
    }
  };

  // src/actions/calendar.js
  var toggleCalendarView = () => {
    state.viewMode = state.viewMode === "calendar" ? "day" : "calendar";
    ui.updateViewMode();
  };
  var calendarActions = {
    attach: () => {
      if (els.btnCalendar) {
        els.btnCalendar.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      if (els.btnCalendar2) {
        els.btnCalendar2.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      if (els.dayLabel) {
        els.dayLabel.addEventListener("click", (e) => {
          e.preventDefault();
          if (state.viewMode !== "calendar") toggleCalendarView();
        });
        els.dayLabel.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (state.viewMode !== "calendar") toggleCalendarView();
          }
        });
      }
      if (els.btnCalendarFab) {
        els.btnCalendarFab.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        });
      }
      document.addEventListener("click", (e) => {
        var _a;
        const id = (_a = e.target) == null ? void 0 : _a.id;
        if (id === "btnCalendar" || id === "btnCalendar2" || id === "btnCalendarFab") {
          e.preventDefault();
          e.stopPropagation();
          toggleCalendarView();
        }
      });
      if (els.calPrev) {
        els.calPrev.addEventListener("click", () => {
          if (state.calendarMode === "days") {
            calendar.prevMonth();
          } else if (state.calendarMode === "months") {
            state.calendarYear -= 1;
            calendar.renderCalendar();
          } else {
            state.yearGridStart -= 12;
            calendar.renderCalendar();
          }
        });
      }
      if (els.calNext) {
        els.calNext.addEventListener("click", () => {
          if (state.calendarMode === "days") {
            calendar.nextMonth();
          } else if (state.calendarMode === "months") {
            state.calendarYear += 1;
            calendar.renderCalendar();
          } else {
            state.yearGridStart += 12;
            calendar.renderCalendar();
          }
        });
      }
      if (els.calMonthLabel) {
        els.calMonthLabel.addEventListener("click", (e) => {
          const t = e.target.closest("[data-cal-click]");
          if (t) {
            const what = t.dataset.calClick;
            if (what === "year") {
              state.calendarMode = "years";
              state.yearGridStart = Math.floor(state.calendarYear / 12) * 12;
              calendar.renderCalendar();
              ui.updateHelpText();
              return;
            } else if (what === "month") {
              state.calendarMode = "months";
              calendar.renderCalendar();
              ui.updateHelpText();
              return;
            }
          }
          const nav = e.target.closest("[data-cal-nav]");
          if (nav) {
            const dir = nav.dataset.calNav;
            const delta = dir === "prev" ? -1 : 1;
            if (state.calendarMode === "days") {
              if (delta === -1) calendar.prevMonth();
              else calendar.nextMonth();
            } else if (state.calendarMode === "months") {
              state.calendarYear += delta;
              calendar.renderCalendar();
            } else {
              state.yearGridStart += delta * 12;
              calendar.renderCalendar();
            }
          }
        });
      }
      window.addEventListener("calendar:daySelected", () => ui.updateViewMode());
      window.addEventListener("calendar:modeChanged", () => {
        var _a, _b;
        ui.updateHelpText();
        (_b = (_a = ui).renderBucketMonth) == null ? void 0 : _b.call(_a);
      });
      window.addEventListener("calendar:rendered", () => {
        var _a, _b;
        return (_b = (_a = ui).renderBucketMonth) == null ? void 0 : _b.call(_a);
      });
    }
  };

  // src/actions/settings.js
  function applyTheme(theme) {
    const t = theme === "light" ? "light" : "neon";
    try {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("tt.theme", t);
      if (els.themeSelect) els.themeSelect.value = t;
    } catch (e) {
    }
  }
  async function exportData() {
    var _a, _b, _c, _d, _e, _f;
    try {
      const punches = await idb.all();
      const buckets = await (((_b = (_a = idb).allBuckets) == null ? void 0 : _b.call(_a)) || Promise.resolve([]));
      const schedules = await (((_d = (_c = schedulesDb).allSchedules) == null ? void 0 : _d.call(_c)) || Promise.resolve([]));
      const scheduleViews = await (((_f = (_e = scheduleViewsDb).allScheduleViews) == null ? void 0 : _f.call(_e)) || Promise.resolve([]));
      const payload = {
        app: "timelinebar",
        kind: "time-tracker-backup",
        version: 3,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        count: punches.length,
        punches,
        buckets,
        schedules,
        scheduleViews
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `time-tracker-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      ui.toast("Exported data");
    } catch (err) {
      console.error(err);
      ui.toast("Export failed");
    }
  }
  function sanitizeItem(x, map = null, defaultScheduleId = null) {
    if (!x || typeof x !== "object") return null;
    const start = Math.max(0, Math.min(1440, Math.floor(Number(x.start)))) || 0;
    const end = Math.max(0, Math.min(1440, Math.floor(Number(x.end)))) || 0;
    if (end <= start) return null;
    const bucket = (x.bucket || x.caseNumber || "").toString().trim();
    const note = (x.note || "").toString();
    const date = (x.date || x.createdAt && String(x.createdAt).slice(0, 10) || todayStr()).toString();
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const createdAt = (x.createdAt || (/* @__PURE__ */ new Date()).toISOString()).toString();
    const st = x.status || null;
    const allowed = /* @__PURE__ */ new Set([null, "default", "green", "green-solid", "yellow", "yellow-solid", "red", "red-solid", "blue", "blue-solid", "purple", "purple-solid"]);
    const status = allowed.has(st) ? st : null;
    const recurrenceId = x.recurrenceId ? String(x.recurrenceId) : null;
    const seq = Number.isFinite(x.seq) ? Math.max(0, Math.floor(Number(x.seq))) : 0;
    let scheduleId = null;
    if (x.scheduleId != null && Number.isFinite(Number(x.scheduleId))) {
      const sid = Number(x.scheduleId);
      scheduleId = map && map.has(sid) ? Number(map.get(sid)) : defaultScheduleId != null ? Number(defaultScheduleId) : null;
    } else if (defaultScheduleId != null) {
      scheduleId = Number(defaultScheduleId);
    }
    const rec = (() => {
      const r = x.recurrence;
      if (!r || typeof r !== "object") return null;
      const f = ["daily", "weekly", "monthly", "yearly"].includes(r.freq) ? r.freq : "weekly";
      const interval = Math.max(1, Math.floor(Number(r.interval || 1)));
      const until = r.until && /^\d{4}-\d{2}-\d{2}$/.test(String(r.until)) ? String(r.until) : null;
      const count = r.count ? Math.max(1, Math.floor(Number(r.count))) : null;
      const out = { freq: f, interval };
      if (until) out.until = until;
      else if (count) out.count = count;
      return out;
    })();
    return {
      start,
      end,
      bucket,
      note,
      date: okDate ? date : todayStr(),
      createdAt,
      status,
      recurrenceId,
      recurrence: rec,
      seq,
      scheduleId
    };
  }
  async function importDataFromFile(file) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        ui.toast("Invalid JSON");
        return;
      }
      try {
        const { valid, errors } = validateBackup(Array.isArray(data) ? { punches: data, version: 2 } : data);
        if (!valid) console.warn("Backup validation warnings:", errors);
      } catch (e) {
      }
      let items = Array.isArray(data) ? data : Array.isArray(data == null ? void 0 : data.punches) ? data.punches : [];
      if (!Array.isArray(items) || items.length === 0) {
        ui.toast("No punches to import");
      }
      const existing = await (((_b = (_a = schedulesDb).allSchedules) == null ? void 0 : _b.call(_a)) || Promise.resolve([]));
      const existingByName = new Map((existing || []).map((s) => [String(s.name || "").toLowerCase(), Number(s.id)]));
      const map = /* @__PURE__ */ new Map();
      let schedCreated = 0;
      const importedSchedules = Array.isArray(data == null ? void 0 : data.schedules) ? data.schedules : [];
      if (importedSchedules.length) {
        for (const s of importedSchedules) {
          const rawName = String((s == null ? void 0 : s.name) || "").trim();
          if (!rawName) continue;
          try {
            assertSchedule({ name: rawName });
          } catch (e) {
            continue;
          }
          const key = rawName.toLowerCase();
          let newId = existingByName.get(key);
          if (newId == null) {
            try {
              await schedulesDb.addSchedule({ name: rawName });
              const latest = await schedulesDb.allSchedules();
              newId = Number((_c = latest[latest.length - 1]) == null ? void 0 : _c.id);
              existingByName.set(key, newId);
              schedCreated++;
            } catch (e) {
            }
          }
          if ((s == null ? void 0 : s.id) != null && newId != null) map.set(Number(s.id), Number(newId));
        }
      } else {
        const uniqueOldIds = new Set(
          (items || []).map((p) => p && p.scheduleId).filter((v) => v != null && Number.isFinite(Number(v))).map((v) => Number(v))
        );
        for (const oldId of uniqueOldIds) {
          const placeholder = `Imported #${oldId}`;
          const key = placeholder.toLowerCase();
          let newId = existingByName.get(key);
          if (newId == null) {
            try {
              await schedulesDb.addSchedule({ name: placeholder });
              const latest = await schedulesDb.allSchedules();
              newId = Number((_d = latest[latest.length - 1]) == null ? void 0 : _d.id);
              existingByName.set(key, newId);
              schedCreated++;
            } catch (e) {
            }
          }
          if (newId != null) map.set(Number(oldId), Number(newId));
        }
      }
      try {
        const importedViews = Array.isArray(data == null ? void 0 : data.scheduleViews) ? data.scheduleViews : [];
        if (importedViews.length) {
          for (const v of importedViews) {
            const name = String((v == null ? void 0 : v.name) || "").trim();
            const ids = Array.isArray(v == null ? void 0 : v.scheduleIds) ? v.scheduleIds.map(Number) : [];
            const mapped = ids.map((oldId) => map.has(oldId) ? Number(map.get(oldId)) : null).filter((x) => Number.isFinite(x));
            if (!name || !mapped.length) continue;
            try {
              await scheduleViewsDb.addScheduleView({ name, scheduleIds: mapped });
            } catch (e) {
            }
          }
        }
      } catch (e) {
      }
      const allSchedules2 = await schedulesDb.allSchedules();
      const defaultScheduleId = (_f = (_e = allSchedules2 == null ? void 0 : allSchedules2[0]) == null ? void 0 : _e.id) != null ? _f : null;
      const existingPunches = await idb.all();
      const makeKey = (p) => [p.date, p.start, p.end, p.bucket || "", p.note || "", p.scheduleId == null ? "" : p.scheduleId].join("|");
      const seen = new Set((existingPunches || []).map(makeKey));
      let added = 0;
      if (Array.isArray(items) && items.length) {
        for (const it of items) {
          const clean = sanitizeItem(it, map, defaultScheduleId);
          if (!clean) continue;
          const key = makeKey(clean);
          if (seen.has(key)) continue;
          await idb.add(clean);
          seen.add(key);
          added++;
        }
      }
      const bks = Array.isArray(data == null ? void 0 : data.buckets) ? data.buckets : [];
      let bAdded = 0;
      for (const b of bks) {
        const name = ((_g = b == null ? void 0 : b.name) != null ? _g : "").toString();
        const note = ((_h = b == null ? void 0 : b.note) != null ? _h : "").toString();
        if (name != null) {
          try {
            await idb.setBucketNote(name, note);
            bAdded++;
          } catch (e) {
          }
        }
      }
      state.punches = await idb.all();
      try {
        state.schedules = await schedulesDb.allSchedules();
      } catch (e) {
      }
      (_j = (_i = ui).renderScheduleSelect) == null ? void 0 : _j.call(_i);
      ui.renderAll();
      const parts = [];
      parts.push(`Imported ${added} entr${added === 1 ? "y" : "ies"}`);
      if (bAdded) parts.push(`${bAdded} bucket note${bAdded === 1 ? "" : "s"}`);
      if (schedCreated) parts.push(`${schedCreated} schedule${schedCreated === 1 ? "" : "s"} created`);
      ui.toast(parts.join(", "));
    } catch (err) {
      console.error(err);
      ui.toast("Import failed");
    }
  }
  async function eraseAll() {
    var _a, _b;
    if (!confirm("Erase ALL data and settings? This cannot be undone.")) return;
    try {
      await destroy();
      try {
        localStorage.removeItem("currentScheduleId");
      } catch (e) {
      }
      try {
        localStorage.removeItem("currentScheduleViewId");
      } catch (e) {
      }
      try {
        localStorage.removeItem("tt.theme");
      } catch (e) {
      }
      state.punches = [];
      state.schedules = [];
      state.scheduleViews = [];
      state.currentScheduleId = null;
      state.currentScheduleViewId = null;
      (_b = (_a = ui).renderScheduleSelect) == null ? void 0 : _b.call(_a);
      ui.renderAll();
      ui.toast("All data erased (database wiped)");
    } catch (err) {
      console.error(err);
      ui.toast("Erase failed");
    }
  }
  function openSettings() {
    if (els.settingsModal) els.settingsModal.style.display = "flex";
  }
  function closeSettings() {
    if (els.settingsModal) els.settingsModal.style.display = "none";
    try {
      if (els.settingsSchedNameWrap) els.settingsSchedNameWrap.style.display = "none";
    } catch (e) {
    }
    try {
      if (els.settingsViewNameWrap) els.settingsViewNameWrap.style.display = "none";
    } catch (e) {
    }
  }
  function attach() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
    try {
      const saved = localStorage.getItem("tt.theme") || "neon";
      applyTheme(saved);
    } catch (e) {
    }
    (_a = els.btnSettings) == null ? void 0 : _a.addEventListener("click", () => {
      try {
        renderSettingsSchedules();
      } catch (e) {
      }
      ;
      openSettings();
    });
    (_b = els.btnSettings) == null ? void 0 : _b.addEventListener("click", () => {
      try {
        renderSettingsViews();
      } catch (e) {
      }
    });
    (_c = els.settingsClose) == null ? void 0 : _c.addEventListener("click", closeSettings);
    (_d = els.settingsCancel) == null ? void 0 : _d.addEventListener("click", closeSettings);
    (_e = els.btnExport) == null ? void 0 : _e.addEventListener("click", exportData);
    (_f = els.lblBackup) == null ? void 0 : _f.addEventListener("click", exportData);
    (_g = els.btnImport) == null ? void 0 : _g.addEventListener("click", () => {
      var _a2;
      return (_a2 = els.importFile) == null ? void 0 : _a2.click();
    });
    (_h = els.lblRestore) == null ? void 0 : _h.addEventListener("click", () => {
      var _a2;
      return (_a2 = els.importFile) == null ? void 0 : _a2.click();
    });
    (_i = els.importFile) == null ? void 0 : _i.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importDataFromFile(file);
      e.target.value = "";
    });
    (_j = els.btnEraseAll) == null ? void 0 : _j.addEventListener("click", eraseAll);
    (_k = els.themeSelect) == null ? void 0 : _k.addEventListener("change", (e) => applyTheme(e.target.value));
    let schedRenameMode = false;
    function toggleSchedRename(on = false) {
      var _a2;
      try {
        schedRenameMode = !!on;
        if (els.settingsSchedNameWrap) els.settingsSchedNameWrap.style.display = on ? "" : "none";
        if (on) {
          const id = Number(((_a2 = els.settingsSchedList) == null ? void 0 : _a2.value) || "");
          const cur = (state.schedules || []).find((s) => Number(s.id) === id);
          if (cur && els.settingsSchedName) {
            els.settingsSchedName.value = cur.name || "";
            els.settingsSchedName.focus();
          }
        } else {
          if (els.settingsSchedName) els.settingsSchedName.value = "";
        }
      } catch (e) {
      }
    }
    function populateScheduleSelect(el, allowAll = false) {
      if (!el) return;
      el.innerHTML = "";
      const list = state.schedules || [];
      if (allowAll) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "All Schedules";
        el.appendChild(opt);
      }
      for (const s of list) {
        const opt = document.createElement("option");
        opt.value = String(s.id);
        opt.textContent = s.name || `Schedule ${s.id}`;
        el.appendChild(opt);
      }
    }
    function renderSettingsSchedules() {
      try {
        populateScheduleSelect(els.settingsSchedList, false);
        if (els.settingsSchedList && state.currentScheduleId != null) {
          els.settingsSchedList.value = String(state.currentScheduleId);
        }
      } catch (e) {
      }
    }
    renderSettingsSchedules();
    function renderViewSchedChecks(selectedIds = []) {
      try {
        const wrap = els.settingsViewSchedChecks;
        if (!wrap) return;
        wrap.innerHTML = "";
        const list = state.schedules || [];
        const set = new Set((selectedIds || []).map(Number));
        for (const s of list) {
          const id = String(s.id);
          const label = document.createElement("label");
          label.style.display = "inline-flex";
          label.style.alignItems = "center";
          label.style.gap = "6px";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.value = id;
          cb.checked = set.has(Number(id));
          const span = document.createElement("span");
          span.textContent = s.name || `Schedule ${s.id}`;
          label.append(cb, span);
          wrap.appendChild(label);
        }
      } catch (e) {
      }
    }
    function populateViewSelect() {
      if (!els.settingsViewList) return;
      els.settingsViewList.innerHTML = "";
      const views = (state.scheduleViews || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      for (const v of views) {
        const opt = document.createElement("option");
        opt.value = String(v.id);
        opt.textContent = v.name || `View ${v.id}`;
        els.settingsViewList.appendChild(opt);
      }
    }
    function renderSettingsViews() {
      var _a2;
      try {
        populateViewSelect();
        const selId = Number(((_a2 = els.settingsViewList) == null ? void 0 : _a2.value) || "");
        const cur = (state.scheduleViews || []).find((v) => Number(v.id) === selId) || null;
        if (els.settingsViewName) els.settingsViewName.value = (cur == null ? void 0 : cur.name) || "";
        renderViewSchedChecks((cur == null ? void 0 : cur.scheduleIds) || []);
      } catch (e) {
      }
    }
    renderSettingsViews();
    function setViewMsg(text) {
      try {
        if (els.settingsViewMsg) els.settingsViewMsg.textContent = text || "";
      } catch (e) {
      }
    }
    function readCheckedScheduleIds() {
      const wrap = els.settingsViewSchedChecks;
      if (!wrap) return [];
      return Array.from(wrap.querySelectorAll('input[type="checkbox"]')).filter((c) => c.checked).map((c) => Number(c.value));
    }
    function viewNameExists(raw, excludeId = null) {
      const name = String(raw || "").trim();
      return (state.scheduleViews || []).some((v) => v && String(v.name) === name && (excludeId == null || Number(v.id) !== Number(excludeId)));
    }
    (_l = els.settingsViewList) == null ? void 0 : _l.addEventListener("change", () => renderSettingsViews());
    let viewAddMode = false;
    let viewRenameMode = false;
    function toggleViewName(on = false, initial = "") {
      try {
        if (els.settingsViewNameWrap) els.settingsViewNameWrap.style.display = on ? "" : "none";
        if (on) {
          if (els.settingsViewName) {
            els.settingsViewName.value = initial || "";
            els.settingsViewName.focus();
          }
        } else {
          if (els.settingsViewName) els.settingsViewName.value = "";
        }
      } catch (e) {
      }
    }
    (_m = els.settingsAddView) == null ? void 0 : _m.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2, _e2;
      setViewMsg("");
      if (!viewAddMode) {
        viewAddMode = true;
        viewRenameMode = false;
        toggleViewName(true, "");
        setViewMsg("Enter a view name, then press Add again.");
        return;
      }
      const name = String(((_a2 = els.settingsViewName) == null ? void 0 : _a2.value) || "").trim();
      const ids = readCheckedScheduleIds();
      if (!name) {
        setViewMsg("Enter a view name.");
        return;
      }
      if (!ids.length) {
        setViewMsg("Select one or more schedules.");
        return;
      }
      if (viewNameExists(name)) {
        setViewMsg("Name already exists.");
        return;
      }
      try {
        assertScheduleView({ name, scheduleIds: ids });
      } catch (err) {
        console.error(err);
        setViewMsg("Invalid view.");
        return;
      }
      try {
        await scheduleViewsDb.addScheduleView({ name, scheduleIds: ids });
        state.scheduleViews = await (((_c2 = (_b2 = scheduleViewsDb).allScheduleViews) == null ? void 0 : _c2.call(_b2)) || Promise.resolve([]));
        populateViewSelect();
        setViewMsg("Added view.");
        (_e2 = (_d2 = ui).renderScheduleSelect) == null ? void 0 : _e2.call(_d2);
        viewAddMode = false;
        toggleViewName(false);
      } catch (err) {
        console.error(err);
        setViewMsg("Could not add view.");
      }
    });
    (_n = els.settingsRenameView) == null ? void 0 : _n.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      setViewMsg("");
      const id = Number(((_a2 = els.settingsViewList) == null ? void 0 : _a2.value) || "");
      const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
      if (!cur) {
        setViewMsg("Select a view to rename.");
        return;
      }
      if (!viewRenameMode) {
        viewRenameMode = true;
        viewAddMode = false;
        toggleViewName(true, cur.name || "");
        setViewMsg("Enter a new name, then press Rename again.");
        return;
      }
      const name = String(((_b2 = els.settingsViewName) == null ? void 0 : _b2.value) || "").trim();
      if (!name) {
        setViewMsg("Enter a new name.");
        return;
      }
      if (viewNameExists(name, id)) {
        setViewMsg("Name already exists.");
        return;
      }
      try {
        assertScheduleView({ name, scheduleIds: cur.scheduleIds || [] });
      } catch (err) {
        console.error(err);
        setViewMsg("Invalid view.");
        return;
      }
      try {
        await scheduleViewsDb.putScheduleView({ ...cur, name });
        state.scheduleViews = await (((_d2 = (_c2 = scheduleViewsDb).allScheduleViews) == null ? void 0 : _d2.call(_c2)) || Promise.resolve([]));
        populateViewSelect();
        if (els.settingsViewList) els.settingsViewList.value = String(id);
        setViewMsg("Renamed view.");
        (_f2 = (_e2 = ui).renderScheduleSelect) == null ? void 0 : _f2.call(_e2);
        viewRenameMode = false;
        toggleViewName(false);
      } catch (err) {
        console.error(err);
        setViewMsg("Could not rename view.");
      }
    });
    (_o = els.settingsDeleteView) == null ? void 0 : _o.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2, _e2;
      setViewMsg("");
      const id = Number(((_a2 = els.settingsViewList) == null ? void 0 : _a2.value) || "");
      const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
      if (!cur) {
        setViewMsg("Select a view to delete.");
        return;
      }
      if (!confirm(`Delete view "${cur.name || id}"?`)) return;
      try {
        await scheduleViewsDb.removeScheduleView(id);
        state.scheduleViews = await (((_c2 = (_b2 = scheduleViewsDb).allScheduleViews) == null ? void 0 : _c2.call(_b2)) || Promise.resolve([]));
        populateViewSelect();
        renderSettingsViews();
        if (Number(state.currentScheduleViewId) === id) {
          state.currentScheduleViewId = null;
          try {
            localStorage.removeItem("currentScheduleViewId");
          } catch (e) {
          }
          ui.renderAll();
        }
        setViewMsg("Deleted view.");
        (_e2 = (_d2 = ui).renderScheduleSelect) == null ? void 0 : _e2.call(_d2);
      } catch (err) {
        console.error(err);
        setViewMsg("Could not delete view.");
      }
    });
    (_p = els.settingsSaveView) == null ? void 0 : _p.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
      setViewMsg("");
      const id = Number(((_a2 = els.settingsViewList) == null ? void 0 : _a2.value) || "");
      const cur = (state.scheduleViews || []).find((v) => Number(v.id) === id);
      if (!cur) {
        setViewMsg("Select a view to save.");
        return;
      }
      const ids = readCheckedScheduleIds();
      if (!ids.length) {
        setViewMsg("Select one or more schedules.");
        return;
      }
      try {
        assertScheduleView({ name: cur.name || "", scheduleIds: ids });
      } catch (err) {
        console.error(err);
        setViewMsg("Invalid view.");
        return;
      }
      try {
        await scheduleViewsDb.putScheduleView({ ...cur, scheduleIds: ids });
        state.scheduleViews = await (((_c2 = (_b2 = scheduleViewsDb).allScheduleViews) == null ? void 0 : _c2.call(_b2)) || Promise.resolve([]));
        setViewMsg("Saved view.");
        (_e2 = (_d2 = ui).renderScheduleSelect) == null ? void 0 : _e2.call(_d2);
        (_g2 = (_f2 = ui).renderAll) == null ? void 0 : _g2.call(_f2);
      } catch (err) {
        console.error(err);
        setViewMsg("Could not save view.");
      }
    });
    try {
      renderSettingsViews();
    } catch (e) {
    }
    function showMsg(text) {
      try {
        if (els.settingsSchedMsg) {
          els.settingsSchedMsg.textContent = text || "";
        }
      } catch (e) {
      }
    }
    function hideDeleteConfirm() {
      try {
        if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = "none";
      } catch (e) {
      }
    }
    function showDeleteConfirm(text) {
      try {
        if (els.settingsDeleteConfirm) els.settingsDeleteConfirm.style.display = "";
        if (els.settingsDeleteConfirmText) els.settingsDeleteConfirmText.textContent = text || "Confirm delete?";
      } catch (e) {
      }
    }
    function nameExists(raw, excludeId = null) {
      const name = String(raw || "").trim();
      return (state.schedules || []).some((s) => s && String(s.name) === name && (excludeId == null || Number(s.id) !== Number(excludeId)));
    }
    (_q = els.settingsRenameSched) == null ? void 0 : _q.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2;
      hideDeleteConfirm();
      const id = Number(((_a2 = els.settingsSchedList) == null ? void 0 : _a2.value) || "");
      const cur = (state.schedules || []).find((s) => Number(s.id) === id);
      if (!cur) {
        showMsg("Select a schedule to rename.");
        return;
      }
      if (!schedRenameMode) {
        toggleSchedRename(true);
        showMsg("Enter a new name, then press Rename again.");
        return;
      }
      const raw = String(((_b2 = els.settingsSchedName) == null ? void 0 : _b2.value) || "").trim();
      if (!raw) {
        showMsg("Enter a new name to rename.");
        return;
      }
      try {
        assertSchedule({ name: raw });
      } catch (err) {
        console.error(err);
        showMsg("Invalid name. Please enter 1\u2013200 characters.");
        return;
      }
      if (nameExists(raw, id)) {
        const err = new Error("ConstraintError: schedule name must be unique");
        err.name = "ConstraintError";
        console.error(err);
        showMsg("Name already exists. Choose a different name.");
        return;
      }
      try {
        await schedulesDb.putSchedule({ ...cur, name: raw });
      } catch (err) {
        console.error(err);
        showMsg("Could not rename: " + ((err == null ? void 0 : err.message) || "Database error"));
        return;
      }
      state.schedules = await schedulesDb.allSchedules();
      (_d2 = (_c2 = ui).renderScheduleSelect) == null ? void 0 : _d2.call(_c2);
      renderSettingsSchedules();
      showMsg("Renamed schedule.");
      toggleSchedRename(false);
    });
    (_r = els.settingsDeleteSched) == null ? void 0 : _r.addEventListener("click", async () => {
      var _a2, _b2, _c2;
      hideDeleteConfirm();
      const id = Number(((_a2 = els.settingsSchedList) == null ? void 0 : _a2.value) || "");
      const list = state.schedules || [];
      const cur = list.find((s) => Number(s.id) === id);
      if (!cur) {
        showMsg("Select a schedule to delete.");
        return;
      }
      if (list.length <= 1) {
        showMsg("Cannot delete the only schedule.");
        return;
      }
      const used = state.punches.some((p) => Number(p.scheduleId) === id);
      if (used) {
        showMsg("Schedule has entries. Move or delete entries first.");
        return;
      }
      showDeleteConfirm(`Delete schedule "${(cur == null ? void 0 : cur.name) || id}"?`);
      const onYes = async () => {
        var _a3, _b3, _c3, _d2, _e2, _f2, _g2;
        try {
          await schedulesDb.removeSchedule(id);
          state.schedules = await schedulesDb.allSchedules();
          if (Number(state.currentScheduleId) === id) {
            state.currentScheduleId = (_b3 = (_a3 = state.schedules[0]) == null ? void 0 : _a3.id) != null ? _b3 : null;
            try {
              localStorage.setItem("currentScheduleId", String((_c3 = state.currentScheduleId) != null ? _c3 : ""));
            } catch (e) {
            }
          }
          (_e2 = (_d2 = ui).renderScheduleSelect) == null ? void 0 : _e2.call(_d2);
          renderSettingsSchedules();
          ui.renderAll();
          showMsg("Deleted schedule.");
        } finally {
          hideDeleteConfirm();
          try {
            (_f2 = els.settingsDeleteYes) == null ? void 0 : _f2.removeEventListener("click", onYes);
          } catch (e) {
          }
          try {
            (_g2 = els.settingsDeleteNo) == null ? void 0 : _g2.removeEventListener("click", onNo);
          } catch (e) {
          }
        }
      };
      const onNo = () => {
        var _a3, _b3;
        hideDeleteConfirm();
        try {
          (_a3 = els.settingsDeleteYes) == null ? void 0 : _a3.removeEventListener("click", onYes);
        } catch (e) {
        }
        try {
          (_b3 = els.settingsDeleteNo) == null ? void 0 : _b3.removeEventListener("click", onNo);
        } catch (e) {
        }
      };
      (_b2 = els.settingsDeleteYes) == null ? void 0 : _b2.addEventListener("click", onYes);
      (_c2 = els.settingsDeleteNo) == null ? void 0 : _c2.addEventListener("click", onNo);
    });
  }
  var settingsActions = { attach };

  // src/copy.js
  function currentDay2() {
    return state.currentDate;
  }
  function getDayPunches() {
    const day = currentDay2();
    return [...state.punches].filter((p) => getPunchDate(p) === day).sort((a, b) => a.start - b.start);
  }
  function getView4() {
    const s = Math.max(0, Math.min(24 * 60, Number(state.viewStartMin)));
    const e = Math.max(0, Math.min(24 * 60, Number(state.viewEndMin)));
    const start = Math.min(s, e);
    const end = Math.max(s, e);
    const minutes = Math.max(1, end - start);
    return { start, end, minutes };
  }
  function statusColor(status) {
    const st = status || "default";
    switch (st) {
      case "green":
      case "green-solid":
        return "#00cc66";
      case "yellow":
      case "yellow-solid":
        return "#f5d90a";
      case "red":
      case "red-solid":
        return "#ff4d4f";
      case "blue":
      case "blue-solid":
        return "#0ea5ff";
      case "purple":
      case "purple-solid":
        return "#a259ff";
      default:
        return "#16a34a";
    }
  }
  function drawTimelineCanvas(widthHint = 0, heightHint = 0) {
    var _a;
    const view = getView4();
    const rect = ((_a = els.track) == null ? void 0 : _a.getBoundingClientRect()) || { width: 0, height: 0 };
    const width = Math.max(600, Math.floor(widthHint || rect.width || 1024));
    const height = Math.max(140, Math.floor(heightHint || rect.height || 160));
    const padTop = 24;
    const padBottom = 24;
    const padLeft = 8;
    const padRight = 8;
    const chartX = padLeft;
    const chartY = padTop;
    const chartW = Math.max(1, width - padLeft - padRight);
    const chartH = Math.max(1, height - padTop - padBottom);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0b1422";
    ctx.fillRect(0, 0, width, height);
    try {
      const d = parseDate(currentDay2());
      const lab = d ? d.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";
      if (lab) {
        ctx.fillStyle = "#c7d2fe";
        ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillText(lab, padLeft, 16);
      }
    } catch (e) {
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const firstHour = Math.ceil(view.start / 60);
    const lastHour = Math.floor(view.end / 60);
    for (let h = firstHour; h <= lastHour; h++) {
      const m = h * 60;
      const pct = (m - view.start) / view.minutes;
      const x = chartX + pct * chartW;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, chartY);
      ctx.lineTo(x + 0.5, chartY + chartH);
      ctx.stroke();
      const ampm = h >= 12 ? "pm" : "am";
      const hh = h % 12 === 0 ? 12 : h % 12;
      const label = `${hh}${ampm}`;
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, Math.max(chartX, Math.min(x - tw / 2, chartX + chartW - tw)), chartY + chartH + 14);
    }
    ctx.restore();
    const punches = getDayPunches();
    for (const p of punches) {
      const startClamped = Math.max(p.start, view.start);
      const endClamped = Math.min(p.end, view.end);
      if (endClamped <= startClamped) continue;
      const left = chartX + (startClamped - view.start) / view.minutes * chartW;
      const w = (endClamped - startClamped) / view.minutes * chartW;
      const h = Math.max(10, Math.min(28, Math.floor(chartH * 0.7)));
      const y = chartY + (chartH - h) / 2;
      ctx.fillStyle = statusColor(p.status);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(left + r, y);
      ctx.lineTo(left + w - r, y);
      ctx.quadraticCurveTo(left + w, y, left + w, y + r);
      ctx.lineTo(left + w, y + h - r);
      ctx.quadraticCurveTo(left + w, y + h, left + w - r, y + h);
      ctx.lineTo(left + r, y + h);
      ctx.quadraticCurveTo(left, y + h, left, y + h - r);
      ctx.lineTo(left, y + r);
      ctx.quadraticCurveTo(left, y, left + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const label = (p.bucket || "").trim();
      if (label) {
        ctx.save();
        ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillStyle = "#0b1422";
        const tw = ctx.measureText(label).width;
        if (tw + 12 < w) ctx.fillText(label, left + 6, y + h / 2 + 4);
        ctx.restore();
      }
    }
    return canvas;
  }
  function generateTsv() {
    const rows = getDayPunches();
    const header = ["Start", "Stop", "Duration", "Bucket", "Note"];
    const lines = [header.join("	")];
    for (const p of rows) {
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      const cells = [
        time.toLabel(p.start),
        time.toLabel(p.end),
        time.durationLabel(dur),
        (p.bucket || "").replace(/[\t\n]/g, " "),
        (p.note || "").replace(/[\t\n]/g, " ")
      ];
      lines.push(cells.join("	"));
    }
    return lines.join("\n");
  }
  function generateHtmlTable() {
    const rows = getDayPunches();
    const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
    const th = "<tr><th>Start</th><th>Stop</th><th>Duration</th><th>Bucket</th><th>Note</th></tr>";
    const trs = rows.map((p) => {
      const dur = Math.max(0, (p.end || 0) - (p.start || 0));
      return `<tr><td>${esc(time.toLabel(p.start))}</td><td>${esc(time.toLabel(p.end))}</td><td>${esc(time.durationLabel(dur))}</td><td>${esc(p.bucket || "")}</td><td>${esc(p.note || "")}</td></tr>`;
    });
    return `<table>${th}${trs.join("")}</table>`;
  }
  async function writeClipboard({ includeImage = true } = {}) {
    const tsv = generateTsv();
    const html = generateHtmlTable();
    const types = {};
    try {
      types["text/plain"] = new Blob([tsv], { type: "text/plain" });
    } catch (e) {
    }
    try {
      types["text/html"] = new Blob([html], { type: "text/html" });
    } catch (e) {
    }
    let canvas;
    if (includeImage) {
      try {
        canvas = drawTimelineCanvas();
      } catch (e) {
      }
    }
    if (canvas && navigator.clipboard && window.ClipboardItem) {
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (pngBlob) types["image/png"] = pngBlob;
    }
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const item = new window.ClipboardItem(types);
        await navigator.clipboard.write([item]);
        return "rich";
      } catch (e) {
      }
    }
    try {
      await navigator.clipboard.writeText(tsv);
      return "text";
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = tsv;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.pointerEvents = "none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand && document.execCommand("copy");
        document.body.removeChild(ta);
        return ok ? "text" : "fail";
      } catch (e2) {
        return "fail";
      }
    }
  }
  async function copyChart() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rows = getDayPunches();
    if (!rows.length) {
      (_b = (_a = ui).toast) == null ? void 0 : _b.call(_a, "Nothing to copy");
      return;
    }
    const mode = await writeClipboard({ includeImage: true });
    if (mode === "rich") (_d = (_c = ui).toast) == null ? void 0 : _d.call(_c, "Copied chart + table to clipboard");
    else if (mode === "text") (_f = (_e = ui).toast) == null ? void 0 : _f.call(_e, "Copied table (TSV) to clipboard");
    else (_h = (_g = ui).toast) == null ? void 0 : _h.call(_g, "Copy failed");
  }
  var copyActions = { copyChart };
  async function copyText(text) {
    var _a;
    const s = String(text || "");
    try {
      if ((_a = navigator.clipboard) == null ? void 0 : _a.writeText) {
        await navigator.clipboard.writeText(s);
        return true;
      }
    } catch (e) {
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = s;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
    }
    return false;
  }

  // src/actions/index.js
  var escapeHtml2 = (s) => (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
  var mdToHtml = (text) => {
    const t = String(text || "");
    if (!t.trim()) return "";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        const raw = window.marked.parse(t);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") return window.DOMPurify.sanitize(raw);
        return raw;
      }
    } catch (e) {
    }
    return escapeHtml2(t).replace(/\n/g, "<br>");
  };
  async function loadBucketNoteIntoEditor(name) {
    try {
      const key = String(name || "").trim();
      if (!els.bucketNoteField) return;
      let text = "";
      try {
        const rec = await idb.getBucket(key);
        text = rec && rec.note || "";
      } catch (e) {
      }
      try {
        const host = document.getElementById("modalBucketNoteEditor");
        const q = host && host.__quill ? host.__quill : null;
        if (q && q.root) {
          const html = mdToHtml(text || "");
          try {
            q.setContents([]);
          } catch (e) {
          }
          try {
            q.clipboard.dangerouslyPasteHTML(html || "");
          } catch (e) {
            q.root.innerHTML = html || "";
          }
        } else {
          els.bucketNoteField.value = text;
        }
      } catch (e) {
        els.bucketNoteField.value = text;
      }
      try {
        els.bucketNoteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.bucketNoteField.scrollHeight || 72));
        els.bucketNoteField.style.height = h + "px";
        if (els.bucketNotePreview && els.bucketNotePreview.style.display !== "none") {
          els.bucketNotePreview.innerHTML = mdToHtml(text);
        }
      } catch (e) {
      }
    } catch (e) {
    }
  }
  function genRecurrenceId() {
    return "r" + Math.random().toString(36).slice(2, 10);
  }
  function readRecurrenceFromUI() {
    var _a, _b, _c, _d;
    const enabled = !!((_a = els.repeatEnabled) == null ? void 0 : _a.checked);
    if (!enabled) return null;
    const freq = ((_b = els.repeatFreq) == null ? void 0 : _b.value) || "weekly";
    const until = String(((_c = els.repeatUntil) == null ? void 0 : _c.value) || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return null;
    const base = { freq, interval: 1, until };
    if (freq === "weekly") {
      const days = Array.from(((_d = els.repeatDow) == null ? void 0 : _d.querySelectorAll('input[type="checkbox"]')) || []).filter((c) => c.checked).map((c) => Number(c.value));
      if (days.length) base.byWeekday = days;
    }
    return base;
  }
  function overlapsOnDate(dateStr, start, end, excludeId = null, scheduleId = null) {
    const sched = scheduleId != null ? Number(scheduleId) : state.currentScheduleId == null ? null : Number(state.currentScheduleId);
    return state.punches.some(
      (p) => p.id !== excludeId && getPunchDate(p) === dateStr && (sched == null || Number(p.scheduleId) === sched) && start < (p.end || 0) && end > (p.start || 0)
    );
  }
  async function splitPunchAtClick(e, punchEl) {
    var _a, _b;
    try {
      const id = Number((_a = punchEl == null ? void 0 : punchEl.dataset) == null ? void 0 : _a.id);
      if (!id) return;
      const p = state.punches.find((x) => x.id === id);
      if (!p) return;
      const clientX = e.touches ? (_b = e.touches[0]) == null ? void 0 : _b.clientX : e.clientX;
      const rawMin = pxToMinutes(clientX);
      const lower = Math.floor(rawMin / SNAP_MIN) * SNAP_MIN;
      const upper = Math.ceil(rawMin / SNAP_MIN) * SNAP_MIN;
      const candidates = [];
      if (lower > p.start && lower < p.end) candidates.push(lower);
      if (upper !== lower && upper > p.start && upper < p.end) candidates.push(upper);
      if (!candidates.length) {
        ui.toast("Block too short to split at 15m");
        return;
      }
      const chosen = candidates.length === 1 ? candidates[0] : Math.abs(candidates[0] - rawMin) <= Math.abs(candidates[1] - rawMin) ? candidates[0] : candidates[1];
      const base = { bucket: p.bucket, note: p.note, status: p.status || null, date: p.date || getPunchDate(p), scheduleId: p.scheduleId };
      const left = { ...base, start: p.start, end: chosen, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      const right = { ...base, start: chosen, end: p.end, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      await idb.remove(p.id);
      await idb.add(left);
      await idb.add(right);
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast(`Split at ${time.toLabel(chosen)}`);
    } catch (err) {
      try {
        console.error("splitPunchAtClick error", err);
      } catch (e2) {
      }
    }
  }
  function fillScheduleDatalist() {
    try {
      if (!els.scheduleList) return;
      const list = els.scheduleList;
      list.innerHTML = "";
      for (const s of state.schedules || []) {
        const opt = document.createElement("option");
        opt.value = String(s.name || `Schedule ${s.id}`);
        list.appendChild(opt);
      }
    } catch (e) {
    }
  }
  async function ensureScheduleByName(rawName) {
    const name = String(rawName || "").trim();
    if (!name) return null;
    const list = state.schedules || [];
    const found = list.find((s) => String(s.name || "").toLowerCase() === name.toLowerCase());
    if (found) return Number(found.id);
    try {
      await schedulesDb.addSchedule({ name });
    } catch (e) {
    }
    try {
      state.schedules = await schedulesDb.allSchedules();
    } catch (e) {
    }
    const again = (state.schedules || []).find((s) => String(s.name || "").toLowerCase() === name.toLowerCase());
    return again ? Number(again.id) : null;
  }
  var saveNewFromModal = async (e) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    e.preventDefault();
    if (!state.pendingRange) return;
    const { startMin, endMin } = state.pendingRange;
    const s = time.snap(startMin);
    const eMin = time.snap(endMin);
    if (eMin - s < 1) {
      ui.closeModal();
      return;
    }
    const typedSched = String(((_a = els.scheduleField) == null ? void 0 : _a.value) || "").trim();
    let scheduleId = null;
    if (typedSched) {
      scheduleId = await ensureScheduleByName(typedSched);
    }
    const payload = {
      start: s,
      end: eMin,
      bucket: els.bucketField.value.trim(),
      note: (() => {
        var _a2;
        try {
          const host = document.getElementById("modalNoteEditor");
          const q = host && host.__quill ? host.__quill : null;
          if (q && q.root) return String(q.root.innerHTML || "");
        } catch (e2) {
        }
        return (((_a2 = els.noteField) == null ? void 0 : _a2.value) || "").trim();
      })(),
      date: state.currentDate || todayStr(),
      scheduleId: scheduleId != null ? scheduleId : state.currentScheduleId != null ? state.currentScheduleId : (_d = (_c = (_b = state.schedules) == null ? void 0 : _b[0]) == null ? void 0 : _c.id) != null ? _d : null,
      status: (() => {
        var _a2;
        const val = ((_a2 = els.modalStatusBtn) == null ? void 0 : _a2.dataset.value) || "default";
        return val === "default" ? null : val;
      })()
    };
    try {
      const bname = payload.bucket;
      let bnote = "";
      try {
        const host = document.getElementById("modalBucketNoteEditor");
        const qb = host && host.__quill ? host.__quill : null;
        if (qb && qb.root) bnote = String(qb.root.innerHTML || "");
        else bnote = String(((_e = els.bucketNoteField) == null ? void 0 : _e.value) || "").trim();
      } catch (e2) {
        bnote = String(((_f = els.bucketNoteField) == null ? void 0 : _f.value) || "").trim();
      }
      if (bname != null) await idb.setBucketNote(bname, bnote);
    } catch (e2) {
    }
    const rec = readRecurrenceFromUI();
    if (((_g = els.repeatEnabled) == null ? void 0 : _g.checked) && !rec) {
      ui.toast("Pick an end date for the series");
      return;
    }
    if (state.editingId) {
      const idx = state.punches.findIndex((p) => p.id === state.editingId);
      if (idx === -1) {
        ui.toast("Could not find item to update.");
        ui.closeModal();
        return;
      }
      const prev = state.punches[idx];
      const targetScheduleId = payload.scheduleId != null ? payload.scheduleId : prev.scheduleId;
      const updated = { ...prev, ...payload, scheduleId: targetScheduleId };
      const applyToSeries = !!((_h = els.applyScopeSeries) == null ? void 0 : _h.checked) && !!prev.recurrenceId;
      if (applyToSeries) {
        const deltaStart = updated.start - prev.start;
        const deltaEnd = updated.end - prev.end;
        const targetId = prev.recurrenceId;
        const toUpdate = state.punches.filter((p) => p.recurrenceId === targetId);
        for (const p of toUpdate) {
          const newStart = p.start + deltaStart;
          const newEnd = p.end + deltaEnd;
          const schedId = targetScheduleId != null ? targetScheduleId : p.scheduleId;
          if (overlapsOnDate(p.date || getPunchDate(p), newStart, newEnd, p.id, schedId)) {
            ui.toast("Change would overlap another block in the series.");
            return;
          }
        }
        for (const p of toUpdate) {
          const upd = { ...p, start: p.start + deltaStart, end: p.end + deltaEnd, bucket: updated.bucket, note: updated.note, status: updated.status, scheduleId: targetScheduleId };
          await idb.put(upd);
        }
      } else {
        if (overlapsOnDate(updated.date, updated.start, updated.end, updated.id, updated.scheduleId)) {
          ui.toast("That range overlaps another block.");
          return;
        }
        if (!prev.recurrenceId && rec) {
          const recurrenceId = genRecurrenceId();
          const dates = expandDates(updated.date, rec);
          let seq = 0;
          for (const d of dates) {
            const start = updated.start;
            const end = updated.end;
            if (overlapsOnDate(d, start, end, prev.id, prev.scheduleId)) continue;
            const base = { start, end, bucket: updated.bucket, note: updated.note, status: updated.status, date: d, recurrenceId, recurrence: rec, seq, scheduleId: updated.scheduleId };
            if (d === prev.date) {
              await idb.put({ ...prev, ...base });
            } else {
              await idb.add({ ...base, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
            }
            seq++;
          }
        } else {
          state.punches[idx] = updated;
          await idb.put(updated);
        }
      }
    } else {
      if (rec) {
        const recurrenceId = genRecurrenceId();
        const dates = expandDates(payload.date, rec);
        let added = 0;
        let skipped = 0;
        let seq = 0;
        for (const d of dates) {
          if (overlapsOnDate(d, payload.start, payload.end, null, payload.scheduleId)) {
            skipped++;
            continue;
          }
          const item = { ...payload, date: d, recurrenceId, recurrence: rec, seq, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
          await idb.add(item);
          added++;
          seq++;
        }
        if (skipped) ui.toast(`Created ${added}, skipped ${skipped} overlapping`);
      } else {
        if (overlapsOnDate(payload.date, payload.start, payload.end, null, payload.scheduleId)) {
          ui.toast("That range overlaps another block.");
          return;
        }
        const toAdd = { ...payload, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
        await idb.add(toAdd);
      }
    }
    state.punches = await idb.all();
    try {
      state.schedules = await schedulesDb.allSchedules();
      (_j = (_i = ui).renderScheduleSelect) == null ? void 0 : _j.call(_i);
    } catch (e2) {
    }
    state.editingId = null;
    ui.closeModal();
    ui.renderAll();
  };
  var datePopover = null;
  function hideDatePicker() {
    try {
      if (datePopover) datePopover.remove();
    } catch (e) {
    }
    datePopover = null;
    window.removeEventListener("resize", hideDatePicker);
    window.removeEventListener("scroll", hideDatePicker, true);
    document.removeEventListener("keydown", onDateKey);
  }
  function onDateKey(e) {
    if (e.key === "Escape") hideDatePicker();
  }
  function buildMonthGridLocal(year, monthIndex) {
    const first = new Date(year, monthIndex, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }
  function showDatePicker(anchor, inputEl) {
    if (!anchor || !inputEl) return;
    const existing = datePopover;
    if (existing && existing._for === inputEl) {
      hideDatePicker();
      return;
    }
    hideDatePicker();
    const today = todayStr();
    const selStr = String(inputEl.value || "").trim();
    const sel = parseDate(selStr) || /* @__PURE__ */ new Date();
    let y = sel.getFullYear();
    let m = sel.getMonth();
    const pop = document.createElement("div");
    pop.className = "date-popover";
    pop._for = inputEl;
    const render = () => {
      pop.innerHTML = "";
      const header = document.createElement("div");
      header.className = "date-header";
      const title = document.createElement("div");
      title.className = "date-title";
      title.textContent = new Date(y, m, 1).toLocaleString(void 0, { month: "long", year: "numeric" });
      const nav = document.createElement("div");
      nav.className = "date-nav";
      const prev = document.createElement("button");
      prev.className = "date-btn";
      prev.textContent = "\u2039";
      prev.title = "Previous month";
      const next = document.createElement("button");
      next.className = "date-btn";
      next.textContent = "\u203A";
      next.title = "Next month";
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        m -= 1;
        if (m < 0) {
          m = 11;
          y -= 1;
        }
        render();
      });
      next.addEventListener("click", (e) => {
        e.preventDefault();
        m += 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
        render();
      });
      nav.append(prev, next);
      header.append(title, nav);
      pop.appendChild(header);
      const grid = document.createElement("div");
      grid.className = "date-grid";
      const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (const w of wd) {
        const el = document.createElement("div");
        el.className = "date-wd";
        el.textContent = w;
        grid.appendChild(el);
      }
      const days = buildMonthGridLocal(y, m);
      for (const d of days) {
        const ds = toDateStr(d);
        const cell = document.createElement("div");
        cell.className = "date-day";
        if (d.getMonth() !== m) cell.classList.add("other");
        if (ds === today) cell.classList.add("today");
        if (selStr && ds === selStr) cell.classList.add("selected");
        cell.textContent = String(d.getDate());
        cell.addEventListener("click", () => {
          inputEl.value = ds;
          try {
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e) {
          }
          try {
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          } catch (e) {
          }
          hideDatePicker();
        });
        grid.appendChild(cell);
      }
      pop.appendChild(grid);
    };
    document.body.appendChild(pop);
    render();
    const rect = anchor.getBoundingClientRect();
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const pr = pop.getBoundingClientRect();
    let left = Math.min(rect.left, vw - pr.width - 6);
    let top = rect.bottom + 6;
    if (top + pr.height + 6 > vh) top = Math.max(6, rect.top - pr.height - 6);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    datePopover = pop;
    window.addEventListener("resize", hideDatePicker);
    window.addEventListener("scroll", hideDatePicker, true);
    document.addEventListener("keydown", onDateKey);
  }
  var closeModal2 = () => {
    hideDatePicker();
    ui.closeModal();
  };
  var attachEvents = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q;
    dragActions.attach();
    resizeActions.attach();
    calendarActions.attach();
    settingsActions.attach();
    try {
      (_a = els.scheduleSelect) == null ? void 0 : _a.addEventListener("change", (e) => {
        const raw = String(e.target.value || "");
        if (raw.startsWith("view:")) {
          const id = Number(raw.slice(5));
          if (!Number.isNaN(id)) {
            state.currentScheduleViewId = id;
            state.currentScheduleId = null;
            try {
              localStorage.setItem("currentScheduleViewId", String(id));
            } catch (e2) {
            }
            try {
              localStorage.removeItem("currentScheduleId");
            } catch (e2) {
            }
            ui.renderAll();
            return;
          }
        }
        if (raw === "") {
          state.currentScheduleViewId = null;
          state.currentScheduleId = null;
          try {
            localStorage.removeItem("currentScheduleViewId");
          } catch (e2) {
          }
          try {
            localStorage.setItem("currentScheduleId", "");
          } catch (e2) {
          }
          ui.renderAll();
          return;
        }
        const val = Number(raw);
        if (!Number.isNaN(val)) {
          state.currentScheduleViewId = null;
          state.currentScheduleId = val;
          try {
            localStorage.removeItem("currentScheduleViewId");
          } catch (e2) {
          }
          try {
            localStorage.setItem("currentScheduleId", String(val));
          } catch (e2) {
          }
          ui.renderAll();
        }
      });
      (_b = els.btnAddSchedule) == null ? void 0 : _b.addEventListener("click", async () => {
        var _a2, _b2, _c2, _d2, _e2;
        try {
          const raw = prompt("New schedule name");
          const name = String(raw || "").trim();
          if (!name) return;
          try {
            assertSchedule({ name });
          } catch (err) {
            ui.toast("Invalid name (1\u2013200 chars)");
            return;
          }
          const exists = (state.schedules || []).some((s) => String((s == null ? void 0 : s.name) || "") === name);
          if (exists) {
            ui.toast("Name already exists");
            return;
          }
          await schedulesDb.addSchedule({ name });
          state.schedules = await schedulesDb.allSchedules();
          state.currentScheduleId = (_b2 = (_a2 = state.schedules[state.schedules.length - 1]) == null ? void 0 : _a2.id) != null ? _b2 : state.currentScheduleId;
          try {
            localStorage.setItem("currentScheduleId", String((_c2 = state.currentScheduleId) != null ? _c2 : ""));
          } catch (e) {
          }
          (_e2 = (_d2 = ui).renderScheduleSelect) == null ? void 0 : _e2.call(_d2);
          ui.renderAll();
          ui.toast("Added schedule");
        } catch (e) {
        }
      });
      (_c = els.btnRenameSchedule) == null ? void 0 : _c.addEventListener("click", () => {
        var _a2;
        try {
          (_a2 = els.btnSettings) == null ? void 0 : _a2.click();
        } catch (e) {
        }
        try {
          const curId = state.currentScheduleId;
          const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
          if (cur && els.settingsSchedList) els.settingsSchedList.value = String(cur.id);
        } catch (e) {
        }
      });
      (_d = els.btnDeleteSchedule) == null ? void 0 : _d.addEventListener("click", () => {
        var _a2;
        try {
          (_a2 = els.btnSettings) == null ? void 0 : _a2.click();
        } catch (e) {
        }
        try {
          const curId = state.currentScheduleId;
          const cur = (state.schedules || []).find((s) => Number(s.id) === Number(curId));
          if (cur && els.settingsSchedList) els.settingsSchedList.value = String(cur.id);
          if (cur && els.settingsDeleteConfirm) {
            els.settingsDeleteConfirm.style.display = "";
          }
          if (cur && els.settingsDeleteConfirmText) els.settingsDeleteConfirmText.textContent = `Delete schedule "${cur.name || cur.id}"?`;
        } catch (e) {
        }
      });
    } catch (e) {
    }
    try {
      const card = els.entriesCard;
      const btn = els.entriesToggle;
      if (card && btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const collapsed = card.classList.toggle("collapsed");
          try {
            btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          } catch (e2) {
          }
        });
      }
    } catch (e) {
    }
    try {
      const card = els.bucketDayCard;
      const btn = els.bucketDayToggle;
      if (card && btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const collapsed = card.classList.toggle("collapsed");
          try {
            btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
          } catch (e2) {
          }
        });
      }
    } catch (e) {
    }
    els.rows.addEventListener("click", async (e) => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      const btn = e.target.closest(".status-btn");
      if (btn) {
        const wrap = btn.closest(".status-wrap");
        els.rows.querySelectorAll(".status-wrap.open").forEach((w) => {
          if (w !== wrap) w.classList.remove("open");
        });
        const willOpen = !wrap.classList.contains("open");
        wrap.classList.toggle("open");
        wrap.classList.remove("up");
        if (willOpen) {
          const menu = wrap.querySelector(".status-menu");
          if (menu) {
            const prev = menu.style.display;
            if (!wrap.classList.contains("open")) menu.style.display = "grid";
            const menuRect = menu.getBoundingClientRect();
            const wrapRect = wrap.getBoundingClientRect();
            const tableCard = document.querySelector(".table-card");
            const cardRect = tableCard ? tableCard.getBoundingClientRect() : { bottom: window.innerHeight };
            const spaceBelow = cardRect.bottom - wrapRect.bottom;
            const needed = menuRect.height + 12;
            if (spaceBelow < needed) wrap.classList.add("up");
            menu.style.display = prev;
          }
        }
        e.stopPropagation();
        return;
      }
      const opt = e.target.closest(".status-option");
      if (opt) {
        const tr = e.target.closest("tr[data-id]");
        const id = Number(tr == null ? void 0 : tr.dataset.id);
        if (!id) return;
        const value = opt.dataset.value;
        const idx = state.punches.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const updated = { ...state.punches[idx] };
          updated.status = value === "default" ? null : value;
          state.punches[idx] = updated;
          await idb.put(updated);
          ui.renderAll();
        }
        return;
      }
      const delBtn = e.target.closest(".row-action.delete");
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
      const copyCell = e.target.closest("td.copy-cell");
      if (copyCell) {
        const text = (copyCell.textContent || "").trim();
        try {
          await copyText(text);
          (_b2 = (_a2 = ui).toast) == null ? void 0 : _b2.call(_a2, "Copied to clipboard");
        } catch (e2) {
        }
        e.stopPropagation();
        return;
      }
      const noteCell = e.target.closest("td.note");
      if (noteCell) {
        const tr = noteCell.closest("tr[data-id]");
        const id = Number(tr == null ? void 0 : tr.dataset.id);
        if (id) {
          (_d2 = (_c2 = ui).openNoteModal) == null ? void 0 : _d2.call(_c2, id);
          e.stopPropagation();
          return;
        }
      }
      const editBtn = e.target.closest(".row-action.edit");
      const row = e.target.closest("tr");
      const td = e.target.closest("td");
      const allowRowOpen = !!row && td && !td.classList.contains("copy-cell") && !td.classList.contains("note") && !td.classList.contains("status-cell") && !td.classList.contains("table-actions");
      if (editBtn || allowRowOpen) {
        const id = Number((editBtn == null ? void 0 : editBtn.dataset.id) || (row == null ? void 0 : row.dataset.id));
        if (!id) return;
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        try {
          (_f2 = (_e2 = ui).ensureEditQuills) == null ? void 0 : _f2.call(_e2);
        } catch (e2) {
        }
        try {
          const host = document.getElementById("modalNoteEditor");
          const q = host && host.__quill ? host.__quill : null;
          if (q && q.root) {
            const html = mdToHtml(String(p.note || ""));
            try {
              q.setContents([]);
            } catch (e2) {
            }
            try {
              q.clipboard.dangerouslyPasteHTML(html || "");
            } catch (e2) {
              q.root.innerHTML = html || "";
            }
          }
        } catch (e2) {
        }
        try {
          fillScheduleDatalist();
        } catch (e2) {
        }
        try {
          const cur = (state.schedules || []).find((s) => Number(s.id) === Number(p.scheduleId));
          if (els.scheduleField) els.scheduleField.value = (cur == null ? void 0 : cur.name) || "";
        } catch (e2) {
        }
        try {
          await loadBucketNoteIntoEditor(els.bucketField.value);
        } catch (e2) {
        }
        try {
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.applyScopeOne) els.applyScopeOne.checked = !els.applyScopeSeries.checked;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
        } catch (e2) {
        }
        try {
          if (els.notePreview) {
            els.notePreview.style.display = "none";
            els.notePreview.innerHTML = "";
          }
          if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
          if (els.noteField) {
            els.noteField.style.height = "auto";
            const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
            els.noteField.style.height = h + "px";
          }
        } catch (e2) {
        }
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
    });
    els.track.addEventListener("click", async (e) => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      if (e.shiftKey) {
        const handle = e.target.closest(".handle");
        const ctrl = e.target.closest(".control-btn");
        const punchEl = e.target.closest(".punch");
        if (!handle && !ctrl && punchEl) {
          await splitPunchAtClick(e, punchEl);
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          e.stopPropagation();
          return;
        }
      }
      const lbl = e.target.closest(".punch-label");
      if (lbl) {
        const id = Number(lbl.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        try {
          (_b2 = (_a2 = ui).ensureEditQuills) == null ? void 0 : _b2.call(_a2);
        } catch (e2) {
        }
        try {
          const host = document.getElementById("modalNoteEditor");
          const q = host && host.__quill ? host.__quill : null;
          if (q && q.root) {
            const html = mdToHtml(String(p.note || ""));
            try {
              q.setContents([]);
            } catch (e2) {
            }
            try {
              q.clipboard.dangerouslyPasteHTML(html || "");
            } catch (e2) {
              q.root.innerHTML = html || "";
            }
          }
        } catch (e2) {
        }
        try {
          fillScheduleDatalist();
        } catch (e2) {
        }
        try {
          const cur = (state.schedules || []).find((s) => Number(s.id) === Number(p.scheduleId));
          if (els.scheduleField) els.scheduleField.value = (cur == null ? void 0 : cur.name) || "";
        } catch (e2) {
        }
        try {
          await loadBucketNoteIntoEditor(els.bucketField.value);
        } catch (e2) {
        }
        try {
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
        } catch (e2) {
        }
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        return;
      }
      const editBtn = e.target.closest(".control-btn.edit");
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        try {
          (_d2 = (_c2 = ui).ensureEditQuills) == null ? void 0 : _d2.call(_c2);
        } catch (e2) {
        }
        try {
          const host = document.getElementById("modalNoteEditor");
          const q = host && host.__quill ? host.__quill : null;
          if (q && q.root) {
            const html = mdToHtml(String(p.note || ""));
            try {
              q.setContents([]);
            } catch (e2) {
            }
            try {
              q.clipboard.dangerouslyPasteHTML(html || "");
            } catch (e2) {
              q.root.innerHTML = html || "";
            }
          }
        } catch (e2) {
        }
        try {
          await loadBucketNoteIntoEditor(els.bucketField.value);
        } catch (e2) {
        }
        try {
          const hasRec = !!p.recurrenceId;
          if (els.repeatEnabled) els.repeatEnabled.checked = hasRec;
          if (els.repeatFields) els.repeatFields.style.display = hasRec ? "" : "none";
          if (hasRec && p.recurrence) {
            if (els.repeatFreq) els.repeatFreq.value = p.recurrence.freq || "weekly";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
            if (els.repeatUntil) els.repeatUntil.value = p.recurrence.until || "";
            const showDow = (p.recurrence.freq || "weekly") === "weekly";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = showDow ? "" : "none";
            if (showDow && els.repeatDow) {
              const set = new Set(Array.isArray(p.recurrence.byWeekday) ? p.recurrence.byWeekday.map(Number) : []);
              const wd = new Date(p.date).getDay();
              els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                c.checked = set.size ? set.has(Number(c.value)) : Number(c.value) === wd;
              });
            }
          } else {
            if (els.repeatUntil) els.repeatUntil.value = "";
            if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "none";
            if (els.repeatDowWrap) els.repeatDowWrap.style.display = "none";
          }
          if (els.applyScopeWrap) els.applyScopeWrap.style.display = hasRec ? "" : "none";
          if (els.repeatEnabled) els.repeatEnabled.disabled = hasRec;
          if (els.repeatFreq) els.repeatFreq.disabled = hasRec;
          if (els.repeatUntil) els.repeatUntil.disabled = hasRec;
          if (els.repeatDow) els.repeatDow.querySelectorAll("input").forEach((c) => c.disabled = hasRec);
          if (els.applyScopeSeries) els.applyScopeSeries.checked = true;
          if (els.extendWrap) els.extendWrap.style.display = hasRec ? "" : "none";
        } catch (e2) {
        }
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
      const delBtn = e.target.closest(".control-btn.delete");
      if (delBtn) {
        const id = Number(delBtn.dataset.id);
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
      const popEdit = e.target.closest(".label-popper .control-btn.edit");
      if (popEdit) {
        const pop = e.target.closest(".label-popper");
        const id = Number(pop.dataset.id);
        const p = state.punches.find((px) => px.id === id);
        if (!p) return;
        state.editingId = id;
        state.pendingRange = { startMin: p.start, endMin: p.end };
        els.startField.value = time.toLabel(p.start);
        els.endField.value = time.toLabel(p.end);
        els.bucketField.value = p.bucket || "";
        els.noteField.value = p.note || "";
        try {
          (_f2 = (_e2 = ui).ensureEditQuills) == null ? void 0 : _f2.call(_e2);
        } catch (e2) {
        }
        try {
          const host = document.getElementById("modalNoteEditor");
          const q = host && host.__quill ? host.__quill : null;
          if (q && q.root) {
            const html = mdToHtml(String(p.note || ""));
            try {
              q.setContents([]);
            } catch (e2) {
            }
            try {
              q.clipboard.dangerouslyPasteHTML(html || "");
            } catch (e2) {
              q.root.innerHTML = html || "";
            }
          }
        } catch (e2) {
        }
        try {
          await loadBucketNoteIntoEditor(els.bucketField.value);
        } catch (e2) {
        }
        if (els.modalStatusBtn) {
          const st = p.status || "default";
          els.modalStatusBtn.dataset.value = st;
          els.modalStatusBtn.className = `status-btn status-${st}`;
        }
        if (els.modalStatusWrap) els.modalStatusWrap.classList.remove("open");
        if (els.modalDelete) els.modalDelete.style.display = "";
        if (els.modalTitle) els.modalTitle.textContent = "Edit Time Block";
        els.modal.style.display = "flex";
        els.bucketField.focus();
        return;
      }
      const popDel = e.target.closest(".label-popper .control-btn.delete");
      if (popDel) {
        const pop = e.target.closest(".label-popper");
        const id = Number(pop.dataset.id);
        const force = !!e.shiftKey;
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(id);
        state.punches = await idb.all();
        ui.renderAll();
        ui.toast("Deleted");
        return;
      }
    });
    els.modalForm.addEventListener("submit", saveNewFromModal);
    els.modalCancel.addEventListener("click", closeModal2);
    els.modalClose.addEventListener("click", closeModal2);
    try {
      const combo = els.scheduleCombo;
      const input = els.scheduleField;
      const toggle = els.scheduleToggle;
      const menu = els.scheduleMenu;
      const closeMenu = () => {
        try {
          combo == null ? void 0 : combo.classList.remove("open");
        } catch (e) {
        }
        ;
      };
      const openMenu = () => {
        try {
          if (menu) {
            menu.innerHTML = "";
            for (const s of state.schedules || []) {
              const name = String(s.name || `Schedule ${s.id}`);
              const item = document.createElement("div");
              item.className = "dropdown-item";
              item.textContent = name;
              item.dataset.value = name;
              menu.appendChild(item);
            }
          }
          combo == null ? void 0 : combo.classList.add("open");
        } catch (e) {
        }
      };
      toggle == null ? void 0 : toggle.addEventListener("click", (e) => {
        e.preventDefault();
        combo == null ? void 0 : combo.classList.toggle("open");
        if (combo == null ? void 0 : combo.classList.contains("open")) openMenu();
      });
      input == null ? void 0 : input.addEventListener("focus", () => openMenu());
      input == null ? void 0 : input.addEventListener("input", () => {
        var _a2;
        const q = String(input.value || "").toLowerCase();
        try {
          (_a2 = menu == null ? void 0 : menu.querySelectorAll(".dropdown-item")) == null ? void 0 : _a2.forEach((it) => {
            const visible = !q || String(it.dataset.value || "").toLowerCase().includes(q);
            it.style.display = visible ? "" : "none";
          });
          combo == null ? void 0 : combo.classList.add("open");
        } catch (e) {
        }
      });
      menu == null ? void 0 : menu.addEventListener("click", (e) => {
        const it = e.target.closest(".dropdown-item");
        if (!it) return;
        try {
          input.value = String(it.dataset.value || "");
        } catch (e2) {
        }
        closeMenu();
        try {
          input.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e2) {
        }
      });
      document.addEventListener("click", (e) => {
        if (!combo) return;
        if (e.target === input || e.target === toggle || e.target.closest("#scheduleCombo")) return;
        closeMenu();
      });
    } catch (e) {
    }
    const coerceRange = () => {
      var _a2, _b2;
      try {
        const sText = String(((_a2 = els.startField) == null ? void 0 : _a2.value) || "");
        const eText = String(((_b2 = els.endField) == null ? void 0 : _b2.value) || "");
        const sMin = time.parse(sText);
        const eMin = time.parse(eText);
        if (sMin == null || eMin == null) return;
        let a = time.snap(sMin);
        let b = time.snap(eMin);
        if (b <= a) b = Math.min(24 * 60, a + Math.max(1, SNAP_MIN));
        state.pendingRange = { startMin: a, endMin: b };
        try {
          els.startField.value = time.toLabel(a);
        } catch (e) {
        }
        try {
          els.endField.value = time.toLabel(b);
        } catch (e) {
        }
      } catch (e) {
      }
    };
    (_e = els.startField) == null ? void 0 : _e.addEventListener("change", coerceRange);
    (_f = els.endField) == null ? void 0 : _f.addEventListener("change", coerceRange);
    (_g = els.startField) == null ? void 0 : _g.addEventListener("blur", coerceRange);
    (_h = els.endField) == null ? void 0 : _h.addEventListener("blur", coerceRange);
    (_i = els.repeatEnabled) == null ? void 0 : _i.addEventListener("change", () => {
      var _a2;
      const on = !!els.repeatEnabled.checked;
      if (els.repeatFields) els.repeatFields.style.display = on ? "" : "none";
      if (!on) return;
      if (els.repeatUntilWrap) els.repeatUntilWrap.style.display = "";
      const isWeekly = (((_a2 = els.repeatFreq) == null ? void 0 : _a2.value) || "weekly") === "weekly";
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = isWeekly ? "" : "none";
    });
    (_j = els.repeatFreq) == null ? void 0 : _j.addEventListener("change", () => {
      var _a2;
      const val = els.repeatFreq.value;
      if (els.repeatDowWrap) els.repeatDowWrap.style.display = val === "weekly" && ((_a2 = els.repeatEnabled) == null ? void 0 : _a2.checked) ? "" : "none";
    });
    (_k = els.btnDowWeekdays) == null ? void 0 : _k.addEventListener("click", () => {
      if (!els.repeatDow) return;
      const set = /* @__PURE__ */ new Set([1, 2, 3, 4, 5]);
      els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = set.has(Number(c.value)));
    });
    (_l = els.btnDowAll) == null ? void 0 : _l.addEventListener("click", () => {
      if (!els.repeatDow) return;
      els.repeatDow.querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = true);
    });
    (_m = els.modalDelete) == null ? void 0 : _m.addEventListener("click", async (e) => {
      var _a2;
      if (!state.editingId) return;
      const p = state.punches.find((x) => x.id === state.editingId);
      if (!p) return;
      const applySeries = !!((_a2 = els.applyScopeSeries) == null ? void 0 : _a2.checked) && !!p.recurrenceId;
      const force = !!e.shiftKey;
      if (applySeries) {
        if (!force && !confirm("Delete the entire series?")) return;
        const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
        for (const it of items) await idb.remove(it.id);
      } else {
        if (!force && !confirm("Delete this time entry?")) return;
        await idb.remove(state.editingId);
      }
      state.punches = await idb.all();
      state.editingId = null;
      ui.closeModal();
      ui.renderAll();
      ui.toast("Deleted");
    });
    (_n = els.btnExtendSeries) == null ? void 0 : _n.addEventListener("click", async () => {
      var _a2;
      if (!state.editingId) return;
      const p = state.punches.find((x) => x.id === state.editingId);
      if (!(p == null ? void 0 : p.recurrenceId) || !p.recurrence) return;
      const items = state.punches.filter((x) => x.recurrenceId === p.recurrenceId);
      if (!items.length) return;
      const last = items.reduce((a, b) => String(a.date) > String(b.date) ? a : b);
      const startExt = (() => {
        const d = new Date(last.date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
      })();
      const untilStr = String(((_a2 = els.extendUntil) == null ? void 0 : _a2.value) || "");
      const rule = { ...p.recurrence };
      if (untilStr) {
        rule.until = untilStr;
        delete rule.count;
      } else {
        ui.toast("Pick an extend-until date");
        return;
      }
      const dates = expandDates(startExt, rule);
      let seq = items.reduce((m, it) => Math.max(m, Number(it.seq) || 0), 0) + 1;
      let added = 0;
      for (const d of dates) {
        if (state.punches.some((x) => x.recurrenceId === p.recurrenceId && x.date === d)) continue;
        if (overlapsOnDate(d, p.start, p.end)) continue;
        await idb.add({ start: p.start, end: p.end, bucket: p.bucket, note: p.note, status: p.status || null, date: d, recurrenceId: p.recurrenceId, recurrence: p.recurrence, seq, createdAt: (/* @__PURE__ */ new Date()).toISOString(), scheduleId: p.scheduleId });
        seq++;
        added++;
      }
      state.punches = await idb.all();
      ui.renderAll();
      ui.toast(added ? `Added ${added} more` : "No new dates to add");
    });
    (_o = els.modalStatusBtn) == null ? void 0 : _o.addEventListener("click", () => {
      var _a2;
      (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.toggle("open");
    });
    (_p = els.modalStatusMenu) == null ? void 0 : _p.addEventListener("click", (e) => {
      var _a2;
      const opt = e.target.closest(".status-option");
      if (!opt) return;
      const val = opt.dataset.value;
      if (!val) return;
      if (els.modalStatusBtn) {
        els.modalStatusBtn.dataset.value = val;
        els.modalStatusBtn.className = `status-btn status-${val}`;
      }
      (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.remove("open");
    });
    window.addEventListener("keydown", (e) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
      if (e.key !== "Escape") return;
      let mainModalOpen = false;
      try {
        mainModalOpen = !!(els.modal && getComputedStyle(els.modal).display !== "none");
      } catch (e2) {
      }
      if (mainModalOpen) {
        closeModal2();
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (e2) {
        }
        return;
      }
      let noteModalOpen = false;
      try {
        noteModalOpen = !!(els.noteModal && getComputedStyle(els.noteModal).display !== "none");
      } catch (e2) {
      }
      if (noteModalOpen) {
        (_b2 = (_a2 = ui).closeNoteModal) == null ? void 0 : _b2.call(_a2);
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (e2) {
        }
        return;
      }
      let settingsOpen = false;
      try {
        settingsOpen = !!(els.settingsModal && getComputedStyle(els.settingsModal).display !== "none");
      } catch (e2) {
      }
      if (settingsOpen) {
        try {
          els.settingsModal.style.display = "none";
          e.preventDefault();
          e.stopPropagation();
        } catch (e2) {
        }
        return;
      }
      try {
        const ae = document.activeElement;
        const tn = (ae && ae.tagName ? ae.tagName : "").toLowerCase();
        const isEditable = !!(ae && (ae.isContentEditable || tn === "input" || tn === "textarea" || tn === "select"));
        if (isEditable) return;
      } catch (e2) {
      }
      try {
        hideDatePicker();
      } catch (e2) {
      }
      try {
        (_d2 = (_c2 = els.rows) == null ? void 0 : _c2.querySelectorAll(".status-wrap.open")) == null ? void 0 : _d2.forEach((w) => w.classList.remove("open"));
        (_e2 = els.modalStatusWrap) == null ? void 0 : _e2.classList.remove("open");
      } catch (e2) {
      }
      (_g2 = (_f2 = ui).hideNotePopover) == null ? void 0 : _g2.call(_f2);
      if (state.viewMode !== "calendar") {
        state.viewMode = "calendar";
        ui.updateViewMode();
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (e2) {
        }
      }
    });
    window.addEventListener("resize", () => ui.renderAll());
    window.addEventListener("click", (e) => {
      var _a2, _b2, _c2;
      if (!e.target.closest(".status-wrap")) {
        els.rows.querySelectorAll(".status-wrap.open").forEach((w) => w.classList.remove("open"));
        (_a2 = els.modalStatusWrap) == null ? void 0 : _a2.classList.remove("open");
      }
      if (!e.target.closest(".note-popover") && !e.target.closest(".note-dot") && !e.target.closest("td.note")) {
        (_c2 = (_b2 = ui).hideNotePopover) == null ? void 0 : _c2.call(_b2);
      }
    });
    (_q = els.bucketDayBody) == null ? void 0 : _q.addEventListener("click", (e) => {
      var _a2, _b2;
      const link = e.target.closest(".bucket-link");
      if (!link) return;
      e.preventDefault();
      const tr = link.closest("tr");
      const name = String((_b2 = (_a2 = tr == null ? void 0 : tr.dataset) == null ? void 0 : _a2.bucket) != null ? _b2 : "");
      state.lastViewMode = state.viewMode;
      state.bucketFilter = name;
      state.viewMode = "bucket";
      ui.renderAll();
    });
    (_r = els.bucketMonthBody) == null ? void 0 : _r.addEventListener("click", (e) => {
      var _a2, _b2;
      const link = e.target.closest(".bucket-link");
      if (!link) return;
      e.preventDefault();
      const tr = link.closest("tr");
      const name = String((_b2 = (_a2 = tr == null ? void 0 : tr.dataset) == null ? void 0 : _a2.bucket) != null ? _b2 : "");
      state.lastViewMode = state.viewMode;
      state.bucketFilter = name;
      state.viewMode = "bucket";
      ui.renderAll();
    });
    (_s = els.btnBucketBack) == null ? void 0 : _s.addEventListener("click", () => {
      state.viewMode = "calendar";
      ui.renderAll();
    });
    (_t = els.btnBucketBackTop) == null ? void 0 : _t.addEventListener("click", () => {
      state.viewMode = "calendar";
      ui.renderAll();
    });
    (_u = els.btnBucketDelete) == null ? void 0 : _u.addEventListener("click", async () => {
      const name = String(state.bucketFilter || "");
      const label = name || "(no bucket)";
      const sched = state.currentScheduleId == null ? null : Number(state.currentScheduleId);
      if (sched == null) {
        alert("Select a specific schedule to delete a bucket.");
        return;
      }
      const items = state.punches.filter((p) => String(p.bucket || "").trim() === name && Number(p.scheduleId) === sched);
      if (!items.length) {
        ui.toast("No entries for this bucket.");
        return;
      }
      if (!confirm(`Delete all ${items.length} entries for bucket "${label}"?`)) return;
      for (const p of items) {
        await idb.remove(p.id);
      }
      state.punches = await idb.all();
      state.viewMode = state.lastViewMode || "day";
      ui.renderAll();
      ui.toast("Bucket deleted");
    });
    els.track.addEventListener("mouseover", (e) => {
      const punch = e.target.closest(".punch");
      if (!punch) return;
      punch.classList.add("is-hovered");
      const id = Number(punch.dataset.id);
      if (!id) return;
      const row = els.rows.querySelector(`tr[data-id="${id}"]`);
      if (row) row.classList.add("is-hovered");
    });
    els.track.addEventListener("mouseout", (e) => {
      const punch = e.target.closest(".punch");
      if (!punch) return;
      punch.classList.remove("is-hovered");
      const id = Number(punch.dataset.id);
      if (!id) return;
      const row = els.rows.querySelector(`tr[data-id="${id}"]`);
      if (row) row.classList.remove("is-hovered");
    });
    els.rows.addEventListener("mouseover", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      row.classList.add("is-hovered");
      const id = Number(row.dataset.id);
      if (!id) return;
      const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (punch) punch.classList.add("is-hovered");
    });
    els.rows.addEventListener("mouseout", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      row.classList.remove("is-hovered");
      const id = Number(row.dataset.id);
      if (!id) return;
      const punch = els.track.querySelector(`.punch[data-id="${id}"]`);
      if (punch) punch.classList.remove("is-hovered");
    });
    const setView = (start, end) => {
      const s = Math.max(0, Math.min(24 * 60, Math.floor(start)));
      const e = Math.max(0, Math.min(24 * 60, Math.floor(end)));
      state.viewStartMin = Math.min(s, e);
      state.viewEndMin = Math.max(s, e);
      ui.renderAll();
    };
    const totalMin = 24 * 60;
    const minSpan = 45;
    const getSpan = () => Math.max(1, Math.abs((state.viewEndMin | 0) - (state.viewStartMin | 0)));
    const getStart = () => Math.min(state.viewStartMin | 0, state.viewEndMin | 0);
    const clampStartForSpan = (start, span) => Math.max(0, Math.min(totalMin - span, start));
    const minutesFromScrollbar = (clientX) => {
      const rect = els.mobileScrollbar.getBoundingClientRect();
      const x = Math.min(Math.max(0, clientX - rect.left), Math.max(1, rect.width));
      return Math.round(x / Math.max(1, rect.width) * totalMin);
    };
    const onScrollbarDown = (e) => {
      if (!els.mobileScrollbar) return;
      if (e.target === els.mobileWindow || e.target.closest("#mobileWindow")) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const span = getSpan();
      const m = minutesFromScrollbar(clientX);
      let start = clampStartForSpan(Math.round(m - span / 2), span);
      setView(start, start + span);
      if (e.cancelable) e.preventDefault();
    };
    let dragWin = null;
    const onWindowDown = (e) => {
      if (!els.mobileScrollbar || !els.mobileWindow) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = els.mobileScrollbar.getBoundingClientRect();
      const span = getSpan();
      const start = getStart();
      const leftPx = start / totalMin * rect.width;
      const x = clientX - rect.left;
      dragWin = { offsetPx: x - leftPx, rectW: Math.max(1, rect.width), span };
      window.addEventListener("mousemove", onWindowMove);
      window.addEventListener("touchmove", onWindowMove, { passive: false });
      window.addEventListener("mouseup", onWindowUp);
      window.addEventListener("touchend", onWindowUp);
      if (e.cancelable) e.preventDefault();
    };
    const onWindowMove = (e) => {
      if (!dragWin || !els.mobileScrollbar) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = els.mobileScrollbar.getBoundingClientRect();
      let startPx = clientX - rect.left - dragWin.offsetPx;
      const maxStartPx = rect.width - dragWin.span / totalMin * rect.width;
      startPx = Math.max(0, Math.min(maxStartPx, startPx));
      const startMin = Math.round(startPx / Math.max(1, rect.width) * totalMin);
      setView(startMin, startMin + dragWin.span);
    };
    const onWindowUp = () => {
      dragWin = null;
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("touchmove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
      window.removeEventListener("touchend", onWindowUp);
    };
    (_v = els.mobileScrollbar) == null ? void 0 : _v.addEventListener("mousedown", onScrollbarDown);
    (_w = els.mobileScrollbar) == null ? void 0 : _w.addEventListener("touchstart", onScrollbarDown, { passive: false });
    (_x = els.mobileWindow) == null ? void 0 : _x.addEventListener("mousedown", onWindowDown);
    (_y = els.mobileWindow) == null ? void 0 : _y.addEventListener("touchstart", onWindowDown, { passive: false });
    const zoomBy = (factor) => {
      const span = getSpan();
      const center = getStart() + span / 2;
      const newSpan = Math.min(totalMin, Math.max(minSpan, Math.round(span * factor)));
      let newStart = Math.round(center - newSpan / 2);
      newStart = clampStartForSpan(newStart, newSpan);
      setView(newStart, newStart + newSpan);
    };
    (_z = els.mobileZoomIn) == null ? void 0 : _z.addEventListener("click", () => zoomBy(0.8));
    (_A = els.mobileZoomOut) == null ? void 0 : _A.addEventListener("click", () => zoomBy(1.25));
    (_B = els.mobileZoomRange) == null ? void 0 : _B.addEventListener("input", (e) => {
      const val = Math.max(minSpan, Math.min(totalMin, Math.round(Number(e.target.value) || getSpan())));
      const center = getStart() + getSpan() / 2;
      let newStart = Math.round(center - val / 2);
      newStart = clampStartForSpan(newStart, val);
      setView(newStart, newStart + val);
    });
    (_C = els.view24) == null ? void 0 : _C.addEventListener("click", () => setView(0, 24 * 60));
    (_D = els.viewDefault) == null ? void 0 : _D.addEventListener("click", () => setView(6 * 60, 18 * 60));
    const doCopy = async () => {
      try {
        await copyActions.copyChart();
      } catch (e) {
      }
    };
    (_E = els.btnCopyChart) == null ? void 0 : _E.addEventListener("click", doCopy);
    (_F = els.btnCopyChartTop) == null ? void 0 : _F.addEventListener("click", doCopy);
    (_G = els.btnCopyChartTable) == null ? void 0 : _G.addEventListener("click", doCopy);
    els.track.addEventListener("click", (e) => {
      var _a2, _b2, _c2, _d2;
      if (e.shiftKey) {
        return;
      }
      if (e.target.closest(".handle") || e.target.closest(".control-btn")) {
        return;
      }
      if (e.target.closest(".punch-label")) {
        return;
      }
      const dot = e.target.closest(".note-dot");
      if (dot) {
        const id = Number(dot.dataset.id);
        if (id) (_b2 = (_a2 = ui).openNoteModal) == null ? void 0 : _b2.call(_a2, id);
        e.stopPropagation();
        return;
      }
      const punch = e.target.closest(".punch");
      if (punch) {
        const id = Number(punch.dataset.id);
        if (!id) return;
        (_d2 = (_c2 = ui).openNoteModal) == null ? void 0 : _d2.call(_c2, id);
        e.stopPropagation();
      }
    });
    (_H = els.bucketViewBody) == null ? void 0 : _H.addEventListener("click", (e) => {
      var _a2, _b2, _c2;
      const noteCell = e.target.closest("td.note");
      if (!noteCell) return;
      const tr = noteCell.closest("tr");
      const id = Number((_a2 = tr == null ? void 0 : tr.dataset) == null ? void 0 : _a2.id);
      if (id) {
        (_c2 = (_b2 = ui).openNoteModal) == null ? void 0 : _c2.call(_b2, id);
        e.stopPropagation();
      }
    });
    (_I = els.noteField) == null ? void 0 : _I.addEventListener("input", () => {
      try {
        els.noteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.noteField.scrollHeight || 72));
        els.noteField.style.height = h + "px";
        if (els.notePreview && els.notePreview.style.display !== "none") {
          els.notePreview.innerHTML = mdToHtml(els.noteField.value);
        }
      } catch (e) {
      }
    });
    (_J = els.notePreviewToggle) == null ? void 0 : _J.addEventListener("click", (e) => {
      var _a2;
      e.preventDefault();
      if (!els.notePreview) return;
      const showing = els.notePreview.style.display !== "none";
      if (showing) {
        els.notePreview.style.display = "none";
        els.notePreview.innerHTML = "";
        if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Preview";
      } else {
        els.notePreview.innerHTML = mdToHtml(((_a2 = els.noteField) == null ? void 0 : _a2.value) || "");
        els.notePreview.style.display = "";
        if (els.notePreviewToggle) els.notePreviewToggle.textContent = "Hide preview";
      }
    });
    (_K = els.bucketNoteField) == null ? void 0 : _K.addEventListener("input", () => {
      try {
        els.bucketNoteField.style.height = "auto";
        const h = Math.max(72, Math.min(320, els.bucketNoteField.scrollHeight || 72));
        els.bucketNoteField.style.height = h + "px";
        if (els.bucketNotePreview && els.bucketNotePreview.style.display !== "none") {
          els.bucketNotePreview.innerHTML = mdToHtml(els.bucketNoteField.value);
        }
      } catch (e) {
      }
    });
    (_L = els.bucketNotePreviewToggle) == null ? void 0 : _L.addEventListener("click", (e) => {
      var _a2;
      e.preventDefault();
      if (!els.bucketNotePreview) return;
      const showing = els.bucketNotePreview.style.display !== "none";
      if (showing) {
        els.bucketNotePreview.style.display = "none";
        els.bucketNotePreview.innerHTML = "";
        if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = "Preview";
      } else {
        els.bucketNotePreview.innerHTML = mdToHtml(((_a2 = els.bucketNoteField) == null ? void 0 : _a2.value) || "");
        els.bucketNotePreview.style.display = "";
        if (els.bucketNotePreviewToggle) els.bucketNotePreviewToggle.textContent = "Hide preview";
      }
    });
    (_M = els.bucketField) == null ? void 0 : _M.addEventListener("input", () => {
      try {
        loadBucketNoteIntoEditor(els.bucketField.value);
      } catch (e) {
      }
    });
    (_N = els.noteModalClose) == null ? void 0 : _N.addEventListener("click", () => {
      var _a2, _b2;
      return (_b2 = (_a2 = ui).closeNoteModal) == null ? void 0 : _b2.call(_a2);
    });
    (_O = els.noteCancel) == null ? void 0 : _O.addEventListener("click", () => {
      var _a2, _b2;
      return (_b2 = (_a2 = ui).closeNoteModal) == null ? void 0 : _b2.call(_a2);
    });
    (_P = els.noteEditToggle) == null ? void 0 : _P.addEventListener("click", () => {
      var _a2;
      if (!els.noteModal) return;
      const editing = ((_a2 = els.noteEditorWrap) == null ? void 0 : _a2.style.display) !== "none";
      if (editing) {
        if (els.noteEditorWrap) els.noteEditorWrap.style.display = "none";
        if (els.noteViewer) els.noteViewer.style.display = "";
        if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = "none";
        if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = "";
        if (els.noteEditToggle) els.noteEditToggle.textContent = "Edit";
      } else {
        if (els.noteEditorWrap) els.noteEditorWrap.style.display = "";
        if (els.noteViewer) els.noteViewer.style.display = "none";
        if (els.bucketNoteEditorWrap) els.bucketNoteEditorWrap.style.display = "";
        if (els.bucketNoteViewer) els.bucketNoteViewer.style.display = "none";
        if (els.noteEditToggle) els.noteEditToggle.textContent = "View";
      }
    });
    (_Q = els.noteSave) == null ? void 0 : _Q.addEventListener("click", async () => {
      var _a2, _b2, _c2, _d2;
      if (!els.noteModal) return;
      const id = Number(els.noteModal.dataset.id);
      if (!id) return;
      let html = "";
      try {
        const q = window.Quill && els.noteEditor && els.noteEditor.__quill ? els.noteEditor.__quill : null;
        if (q && q.root) html = q.root.innerHTML || "";
      } catch (e) {
      }
      let bhtml = "";
      try {
        const qb = window.Quill && els.bucketNoteEditor && els.bucketNoteEditor.__quill ? els.bucketNoteEditor.__quill : null;
        if (qb && qb.root) bhtml = qb.root.innerHTML || "";
      } catch (e) {
      }
      const idx = state.punches.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const updated = { ...state.punches[idx], note: String(html || "") };
        await idb.put(updated);
        state.punches[idx] = updated;
        try {
          await idb.setBucketNote(updated.bucket || "", String(bhtml || ""));
        } catch (e) {
        }
        ui.renderAll();
        (_b2 = (_a2 = ui).toast) == null ? void 0 : _b2.call(_a2, "Saved");
        (_d2 = (_c2 = ui).closeNoteModal) == null ? void 0 : _d2.call(_c2);
      }
    });
    const endWrap = els.repeatUntilWrap;
    const endInput = els.repeatUntil;
    const openPicker = (e) => {
      if (!endInput) return;
      showDatePicker(endInput, endInput);
      e.stopPropagation();
    };
    endWrap == null ? void 0 : endWrap.addEventListener("click", (e) => {
      const clickedInput = e.target === endInput || e.target.closest("#repeatUntil");
      openPicker(e);
    });
    endInput == null ? void 0 : endInput.addEventListener("focus", openPicker);
    document.addEventListener("click", (e) => {
      if (!datePopover) return;
      const inside = e.target === datePopover || datePopover && datePopover.contains(e.target);
      const isEndField = e.target === endInput || endWrap && endWrap.contains(e.target);
      if (!inside && !isEndField) hideDatePicker();
    }, true);
  };
  var actions = {
    attachEvents
  };

  // app.js
  async function init2() {
    var _a, _b, _c, _d, _e;
    actions.attachEvents();
    if (typeof window.DEBUG_HANDLES === "undefined") {
      window.DEBUG_HANDLES = false;
    }
    state.punches = await idb.all();
    let schedules = await schedulesDb.allSchedules();
    if (!schedules || !schedules.length) {
      const id = await schedulesDb.addSchedule({ name: "Default" });
      schedules = await schedulesDb.allSchedules();
    }
    state.schedules = schedules;
    try {
      state.scheduleViews = await (((_b = (_a = scheduleViewsDb).allScheduleViews) == null ? void 0 : _b.call(_a)) || Promise.resolve([]));
    } catch (e) {
      state.scheduleViews = [];
    }
    try {
      const seen = /* @__PURE__ */ new Map();
      for (const s of schedules || []) {
        const n = String((s == null ? void 0 : s.name) || "");
        if (!seen.has(n)) seen.set(n, []);
        seen.get(n).push(s.id);
      }
      const dups = Array.from(seen.entries()).filter(([, ids]) => (ids || []).length > 1);
      if (dups.length) {
        const details = dups.map(([n, ids]) => `${n}: [${ids.join(", ")}]`).join(" | ");
        console.error(new Error(`SchemaError: Duplicate schedule names found \u2014 ${details}`));
      }
    } catch (e) {
    }
    const ls = typeof localStorage !== "undefined" ? localStorage : null;
    const rawView = ls ? ls.getItem("currentScheduleViewId") : null;
    const savedViewId = rawView === null || rawView === "" ? null : Number(rawView);
    const hasSavedView = savedViewId != null && (state.scheduleViews || []).some((v) => Number(v.id) === savedViewId);
    const rawSched = ls ? ls.getItem("currentScheduleId") : null;
    const savedSchedId = rawSched === null || rawSched === "" ? null : Number(rawSched);
    const hasSaved = savedSchedId != null && schedules.some((s) => s.id === savedSchedId);
    if (hasSavedView) {
      state.currentScheduleViewId = savedViewId;
      state.currentScheduleId = null;
    } else {
      state.currentScheduleViewId = null;
      state.currentScheduleId = hasSaved ? savedSchedId : ((_c = schedules[0]) == null ? void 0 : _c.id) || null;
    }
    try {
      if (state.currentScheduleViewId != null) ls == null ? void 0 : ls.setItem("currentScheduleViewId", String(state.currentScheduleViewId));
      else ls == null ? void 0 : ls.removeItem("currentScheduleViewId");
    } catch (e) {
    }
    try {
      if (state.currentScheduleId != null) ls == null ? void 0 : ls.setItem("currentScheduleId", String(state.currentScheduleId));
    } catch (e) {
    }
    const updates = [];
    for (const p of state.punches) {
      if (!p.date) {
        const d = p.createdAt && String(p.createdAt).slice(0, 10) || todayStr();
        updates.push({ ...p, date: d });
      }
      if (p.caseNumber && !p.bucket) {
        const { caseNumber, ...rest } = p;
        updates.push({ ...rest, bucket: caseNumber });
      }
      if (p.scheduleId == null && state.currentScheduleId != null) {
        updates.push({ ...p, scheduleId: state.currentScheduleId });
      }
    }
    if (updates.length) {
      for (const up of updates) await idb.put(up);
      state.punches = await idb.all();
    }
    (_e = (_d = ui).renderScheduleSelect) == null ? void 0 : _e.call(_d);
    ui.renderAll();
    nowIndicator.init();
  }
  init2();
})();
