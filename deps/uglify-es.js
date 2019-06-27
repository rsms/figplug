import MOZ_SourceMap from "./source-map.js";

function characters(str) {
    return str.split("");
}

function member(name, array) {
    return array.indexOf(name) >= 0;
}

function find_if(func, array) {
    for (var i = 0, n = array.length; i < n; ++i) if (func(array[i])) return array[i];
}

function configure_error_stack(fn) {
    Object.defineProperty(fn.prototype, "stack", {
        get: function() {
            var err = new Error(this.message);
            err.name = this.name;
            try {
                throw err;
            } catch (e) {
                return e.stack;
            }
        }
    });
}

function DefaultsError(msg, defs) {
    this.message = msg, this.defs = defs;
}

function defaults(args, defs, croak) {
    !0 === args && (args = {});
    var ret = args || {};
    if (croak) for (var i in ret) HOP(ret, i) && !HOP(defs, i) && DefaultsError.croak("`" + i + "` is not a supported option", defs);
    for (var i in defs) HOP(defs, i) && (ret[i] = args && HOP(args, i) ? args[i] : defs[i]);
    return ret;
}

function merge(obj, ext) {
    var count = 0;
    for (var i in ext) HOP(ext, i) && (obj[i] = ext[i], count++);
    return count;
}

function noop() {}

function return_false() {
    return !1;
}

function return_true() {
    return !0;
}

function return_this() {
    return this;
}

function return_null() {
    return null;
}

DefaultsError.prototype = Object.create(Error.prototype), DefaultsError.prototype.constructor = DefaultsError, 
DefaultsError.prototype.name = "DefaultsError", configure_error_stack(DefaultsError), 
DefaultsError.croak = function(msg, defs) {
    throw new DefaultsError(msg, defs);
};

var MAP = function() {
    function MAP(a, f, backwards) {
        var i, ret = [], top = [];
        function doit() {
            var val = f(a[i], i), is_last = val instanceof Last;
            return is_last && (val = val.v), val instanceof AtTop ? (val = val.v) instanceof Splice ? top.push.apply(top, backwards ? val.v.slice().reverse() : val.v) : top.push(val) : val !== skip && (val instanceof Splice ? ret.push.apply(ret, backwards ? val.v.slice().reverse() : val.v) : ret.push(val)), 
            is_last;
        }
        if (a instanceof Array) if (backwards) {
            for (i = a.length; --i >= 0 && !doit(); ) ;
            ret.reverse(), top.reverse();
        } else for (i = 0; i < a.length && !doit(); ++i) ; else for (i in a) if (HOP(a, i) && doit()) break;
        return top.concat(ret);
    }
    MAP.at_top = function(val) {
        return new AtTop(val);
    }, MAP.splice = function(val) {
        return new Splice(val);
    }, MAP.last = function(val) {
        return new Last(val);
    };
    var skip = MAP.skip = {};
    function AtTop(val) {
        this.v = val;
    }
    function Splice(val) {
        this.v = val;
    }
    function Last(val) {
        this.v = val;
    }
    return MAP;
}();

function push_uniq(array, el) {
    array.indexOf(el) < 0 && array.push(el);
}

function string_template(text, props) {
    return text.replace(/\{(.+?)\}/g, function(str, p) {
        return props && props[p];
    });
}

function remove(array, el) {
    for (var i = array.length; --i >= 0; ) array[i] === el && array.splice(i, 1);
}

function mergeSort(array, cmp) {
    if (array.length < 2) return array.slice();
    return function _ms(a) {
        if (a.length <= 1) return a;
        var m = Math.floor(a.length / 2), left = a.slice(0, m), right = a.slice(m);
        return function(a, b) {
            for (var r = [], ai = 0, bi = 0, i = 0; ai < a.length && bi < b.length; ) cmp(a[ai], b[bi]) <= 0 ? r[i++] = a[ai++] : r[i++] = b[bi++];
            return ai < a.length && r.push.apply(r, a.slice(ai)), bi < b.length && r.push.apply(r, b.slice(bi)), 
            r;
        }(left = _ms(left), right = _ms(right));
    }(array);
}

function makePredicate(words) {
    words instanceof Array || (words = words.split(" "));
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
        for (var j = 0; j < cats.length; ++j) if (cats[j][0].length == words[i].length) {
            cats[j].push(words[i]);
            continue out;
        }
        cats.push([ words[i] ]);
    }
    function quote(word) {
        return JSON.stringify(word).replace(/[\u2028\u2029]/g, function(s) {
            switch (s) {
              case "\u2028":
                return "\\u2028";

              case "\u2029":
                return "\\u2029";
            }
            return s;
        });
    }
    function compareTo(arr) {
        if (1 == arr.length) return f += "return str === " + quote(arr[0]) + ";";
        f += "switch(str){";
        for (var i = 0; i < arr.length; ++i) f += "case " + quote(arr[i]) + ":";
        f += "return true}return false;";
    }
    if (cats.length > 3) {
        cats.sort(function(a, b) {
            return b.length - a.length;
        }), f += "switch(str.length){";
        for (i = 0; i < cats.length; ++i) {
            var cat = cats[i];
            f += "case " + cat[0].length + ":", compareTo(cat);
        }
        f += "}";
    } else compareTo(words);
    return new Function("str", f);
}

function all(array, predicate) {
    for (var i = array.length; --i >= 0; ) if (!predicate(array[i])) return !1;
    return !0;
}

function Dictionary() {
    this._values = Object.create(null), this._size = 0;
}

function HOP(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function first_in_statement(stack) {
    for (var p, node = stack.parent(-1), i = 0; p = stack.parent(i); i++) {
        if (p instanceof AST_Statement && p.body === node) return !0;
        if (!(p instanceof AST_Sequence && p.expressions[0] === node || "Call" == p.TYPE && p.expression === node || p instanceof AST_Dot && p.expression === node || p instanceof AST_Sub && p.expression === node || p instanceof AST_Conditional && p.condition === node || p instanceof AST_Binary && p.left === node || p instanceof AST_UnaryPostfix && p.expression === node)) return !1;
        node = p;
    }
}

function DEFNODE(type, props, methods, base) {
    arguments.length < 4 && (base = AST_Node);
    var self_props = props = props ? props.split(/\s+/) : [];
    base && base.PROPS && (props = props.concat(base.PROPS));
    for (var code = "return function AST_" + type + "(props){ if (props) { ", i = props.length; --i >= 0; ) code += "this." + props[i] + " = props." + props[i] + ";";
    var proto = base && new base();
    (proto && proto.initialize || methods && methods.initialize) && (code += "this.initialize();"), 
    code += "}}";
    var ctor = new Function(code)();
    if (proto && (ctor.prototype = proto, ctor.BASE = base), base && base.SUBCLASSES.push(ctor), 
    ctor.prototype.CTOR = ctor, ctor.PROPS = props || null, ctor.SELF_PROPS = self_props, 
    ctor.SUBCLASSES = [], type && (ctor.prototype.TYPE = ctor.TYPE = type), methods) for (i in methods) HOP(methods, i) && (/^\$/.test(i) ? ctor[i.substr(1)] = methods[i] : ctor.prototype[i] = methods[i]);
    return ctor.DEFMETHOD = function(name, method) {
        this.prototype[name] = method;
    }, "undefined" != typeof exports && (exports["AST_" + type] = ctor), ctor;
}

Dictionary.prototype = {
    set: function(key, val) {
        return this.has(key) || ++this._size, this._values["$" + key] = val, this;
    },
    add: function(key, val) {
        return this.has(key) ? this.get(key).push(val) : this.set(key, [ val ]), this;
    },
    get: function(key) {
        return this._values["$" + key];
    },
    del: function(key) {
        return this.has(key) && (--this._size, delete this._values["$" + key]), this;
    },
    has: function(key) {
        return "$" + key in this._values;
    },
    each: function(f) {
        for (var i in this._values) f(this._values[i], i.substr(1));
    },
    size: function() {
        return this._size;
    },
    map: function(f) {
        var ret = [];
        for (var i in this._values) ret.push(f(this._values[i], i.substr(1)));
        return ret;
    },
    clone: function() {
        var ret = new Dictionary();
        for (var i in this._values) ret._values[i] = this._values[i];
        return ret._size = this._size, ret;
    },
    toObject: function() {
        return this._values;
    }
}, Dictionary.fromObject = function(obj) {
    var dict = new Dictionary();
    return dict._size = merge(dict._values, obj), dict;
};

var AST_Token = DEFNODE("Token", "type value line col pos endline endcol endpos nlb comments_before comments_after file raw", {}, null), AST_Node = DEFNODE("Node", "start end", {
    _clone: function(deep) {
        if (deep) {
            var self = this.clone();
            return self.transform(new TreeTransformer(function(node) {
                if (node !== self) return node.clone(!0);
            }));
        }
        return new this.CTOR(this);
    },
    clone: function(deep) {
        return this._clone(deep);
    },
    $documentation: "Base class of all AST nodes",
    $propdoc: {
        start: "[AST_Token] The first token of this node",
        end: "[AST_Token] The last token of this node"
    },
    _walk: function(visitor) {
        return visitor._visit(this);
    },
    walk: function(visitor) {
        return this._walk(visitor);
    }
}, null);

AST_Node.warn_function = null, AST_Node.warn = function(txt, props) {
    AST_Node.warn_function && AST_Node.warn_function(string_template(txt, props));
};

var AST_Statement = DEFNODE("Statement", null, {
    $documentation: "Base class of all statements"
}), AST_Debugger = DEFNODE("Debugger", null, {
    $documentation: "Represents a debugger statement"
}, AST_Statement), AST_Directive = DEFNODE("Directive", "value quote", {
    $documentation: 'Represents a directive, like "use strict";',
    $propdoc: {
        value: "[string] The value of this directive as a plain string (it's not an AST_String!)",
        quote: "[string] the original quote character"
    }
}, AST_Statement), AST_SimpleStatement = DEFNODE("SimpleStatement", "body", {
    $documentation: "A statement consisting of an expression, i.e. a = 1 + 2",
    $propdoc: {
        body: "[AST_Node] an expression node (should not be instanceof AST_Statement)"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.body._walk(visitor);
        });
    }
}, AST_Statement);

function walk_body(node, visitor) {
    var body = node.body;
    if (body instanceof AST_Node) body._walk(visitor); else for (var i = 0, len = body.length; i < len; i++) body[i]._walk(visitor);
}

var AST_Block = DEFNODE("Block", "body", {
    $documentation: "A body of statements (usually bracketed)",
    $propdoc: {
        body: "[AST_Statement*] an array of statements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            walk_body(this, visitor);
        });
    }
}, AST_Statement), AST_BlockStatement = DEFNODE("BlockStatement", null, {
    $documentation: "A block statement"
}, AST_Block), AST_EmptyStatement = DEFNODE("EmptyStatement", null, {
    $documentation: "The empty statement (empty block or simply a semicolon)"
}, AST_Statement), AST_StatementWithBody = DEFNODE("StatementWithBody", "body", {
    $documentation: "Base class for all statements that contain one nested body: `For`, `ForIn`, `Do`, `While`, `With`",
    $propdoc: {
        body: "[AST_Statement] the body; this should always be present, even if it's an AST_EmptyStatement"
    }
}, AST_Statement), AST_LabeledStatement = DEFNODE("LabeledStatement", "label", {
    $documentation: "Statement with a label",
    $propdoc: {
        label: "[AST_Label] a label definition"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.label._walk(visitor), this.body._walk(visitor);
        });
    },
    clone: function(deep) {
        var node = this._clone(deep);
        if (deep) {
            var label = node.label, def = this.label;
            node.walk(new TreeWalker(function(node) {
                node instanceof AST_LoopControl && node.label && node.label.thedef === def && (node.label.thedef = label, 
                label.references.push(node));
            }));
        }
        return node;
    }
}, AST_StatementWithBody), AST_IterationStatement = DEFNODE("IterationStatement", null, {
    $documentation: "Internal class.  All loops inherit from it."
}, AST_StatementWithBody), AST_DWLoop = DEFNODE("DWLoop", "condition", {
    $documentation: "Base class for do/while statements",
    $propdoc: {
        condition: "[AST_Node] the loop condition.  Should not be instanceof AST_Statement"
    }
}, AST_IterationStatement), AST_Do = DEFNODE("Do", null, {
    $documentation: "A `do` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.body._walk(visitor), this.condition._walk(visitor);
        });
    }
}, AST_DWLoop), AST_While = DEFNODE("While", null, {
    $documentation: "A `while` statement",
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.condition._walk(visitor), this.body._walk(visitor);
        });
    }
}, AST_DWLoop), AST_For = DEFNODE("For", "init condition step", {
    $documentation: "A `for` statement",
    $propdoc: {
        init: "[AST_Node?] the `for` initialization code, or null if empty",
        condition: "[AST_Node?] the `for` termination clause, or null if empty",
        step: "[AST_Node?] the `for` update clause, or null if empty"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.init && this.init._walk(visitor), this.condition && this.condition._walk(visitor), 
            this.step && this.step._walk(visitor), this.body._walk(visitor);
        });
    }
}, AST_IterationStatement), AST_ForIn = DEFNODE("ForIn", "init object", {
    $documentation: "A `for ... in` statement",
    $propdoc: {
        init: "[AST_Node] the `for/in` initialization code",
        object: "[AST_Node] the object that we're looping through"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.init._walk(visitor), this.object._walk(visitor), this.body._walk(visitor);
        });
    }
}, AST_IterationStatement), AST_ForOf = DEFNODE("ForOf", null, {
    $documentation: "A `for ... of` statement"
}, AST_ForIn), AST_With = DEFNODE("With", "expression", {
    $documentation: "A `with` statement",
    $propdoc: {
        expression: "[AST_Node] the `with` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor), this.body._walk(visitor);
        });
    }
}, AST_StatementWithBody), AST_Scope = DEFNODE("Scope", "variables functions uses_with uses_eval parent_scope enclosed cname", {
    $documentation: "Base class for all statements introducing a lexical scope",
    $propdoc: {
        variables: "[Object/S] a map of name -> SymbolDef for all variables/functions defined in this scope",
        functions: "[Object/S] like `variables`, but only lists function declarations",
        uses_with: "[boolean/S] tells whether this scope uses the `with` statement",
        uses_eval: "[boolean/S] tells whether this scope contains a direct call to the global `eval`",
        parent_scope: "[AST_Scope?/S] link to the parent scope",
        enclosed: "[SymbolDef*/S] a list of all symbol definitions that are accessed from this scope or any subscopes",
        cname: "[integer/S] current index for mangling variables (used internally by the mangler)"
    },
    get_defun_scope: function() {
        for (var self = this; self.is_block_scope(); ) self = self.parent_scope;
        return self;
    },
    clone: function(deep) {
        var node = this._clone(deep);
        return this.variables && (node.variables = this.variables.clone()), this.functions && (node.functions = this.functions.clone()), 
        this.enclosed && (node.enclosed = this.enclosed.slice()), node;
    }
}, AST_Block), AST_Toplevel = DEFNODE("Toplevel", "globals", {
    $documentation: "The toplevel scope",
    $propdoc: {
        globals: "[Object/S] a map of name -> SymbolDef for all undeclared names"
    },
    wrap_commonjs: function(name) {
        var body = this.body, wrapped_tl = "(function(exports){'$ORIG';})(typeof " + name + "=='undefined'?(" + name + "={}):" + name + ");";
        return wrapped_tl = (wrapped_tl = parse(wrapped_tl)).transform(new TreeTransformer(function(node) {
            if (node instanceof AST_Directive && "$ORIG" == node.value) return MAP.splice(body);
        }));
    }
}, AST_Scope), AST_Expansion = DEFNODE("Expansion", "expression", {
    $documentation: "An expandible argument, such as ...rest, a splat, such as [1,2,...all], or an expansion in a variable declaration, such as var [first, ...rest] = list",
    $propdoc: {
        expression: "[AST_Node] the thing to be expanded"
    },
    _walk: function(visitor) {
        var self = this;
        return visitor._visit(this, function() {
            self.expression.walk(visitor);
        });
    }
}), AST_Lambda = DEFNODE("Lambda", "name argnames uses_arguments is_generator async", {
    $documentation: "Base class for functions",
    $propdoc: {
        name: "[AST_SymbolDeclaration?] the name of this function",
        argnames: "[AST_SymbolFunarg|AST_Destructuring|AST_Expansion|AST_DefaultAssign*] array of function arguments, destructurings, or expanding arguments",
        uses_arguments: "[boolean/S] tells whether this function accesses the arguments array",
        is_generator: "[boolean] is this a generator method",
        async: "[boolean] is this method async"
    },
    args_as_names: function() {
        for (var out = [], i = 0; i < this.argnames.length; i++) this.argnames[i] instanceof AST_Destructuring ? out = out.concat(this.argnames[i].all_symbols()) : out.push(this.argnames[i]);
        return out;
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.name && this.name._walk(visitor);
            for (var argnames = this.argnames, i = 0, len = argnames.length; i < len; i++) argnames[i]._walk(visitor);
            walk_body(this, visitor);
        });
    }
}, AST_Scope), AST_Accessor = DEFNODE("Accessor", null, {
    $documentation: "A setter/getter function.  The `name` property is always null."
}, AST_Lambda), AST_Function = DEFNODE("Function", "inlined", {
    $documentation: "A function expression"
}, AST_Lambda), AST_Arrow = DEFNODE("Arrow", "inlined", {
    $documentation: "An ES6 Arrow function ((a) => b)"
}, AST_Lambda), AST_Defun = DEFNODE("Defun", "inlined", {
    $documentation: "A function definition"
}, AST_Lambda), AST_Destructuring = DEFNODE("Destructuring", "names is_array", {
    $documentation: "A destructuring of several names. Used in destructuring assignment and with destructuring function argument names",
    $propdoc: {
        names: "[AST_Node*] Array of properties or elements",
        is_array: "[Boolean] Whether the destructuring represents an object or array"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.names.forEach(function(name) {
                name._walk(visitor);
            });
        });
    },
    all_symbols: function() {
        var out = [];
        return this.walk(new TreeWalker(function(node) {
            node instanceof AST_Symbol && out.push(node), node instanceof AST_Expansion && out.push(node.expression);
        })), out;
    }
}), AST_PrefixedTemplateString = DEFNODE("PrefixedTemplateString", "template_string prefix", {
    $documentation: "A templatestring with a prefix, such as String.raw`foobarbaz`",
    $propdoc: {
        template_string: "[AST_TemplateString] The template string",
        prefix: "[AST_SymbolRef|AST_PropAccess] The prefix, which can be a symbol such as `foo` or a dotted expression such as `String.raw`."
    },
    _walk: function(visitor) {
        this.prefix._walk(visitor), this.template_string._walk(visitor);
    }
}), AST_TemplateString = DEFNODE("TemplateString", "segments", {
    $documentation: "A template string literal",
    $propdoc: {
        segments: "[AST_Node*] One or more segments, starting with AST_TemplateSegment. AST_Node may follow AST_TemplateSegment, but each AST_Node must be followed by AST_TemplateSegment."
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.segments.forEach(function(seg) {
                seg._walk(visitor);
            });
        });
    }
}), AST_TemplateSegment = DEFNODE("TemplateSegment", "value raw", {
    $documentation: "A segment of a template string literal",
    $propdoc: {
        value: "Content of the segment",
        raw: "Raw content of the segment"
    }
}), AST_Jump = DEFNODE("Jump", null, {
    $documentation: "Base class for “jumps” (for now that's `return`, `throw`, `break` and `continue`)"
}, AST_Statement), AST_Exit = DEFNODE("Exit", "value", {
    $documentation: "Base class for “exits” (`return` and `throw`)",
    $propdoc: {
        value: "[AST_Node?] the value returned or thrown by this statement; could be null for AST_Return"
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.value && function() {
            this.value._walk(visitor);
        });
    }
}, AST_Jump), AST_Return = DEFNODE("Return", null, {
    $documentation: "A `return` statement"
}, AST_Exit), AST_Throw = DEFNODE("Throw", null, {
    $documentation: "A `throw` statement"
}, AST_Exit), AST_LoopControl = DEFNODE("LoopControl", "label", {
    $documentation: "Base class for loop control statements (`break` and `continue`)",
    $propdoc: {
        label: "[AST_LabelRef?] the label, or null if none"
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.label && function() {
            this.label._walk(visitor);
        });
    }
}, AST_Jump), AST_Break = DEFNODE("Break", null, {
    $documentation: "A `break` statement"
}, AST_LoopControl), AST_Continue = DEFNODE("Continue", null, {
    $documentation: "A `continue` statement"
}, AST_LoopControl), AST_If = DEFNODE("If", "condition alternative", {
    $documentation: "A `if` statement",
    $propdoc: {
        condition: "[AST_Node] the `if` condition",
        alternative: "[AST_Statement?] the `else` part, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.condition._walk(visitor), this.body._walk(visitor), this.alternative && this.alternative._walk(visitor);
        });
    }
}, AST_StatementWithBody), AST_Switch = DEFNODE("Switch", "expression", {
    $documentation: "A `switch` statement",
    $propdoc: {
        expression: "[AST_Node] the `switch` “discriminant”"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor), walk_body(this, visitor);
        });
    }
}, AST_Block), AST_SwitchBranch = DEFNODE("SwitchBranch", null, {
    $documentation: "Base class for `switch` branches"
}, AST_Block), AST_Default = DEFNODE("Default", null, {
    $documentation: "A `default` switch branch"
}, AST_SwitchBranch), AST_Case = DEFNODE("Case", "expression", {
    $documentation: "A `case` switch branch",
    $propdoc: {
        expression: "[AST_Node] the `case` expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor), walk_body(this, visitor);
        });
    }
}, AST_SwitchBranch), AST_Try = DEFNODE("Try", "bcatch bfinally", {
    $documentation: "A `try` statement",
    $propdoc: {
        bcatch: "[AST_Catch?] the catch block, or null if not present",
        bfinally: "[AST_Finally?] the finally block, or null if not present"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            walk_body(this, visitor), this.bcatch && this.bcatch._walk(visitor), this.bfinally && this.bfinally._walk(visitor);
        });
    }
}, AST_Block), AST_Catch = DEFNODE("Catch", "argname", {
    $documentation: "A `catch` node; only makes sense as part of a `try` statement",
    $propdoc: {
        argname: "[AST_SymbolCatch|AST_Destructuring|AST_Expansion|AST_DefaultAssign] symbol for the exception"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.argname._walk(visitor), walk_body(this, visitor);
        });
    }
}, AST_Block), AST_Finally = DEFNODE("Finally", null, {
    $documentation: "A `finally` node; only makes sense as part of a `try` statement"
}, AST_Block), AST_Definitions = DEFNODE("Definitions", "definitions", {
    $documentation: "Base class for `var` or `const` nodes (variable declarations/initializations)",
    $propdoc: {
        definitions: "[AST_VarDef*] array of variable definitions"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            for (var definitions = this.definitions, i = 0, len = definitions.length; i < len; i++) definitions[i]._walk(visitor);
        });
    }
}, AST_Statement), AST_Var = DEFNODE("Var", null, {
    $documentation: "A `var` statement"
}, AST_Definitions), AST_Let = DEFNODE("Let", null, {
    $documentation: "A `let` statement"
}, AST_Definitions), AST_Const = DEFNODE("Const", null, {
    $documentation: "A `const` statement"
}, AST_Definitions), AST_NameMapping = DEFNODE("NameMapping", "foreign_name name", {
    $documentation: "The part of the export/import statement that declare names from a module.",
    $propdoc: {
        foreign_name: "[AST_SymbolExportForeign|AST_SymbolImportForeign] The name being exported/imported (as specified in the module)",
        name: "[AST_SymbolExport|AST_SymbolImport] The name as it is visible to this module."
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.foreign_name._walk(visitor), this.name._walk(visitor);
        });
    }
}), AST_Import = DEFNODE("Import", "imported_name imported_names module_name", {
    $documentation: "An `import` statement",
    $propdoc: {
        imported_name: "[AST_SymbolImport] The name of the variable holding the module's default export.",
        imported_names: "[AST_NameMapping*] The names of non-default imported variables",
        module_name: "[AST_String] String literal describing where this module came from"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.imported_name && this.imported_name._walk(visitor), this.imported_names && this.imported_names.forEach(function(name_import) {
                name_import._walk(visitor);
            }), this.module_name._walk(visitor);
        });
    }
}), AST_Export = DEFNODE("Export", "exported_definition exported_value is_default exported_names module_name", {
    $documentation: "An `export` statement",
    $propdoc: {
        exported_definition: "[AST_Defun|AST_Definitions|AST_DefClass?] An exported definition",
        exported_value: "[AST_Node?] An exported value",
        exported_names: "[AST_NameMapping*?] List of exported names",
        module_name: "[AST_String?] Name of the file to load exports from",
        is_default: "[Boolean] Whether this is the default exported value of this module"
    },
    _walk: function(visitor) {
        visitor._visit(this, function() {
            this.exported_definition && this.exported_definition._walk(visitor), this.exported_value && this.exported_value._walk(visitor), 
            this.exported_names && this.exported_names.forEach(function(name_export) {
                name_export._walk(visitor);
            }), this.module_name && this.module_name._walk(visitor);
        });
    }
}, AST_Statement), AST_VarDef = DEFNODE("VarDef", "name value", {
    $documentation: "A variable declaration; only appears in a AST_Definitions node",
    $propdoc: {
        name: "[AST_Destructuring|AST_SymbolConst|AST_SymbolLet|AST_SymbolVar] name of the variable",
        value: "[AST_Node?] initializer, or null of there's no initializer"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.name._walk(visitor), this.value && this.value._walk(visitor);
        });
    }
}), AST_Call = DEFNODE("Call", "expression args", {
    $documentation: "A function call expression",
    $propdoc: {
        expression: "[AST_Node] expression to invoke as function",
        args: "[AST_Node*] array of arguments"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            for (var args = this.args, i = 0, len = args.length; i < len; i++) args[i]._walk(visitor);
            this.expression._walk(visitor);
        });
    }
}), AST_New = DEFNODE("New", null, {
    $documentation: "An object instantiation.  Derives from a function call since it has exactly the same properties"
}, AST_Call), AST_Sequence = DEFNODE("Sequence", "expressions", {
    $documentation: "A sequence expression (comma-separated expressions)",
    $propdoc: {
        expressions: "[AST_Node*] array of expressions (at least two)"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expressions.forEach(function(node) {
                node._walk(visitor);
            });
        });
    }
}), AST_PropAccess = DEFNODE("PropAccess", "expression property", {
    $documentation: 'Base class for property access expressions, i.e. `a.foo` or `a["foo"]`',
    $propdoc: {
        expression: "[AST_Node] the “container” expression",
        property: "[AST_Node|string] the property to access.  For AST_Dot this is always a plain string, while for AST_Sub it's an arbitrary AST_Node"
    }
}), AST_Dot = DEFNODE("Dot", null, {
    $documentation: "A dotted property access expression",
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor);
        });
    }
}, AST_PropAccess), AST_Sub = DEFNODE("Sub", null, {
    $documentation: 'Index-style property access, i.e. `a["foo"]`',
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor), this.property._walk(visitor);
        });
    }
}, AST_PropAccess), AST_Unary = DEFNODE("Unary", "operator expression", {
    $documentation: "Base class for unary expressions",
    $propdoc: {
        operator: "[string] the operator",
        expression: "[AST_Node] expression that this unary operator applies to"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor);
        });
    }
}), AST_UnaryPrefix = DEFNODE("UnaryPrefix", null, {
    $documentation: "Unary prefix expression, i.e. `typeof i` or `++i`"
}, AST_Unary), AST_UnaryPostfix = DEFNODE("UnaryPostfix", null, {
    $documentation: "Unary postfix expression, i.e. `i++`"
}, AST_Unary), AST_Binary = DEFNODE("Binary", "operator left right", {
    $documentation: "Binary expression, i.e. `a + b`",
    $propdoc: {
        left: "[AST_Node] left-hand side expression",
        operator: "[string] the operator",
        right: "[AST_Node] right-hand side expression"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.left._walk(visitor), this.right._walk(visitor);
        });
    }
}), AST_Conditional = DEFNODE("Conditional", "condition consequent alternative", {
    $documentation: "Conditional expression using the ternary operator, i.e. `a ? b : c`",
    $propdoc: {
        condition: "[AST_Node]",
        consequent: "[AST_Node]",
        alternative: "[AST_Node]"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.condition._walk(visitor), this.consequent._walk(visitor), this.alternative._walk(visitor);
        });
    }
}), AST_Assign = DEFNODE("Assign", null, {
    $documentation: "An assignment expression — `a = b + 5`"
}, AST_Binary), AST_DefaultAssign = DEFNODE("DefaultAssign", null, {
    $documentation: "A default assignment expression like in `(a = 3) => a`"
}, AST_Binary), AST_Array = DEFNODE("Array", "elements", {
    $documentation: "An array literal",
    $propdoc: {
        elements: "[AST_Node*] array of elements"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            for (var elements = this.elements, i = 0, len = elements.length; i < len; i++) elements[i]._walk(visitor);
        });
    }
}), AST_Object = DEFNODE("Object", "properties", {
    $documentation: "An object literal",
    $propdoc: {
        properties: "[AST_ObjectProperty*] array of properties"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            for (var properties = this.properties, i = 0, len = properties.length; i < len; i++) properties[i]._walk(visitor);
        });
    }
}), AST_ObjectProperty = DEFNODE("ObjectProperty", "key value", {
    $documentation: "Base class for literal object properties",
    $propdoc: {
        key: "[string|AST_Node] property name. For ObjectKeyVal this is a string. For getters, setters and computed property this is an AST_Node.",
        value: "[AST_Node] property value.  For getters and setters this is an AST_Accessor."
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.key instanceof AST_Node && this.key._walk(visitor), this.value._walk(visitor);
        });
    }
}), AST_ObjectKeyVal = DEFNODE("ObjectKeyVal", "quote", {
    $documentation: "A key: value object property",
    $propdoc: {
        quote: "[string] the original quote character"
    }
}, AST_ObjectProperty), AST_ObjectSetter = DEFNODE("ObjectSetter", "quote static", {
    $propdoc: {
        quote: "[string|undefined] the original quote character, if any",
        static: "[boolean] whether this is a static setter (classes only)"
    },
    $documentation: "An object setter property"
}, AST_ObjectProperty), AST_ObjectGetter = DEFNODE("ObjectGetter", "quote static", {
    $propdoc: {
        quote: "[string|undefined] the original quote character, if any",
        static: "[boolean] whether this is a static getter (classes only)"
    },
    $documentation: "An object getter property"
}, AST_ObjectProperty), AST_ConciseMethod = DEFNODE("ConciseMethod", "quote static is_generator async", {
    $propdoc: {
        quote: "[string|undefined] the original quote character, if any",
        static: "[boolean] is this method static (classes only)",
        is_generator: "[boolean] is this a generator method",
        async: "[boolean] is this method async"
    },
    $documentation: "An ES6 concise method inside an object or class"
}, AST_ObjectProperty), AST_Class = DEFNODE("Class", "name extends properties inlined", {
    $propdoc: {
        name: "[AST_SymbolClass|AST_SymbolDefClass?] optional class name.",
        extends: "[AST_Node]? optional parent class",
        properties: "[AST_ObjectProperty*] array of properties"
    },
    $documentation: "An ES6 class",
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.name && this.name._walk(visitor), this.extends && this.extends._walk(visitor), 
            this.properties.forEach(function(prop) {
                prop._walk(visitor);
            });
        });
    }
}, AST_Scope), AST_DefClass = DEFNODE("DefClass", null, {
    $documentation: "A class definition"
}, AST_Class), AST_ClassExpression = DEFNODE("ClassExpression", null, {
    $documentation: "A class expression."
}, AST_Class), AST_Symbol = DEFNODE("Symbol", "scope name thedef", {
    $propdoc: {
        name: "[string] name of this symbol",
        scope: "[AST_Scope/S] the current scope (not necessarily the definition scope)",
        thedef: "[SymbolDef/S] the definition of this symbol"
    },
    $documentation: "Base class for all symbols"
}), AST_NewTarget = DEFNODE("NewTarget", null, {
    $documentation: "A reference to new.target"
}), AST_SymbolDeclaration = DEFNODE("SymbolDeclaration", "init", {
    $documentation: "A declaration symbol (symbol in var/const, function name or argument, symbol in catch)"
}, AST_Symbol), AST_SymbolVar = DEFNODE("SymbolVar", null, {
    $documentation: "Symbol defining a variable"
}, AST_SymbolDeclaration), AST_SymbolBlockDeclaration = DEFNODE("SymbolBlockDeclaration", null, {
    $documentation: "Base class for block-scoped declaration symbols"
}, AST_SymbolDeclaration), AST_SymbolConst = DEFNODE("SymbolConst", null, {
    $documentation: "A constant declaration"
}, AST_SymbolBlockDeclaration), AST_SymbolLet = DEFNODE("SymbolLet", null, {
    $documentation: "A block-scoped `let` declaration"
}, AST_SymbolBlockDeclaration), AST_SymbolFunarg = DEFNODE("SymbolFunarg", null, {
    $documentation: "Symbol naming a function argument"
}, AST_SymbolVar), AST_SymbolDefun = DEFNODE("SymbolDefun", null, {
    $documentation: "Symbol defining a function"
}, AST_SymbolDeclaration), AST_SymbolMethod = DEFNODE("SymbolMethod", null, {
    $documentation: "Symbol in an object defining a method"
}, AST_Symbol), AST_SymbolLambda = DEFNODE("SymbolLambda", null, {
    $documentation: "Symbol naming a function expression"
}, AST_SymbolDeclaration), AST_SymbolDefClass = DEFNODE("SymbolDefClass", null, {
    $documentation: "Symbol naming a class's name in a class declaration. Lexically scoped to its containing scope, and accessible within the class."
}, AST_SymbolBlockDeclaration), AST_SymbolClass = DEFNODE("SymbolClass", null, {
    $documentation: "Symbol naming a class's name. Lexically scoped to the class."
}, AST_SymbolDeclaration), AST_SymbolCatch = DEFNODE("SymbolCatch", null, {
    $documentation: "Symbol naming the exception in catch"
}, AST_SymbolBlockDeclaration), AST_SymbolImport = DEFNODE("SymbolImport", null, {
    $documentation: "Symbol referring to an imported name"
}, AST_SymbolBlockDeclaration), AST_SymbolImportForeign = DEFNODE("SymbolImportForeign", null, {
    $documentation: "A symbol imported from a module, but it is defined in the other module, and its real name is irrelevant for this module's purposes"
}, AST_Symbol), AST_Label = DEFNODE("Label", "references", {
    $documentation: "Symbol naming a label (declaration)",
    $propdoc: {
        references: "[AST_LoopControl*] a list of nodes referring to this label"
    },
    initialize: function() {
        this.references = [], this.thedef = this;
    }
}, AST_Symbol), AST_SymbolRef = DEFNODE("SymbolRef", null, {
    $documentation: "Reference to some symbol (not definition/declaration)"
}, AST_Symbol), AST_SymbolExport = DEFNODE("SymbolExport", null, {
    $documentation: "Symbol referring to a name to export"
}, AST_SymbolRef), AST_SymbolExportForeign = DEFNODE("SymbolExportForeign", null, {
    $documentation: "A symbol exported from this module, but it is used in the other module, and its real name is irrelevant for this module's purposes"
}, AST_Symbol), AST_LabelRef = DEFNODE("LabelRef", null, {
    $documentation: "Reference to a label symbol"
}, AST_Symbol), AST_This = DEFNODE("This", null, {
    $documentation: "The `this` symbol"
}, AST_Symbol), AST_Super = DEFNODE("Super", null, {
    $documentation: "The `super` symbol"
}, AST_This), AST_Constant = DEFNODE("Constant", null, {
    $documentation: "Base class for all constants",
    getValue: function() {
        return this.value;
    }
}), AST_String = DEFNODE("String", "value quote", {
    $documentation: "A string literal",
    $propdoc: {
        value: "[string] the contents of this string",
        quote: "[string] the original quote character"
    }
}, AST_Constant), AST_Number = DEFNODE("Number", "value literal", {
    $documentation: "A number literal",
    $propdoc: {
        value: "[number] the numeric value",
        literal: "[string] numeric value as string (optional)"
    }
}, AST_Constant), AST_RegExp = DEFNODE("RegExp", "value", {
    $documentation: "A regexp literal",
    $propdoc: {
        value: "[RegExp] the actual regexp"
    }
}, AST_Constant), AST_Atom = DEFNODE("Atom", null, {
    $documentation: "Base class for atoms"
}, AST_Constant), AST_Null = DEFNODE("Null", null, {
    $documentation: "The `null` atom",
    value: null
}, AST_Atom), AST_NaN = DEFNODE("NaN", null, {
    $documentation: "The impossible value",
    value: NaN
}, AST_Atom), AST_Undefined = DEFNODE("Undefined", null, {
    $documentation: "The `undefined` value",
    value: void 0
}, AST_Atom), AST_Hole = DEFNODE("Hole", null, {
    $documentation: "A hole in an array",
    value: void 0
}, AST_Atom), AST_Infinity = DEFNODE("Infinity", null, {
    $documentation: "The `Infinity` value",
    value: 1 / 0
}, AST_Atom), AST_Boolean = DEFNODE("Boolean", null, {
    $documentation: "Base class for booleans"
}, AST_Atom), AST_False = DEFNODE("False", null, {
    $documentation: "The `false` atom",
    value: !1
}, AST_Boolean), AST_True = DEFNODE("True", null, {
    $documentation: "The `true` atom",
    value: !0
}, AST_Boolean), AST_Await = DEFNODE("Await", "expression", {
    $documentation: "An `await` statement",
    $propdoc: {
        expression: "[AST_Node] the mandatory expression being awaited"
    },
    _walk: function(visitor) {
        return visitor._visit(this, function() {
            this.expression._walk(visitor);
        });
    }
}), AST_Yield = DEFNODE("Yield", "expression is_star", {
    $documentation: "A `yield` statement",
    $propdoc: {
        expression: "[AST_Node?] the value returned or thrown by this statement; could be null (representing undefined) but only when is_star is set to false",
        is_star: "[Boolean] Whether this is a yield or yield* statement"
    },
    _walk: function(visitor) {
        return visitor._visit(this, this.expression && function() {
            this.expression._walk(visitor);
        });
    }
});

function TreeWalker(callback) {
    this.visit = callback, this.stack = [], this.directives = Object.create(null);
}

TreeWalker.prototype = {
    _visit: function(node, descend) {
        this.push(node);
        var ret = this.visit(node, descend ? function() {
            descend.call(node);
        } : noop);
        return !ret && descend && descend.call(node), this.pop(), ret;
    },
    parent: function(n) {
        return this.stack[this.stack.length - 2 - (n || 0)];
    },
    push: function(node) {
        node instanceof AST_Lambda ? this.directives = Object.create(this.directives) : node instanceof AST_Directive && !this.directives[node.value] ? this.directives[node.value] = node : node instanceof AST_Class && (this.directives = Object.create(this.directives), 
        this.directives["use strict"] || (this.directives["use strict"] = node)), this.stack.push(node);
    },
    pop: function() {
        var node = this.stack.pop();
        (node instanceof AST_Lambda || node instanceof AST_Class) && (this.directives = Object.getPrototypeOf(this.directives));
    },
    self: function() {
        return this.stack[this.stack.length - 1];
    },
    find_parent: function(type) {
        for (var stack = this.stack, i = stack.length; --i >= 0; ) {
            var x = stack[i];
            if (x instanceof type) return x;
        }
    },
    has_directive: function(type) {
        var dir = this.directives[type];
        if (dir) return dir;
        var node = this.stack[this.stack.length - 1];
        if (node instanceof AST_Scope && node.body) for (var i = 0; i < node.body.length; ++i) {
            var st = node.body[i];
            if (!(st instanceof AST_Directive)) break;
            if (st.value == type) return st;
        }
    },
    loopcontrol_target: function(node) {
        var stack = this.stack;
        if (node.label) for (var i = stack.length; --i >= 0; ) {
            if ((x = stack[i]) instanceof AST_LabeledStatement && x.label.name == node.label.name) return x.body;
        } else for (i = stack.length; --i >= 0; ) {
            var x;
            if ((x = stack[i]) instanceof AST_IterationStatement || node instanceof AST_Break && x instanceof AST_Switch) return x;
        }
    }
};

var KEYWORDS = "break case catch class const continue debugger default delete do else export extends finally for function if in instanceof let new return switch throw try typeof var void while with", KEYWORDS_ATOM = "false null true", RESERVED_WORDS = "enum implements import interface package private protected public static super this " + KEYWORDS_ATOM + " " + KEYWORDS, KEYWORDS_BEFORE_EXPRESSION = "return new delete throw else case yield await";

KEYWORDS = makePredicate(KEYWORDS), RESERVED_WORDS = makePredicate(RESERVED_WORDS), 
KEYWORDS_BEFORE_EXPRESSION = makePredicate(KEYWORDS_BEFORE_EXPRESSION), KEYWORDS_ATOM = makePredicate(KEYWORDS_ATOM);

var OPERATOR_CHARS = makePredicate(characters("+-*&%=<>!?|~^")), RE_NUM_LITERAL = /[0-9a-f]/i, RE_HEX_NUMBER = /^0x[0-9a-f]+$/i, RE_OCT_NUMBER = /^0[0-7]+$/, RE_ES6_OCT_NUMBER = /^0o[0-7]+$/i, RE_BIN_NUMBER = /^0b[01]+$/i, RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i, OPERATORS = makePredicate([ "in", "instanceof", "typeof", "new", "void", "delete", "++", "--", "+", "-", "!", "~", "&", "|", "^", "*", "**", "/", "%", ">>", "<<", ">>>", "<", ">", "<=", ">=", "==", "===", "!=", "!==", "?", "=", "+=", "-=", "/=", "*=", "**=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&=", "&&", "||" ]), WHITESPACE_CHARS = makePredicate(characters("  \n\r\t\f\v​           \u2028\u2029  　\ufeff")), NEWLINE_CHARS = makePredicate(characters("\n\r\u2028\u2029")), PUNC_AFTER_EXPRESSION = makePredicate(characters(";]),:")), PUNC_BEFORE_EXPRESSION = makePredicate(characters("[{(,;:")), PUNC_CHARS = makePredicate(characters("[]{}(),;:")), UNICODE = {
    ID_Start: /[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
    ID_Continue: /[0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
};

function get_full_char(str, pos) {
    var char = str.charAt(pos);
    if (is_surrogate_pair_head(char)) {
        var next = str.charAt(pos + 1);
        if (is_surrogate_pair_tail(next)) return char + next;
    }
    if (is_surrogate_pair_tail(char)) {
        var prev = str.charAt(pos - 1);
        if (is_surrogate_pair_head(prev)) return prev + char;
    }
    return char;
}

function is_surrogate_pair_head(code) {
    return "string" == typeof code && (code = code.charCodeAt(0)), code >= 55296 && code <= 56319;
}

function is_surrogate_pair_tail(code) {
    return "string" == typeof code && (code = code.charCodeAt(0)), code >= 56320 && code <= 57343;
}

function is_digit(code) {
    return code >= 48 && code <= 57;
}

function is_identifier(name) {
    return "string" == typeof name && !RESERVED_WORDS(name);
}

function is_identifier_start(ch) {
    var code = ch.charCodeAt(0);
    return UNICODE.ID_Start.test(ch) || 36 == code || 95 == code;
}

function is_identifier_char(ch) {
    var code = ch.charCodeAt(0);
    return UNICODE.ID_Continue.test(ch) || 36 == code || 95 == code || 8204 == code || 8205 == code;
}

function is_identifier_string(str) {
    return /^[a-z_$][a-z0-9_$]*$/i.test(str);
}

function JS_Parse_Error(message, filename, line, col, pos) {
    this.message = message, this.filename = filename, this.line = line, this.col = col, 
    this.pos = pos;
}

function js_error(message, filename, line, col, pos) {
    throw new JS_Parse_Error(message, filename, line, col, pos);
}

function is_token(token, type, val) {
    return token.type == type && (null == val || token.value == val);
}

JS_Parse_Error.prototype = Object.create(Error.prototype), JS_Parse_Error.prototype.constructor = JS_Parse_Error, 
JS_Parse_Error.prototype.name = "SyntaxError", configure_error_stack(JS_Parse_Error);

var EX_EOF = {};

function tokenizer($TEXT, filename, html5_comments, shebang) {
    var S = {
        text: $TEXT,
        filename,
        pos: 0,
        tokpos: 0,
        line: 1,
        tokline: 0,
        col: 0,
        tokcol: 0,
        newline_before: !1,
        regex_allowed: !1,
        brace_counter: 0,
        template_braces: [],
        comments_before: [],
        directives: {},
        directive_stack: []
    };
    function peek() {
        return get_full_char(S.text, S.pos);
    }
    function next(signal_eof, in_string) {
        var ch = get_full_char(S.text, S.pos++);
        if (signal_eof && !ch) throw EX_EOF;
        return NEWLINE_CHARS(ch) ? (S.newline_before = S.newline_before || !in_string, ++S.line, 
        S.col = 0, in_string || "\r" != ch || "\n" != peek() || (++S.pos, ch = "\n")) : (ch.length > 1 && (++S.pos, 
        ++S.col), ++S.col), ch;
    }
    function forward(i) {
        for (;i-- > 0; ) next();
    }
    function looking_at(str) {
        return S.text.substr(S.pos, str.length) == str;
    }
    function find(what, signal_eof) {
        var pos = S.text.indexOf(what, S.pos);
        if (signal_eof && -1 == pos) throw EX_EOF;
        return pos;
    }
    function start_token() {
        S.tokline = S.line, S.tokcol = S.col, S.tokpos = S.pos;
    }
    var prev_was_dot = !1;
    function token(type, value, is_comment) {
        S.regex_allowed = "operator" == type && !UNARY_POSTFIX(value) || "keyword" == type && KEYWORDS_BEFORE_EXPRESSION(value) || "punc" == type && PUNC_BEFORE_EXPRESSION(value) || "arrow" == type, 
        "punc" == type && "." == value ? prev_was_dot = !0 : is_comment || (prev_was_dot = !1);
        var ret = {
            type,
            value,
            line: S.tokline,
            col: S.tokcol,
            pos: S.tokpos,
            endline: S.line,
            endcol: S.col,
            endpos: S.pos,
            nlb: S.newline_before,
            file: filename
        };
        return /^(?:num|string|regexp)$/i.test(type) && (ret.raw = $TEXT.substring(ret.pos, ret.endpos)), 
        is_comment || (ret.comments_before = S.comments_before, ret.comments_after = S.comments_before = []), 
        S.newline_before = !1, new AST_Token(ret);
    }
    function skip_whitespace() {
        for (;WHITESPACE_CHARS(peek()); ) next();
    }
    function parse_error(err) {
        js_error(err, filename, S.tokline, S.tokcol, S.tokpos);
    }
    function read_num(prefix) {
        var has_e = !1, after_e = !1, has_x = !1, has_dot = "." == prefix, num = function(pred) {
            for (var ch, ret = "", i = 0; (ch = peek()) && pred(ch, i++); ) ret += next();
            return ret;
        }(function(ch, i) {
            switch (ch.charCodeAt(0)) {
              case 98:
              case 66:
                return has_x = !0;

              case 111:
              case 79:
              case 120:
              case 88:
                return !has_x && (has_x = !0);

              case 101:
              case 69:
                return !!has_x || !has_e && (has_e = after_e = !0);

              case 45:
                return after_e || 0 == i && !prefix;

              case 43:
                return after_e;

              case after_e = !1, 46:
                return !(has_dot || has_x || has_e) && (has_dot = !0);
            }
            return RE_NUM_LITERAL.test(ch);
        });
        prefix && (num = prefix + num), RE_OCT_NUMBER.test(num) && next_token.has_directive("use strict") && parse_error("Legacy octal literals are not allowed in strict mode");
        var valid = function(num) {
            if (RE_HEX_NUMBER.test(num)) return parseInt(num.substr(2), 16);
            if (RE_OCT_NUMBER.test(num)) return parseInt(num.substr(1), 8);
            if (RE_ES6_OCT_NUMBER.test(num)) return parseInt(num.substr(2), 8);
            if (RE_BIN_NUMBER.test(num)) return parseInt(num.substr(2), 2);
            if (RE_DEC_NUMBER.test(num)) return parseFloat(num);
            var val = parseFloat(num);
            return val == num ? val : void 0;
        }(num);
        if (!isNaN(valid)) return token("num", valid);
        parse_error("Invalid syntax: " + num);
    }
    function read_escaped_char(in_string) {
        var code, ch = next(!0, in_string);
        switch (ch.charCodeAt(0)) {
          case 110:
            return "\n";

          case 114:
            return "\r";

          case 116:
            return "\t";

          case 98:
            return "\b";

          case 118:
            return "\v";

          case 102:
            return "\f";

          case 120:
            return String.fromCharCode(hex_bytes(2));

          case 117:
            if ("{" == peek()) {
                for (next(!0), "}" === peek() && parse_error("Expecting hex-character between {}"); "0" == peek(); ) next(!0);
                var result, length = find("}", !0) - S.pos;
                return (length > 6 || (result = hex_bytes(length)) > 1114111) && parse_error("Unicode reference out of bounce"), 
                next(!0), (code = result) > 65535 ? (code -= 65536, String.fromCharCode(55296 + (code >> 10)) + String.fromCharCode(code % 1024 + 56320)) : String.fromCharCode(code);
            }
            return String.fromCharCode(hex_bytes(4));

          case 10:
            return "";

          case 13:
            if ("\n" == peek()) return next(!0, in_string), "";
        }
        return ch >= "0" && ch <= "7" ? function(ch) {
            var p = peek();
            p >= "0" && p <= "7" && (ch += next(!0))[0] <= "3" && (p = peek()) >= "0" && p <= "7" && (ch += next(!0));
            if ("0" === ch) return "\0";
            ch.length > 0 && next_token.has_directive("use strict") && parse_error("Legacy octal escape sequences are not allowed in strict mode");
            return String.fromCharCode(parseInt(ch, 8));
        }(ch) : ch;
    }
    function hex_bytes(n) {
        for (var num = 0; n > 0; --n) {
            var digit = parseInt(next(!0), 16);
            isNaN(digit) && parse_error("Invalid hex-character pattern in string"), num = num << 4 | digit;
        }
        return num;
    }
    var read_string = with_eof_error("Unterminated string constant", function(quote_char) {
        for (var quote = next(), ret = ""; ;) {
            var ch = next(!0, !0);
            if ("\\" == ch) ch = read_escaped_char(!0); else if (NEWLINE_CHARS(ch)) parse_error("Unterminated string constant"); else if (ch == quote) break;
            ret += ch;
        }
        var tok = token("string", ret);
        return tok.quote = quote_char, tok;
    }), read_template_characters = with_eof_error("Unterminated template", function(begin) {
        begin && S.template_braces.push(S.brace_counter);
        var ch, tok, content = "", raw = "";
        for (next(!0, !0); "`" != (ch = next(!0, !0)); ) {
            if ("\r" == ch) "\n" == peek() && ++S.pos, ch = "\n"; else if ("$" == ch && "{" == peek()) return next(!0, !0), 
            S.brace_counter++, (tok = token(begin ? "template_head" : "template_substitution", content)).begin = begin, 
            tok.raw = raw, tok.end = !1, tok;
            if (raw += ch, "\\" == ch) {
                var tmp = S.pos;
                ch = read_escaped_char(), raw += S.text.substr(tmp, S.pos - tmp);
            }
            content += ch;
        }
        return S.template_braces.pop(), (tok = token(begin ? "template_head" : "template_substitution", content)).begin = begin, 
        tok.raw = raw, tok.end = !0, tok;
    });
    function skip_line_comment(type) {
        var ret, regex_allowed = S.regex_allowed, i = function() {
            for (var text = S.text, i = S.pos, n = S.text.length; i < n; ++i) {
                var ch = text[i];
                if (NEWLINE_CHARS(ch)) return i;
            }
            return -1;
        }();
        return -1 == i ? (ret = S.text.substr(S.pos), S.pos = S.text.length) : (ret = S.text.substring(S.pos, i), 
        S.pos = i), S.col = S.tokcol + (S.pos - S.tokpos), S.comments_before.push(token(type, ret, !0)), 
        S.regex_allowed = regex_allowed, next_token;
    }
    var skip_multiline_comment = with_eof_error("Unterminated multiline comment", function() {
        var regex_allowed = S.regex_allowed, i = find("*/", !0), text = S.text.substring(S.pos, i).replace(/\r\n|\r|\u2028|\u2029/g, "\n");
        return forward(function(str) {
            for (var surrogates = 0, i = 0; i < str.length; i++) is_surrogate_pair_head(str.charCodeAt(i)) && is_surrogate_pair_tail(str.charCodeAt(i + 1)) && (surrogates++, 
            i++);
            return str.length - surrogates;
        }(text) + 2), S.comments_before.push(token("comment2", text, !0)), S.newline_before = S.newline_before || text.indexOf("\n") >= 0, 
        S.regex_allowed = regex_allowed, next_token;
    }), read_name = with_eof_error("Unterminated identifier name", function() {
        var ch, name = "", escaped = !1, read_escaped_identifier_char = function() {
            return escaped = !0, next(), "u" !== peek() && parse_error("Expecting UnicodeEscapeSequence -- uXXXX or u{XXXX}"), 
            read_escaped_char();
        };
        if ("\\" === (name = peek())) is_identifier_start(name = read_escaped_identifier_char()) || parse_error("First identifier char is an invalid identifier char"); else {
            if (!is_identifier_start(name)) return "";
            next();
        }
        for (;null != (ch = peek()); ) {
            if ("\\" === (ch = peek())) is_identifier_char(ch = read_escaped_identifier_char()) || parse_error("Invalid escaped identifier char"); else {
                if (!is_identifier_char(ch)) break;
                next();
            }
            name += ch;
        }
        return RESERVED_WORDS(name) && escaped && parse_error("Escaped characters are not allowed in keywords"), 
        name;
    }), read_regexp = with_eof_error("Unterminated regular expression", function(source) {
        for (var ch, prev_backslash = !1, in_class = !1; ch = next(!0); ) if (NEWLINE_CHARS(ch)) parse_error("Unexpected line terminator"); else if (prev_backslash) source += "\\" + ch, 
        prev_backslash = !1; else if ("[" == ch) in_class = !0, source += ch; else if ("]" == ch && in_class) in_class = !1, 
        source += ch; else {
            if ("/" == ch && !in_class) break;
            "\\" == ch ? prev_backslash = !0 : source += ch;
        }
        var mods = read_name();
        try {
            var regexp = new RegExp(source, mods);
            return regexp.raw_source = source, token("regexp", regexp);
        } catch (e) {
            parse_error(e.message);
        }
    });
    function read_operator(prefix) {
        return token("operator", function grow(op) {
            if (!peek()) return op;
            var bigger = op + peek();
            return OPERATORS(bigger) ? (next(), grow(bigger)) : op;
        }(prefix || next()));
    }
    function handle_slash() {
        switch (next(), peek()) {
          case "/":
            return next(), skip_line_comment("comment1");

          case "*":
            return next(), skip_multiline_comment();
        }
        return S.regex_allowed ? read_regexp("") : read_operator("/");
    }
    function with_eof_error(eof_error, cont) {
        return function(x) {
            try {
                return cont(x);
            } catch (ex) {
                if (ex !== EX_EOF) throw ex;
                parse_error(eof_error);
            }
        };
    }
    function next_token(force_regexp) {
        if (null != force_regexp) return read_regexp(force_regexp);
        for (shebang && 0 == S.pos && looking_at("#!") && (start_token(), forward(2), skip_line_comment("comment5")); ;) {
            if (skip_whitespace(), start_token(), html5_comments) {
                if (looking_at("\x3c!--")) {
                    forward(4), skip_line_comment("comment3");
                    continue;
                }
                if (looking_at("--\x3e") && S.newline_before) {
                    forward(3), skip_line_comment("comment4");
                    continue;
                }
            }
            var ch = peek();
            if (!ch) return token("eof");
            var code = ch.charCodeAt(0);
            switch (code) {
              case 34:
              case 39:
                return read_string(ch);

              case 46:
                return next(), is_digit(peek().charCodeAt(0)) ? read_num(".") : "." === peek() ? (next(), 
                next(), token("expand", "...")) : token("punc", ".");

              case 47:
                var tok = handle_slash();
                if (tok === next_token) continue;
                return tok;

              case 61:
                return next(), ">" === peek() ? (next(), token("arrow", "=>")) : read_operator("=");

              case 96:
                return read_template_characters(!0);

              case 123:
                S.brace_counter++;
                break;

              case 125:
                if (S.brace_counter--, S.template_braces.length > 0 && S.template_braces[S.template_braces.length - 1] === S.brace_counter) return read_template_characters(!1);
            }
            if (is_digit(code)) return read_num();
            if (PUNC_CHARS(ch)) return token("punc", next());
            if (OPERATOR_CHARS(ch)) return read_operator();
            if (92 == code || is_identifier_start(ch)) return void 0, word = read_name(), prev_was_dot ? token("name", word) : KEYWORDS_ATOM(word) ? token("atom", word) : KEYWORDS(word) ? OPERATORS(word) ? token("operator", word) : token("keyword", word) : token("name", word);
            break;
        }
        var word;
        parse_error("Unexpected character '" + ch + "'");
    }
    return next_token.next = next, next_token.peek = peek, next_token.context = function(nc) {
        return nc && (S = nc), S;
    }, next_token.add_directive = function(directive) {
        S.directive_stack[S.directive_stack.length - 1].push(directive), void 0 === S.directives[directive] ? S.directives[directive] = 1 : S.directives[directive]++;
    }, next_token.push_directives_stack = function() {
        S.directive_stack.push([]);
    }, next_token.pop_directives_stack = function() {
        for (var directives = S.directive_stack[S.directive_stack.length - 1], i = 0; i < directives.length; i++) S.directives[directives[i]]--;
        S.directive_stack.pop();
    }, next_token.has_directive = function(directive) {
        return S.directives[directive] > 0;
    }, next_token;
}

var UNARY_PREFIX = makePredicate([ "typeof", "void", "delete", "--", "++", "!", "~", "-", "+" ]), UNARY_POSTFIX = makePredicate([ "--", "++" ]), ASSIGNMENT = makePredicate([ "=", "+=", "-=", "/=", "*=", "**=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&=" ]), PRECEDENCE = function(a, ret) {
    for (var i = 0; i < a.length; ++i) for (var b = a[i], j = 0; j < b.length; ++j) ret[b[j]] = i + 1;
    return ret;
}([ [ "||" ], [ "&&" ], [ "|" ], [ "^" ], [ "&" ], [ "==", "===", "!=", "!==" ], [ "<", ">", "<=", ">=", "in", "instanceof" ], [ ">>", "<<", ">>>" ], [ "+", "-" ], [ "*", "/", "%" ], [ "**" ] ], {}), ATOMIC_START_TOKEN = makePredicate([ "atom", "num", "string", "regexp", "name" ]);

function parse($TEXT, options) {
    options = defaults(options, {
        bare_returns: !1,
        ecma: 8,
        expression: !1,
        filename: null,
        html5_comments: !0,
        shebang: !0,
        strict: !1,
        toplevel: null
    }, !0);
    var S = {
        input: "string" == typeof $TEXT ? tokenizer($TEXT, options.filename, options.html5_comments, options.shebang) : $TEXT,
        token: null,
        prev: null,
        peeked: null,
        in_function: 0,
        in_async: -1,
        in_generator: -1,
        in_directives: !0,
        in_loop: 0,
        labels: []
    };
    function is(type, value) {
        return is_token(S.token, type, value);
    }
    function peek() {
        return S.peeked || (S.peeked = S.input());
    }
    function next() {
        return S.prev = S.token, S.peeked ? (S.token = S.peeked, S.peeked = null) : S.token = S.input(), 
        S.in_directives = S.in_directives && ("string" == S.token.type || is("punc", ";")), 
        S.token;
    }
    function prev() {
        return S.prev;
    }
    function croak(msg, line, col, pos) {
        var ctx = S.input.context();
        js_error(msg, ctx.filename, null != line ? line : ctx.tokline, null != col ? col : ctx.tokcol, null != pos ? pos : ctx.tokpos);
    }
    function token_error(token, msg) {
        croak(msg, token.line, token.col);
    }
    function unexpected(token) {
        null == token && (token = S.token), token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
    }
    function expect_token(type, val) {
        if (is(type, val)) return next();
        token_error(S.token, "Unexpected token " + S.token.type + " «" + S.token.value + "», expected " + type + " «" + val + "»");
    }
    function expect(punc) {
        return expect_token("punc", punc);
    }
    function has_newline_before(token) {
        return token.nlb || !all(token.comments_before, function(comment) {
            return !comment.nlb;
        });
    }
    function can_insert_semicolon() {
        return !options.strict && (is("eof") || is("punc", "}") || has_newline_before(S.token));
    }
    function is_in_generator() {
        return S.in_generator === S.in_function;
    }
    function is_in_async() {
        return S.in_async === S.in_function;
    }
    function semicolon(optional) {
        is("punc", ";") ? next() : optional || can_insert_semicolon() || unexpected();
    }
    function parenthesised() {
        expect("(");
        var exp = expression(!0);
        return expect(")"), exp;
    }
    function embed_tokens(parser) {
        return function() {
            var start = S.token, expr = parser.apply(null, arguments), end = prev();
            return expr.start = start, expr.end = end, expr;
        };
    }
    function handle_regexp() {
        (is("operator", "/") || is("operator", "/=")) && (S.peeked = null, S.token = S.input(S.token.value.substr(1)));
    }
    S.token = next();
    var statement = embed_tokens(function(is_export_default) {
        switch (handle_regexp(), S.token.type) {
          case "string":
            if (S.in_directives) {
                var token = peek();
                -1 == S.token.raw.indexOf("\\") && (is_token(token, "punc", ";") || is_token(token, "punc", "}") || has_newline_before(token) || is_token(token, "eof")) ? S.input.add_directive(S.token.value) : S.in_directives = !1;
            }
            var dir = S.in_directives, stat = simple_statement();
            return dir ? new AST_Directive(stat.body) : stat;

          case "template_head":
          case "num":
          case "regexp":
          case "operator":
          case "atom":
            return simple_statement();

          case "name":
            if ("async" == S.token.value && is_token(peek(), "keyword", "function")) return next(), 
            next(), function_(AST_Defun, !1, !0, is_export_default);
            if ("import" == S.token.value && !is_token(peek(), "punc", "(")) {
                next();
                var node = function() {
                    var imported_name, imported_names, start = prev();
                    is("name") && (imported_name = as_symbol(AST_SymbolImport));
                    is("punc", ",") && next();
                    ((imported_names = map_names(!0)) || imported_name) && expect_token("name", "from");
                    var mod_str = S.token;
                    "string" !== mod_str.type && unexpected();
                    return next(), new AST_Import({
                        start,
                        imported_name,
                        imported_names,
                        module_name: new AST_String({
                            start: mod_str,
                            value: mod_str.value,
                            quote: mod_str.quote,
                            end: mod_str
                        }),
                        end: S.token
                    });
                }();
                return semicolon(), node;
            }
            return is_token(peek(), "punc", ":") ? function() {
                var label = as_symbol(AST_Label);
                "await" === label.name && is_in_async() && token_error(S.prev, "await cannot be used as label inside async function");
                find_if(function(l) {
                    return l.name == label.name;
                }, S.labels) && croak("Label " + label.name + " defined twice");
                expect(":"), S.labels.push(label);
                var stat = statement();
                S.labels.pop(), stat instanceof AST_IterationStatement || label.references.forEach(function(ref) {
                    ref instanceof AST_Continue && (ref = ref.label.start, croak("Continue label `" + label.name + "` refers to non-IterationStatement.", ref.line, ref.col, ref.pos));
                });
                return new AST_LabeledStatement({
                    body: stat,
                    label
                });
            }() : simple_statement();

          case "punc":
            switch (S.token.value) {
              case "{":
                return new AST_BlockStatement({
                    start: S.token,
                    body: block_(),
                    end: prev()
                });

              case "[":
              case "(":
                return simple_statement();

              case ";":
                return S.in_directives = !1, next(), new AST_EmptyStatement();

              default:
                unexpected();
            }

          case "keyword":
            switch (S.token.value) {
              case "break":
                return next(), break_cont(AST_Break);

              case "continue":
                return next(), break_cont(AST_Continue);

              case "debugger":
                return next(), semicolon(), new AST_Debugger();

              case "do":
                next();
                var body = in_loop(statement);
                expect_token("keyword", "while");
                var condition = parenthesised();
                return semicolon(!0), new AST_Do({
                    body,
                    condition
                });

              case "while":
                return next(), new AST_While({
                    condition: parenthesised(),
                    body: in_loop(statement)
                });

              case "for":
                return next(), function() {
                    expect("(");
                    var init = null;
                    if (!is("punc", ";")) {
                        init = is("keyword", "var") ? (next(), var_(!0)) : is("keyword", "let") ? (next(), 
                        let_(!0)) : is("keyword", "const") ? (next(), const_(!0)) : expression(!0, !0);
                        var is_in = is("operator", "in"), is_of = is("name", "of");
                        if (is_in || is_of) return init instanceof AST_Definitions ? init.definitions.length > 1 && croak("Only one variable declaration allowed in for..in loop", init.start.line, init.start.col, init.start.pos) : is_assignable(init) || (init = to_destructuring(init)) instanceof AST_Destructuring || croak("Invalid left-hand side in for..in loop", init.start.line, init.start.col, init.start.pos), 
                        next(), is_in ? function(init) {
                            var obj = expression(!0);
                            return expect(")"), new AST_ForIn({
                                init,
                                object: obj,
                                body: in_loop(statement)
                            });
                        }(init) : function(init) {
                            var lhs = init instanceof AST_Definitions ? init.definitions[0].name : null, obj = expression(!0);
                            return expect(")"), new AST_ForOf({
                                init,
                                name: lhs,
                                object: obj,
                                body: in_loop(statement)
                            });
                        }(init);
                    }
                    return function(init) {
                        expect(";");
                        var test = is("punc", ";") ? null : expression(!0);
                        expect(";");
                        var step = is("punc", ")") ? null : expression(!0);
                        return expect(")"), new AST_For({
                            init,
                            condition: test,
                            step,
                            body: in_loop(statement)
                        });
                    }(init);
                }();

              case "class":
                return next(), class_(AST_DefClass);

              case "function":
                return next(), function_(AST_Defun, !1, !1, is_export_default);

              case "if":
                return next(), function() {
                    var cond = parenthesised(), body = statement(), belse = null;
                    is("keyword", "else") && (next(), belse = statement());
                    return new AST_If({
                        condition: cond,
                        body,
                        alternative: belse
                    });
                }();

              case "return":
                0 != S.in_function || options.bare_returns || croak("'return' outside of function"), 
                next();
                var value = null;
                return is("punc", ";") ? next() : can_insert_semicolon() || (value = expression(!0), 
                semicolon()), new AST_Return({
                    value
                });

              case "switch":
                return next(), new AST_Switch({
                    expression: parenthesised(),
                    body: in_loop(switch_body_)
                });

              case "throw":
                next(), has_newline_before(S.token) && croak("Illegal newline after 'throw'");
                value = expression(!0);
                return semicolon(), new AST_Throw({
                    value
                });

              case "try":
                return next(), function() {
                    var body = block_(), bcatch = null, bfinally = null;
                    if (is("keyword", "catch")) {
                        var start = S.token;
                        next(), expect("(");
                        var name = parameter(void 0, AST_SymbolCatch);
                        expect(")"), bcatch = new AST_Catch({
                            start,
                            argname: name,
                            body: block_(),
                            end: prev()
                        });
                    }
                    if (is("keyword", "finally")) {
                        var start = S.token;
                        next(), bfinally = new AST_Finally({
                            start,
                            body: block_(),
                            end: prev()
                        });
                    }
                    bcatch || bfinally || croak("Missing catch/finally blocks");
                    return new AST_Try({
                        body,
                        bcatch,
                        bfinally
                    });
                }();

              case "var":
                next();
                node = var_();
                return semicolon(), node;

              case "let":
                next();
                node = let_();
                return semicolon(), node;

              case "const":
                next();
                node = const_();
                return semicolon(), node;

              case "with":
                return S.input.has_directive("use strict") && croak("Strict mode may not include a with statement"), 
                next(), new AST_With({
                    expression: parenthesised(),
                    body: statement()
                });

              case "export":
                if (!is_token(peek(), "punc", "(")) return next(), function() {
                    var is_default, exported_names, node, exported_value, exported_definition, start = S.token;
                    if (is("keyword", "default")) is_default = !0, next(); else if (exported_names = map_names(!1)) {
                        if (is("name", "from")) {
                            next();
                            var mod_str = S.token;
                            return "string" !== mod_str.type && unexpected(), next(), new AST_Export({
                                start,
                                is_default,
                                exported_names,
                                module_name: new AST_String({
                                    start: mod_str,
                                    value: mod_str.value,
                                    quote: mod_str.quote,
                                    end: mod_str
                                }),
                                end: prev()
                            });
                        }
                        return new AST_Export({
                            start,
                            is_default,
                            exported_names,
                            end: prev()
                        });
                    }
                    is("punc", "{") || is_default && (is("keyword", "class") || is("keyword", "function")) && is_token(peek(), "punc") ? (exported_value = expression(!1), 
                    semicolon()) : (node = statement(is_default)) instanceof AST_Definitions && is_default ? unexpected(node.start) : node instanceof AST_Definitions || node instanceof AST_Lambda || node instanceof AST_DefClass ? exported_definition = node : node instanceof AST_SimpleStatement ? exported_value = node.body : unexpected(node.start);
                    return new AST_Export({
                        start,
                        is_default,
                        exported_value,
                        exported_definition,
                        end: prev()
                    });
                }();
            }
        }
        unexpected();
    });
    function simple_statement(tmp) {
        return new AST_SimpleStatement({
            body: (tmp = expression(!0), semicolon(), tmp)
        });
    }
    function break_cont(type) {
        var ldef, label = null;
        can_insert_semicolon() || (label = as_symbol(AST_LabelRef, !0)), null != label ? ((ldef = find_if(function(l) {
            return l.name == label.name;
        }, S.labels)) || croak("Undefined label " + label.name), label.thedef = ldef) : 0 == S.in_loop && croak(type.TYPE + " not inside a loop or switch"), 
        semicolon();
        var stat = new type({
            label
        });
        return ldef && ldef.references.push(stat), stat;
    }
    var arrow_function = function(start, argnames, is_async) {
        has_newline_before(S.token) && croak("Unexpected newline before arrow (=>)"), expect_token("arrow", "=>");
        var body = _function_body(is("punc", "{"), !1, is_async);
        return new AST_Arrow({
            start,
            end: body.end,
            async: is_async,
            argnames,
            body
        });
    }, function_ = function(ctor, is_generator_property, is_async, is_export_default) {
        is_generator_property && is_async && croak("generators cannot be async");
        S.token;
        var in_statement = ctor === AST_Defun, is_generator = is("operator", "*");
        is_generator && next();
        var name = is("name") ? as_symbol(in_statement ? AST_SymbolDefun : AST_SymbolLambda) : null;
        in_statement && !name && (is_export_default ? ctor = AST_Function : unexpected()), 
        !name || ctor === AST_Accessor || name instanceof AST_SymbolDeclaration || unexpected(prev());
        var args = [], body = _function_body(!0, is_generator || is_generator_property, is_async, name, args);
        return new ctor({
            start: args.start,
            end: body.end,
            is_generator,
            async: is_async,
            name,
            argnames: args,
            body
        });
    };
    function track_used_binding_identifiers(is_parameter, strict) {
        var parameters = {}, duplicate = !1, default_assignment = !1, spread = !1, strict_mode = !!strict, tracker = {
            add_parameter: function(token) {
                if (void 0 !== parameters["$" + token.value]) !1 === duplicate && (duplicate = token), 
                tracker.check_strict(); else if (parameters["$" + token.value] = !0, is_parameter) switch (token.value) {
                  case "arguments":
                  case "eval":
                  case "yield":
                    strict_mode && token_error(token, "Unexpected " + token.value + " identifier as parameter inside strict mode");
                    break;

                  default:
                    RESERVED_WORDS(token.value) && unexpected();
                }
            },
            mark_default_assignment: function(token) {
                !1 === default_assignment && (default_assignment = token);
            },
            mark_spread: function(token) {
                !1 === spread && (spread = token);
            },
            mark_strict_mode: function() {
                strict_mode = !0;
            },
            is_strict: function() {
                return !1 !== default_assignment || !1 !== spread || strict_mode;
            },
            check_strict: function() {
                tracker.is_strict() && !1 !== duplicate && token_error(duplicate, "Parameter " + duplicate.value + " was used already");
            }
        };
        return tracker;
    }
    function parameter(used_parameters, symbol_type) {
        var param, expand = !1;
        return void 0 === used_parameters && (used_parameters = track_used_binding_identifiers(!0, S.input.has_directive("use strict"))), 
        is("expand", "...") && (expand = S.token, used_parameters.mark_spread(S.token), 
        next()), param = binding_element(used_parameters, symbol_type), is("operator", "=") && !1 === expand && (used_parameters.mark_default_assignment(S.token), 
        next(), param = new AST_DefaultAssign({
            start: param.start,
            left: param,
            operator: "=",
            right: expression(!1),
            end: S.token
        })), !1 !== expand && (is("punc", ")") || unexpected(), param = new AST_Expansion({
            start: expand,
            expression: param,
            end: expand
        })), used_parameters.check_strict(), param;
    }
    function binding_element(used_parameters, symbol_type) {
        var expand_token, elements = [], first = !0, is_expand = !1, first_token = S.token;
        if (void 0 === used_parameters && (used_parameters = track_used_binding_identifiers(!1, S.input.has_directive("use strict"))), 
        symbol_type = void 0 === symbol_type ? AST_SymbolFunarg : symbol_type, is("punc", "[")) {
            for (next(); !is("punc", "]"); ) {
                if (first ? first = !1 : expect(","), is("expand", "...") && (is_expand = !0, expand_token = S.token, 
                used_parameters.mark_spread(S.token), next()), is("punc")) switch (S.token.value) {
                  case ",":
                    elements.push(new AST_Hole({
                        start: S.token,
                        end: S.token
                    }));
                    continue;

                  case "]":
                    break;

                  case "[":
                  case "{":
                    elements.push(binding_element(used_parameters, symbol_type));
                    break;

                  default:
                    unexpected();
                } else is("name") ? (used_parameters.add_parameter(S.token), elements.push(as_symbol(symbol_type))) : croak("Invalid function parameter");
                is("operator", "=") && !1 === is_expand && (used_parameters.mark_default_assignment(S.token), 
                next(), elements[elements.length - 1] = new AST_DefaultAssign({
                    start: elements[elements.length - 1].start,
                    left: elements[elements.length - 1],
                    operator: "=",
                    right: expression(!1),
                    end: S.token
                })), is_expand && (is("punc", "]") || croak("Rest element must be last element"), 
                elements[elements.length - 1] = new AST_Expansion({
                    start: expand_token,
                    expression: elements[elements.length - 1],
                    end: expand_token
                }));
            }
            return expect("]"), used_parameters.check_strict(), new AST_Destructuring({
                start: first_token,
                names: elements,
                is_array: !0,
                end: prev()
            });
        }
        if (is("punc", "{")) {
            for (next(); !is("punc", "}"); ) {
                if (first ? first = !1 : expect(","), is("expand", "...") && (is_expand = !0, expand_token = S.token, 
                used_parameters.mark_spread(S.token), next()), is("name") && (is_token(peek(), "punc") || is_token(peek(), "operator")) && -1 !== [ ",", "}", "=" ].indexOf(peek().value)) {
                    used_parameters.add_parameter(S.token);
                    var start = prev(), value = as_symbol(symbol_type);
                    is_expand ? elements.push(new AST_Expansion({
                        start: expand_token,
                        expression: value,
                        end: value.end
                    })) : elements.push(new AST_ObjectKeyVal({
                        start,
                        key: value.name,
                        value,
                        end: value.end
                    }));
                } else {
                    if (is("punc", "}")) continue;
                    var property_token = S.token, property = as_property_name();
                    null === property ? unexpected(prev()) : "name" !== prev().type || is("punc", ":") ? (expect(":"), 
                    elements.push(new AST_ObjectKeyVal({
                        start: property_token,
                        quote: property_token.quote,
                        key: property,
                        value: binding_element(used_parameters, symbol_type),
                        end: prev()
                    }))) : elements.push(new AST_ObjectKeyVal({
                        start: prev(),
                        key: property,
                        value: new symbol_type({
                            start: prev(),
                            name: property,
                            end: prev()
                        }),
                        end: prev()
                    }));
                }
                is_expand ? is("punc", "}") || croak("Rest element must be last element") : is("operator", "=") && (used_parameters.mark_default_assignment(S.token), 
                next(), elements[elements.length - 1].value = new AST_DefaultAssign({
                    start: elements[elements.length - 1].value.start,
                    left: elements[elements.length - 1].value,
                    operator: "=",
                    right: expression(!1),
                    end: S.token
                }));
            }
            return expect("}"), used_parameters.check_strict(), new AST_Destructuring({
                start: first_token,
                names: elements,
                is_array: !1,
                end: prev()
            });
        }
        if (is("name")) return used_parameters.add_parameter(S.token), as_symbol(symbol_type);
        croak("Invalid function parameter");
    }
    function _function_body(block, generator, is_async, name, args) {
        var loop = S.in_loop, labels = S.labels, current_generator = S.in_generator, current_async = S.in_async;
        if (++S.in_function, generator && (S.in_generator = S.in_function), is_async && (S.in_async = S.in_function), 
        args && function(params) {
            S.token;
            var used_parameters = track_used_binding_identifiers(!0, S.input.has_directive("use strict"));
            for (expect("("); !is("punc", ")"); ) {
                var param = parameter(used_parameters);
                if (params.push(param), is("punc", ")") || (expect(","), is("punc", ")") && options.ecma < 8 && unexpected()), 
                param instanceof AST_Expansion) break;
            }
            next();
        }(args), block && (S.in_directives = !0), S.in_loop = 0, S.labels = [], block) {
            S.input.push_directives_stack();
            var a = block_();
            name && _verify_symbol(name), args && args.forEach(_verify_symbol), S.input.pop_directives_stack();
        } else a = expression(!1);
        return --S.in_function, S.in_loop = loop, S.labels = labels, S.in_generator = current_generator, 
        S.in_async = current_async, a;
    }
    function block_() {
        expect("{");
        for (var a = []; !is("punc", "}"); ) is("eof") && unexpected(), a.push(statement());
        return next(), a;
    }
    function switch_body_() {
        expect("{");
        for (var tmp, a = [], cur = null, branch = null; !is("punc", "}"); ) is("eof") && unexpected(), 
        is("keyword", "case") ? (branch && (branch.end = prev()), cur = [], branch = new AST_Case({
            start: (tmp = S.token, next(), tmp),
            expression: expression(!0),
            body: cur
        }), a.push(branch), expect(":")) : is("keyword", "default") ? (branch && (branch.end = prev()), 
        cur = [], branch = new AST_Default({
            start: (tmp = S.token, next(), expect(":"), tmp),
            body: cur
        }), a.push(branch)) : (cur || unexpected(), cur.push(statement()));
        return branch && (branch.end = prev()), next(), a;
    }
    function vardefs(no_in, kind) {
        for (var def, a = []; ;) {
            var sym_type = "var" === kind ? AST_SymbolVar : "const" === kind ? AST_SymbolConst : "let" === kind ? AST_SymbolLet : null;
            if (is("punc", "{") || is("punc", "[") ? def = new AST_VarDef({
                start: S.token,
                name: binding_element(void 0, sym_type),
                value: is("operator", "=") ? (expect_token("operator", "="), expression(!1, no_in)) : null,
                end: prev()
            }) : "import" == (def = new AST_VarDef({
                start: S.token,
                name: as_symbol(sym_type),
                value: is("operator", "=") ? (next(), expression(!1, no_in)) : no_in || "const" !== kind ? null : croak("Missing initializer in const declaration"),
                end: prev()
            })).name.name && croak("Unexpected token: import"), a.push(def), !is("punc", ",")) break;
            next();
        }
        return a;
    }
    var var_ = function(no_in) {
        return new AST_Var({
            start: prev(),
            definitions: vardefs(no_in, "var"),
            end: prev()
        });
    }, let_ = function(no_in) {
        return new AST_Let({
            start: prev(),
            definitions: vardefs(no_in, "let"),
            end: prev()
        });
    }, const_ = function(no_in) {
        return new AST_Const({
            start: prev(),
            definitions: vardefs(no_in, "const"),
            end: prev()
        });
    };
    function as_atom_node() {
        var ret, tok = S.token;
        switch (tok.type) {
          case "name":
            ret = _make_symbol(AST_SymbolRef);
            break;

          case "num":
            ret = new AST_Number({
                start: tok,
                end: tok,
                value: tok.value
            });
            break;

          case "string":
            ret = new AST_String({
                start: tok,
                end: tok,
                value: tok.value,
                quote: tok.quote
            });
            break;

          case "regexp":
            ret = new AST_RegExp({
                start: tok,
                end: tok,
                value: tok.value
            });
            break;

          case "atom":
            switch (tok.value) {
              case "false":
                ret = new AST_False({
                    start: tok,
                    end: tok
                });
                break;

              case "true":
                ret = new AST_True({
                    start: tok,
                    end: tok
                });
                break;

              case "null":
                ret = new AST_Null({
                    start: tok,
                    end: tok
                });
            }
        }
        return next(), ret;
    }
    function to_fun_args(ex, _, __, default_seen_above) {
        var insert_default = function(ex, default_value) {
            return default_value ? new AST_DefaultAssign({
                start: ex.start,
                left: ex,
                operator: "=",
                right: default_value,
                end: default_value.end
            }) : ex;
        };
        return ex instanceof AST_Object ? insert_default(new AST_Destructuring({
            start: ex.start,
            end: ex.end,
            is_array: !1,
            names: ex.properties.map(to_fun_args)
        }), default_seen_above) : ex instanceof AST_ObjectKeyVal ? (ex.value = to_fun_args(ex.value, 0, [ ex.key ]), 
        insert_default(ex, default_seen_above)) : ex instanceof AST_Hole ? ex : ex instanceof AST_Destructuring ? (ex.names = ex.names.map(to_fun_args), 
        insert_default(ex, default_seen_above)) : ex instanceof AST_SymbolRef ? insert_default(new AST_SymbolFunarg({
            name: ex.name,
            start: ex.start,
            end: ex.end
        }), default_seen_above) : ex instanceof AST_Expansion ? (ex.expression = to_fun_args(ex.expression), 
        insert_default(ex, default_seen_above)) : ex instanceof AST_Array ? insert_default(new AST_Destructuring({
            start: ex.start,
            end: ex.end,
            is_array: !0,
            names: ex.elements.map(to_fun_args)
        }), default_seen_above) : ex instanceof AST_Assign ? insert_default(to_fun_args(ex.left, void 0, void 0, ex.right), default_seen_above) : ex instanceof AST_DefaultAssign ? (ex.left = to_fun_args(ex.left, 0, [ ex.left ]), 
        ex) : void croak("Invalid function parameter", ex.start.line, ex.start.col);
    }
    var expr_atom = function(allow_calls, allow_arrows) {
        if (is("operator", "new")) return function(allow_calls) {
            var start = S.token;
            if (expect_token("operator", "new"), is("punc", ".")) return next(), expect_token("name", "target"), 
            subscripts(new AST_NewTarget({
                start,
                end: prev()
            }), allow_calls);
            var args, newexp = expr_atom(!1);
            is("punc", "(") ? (next(), args = expr_list(")", options.ecma >= 8)) : args = [];
            var call = new AST_New({
                start,
                expression: newexp,
                args,
                end: prev()
            });
            return mark_pure(call), subscripts(call, allow_calls);
        }(allow_calls);
        var start = S.token, async = is("name", "async") && as_atom_node();
        if (is("punc")) {
            switch (S.token.value) {
              case "(":
                if (async && !allow_calls) break;
                var exprs = function(allow_arrows, maybe_sequence) {
                    var spread_token, invalid_sequence, trailing_comma, a = [];
                    for (expect("("); !is("punc", ")"); ) spread_token && unexpected(spread_token), 
                    is("expand", "...") ? (spread_token = S.token, maybe_sequence && (invalid_sequence = S.token), 
                    next(), a.push(new AST_Expansion({
                        start: prev(),
                        expression: expression(),
                        end: S.token
                    }))) : a.push(expression()), is("punc", ")") || (expect(","), is("punc", ")") && (options.ecma < 8 && unexpected(), 
                    trailing_comma = prev(), maybe_sequence && (invalid_sequence = trailing_comma)));
                    return expect(")"), allow_arrows && is("arrow", "=>") ? spread_token && trailing_comma && unexpected(trailing_comma) : invalid_sequence && unexpected(invalid_sequence), 
                    a;
                }(allow_arrows, !async);
                if (allow_arrows && is("arrow", "=>")) return arrow_function(start, exprs.map(to_fun_args), !!async);
                var ex = async ? new AST_Call({
                    expression: async,
                    args: exprs
                }) : 1 == exprs.length ? exprs[0] : new AST_Sequence({
                    expressions: exprs
                });
                if (ex.start) {
                    var len = start.comments_before.length;
                    if ([].unshift.apply(ex.start.comments_before, start.comments_before), start.comments_before = ex.start.comments_before, 
                    start.comments_before_length = len, 0 == len && start.comments_before.length > 0) {
                        var comment = start.comments_before[0];
                        comment.nlb || (comment.nlb = start.nlb, start.nlb = !1);
                    }
                    start.comments_after = ex.start.comments_after;
                }
                ex.start = start;
                var end = prev();
                return ex.end && (end.comments_before = ex.end.comments_before, [].push.apply(ex.end.comments_after, end.comments_after), 
                end.comments_after = ex.end.comments_after), ex.end = end, ex instanceof AST_Call && mark_pure(ex), 
                subscripts(ex, allow_calls);

              case "[":
                return subscripts(array_(), allow_calls);

              case "{":
                return subscripts(object_or_destructuring_(), allow_calls);
            }
            async || unexpected();
        }
        if (allow_arrows && is("name") && is_token(peek(), "arrow")) {
            var param = new AST_SymbolFunarg({
                name: S.token.value,
                start,
                end: start
            });
            return next(), arrow_function(start, [ param ], !!async);
        }
        if (is("keyword", "function")) {
            next();
            var func = function_(AST_Function, !1, !!async);
            return func.start = start, func.end = prev(), subscripts(func, allow_calls);
        }
        if (async) return subscripts(async, allow_calls);
        if (is("keyword", "class")) {
            next();
            var cls = class_(AST_ClassExpression);
            return cls.start = start, cls.end = prev(), subscripts(cls, allow_calls);
        }
        return is("template_head") ? subscripts(template_string(), allow_calls) : ATOMIC_START_TOKEN(S.token.type) ? subscripts(as_atom_node(), allow_calls) : void unexpected();
    };
    function template_string() {
        var segments = [], start = S.token;
        for (segments.push(new AST_TemplateSegment({
            start: S.token,
            raw: S.token.raw,
            value: S.token.value,
            end: S.token
        })); !1 === S.token.end; ) next(), handle_regexp(), segments.push(expression(!0)), 
        is_token("template_substitution") || unexpected(), segments.push(new AST_TemplateSegment({
            start: S.token,
            raw: S.token.raw,
            value: S.token.value,
            end: S.token
        }));
        return next(), new AST_TemplateString({
            start,
            segments,
            end: S.token
        });
    }
    function expr_list(closing, allow_trailing_comma, allow_empty) {
        for (var first = !0, a = []; !is("punc", closing) && (first ? first = !1 : expect(","), 
        !allow_trailing_comma || !is("punc", closing)); ) is("punc", ",") && allow_empty ? a.push(new AST_Hole({
            start: S.token,
            end: S.token
        })) : is("expand", "...") ? (next(), a.push(new AST_Expansion({
            start: prev(),
            expression: expression(),
            end: S.token
        }))) : a.push(expression(!1));
        return next(), a;
    }
    var array_ = embed_tokens(function() {
        return expect("["), new AST_Array({
            elements: expr_list("]", !options.strict, !0)
        });
    }), create_accessor = embed_tokens(function(is_generator, is_async) {
        return function_(AST_Accessor, is_generator, is_async);
    }), object_or_destructuring_ = embed_tokens(function() {
        var start = S.token, first = !0, a = [];
        for (expect("{"); !is("punc", "}") && (first ? first = !1 : expect(","), options.strict || !is("punc", "}")); ) if ("expand" != (start = S.token).type) {
            var value, name = as_property_name();
            if (is("punc", ":")) null === name ? unexpected(prev()) : (next(), value = expression(!1)); else {
                var concise = concise_method_or_getset(name, start);
                if (concise) {
                    a.push(concise);
                    continue;
                }
                value = new AST_SymbolRef({
                    start: prev(),
                    name,
                    end: prev()
                });
            }
            is("operator", "=") && (next(), value = new AST_Assign({
                start,
                left: value,
                operator: "=",
                right: expression(!1),
                end: prev()
            })), a.push(new AST_ObjectKeyVal({
                start,
                quote: start.quote,
                key: name instanceof AST_Node ? name : "" + name,
                value,
                end: prev()
            }));
        } else next(), a.push(new AST_Expansion({
            start,
            expression: expression(!1),
            end: prev()
        }));
        return next(), new AST_Object({
            properties: a
        });
    });
    function class_(KindOfClass) {
        var start, method, class_name, extends_, a = [];
        for (S.input.push_directives_stack(), S.input.add_directive("use strict"), "name" == S.token.type && "extends" != S.token.value && (class_name = as_symbol(KindOfClass === AST_DefClass ? AST_SymbolDefClass : AST_SymbolClass)), 
        KindOfClass !== AST_DefClass || class_name || unexpected(), "extends" == S.token.value && (next(), 
        extends_ = expression(!0)), expect("{"), is("punc", ";") && next(); !is("punc", "}"); ) start = S.token, 
        (method = concise_method_or_getset(as_property_name(), start, !0)) || unexpected(), 
        a.push(method), is("punc", ";") && next();
        return S.input.pop_directives_stack(), next(), new KindOfClass({
            start,
            name: class_name,
            extends: extends_,
            properties: a,
            end: prev()
        });
    }
    function concise_method_or_getset(name, start, is_class) {
        var get_ast = function(name, token) {
            return "string" == typeof name || "number" == typeof name ? new AST_SymbolMethod({
                start: token,
                name: "" + name,
                end: prev()
            }) : (null === name && unexpected(), name);
        }, is_async = !1, is_static = !1, is_generator = !1, property_token = start;
        if (is_class && "static" === name && !is("punc", "(") && (is_static = !0, property_token = S.token, 
        name = as_property_name()), "async" !== name || is("punc", "(") || is("punc", ",") || is("punc", "}") || (is_async = !0, 
        property_token = S.token, name = as_property_name()), null === name && (is_generator = !0, 
        property_token = S.token, null === (name = as_property_name()) && unexpected()), 
        is("punc", "(")) return name = get_ast(name, start), new AST_ConciseMethod({
            start,
            static: is_static,
            is_generator,
            async: is_async,
            key: name,
            quote: name instanceof AST_SymbolMethod ? property_token.quote : void 0,
            value: create_accessor(is_generator, is_async),
            end: prev()
        });
        if (property_token = S.token, "get" == name) {
            if (!is("punc") || is("punc", "[")) return name = get_ast(as_property_name(), start), 
            new AST_ObjectGetter({
                start,
                static: is_static,
                key: name,
                quote: name instanceof AST_SymbolMethod ? property_token.quote : void 0,
                value: create_accessor(),
                end: prev()
            });
        } else if ("set" == name && (!is("punc") || is("punc", "["))) return name = get_ast(as_property_name(), start), 
        new AST_ObjectSetter({
            start,
            static: is_static,
            key: name,
            quote: name instanceof AST_SymbolMethod ? property_token.quote : void 0,
            value: create_accessor(),
            end: prev()
        });
    }
    function map_name(is_import) {
        function make_symbol(type) {
            return new type({
                name: as_property_name(),
                start: prev(),
                end: prev()
            });
        }
        var foreign_name, name, foreign_type = is_import ? AST_SymbolImportForeign : AST_SymbolExportForeign, type = is_import ? AST_SymbolImport : AST_SymbolExport, start = S.token;
        return is_import ? foreign_name = make_symbol(foreign_type) : name = make_symbol(type), 
        is("name", "as") ? (next(), is_import ? name = make_symbol(type) : foreign_name = make_symbol(foreign_type)) : is_import ? name = new type(foreign_name) : foreign_name = new foreign_type(name), 
        new AST_NameMapping({
            start,
            foreign_name,
            name,
            end: prev()
        });
    }
    function map_names(is_import) {
        var names;
        if (is("punc", "{")) {
            for (next(), names = []; !is("punc", "}"); ) names.push(map_name(is_import)), is("punc", ",") && next();
            next();
        } else if (is("operator", "*")) {
            var name;
            next(), is_import && is("name", "as") && (next(), name = as_symbol(AST_SymbolImportForeign)), 
            names = [ function(is_import, name) {
                var foreign_name, foreign_type = is_import ? AST_SymbolImportForeign : AST_SymbolExportForeign, type = is_import ? AST_SymbolImport : AST_SymbolExport, start = S.token, end = prev();
                return name = name || new type({
                    name: "*",
                    start,
                    end
                }), foreign_name = new foreign_type({
                    name: "*",
                    start,
                    end
                }), new AST_NameMapping({
                    start,
                    foreign_name,
                    name,
                    end
                });
            }(is_import, name) ];
        }
        return names;
    }
    function as_property_name() {
        var tmp = S.token;
        switch (tmp.type) {
          case "punc":
            if ("[" === tmp.value) {
                next();
                var ex = expression(!1);
                return expect("]"), ex;
            }
            unexpected(tmp);

          case "operator":
            if ("*" === tmp.value) return next(), null;
            -1 === [ "delete", "in", "instanceof", "new", "typeof", "void" ].indexOf(tmp.value) && unexpected(tmp);

          case "name":
            "yield" == tmp.value && (is_in_generator() ? token_error(tmp, "Yield cannot be used as identifier inside generators") : is_token(peek(), "punc", ":") || is_token(peek(), "punc", "(") || !S.input.has_directive("use strict") || token_error(tmp, "Unexpected yield identifier inside strict mode"));

          case "string":
          case "num":
          case "keyword":
          case "atom":
            return next(), tmp.value;

          default:
            unexpected(tmp);
        }
    }
    function _make_symbol(type) {
        var name = S.token.value;
        return new ("this" == name ? AST_This : "super" == name ? AST_Super : type)({
            name: String(name),
            start: S.token,
            end: S.token
        });
    }
    function _verify_symbol(sym) {
        var name = sym.name;
        is_in_generator() && "yield" == name && token_error(sym.start, "Yield cannot be used as identifier inside generators"), 
        S.input.has_directive("use strict") && ("yield" == name && token_error(sym.start, "Unexpected yield identifier inside strict mode"), 
        sym instanceof AST_SymbolDeclaration && ("arguments" == name || "eval" == name) && token_error(sym.start, "Unexpected " + name + " in strict mode"));
    }
    function as_symbol(type, noerror) {
        if (!is("name")) return noerror || croak("Name expected"), null;
        var sym = _make_symbol(type);
        return _verify_symbol(sym), next(), sym;
    }
    function mark_pure(call) {
        for (var start = call.start, comments = start.comments_before, i = HOP(start, "comments_before_length") ? start.comments_before_length : comments.length; --i >= 0; ) {
            var comment = comments[i];
            if (/[@#]__PURE__/.test(comment.value)) {
                call.pure = comment;
                break;
            }
        }
    }
    var subscripts = function(expr, allow_calls) {
        var tmp, start = expr.start;
        if (is("punc", ".")) return next(), subscripts(new AST_Dot({
            start,
            expression: expr,
            property: (tmp = S.token, "name" != tmp.type && unexpected(), next(), tmp.value),
            end: prev()
        }), allow_calls);
        if (is("punc", "[")) {
            next();
            var prop = expression(!0);
            return expect("]"), subscripts(new AST_Sub({
                start,
                expression: expr,
                property: prop,
                end: prev()
            }), allow_calls);
        }
        if (allow_calls && is("punc", "(")) {
            next();
            var call = new AST_Call({
                start,
                expression: expr,
                args: call_args(),
                end: prev()
            });
            return mark_pure(call), subscripts(call, !0);
        }
        return is("template_head") ? subscripts(new AST_PrefixedTemplateString({
            start,
            prefix: expr,
            template_string: template_string()
        }), allow_calls) : expr;
    }, call_args = embed_tokens(function() {
        for (var args = []; !is("punc", ")"); ) is("expand", "...") ? (next(), args.push(new AST_Expansion({
            start: prev(),
            expression: expression(!1)
        }))) : args.push(expression(!1)), is("punc", ")") || (expect(","), is("punc", ")") && options.ecma < 8 && unexpected());
        return next(), args;
    }), maybe_unary = function(allow_calls, allow_arrows) {
        var start = S.token;
        if ("name" == start.type && "await" == start.value) {
            if (is_in_async()) return next(), is_in_async() || croak("Unexpected await expression outside async function", S.prev.line, S.prev.col, S.prev.pos), 
            new AST_Await({
                expression: maybe_unary(!0)
            });
            S.input.has_directive("use strict") && token_error(S.token, "Unexpected await identifier inside strict mode");
        }
        if (is("operator") && UNARY_PREFIX(start.value)) {
            next(), handle_regexp();
            var ex = make_unary(AST_UnaryPrefix, start, maybe_unary(allow_calls));
            return ex.start = start, ex.end = prev(), ex;
        }
        for (var val = expr_atom(allow_calls, allow_arrows); is("operator") && UNARY_POSTFIX(S.token.value) && !has_newline_before(S.token); ) val instanceof AST_Arrow && unexpected(), 
        (val = make_unary(AST_UnaryPostfix, S.token, val)).start = start, val.end = S.token, 
        next();
        return val;
    };
    function make_unary(ctor, token, expr) {
        var op = token.value;
        switch (op) {
          case "++":
          case "--":
            is_assignable(expr) || croak("Invalid use of " + op + " operator", token.line, token.col, token.pos);
            break;

          case "delete":
            expr instanceof AST_SymbolRef && S.input.has_directive("use strict") && croak("Calling delete on expression not allowed in strict mode", expr.start.line, expr.start.col, expr.start.pos);
        }
        return new ctor({
            operator: op,
            expression: expr
        });
    }
    var expr_op = function(left, min_prec, no_in) {
        var op = is("operator") ? S.token.value : null;
        "in" == op && no_in && (op = null), "**" == op && left instanceof AST_UnaryPrefix && !is_token(left.start, "punc", "(") && "--" !== left.operator && "++" !== left.operator && unexpected(left.start);
        var prec = null != op ? PRECEDENCE[op] : null;
        if (null != prec && (prec > min_prec || "**" === op && min_prec === prec)) {
            next();
            var right = expr_op(maybe_unary(!0), prec, no_in);
            return expr_op(new AST_Binary({
                start: left.start,
                left,
                operator: op,
                right,
                end: right.end
            }), min_prec, no_in);
        }
        return left;
    };
    var maybe_conditional = function(no_in) {
        var start = S.token, expr = function(no_in) {
            return expr_op(maybe_unary(!0, !0), 0, no_in);
        }(no_in);
        if (is("operator", "?")) {
            next();
            var yes = expression(!1);
            return expect(":"), new AST_Conditional({
                start,
                condition: expr,
                consequent: yes,
                alternative: expression(!1, no_in),
                end: prev()
            });
        }
        return expr;
    };
    function is_assignable(expr) {
        return expr instanceof AST_PropAccess || expr instanceof AST_SymbolRef;
    }
    function to_destructuring(node) {
        if (node instanceof AST_Object) node = new AST_Destructuring({
            start: node.start,
            names: node.properties.map(to_destructuring),
            is_array: !1,
            end: node.end
        }); else if (node instanceof AST_Array) {
            for (var names = [], i = 0; i < node.elements.length; i++) node.elements[i] instanceof AST_Expansion && (i + 1 !== node.elements.length && token_error(node.elements[i].start, "Spread must the be last element in destructuring array"), 
            node.elements[i].expression = to_destructuring(node.elements[i].expression)), names.push(to_destructuring(node.elements[i]));
            node = new AST_Destructuring({
                start: node.start,
                names,
                is_array: !0,
                end: node.end
            });
        } else node instanceof AST_ObjectProperty ? node.value = to_destructuring(node.value) : node instanceof AST_Assign && (node = new AST_DefaultAssign({
            start: node.start,
            left: node.left,
            operator: "=",
            right: node.right,
            end: node.end
        }));
        return node;
    }
    var maybe_assign = function(no_in) {
        var start = S.token;
        if ("name" == start.type && "yield" == start.value) {
            if (is_in_generator()) return next(), function() {
                is_in_generator() || croak("Unexpected yield expression outside generator function", S.prev.line, S.prev.col, S.prev.pos);
                var star = !1, has_expression = !0;
                return can_insert_semicolon() || is("punc") && PUNC_AFTER_EXPRESSION(S.token.value) ? has_expression = !1 : is("operator", "*") && (star = !0, 
                next()), new AST_Yield({
                    is_star: star,
                    expression: has_expression ? expression() : null
                });
            }();
            S.input.has_directive("use strict") && token_error(S.token, "Unexpected yield identifier inside strict mode");
        }
        var left = maybe_conditional(no_in), val = S.token.value;
        if (is("operator") && ASSIGNMENT(val)) {
            if (is_assignable(left) || (left = to_destructuring(left)) instanceof AST_Destructuring) return next(), 
            new AST_Assign({
                start,
                left,
                operator: val,
                right: maybe_assign(no_in),
                end: prev()
            });
            croak("Invalid assignment");
        }
        return left;
    }, expression = function(commas, no_in) {
        for (var start = S.token, exprs = []; exprs.push(maybe_assign(no_in)), commas && is("punc", ","); ) next(), 
        commas = !0;
        return 1 == exprs.length ? exprs[0] : new AST_Sequence({
            start,
            expressions: exprs,
            end: peek()
        });
    };
    function in_loop(cont) {
        ++S.in_loop;
        var ret = cont();
        return --S.in_loop, ret;
    }
    return options.expression ? expression(!0) : function() {
        var start = S.token, body = [];
        for (S.input.push_directives_stack(); !is("eof"); ) body.push(statement());
        S.input.pop_directives_stack();
        var end = prev(), toplevel = options.toplevel;
        return toplevel ? (toplevel.body = toplevel.body.concat(body), toplevel.end = end) : toplevel = new AST_Toplevel({
            start,
            body,
            end
        }), toplevel;
    }();
}

function TreeTransformer(before, after) {
    TreeWalker.call(this), this.before = before, this.after = after;
}

function SymbolDef(scope, orig, init) {
    this.name = orig.name, this.orig = [ orig ], this.init = init, this.eliminated = 0, 
    this.scope = scope, this.references = [], this.replaced = 0, this.global = !1, this.export = !1, 
    this.mangled_name = null, this.undeclared = !1, this.id = SymbolDef.next_id++;
}

function next_mangled(scope, options) {
    var ext = scope.enclosed;
    out: for (;;) {
        var m = base54(++scope.cname);
        if (is_identifier(m) && !member(m, options.reserved)) {
            for (var i = ext.length; --i >= 0; ) {
                var sym = ext[i];
                if (m == (sym.mangled_name || sym.unmangleable(options) && sym.name)) continue out;
            }
            return m;
        }
    }
}

TreeTransformer.prototype = new TreeWalker(), function(undefined) {
    function _(node, descend) {
        node.DEFMETHOD("transform", function(tw, in_list) {
            var x, y;
            return tw.push(this), tw.before && (x = tw.before(this, descend, in_list)), x === undefined && (descend(x = this, tw), 
            tw.after && (y = tw.after(x, in_list)) !== undefined && (x = y)), tw.pop(), x;
        });
    }
    function do_list(list, tw) {
        return MAP(list, function(node) {
            return node.transform(tw, !0);
        });
    }
    _(AST_Node, noop), _(AST_LabeledStatement, function(self, tw) {
        self.label = self.label.transform(tw), self.body = self.body.transform(tw);
    }), _(AST_SimpleStatement, function(self, tw) {
        self.body = self.body.transform(tw);
    }), _(AST_Block, function(self, tw) {
        self.body = do_list(self.body, tw);
    }), _(AST_DWLoop, function(self, tw) {
        self.condition = self.condition.transform(tw), self.body = self.body.transform(tw);
    }), _(AST_For, function(self, tw) {
        self.init && (self.init = self.init.transform(tw)), self.condition && (self.condition = self.condition.transform(tw)), 
        self.step && (self.step = self.step.transform(tw)), self.body = self.body.transform(tw);
    }), _(AST_ForIn, function(self, tw) {
        self.init = self.init.transform(tw), self.object = self.object.transform(tw), self.body = self.body.transform(tw);
    }), _(AST_With, function(self, tw) {
        self.expression = self.expression.transform(tw), self.body = self.body.transform(tw);
    }), _(AST_Exit, function(self, tw) {
        self.value && (self.value = self.value.transform(tw));
    }), _(AST_LoopControl, function(self, tw) {
        self.label && (self.label = self.label.transform(tw));
    }), _(AST_If, function(self, tw) {
        self.condition = self.condition.transform(tw), self.body = self.body.transform(tw), 
        self.alternative && (self.alternative = self.alternative.transform(tw));
    }), _(AST_Switch, function(self, tw) {
        self.expression = self.expression.transform(tw), self.body = do_list(self.body, tw);
    }), _(AST_Case, function(self, tw) {
        self.expression = self.expression.transform(tw), self.body = do_list(self.body, tw);
    }), _(AST_Try, function(self, tw) {
        self.body = do_list(self.body, tw), self.bcatch && (self.bcatch = self.bcatch.transform(tw)), 
        self.bfinally && (self.bfinally = self.bfinally.transform(tw));
    }), _(AST_Catch, function(self, tw) {
        self.argname = self.argname.transform(tw), self.body = do_list(self.body, tw);
    }), _(AST_Definitions, function(self, tw) {
        self.definitions = do_list(self.definitions, tw);
    }), _(AST_VarDef, function(self, tw) {
        self.name = self.name.transform(tw), self.value && (self.value = self.value.transform(tw));
    }), _(AST_Destructuring, function(self, tw) {
        self.names = do_list(self.names, tw);
    }), _(AST_Lambda, function(self, tw) {
        self.name && (self.name = self.name.transform(tw)), self.argnames = do_list(self.argnames, tw), 
        self.body instanceof AST_Node ? self.body = self.body.transform(tw) : self.body = do_list(self.body, tw);
    }), _(AST_Call, function(self, tw) {
        self.expression = self.expression.transform(tw), self.args = do_list(self.args, tw);
    }), _(AST_Sequence, function(self, tw) {
        self.expressions = do_list(self.expressions, tw);
    }), _(AST_Dot, function(self, tw) {
        self.expression = self.expression.transform(tw);
    }), _(AST_Sub, function(self, tw) {
        self.expression = self.expression.transform(tw), self.property = self.property.transform(tw);
    }), _(AST_Yield, function(self, tw) {
        self.expression && (self.expression = self.expression.transform(tw));
    }), _(AST_Await, function(self, tw) {
        self.expression = self.expression.transform(tw);
    }), _(AST_Unary, function(self, tw) {
        self.expression = self.expression.transform(tw);
    }), _(AST_Binary, function(self, tw) {
        self.left = self.left.transform(tw), self.right = self.right.transform(tw);
    }), _(AST_Conditional, function(self, tw) {
        self.condition = self.condition.transform(tw), self.consequent = self.consequent.transform(tw), 
        self.alternative = self.alternative.transform(tw);
    }), _(AST_Array, function(self, tw) {
        self.elements = do_list(self.elements, tw);
    }), _(AST_Object, function(self, tw) {
        self.properties = do_list(self.properties, tw);
    }), _(AST_ObjectProperty, function(self, tw) {
        self.key instanceof AST_Node && (self.key = self.key.transform(tw)), self.value = self.value.transform(tw);
    }), _(AST_Class, function(self, tw) {
        self.name && (self.name = self.name.transform(tw)), self.extends && (self.extends = self.extends.transform(tw)), 
        self.properties = do_list(self.properties, tw);
    }), _(AST_Expansion, function(self, tw) {
        self.expression = self.expression.transform(tw);
    }), _(AST_NameMapping, function(self, tw) {
        self.foreign_name = self.foreign_name.transform(tw), self.name = self.name.transform(tw);
    }), _(AST_Import, function(self, tw) {
        self.imported_name && (self.imported_name = self.imported_name.transform(tw)), self.imported_names && do_list(self.imported_names, tw), 
        self.module_name = self.module_name.transform(tw);
    }), _(AST_Export, function(self, tw) {
        self.exported_definition && (self.exported_definition = self.exported_definition.transform(tw)), 
        self.exported_value && (self.exported_value = self.exported_value.transform(tw)), 
        self.exported_names && do_list(self.exported_names, tw), self.module_name && (self.module_name = self.module_name.transform(tw));
    }), _(AST_TemplateString, function(self, tw) {
        self.segments = do_list(self.segments, tw);
    }), _(AST_PrefixedTemplateString, function(self, tw) {
        self.template_string = self.template_string.transform(tw);
    });
}(), SymbolDef.next_id = 1, SymbolDef.prototype = {
    unmangleable: function(options) {
        return options || (options = {}), this.global && !options.toplevel || this.export || this.undeclared || !options.eval && (this.scope.uses_eval || this.scope.uses_with) || options.keep_fnames && (this.orig[0] instanceof AST_SymbolLambda || this.orig[0] instanceof AST_SymbolDefun) || this.orig[0] instanceof AST_SymbolMethod || options.keep_classnames && (this.orig[0] instanceof AST_SymbolClass || this.orig[0] instanceof AST_SymbolDefClass);
    },
    mangle: function(options) {
        var cache = options.cache && options.cache.props;
        if (this.global && cache && cache.has(this.name)) this.mangled_name = cache.get(this.name); else if (!this.mangled_name && !this.unmangleable(options)) {
            var def, s = this.scope, sym = this.orig[0];
            options.ie8 && sym instanceof AST_SymbolLambda && (s = s.parent_scope), (def = this.redefined()) ? this.mangled_name = def.mangled_name || def.name : this.mangled_name = s.next_mangled(options, this), 
            this.global && cache && cache.set(this.name, this.mangled_name);
        }
    },
    redefined: function() {
        return this.defun && this.defun.variables.get(this.name);
    }
}, AST_Toplevel.DEFMETHOD("figure_out_scope", function(options) {
    options = defaults(options, {
        cache: null,
        ie8: !1,
        safari10: !1
    });
    var self = this, scope = self.parent_scope = null, labels = new Dictionary(), defun = null, in_destructuring = null, for_scopes = [], tw = new TreeWalker(function(node, descend) {
        if (node.is_block_scope()) {
            var save_scope = scope;
            return node.block_scope = scope = new AST_Scope(node), scope.init_scope_vars(save_scope), 
            node instanceof AST_Scope || (scope.uses_with = save_scope.uses_with, scope.uses_eval = save_scope.uses_eval, 
            scope.directives = save_scope.directives), options.safari10 && (node instanceof AST_For || node instanceof AST_ForIn) && for_scopes.push(scope), 
            descend(), scope = save_scope, !0;
        }
        if (node instanceof AST_Destructuring) return in_destructuring = node, descend(), 
        in_destructuring = null, !0;
        if (node instanceof AST_Scope) {
            node.init_scope_vars(scope);
            save_scope = scope;
            var save_defun = defun, save_labels = labels;
            return defun = scope = node, labels = new Dictionary(), descend(), scope = save_scope, 
            defun = save_defun, labels = save_labels, !0;
        }
        if (node instanceof AST_LabeledStatement) {
            var l = node.label;
            if (labels.has(l.name)) throw new Error(string_template("Label {name} defined twice", l));
            return labels.set(l.name, l), descend(), labels.del(l.name), !0;
        }
        if (node instanceof AST_With) for (var s = scope; s; s = s.parent_scope) s.uses_with = !0; else {
            if (node instanceof AST_Symbol && (node.scope = scope), node instanceof AST_Label && (node.thedef = node, 
            node.references = []), node instanceof AST_SymbolLambda) defun.def_function(node, "arguments" == node.name ? void 0 : defun); else if (node instanceof AST_SymbolDefun) mark_export((node.scope = defun.parent_scope.get_defun_scope()).def_function(node, defun), 1); else if (node instanceof AST_SymbolClass) mark_export(defun.def_variable(node, defun), 1); else if (node instanceof AST_SymbolImport) scope.def_variable(node); else if (node instanceof AST_SymbolDefClass) mark_export((node.scope = defun.parent_scope).def_function(node, defun), 1); else if (node instanceof AST_SymbolVar || node instanceof AST_SymbolLet || node instanceof AST_SymbolConst) {
                if (all((def = node instanceof AST_SymbolBlockDeclaration ? scope.def_variable(node, null) : defun.def_variable(node, "SymbolVar" == node.TYPE ? null : void 0)).orig, function(sym) {
                    return sym === node || (node instanceof AST_SymbolBlockDeclaration ? sym instanceof AST_SymbolLambda : !(sym instanceof AST_SymbolLet || sym instanceof AST_SymbolConst));
                }) || js_error(node.name + " redeclared", node.start.file, node.start.line, node.start.col, node.start.pos), 
                node instanceof AST_SymbolFunarg || mark_export(def, 2), def.destructuring = in_destructuring, 
                defun !== scope) {
                    node.mark_enclosed(options);
                    var def = scope.find_variable(node);
                    node.thedef !== def && (node.thedef = def, node.reference(options));
                }
            } else if (node instanceof AST_SymbolCatch) scope.def_variable(node).defun = defun; else if (node instanceof AST_LabelRef) {
                var sym = labels.get(node.name);
                if (!sym) throw new Error(string_template("Undefined label {name} [{line},{col}]", {
                    name: node.name,
                    line: node.start.line,
                    col: node.start.col
                }));
                node.thedef = sym;
            }
            scope instanceof AST_Toplevel || !(node instanceof AST_Export || node instanceof AST_Import) || js_error(node.TYPE + " statement may only appear at top level", node.start.file, node.start.line, node.start.col, node.start.pos);
        }
        function mark_export(def, level) {
            if (in_destructuring) {
                var i = 0;
                do {
                    level++;
                } while (tw.parent(i++) !== in_destructuring);
            }
            var node = tw.parent(level);
            def.export = node instanceof AST_Export;
        }
    });
    self.walk(tw), self.globals = new Dictionary();
    tw = new TreeWalker(function(node, descend) {
        if (node instanceof AST_LoopControl && node.label) return node.label.thedef.references.push(node), 
        !0;
        if (node instanceof AST_SymbolRef) {
            var sym, name = node.name;
            if ("eval" == name && tw.parent() instanceof AST_Call) for (var s = node.scope; s && !s.uses_eval; s = s.parent_scope) s.uses_eval = !0;
            return tw.parent() instanceof AST_NameMapping && tw.parent(1).module_name || !(sym = node.scope.find_variable(name)) ? sym = self.def_global(node) : sym.scope instanceof AST_Lambda && "arguments" == name && (sym.scope.uses_arguments = !0), 
            node.thedef = sym, node.reference(options), !node.scope.is_block_scope() || sym.orig[0] instanceof AST_SymbolBlockDeclaration || (node.scope = node.scope.get_defun_scope()), 
            !0;
        }
        var def;
        if (node instanceof AST_SymbolCatch && (def = node.definition().redefined())) for (s = node.scope; s && (push_uniq(s.enclosed, def), 
        s !== def.scope); ) s = s.parent_scope;
    });
    if (self.walk(tw), options.ie8 && self.walk(new TreeWalker(function(node, descend) {
        if (node instanceof AST_SymbolCatch) {
            var name = node.name, refs = node.thedef.references, scope = node.thedef.defun, def = scope.find_variable(name) || self.globals.get(name) || scope.def_variable(node);
            return refs.forEach(function(ref) {
                ref.thedef = def, ref.reference(options);
            }), node.thedef = def, node.reference(options), !0;
        }
    })), options.safari10) for (var i = 0; i < for_scopes.length; i++) {
        (scope = for_scopes[i]).parent_scope.variables.each(function(def) {
            push_uniq(scope.enclosed, def);
        });
    }
}), AST_Toplevel.DEFMETHOD("def_global", function(node) {
    var globals = this.globals, name = node.name;
    if (globals.has(name)) return globals.get(name);
    var g = new SymbolDef(this, node);
    return g.undeclared = !0, g.global = !0, globals.set(name, g), g;
}), AST_Scope.DEFMETHOD("init_scope_vars", function(parent_scope) {
    this.variables = new Dictionary(), this.functions = new Dictionary(), this.uses_with = !1, 
    this.uses_eval = !1, this.parent_scope = parent_scope, this.enclosed = [], this.cname = -1;
}), AST_Node.DEFMETHOD("is_block_scope", return_false), AST_Class.DEFMETHOD("is_block_scope", return_false), 
AST_Lambda.DEFMETHOD("is_block_scope", return_false), AST_Toplevel.DEFMETHOD("is_block_scope", return_false), 
AST_SwitchBranch.DEFMETHOD("is_block_scope", return_false), AST_Block.DEFMETHOD("is_block_scope", return_true), 
AST_IterationStatement.DEFMETHOD("is_block_scope", return_true), AST_Lambda.DEFMETHOD("init_scope_vars", function() {
    AST_Scope.prototype.init_scope_vars.apply(this, arguments), this.uses_arguments = !1, 
    this.def_variable(new AST_SymbolFunarg({
        name: "arguments",
        start: this.start,
        end: this.end
    }));
}), AST_Symbol.DEFMETHOD("mark_enclosed", function(options) {
    for (var def = this.definition(), s = this.scope; s && (push_uniq(s.enclosed, def), 
    options.keep_fnames && s.functions.each(function(d) {
        push_uniq(def.scope.enclosed, d);
    }), s !== def.scope); ) s = s.parent_scope;
}), AST_Symbol.DEFMETHOD("reference", function(options) {
    this.definition().references.push(this), this.mark_enclosed(options);
}), AST_Scope.DEFMETHOD("find_variable", function(name) {
    return name instanceof AST_Symbol && (name = name.name), this.variables.get(name) || this.parent_scope && this.parent_scope.find_variable(name);
}), AST_Scope.DEFMETHOD("def_function", function(symbol, init) {
    var def = this.def_variable(symbol, init);
    return (!def.init || def.init instanceof AST_Defun) && (def.init = init), this.functions.set(symbol.name, def), 
    def;
}), AST_Scope.DEFMETHOD("def_variable", function(symbol, init) {
    var def = this.variables.get(symbol.name);
    return def ? (def.orig.push(symbol), def.init && (def.scope !== symbol.scope || def.init instanceof AST_Function) && (def.init = init)) : (def = new SymbolDef(this, symbol, init), 
    this.variables.set(symbol.name, def), def.global = !this.parent_scope), symbol.thedef = def;
}), AST_Scope.DEFMETHOD("next_mangled", function(options) {
    return next_mangled(this, options);
}), AST_Toplevel.DEFMETHOD("next_mangled", function(options) {
    var name;
    do {
        name = next_mangled(this, options);
    } while (member(name, this.mangled_names));
    return name;
}), AST_Function.DEFMETHOD("next_mangled", function(options, def) {
    for (var tricky_def = def.orig[0] instanceof AST_SymbolFunarg && this.name && this.name.definition(), tricky_name = tricky_def ? tricky_def.mangled_name || tricky_def.name : null; ;) {
        var name = next_mangled(this, options);
        if (!tricky_name || tricky_name != name) return name;
    }
}), AST_Symbol.DEFMETHOD("unmangleable", function(options) {
    var def = this.definition();
    return !def || def.unmangleable(options);
}), AST_Label.DEFMETHOD("unmangleable", return_false), AST_Symbol.DEFMETHOD("unreferenced", function() {
    return 0 == this.definition().references.length && !(this.scope.uses_eval || this.scope.uses_with);
}), AST_Symbol.DEFMETHOD("definition", function() {
    return this.thedef;
}), AST_Symbol.DEFMETHOD("global", function() {
    return this.definition().global;
}), AST_Toplevel.DEFMETHOD("_default_mangler_options", function(options) {
    return options = defaults(options, {
        eval: !1,
        ie8: !1,
        keep_classnames: !1,
        keep_fnames: !1,
        reserved: [],
        toplevel: !1
    }), Array.isArray(options.reserved) || (options.reserved = []), push_uniq(options.reserved, "arguments"), 
    options;
}), AST_Toplevel.DEFMETHOD("mangle_names", function(options) {
    options = this._default_mangler_options(options);
    var lname = -1, to_mangle = [], mangled_names = this.mangled_names = [];
    options.cache && (this.globals.each(collect), options.cache.props && options.cache.props.each(function(mangled_name) {
        push_uniq(mangled_names, mangled_name);
    }));
    var tw = new TreeWalker(function(node, descend) {
        if (node instanceof AST_LabeledStatement) {
            var save_nesting = lname;
            return descend(), lname = save_nesting, !0;
        }
        if (node instanceof AST_Scope) node.variables.each(collect); else if (node.is_block_scope()) node.block_scope.variables.each(collect); else {
            if (node instanceof AST_Label) {
                var name;
                do {
                    name = base54(++lname);
                } while (!is_identifier(name));
                return node.mangled_name = name, !0;
            }
            !options.ie8 && node instanceof AST_SymbolCatch && to_mangle.push(node.definition());
        }
    });
    function collect(symbol) {
        member(symbol.name, options.reserved) || to_mangle.push(symbol);
    }
    this.walk(tw), to_mangle.forEach(function(def) {
        def.mangle(options);
    });
}), AST_Toplevel.DEFMETHOD("find_colliding_names", function(options) {
    var cache = options.cache && options.cache.props, avoid = Object.create(null);
    return options.reserved.forEach(to_avoid), this.globals.each(add_def), this.walk(new TreeWalker(function(node) {
        node instanceof AST_Scope && node.variables.each(add_def), node instanceof AST_SymbolCatch && add_def(node.definition());
    })), avoid;
    function to_avoid(name) {
        avoid[name] = !0;
    }
    function add_def(def) {
        var name = def.name;
        if (def.global && cache && cache.has(name)) name = cache.get(name); else if (!def.unmangleable(options)) return;
        to_avoid(name);
    }
}), AST_Toplevel.DEFMETHOD("expand_names", function(options) {
    base54.reset(), base54.sort(), options = this._default_mangler_options(options);
    var avoid = this.find_colliding_names(options), cname = 0;
    function rename(def) {
        if (!(def.global && options.cache || def.unmangleable(options) || member(def.name, options.reserved))) {
            var d = def.redefined();
            def.name = d ? d.name : function() {
                var name;
                do {
                    name = base54(cname++);
                } while (avoid[name] || !is_identifier(name));
                return name;
            }(), def.orig.forEach(function(sym) {
                sym.name = def.name;
            }), def.references.forEach(function(sym) {
                sym.name = def.name;
            });
        }
    }
    this.globals.each(rename), this.walk(new TreeWalker(function(node) {
        node instanceof AST_Scope && node.variables.each(rename), node instanceof AST_SymbolCatch && rename(node.definition());
    }));
}), AST_Node.DEFMETHOD("tail_node", return_this), AST_Sequence.DEFMETHOD("tail_node", function() {
    return this.expressions[this.expressions.length - 1];
}), AST_Toplevel.DEFMETHOD("compute_char_frequency", function(options) {
    options = this._default_mangler_options(options);
    try {
        AST_Node.prototype.print = function(stream, force_parens) {
            this._print(stream, force_parens), this instanceof AST_Symbol && !this.unmangleable(options) ? base54.consider(this.name, -1) : options.properties && (this instanceof AST_Dot ? base54.consider(this.property, -1) : this instanceof AST_Sub && function skip_string(node) {
                node instanceof AST_String ? base54.consider(node.value, -1) : node instanceof AST_Conditional ? (skip_string(node.consequent), 
                skip_string(node.alternative)) : node instanceof AST_Sequence && skip_string(node.tail_node());
            }(this.property));
        }, base54.consider(this.print_to_string(), 1);
    } finally {
        AST_Node.prototype.print = AST_Node.prototype._print;
    }
    base54.sort();
});

var base54 = function() {
    var chars, frequency, leading = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_".split(""), digits = "0123456789".split("");
    function reset() {
        frequency = Object.create(null), leading.forEach(function(ch) {
            frequency[ch] = 0;
        }), digits.forEach(function(ch) {
            frequency[ch] = 0;
        });
    }
    function compare(a, b) {
        return frequency[b] - frequency[a];
    }
    function base54(num) {
        var ret = "", base = 54;
        num++;
        do {
            ret += chars[--num % base], num = Math.floor(num / base), base = 64;
        } while (num > 0);
        return ret;
    }
    return base54.consider = function(str, delta) {
        for (var i = str.length; --i >= 0; ) frequency[str[i]] += delta;
    }, base54.sort = function() {
        chars = mergeSort(leading, compare).concat(mergeSort(digits, compare));
    }, base54.reset = reset, reset(), base54;
}(), EXPECT_DIRECTIVE = /^$|[;{][\s\n]*$/;

function is_some_comments(comment) {
    return "comment2" == comment.type && /@preserve|@license|@cc_on/i.test(comment.value);
}

function OutputStream(options) {
    var readonly = !options;
    void 0 === (options = defaults(options, {
        ascii_only: !1,
        beautify: !1,
        bracketize: !1,
        comments: !1,
        ecma: 5,
        ie8: !1,
        indent_level: 4,
        indent_start: 0,
        inline_script: !0,
        keep_quoted_props: !1,
        max_line_len: !1,
        preamble: null,
        preserve_line: !1,
        quote_keys: !1,
        quote_style: 0,
        safari10: !1,
        semicolons: !0,
        shebang: !0,
        shorthand: void 0,
        source_map: null,
        webkit: !1,
        width: 80,
        wrap_iife: !1
    }, !0)).shorthand && (options.shorthand = options.ecma > 5);
    var comment_filter = return_false;
    if (options.comments) {
        var comments = options.comments;
        if ("string" == typeof options.comments && /^\/.*\/[a-zA-Z]*$/.test(options.comments)) {
            var regex_pos = options.comments.lastIndexOf("/");
            comments = new RegExp(options.comments.substr(1, regex_pos - 1), options.comments.substr(regex_pos + 1));
        }
        comment_filter = comments instanceof RegExp ? function(comment) {
            return "comment5" != comment.type && comments.test(comment.value);
        } : "function" == typeof comments ? function(comment) {
            return "comment5" != comment.type && comments(this, comment);
        } : "some" === comments ? is_some_comments : return_true;
    }
    var indentation = 0, current_col = 0, current_line = 1, current_pos = 0, OUTPUT = "", to_utf8 = options.ascii_only ? function(str, identifier) {
        return options.ecma >= 6 && (str = str.replace(/[\ud800-\udbff][\udc00-\udfff]/g, function(ch) {
            var str, pos;
            return "\\u{" + (str = ch, pos = 0, is_surrogate_pair_head(str.charAt(pos)) ? 65536 + (str.charCodeAt(pos) - 55296 << 10) + str.charCodeAt(pos + 1) - 56320 : str.charCodeAt(pos)).toString(16) + "}";
        })), str.replace(/[\u0000-\u001f\u007f-\uffff]/g, function(ch) {
            var code = ch.charCodeAt(0).toString(16);
            if (code.length <= 2 && !identifier) {
                for (;code.length < 2; ) code = "0" + code;
                return "\\x" + code;
            }
            for (;code.length < 4; ) code = "0" + code;
            return "\\u" + code;
        });
    } : function(str) {
        for (var s = "", i = 0, len = str.length; i < len; i++) is_surrogate_pair_head(str[i]) && !is_surrogate_pair_tail(str[i + 1]) || is_surrogate_pair_tail(str[i]) && !is_surrogate_pair_head(str[i - 1]) ? s += "\\u" + str.charCodeAt(i).toString(16) : s += str[i];
        return s;
    };
    function encode_string(str, quote) {
        var ret = function(str, quote) {
            var dq = 0, sq = 0;
            function quote_single() {
                return "'" + str.replace(/\x27/g, "\\'") + "'";
            }
            function quote_double() {
                return '"' + str.replace(/\x22/g, '\\"') + '"';
            }
            if (str = str.replace(/[\\\b\f\n\r\v\t\x22\x27\u2028\u2029\0\ufeff]/g, function(s, i) {
                switch (s) {
                  case '"':
                    return ++dq, '"';

                  case "'":
                    return ++sq, "'";

                  case "\\":
                    return "\\\\";

                  case "\n":
                    return "\\n";

                  case "\r":
                    return "\\r";

                  case "\t":
                    return "\\t";

                  case "\b":
                    return "\\b";

                  case "\f":
                    return "\\f";

                  case "\v":
                    return options.ie8 ? "\\x0B" : "\\v";

                  case "\u2028":
                    return "\\u2028";

                  case "\u2029":
                    return "\\u2029";

                  case "\ufeff":
                    return "\\ufeff";

                  case "\0":
                    return /[0-9]/.test(get_full_char(str, i + 1)) ? "\\x00" : "\\0";
                }
                return s;
            }), str = to_utf8(str), "`" === quote) return "`" + str.replace(/`/g, "\\`") + "`";
            switch (options.quote_style) {
              case 1:
                return quote_single();

              case 2:
                return quote_double();

              case 3:
                return "'" == quote ? quote_single() : quote_double();

              default:
                return dq > sq ? quote_single() : quote_double();
            }
        }(str, quote);
        return options.inline_script && (ret = (ret = (ret = ret.replace(/<\x2fscript([>\/\t\n\f\r ])/gi, "<\\/script$1")).replace(/\x3c!--/g, "\\x3c!--")).replace(/--\x3e/g, "--\\x3e")), 
        ret;
    }
    function make_indent(back) {
        return function repeat_string(str, i) {
            if (i <= 0) return "";
            if (1 == i) return str;
            var d = repeat_string(str, i >> 1);
            return d += d, 1 & i && (d += str), d;
        }(" ", options.indent_start + indentation - back * options.indent_level);
    }
    var mapping_token, mapping_name, might_need_space = !1, might_need_semicolon = !1, might_add_newline = 0, need_newline_indented = !1, need_space = !1, newline_insert = -1, last = "", mappings = options.source_map && [], do_add_mapping = mappings ? function() {
        mappings.forEach(function(mapping) {
            try {
                options.source_map.add(mapping.token.file, mapping.line, mapping.col, mapping.token.line, mapping.token.col, mapping.name || "name" != mapping.token.type ? mapping.name : mapping.token.value);
            } catch (ex) {
                AST_Node.warn("Couldn't figure out mapping for {file}:{line},{col} → {cline},{ccol} [{name}]", {
                    file: mapping.token.file,
                    line: mapping.token.line,
                    col: mapping.token.col,
                    cline: mapping.line,
                    ccol: mapping.col,
                    name: mapping.name || ""
                });
            }
        }), mappings = [];
    } : noop, ensure_line_len = options.max_line_len ? function() {
        if (current_col > options.max_line_len) {
            if (might_add_newline) {
                var left = OUTPUT.slice(0, might_add_newline), right = OUTPUT.slice(might_add_newline);
                if (mappings) {
                    var delta = right.length - current_col;
                    mappings.forEach(function(mapping) {
                        mapping.line++, mapping.col += delta;
                    });
                }
                OUTPUT = left + "\n" + right, current_line++, current_pos++, current_col = right.length;
            }
            current_col > options.max_line_len && AST_Node.warn("Output exceeds {max_line_len} characters", options);
        }
        might_add_newline && (might_add_newline = 0, do_add_mapping());
    } : noop, requireSemicolonChars = makePredicate("( [ + * / - , . `");
    function print(str) {
        var ch = get_full_char(str = String(str), 0), prev = get_full_char(last, last.length - 1);
        need_newline_indented && ch && (need_newline_indented = !1, "\n" != ch && (print("\n"), 
        indent())), need_space && ch && (need_space = !1, /[\s;})]/.test(ch) || space()), 
        newline_insert = -1;
        prev = last.charAt(last.length - 1);
        if (might_need_semicolon && (might_need_semicolon = !1, (":" == prev && "}" == ch || (!ch || ";}".indexOf(ch) < 0) && ";" != prev) && (options.semicolons || requireSemicolonChars(ch) ? (OUTPUT += ";", 
        current_col++, current_pos++) : (ensure_line_len(), OUTPUT += "\n", current_pos++, 
        current_line++, current_col = 0, /^\s+$/.test(str) && (might_need_semicolon = !0)), 
        options.beautify || (might_need_space = !1))), !options.beautify && options.preserve_line && stack[stack.length - 1]) for (var target_line = stack[stack.length - 1].start.line; current_line < target_line; ) ensure_line_len(), 
        OUTPUT += "\n", current_pos++, current_line++, current_col = 0, might_need_space = !1;
        might_need_space && ((is_identifier_char(prev) && (is_identifier_char(ch) || "\\" == ch) || "/" == ch && ch == prev || ("+" == ch || "-" == ch) && ch == last) && (OUTPUT += " ", 
        current_col++, current_pos++), might_need_space = !1), mapping_token && (mappings.push({
            token: mapping_token,
            name: mapping_name,
            line: current_line,
            col: current_col
        }), mapping_token = !1, might_add_newline || do_add_mapping()), OUTPUT += str, current_pos += str.length;
        var a = str.split(/\r?\n/), n = a.length - 1;
        current_line += n, current_col += a[0].length, n > 0 && (ensure_line_len(), current_col = a[n].length), 
        last = str;
    }
    var space = options.beautify ? function() {
        print(" ");
    } : function() {
        might_need_space = !0;
    }, indent = options.beautify ? function(half) {
        options.beautify && print(make_indent(half ? .5 : 0));
    } : noop, with_indent = options.beautify ? function(col, cont) {
        !0 === col && (col = next_indent());
        var save_indentation = indentation;
        indentation = col;
        var ret = cont();
        return indentation = save_indentation, ret;
    } : function(col, cont) {
        return cont();
    }, newline = options.beautify ? function() {
        if (newline_insert < 0) return print("\n");
        "\n" != OUTPUT[newline_insert] && (OUTPUT = OUTPUT.slice(0, newline_insert) + "\n" + OUTPUT.slice(newline_insert), 
        current_pos++, current_line++), newline_insert++;
    } : options.max_line_len ? function() {
        ensure_line_len(), might_add_newline = OUTPUT.length;
    } : noop, semicolon = options.beautify ? function() {
        print(";");
    } : function() {
        might_need_semicolon = !0;
    };
    function force_semicolon() {
        might_need_semicolon = !1, print(";");
    }
    function next_indent() {
        return indentation + options.indent_level;
    }
    function get() {
        return might_add_newline && ensure_line_len(), OUTPUT;
    }
    function has_nlb() {
        var index = OUTPUT.lastIndexOf("\n");
        return /^ *$/.test(OUTPUT.slice(index + 1));
    }
    var stack = [];
    return {
        get,
        toString: get,
        indent,
        indentation: function() {
            return indentation;
        },
        current_width: function() {
            return current_col - indentation;
        },
        should_break: function() {
            return options.width && this.current_width() >= options.width;
        },
        newline,
        print,
        star: function() {
            print("*");
        },
        space,
        comma: function() {
            print(","), space();
        },
        colon: function() {
            print(":"), space();
        },
        last: function() {
            return last;
        },
        semicolon,
        force_semicolon,
        to_utf8,
        print_name: function(name) {
            print(function(name) {
                return name = name.toString(), name = to_utf8(name, !0);
            }(name));
        },
        print_string: function(str, quote, escape_directive) {
            var encoded = encode_string(str, quote);
            !0 === escape_directive && -1 === encoded.indexOf("\\") && (EXPECT_DIRECTIVE.test(OUTPUT) || force_semicolon(), 
            force_semicolon()), print(encoded);
        },
        print_template_string_chars: function(str) {
            var encoded = encode_string(str, "`").replace(/\${/g, "\\${");
            return print(encoded.substr(1, encoded.length - 2));
        },
        encode_string,
        next_indent,
        with_indent,
        with_block: function(cont) {
            var ret;
            return print("{"), newline(), with_indent(next_indent(), function() {
                ret = cont();
            }), indent(), print("}"), ret;
        },
        with_parens: function(cont) {
            print("(");
            var ret = cont();
            return print(")"), ret;
        },
        with_square: function(cont) {
            print("[");
            var ret = cont();
            return print("]"), ret;
        },
        add_mapping: mappings ? function(token, name) {
            mapping_token = token, mapping_name = name;
        } : noop,
        option: function(opt) {
            return options[opt];
        },
        prepend_comments: readonly ? noop : function(node) {
            var self = this, start = node.start;
            if (start && (!start.comments_before || start.comments_before._dumped !== self)) {
                var comments = start.comments_before;
                if (comments || (comments = start.comments_before = []), comments._dumped = self, 
                node instanceof AST_Exit && node.value) {
                    var tw = new TreeWalker(function(node) {
                        var parent = tw.parent();
                        if (!(parent instanceof AST_Exit || parent instanceof AST_Binary && parent.left === node || "Call" == parent.TYPE && parent.expression === node || parent instanceof AST_Conditional && parent.condition === node || parent instanceof AST_Dot && parent.expression === node || parent instanceof AST_Sequence && parent.expressions[0] === node || parent instanceof AST_Sub && parent.expression === node || parent instanceof AST_UnaryPostfix)) return !0;
                        if (node.start) {
                            var text = node.start.comments_before;
                            text && text._dumped !== self && (text._dumped = self, comments = comments.concat(text));
                        }
                    });
                    tw.push(node), node.value.walk(tw);
                }
                if (0 == current_pos) {
                    comments.length > 0 && options.shebang && "comment5" == comments[0].type && (print("#!" + comments.shift().value + "\n"), 
                    indent());
                    var preamble = options.preamble;
                    preamble && print(preamble.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g, "\n"));
                }
                if (0 != (comments = comments.filter(comment_filter, node)).length) {
                    var last_nlb = has_nlb();
                    comments.forEach(function(c, i) {
                        last_nlb || (c.nlb ? (print("\n"), indent(), last_nlb = !0) : i > 0 && space()), 
                        /comment[134]/.test(c.type) ? (print("//" + c.value.replace(/[@#]__PURE__/g, " ") + "\n"), 
                        indent(), last_nlb = !0) : "comment2" == c.type && (print("/*" + c.value.replace(/[@#]__PURE__/g, " ") + "*/"), 
                        last_nlb = !1);
                    }), last_nlb || (start.nlb ? (print("\n"), indent()) : space());
                }
            }
        },
        append_comments: readonly || comment_filter === return_false ? noop : function(node, tail) {
            var token = node.end;
            if (token) {
                var comments = token[tail ? "comments_before" : "comments_after"];
                if (comments && comments._dumped !== this && (node instanceof AST_Statement || all(comments, function(c) {
                    return !/comment[134]/.test(c.type);
                }))) {
                    comments._dumped = this;
                    var insert = OUTPUT.length;
                    comments.filter(comment_filter, node).forEach(function(c, i) {
                        need_space = !1, need_newline_indented ? (print("\n"), indent(), need_newline_indented = !1) : c.nlb && (i > 0 || !has_nlb()) ? (print("\n"), 
                        indent()) : (i > 0 || !tail) && space(), /comment[134]/.test(c.type) ? (print("//" + c.value.replace(/[@#]__PURE__/g, " ")), 
                        need_newline_indented = !0) : "comment2" == c.type && (print("/*" + c.value.replace(/[@#]__PURE__/g, " ") + "*/"), 
                        need_space = !0);
                    }), OUTPUT.length > insert && (newline_insert = insert);
                }
            }
        },
        line: function() {
            return current_line;
        },
        col: function() {
            return current_col;
        },
        pos: function() {
            return current_pos;
        },
        push_node: function(node) {
            stack.push(node);
        },
        pop_node: function() {
            return stack.pop();
        },
        parent: function(n) {
            return stack[stack.length - 2 - (n || 0)];
        }
    };
}

function Compressor(options, false_by_default) {
    if (!(this instanceof Compressor)) return new Compressor(options, false_by_default);
    TreeTransformer.call(this, this.before, this.after), this.options = defaults(options, {
        arrows: !false_by_default,
        booleans: !false_by_default,
        collapse_vars: !false_by_default,
        comparisons: !false_by_default,
        computed_props: !false_by_default,
        conditionals: !false_by_default,
        dead_code: !false_by_default,
        drop_console: !1,
        drop_debugger: !false_by_default,
        ecma: 5,
        evaluate: !false_by_default,
        expression: !1,
        global_defs: {},
        hoist_funs: !1,
        hoist_props: !false_by_default,
        hoist_vars: !1,
        ie8: !1,
        if_return: !false_by_default,
        inline: !false_by_default,
        join_vars: !false_by_default,
        keep_classnames: !1,
        keep_fargs: !0,
        keep_fnames: !1,
        keep_infinity: !1,
        loops: !false_by_default,
        negate_iife: !false_by_default,
        passes: 1,
        properties: !false_by_default,
        pure_getters: !false_by_default && "strict",
        pure_funcs: null,
        reduce_funcs: !false_by_default,
        reduce_vars: !false_by_default,
        sequences: !false_by_default,
        side_effects: !false_by_default,
        switches: !false_by_default,
        top_retain: null,
        toplevel: !(!options || !options.top_retain),
        typeofs: !false_by_default,
        unsafe: !1,
        unsafe_arrows: !1,
        unsafe_comps: !1,
        unsafe_Function: !1,
        unsafe_math: !1,
        unsafe_methods: !1,
        unsafe_proto: !1,
        unsafe_regexp: !1,
        unsafe_undefined: !1,
        unused: !false_by_default,
        warnings: !1
    }, !0);
    var global_defs = this.options.global_defs;
    if ("object" == typeof global_defs) for (var key in global_defs) /^@/.test(key) && HOP(global_defs, key) && (global_defs[key.slice(1)] = parse(global_defs[key], {
        expression: !0
    }));
    !0 === this.options.inline && (this.options.inline = 3);
    var pure_funcs = this.options.pure_funcs;
    this.pure_funcs = "function" == typeof pure_funcs ? pure_funcs : pure_funcs ? function(node) {
        return pure_funcs.indexOf(node.expression.print_to_string()) < 0;
    } : return_true;
    var top_retain = this.options.top_retain;
    top_retain instanceof RegExp ? this.top_retain = function(def) {
        return top_retain.test(def.name);
    } : "function" == typeof top_retain ? this.top_retain = top_retain : top_retain && ("string" == typeof top_retain && (top_retain = top_retain.split(/,/)), 
    this.top_retain = function(def) {
        return top_retain.indexOf(def.name) >= 0;
    });
    var toplevel = this.options.toplevel;
    this.toplevel = "string" == typeof toplevel ? {
        funcs: /funcs/.test(toplevel),
        vars: /vars/.test(toplevel)
    } : {
        funcs: toplevel,
        vars: toplevel
    };
    var sequences = this.options.sequences;
    this.sequences_limit = 1 == sequences ? 800 : 0 | sequences, this.warnings_produced = {};
}

function addStrings(node, add) {
    node.walk(new TreeWalker(function(node) {
        return node instanceof AST_Sequence ? addStrings(node.tail_node(), add) : node instanceof AST_String ? add(node.value) : node instanceof AST_Conditional && (addStrings(node.consequent, add), 
        addStrings(node.alternative, add)), !0;
    }));
}

function mangle_properties(ast, options) {
    var reserved = (options = defaults(options, {
        builtins: !1,
        cache: null,
        debug: !1,
        keep_quoted: !1,
        only_cache: !1,
        regex: null,
        reserved: null
    }, !0)).reserved;
    Array.isArray(reserved) || (reserved = []), options.builtins || function(reserved) {
        var objects = {}, global_ref = "object" == typeof global ? global : self;
        function add(name) {
            push_uniq(reserved, name);
        }
        [ "Symbol", "Map", "Promise", "Proxy", "Reflect", "Set", "WeakMap", "WeakSet" ].forEach(function(new_global) {
            objects[new_global] = global_ref[new_global] || new Function();
        }), [ "null", "true", "false", "Infinity", "-Infinity", "undefined" ].forEach(add), 
        [ Object, Array, Function, Number, String, Boolean, Error, Math, Date, RegExp, objects.Symbol, ArrayBuffer, DataView, decodeURI, decodeURIComponent, encodeURI, encodeURIComponent, eval, EvalError, Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, isFinite, isNaN, JSON, objects.Map, parseFloat, parseInt, objects.Promise, objects.Proxy, RangeError, ReferenceError, objects.Reflect, objects.Set, SyntaxError, TypeError, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, URIError, objects.WeakMap, objects.WeakSet ].forEach(function(ctor) {
            Object.getOwnPropertyNames(ctor).map(add), ctor.prototype && Object.getOwnPropertyNames(ctor.prototype).map(add);
        });
    }(reserved);
    var cache, cname = -1;
    options.cache ? (cache = options.cache.props).each(function(mangled_name) {
        push_uniq(reserved, mangled_name);
    }) : cache = new Dictionary();
    var debug_name_suffix, regex = options.regex, debug = !1 !== options.debug;
    debug && (debug_name_suffix = !0 === options.debug ? "" : options.debug);
    var names_to_mangle = [], unmangleable = [];
    return ast.walk(new TreeWalker(function(node) {
        node instanceof AST_ObjectKeyVal ? add(node.key) : node instanceof AST_ObjectProperty ? add(node.key.name) : node instanceof AST_Dot ? add(node.property) : node instanceof AST_Sub && addStrings(node.property, add);
    })), ast.transform(new TreeTransformer(function(node) {
        node instanceof AST_ObjectKeyVal ? node.key = mangle(node.key) : node instanceof AST_ObjectProperty ? node.key.name = mangle(node.key.name) : node instanceof AST_Dot ? node.property = mangle(node.property) : !options.keep_quoted && node instanceof AST_Sub && (node.property = function mangleStrings(node) {
            return node.transform(new TreeTransformer(function(node) {
                if (node instanceof AST_Sequence) {
                    var last = node.expressions.length - 1;
                    node.expressions[last] = mangleStrings(node.expressions[last]);
                } else node instanceof AST_String ? node.value = mangle(node.value) : node instanceof AST_Conditional && (node.consequent = mangleStrings(node.consequent), 
                node.alternative = mangleStrings(node.alternative));
                return node;
            }));
        }(node.property));
    }));
    function can_mangle(name) {
        return !(unmangleable.indexOf(name) >= 0) && (!(reserved.indexOf(name) >= 0) && (options.only_cache ? cache.has(name) : !/^-?[0-9]+(\.[0-9]+)?(e[+-][0-9]+)?$/.test(name)));
    }
    function should_mangle(name) {
        return !(regex && !regex.test(name)) && (!(reserved.indexOf(name) >= 0) && (cache.has(name) || names_to_mangle.indexOf(name) >= 0));
    }
    function add(name) {
        can_mangle(name) && push_uniq(names_to_mangle, name), should_mangle(name) || push_uniq(unmangleable, name);
    }
    function mangle(name) {
        if (!should_mangle(name)) return name;
        var mangled = cache.get(name);
        if (!mangled) {
            if (debug) {
                var debug_mangled = "_$" + name + "$" + debug_name_suffix + "_";
                can_mangle(debug_mangled) && (mangled = debug_mangled);
            }
            if (!mangled) do {
                mangled = base54(++cname);
            } while (!can_mangle(mangled));
            cache.set(name, mangled);
        }
        return mangled;
    }
}

!function() {
    function DEFPRINT(nodetype, generator) {
        nodetype.DEFMETHOD("_codegen", generator);
    }
    var in_directive = !1, active_scope = null, use_asm = null;
    function PARENS(nodetype, func) {
        Array.isArray(nodetype) ? nodetype.forEach(function(nodetype) {
            PARENS(nodetype, func);
        }) : nodetype.DEFMETHOD("needs_parens", func);
    }
    function display_body(body, is_toplevel, output, allow_directives) {
        var last = body.length - 1;
        in_directive = allow_directives, body.forEach(function(stmt, i) {
            !0 !== in_directive || stmt instanceof AST_Directive || stmt instanceof AST_EmptyStatement || stmt instanceof AST_SimpleStatement && stmt.body instanceof AST_String || (in_directive = !1), 
            stmt instanceof AST_EmptyStatement || (output.indent(), stmt.print(output), i == last && is_toplevel || (output.newline(), 
            is_toplevel && output.newline())), !0 === in_directive && stmt instanceof AST_SimpleStatement && stmt.body instanceof AST_String && (in_directive = !1);
        }), in_directive = !1;
    }
    function print_bracketed(self, output, allow_directives) {
        self.body.length > 0 ? output.with_block(function() {
            display_body(self.body, !1, output, allow_directives);
        }) : (output.print("{"), output.with_indent(output.next_indent(), function() {
            output.append_comments(self, !0);
        }), output.print("}"));
    }
    function parenthesize_for_noin(node, output, noin) {
        var parens = !1;
        noin && node.walk(new TreeWalker(function(node) {
            return !!(parens || node instanceof AST_Scope) || (node instanceof AST_Binary && "in" == node.operator ? (parens = !0, 
            !0) : void 0);
        })), node.print(output, parens);
    }
    function print_property_name(key, quote, output) {
        output.option("quote_keys") ? output.print_string(key) : "" + +key == key && key >= 0 ? output.print(make_num(key)) : (RESERVED_WORDS(key) ? !output.option("ie8") : is_identifier_string(key)) ? quote && output.option("keep_quoted_props") ? output.print_string(key, quote) : output.print_name(key) : output.print_string(key, quote);
    }
    function force_statement(stat, output) {
        output.option("bracketize") ? make_block(stat, output) : !stat || stat instanceof AST_EmptyStatement ? output.force_semicolon() : stat.print(output);
    }
    function need_constructor_parens(self, output) {
        return self.args.length > 0 || output.option("beautify");
    }
    function make_num(num) {
        var m, str = num.toString(10), a = [ str.replace(/^0\./, ".").replace("e+", "e") ];
        return Math.floor(num) === num ? (num >= 0 ? a.push("0x" + num.toString(16).toLowerCase(), "0" + num.toString(8)) : a.push("-0x" + (-num).toString(16).toLowerCase(), "-0" + (-num).toString(8)), 
        (m = /^(.*?)(0+)$/.exec(num)) && a.push(m[1] + "e" + m[2].length)) : (m = /^0?\.(0+)(.*)$/.exec(num)) && a.push(m[2] + "e-" + (m[1].length + m[2].length), str.substr(str.indexOf("."))), 
        function(a) {
            for (var best = a[0], len = best.length, i = 1; i < a.length; ++i) a[i].length < len && (len = (best = a[i]).length);
            return best;
        }(a);
    }
    function make_block(stmt, output) {
        !stmt || stmt instanceof AST_EmptyStatement ? output.print("{}") : stmt instanceof AST_BlockStatement ? stmt.print(output) : output.with_block(function() {
            output.indent(), stmt.print(output), output.newline();
        });
    }
    function DEFMAP(nodetype, generator) {
        nodetype.DEFMETHOD("add_source_map", function(stream) {
            generator(this, stream);
        });
    }
    function basic_sourcemap_gen(self, output) {
        output.add_mapping(self.start);
    }
    AST_Node.DEFMETHOD("print", function(stream, force_parens) {
        var self = this, generator = self._codegen;
        function doit() {
            stream.prepend_comments(self), self.add_source_map(stream), generator(self, stream), 
            stream.append_comments(self);
        }
        self instanceof AST_Scope ? active_scope = self : !use_asm && self instanceof AST_Directive && "use asm" == self.value && (use_asm = active_scope), 
        stream.push_node(self), force_parens || self.needs_parens(stream) ? stream.with_parens(doit) : doit(), 
        stream.pop_node(), self === use_asm && (use_asm = null);
    }), AST_Node.DEFMETHOD("_print", AST_Node.prototype.print), AST_Node.DEFMETHOD("print_to_string", function(options) {
        var s = OutputStream(options);
        return this.print(s), s.get();
    }), PARENS(AST_Node, return_false), PARENS(AST_Function, function(output) {
        if (first_in_statement(output)) return !0;
        var p;
        if (output.option("webkit") && ((p = output.parent()) instanceof AST_PropAccess && p.expression === this)) return !0;
        return !!output.option("wrap_iife") && ((p = output.parent()) instanceof AST_Call && p.expression === this);
    }), PARENS(AST_Arrow, function(output) {
        var p = output.parent();
        return p instanceof AST_PropAccess && p.expression === this;
    }), PARENS([ AST_ClassExpression, AST_Object ], first_in_statement), PARENS(AST_Unary, function(output) {
        var p = output.parent();
        return p instanceof AST_PropAccess && p.expression === this || p instanceof AST_Call && p.expression === this || p instanceof AST_Binary && "**" === p.operator && this instanceof AST_UnaryPrefix && p.left === this && "++" !== this.operator && "--" !== this.operator;
    }), PARENS(AST_Await, function(output) {
        var p = output.parent();
        return p instanceof AST_PropAccess && p.expression === this || p instanceof AST_Call && p.expression === this || output.option("safari10") && p instanceof AST_UnaryPrefix;
    }), PARENS(AST_Sequence, function(output) {
        var p = output.parent();
        return p instanceof AST_Call || p instanceof AST_Unary || p instanceof AST_Binary || p instanceof AST_VarDef || p instanceof AST_PropAccess || p instanceof AST_Array || p instanceof AST_ObjectProperty || p instanceof AST_Conditional || p instanceof AST_Arrow || p instanceof AST_DefaultAssign || p instanceof AST_Expansion || p instanceof AST_ForOf && this === p.object || p instanceof AST_Yield;
    }), PARENS(AST_Binary, function(output) {
        var p = output.parent();
        if (p instanceof AST_Call && p.expression === this) return !0;
        if (p instanceof AST_Unary) return !0;
        if (p instanceof AST_PropAccess && p.expression === this) return !0;
        if (p instanceof AST_Binary) {
            var po = p.operator, pp = PRECEDENCE[po], so = this.operator, sp = PRECEDENCE[so];
            if (pp > sp || pp == sp && this === p.right) return !0;
        }
    }), PARENS(AST_Yield, function(output) {
        var p = output.parent();
        return p instanceof AST_Binary && "=" !== p.operator || (p instanceof AST_Call && p.expression === this || (p instanceof AST_Conditional && p.condition === this || (p instanceof AST_Unary || (p instanceof AST_PropAccess && p.expression === this || void 0))));
    }), PARENS(AST_PropAccess, function(output) {
        var p = output.parent();
        if (p instanceof AST_New && p.expression === this) {
            var parens = !1;
            return this.walk(new TreeWalker(function(node) {
                return !!(parens || node instanceof AST_Scope) || (node instanceof AST_Call ? (parens = !0, 
                !0) : void 0);
            })), parens;
        }
    }), PARENS(AST_Call, function(output) {
        var p1, p = output.parent();
        return p instanceof AST_New && p.expression === this || this.expression instanceof AST_Function && p instanceof AST_PropAccess && p.expression === this && (p1 = output.parent(1)) instanceof AST_Assign && p1.left === p;
    }), PARENS(AST_New, function(output) {
        var p = output.parent();
        if (!need_constructor_parens(this, output) && (p instanceof AST_PropAccess || p instanceof AST_Call && p.expression === this)) return !0;
    }), PARENS(AST_Number, function(output) {
        var p = output.parent();
        if (p instanceof AST_PropAccess && p.expression === this) {
            var value = this.getValue();
            if (value < 0 || /^0/.test(make_num(value))) return !0;
        }
    }), PARENS([ AST_Assign, AST_Conditional ], function(output) {
        var p = output.parent();
        return p instanceof AST_Unary || (p instanceof AST_Binary && !(p instanceof AST_Assign) || (p instanceof AST_Call && p.expression === this || (p instanceof AST_Conditional && p.condition === this || (p instanceof AST_PropAccess && p.expression === this || (this instanceof AST_Assign && this.left instanceof AST_Destructuring && !1 === this.left.is_array || void 0)))));
    }), DEFPRINT(AST_Directive, function(self, output) {
        output.print_string(self.value, self.quote), output.semicolon();
    }), DEFPRINT(AST_Expansion, function(self, output) {
        output.print("..."), self.expression.print(output);
    }), DEFPRINT(AST_Destructuring, function(self, output) {
        output.print(self.is_array ? "[" : "{");
        var len = self.names.length;
        self.names.forEach(function(name, i) {
            i > 0 && output.comma(), name.print(output), i == len - 1 && name instanceof AST_Hole && output.comma();
        }), output.print(self.is_array ? "]" : "}");
    }), DEFPRINT(AST_Debugger, function(self, output) {
        output.print("debugger"), output.semicolon();
    }), AST_StatementWithBody.DEFMETHOD("_do_print_body", function(output) {
        force_statement(this.body, output);
    }), DEFPRINT(AST_Statement, function(self, output) {
        self.body.print(output), output.semicolon();
    }), DEFPRINT(AST_Toplevel, function(self, output) {
        display_body(self.body, !0, output, !0), output.print("");
    }), DEFPRINT(AST_LabeledStatement, function(self, output) {
        self.label.print(output), output.colon(), self.body.print(output);
    }), DEFPRINT(AST_SimpleStatement, function(self, output) {
        self.body.print(output), output.semicolon();
    }), DEFPRINT(AST_BlockStatement, function(self, output) {
        print_bracketed(self, output);
    }), DEFPRINT(AST_EmptyStatement, function(self, output) {
        output.semicolon();
    }), DEFPRINT(AST_Do, function(self, output) {
        output.print("do"), output.space(), make_block(self.body, output), output.space(), 
        output.print("while"), output.space(), output.with_parens(function() {
            self.condition.print(output);
        }), output.semicolon();
    }), DEFPRINT(AST_While, function(self, output) {
        output.print("while"), output.space(), output.with_parens(function() {
            self.condition.print(output);
        }), output.space(), self._do_print_body(output);
    }), DEFPRINT(AST_For, function(self, output) {
        output.print("for"), output.space(), output.with_parens(function() {
            self.init ? (self.init instanceof AST_Definitions ? self.init.print(output) : parenthesize_for_noin(self.init, output, !0), 
            output.print(";"), output.space()) : output.print(";"), self.condition ? (self.condition.print(output), 
            output.print(";"), output.space()) : output.print(";"), self.step && self.step.print(output);
        }), output.space(), self._do_print_body(output);
    }), DEFPRINT(AST_ForIn, function(self, output) {
        output.print("for"), output.space(), output.with_parens(function() {
            self.init.print(output), output.space(), output.print(self instanceof AST_ForOf ? "of" : "in"), 
            output.space(), self.object.print(output);
        }), output.space(), self._do_print_body(output);
    }), DEFPRINT(AST_With, function(self, output) {
        output.print("with"), output.space(), output.with_parens(function() {
            self.expression.print(output);
        }), output.space(), self._do_print_body(output);
    }), AST_Lambda.DEFMETHOD("_do_print", function(output, nokeyword) {
        var self = this;
        nokeyword || (self.async && (output.print("async"), output.space()), output.print("function"), 
        self.is_generator && output.star(), self.name && output.space()), self.name instanceof AST_Symbol ? self.name.print(output) : nokeyword && self.name instanceof AST_Node && output.with_square(function() {
            self.name.print(output);
        }), output.with_parens(function() {
            self.argnames.forEach(function(arg, i) {
                i && output.comma(), arg.print(output);
            });
        }), output.space(), print_bracketed(self, output, !0);
    }), DEFPRINT(AST_Lambda, function(self, output) {
        self._do_print(output);
    }), DEFPRINT(AST_PrefixedTemplateString, function(self, output) {
        self.prefix.print(output), self.template_string.print(output);
    }), DEFPRINT(AST_TemplateString, function(self, output) {
        var is_tagged = output.parent() instanceof AST_PrefixedTemplateString;
        output.print("`");
        for (var i = 0; i < self.segments.length; i++) self.segments[i] instanceof AST_TemplateSegment ? is_tagged ? output.print(self.segments[i].raw) : output.print_template_string_chars(self.segments[i].value) : (output.print("${"), 
        self.segments[i].print(output), output.print("}"));
        output.print("`");
    }), AST_Arrow.DEFMETHOD("_do_print", function(output) {
        var self = this, parent = output.parent(), needs_parens = parent instanceof AST_Binary || parent instanceof AST_Unary || parent instanceof AST_Call && self === parent.expression;
        needs_parens && output.print("("), self.async && (output.print("async"), output.space()), 
        1 === self.argnames.length && self.argnames[0] instanceof AST_Symbol ? self.argnames[0].print(output) : output.with_parens(function() {
            self.argnames.forEach(function(arg, i) {
                i && output.comma(), arg.print(output);
            });
        }), output.space(), output.print("=>"), output.space(), self.body instanceof AST_Node ? self.body.print(output) : print_bracketed(self, output), 
        needs_parens && output.print(")");
    }), AST_Exit.DEFMETHOD("_do_print", function(output, kind) {
        output.print(kind), this.value && (output.space(), this.value.print(output)), output.semicolon();
    }), DEFPRINT(AST_Return, function(self, output) {
        self._do_print(output, "return");
    }), DEFPRINT(AST_Throw, function(self, output) {
        self._do_print(output, "throw");
    }), DEFPRINT(AST_Yield, function(self, output) {
        var star = self.is_star ? "*" : "";
        output.print("yield" + star), self.expression && (output.space(), self.expression.print(output));
    }), DEFPRINT(AST_Await, function(self, output) {
        output.print("await"), output.space();
        var e = self.expression, parens = !(e instanceof AST_Call || e instanceof AST_SymbolRef || e instanceof AST_PropAccess || e instanceof AST_Unary || e instanceof AST_Constant);
        parens && output.print("("), self.expression.print(output), parens && output.print(")");
    }), AST_LoopControl.DEFMETHOD("_do_print", function(output, kind) {
        output.print(kind), this.label && (output.space(), this.label.print(output)), output.semicolon();
    }), DEFPRINT(AST_Break, function(self, output) {
        self._do_print(output, "break");
    }), DEFPRINT(AST_Continue, function(self, output) {
        self._do_print(output, "continue");
    }), DEFPRINT(AST_If, function(self, output) {
        output.print("if"), output.space(), output.with_parens(function() {
            self.condition.print(output);
        }), output.space(), self.alternative ? (!function(self, output) {
            var b = self.body;
            if (output.option("bracketize") || output.option("ie8") && b instanceof AST_Do) return make_block(b, output);
            if (!b) return output.force_semicolon();
            for (;;) if (b instanceof AST_If) {
                if (!b.alternative) return void make_block(self.body, output);
                b = b.alternative;
            } else {
                if (!(b instanceof AST_StatementWithBody)) break;
                b = b.body;
            }
            force_statement(self.body, output);
        }(self, output), output.space(), output.print("else"), output.space(), self.alternative instanceof AST_If ? self.alternative.print(output) : force_statement(self.alternative, output)) : self._do_print_body(output);
    }), DEFPRINT(AST_Switch, function(self, output) {
        output.print("switch"), output.space(), output.with_parens(function() {
            self.expression.print(output);
        }), output.space();
        var last = self.body.length - 1;
        last < 0 ? output.print("{}") : output.with_block(function() {
            self.body.forEach(function(branch, i) {
                output.indent(!0), branch.print(output), i < last && branch.body.length > 0 && output.newline();
            });
        });
    }), AST_SwitchBranch.DEFMETHOD("_do_print_body", function(output) {
        output.newline(), this.body.forEach(function(stmt) {
            output.indent(), stmt.print(output), output.newline();
        });
    }), DEFPRINT(AST_Default, function(self, output) {
        output.print("default:"), self._do_print_body(output);
    }), DEFPRINT(AST_Case, function(self, output) {
        output.print("case"), output.space(), self.expression.print(output), output.print(":"), 
        self._do_print_body(output);
    }), DEFPRINT(AST_Try, function(self, output) {
        output.print("try"), output.space(), print_bracketed(self, output), self.bcatch && (output.space(), 
        self.bcatch.print(output)), self.bfinally && (output.space(), self.bfinally.print(output));
    }), DEFPRINT(AST_Catch, function(self, output) {
        output.print("catch"), output.space(), output.with_parens(function() {
            self.argname.print(output);
        }), output.space(), print_bracketed(self, output);
    }), DEFPRINT(AST_Finally, function(self, output) {
        output.print("finally"), output.space(), print_bracketed(self, output);
    }), AST_Definitions.DEFMETHOD("_do_print", function(output, kind) {
        output.print(kind), output.space(), this.definitions.forEach(function(def, i) {
            i && output.comma(), def.print(output);
        });
        var p = output.parent();
        (p instanceof AST_For || p instanceof AST_ForIn) && p.init === this || output.semicolon();
    }), DEFPRINT(AST_Let, function(self, output) {
        self._do_print(output, "let");
    }), DEFPRINT(AST_Var, function(self, output) {
        self._do_print(output, "var");
    }), DEFPRINT(AST_Const, function(self, output) {
        self._do_print(output, "const");
    }), DEFPRINT(AST_Import, function(self, output) {
        output.print("import"), output.space(), self.imported_name && self.imported_name.print(output), 
        self.imported_name && self.imported_names && (output.print(","), output.space()), 
        self.imported_names && (1 === self.imported_names.length && "*" === self.imported_names[0].foreign_name.name ? self.imported_names[0].print(output) : (output.print("{"), 
        self.imported_names.forEach(function(name_import, i) {
            output.space(), name_import.print(output), i < self.imported_names.length - 1 && output.print(",");
        }), output.space(), output.print("}"))), (self.imported_name || self.imported_names) && (output.space(), 
        output.print("from"), output.space()), self.module_name.print(output), output.semicolon();
    }), DEFPRINT(AST_NameMapping, function(self, output) {
        var is_import = output.parent() instanceof AST_Import, definition = self.name.definition();
        (definition && definition.mangled_name || self.name.name) !== self.foreign_name.name ? (is_import ? output.print(self.foreign_name.name) : self.name.print(output), 
        output.space(), output.print("as"), output.space(), is_import ? self.name.print(output) : output.print(self.foreign_name.name)) : self.name.print(output);
    }), DEFPRINT(AST_Export, function(self, output) {
        if (output.print("export"), output.space(), self.is_default && (output.print("default"), 
        output.space()), self.exported_names) 1 === self.exported_names.length && "*" === self.exported_names[0].name.name ? self.exported_names[0].print(output) : (output.print("{"), 
        self.exported_names.forEach(function(name_export, i) {
            output.space(), name_export.print(output), i < self.exported_names.length - 1 && output.print(",");
        }), output.space(), output.print("}")); else if (self.exported_value) self.exported_value.print(output); else if (self.exported_definition && (self.exported_definition.print(output), 
        self.exported_definition instanceof AST_Definitions)) return;
        self.module_name && (output.space(), output.print("from"), output.space(), self.module_name.print(output)), 
        output.semicolon();
    }), DEFPRINT(AST_VarDef, function(self, output) {
        if (self.name.print(output), self.value) {
            output.space(), output.print("="), output.space();
            var p = output.parent(1), noin = p instanceof AST_For || p instanceof AST_ForIn;
            parenthesize_for_noin(self.value, output, noin);
        }
    }), DEFPRINT(AST_Call, function(self, output) {
        self.expression.print(output), self instanceof AST_New && !need_constructor_parens(self, output) || ((self.expression instanceof AST_Call || self.expression instanceof AST_Lambda) && output.add_mapping(self.start), 
        output.with_parens(function() {
            self.args.forEach(function(expr, i) {
                i && output.comma(), expr.print(output);
            });
        }));
    }), DEFPRINT(AST_New, function(self, output) {
        output.print("new"), output.space(), AST_Call.prototype._codegen(self, output);
    }), AST_Sequence.DEFMETHOD("_do_print", function(output) {
        this.expressions.forEach(function(node, index) {
            index > 0 && (output.comma(), output.should_break() && (output.newline(), output.indent())), 
            node.print(output);
        });
    }), DEFPRINT(AST_Sequence, function(self, output) {
        self._do_print(output);
    }), DEFPRINT(AST_Dot, function(self, output) {
        var expr = self.expression;
        expr.print(output);
        var prop = self.property;
        output.option("ie8") && RESERVED_WORDS(prop) ? (output.print("["), output.add_mapping(self.end), 
        output.print_string(prop), output.print("]")) : (expr instanceof AST_Number && expr.getValue() >= 0 && (/[xa-f.)]/i.test(output.last()) || output.print(".")), 
        output.print("."), output.add_mapping(self.end), output.print_name(prop));
    }), DEFPRINT(AST_Sub, function(self, output) {
        self.expression.print(output), output.print("["), self.property.print(output), output.print("]");
    }), DEFPRINT(AST_UnaryPrefix, function(self, output) {
        var op = self.operator;
        output.print(op), (/^[a-z]/i.test(op) || /[+-]$/.test(op) && self.expression instanceof AST_UnaryPrefix && /^[+-]/.test(self.expression.operator)) && output.space(), 
        self.expression.print(output);
    }), DEFPRINT(AST_UnaryPostfix, function(self, output) {
        self.expression.print(output), output.print(self.operator);
    }), DEFPRINT(AST_Binary, function(self, output) {
        var op = self.operator;
        self.left.print(output), ">" == op[0] && self.left instanceof AST_UnaryPostfix && "--" == self.left.operator ? output.print(" ") : output.space(), 
        output.print(op), ("<" == op || "<<" == op) && self.right instanceof AST_UnaryPrefix && "!" == self.right.operator && self.right.expression instanceof AST_UnaryPrefix && "--" == self.right.expression.operator ? output.print(" ") : output.space(), 
        self.right.print(output);
    }), DEFPRINT(AST_Conditional, function(self, output) {
        self.condition.print(output), output.space(), output.print("?"), output.space(), 
        self.consequent.print(output), output.space(), output.colon(), self.alternative.print(output);
    }), DEFPRINT(AST_Array, function(self, output) {
        output.with_square(function() {
            var a = self.elements, len = a.length;
            len > 0 && output.space(), a.forEach(function(exp, i) {
                i && output.comma(), exp.print(output), i === len - 1 && exp instanceof AST_Hole && output.comma();
            }), len > 0 && output.space();
        });
    }), DEFPRINT(AST_Object, function(self, output) {
        self.properties.length > 0 ? output.with_block(function() {
            self.properties.forEach(function(prop, i) {
                i && (output.print(","), output.newline()), output.indent(), prop.print(output);
            }), output.newline();
        }) : output.print("{}");
    }), DEFPRINT(AST_Class, function(self, output) {
        if (output.print("class"), output.space(), self.name && (self.name.print(output), 
        output.space()), self.extends) {
            var parens = !(self.extends instanceof AST_SymbolRef || self.extends instanceof AST_PropAccess || self.extends instanceof AST_ClassExpression || self.extends instanceof AST_Function);
            output.print("extends"), parens ? output.print("(") : output.space(), self.extends.print(output), 
            parens ? output.print(")") : output.space();
        }
        self.properties.length > 0 ? output.with_block(function() {
            self.properties.forEach(function(prop, i) {
                i && output.newline(), output.indent(), prop.print(output);
            }), output.newline();
        }) : output.print("{}");
    }), DEFPRINT(AST_NewTarget, function(self, output) {
        output.print("new.target");
    }), DEFPRINT(AST_ObjectKeyVal, function(self, output) {
        function get_name(self) {
            var def = self.definition();
            return def ? def.mangled_name || def.name : self.name;
        }
        var allowShortHand = output.option("shorthand");
        allowShortHand && self.value instanceof AST_Symbol && is_identifier_string(self.key) && get_name(self.value) === self.key && is_identifier(self.key) ? print_property_name(self.key, self.quote, output) : allowShortHand && self.value instanceof AST_DefaultAssign && self.value.left instanceof AST_Symbol && is_identifier_string(self.key) && get_name(self.value.left) === self.key ? (print_property_name(self.key, self.quote, output), 
        output.space(), output.print("="), output.space(), self.value.right.print(output)) : (self.key instanceof AST_Node ? output.with_square(function() {
            self.key.print(output);
        }) : print_property_name(self.key, self.quote, output), output.colon(), self.value.print(output));
    }), AST_ObjectProperty.DEFMETHOD("_print_getter_setter", function(type, output) {
        var self = this;
        self.static && (output.print("static"), output.space()), type && (output.print(type), 
        output.space()), self.key instanceof AST_SymbolMethod ? print_property_name(self.key.name, self.quote, output) : output.with_square(function() {
            self.key.print(output);
        }), self.value._do_print(output, !0);
    }), DEFPRINT(AST_ObjectSetter, function(self, output) {
        self._print_getter_setter("set", output);
    }), DEFPRINT(AST_ObjectGetter, function(self, output) {
        self._print_getter_setter("get", output);
    }), DEFPRINT(AST_ConciseMethod, function(self, output) {
        self._print_getter_setter(self.is_generator ? "*" : self.async && "async", output);
    }), AST_Symbol.DEFMETHOD("_do_print", function(output) {
        var def = this.definition();
        output.print_name(def ? def.mangled_name || def.name : this.name);
    }), DEFPRINT(AST_Symbol, function(self, output) {
        self._do_print(output);
    }), DEFPRINT(AST_Hole, noop), DEFPRINT(AST_This, function(self, output) {
        output.print("this");
    }), DEFPRINT(AST_Super, function(self, output) {
        output.print("super");
    }), DEFPRINT(AST_Constant, function(self, output) {
        output.print(self.getValue());
    }), DEFPRINT(AST_String, function(self, output) {
        output.print_string(self.getValue(), self.quote, in_directive);
    }), DEFPRINT(AST_Number, function(self, output) {
        use_asm && self.start && null != self.start.raw ? output.print(self.start.raw) : output.print(make_num(self.getValue()));
    }), DEFPRINT(AST_RegExp, function(self, output) {
        var regexp = self.getValue(), str = regexp.toString();
        regexp.raw_source && (str = "/" + regexp.raw_source + str.slice(str.lastIndexOf("/"))), 
        str = output.to_utf8(str), output.print(str);
        var p = output.parent();
        p instanceof AST_Binary && /^in/.test(p.operator) && p.left === self && output.print(" ");
    }), DEFMAP(AST_Node, noop), DEFMAP(AST_Directive, basic_sourcemap_gen), DEFMAP(AST_Debugger, basic_sourcemap_gen), 
    DEFMAP(AST_Symbol, basic_sourcemap_gen), DEFMAP(AST_Jump, basic_sourcemap_gen), 
    DEFMAP(AST_StatementWithBody, basic_sourcemap_gen), DEFMAP(AST_LabeledStatement, noop), 
    DEFMAP(AST_Lambda, basic_sourcemap_gen), DEFMAP(AST_Switch, basic_sourcemap_gen), 
    DEFMAP(AST_SwitchBranch, basic_sourcemap_gen), DEFMAP(AST_BlockStatement, basic_sourcemap_gen), 
    DEFMAP(AST_Toplevel, noop), DEFMAP(AST_New, basic_sourcemap_gen), DEFMAP(AST_Try, basic_sourcemap_gen), 
    DEFMAP(AST_Catch, basic_sourcemap_gen), DEFMAP(AST_Finally, basic_sourcemap_gen), 
    DEFMAP(AST_Definitions, basic_sourcemap_gen), DEFMAP(AST_Constant, basic_sourcemap_gen), 
    DEFMAP(AST_ObjectSetter, function(self, output) {
        output.add_mapping(self.start, self.key.name);
    }), DEFMAP(AST_ObjectGetter, function(self, output) {
        output.add_mapping(self.start, self.key.name);
    }), DEFMAP(AST_ObjectProperty, function(self, output) {
        output.add_mapping(self.start, self.key);
    });
}(), Compressor.prototype = new TreeTransformer(), merge(Compressor.prototype, {
    option: function(key) {
        return this.options[key];
    },
    exposed: function(def) {
        if (def.export) return !0;
        if (def.global) for (var i = 0, len = def.orig.length; i < len; i++) if (!this.toplevel[def.orig[i] instanceof AST_SymbolDefun ? "funcs" : "vars"]) return !0;
        return !1;
    },
    in_boolean_context: function() {
        if (!this.option("booleans")) return !1;
        for (var p, self = this.self(), i = 0; p = this.parent(i); i++) {
            if (p instanceof AST_SimpleStatement || p instanceof AST_Conditional && p.condition === self || p instanceof AST_DWLoop && p.condition === self || p instanceof AST_For && p.condition === self || p instanceof AST_If && p.condition === self || p instanceof AST_UnaryPrefix && "!" == p.operator && p.expression === self) return !0;
            if (!(p instanceof AST_Binary && ("&&" == p.operator || "||" == p.operator) || p instanceof AST_Conditional || p.tail_node() === self)) return !1;
            self = p;
        }
    },
    compress: function(node) {
        this.option("expression") && node.process_expression(!0);
        for (var passes = +this.options.passes || 1, min_count = 1 / 0, stopping = !1, mangle = {
            ie8: this.option("ie8")
        }, pass = 0; pass < passes; pass++) if (node.figure_out_scope(mangle), (pass > 0 || this.option("reduce_vars")) && node.reset_opt_flags(this), 
        node = node.transform(this), passes > 1) {
            var count = 0;
            if (node.walk(new TreeWalker(function() {
                count++;
            })), this.info("pass " + pass + ": last_count: " + min_count + ", count: " + count), 
            count < min_count) min_count = count, stopping = !1; else {
                if (stopping) break;
                stopping = !0;
            }
        }
        return this.option("expression") && node.process_expression(!1), node;
    },
    info: function() {
        "verbose" == this.options.warnings && AST_Node.warn.apply(AST_Node, arguments);
    },
    warn: function(text, props) {
        if (this.options.warnings) {
            var message = string_template(text, props);
            message in this.warnings_produced || (this.warnings_produced[message] = !0, AST_Node.warn.apply(AST_Node, arguments));
        }
    },
    clear_warnings: function() {
        this.warnings_produced = {};
    },
    before: function(node, descend, in_list) {
        if (node._squeezed) return node;
        var was_scope = !1;
        node instanceof AST_Scope && (node = (node = node.hoist_properties(this)).hoist_declarations(this), 
        was_scope = !0), descend(node, this), descend(node, this);
        var opt = node.optimize(this);
        return was_scope && opt instanceof AST_Scope && (opt.drop_unused(this), descend(opt, this)), 
        opt === node && (opt._squeezed = !0), opt;
    }
}), function() {
    function OPT(node, optimizer) {
        node.DEFMETHOD("optimize", function(compressor) {
            if (this._optimized) return this;
            if (compressor.has_directive("use asm")) return this;
            var opt = optimizer(this, compressor);
            return opt._optimized = !0, opt;
        });
    }
    function is_func_expr(node) {
        return node instanceof AST_Arrow || node instanceof AST_Function;
    }
    function is_lhs_read_only(lhs) {
        if (lhs instanceof AST_This) return !0;
        if (lhs instanceof AST_SymbolRef) return lhs.definition().orig[0] instanceof AST_SymbolLambda;
        if (lhs instanceof AST_PropAccess) {
            if ((lhs = lhs.expression) instanceof AST_SymbolRef) {
                if (lhs.is_immutable()) return !1;
                lhs = lhs.fixed_value();
            }
            return !lhs || !(lhs instanceof AST_RegExp) && (lhs instanceof AST_Constant || is_lhs_read_only(lhs));
        }
        return !1;
    }
    function is_ref_of(ref, type) {
        if (!(ref instanceof AST_SymbolRef)) return !1;
        for (var orig = ref.definition().orig, i = orig.length; --i >= 0; ) if (orig[i] instanceof type) return !0;
    }
    function find_variable(compressor, name) {
        for (var scope, i = 0; (scope = compressor.parent(i++)) && !(scope instanceof AST_Scope); ) if (scope instanceof AST_Catch) {
            scope = scope.argname.definition().scope;
            break;
        }
        return scope.find_variable(name);
    }
    function make_node(ctor, orig, props) {
        return props || (props = {}), orig && (props.start || (props.start = orig.start), 
        props.end || (props.end = orig.end)), new ctor(props);
    }
    function make_sequence(orig, expressions) {
        return 1 == expressions.length ? expressions[0] : make_node(AST_Sequence, orig, {
            expressions: expressions.reduce(merge_sequence, [])
        });
    }
    function make_node_from_constant(val, orig) {
        switch (typeof val) {
          case "string":
            return make_node(AST_String, orig, {
                value: val
            });

          case "number":
            return isNaN(val) ? make_node(AST_NaN, orig) : isFinite(val) ? 1 / val < 0 ? make_node(AST_UnaryPrefix, orig, {
                operator: "-",
                expression: make_node(AST_Number, orig, {
                    value: -val
                })
            }) : make_node(AST_Number, orig, {
                value: val
            }) : val < 0 ? make_node(AST_UnaryPrefix, orig, {
                operator: "-",
                expression: make_node(AST_Infinity, orig)
            }) : make_node(AST_Infinity, orig);

          case "boolean":
            return make_node(val ? AST_True : AST_False, orig);

          case "undefined":
            return make_node(AST_Undefined, orig);

          default:
            if (null === val) return make_node(AST_Null, orig, {
                value: null
            });
            if (val instanceof RegExp) return make_node(AST_RegExp, orig, {
                value: val
            });
            throw new Error(string_template("Can't handle constant of type: {type}", {
                type: typeof val
            }));
        }
    }
    function maintain_this_binding(parent, orig, val) {
        return parent instanceof AST_UnaryPrefix && "delete" == parent.operator || parent instanceof AST_Call && parent.expression === orig && (val instanceof AST_PropAccess || val instanceof AST_SymbolRef && "eval" == val.name) ? make_sequence(orig, [ make_node(AST_Number, orig, {
            value: 0
        }), val ]) : val;
    }
    function merge_sequence(array, node) {
        return node instanceof AST_Sequence ? array.push.apply(array, node.expressions) : array.push(node), 
        array;
    }
    function as_statement_array(thing) {
        if (null === thing) return [];
        if (thing instanceof AST_BlockStatement) return thing.body;
        if (thing instanceof AST_EmptyStatement) return [];
        if (thing instanceof AST_Statement) return [ thing ];
        throw new Error("Can't convert thing to statement array");
    }
    function is_empty(thing) {
        return null === thing || (thing instanceof AST_EmptyStatement || thing instanceof AST_BlockStatement && 0 == thing.body.length);
    }
    function can_be_evicted_from_block(node) {
        return !(node instanceof AST_DefClass || node instanceof AST_Defun || node instanceof AST_Let || node instanceof AST_Const || node instanceof AST_Export || node instanceof AST_Import);
    }
    function loop_body(x) {
        return x instanceof AST_IterationStatement && x.body instanceof AST_BlockStatement ? x.body : x;
    }
    function is_iife_call(node) {
        return "Call" == node.TYPE && (node.expression instanceof AST_Function || is_iife_call(node.expression));
    }
    function is_undeclared_ref(node) {
        return node instanceof AST_SymbolRef && node.definition().undeclared;
    }
    OPT(AST_Node, function(self, compressor) {
        return self;
    }), AST_Node.DEFMETHOD("equivalent_to", function(node) {
        return this.TYPE == node.TYPE && this.print_to_string() == node.print_to_string();
    }), AST_Scope.DEFMETHOD("process_expression", function(insert, compressor) {
        var self = this, tt = new TreeTransformer(function(node) {
            if (insert && node instanceof AST_SimpleStatement) return make_node(AST_Return, node, {
                value: node.body
            });
            if (!insert && node instanceof AST_Return) {
                if (compressor) {
                    var value = node.value && node.value.drop_side_effect_free(compressor, !0);
                    return value ? make_node(AST_SimpleStatement, node, {
                        body: value
                    }) : make_node(AST_EmptyStatement, node);
                }
                return make_node(AST_SimpleStatement, node, {
                    body: node.value || make_node(AST_UnaryPrefix, node, {
                        operator: "void",
                        expression: make_node(AST_Number, node, {
                            value: 0
                        })
                    })
                });
            }
            if (node instanceof AST_Class || node instanceof AST_Lambda && node !== self) return node;
            if (node instanceof AST_Block) {
                var index = node.body.length - 1;
                index >= 0 && (node.body[index] = node.body[index].transform(tt));
            } else node instanceof AST_If ? (node.body = node.body.transform(tt), node.alternative && (node.alternative = node.alternative.transform(tt))) : node instanceof AST_With && (node.body = node.body.transform(tt));
            return node;
        });
        self.transform(tt);
    }), function(def) {
        function reset_def(compressor, def) {
            def.assignments = 0, def.direct_access = !1, def.escaped = !1, def.scope.uses_eval || def.scope.uses_with ? def.fixed = !1 : def.orig[0] instanceof AST_SymbolConst || !compressor.exposed(def) ? def.fixed = def.init : def.fixed = !1, 
            def.recursive_refs = 0, def.references = [], def.should_replace = void 0, def.single_use = void 0;
        }
        function reset_variables(tw, compressor, node) {
            node.variables.each(function(def) {
                reset_def(compressor, def), null === def.fixed ? (def.safe_ids = tw.safe_ids, mark(tw, def, !0)) : def.fixed && (tw.loop_ids[def.id] = tw.in_loop, 
                mark(tw, def, !0));
            });
        }
        function reset_block_variables(compressor, node) {
            node.block_scope && node.block_scope.variables.each(function(def) {
                reset_def(compressor, def);
            });
        }
        function push(tw) {
            tw.safe_ids = Object.create(tw.safe_ids);
        }
        function pop(tw) {
            tw.safe_ids = Object.getPrototypeOf(tw.safe_ids);
        }
        function mark(tw, def, safe) {
            tw.safe_ids[def.id] = safe;
        }
        function safe_to_read(tw, def) {
            if (tw.safe_ids[def.id]) {
                if (null == def.fixed) {
                    var orig = def.orig[0];
                    if (orig instanceof AST_SymbolFunarg || "arguments" == orig.name) return !1;
                    def.fixed = make_node(AST_Undefined, orig);
                }
                return !0;
            }
            return def.fixed instanceof AST_Defun;
        }
        function safe_to_assign(tw, def, value) {
            return void 0 === def.fixed || (null === def.fixed && def.safe_ids ? (def.safe_ids[def.id] = !1, 
            delete def.safe_ids, !0) : !!HOP(tw.safe_ids, def.id) && (!!safe_to_read(tw, def) && (!1 !== def.fixed && (!(null != def.fixed && (!value || def.references.length > def.assignments)) && all(def.orig, function(sym) {
                return !(sym instanceof AST_SymbolConst || sym instanceof AST_SymbolDefun || sym instanceof AST_SymbolLambda);
            })))));
        }
        function read_property(obj, key) {
            if (!((key = get_value(key)) instanceof AST_Node)) {
                var value;
                if (obj instanceof AST_Array) {
                    var elements = obj.elements;
                    if ("length" == key) return make_node_from_constant(elements.length, obj);
                    "number" == typeof key && key in elements && (value = elements[key]);
                } else if (obj instanceof AST_Object) {
                    key = "" + key;
                    for (var props = obj.properties, i = props.length; --i >= 0; ) {
                        if (!(props[i] instanceof AST_ObjectKeyVal)) return;
                        value || props[i].key !== key || (value = props[i].value);
                    }
                }
                return value instanceof AST_SymbolRef && value.fixed_value() || value;
            }
        }
        def(AST_Node, noop);
        var suppressor = new TreeWalker(function(node) {
            if (node instanceof AST_Symbol) {
                var d = node.definition();
                d && (node instanceof AST_SymbolRef && d.references.push(node), d.fixed = !1);
            }
        });
        function mark_def_node(tw, descend, compressor) {
            this.inlined = !1;
            var save_ids = tw.safe_ids;
            return tw.safe_ids = Object.create(null), reset_variables(tw, compressor, this), 
            descend(), tw.safe_ids = save_ids, !0;
        }
        function mark_func_expr(tw, descend, compressor) {
            var iife, node = this;
            return node.inlined = !1, push(tw), reset_variables(tw, compressor, node), !node.name && (iife = tw.parent()) instanceof AST_Call && iife.expression === node && node.argnames.forEach(function(arg, i) {
                if (arg.definition) {
                    var d = arg.definition();
                    node.uses_arguments || void 0 !== d.fixed ? d.fixed = !1 : (d.fixed = function() {
                        return iife.args[i] || make_node(AST_Undefined, iife);
                    }, tw.loop_ids[d.id] = tw.in_loop, mark(tw, d, !0));
                }
            }), descend(), pop(tw), !0;
        }
        def(AST_Accessor, function(tw, descend, compressor) {
            return push(tw), reset_variables(tw, compressor, this), descend(), pop(tw), !0;
        }), def(AST_Arrow, mark_func_expr), def(AST_Assign, function(tw) {
            var node = this;
            if (node.left instanceof AST_Destructuring) node.left.walk(suppressor); else if ("=" == node.operator && node.left instanceof AST_SymbolRef) {
                var d = node.left.definition();
                return safe_to_assign(tw, d, node.right) ? (d.references.push(node.left), d.assignments++, 
                d.fixed = function() {
                    return node.right;
                }, mark(tw, d, !1), node.right.walk(tw), mark(tw, d, !0), !0) : void 0;
            }
        }), def(AST_Binary, function(tw) {
            if (lazy_op(this.operator)) return this.left.walk(tw), push(tw), this.right.walk(tw), 
            pop(tw), !0;
        }), def(AST_Block, function(tw, descend, compressor) {
            reset_block_variables(compressor, this);
        }), def(AST_ClassExpression, function(tw, descend) {
            return this.inlined = !1, push(tw), descend(), pop(tw), !0;
        }), def(AST_Conditional, function(tw) {
            return this.condition.walk(tw), push(tw), this.consequent.walk(tw), pop(tw), push(tw), 
            this.alternative.walk(tw), pop(tw), !0;
        }), def(AST_DefClass, mark_def_node), def(AST_Defun, mark_def_node), def(AST_Do, function(tw, descend, compressor) {
            reset_block_variables(compressor, this);
            var saved_loop = tw.in_loop;
            return tw.in_loop = this, push(tw), this.body.walk(tw), this.condition.walk(tw), 
            pop(tw), tw.in_loop = saved_loop, !0;
        }), def(AST_For, function(tw, descend, compressor) {
            reset_block_variables(compressor, this), this.init && this.init.walk(tw);
            var saved_loop = tw.in_loop;
            return tw.in_loop = this, this.condition && (push(tw), this.condition.walk(tw), 
            pop(tw)), push(tw), this.body.walk(tw), pop(tw), this.step && (push(tw), this.step.walk(tw), 
            pop(tw)), tw.in_loop = saved_loop, !0;
        }), def(AST_ForIn, function(tw, descend, compressor) {
            reset_block_variables(compressor, this), this.init.walk(suppressor), this.object.walk(tw);
            var saved_loop = tw.in_loop;
            return tw.in_loop = this, push(tw), this.body.walk(tw), pop(tw), tw.in_loop = saved_loop, 
            !0;
        }), def(AST_Function, mark_func_expr), def(AST_If, function(tw) {
            return this.condition.walk(tw), push(tw), this.body.walk(tw), pop(tw), this.alternative && (push(tw), 
            this.alternative.walk(tw), pop(tw)), !0;
        }), def(AST_LabeledStatement, function(tw) {
            return push(tw), this.body.walk(tw), pop(tw), !0;
        }), def(AST_SwitchBranch, function(tw, descend) {
            return push(tw), descend(), pop(tw), !0;
        }), def(AST_SymbolCatch, function() {
            this.definition().fixed = !1;
        }), def(AST_SymbolRef, function(tw, descend, compressor) {
            var value, d = this.definition();
            d.references.push(this), 1 == d.references.length && !d.fixed && d.orig[0] instanceof AST_SymbolDefun && (tw.loop_ids[d.id] = tw.in_loop), 
            void 0 !== d.fixed && safe_to_read(tw, d) && "m" != d.single_use ? d.fixed && ((value = this.fixed_value()) instanceof AST_Lambda && recursive_ref(tw, d) ? d.recursive_refs++ : value && !compressor.exposed(d) && function(tw, compressor, def) {
                return compressor.option("unused") && !def.scope.uses_eval && !def.scope.uses_with && def.references.length - def.recursive_refs == 1 && tw.loop_ids[def.id] === tw.in_loop;
            }(tw, compressor, d) ? d.single_use = value instanceof AST_Lambda || value instanceof AST_Class || d.scope === this.scope && value.is_constant_expression() : d.single_use = !1, 
            function is_modified(tw, node, value, level, immutable) {
                var parent = tw.parent(level);
                if (is_lhs(node, parent) || !(immutable || !(parent instanceof AST_Call) || parent.expression !== node || value instanceof AST_Arrow || value instanceof AST_Class || value instanceof AST_Function && (parent instanceof AST_New || !value.contains_this()))) return !0;
                if (parent instanceof AST_Array) return is_modified(tw, parent, parent, level + 1);
                if (parent instanceof AST_ObjectKeyVal && node === parent.value) {
                    var obj = tw.parent(level + 1);
                    return is_modified(tw, obj, obj, level + 2);
                }
                return parent instanceof AST_PropAccess && parent.expression === node ? !immutable && is_modified(tw, parent, read_property(value, parent.property), level + 1) : void 0;
            }(tw, this, value, 0, function(value) {
                return !!value && (value.is_constant() || value instanceof AST_Lambda || value instanceof AST_This);
            }(value)) && (d.single_use ? d.single_use = "m" : d.fixed = !1)) : d.fixed = !1, 
            function mark_escaped(tw, d, scope, node, value, level, depth) {
                var parent = tw.parent(level);
                if (value) {
                    if (value.is_constant()) return;
                    if (value instanceof AST_ClassExpression) return;
                }
                if (parent instanceof AST_Assign && "=" == parent.operator && node === parent.right || parent instanceof AST_Call && node !== parent.expression || parent instanceof AST_Exit && node === parent.value && node.scope !== d.scope || parent instanceof AST_VarDef && node === parent.value || parent instanceof AST_Yield && node === parent.value && node.scope !== d.scope) return !(depth > 1) || value && value.is_constant_expression(scope) || (depth = 1), 
                void ((!d.escaped || d.escaped > depth) && (d.escaped = depth));
                if (parent instanceof AST_Array || parent instanceof AST_Await || parent instanceof AST_Binary && lazy_op(parent.operator) || parent instanceof AST_Conditional && node !== parent.condition || parent instanceof AST_Expansion || parent instanceof AST_Sequence && node === parent.tail_node()) mark_escaped(tw, d, scope, parent, parent, level + 1, depth); else if (parent instanceof AST_ObjectKeyVal && node === parent.value) {
                    var obj = tw.parent(level + 1);
                    mark_escaped(tw, d, scope, obj, obj, level + 2, depth);
                } else if (parent instanceof AST_PropAccess && node === parent.expression && (mark_escaped(tw, d, scope, parent, value = read_property(value, parent.property), level + 1, depth + 1), 
                value)) return;
                0 == level && (d.direct_access = !0);
            }(tw, d, this.scope, this, value, 0, 1);
        }), def(AST_Toplevel, function(tw, descend, compressor) {
            this.globals.each(function(def) {
                reset_def(compressor, def);
            }), reset_variables(tw, compressor, this);
        }), def(AST_Try, function(tw, descend, compressor) {
            return reset_block_variables(compressor, this), push(tw), walk_body(this, tw), pop(tw), 
            this.bcatch && (push(tw), this.bcatch.walk(tw), pop(tw)), this.bfinally && this.bfinally.walk(tw), 
            !0;
        }), def(AST_VarDef, function(tw, descend) {
            var node = this;
            if (node.name instanceof AST_Destructuring) node.name.walk(suppressor); else {
                var d = node.name.definition();
                if (safe_to_assign(tw, d, node.value)) return node.value && (d.fixed = function() {
                    return node.value;
                }, tw.loop_ids[d.id] = tw.in_loop, mark(tw, d, !1), descend()), mark(tw, d, !0), 
                !0;
                node.value && (d.fixed = !1);
            }
        }), def(AST_While, function(tw, descend, compressor) {
            reset_block_variables(compressor, this);
            var saved_loop = tw.in_loop;
            return tw.in_loop = this, push(tw), this.condition.walk(tw), this.body.walk(tw), 
            pop(tw), tw.in_loop = saved_loop, !0;
        });
    }(function(node, func) {
        node.DEFMETHOD("reduce_vars", func);
    }), AST_Toplevel.DEFMETHOD("reset_opt_flags", function(compressor) {
        var reduce_vars = compressor.option("reduce_vars"), tw = new TreeWalker(function(node, descend) {
            if (node._squeezed = !1, node._optimized = !1, reduce_vars) return node.reduce_vars(tw, descend, compressor);
        });
        tw.safe_ids = Object.create(null), tw.in_loop = null, tw.loop_ids = Object.create(null), 
        this.walk(tw);
    }), AST_Symbol.DEFMETHOD("fixed_value", function() {
        var fixed = this.definition().fixed;
        return !fixed || fixed instanceof AST_Node ? fixed : fixed();
    }), AST_SymbolRef.DEFMETHOD("is_immutable", function() {
        var orig = this.definition().orig;
        return 1 == orig.length && orig[0] instanceof AST_SymbolLambda;
    });
    var global_names = makePredicate("Array Boolean clearInterval clearTimeout console Date decodeURI decodeURIComponent encodeURI encodeURIComponent Error escape eval EvalError Function isFinite isNaN JSON Math Number parseFloat parseInt RangeError ReferenceError RegExp Object setInterval setTimeout String SyntaxError TypeError unescape URIError");
    AST_SymbolRef.DEFMETHOD("is_declared", function(compressor) {
        return !this.definition().undeclared || compressor.option("unsafe") && global_names(this.name);
    });
    var def, unary_bool, binary_bool, identifier_atom = makePredicate("Infinity NaN undefined");
    function is_identifier_atom(node) {
        return node instanceof AST_Infinity || node instanceof AST_NaN || node instanceof AST_Undefined;
    }
    function tighten_body(statements, compressor) {
        var CHANGED, scope = compressor.find_parent(AST_Scope).get_defun_scope(), max_iter = 10;
        do {
            CHANGED = !1, eliminate_spurious_blocks(statements), compressor.option("dead_code") && eliminate_dead_code(statements, compressor), 
            compressor.option("if_return") && handle_if_return(statements, compressor), compressor.sequences_limit > 0 && (sequencesize(statements, compressor), 
            sequencesize_2(statements, compressor)), compressor.option("join_vars") && join_consecutive_vars(statements), 
            compressor.option("collapse_vars") && collapse(statements, compressor);
        } while (CHANGED && max_iter-- > 0);
        function collapse(statements, compressor) {
            if (scope.uses_eval || scope.uses_with) return statements;
            for (var args, candidates = [], in_try = compressor.self() instanceof AST_Try, stat_index = statements.length, scanner = new TreeTransformer(function(node, descend) {
                if (abort) return node;
                if (node instanceof AST_Switch) {
                    if (!hit) {
                        if (node !== hit_stack[hit_index]) return node;
                        hit_index++;
                    }
                    node.expression = node.expression.transform(scanner);
                    for (var i = 0, len = node.body.length; !abort && i < len; i++) {
                        var branch = node.body[i];
                        if (branch instanceof AST_Case) {
                            if (!hit) {
                                if (branch !== hit_stack[hit_index]) continue;
                                hit_index++;
                            }
                            if (branch.expression = branch.expression.transform(scanner), side_effects || !replace_all) break;
                        }
                    }
                    return abort = !0, node;
                }
                if (!hit) {
                    if (node !== hit_stack[hit_index]) return node;
                    if (++hit_index < hit_stack.length) return;
                    return hit = !0, (stop_after = function find_stop(node, level) {
                        var parent = scanner.parent(level);
                        if (parent instanceof AST_Binary) return node;
                        if (parent instanceof AST_Call) return node;
                        if (parent instanceof AST_Case) return node;
                        if (parent instanceof AST_Conditional) return node;
                        if (parent instanceof AST_Definitions) return find_stop(parent, level + 1);
                        if (parent instanceof AST_Exit) return node;
                        if (parent instanceof AST_If) return node;
                        if (parent instanceof AST_IterationStatement) return node;
                        if (parent instanceof AST_Sequence) return find_stop(parent, level + 1);
                        if (parent instanceof AST_SimpleStatement) return find_stop(parent, level + 1);
                        if (parent instanceof AST_Switch) return node;
                        if (parent instanceof AST_VarDef) return node;
                        return null;
                    }(node, 0)) === node && (abort = !0), node;
                }
                var sym, parent = scanner.parent();
                if (node instanceof AST_Assign && "=" != node.operator && lhs.equivalent_to(node.left) || node instanceof AST_Await || node instanceof AST_Call && lhs instanceof AST_PropAccess && lhs.equivalent_to(node.expression) || node instanceof AST_Debugger || node instanceof AST_Destructuring || node instanceof AST_IterationStatement && !(node instanceof AST_For) || node instanceof AST_Try || node instanceof AST_With || parent instanceof AST_For && node !== parent.init || (side_effects || !replace_all) && node instanceof AST_SymbolRef && !node.is_declared(compressor)) return abort = !0, 
                node;
                if (can_replace && !(node instanceof AST_SymbolDeclaration) && lhs.equivalent_to(node)) {
                    if (is_lhs(node, parent)) return value_def && replaced++, node;
                    if (CHANGED = abort = !0, replaced++, compressor.info("Collapsing {name} [{file}:{line},{col}]", {
                        name: node.print_to_string(),
                        file: node.start.file,
                        line: node.start.line,
                        col: node.start.col
                    }), candidate instanceof AST_UnaryPostfix) return make_node(AST_UnaryPrefix, candidate, candidate);
                    if (candidate instanceof AST_VarDef) {
                        if (value_def) return abort = !1, node;
                        var def = candidate.name.definition(), value = candidate.value;
                        return def.references.length - def.replaced != 1 || compressor.exposed(def) ? make_node(AST_Assign, candidate, {
                            operator: "=",
                            left: make_node(AST_SymbolRef, candidate.name, candidate.name),
                            right: value
                        }) : (def.replaced++, funarg && is_identifier_atom(value) ? value.transform(compressor) : maintain_this_binding(parent, node, value));
                    }
                    return candidate.write_only = !1, candidate;
                }
                return (node instanceof AST_Call || node instanceof AST_Exit || node instanceof AST_PropAccess && (side_effects || node.expression.may_throw_on_access(compressor)) || node instanceof AST_SymbolRef && (lvalues[node.name] || side_effects && !function(def) {
                    return 1 == def.orig.length && def.orig[0] instanceof AST_SymbolDefun || def.scope.get_defun_scope() === scope && def.references.every(function(ref) {
                        return ref.scope.get_defun_scope() === scope;
                    });
                }(node.definition())) || (sym = function(node) {
                    return node instanceof AST_VarDef ? node.value && node.name : is_lhs(node.left, node);
                }(node)) && (sym instanceof AST_PropAccess || sym.name in lvalues) || may_throw && (in_try ? node.has_side_effects(compressor) : function side_effects_external(node, lhs) {
                    if (node instanceof AST_Assign) return side_effects_external(node.left, !0) || side_effects_external(node.right);
                    if (node instanceof AST_Definitions) return !1;
                    if (node instanceof AST_Unary) return side_effects_external(node.expression, !0);
                    if (node instanceof AST_VarDef) return node.value && side_effects_external(node.value);
                    if (lhs) {
                        if (node instanceof AST_Dot) return side_effects_external(node.expression, !0);
                        if (node instanceof AST_Sub) return side_effects_external(node.expression, !0) || side_effects_external(node.property);
                        if (node instanceof AST_SymbolRef) return node.definition().scope !== scope;
                    }
                    return node.has_side_effects(compressor);
                }(node)) || (side_effects || !replace_all) && (parent instanceof AST_Binary && lazy_op(parent.operator) || parent instanceof AST_Conditional || parent instanceof AST_If)) && (stop_after = node, 
                node instanceof AST_Scope && (abort = !0)), node instanceof AST_Scope ? node : void 0;
            }, function(node) {
                abort || stop_after !== node || (abort = !0);
            }), multi_replacer = new TreeTransformer(function(node) {
                if (abort) return node;
                if (!hit) {
                    if (node !== hit_stack[hit_index]) return node;
                    if (++hit_index < hit_stack.length) return;
                    return hit = !0, node;
                }
                return node instanceof AST_SymbolRef && node.name == def.name ? (--replaced || (abort = !0), 
                is_lhs(node, multi_replacer.parent()) ? node : (def.replaced++, value_def.replaced--, 
                candidate.value)) : node instanceof AST_Default || node instanceof AST_Scope ? node : void 0;
            }); --stat_index >= 0; ) {
                0 == stat_index && compressor.option("unused") && extract_args();
                var hit_stack = [];
                for (extract_candidates(statements[stat_index]); candidates.length > 0; ) {
                    var hit_index = 0, candidate = (hit_stack = candidates.pop())[hit_stack.length - 1], value_def = null, stop_after = null, lhs = get_lhs(candidate);
                    if (lhs && !is_lhs_read_only(lhs) && !lhs.has_side_effects(compressor)) {
                        var lvalues = get_lvalues(candidate);
                        lhs instanceof AST_SymbolRef && (lvalues[lhs.name] = !1);
                        var replace_all = value_def;
                        if (!replace_all && lhs instanceof AST_SymbolRef) (def = lhs.definition()).references.length - def.replaced == (candidate instanceof AST_VarDef ? 1 : 2) && (replace_all = !0);
                        var side_effects = value_has_side_effects(candidate), may_throw = candidate.may_throw(compressor), funarg = candidate.name instanceof AST_SymbolFunarg, hit = funarg, abort = !1, replaced = 0, can_replace = !args || !hit;
                        if (!can_replace) {
                            for (var j = compressor.self().argnames.lastIndexOf(candidate.name) + 1; !abort && j < args.length; j++) args[j].transform(scanner);
                            can_replace = !0;
                        }
                        for (var i = stat_index; !abort && i < statements.length; i++) statements[i].transform(scanner);
                        if (value_def) {
                            var def = candidate.name.definition();
                            if (abort && def.references.length - def.replaced > replaced) replaced = !1; else {
                                abort = !1, hit_index = 0, hit = funarg;
                                for (i = stat_index; !abort && i < statements.length; i++) statements[i].transform(multi_replacer);
                                value_def.single_use = !1;
                            }
                        }
                        replaced && !remove_candidate(candidate) && statements.splice(stat_index, 1);
                    }
                }
            }
            function has_overlapping_symbol(fn, arg, fn_strict) {
                var found = !1, scan_this = !(fn instanceof AST_Arrow);
                return arg.walk(new TreeWalker(function(node, descend) {
                    if (found) return !0;
                    if (node instanceof AST_SymbolRef && fn.variables.has(node.name)) {
                        var s = node.definition().scope;
                        if (s !== scope) for (;s = s.parent_scope; ) if (s === scope) return !0;
                        return found = !0;
                    }
                    if ((fn_strict || scan_this) && node instanceof AST_This) return found = !0;
                    if (node instanceof AST_Scope && !(node instanceof AST_Arrow)) {
                        var prev = scan_this;
                        return scan_this = !1, descend(), scan_this = prev, !0;
                    }
                })), found;
            }
            function extract_args() {
                var iife, fn = compressor.self();
                if (is_func_expr(fn) && !fn.name && !fn.uses_arguments && !fn.uses_eval && (iife = compressor.parent()) instanceof AST_Call && iife.expression === fn && all(iife.args, function(arg) {
                    return !(arg instanceof AST_Expansion);
                })) {
                    var fn_strict = compressor.has_directive("use strict");
                    fn_strict && !member(fn_strict, fn.body) && (fn_strict = !1);
                    var len = fn.argnames.length;
                    args = iife.args.slice(len);
                    for (var names = Object.create(null), i = len; --i >= 0; ) {
                        var sym = fn.argnames[i], arg = iife.args[i];
                        if (args.unshift(make_node(AST_VarDef, sym, {
                            name: sym,
                            value: arg
                        })), !(sym.name in names)) if (names[sym.name] = !0, sym instanceof AST_Expansion) {
                            var elements = iife.args.slice(i);
                            all(elements, function(arg) {
                                return !has_overlapping_symbol(fn, arg, fn_strict);
                            }) && candidates.unshift([ make_node(AST_VarDef, sym, {
                                name: sym.expression,
                                value: make_node(AST_Array, iife, {
                                    elements
                                })
                            }) ]);
                        } else arg ? has_overlapping_symbol(fn, arg, fn_strict) && (arg = null) : arg = make_node(AST_Undefined, sym).transform(compressor), 
                        arg && candidates.unshift([ make_node(AST_VarDef, sym, {
                            name: sym,
                            value: arg
                        }) ]);
                    }
                }
            }
            function extract_candidates(expr) {
                hit_stack.push(expr), expr instanceof AST_Assign ? (expr.left.has_side_effects(compressor) || candidates.push(hit_stack.slice()), 
                extract_candidates(expr.right)) : expr instanceof AST_Binary ? (extract_candidates(expr.left), 
                extract_candidates(expr.right)) : expr instanceof AST_Call ? (extract_candidates(expr.expression), 
                expr.args.forEach(extract_candidates)) : expr instanceof AST_Case ? extract_candidates(expr.expression) : expr instanceof AST_Conditional ? (extract_candidates(expr.condition), 
                extract_candidates(expr.consequent), extract_candidates(expr.alternative)) : !(expr instanceof AST_Definitions) || !compressor.option("unused") && expr instanceof AST_Const ? expr instanceof AST_DWLoop ? (extract_candidates(expr.condition), 
                expr.body instanceof AST_Block || extract_candidates(expr.body)) : expr instanceof AST_Exit ? expr.value && extract_candidates(expr.value) : expr instanceof AST_For ? (expr.init && extract_candidates(expr.init), 
                expr.condition && extract_candidates(expr.condition), expr.step && extract_candidates(expr.step), 
                expr.body instanceof AST_Block || extract_candidates(expr.body)) : expr instanceof AST_ForIn ? (extract_candidates(expr.object), 
                expr.body instanceof AST_Block || extract_candidates(expr.body)) : expr instanceof AST_If ? (extract_candidates(expr.condition), 
                expr.body instanceof AST_Block || extract_candidates(expr.body), !expr.alternative || expr.alternative instanceof AST_Block || extract_candidates(expr.alternative)) : expr instanceof AST_Sequence ? expr.expressions.forEach(extract_candidates) : expr instanceof AST_SimpleStatement ? extract_candidates(expr.body) : expr instanceof AST_Switch ? (extract_candidates(expr.expression), 
                expr.body.forEach(extract_candidates)) : expr instanceof AST_Unary ? "++" != expr.operator && "--" != expr.operator || candidates.push(hit_stack.slice()) : expr instanceof AST_VarDef && expr.value && (candidates.push(hit_stack.slice()), 
                extract_candidates(expr.value)) : expr.definitions.forEach(extract_candidates), 
                hit_stack.pop();
            }
            function get_lhs(expr) {
                if (!(expr instanceof AST_VarDef && expr.name instanceof AST_SymbolDeclaration)) {
                    var lhs = expr[expr instanceof AST_Assign ? "left" : "expression"];
                    return !is_ref_of(lhs, AST_SymbolConst) && lhs;
                }
                var def = expr.name.definition();
                if (member(expr.name, def.orig)) {
                    var declared = def.orig.length - def.eliminated, referenced = def.references.length - def.replaced;
                    return declared > 1 && !(expr.name instanceof AST_SymbolFunarg) || (referenced > 1 ? function(var_def) {
                        var value = var_def.value;
                        if (value instanceof AST_SymbolRef && "arguments" != value.name) {
                            var def = value.definition();
                            if (!def.undeclared) return value_def = def;
                        }
                    }(expr) : !compressor.exposed(def)) ? make_node(AST_SymbolRef, expr.name, expr.name) : void 0;
                }
            }
            function get_rvalue(expr) {
                return expr[expr instanceof AST_Assign ? "right" : "value"];
            }
            function get_lvalues(expr) {
                var lvalues = Object.create(null);
                if (expr instanceof AST_Unary) return lvalues;
                var tw = new TreeWalker(function(node, descend) {
                    for (var sym = node; sym instanceof AST_PropAccess; ) sym = sym.expression;
                    (sym instanceof AST_SymbolRef || sym instanceof AST_This) && (lvalues[sym.name] = lvalues[sym.name] || is_lhs(node, tw.parent()));
                });
                return get_rvalue(expr).walk(tw), lvalues;
            }
            function remove_candidate(expr) {
                if (expr.name instanceof AST_SymbolFunarg) {
                    var iife = compressor.parent(), argnames = compressor.self().argnames, index = argnames.indexOf(expr.name);
                    if (index < 0) iife.args.length = Math.min(iife.args.length, argnames.length - 1); else {
                        var args = iife.args;
                        args[index] && (args[index] = make_node(AST_Number, args[index], {
                            value: 0
                        }));
                    }
                    return !0;
                }
                var found = !1;
                return statements[stat_index].transform(new TreeTransformer(function(node, descend, in_list) {
                    return found ? node : node === expr || node.body === expr ? (found = !0, node instanceof AST_VarDef ? (node.value = null, 
                    node) : in_list ? MAP.skip : null) : void 0;
                }, function(node) {
                    if (node instanceof AST_Sequence) switch (node.expressions.length) {
                      case 0:
                        return null;

                      case 1:
                        return node.expressions[0];
                    }
                }));
            }
            function value_has_side_effects(expr) {
                return !(expr instanceof AST_Unary) && get_rvalue(expr).has_side_effects(compressor);
            }
        }
        function eliminate_spurious_blocks(statements) {
            for (var seen_dirs = [], i = 0; i < statements.length; ) {
                var stat = statements[i];
                stat instanceof AST_BlockStatement && all(stat.body, can_be_evicted_from_block) ? (CHANGED = !0, 
                eliminate_spurious_blocks(stat.body), [].splice.apply(statements, [ i, 1 ].concat(stat.body)), 
                i += stat.body.length) : stat instanceof AST_EmptyStatement ? (CHANGED = !0, statements.splice(i, 1)) : stat instanceof AST_Directive ? seen_dirs.indexOf(stat.value) < 0 ? (i++, 
                seen_dirs.push(stat.value)) : (CHANGED = !0, statements.splice(i, 1)) : i++;
            }
        }
        function handle_if_return(statements, compressor) {
            for (var self = compressor.self(), multiple_if_returns = function(statements) {
                for (var n = 0, i = statements.length; --i >= 0; ) {
                    var stat = statements[i];
                    if (stat instanceof AST_If && stat.body instanceof AST_Return && ++n > 1) return !0;
                }
                return !1;
            }(statements), in_lambda = self instanceof AST_Lambda, i = statements.length; --i >= 0; ) {
                var stat = statements[i], j = next_index(i), next = statements[j];
                if (in_lambda && !next && stat instanceof AST_Return) {
                    if (!stat.value) {
                        CHANGED = !0, statements.splice(i, 1);
                        continue;
                    }
                    if (stat.value instanceof AST_UnaryPrefix && "void" == stat.value.operator) {
                        CHANGED = !0, statements[i] = make_node(AST_SimpleStatement, stat, {
                            body: stat.value.expression
                        });
                        continue;
                    }
                }
                if (stat instanceof AST_If) {
                    var ab;
                    if (can_merge_flow(ab = aborts(stat.body))) {
                        ab.label && remove(ab.label.thedef.references, ab), CHANGED = !0, (stat = stat.clone()).condition = stat.condition.negate(compressor);
                        var body = as_statement_array_with_return(stat.body, ab);
                        stat.body = make_node(AST_BlockStatement, stat, {
                            body: as_statement_array(stat.alternative).concat(extract_functions())
                        }), stat.alternative = make_node(AST_BlockStatement, stat, {
                            body
                        }), statements[i] = stat.transform(compressor);
                        continue;
                    }
                    if (can_merge_flow(ab = aborts(stat.alternative))) {
                        ab.label && remove(ab.label.thedef.references, ab), CHANGED = !0, (stat = stat.clone()).body = make_node(AST_BlockStatement, stat.body, {
                            body: as_statement_array(stat.body).concat(extract_functions())
                        });
                        body = as_statement_array_with_return(stat.alternative, ab);
                        stat.alternative = make_node(AST_BlockStatement, stat.alternative, {
                            body
                        }), statements[i] = stat.transform(compressor);
                        continue;
                    }
                }
                if (stat instanceof AST_If && stat.body instanceof AST_Return) {
                    var value = stat.body.value;
                    if (!value && !stat.alternative && (in_lambda && !next || next instanceof AST_Return && !next.value)) {
                        CHANGED = !0, statements[i] = make_node(AST_SimpleStatement, stat.condition, {
                            body: stat.condition
                        });
                        continue;
                    }
                    if (value && !stat.alternative && next instanceof AST_Return && next.value) {
                        CHANGED = !0, (stat = stat.clone()).alternative = next, statements.splice(i, 1, stat.transform(compressor)), 
                        statements.splice(j, 1);
                        continue;
                    }
                    if (value && !stat.alternative && (!next && in_lambda && multiple_if_returns || next instanceof AST_Return)) {
                        CHANGED = !0, (stat = stat.clone()).alternative = next || make_node(AST_Return, stat, {
                            value: null
                        }), statements.splice(i, 1, stat.transform(compressor)), next && statements.splice(j, 1);
                        continue;
                    }
                    var prev = statements[prev_index(i)];
                    if (compressor.option("sequences") && in_lambda && !stat.alternative && prev instanceof AST_If && prev.body instanceof AST_Return && next_index(j) == statements.length && next instanceof AST_SimpleStatement) {
                        CHANGED = !0, (stat = stat.clone()).alternative = make_node(AST_BlockStatement, next, {
                            body: [ next, make_node(AST_Return, next, {
                                value: null
                            }) ]
                        }), statements.splice(i, 1, stat.transform(compressor)), statements.splice(j, 1);
                        continue;
                    }
                }
            }
            function can_merge_flow(ab) {
                if (!ab) return !1;
                for (var j = i + 1, len = statements.length; j < len; j++) {
                    var stat = statements[j];
                    if (stat instanceof AST_Const || stat instanceof AST_Let) return !1;
                }
                var value, lct = ab instanceof AST_LoopControl ? compressor.loopcontrol_target(ab) : null;
                return ab instanceof AST_Return && in_lambda && (!(value = ab.value) || value instanceof AST_UnaryPrefix && "void" == value.operator) || ab instanceof AST_Continue && self === loop_body(lct) || ab instanceof AST_Break && lct instanceof AST_BlockStatement && self === lct;
            }
            function extract_functions() {
                var tail = statements.slice(i + 1);
                return statements.length = i + 1, tail.filter(function(stat) {
                    return !(stat instanceof AST_Defun) || (statements.push(stat), !1);
                });
            }
            function as_statement_array_with_return(node, ab) {
                var body = as_statement_array(node).slice(0, -1);
                return ab.value && body.push(make_node(AST_SimpleStatement, ab.value, {
                    body: ab.value.expression
                })), body;
            }
            function next_index(i) {
                for (var j = i + 1, len = statements.length; j < len; j++) {
                    var stat = statements[j];
                    if (!(stat instanceof AST_Var && declarations_only(stat))) break;
                }
                return j;
            }
            function prev_index(i) {
                for (var j = i; --j >= 0; ) {
                    var stat = statements[j];
                    if (!(stat instanceof AST_Var && declarations_only(stat))) break;
                }
                return j;
            }
        }
        function eliminate_dead_code(statements, compressor) {
            for (var has_quit, self = compressor.self(), i = 0, n = 0, len = statements.length; i < len; i++) {
                var stat = statements[i];
                if (stat instanceof AST_LoopControl) {
                    var lct = compressor.loopcontrol_target(stat);
                    stat instanceof AST_Break && !(lct instanceof AST_IterationStatement) && loop_body(lct) === self || stat instanceof AST_Continue && loop_body(lct) === self ? stat.label && remove(stat.label.thedef.references, stat) : statements[n++] = stat;
                } else statements[n++] = stat;
                if (aborts(stat)) {
                    has_quit = statements.slice(i + 1);
                    break;
                }
            }
            statements.length = n, CHANGED = n != len, has_quit && has_quit.forEach(function(stat) {
                extract_declarations_from_unreachable_code(compressor, stat, statements);
            });
        }
        function declarations_only(node) {
            return all(node.definitions, function(var_def) {
                return !var_def.value;
            });
        }
        function sequencesize(statements, compressor) {
            if (!(statements.length < 2)) {
                for (var seq = [], n = 0, i = 0, len = statements.length; i < len; i++) {
                    var stat = statements[i];
                    if (stat instanceof AST_SimpleStatement) {
                        seq.length >= compressor.sequences_limit && push_seq();
                        var body = stat.body;
                        seq.length > 0 && (body = body.drop_side_effect_free(compressor)), body && merge_sequence(seq, body);
                    } else stat instanceof AST_Definitions && declarations_only(stat) || stat instanceof AST_Defun ? statements[n++] = stat : (push_seq(), 
                    statements[n++] = stat);
                }
                push_seq(), statements.length = n, n != len && (CHANGED = !0);
            }
            function push_seq() {
                if (seq.length) {
                    var body = make_sequence(seq[0], seq);
                    statements[n++] = make_node(AST_SimpleStatement, body, {
                        body
                    }), seq = [];
                }
            }
        }
        function to_simple_statement(block, decls) {
            if (!(block instanceof AST_BlockStatement)) return block;
            for (var stat = null, i = 0, len = block.body.length; i < len; i++) {
                var line = block.body[i];
                if (line instanceof AST_Var && declarations_only(line)) decls.push(line); else {
                    if (stat) return !1;
                    stat = line;
                }
            }
            return stat;
        }
        function sequencesize_2(statements, compressor) {
            function cons_seq(right) {
                n--, CHANGED = !0;
                var left = prev.body;
                return make_sequence(left, [ left, right ]).transform(compressor);
            }
            for (var prev, n = 0, i = 0; i < statements.length; i++) {
                var stat = statements[i];
                if (prev) if (stat instanceof AST_Exit) stat.value = cons_seq(stat.value || make_node(AST_Undefined, stat).transform(compressor)); else if (stat instanceof AST_For) {
                    if (!(stat.init instanceof AST_Definitions)) {
                        var abort = !1;
                        prev.body.walk(new TreeWalker(function(node) {
                            return !!(abort || node instanceof AST_Scope) || (node instanceof AST_Binary && "in" == node.operator ? (abort = !0, 
                            !0) : void 0);
                        })), abort || (stat.init ? stat.init = cons_seq(stat.init) : (stat.init = prev.body, 
                        n--, CHANGED = !0));
                    }
                } else stat instanceof AST_ForIn ? stat.init instanceof AST_Const || stat.init instanceof AST_Let || (stat.object = cons_seq(stat.object)) : stat instanceof AST_If ? stat.condition = cons_seq(stat.condition) : stat instanceof AST_Switch ? stat.expression = cons_seq(stat.expression) : stat instanceof AST_With && (stat.expression = cons_seq(stat.expression));
                if (compressor.option("conditionals") && stat instanceof AST_If) {
                    var decls = [], body = to_simple_statement(stat.body, decls), alt = to_simple_statement(stat.alternative, decls);
                    if (!1 !== body && !1 !== alt && decls.length > 0) {
                        var len = decls.length;
                        decls.push(make_node(AST_If, stat, {
                            condition: stat.condition,
                            body: body || make_node(AST_EmptyStatement, stat.body),
                            alternative: alt
                        })), decls.unshift(n, 1), [].splice.apply(statements, decls), i += len, n += len + 1, 
                        prev = null, CHANGED = !0;
                        continue;
                    }
                }
                statements[n++] = stat, prev = stat instanceof AST_SimpleStatement ? stat : null;
            }
            statements.length = n;
        }
        function join_object_assignments(defn, body) {
            if (defn instanceof AST_Definitions) {
                var exprs, def = defn.definitions[defn.definitions.length - 1];
                if (def.value instanceof AST_Object) if (body instanceof AST_Assign ? exprs = [ body ] : body instanceof AST_Sequence && (exprs = body.expressions.slice()), 
                exprs) {
                    var trimmed = !1;
                    do {
                        var node = exprs[0];
                        if (!(node instanceof AST_Assign)) break;
                        if ("=" != node.operator) break;
                        if (!(node.left instanceof AST_PropAccess)) break;
                        var sym = node.left.expression;
                        if (!(sym instanceof AST_SymbolRef)) break;
                        if (def.name.name != sym.name) break;
                        if (!node.right.is_constant_expression(scope)) break;
                        var prop = node.left.property;
                        if (prop instanceof AST_Node && (prop = prop.evaluate(compressor)), prop instanceof AST_Node) break;
                        if (prop = "" + prop, compressor.option("ecma") < 6 && compressor.has_directive("use strict") && !all(def.value.properties, function(node) {
                            return node.key != prop && node.key.name != prop;
                        })) break;
                        def.value.properties.push(make_node(AST_ObjectKeyVal, node, {
                            key: prop,
                            value: node.right
                        })), exprs.shift(), trimmed = !0;
                    } while (exprs.length);
                    return trimmed && exprs;
                }
            }
        }
        function join_consecutive_vars(statements) {
            for (var defs, i = 0, j = -1, len = statements.length; i < len; i++) {
                var stat = statements[i], prev = statements[j];
                if (stat instanceof AST_Definitions) prev && prev.TYPE == stat.TYPE ? (prev.definitions = prev.definitions.concat(stat.definitions), 
                CHANGED = !0) : defs && defs.TYPE == stat.TYPE && declarations_only(stat) ? (defs.definitions = defs.definitions.concat(stat.definitions), 
                CHANGED = !0) : (statements[++j] = stat, defs = stat); else if (stat instanceof AST_Exit) stat.value = extract_object_assignments(stat.value); else if (stat instanceof AST_For) {
                    (exprs = join_object_assignments(prev, stat.init)) ? (CHANGED = !0, stat.init = exprs.length ? make_sequence(stat.init, exprs) : null, 
                    statements[++j] = stat) : prev instanceof AST_Var && (!stat.init || stat.init.TYPE == prev.TYPE) ? (stat.init && (prev.definitions = prev.definitions.concat(stat.init.definitions)), 
                    stat.init = prev, statements[j] = stat, CHANGED = !0) : defs && stat.init && defs.TYPE == stat.init.TYPE && declarations_only(stat.init) ? (defs.definitions = defs.definitions.concat(stat.init.definitions), 
                    stat.init = null, statements[++j] = stat, CHANGED = !0) : statements[++j] = stat;
                } else if (stat instanceof AST_ForIn) stat.object = extract_object_assignments(stat.object); else if (stat instanceof AST_If) stat.condition = extract_object_assignments(stat.condition); else if (stat instanceof AST_SimpleStatement) {
                    var exprs;
                    if (exprs = join_object_assignments(prev, stat.body)) {
                        if (CHANGED = !0, !exprs.length) continue;
                        stat.body = make_sequence(stat.body, exprs);
                    }
                    statements[++j] = stat;
                } else stat instanceof AST_Switch ? stat.expression = extract_object_assignments(stat.expression) : stat instanceof AST_With ? stat.expression = extract_object_assignments(stat.expression) : statements[++j] = stat;
            }
            function extract_object_assignments(value) {
                statements[++j] = stat;
                var exprs = join_object_assignments(prev, value);
                return exprs ? (CHANGED = !0, exprs.length ? make_sequence(value, exprs) : value instanceof AST_Sequence ? value.tail_node().left : value.left) : value;
            }
            statements.length = j + 1;
        }
    }
    function extract_declarations_from_unreachable_code(compressor, stat, target) {
        stat instanceof AST_Defun || compressor.warn("Dropping unreachable code [{file}:{line},{col}]", stat.start), 
        stat.walk(new TreeWalker(function(node) {
            return node instanceof AST_Var ? (compressor.warn("Declarations in unreachable code! [{file}:{line},{col}]", node.start), 
            node.remove_initializers(), target.push(node), !0) : node instanceof AST_Defun && (node === stat || !compressor.has_directive("use strict")) ? (target.push(node === stat ? node : make_node(AST_Var, node, {
                definitions: [ make_node(AST_VarDef, node, {
                    name: make_node(AST_SymbolVar, node.name, node.name),
                    value: null
                }) ]
            })), !0) : node instanceof AST_Scope || void 0;
        }));
    }
    function get_value(key) {
        return key instanceof AST_Constant ? key.getValue() : key instanceof AST_UnaryPrefix && "void" == key.operator && key.expression instanceof AST_Constant ? void 0 : key;
    }
    function is_undefined(node, compressor) {
        return node.is_undefined || node instanceof AST_Undefined || node instanceof AST_UnaryPrefix && "void" == node.operator && !node.expression.has_side_effects(compressor);
    }
    !function(def) {
        function is_strict(compressor) {
            return /strict/.test(compressor.option("pure_getters"));
        }
        AST_Node.DEFMETHOD("may_throw_on_access", function(compressor) {
            return !compressor.option("pure_getters") || this._dot_throw(compressor);
        }), def(AST_Node, is_strict), def(AST_Null, return_true), def(AST_Undefined, return_true), 
        def(AST_Constant, return_false), def(AST_Array, return_false), def(AST_Object, function(compressor) {
            if (!is_strict(compressor)) return !1;
            for (var i = this.properties.length; --i >= 0; ) if (this.properties[i]._dot_throw(compressor)) return !0;
            return !1;
        }), def(AST_ObjectProperty, return_false), def(AST_ObjectGetter, return_true), def(AST_Expansion, function(compressor) {
            return this.expression._dot_throw(compressor);
        }), def(AST_Function, return_false), def(AST_Arrow, return_false), def(AST_UnaryPostfix, return_false), 
        def(AST_UnaryPrefix, function() {
            return "void" == this.operator;
        }), def(AST_Binary, function(compressor) {
            return ("&&" == this.operator || "||" == this.operator) && (this.left._dot_throw(compressor) || this.right._dot_throw(compressor));
        }), def(AST_Assign, function(compressor) {
            return "=" == this.operator && this.right._dot_throw(compressor);
        }), def(AST_Conditional, function(compressor) {
            return this.consequent._dot_throw(compressor) || this.alternative._dot_throw(compressor);
        }), def(AST_Dot, function(compressor) {
            return !!is_strict(compressor) && !(this.expression instanceof AST_Function && "prototype" == this.property);
        }), def(AST_Sequence, function(compressor) {
            return this.tail_node()._dot_throw(compressor);
        }), def(AST_SymbolRef, function(compressor) {
            if (this.is_undefined) return !0;
            if (!is_strict(compressor)) return !1;
            if (is_undeclared_ref(this) && this.is_declared(compressor)) return !1;
            if (this.is_immutable()) return !1;
            var fixed = this.fixed_value();
            return !fixed || fixed._dot_throw(compressor);
        });
    }(function(node, func) {
        node.DEFMETHOD("_dot_throw", func);
    }), unary_bool = [ "!", "delete" ], binary_bool = [ "in", "instanceof", "==", "!=", "===", "!==", "<", "<=", ">=", ">" ], 
    (def = function(node, func) {
        node.DEFMETHOD("is_boolean", func);
    })(AST_Node, return_false), def(AST_UnaryPrefix, function() {
        return member(this.operator, unary_bool);
    }), def(AST_Binary, function() {
        return member(this.operator, binary_bool) || lazy_op(this.operator) && this.left.is_boolean() && this.right.is_boolean();
    }), def(AST_Conditional, function() {
        return this.consequent.is_boolean() && this.alternative.is_boolean();
    }), def(AST_Assign, function() {
        return "=" == this.operator && this.right.is_boolean();
    }), def(AST_Sequence, function() {
        return this.tail_node().is_boolean();
    }), def(AST_True, return_true), def(AST_False, return_true), function(def) {
        def(AST_Node, return_false), def(AST_Number, return_true);
        var unary = makePredicate("+ - ~ ++ --");
        def(AST_Unary, function() {
            return unary(this.operator);
        });
        var binary = makePredicate("- * / % & | ^ << >> >>>");
        def(AST_Binary, function(compressor) {
            return binary(this.operator) || "+" == this.operator && this.left.is_number(compressor) && this.right.is_number(compressor);
        }), def(AST_Assign, function(compressor) {
            return binary(this.operator.slice(0, -1)) || "=" == this.operator && this.right.is_number(compressor);
        }), def(AST_Sequence, function(compressor) {
            return this.tail_node().is_number(compressor);
        }), def(AST_Conditional, function(compressor) {
            return this.consequent.is_number(compressor) && this.alternative.is_number(compressor);
        });
    }(function(node, func) {
        node.DEFMETHOD("is_number", func);
    }), function(def) {
        def(AST_Node, return_false), def(AST_String, return_true), def(AST_TemplateString, function() {
            return 1 === this.segments.length;
        }), def(AST_UnaryPrefix, function() {
            return "typeof" == this.operator;
        }), def(AST_Binary, function(compressor) {
            return "+" == this.operator && (this.left.is_string(compressor) || this.right.is_string(compressor));
        }), def(AST_Assign, function(compressor) {
            return ("=" == this.operator || "+=" == this.operator) && this.right.is_string(compressor);
        }), def(AST_Sequence, function(compressor) {
            return this.tail_node().is_string(compressor);
        }), def(AST_Conditional, function(compressor) {
            return this.consequent.is_string(compressor) && this.alternative.is_string(compressor);
        });
    }(function(node, func) {
        node.DEFMETHOD("is_string", func);
    });
    var lazy_op = makePredicate("&& ||"), unary_side_effects = makePredicate("delete ++ --");
    function is_lhs(node, parent) {
        return parent instanceof AST_Unary && unary_side_effects(parent.operator) ? parent.expression : parent instanceof AST_Assign && parent.left === node ? node : void 0;
    }
    function best_of_expression(ast1, ast2) {
        return ast1.print_to_string().length > ast2.print_to_string().length ? ast2 : ast1;
    }
    function best_of(compressor, ast1, ast2) {
        return (first_in_statement(compressor) ? function(ast1, ast2) {
            return best_of_expression(make_node(AST_SimpleStatement, ast1, {
                body: ast1
            }), make_node(AST_SimpleStatement, ast2, {
                body: ast2
            })).body;
        } : best_of_expression)(ast1, ast2);
    }
    function convert_to_predicate(obj) {
        for (var key in obj) obj[key] = makePredicate(obj[key]);
    }
    !function(def) {
        AST_Node.DEFMETHOD("resolve_defines", function(compressor) {
            if (compressor.option("global_defs")) {
                var def = this._find_defs(compressor, "");
                if (def) {
                    var node, parent = this, level = 0;
                    do {
                        node = parent, parent = compressor.parent(level++);
                    } while (parent instanceof AST_PropAccess && parent.expression === node);
                    if (!is_lhs(node, parent)) return def;
                    compressor.warn("global_defs " + this.print_to_string() + " redefined [{file}:{line},{col}]", this.start);
                }
            }
        }), def(AST_Node, noop), def(AST_Dot, function(compressor, suffix) {
            return this.expression._find_defs(compressor, "." + this.property + suffix);
        }), def(AST_SymbolRef, function(compressor, suffix) {
            if (this.global()) {
                var name, defines = compressor.option("global_defs");
                if (defines && HOP(defines, name = this.name + suffix)) {
                    var node = function to_node(value, orig) {
                        if (value instanceof AST_Node) return make_node(value.CTOR, orig, value);
                        if (Array.isArray(value)) return make_node(AST_Array, orig, {
                            elements: value.map(function(value) {
                                return to_node(value, orig);
                            })
                        });
                        if (value && "object" == typeof value) {
                            var props = [];
                            for (var key in value) HOP(value, key) && props.push(make_node(AST_ObjectKeyVal, orig, {
                                key,
                                value: to_node(value[key], orig)
                            }));
                            return make_node(AST_Object, orig, {
                                properties: props
                            });
                        }
                        return make_node_from_constant(value, orig);
                    }(defines[name], this), top = compressor.find_parent(AST_Toplevel);
                    return node.walk(new TreeWalker(function(node) {
                        node instanceof AST_SymbolRef && (node.scope = top, node.thedef = top.def_global(node));
                    })), node;
                }
            }
        });
    }(function(node, func) {
        node.DEFMETHOD("_find_defs", func);
    });
    var object_fns = [ "constructor", "toString", "valueOf" ], native_fns = {
        Array: [ "indexOf", "join", "lastIndexOf", "slice" ].concat(object_fns),
        Boolean: object_fns,
        Number: [ "toExponential", "toFixed", "toPrecision" ].concat(object_fns),
        Object: object_fns,
        RegExp: [ "test" ].concat(object_fns),
        String: [ "charAt", "charCodeAt", "concat", "indexOf", "italics", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "trim" ].concat(object_fns)
    };
    convert_to_predicate(native_fns);
    var static_fns = {
        Array: [ "isArray" ],
        Math: [ "abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "log", "round", "sin", "sqrt", "tan", "atan2", "pow", "max", "min" ],
        Number: [ "isFinite", "isNaN" ],
        Object: [ "create", "getOwnPropertyDescriptor", "getOwnPropertyNames", "getPrototypeOf", "isExtensible", "isFrozen", "isSealed", "keys" ],
        String: [ "fromCharCode" ]
    };
    convert_to_predicate(static_fns), function(def) {
        AST_Node.DEFMETHOD("evaluate", function(compressor) {
            if (!compressor.option("evaluate")) return this;
            var val = this._eval(compressor, 1);
            return !val || val instanceof RegExp || "object" != typeof val ? val : this;
        });
        var unaryPrefix = makePredicate("! ~ - + void");
        AST_Node.DEFMETHOD("is_constant", function() {
            return this instanceof AST_Constant ? !(this instanceof AST_RegExp) : this instanceof AST_UnaryPrefix && this.expression instanceof AST_Constant && unaryPrefix(this.operator);
        }), def(AST_Statement, function() {
            throw new Error(string_template("Cannot evaluate a statement [{file}:{line},{col}]", this.start));
        }), def(AST_Lambda, return_this), def(AST_Class, return_this), def(AST_Node, return_this), 
        def(AST_Constant, function() {
            return this.getValue();
        }), def(AST_TemplateString, function() {
            return 1 !== this.segments.length ? this : this.segments[0].value;
        }), def(AST_Array, function(compressor, depth) {
            if (compressor.option("unsafe")) {
                for (var elements = [], i = 0, len = this.elements.length; i < len; i++) {
                    var element = this.elements[i];
                    if (element instanceof AST_Function) elements.push(element); else {
                        var value = element._eval(compressor, depth);
                        if (element === value) return this;
                        elements.push(value);
                    }
                }
                return elements;
            }
            return this;
        }), def(AST_Object, function(compressor, depth) {
            if (compressor.option("unsafe")) {
                for (var val = {}, i = 0, len = this.properties.length; i < len; i++) {
                    var prop = this.properties[i];
                    if (prop instanceof AST_Expansion) return this;
                    var key = prop.key;
                    if (key instanceof AST_Symbol) key = key.name; else if (key instanceof AST_Node && (key = key._eval(compressor, depth)) === prop.key) return this;
                    if ("function" == typeof Object.prototype[key]) return this;
                    if (!(prop.value instanceof AST_Function) && (val[key] = prop.value._eval(compressor, depth), 
                    val[key] === prop.value)) return this;
                }
                return val;
            }
            return this;
        }), def(AST_UnaryPrefix, function(compressor, depth) {
            var e = this.expression;
            if (compressor.option("typeofs") && "typeof" == this.operator && (e instanceof AST_Lambda || e instanceof AST_SymbolRef && e.fixed_value() instanceof AST_Lambda)) return "function";
            if ((e = e._eval(compressor, depth)) === this.expression) return this;
            switch (this.operator) {
              case "!":
                return !e;

              case "typeof":
                return e instanceof RegExp ? this : typeof e;

              case "void":
                return;

              case "~":
                return ~e;

              case "-":
                return -e;

              case "+":
                return +e;
            }
            return this;
        }), def(AST_Binary, function(compressor, depth) {
            var left = this.left._eval(compressor, depth);
            if (left === this.left) return this;
            var result, right = this.right._eval(compressor, depth);
            if (right === this.right) return this;
            switch (this.operator) {
              case "&&":
                result = left && right;
                break;

              case "||":
                result = left || right;
                break;

              case "|":
                result = left | right;
                break;

              case "&":
                result = left & right;
                break;

              case "^":
                result = left ^ right;
                break;

              case "+":
                result = left + right;
                break;

              case "*":
                result = left * right;
                break;

              case "**":
                result = Math.pow(left, right);
                break;

              case "/":
                result = left / right;
                break;

              case "%":
                result = left % right;
                break;

              case "-":
                result = left - right;
                break;

              case "<<":
                result = left << right;
                break;

              case ">>":
                result = left >> right;
                break;

              case ">>>":
                result = left >>> right;
                break;

              case "==":
                result = left == right;
                break;

              case "===":
                result = left === right;
                break;

              case "!=":
                result = left != right;
                break;

              case "!==":
                result = left !== right;
                break;

              case "<":
                result = left < right;
                break;

              case "<=":
                result = left <= right;
                break;

              case ">":
                result = left > right;
                break;

              case ">=":
                result = left >= right;
                break;

              default:
                return this;
            }
            return isNaN(result) && compressor.find_parent(AST_With) ? this : result;
        }), def(AST_Conditional, function(compressor, depth) {
            var condition = this.condition._eval(compressor, depth);
            if (condition === this.condition) return this;
            var node = condition ? this.consequent : this.alternative, value = node._eval(compressor, depth);
            return value === node ? this : value;
        }), def(AST_SymbolRef, function(compressor, depth) {
            var value, fixed = this.fixed_value();
            if (!fixed) return this;
            if (HOP(fixed, "_eval")) value = fixed._eval(); else {
                if (this._eval = return_this, value = fixed._eval(compressor, depth), delete this._eval, 
                value === fixed) return this;
                fixed._eval = function() {
                    return value;
                };
            }
            if (value && "object" == typeof value) {
                var escaped = this.definition().escaped;
                if (escaped && depth > escaped) return this;
            }
            return value;
        });
        var global_objs = {
            Array,
            Math,
            Number,
            Object,
            String
        }, static_values = {
            Math: [ "E", "LN10", "LN2", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2" ],
            Number: [ "MAX_VALUE", "MIN_VALUE", "NaN", "NEGATIVE_INFINITY", "POSITIVE_INFINITY" ]
        };
        convert_to_predicate(static_values), def(AST_PropAccess, function(compressor, depth) {
            if (compressor.option("unsafe")) {
                var key = this.property;
                if (key instanceof AST_Node && (key = key._eval(compressor, depth)) === this.property) return this;
                var val, exp = this.expression;
                if (is_undeclared_ref(exp)) {
                    if (!(static_values[exp.name] || return_false)(key)) return this;
                    val = global_objs[exp.name];
                } else if (!(val = exp._eval(compressor, depth + 1)) || val === exp || !HOP(val, key)) return this;
                return val[key];
            }
            return this;
        }), def(AST_Call, function(compressor, depth) {
            var exp = this.expression;
            if (compressor.option("unsafe") && exp instanceof AST_PropAccess) {
                var val, key = exp.property;
                if (key instanceof AST_Node && (key = key._eval(compressor, depth)) === exp.property) return this;
                var e = exp.expression;
                if (is_undeclared_ref(e)) {
                    if (!(static_fns[e.name] || return_false)(key)) return this;
                    val = global_objs[e.name];
                } else if ((val = e._eval(compressor, depth + 1)) === e || !(val && native_fns[val.constructor.name] || return_false)(key)) return this;
                for (var args = [], i = 0, len = this.args.length; i < len; i++) {
                    var arg = this.args[i], value = arg._eval(compressor, depth);
                    if (arg === value) return this;
                    args.push(value);
                }
                try {
                    return val[key].apply(val, args);
                } catch (ex) {
                    compressor.warn("Error evaluating {code} [{file}:{line},{col}]", {
                        code: this.print_to_string(),
                        file: this.start.file,
                        line: this.start.line,
                        col: this.start.col
                    });
                }
            }
            return this;
        }), def(AST_New, return_this);
    }(function(node, func) {
        node.DEFMETHOD("_eval", func);
    }), function(def) {
        function basic_negation(exp) {
            return make_node(AST_UnaryPrefix, exp, {
                operator: "!",
                expression: exp
            });
        }
        function best(orig, alt, first_in_statement) {
            var negated = basic_negation(orig);
            if (first_in_statement) {
                var stat = make_node(AST_SimpleStatement, alt, {
                    body: alt
                });
                return best_of_expression(negated, stat) === stat ? alt : negated;
            }
            return best_of_expression(negated, alt);
        }
        def(AST_Node, function() {
            return basic_negation(this);
        }), def(AST_Statement, function() {
            throw new Error("Cannot negate a statement");
        }), def(AST_Function, function() {
            return basic_negation(this);
        }), def(AST_Arrow, function() {
            return basic_negation(this);
        }), def(AST_UnaryPrefix, function() {
            return "!" == this.operator ? this.expression : basic_negation(this);
        }), def(AST_Sequence, function(compressor) {
            var expressions = this.expressions.slice();
            return expressions.push(expressions.pop().negate(compressor)), make_sequence(this, expressions);
        }), def(AST_Conditional, function(compressor, first_in_statement) {
            var self = this.clone();
            return self.consequent = self.consequent.negate(compressor), self.alternative = self.alternative.negate(compressor), 
            best(this, self, first_in_statement);
        }), def(AST_Binary, function(compressor, first_in_statement) {
            var self = this.clone(), op = this.operator;
            if (compressor.option("unsafe_comps")) switch (op) {
              case "<=":
                return self.operator = ">", self;

              case "<":
                return self.operator = ">=", self;

              case ">=":
                return self.operator = "<", self;

              case ">":
                return self.operator = "<=", self;
            }
            switch (op) {
              case "==":
                return self.operator = "!=", self;

              case "!=":
                return self.operator = "==", self;

              case "===":
                return self.operator = "!==", self;

              case "!==":
                return self.operator = "===", self;

              case "&&":
                return self.operator = "||", self.left = self.left.negate(compressor, first_in_statement), 
                self.right = self.right.negate(compressor), best(this, self, first_in_statement);

              case "||":
                return self.operator = "&&", self.left = self.left.negate(compressor, first_in_statement), 
                self.right = self.right.negate(compressor), best(this, self, first_in_statement);
            }
            return basic_negation(this);
        });
    }(function(node, func) {
        node.DEFMETHOD("negate", function(compressor, first_in_statement) {
            return func.call(this, compressor, first_in_statement);
        });
    });
    var global_pure_fns = makePredicate("Boolean decodeURI decodeURIComponent Date encodeURI encodeURIComponent Error escape EvalError isFinite isNaN Number Object parseFloat parseInt RangeError ReferenceError String SyntaxError TypeError unescape URIError");
    function aborts(thing) {
        return thing && thing.aborts();
    }
    AST_Call.DEFMETHOD("is_expr_pure", function(compressor) {
        if (compressor.option("unsafe")) {
            var expr = this.expression;
            if (is_undeclared_ref(expr) && global_pure_fns(expr.name)) return !0;
            if (expr instanceof AST_Dot && is_undeclared_ref(expr.expression) && (static_fns[expr.expression.name] || return_false)(expr.property)) return !0;
        }
        return this.pure || !compressor.pure_funcs(this);
    }), AST_Node.DEFMETHOD("is_call_pure", return_false), AST_Dot.DEFMETHOD("is_call_pure", function(compressor) {
        if (compressor.option("unsafe")) {
            var expr = this.expression, fns = return_false;
            return expr instanceof AST_Array ? fns = native_fns.Array : expr.is_boolean() ? fns = native_fns.Boolean : expr.is_number(compressor) ? fns = native_fns.Number : expr instanceof AST_RegExp ? fns = native_fns.RegExp : expr.is_string(compressor) ? fns = native_fns.String : this.may_throw_on_access(compressor) || (fns = native_fns.Object), 
            fns(this.property);
        }
    }), function(def) {
        function any(list, compressor) {
            for (var i = list.length; --i >= 0; ) if (list[i].has_side_effects(compressor)) return !0;
            return !1;
        }
        def(AST_Node, return_true), def(AST_EmptyStatement, return_false), def(AST_Constant, return_false), 
        def(AST_This, return_false), def(AST_Block, function(compressor) {
            return any(this.body, compressor);
        }), def(AST_Call, function(compressor) {
            return !(this.is_expr_pure(compressor) || this.expression.is_call_pure(compressor) && !this.expression.has_side_effects(compressor)) || any(this.args, compressor);
        }), def(AST_Switch, function(compressor) {
            return this.expression.has_side_effects(compressor) || any(this.body, compressor);
        }), def(AST_Case, function(compressor) {
            return this.expression.has_side_effects(compressor) || any(this.body, compressor);
        }), def(AST_Try, function(compressor) {
            return any(this.body, compressor) || this.bcatch && this.bcatch.has_side_effects(compressor) || this.bfinally && this.bfinally.has_side_effects(compressor);
        }), def(AST_If, function(compressor) {
            return this.condition.has_side_effects(compressor) || this.body && this.body.has_side_effects(compressor) || this.alternative && this.alternative.has_side_effects(compressor);
        }), def(AST_LabeledStatement, function(compressor) {
            return this.body.has_side_effects(compressor);
        }), def(AST_SimpleStatement, function(compressor) {
            return this.body.has_side_effects(compressor);
        }), def(AST_Lambda, return_false), def(AST_Class, return_false), def(AST_DefClass, return_true), 
        def(AST_Binary, function(compressor) {
            return this.left.has_side_effects(compressor) || this.right.has_side_effects(compressor);
        }), def(AST_Assign, return_true), def(AST_Conditional, function(compressor) {
            return this.condition.has_side_effects(compressor) || this.consequent.has_side_effects(compressor) || this.alternative.has_side_effects(compressor);
        }), def(AST_Unary, function(compressor) {
            return unary_side_effects(this.operator) || this.expression.has_side_effects(compressor);
        }), def(AST_SymbolRef, function(compressor) {
            return !this.is_declared(compressor);
        }), def(AST_SymbolDeclaration, return_false), def(AST_Object, function(compressor) {
            return any(this.properties, compressor);
        }), def(AST_ObjectProperty, function(compressor) {
            return !!(this.key instanceof AST_ObjectKeyVal && this.key.has_side_effects(compressor)) || this.value.has_side_effects(compressor);
        }), def(AST_Array, function(compressor) {
            return any(this.elements, compressor);
        }), def(AST_Dot, function(compressor) {
            return this.expression.may_throw_on_access(compressor) || this.expression.has_side_effects(compressor);
        }), def(AST_Sub, function(compressor) {
            return this.expression.may_throw_on_access(compressor) || this.expression.has_side_effects(compressor) || this.property.has_side_effects(compressor);
        }), def(AST_Sequence, function(compressor) {
            return any(this.expressions, compressor);
        }), def(AST_Definitions, function(compressor) {
            return any(this.definitions, compressor);
        }), def(AST_VarDef, function(compressor) {
            return this.value;
        }), def(AST_TemplateSegment, return_false), def(AST_TemplateString, function(compressor) {
            return any(this.segments, compressor);
        });
    }(function(node, func) {
        node.DEFMETHOD("has_side_effects", func);
    }), function(def) {
        function any(list, compressor) {
            for (var i = list.length; --i >= 0; ) if (list[i].may_throw(compressor)) return !0;
            return !1;
        }
        def(AST_Node, return_true), def(AST_Class, return_false), def(AST_Constant, return_false), 
        def(AST_EmptyStatement, return_false), def(AST_Lambda, return_false), def(AST_SymbolDeclaration, return_false), 
        def(AST_This, return_false), def(AST_Array, function(compressor) {
            return any(this.elements, compressor);
        }), def(AST_Assign, function(compressor) {
            return "=" != this.operator && this.left.may_throw(compressor) || this.right.may_throw(compressor);
        }), def(AST_Binary, function(compressor) {
            return this.left.may_throw(compressor) || this.right.may_throw(compressor);
        }), def(AST_Block, function(compressor) {
            return any(this.body, compressor);
        }), def(AST_Call, function(compressor) {
            return !!any(this.args, compressor) || !this.is_expr_pure(compressor) && (!!this.expression.may_throw(compressor) || (!(this.expression instanceof AST_Lambda) || any(this.expression.body, compressor)));
        }), def(AST_Case, function(compressor) {
            return this.expression.may_throw(compressor) || any(this.body, compressor);
        }), def(AST_Conditional, function(compressor) {
            return this.condition.may_throw(compressor) || this.consequent.may_throw(compressor) || this.alternative.may_throw(compressor);
        }), def(AST_Definitions, function(compressor) {
            return any(this.definitions, compressor);
        }), def(AST_Dot, function(compressor) {
            return this.expression.may_throw_on_access(compressor) || this.expression.may_throw(compressor);
        }), def(AST_If, function(compressor) {
            return this.condition.may_throw(compressor) || this.body && this.body.may_throw(compressor) || this.alternative && this.alternative.may_throw(compressor);
        }), def(AST_LabeledStatement, function(compressor) {
            return this.body.may_throw(compressor);
        }), def(AST_Object, function(compressor) {
            return any(this.properties, compressor);
        }), def(AST_ObjectProperty, function(compressor) {
            return this.value.may_throw(compressor);
        }), def(AST_Sequence, function(compressor) {
            return any(this.expressions, compressor);
        }), def(AST_SimpleStatement, function(compressor) {
            return this.body.may_throw(compressor);
        }), def(AST_Sub, function(compressor) {
            return this.expression.may_throw_on_access(compressor) || this.expression.may_throw(compressor) || this.property.may_throw(compressor);
        }), def(AST_Switch, function(compressor) {
            return this.expression.may_throw(compressor) || any(this.body, compressor);
        }), def(AST_SymbolRef, function(compressor) {
            return !this.is_declared(compressor);
        }), def(AST_Try, function(compressor) {
            return any(this.body, compressor) || this.bcatch && this.bcatch.may_throw(compressor) || this.bfinally && this.bfinally.may_throw(compressor);
        }), def(AST_Unary, function(compressor) {
            return !("typeof" == this.operator && this.expression instanceof AST_SymbolRef) && this.expression.may_throw(compressor);
        }), def(AST_VarDef, function(compressor) {
            return !!this.value && this.value.may_throw(compressor);
        });
    }(function(node, func) {
        node.DEFMETHOD("may_throw", func);
    }), function(def) {
        function all(list) {
            for (var i = list.length; --i >= 0; ) if (!list[i].is_constant_expression()) return !1;
            return !0;
        }
        function all_refs_local(scope) {
            var self = this, result = !0;
            return self.walk(new TreeWalker(function(node) {
                if (!result) return !0;
                if (node instanceof AST_SymbolRef) {
                    if (self.inlined) return result = !1, !0;
                    var def = node.definition();
                    if (member(def, self.enclosed) && !self.variables.has(def.name)) {
                        if (scope) {
                            var scope_def = scope.find_variable(node);
                            if (def.undeclared ? !scope_def : scope_def === def) return result = "f", !0;
                        }
                        result = !1;
                    }
                    return !0;
                }
                return node instanceof AST_This && self instanceof AST_Arrow ? (result = !1, !0) : void 0;
            })), result;
        }
        def(AST_Node, return_false), def(AST_Constant, return_true), def(AST_Class, all_refs_local), 
        def(AST_Lambda, all_refs_local), def(AST_Unary, function() {
            return this.expression.is_constant_expression();
        }), def(AST_Binary, function() {
            return this.left.is_constant_expression() && this.right.is_constant_expression();
        }), def(AST_Array, function() {
            return all(this.elements);
        }), def(AST_Object, function() {
            return all(this.properties);
        }), def(AST_ObjectProperty, function() {
            return !(this.key instanceof AST_Node) && this.value.is_constant_expression();
        });
    }(function(node, func) {
        node.DEFMETHOD("is_constant_expression", func);
    }), function(def) {
        function block_aborts() {
            var n = this.body.length;
            return n > 0 && aborts(this.body[n - 1]);
        }
        def(AST_Statement, return_null), def(AST_Jump, return_this), def(AST_Import, function() {
            return null;
        }), def(AST_BlockStatement, block_aborts), def(AST_SwitchBranch, block_aborts), 
        def(AST_If, function() {
            return this.alternative && aborts(this.body) && aborts(this.alternative) && this;
        });
    }(function(node, func) {
        node.DEFMETHOD("aborts", func);
    }), OPT(AST_Directive, function(self, compressor) {
        return compressor.has_directive(self.value) !== self ? make_node(AST_EmptyStatement, self) : self;
    }), OPT(AST_Debugger, function(self, compressor) {
        return compressor.option("drop_debugger") ? make_node(AST_EmptyStatement, self) : self;
    }), OPT(AST_LabeledStatement, function(self, compressor) {
        return self.body instanceof AST_Break && compressor.loopcontrol_target(self.body) === self.body ? make_node(AST_EmptyStatement, self) : 0 == self.label.references.length ? self.body : self;
    }), OPT(AST_Block, function(self, compressor) {
        return tighten_body(self.body, compressor), self;
    }), OPT(AST_BlockStatement, function(self, compressor) {
        switch (tighten_body(self.body, compressor), self.body.length) {
          case 1:
            if (!compressor.has_directive("use strict") && compressor.parent() instanceof AST_If || can_be_evicted_from_block(self.body[0])) return self.body[0];
            break;

          case 0:
            return make_node(AST_EmptyStatement, self);
        }
        return self;
    }), AST_Scope.DEFMETHOD("drop_unused", function(compressor) {
        if (compressor.option("unused") && !compressor.has_directive("use asm")) {
            var self = this;
            if (!self.uses_eval && !self.uses_with) {
                var drop_funcs = !(self instanceof AST_Toplevel) || compressor.toplevel.funcs, drop_vars = !(self instanceof AST_Toplevel) || compressor.toplevel.vars, assign_as_unused = /keep_assign/.test(compressor.option("unused")) ? return_false : function(node) {
                    return node instanceof AST_Assign && (node.write_only || "=" == node.operator) ? node.left : node instanceof AST_Unary && node.write_only ? node.expression : void 0;
                }, in_use = [], in_use_ids = Object.create(null), fixed_ids = Object.create(null);
                self instanceof AST_Toplevel && compressor.top_retain && self.variables.each(function(def) {
                    !compressor.top_retain(def) || def.id in in_use_ids || (in_use_ids[def.id] = !0, 
                    in_use.push(def));
                });
                var var_defs_by_id = new Dictionary(), initializations = new Dictionary(), destructuring_value = null, scope = this, tw = new TreeWalker(function(node, descend) {
                    if (node !== self) {
                        if (node instanceof AST_Defun || node instanceof AST_DefClass) {
                            var node_def = node.name.definition();
                            return ((in_export = tw.parent() instanceof AST_Export) || !drop_funcs && scope === self) && (!node_def.global || node_def.id in in_use_ids || (in_use_ids[node_def.id] = !0, 
                            in_use.push(node_def))), initializations.add(node_def.id, node), !0;
                        }
                        if (node instanceof AST_SymbolFunarg && scope === self && var_defs_by_id.add(node.definition().id, node), 
                        node instanceof AST_Definitions && scope === self) {
                            var in_export = tw.parent() instanceof AST_Export;
                            return node.definitions.forEach(function(def) {
                                if (def.name instanceof AST_SymbolVar && var_defs_by_id.add(def.name.definition().id, def), 
                                !in_export && drop_vars || def.name.walk(new TreeWalker(function(node) {
                                    if (node instanceof AST_SymbolDeclaration) {
                                        var def = node.definition();
                                        !in_export && !def.global || def.id in in_use_ids || (in_use_ids[def.id] = !0, in_use.push(def));
                                    }
                                })), def.value) {
                                    if (def.name instanceof AST_Destructuring) {
                                        var destructuring_cache = destructuring_value;
                                        destructuring_value = def.value, def.walk(tw), destructuring_value = destructuring_cache;
                                    } else {
                                        var node_def = def.name.definition();
                                        initializations.add(node_def.id, def.value), def.name.fixed_value() === def.value && (fixed_ids[node_def.id] = def);
                                    }
                                    def.value.has_side_effects(compressor) && def.value.walk(tw);
                                }
                            }), !0;
                        }
                        return node.destructuring && destructuring_value && initializations.add(node.name, destructuring_value), 
                        scan_ref_scoped(node, descend);
                    }
                });
                self.walk(tw), tw = new TreeWalker(scan_ref_scoped);
                for (var i = 0; i < in_use.length; i++) {
                    var init = initializations.get(in_use[i].id);
                    init && init.forEach(function(init) {
                        init.walk(tw);
                    });
                }
                var tt = new TreeTransformer(function(node, descend, in_list) {
                    var parent = tt.parent();
                    if (drop_vars && (sym = assign_as_unused(node)) instanceof AST_SymbolRef) {
                        var in_use = (def = sym.definition()).id in in_use_ids;
                        if (node instanceof AST_Assign) {
                            if (!in_use || def.id in fixed_ids && fixed_ids[def.id] !== node) return maintain_this_binding(parent, node, node.right.transform(tt));
                        } else if (!in_use) return make_node(AST_Number, node, {
                            value: 0
                        });
                    }
                    if (scope === self) {
                        var def;
                        if (node.name && (!compressor.option("keep_classnames") && node instanceof AST_ClassExpression || !compressor.option("keep_fnames") && node instanceof AST_Function)) (def = node.name.definition()).id in in_use_ids && !(def.orig.length > 1) || (node.name = null);
                        if (node instanceof AST_Lambda && !(node instanceof AST_Accessor)) for (var trim = !compressor.option("keep_fargs"), a = node.argnames, i = a.length; --i >= 0; ) {
                            var sym;
                            (sym = a[i]) instanceof AST_Expansion && (sym = sym.expression), sym instanceof AST_DefaultAssign && (sym = sym.left), 
                            sym instanceof AST_Destructuring || sym.definition().id in in_use_ids ? trim = !1 : (sym.__unused = !0, 
                            trim && (a.pop(), compressor[sym.unreferenced() ? "warn" : "info"]("Dropping unused function argument {name} [{file}:{line},{col}]", template(sym))));
                        }
                        if ((node instanceof AST_Defun || node instanceof AST_DefClass) && node !== self) if (!((def = node.name.definition()).id in in_use_ids || !drop_funcs && def.global)) return compressor[node.name.unreferenced() ? "warn" : "info"]("Dropping unused function {name} [{file}:{line},{col}]", template(node.name)), 
                        def.eliminated++, make_node(AST_EmptyStatement, node);
                        if (node instanceof AST_Definitions && !(parent instanceof AST_ForIn && parent.init === node)) {
                            var drop_block = !(parent instanceof AST_Toplevel || node instanceof AST_Var), body = [], head = [], tail = [], side_effects = [];
                            switch (node.definitions.forEach(function(def) {
                                if (def.value && (def.value = def.value.transform(tt)), def.name instanceof AST_Destructuring) return tail.push(def);
                                var sym = def.name.definition();
                                if (drop_block && sym.global) return tail.push(def);
                                if (!drop_vars && !drop_block || sym.id in in_use_ids) {
                                    if (def.value && sym.id in fixed_ids && fixed_ids[sym.id] !== def && (def.value = def.value.drop_side_effect_free(compressor)), 
                                    def.name instanceof AST_SymbolVar) {
                                        var var_defs = var_defs_by_id.get(sym.id);
                                        if (var_defs.length > 1 && (!def.value || sym.orig.indexOf(def.name) > sym.eliminated)) {
                                            if (compressor.warn("Dropping duplicated definition of variable {name} [{file}:{line},{col}]", template(def.name)), 
                                            def.value) {
                                                var ref = make_node(AST_SymbolRef, def.name, def.name);
                                                sym.references.push(ref);
                                                var assign = make_node(AST_Assign, def, {
                                                    operator: "=",
                                                    left: ref,
                                                    right: def.value
                                                });
                                                fixed_ids[sym.id] === def && (fixed_ids[sym.id] = assign), side_effects.push(assign.transform(tt));
                                            }
                                            return remove(var_defs, def), void sym.eliminated++;
                                        }
                                    }
                                    def.value ? (side_effects.length > 0 && (tail.length > 0 ? (side_effects.push(def.value), 
                                    def.value = make_sequence(def.value, side_effects)) : body.push(make_node(AST_SimpleStatement, node, {
                                        body: make_sequence(node, side_effects)
                                    })), side_effects = []), tail.push(def)) : head.push(def);
                                } else if (sym.orig[0] instanceof AST_SymbolCatch) {
                                    (value = def.value && def.value.drop_side_effect_free(compressor)) && side_effects.push(value), 
                                    def.value = null, head.push(def);
                                } else {
                                    var value;
                                    (value = def.value && def.value.drop_side_effect_free(compressor)) ? (compressor.warn("Side effects in initialization of unused variable {name} [{file}:{line},{col}]", template(def.name)), 
                                    side_effects.push(value)) : compressor[def.name.unreferenced() ? "warn" : "info"]("Dropping unused variable {name} [{file}:{line},{col}]", template(def.name)), 
                                    sym.eliminated++;
                                }
                            }), (head.length > 0 || tail.length > 0) && (node.definitions = head.concat(tail), 
                            body.push(node)), side_effects.length > 0 && body.push(make_node(AST_SimpleStatement, node, {
                                body: make_sequence(node, side_effects)
                            })), body.length) {
                              case 0:
                                return in_list ? MAP.skip : make_node(AST_EmptyStatement, node);

                              case 1:
                                return body[0];

                              default:
                                return in_list ? MAP.splice(body) : make_node(AST_BlockStatement, node, {
                                    body
                                });
                            }
                        }
                        if (node instanceof AST_For) return descend(node, this), node.init instanceof AST_BlockStatement && (block = node.init, 
                        node.init = block.body.pop(), block.body.push(node)), node.init instanceof AST_SimpleStatement ? node.init = node.init.body : is_empty(node.init) && (node.init = null), 
                        block ? in_list ? MAP.splice(block.body) : block : node;
                        if (node instanceof AST_LabeledStatement && node.body instanceof AST_For) {
                            if (descend(node, this), node.body instanceof AST_BlockStatement) {
                                var block = node.body;
                                return node.body = block.body.pop(), block.body.push(node), in_list ? MAP.splice(block.body) : block;
                            }
                            return node;
                        }
                        if (node instanceof AST_BlockStatement) return descend(node, this), in_list && all(node.body, can_be_evicted_from_block) ? MAP.splice(node.body) : node;
                        if (node instanceof AST_Scope) {
                            var save_scope = scope;
                            return scope = node, descend(node, this), scope = save_scope, node;
                        }
                    }
                    function template(sym) {
                        return {
                            name: sym.name,
                            file: sym.start.file,
                            line: sym.start.line,
                            col: sym.start.col
                        };
                    }
                });
                self.transform(tt);
            }
        }
        function scan_ref_scoped(node, descend) {
            var node_def, sym = assign_as_unused(node);
            if (sym instanceof AST_SymbolRef && !is_ref_of(node.left, AST_SymbolBlockDeclaration) && self.variables.get(sym.name) === (node_def = sym.definition())) return node instanceof AST_Assign && (node.right.walk(tw), 
            node.left.fixed_value() === node.right && (fixed_ids[node_def.id] = node)), !0;
            if (node instanceof AST_SymbolRef) return (node_def = node.definition()).id in in_use_ids || (in_use_ids[node_def.id] = !0, 
            in_use.push(node_def), (node_def = node_def.redefined()) && (in_use_ids[node_def.id] = !0, 
            in_use.push(node_def))), !0;
            if (node instanceof AST_Scope) {
                var save_scope = scope;
                return scope = node, descend(), scope = save_scope, !0;
            }
        }
    }), AST_Scope.DEFMETHOD("hoist_declarations", function(compressor) {
        var self = this;
        if (compressor.has_directive("use asm")) return self;
        if (!Array.isArray(self.body)) return self;
        var hoist_funs = compressor.option("hoist_funs"), hoist_vars = compressor.option("hoist_vars");
        if (hoist_funs || hoist_vars) {
            var dirs = [], hoisted = [], vars = new Dictionary(), vars_found = 0, var_decl = 0;
            self.walk(new TreeWalker(function(node) {
                return node instanceof AST_Scope && node !== self || (node instanceof AST_Var ? (++var_decl, 
                !0) : void 0);
            })), hoist_vars = hoist_vars && var_decl > 1;
            var tt = new TreeTransformer(function(node) {
                if (node !== self) {
                    if (node instanceof AST_Directive) return dirs.push(node), make_node(AST_EmptyStatement, node);
                    if (hoist_funs && node instanceof AST_Defun && !(tt.parent() instanceof AST_Export) && tt.parent() === self) return hoisted.push(node), 
                    make_node(AST_EmptyStatement, node);
                    if (hoist_vars && node instanceof AST_Var) {
                        node.definitions.forEach(function(def) {
                            def.name instanceof AST_Destructuring || (vars.set(def.name.name, def), ++vars_found);
                        });
                        var seq = node.to_assignments(compressor), p = tt.parent();
                        if (p instanceof AST_ForIn && p.init === node) {
                            if (null == seq) {
                                var def = node.definitions[0].name;
                                return make_node(AST_SymbolRef, def, def);
                            }
                            return seq;
                        }
                        return p instanceof AST_For && p.init === node ? seq : seq ? make_node(AST_SimpleStatement, node, {
                            body: seq
                        }) : make_node(AST_EmptyStatement, node);
                    }
                    if (node instanceof AST_Scope) return node;
                }
            });
            if (self = self.transform(tt), vars_found > 0) {
                var defs = [];
                if (vars.each(function(def, name) {
                    self instanceof AST_Lambda && find_if(function(x) {
                        return x.name == def.name.name;
                    }, self.args_as_names()) ? vars.del(name) : ((def = def.clone()).value = null, defs.push(def), 
                    vars.set(name, def));
                }), defs.length > 0) {
                    for (var i = 0; i < self.body.length; ) {
                        if (self.body[i] instanceof AST_SimpleStatement) {
                            var sym, assign, expr = self.body[i].body;
                            if (expr instanceof AST_Assign && "=" == expr.operator && (sym = expr.left) instanceof AST_Symbol && vars.has(sym.name)) {
                                if ((def = vars.get(sym.name)).value) break;
                                def.value = expr.right, remove(defs, def), defs.push(def), self.body.splice(i, 1);
                                continue;
                            }
                            if (expr instanceof AST_Sequence && (assign = expr.expressions[0]) instanceof AST_Assign && "=" == assign.operator && (sym = assign.left) instanceof AST_Symbol && vars.has(sym.name)) {
                                var def;
                                if ((def = vars.get(sym.name)).value) break;
                                def.value = assign.right, remove(defs, def), defs.push(def), self.body[i].body = make_sequence(expr, expr.expressions.slice(1));
                                continue;
                            }
                        }
                        if (self.body[i] instanceof AST_EmptyStatement) self.body.splice(i, 1); else {
                            if (!(self.body[i] instanceof AST_BlockStatement)) break;
                            var tmp = [ i, 1 ].concat(self.body[i].body);
                            self.body.splice.apply(self.body, tmp);
                        }
                    }
                    defs = make_node(AST_Var, self, {
                        definitions: defs
                    }), hoisted.push(defs);
                }
            }
            self.body = dirs.concat(hoisted, self.body);
        }
        return self;
    }), AST_Scope.DEFMETHOD("var_names", function() {
        var var_names = this._var_names;
        return var_names || (this._var_names = var_names = Object.create(null), this.enclosed.forEach(function(def) {
            var_names[def.name] = !0;
        }), this.variables.each(function(def, name) {
            var_names[name] = !0;
        })), var_names;
    }), AST_Scope.DEFMETHOD("make_var_name", function(prefix) {
        for (var var_names = this.var_names(), name = prefix = prefix.replace(/[^a-z_$]+/gi, "_"), i = 0; var_names[name]; i++) name = prefix + "$" + i;
        return var_names[name] = !0, name;
    }), AST_Scope.DEFMETHOD("hoist_properties", function(compressor) {
        var self = this;
        if (!compressor.option("hoist_props") || compressor.has_directive("use asm")) return self;
        var top_retain = self instanceof AST_Toplevel && compressor.top_retain || return_false, defs_by_id = Object.create(null), tt = new TreeTransformer(function(node, descend) {
            if (node instanceof AST_Definitions && tt.parent() instanceof AST_Export) return node;
            var value;
            if (node instanceof AST_VarDef && ((sym = node.name).scope === self && 1 != (def = sym.definition()).escaped && !def.single_use && !def.direct_access && !compressor.exposed(def) && !top_retain(def) && (value = sym.fixed_value()) === node.value && value instanceof AST_Object)) {
                descend(node, this);
                var defs = new Dictionary(), assignments = [];
                return value.properties.forEach(function(prop) {
                    var key, new_var, def;
                    assignments.push(make_node(AST_VarDef, node, {
                        name: (key = prop.key, new_var = make_node(sym.CTOR, sym, {
                            name: self.make_var_name(sym.name + "_" + key),
                            scope: self
                        }), def = self.def_variable(new_var), defs.set(key, def), self.enclosed.push(def), 
                        new_var),
                        value: prop.value
                    }));
                }), defs_by_id[def.id] = defs, MAP.splice(assignments);
            }
            if (node instanceof AST_PropAccess && node.expression instanceof AST_SymbolRef && (defs = defs_by_id[node.expression.definition().id])) {
                var sym, def = defs.get(get_value(node.property));
                return (sym = make_node(AST_SymbolRef, node, {
                    name: def.name,
                    scope: node.expression.scope,
                    thedef: def
                })).reference({}), sym;
            }
        });
        return self.transform(tt);
    }), function(def) {
        function trim(nodes, compressor, first_in_statement) {
            var len = nodes.length;
            if (!len) return null;
            for (var ret = [], changed = !1, i = 0; i < len; i++) {
                var node = nodes[i].drop_side_effect_free(compressor, first_in_statement);
                changed |= node !== nodes[i], node && (ret.push(node), first_in_statement = !1);
            }
            return changed ? ret.length ? ret : null : nodes;
        }
        def(AST_Node, return_this), def(AST_Constant, return_null), def(AST_This, return_null), 
        def(AST_Call, function(compressor, first_in_statement) {
            if (!this.is_expr_pure(compressor)) {
                if (this.expression.is_call_pure(compressor)) {
                    var exprs = this.args.slice();
                    return exprs.unshift(this.expression.expression), (exprs = trim(exprs, compressor, first_in_statement)) && make_sequence(this, exprs);
                }
                if (is_func_expr(this.expression) && (!this.expression.name || !this.expression.name.definition().references.length)) {
                    var node = this.clone();
                    return node.expression.process_expression(!1, compressor), node;
                }
                return this;
            }
            this.pure && compressor.warn("Dropping __PURE__ call [{file}:{line},{col}]", this.start);
            var args = trim(this.args, compressor, first_in_statement);
            return args && make_sequence(this, args);
        }), def(AST_Accessor, return_null), def(AST_Function, return_null), def(AST_Arrow, return_null), 
        def(AST_ClassExpression, return_null), def(AST_Binary, function(compressor, first_in_statement) {
            var right = this.right.drop_side_effect_free(compressor);
            if (!right) return this.left.drop_side_effect_free(compressor, first_in_statement);
            if (lazy_op(this.operator)) {
                if (right === this.right) return this;
                var node = this.clone();
                return node.right = right, node;
            }
            var left = this.left.drop_side_effect_free(compressor, first_in_statement);
            return left ? make_sequence(this, [ left, right ]) : this.right.drop_side_effect_free(compressor, first_in_statement);
        }), def(AST_Assign, function(compressor) {
            var left = this.left;
            if (left.has_side_effects(compressor) || compressor.has_directive("use strict") && left instanceof AST_PropAccess && left.expression.is_constant()) return this;
            for (this.write_only = !0; left instanceof AST_PropAccess; ) left = left.expression;
            return left.is_constant_expression(compressor.find_parent(AST_Scope)) ? this.right.drop_side_effect_free(compressor) : this;
        }), def(AST_Conditional, function(compressor) {
            var consequent = this.consequent.drop_side_effect_free(compressor), alternative = this.alternative.drop_side_effect_free(compressor);
            if (consequent === this.consequent && alternative === this.alternative) return this;
            if (!consequent) return alternative ? make_node(AST_Binary, this, {
                operator: "||",
                left: this.condition,
                right: alternative
            }) : this.condition.drop_side_effect_free(compressor);
            if (!alternative) return make_node(AST_Binary, this, {
                operator: "&&",
                left: this.condition,
                right: consequent
            });
            var node = this.clone();
            return node.consequent = consequent, node.alternative = alternative, node;
        }), def(AST_Unary, function(compressor, first_in_statement) {
            if (unary_side_effects(this.operator)) return this.write_only = !this.expression.has_side_effects(compressor), 
            this;
            if ("typeof" == this.operator && this.expression instanceof AST_SymbolRef) return null;
            var expression = this.expression.drop_side_effect_free(compressor, first_in_statement);
            return first_in_statement && expression && is_iife_call(expression) ? expression === this.expression && "!" == this.operator ? this : expression.negate(compressor, first_in_statement) : expression;
        }), def(AST_SymbolRef, function(compressor) {
            return this.is_declared(compressor) ? null : this;
        }), def(AST_Object, function(compressor, first_in_statement) {
            var values = trim(this.properties, compressor, first_in_statement);
            return values && make_sequence(this, values);
        }), def(AST_ObjectProperty, function(compressor, first_in_statement) {
            return this.value.drop_side_effect_free(compressor, first_in_statement);
        }), def(AST_Array, function(compressor, first_in_statement) {
            var values = trim(this.elements, compressor, first_in_statement);
            return values && make_sequence(this, values);
        }), def(AST_Dot, function(compressor, first_in_statement) {
            return this.expression.may_throw_on_access(compressor) ? this : this.expression.drop_side_effect_free(compressor, first_in_statement);
        }), def(AST_Sub, function(compressor, first_in_statement) {
            if (this.expression.may_throw_on_access(compressor)) return this;
            var expression = this.expression.drop_side_effect_free(compressor, first_in_statement);
            if (!expression) return this.property.drop_side_effect_free(compressor, first_in_statement);
            var property = this.property.drop_side_effect_free(compressor);
            return property ? make_sequence(this, [ expression, property ]) : expression;
        }), def(AST_Sequence, function(compressor) {
            var last = this.tail_node(), expr = last.drop_side_effect_free(compressor);
            if (expr === last) return this;
            var expressions = this.expressions.slice(0, -1);
            return expr && expressions.push(expr), make_sequence(this, expressions);
        }), def(AST_Expansion, function(compressor, first_in_statement) {
            return this.expression.drop_side_effect_free(compressor, first_in_statement);
        }), def(AST_TemplateSegment, return_null), def(AST_TemplateString, function(compressor) {
            var values = trim(this.segments, compressor, first_in_statement);
            return values && make_sequence(this, values);
        });
    }(function(node, func) {
        node.DEFMETHOD("drop_side_effect_free", func);
    }), OPT(AST_SimpleStatement, function(self, compressor) {
        if (compressor.option("side_effects")) {
            var body = self.body, node = body.drop_side_effect_free(compressor, !0);
            if (!node) return compressor.warn("Dropping side-effect-free statement [{file}:{line},{col}]", self.start), 
            make_node(AST_EmptyStatement, self);
            if (node !== body) return make_node(AST_SimpleStatement, self, {
                body: node
            });
        }
        return self;
    }), OPT(AST_While, function(self, compressor) {
        return compressor.option("loops") ? make_node(AST_For, self, self).optimize(compressor) : self;
    }), OPT(AST_Do, function(self, compressor) {
        if (!compressor.option("loops")) return self;
        var cond = self.condition.tail_node().evaluate(compressor);
        if (!(cond instanceof AST_Node)) {
            if (cond) return make_node(AST_For, self, {
                body: make_node(AST_BlockStatement, self.body, {
                    body: [ self.body, make_node(AST_SimpleStatement, self.condition, {
                        body: self.condition
                    }) ]
                })
            }).optimize(compressor);
            var has_loop_control = !1, tw = new TreeWalker(function(node) {
                return !!(node instanceof AST_Scope || has_loop_control) || (node instanceof AST_LoopControl && tw.loopcontrol_target(node) === self ? has_loop_control = !0 : void 0);
            }), parent = compressor.parent();
            if ((parent instanceof AST_LabeledStatement ? parent : self).walk(tw), !has_loop_control) return make_node(AST_BlockStatement, self.body, {
                body: [ self.body, make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                }) ]
            }).optimize(compressor);
        }
        return self;
    }), OPT(AST_For, function(self, compressor) {
        if (!compressor.option("loops")) return self;
        if (compressor.option("side_effects") && self.init && (self.init = self.init.drop_side_effect_free(compressor)), 
        self.condition) {
            var cond = self.condition.evaluate(compressor);
            if (!(cond instanceof AST_Node)) if (cond) self.condition = null; else if (!compressor.option("dead_code")) {
                var orig = self.condition;
                self.condition = make_node_from_constant(cond, self.condition), self.condition = best_of_expression(self.condition.transform(compressor), orig);
            }
            if (compressor.option("dead_code") && (cond instanceof AST_Node && (cond = self.condition.tail_node().evaluate(compressor)), 
            !cond)) {
                var body = [];
                return extract_declarations_from_unreachable_code(compressor, self.body, body), 
                self.init instanceof AST_Statement ? body.push(self.init) : self.init && body.push(make_node(AST_SimpleStatement, self.init, {
                    body: self.init
                })), body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                })), make_node(AST_BlockStatement, self, {
                    body
                }).optimize(compressor);
            }
        }
        return function if_break_in_loop(self, compressor) {
            var first = self.body instanceof AST_BlockStatement ? self.body.body[0] : self.body;
            if (compressor.option("dead_code") && is_break(first)) {
                var body = [];
                return self.init instanceof AST_Statement ? body.push(self.init) : self.init && body.push(make_node(AST_SimpleStatement, self.init, {
                    body: self.init
                })), self.condition && body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                })), extract_declarations_from_unreachable_code(compressor, self.body, body), make_node(AST_BlockStatement, self, {
                    body
                });
            }
            return first instanceof AST_If && (is_break(first.body) ? (self.condition ? self.condition = make_node(AST_Binary, self.condition, {
                left: self.condition,
                operator: "&&",
                right: first.condition.negate(compressor)
            }) : self.condition = first.condition.negate(compressor), drop_it(first.alternative)) : is_break(first.alternative) && (self.condition ? self.condition = make_node(AST_Binary, self.condition, {
                left: self.condition,
                operator: "&&",
                right: first.condition
            }) : self.condition = first.condition, drop_it(first.body))), self;
            function is_break(node) {
                return node instanceof AST_Break && compressor.loopcontrol_target(node) === compressor.self();
            }
            function drop_it(rest) {
                rest = as_statement_array(rest), self.body instanceof AST_BlockStatement ? (self.body = self.body.clone(), 
                self.body.body = rest.concat(self.body.body.slice(1)), self.body = self.body.transform(compressor)) : self.body = make_node(AST_BlockStatement, self.body, {
                    body: rest
                }).transform(compressor), self = if_break_in_loop(self, compressor);
            }
        }(self, compressor);
    }), OPT(AST_If, function(self, compressor) {
        if (is_empty(self.alternative) && (self.alternative = null), !compressor.option("conditionals")) return self;
        var cond = self.condition.evaluate(compressor);
        if (!(compressor.option("dead_code") || cond instanceof AST_Node)) {
            var orig = self.condition;
            self.condition = make_node_from_constant(cond, orig), self.condition = best_of_expression(self.condition.transform(compressor), orig);
        }
        if (compressor.option("dead_code")) {
            if (cond instanceof AST_Node && (cond = self.condition.tail_node().evaluate(compressor)), 
            !cond) {
                compressor.warn("Condition always false [{file}:{line},{col}]", self.condition.start);
                var body = [];
                return extract_declarations_from_unreachable_code(compressor, self.body, body), 
                body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                })), self.alternative && body.push(self.alternative), make_node(AST_BlockStatement, self, {
                    body
                }).optimize(compressor);
            }
            if (!(cond instanceof AST_Node)) {
                compressor.warn("Condition always true [{file}:{line},{col}]", self.condition.start);
                body = [];
                return self.alternative && extract_declarations_from_unreachable_code(compressor, self.alternative, body), 
                body.push(make_node(AST_SimpleStatement, self.condition, {
                    body: self.condition
                })), body.push(self.body), make_node(AST_BlockStatement, self, {
                    body
                }).optimize(compressor);
            }
        }
        var negated = self.condition.negate(compressor), self_condition_length = self.condition.print_to_string().length, negated_length = negated.print_to_string().length, negated_is_best = negated_length < self_condition_length;
        if (self.alternative && negated_is_best) {
            negated_is_best = !1, self.condition = negated;
            var tmp = self.body;
            self.body = self.alternative || make_node(AST_EmptyStatement, self), self.alternative = tmp;
        }
        if (is_empty(self.body) && is_empty(self.alternative)) return make_node(AST_SimpleStatement, self.condition, {
            body: self.condition.clone()
        }).optimize(compressor);
        if (self.body instanceof AST_SimpleStatement && self.alternative instanceof AST_SimpleStatement) return make_node(AST_SimpleStatement, self, {
            body: make_node(AST_Conditional, self, {
                condition: self.condition,
                consequent: self.body.body,
                alternative: self.alternative.body
            })
        }).optimize(compressor);
        if (is_empty(self.alternative) && self.body instanceof AST_SimpleStatement) return self_condition_length === negated_length && !negated_is_best && self.condition instanceof AST_Binary && "||" == self.condition.operator && (negated_is_best = !0), 
        negated_is_best ? make_node(AST_SimpleStatement, self, {
            body: make_node(AST_Binary, self, {
                operator: "||",
                left: negated,
                right: self.body.body
            })
        }).optimize(compressor) : make_node(AST_SimpleStatement, self, {
            body: make_node(AST_Binary, self, {
                operator: "&&",
                left: self.condition,
                right: self.body.body
            })
        }).optimize(compressor);
        if (self.body instanceof AST_EmptyStatement && self.alternative instanceof AST_SimpleStatement) return make_node(AST_SimpleStatement, self, {
            body: make_node(AST_Binary, self, {
                operator: "||",
                left: self.condition,
                right: self.alternative.body
            })
        }).optimize(compressor);
        if (self.body instanceof AST_Exit && self.alternative instanceof AST_Exit && self.body.TYPE == self.alternative.TYPE) return make_node(self.body.CTOR, self, {
            value: make_node(AST_Conditional, self, {
                condition: self.condition,
                consequent: self.body.value || make_node(AST_Undefined, self.body),
                alternative: self.alternative.value || make_node(AST_Undefined, self.alternative)
            }).transform(compressor)
        }).optimize(compressor);
        if (self.body instanceof AST_If && !self.body.alternative && !self.alternative && (self = make_node(AST_If, self, {
            condition: make_node(AST_Binary, self.condition, {
                operator: "&&",
                left: self.condition,
                right: self.body.condition
            }),
            body: self.body.body,
            alternative: null
        })), aborts(self.body) && self.alternative) {
            var alt = self.alternative;
            return self.alternative = null, make_node(AST_BlockStatement, self, {
                body: [ self, alt ]
            }).optimize(compressor);
        }
        if (aborts(self.alternative)) {
            body = self.body;
            return self.body = self.alternative, self.condition = negated_is_best ? negated : self.condition.negate(compressor), 
            self.alternative = null, make_node(AST_BlockStatement, self, {
                body: [ self, body ]
            }).optimize(compressor);
        }
        return self;
    }), OPT(AST_Switch, function(self, compressor) {
        if (!compressor.option("switches")) return self;
        var branch, value = self.expression.evaluate(compressor);
        if (!(value instanceof AST_Node)) {
            var orig = self.expression;
            self.expression = make_node_from_constant(value, orig), self.expression = best_of_expression(self.expression.transform(compressor), orig);
        }
        if (!compressor.option("dead_code")) return self;
        value instanceof AST_Node && (value = self.expression.tail_node().evaluate(compressor));
        for (var default_branch, exact_match, decl = [], body = [], i = 0, len = self.body.length; i < len && !exact_match; i++) {
            if ((branch = self.body[i]) instanceof AST_Default) default_branch ? eliminate_branch(branch, body[body.length - 1]) : default_branch = branch; else if (!(value instanceof AST_Node)) {
                if (!((exp = branch.expression.evaluate(compressor)) instanceof AST_Node) && exp !== value) {
                    eliminate_branch(branch, body[body.length - 1]);
                    continue;
                }
                if (exp instanceof AST_Node && (exp = branch.expression.tail_node().evaluate(compressor)), 
                exp === value && (exact_match = branch, default_branch)) {
                    var default_index = body.indexOf(default_branch);
                    body.splice(default_index, 1), eliminate_branch(default_branch, body[default_index - 1]), 
                    default_branch = null;
                }
            }
            if (aborts(branch)) {
                var prev = body[body.length - 1];
                aborts(prev) && prev.body.length == branch.body.length && make_node(AST_BlockStatement, prev, prev).equivalent_to(make_node(AST_BlockStatement, branch, branch)) && (prev.body = []);
            }
            body.push(branch);
        }
        for (;i < len; ) eliminate_branch(self.body[i++], body[body.length - 1]);
        for (body.length > 0 && (body[0].body = decl.concat(body[0].body)), self.body = body; branch = body[body.length - 1]; ) {
            var stat = branch.body[branch.body.length - 1];
            if (stat instanceof AST_Break && compressor.loopcontrol_target(stat) === self && branch.body.pop(), 
            branch.body.length || branch instanceof AST_Case && (default_branch || branch.expression.has_side_effects(compressor))) break;
            body.pop() === default_branch && (default_branch = null);
        }
        if (0 == body.length) return make_node(AST_BlockStatement, self, {
            body: decl.concat(make_node(AST_SimpleStatement, self.expression, {
                body: self.expression
            }))
        }).optimize(compressor);
        if (1 == body.length && (body[0] === exact_match || body[0] === default_branch)) {
            var has_break = !1, tw = new TreeWalker(function(node) {
                if (has_break || node instanceof AST_Lambda || node instanceof AST_SimpleStatement) return !0;
                node instanceof AST_Break && tw.loopcontrol_target(node) === self && (has_break = !0);
            });
            if (self.walk(tw), !has_break) {
                var exp, statements = body[0].body.slice();
                return (exp = body[0].expression) && statements.unshift(make_node(AST_SimpleStatement, exp, {
                    body: exp
                })), statements.unshift(make_node(AST_SimpleStatement, self.expression, {
                    body: self.expression
                })), make_node(AST_BlockStatement, self, {
                    body: statements
                }).optimize(compressor);
            }
        }
        return self;
        function eliminate_branch(branch, prev) {
            prev && !aborts(prev) ? prev.body = prev.body.concat(branch.body) : extract_declarations_from_unreachable_code(compressor, branch, decl);
        }
    }), OPT(AST_Try, function(self, compressor) {
        if (tighten_body(self.body, compressor), self.bcatch && self.bfinally && all(self.bfinally.body, is_empty) && (self.bfinally = null), 
        compressor.option("dead_code") && all(self.body, is_empty)) {
            var body = [];
            return self.bcatch && (extract_declarations_from_unreachable_code(compressor, self.bcatch, body), 
            body.forEach(function(stat) {
                stat instanceof AST_Definitions && stat.definitions.forEach(function(var_def) {
                    var def = var_def.name.definition().redefined();
                    def && (var_def.name = var_def.name.clone(), var_def.name.thedef = def);
                });
            })), self.bfinally && (body = body.concat(self.bfinally.body)), make_node(AST_BlockStatement, self, {
                body
            }).optimize(compressor);
        }
        return self;
    }), AST_Definitions.DEFMETHOD("remove_initializers", function() {
        var decls = [];
        this.definitions.forEach(function(def) {
            def.name instanceof AST_SymbolDeclaration ? (def.value = null, decls.push(def)) : def.name.walk(new TreeWalker(function(node) {
                node instanceof AST_SymbolDeclaration && decls.push(make_node(AST_VarDef, def, {
                    name: node,
                    value: null
                }));
            }));
        }), this.definitions = decls;
    }), AST_Definitions.DEFMETHOD("to_assignments", function(compressor) {
        var reduce_vars = compressor.option("reduce_vars"), assignments = this.definitions.reduce(function(a, def) {
            if (!def.value || def.name instanceof AST_Destructuring) {
                if (def.value) {
                    var varDef = make_node(AST_VarDef, def, {
                        name: def.name,
                        value: def.value
                    }), var_ = make_node(AST_Var, def, {
                        definitions: [ varDef ]
                    });
                    a.push(var_);
                }
            } else {
                var name = make_node(AST_SymbolRef, def.name, def.name);
                a.push(make_node(AST_Assign, def, {
                    operator: "=",
                    left: name,
                    right: def.value
                })), reduce_vars && (name.definition().fixed = !1);
            }
            return (def = def.name.definition()).eliminated++, def.replaced--, a;
        }, []);
        return 0 == assignments.length ? null : make_sequence(this, assignments);
    }), OPT(AST_Definitions, function(self, compressor) {
        return 0 == self.definitions.length ? make_node(AST_EmptyStatement, self) : self;
    }), OPT(AST_Import, function(self, compressor) {
        return self;
    }), OPT(AST_Call, function(self, compressor) {
        var exp = self.expression, fn = exp, simple_args = all(self.args, function(arg) {
            return !(arg instanceof AST_Expansion);
        });
        compressor.option("reduce_vars") && fn instanceof AST_SymbolRef && (fn = fn.fixed_value());
        var is_func = fn instanceof AST_Lambda;
        if (compressor.option("unused") && simple_args && is_func && !fn.uses_arguments && !fn.uses_eval) {
            for (var pos = 0, last = 0, i = 0, len = self.args.length; i < len; i++) {
                if (fn.argnames[i] instanceof AST_Expansion) {
                    if (fn.argnames[i].expression.__unused) for (;i < len; ) {
                        (node = self.args[i++].drop_side_effect_free(compressor)) && (self.args[pos++] = node);
                    } else for (;i < len; ) self.args[pos++] = self.args[i++];
                    last = pos;
                    break;
                }
                var trim = i >= fn.argnames.length;
                if (trim || fn.argnames[i].__unused) {
                    if (node = self.args[i].drop_side_effect_free(compressor)) self.args[pos++] = node; else if (!trim) {
                        self.args[pos++] = make_node(AST_Number, self.args[i], {
                            value: 0
                        });
                        continue;
                    }
                } else self.args[pos++] = self.args[i];
                last = pos;
            }
            self.args.length = last;
        }
        if (compressor.option("unsafe")) if (is_undeclared_ref(exp)) switch (exp.name) {
          case "Array":
            if (1 != self.args.length) return make_node(AST_Array, self, {
                elements: self.args
            }).optimize(compressor);
            break;

          case "Object":
            if (0 == self.args.length) return make_node(AST_Object, self, {
                properties: []
            });
            break;

          case "String":
            if (0 == self.args.length) return make_node(AST_String, self, {
                value: ""
            });
            if (self.args.length <= 1) return make_node(AST_Binary, self, {
                left: self.args[0],
                operator: "+",
                right: make_node(AST_String, self, {
                    value: ""
                })
            }).optimize(compressor);
            break;

          case "Number":
            if (0 == self.args.length) return make_node(AST_Number, self, {
                value: 0
            });
            if (1 == self.args.length) return make_node(AST_UnaryPrefix, self, {
                expression: self.args[0],
                operator: "+"
            }).optimize(compressor);

          case "Boolean":
            if (0 == self.args.length) return make_node(AST_False, self);
            if (1 == self.args.length) return make_node(AST_UnaryPrefix, self, {
                expression: make_node(AST_UnaryPrefix, self, {
                    expression: self.args[0],
                    operator: "!"
                }),
                operator: "!"
            }).optimize(compressor);
            break;

          case "RegExp":
            var params = [];
            if (all(self.args, function(arg) {
                var value = arg.evaluate(compressor);
                return params.unshift(value), arg !== value;
            })) try {
                return best_of(compressor, self, make_node(AST_RegExp, self, {
                    value: RegExp.apply(RegExp, params)
                }));
            } catch (ex) {
                compressor.warn("Error converting {expr} [{file}:{line},{col}]", {
                    expr: self.print_to_string(),
                    file: self.start.file,
                    line: self.start.line,
                    col: self.start.col
                });
            }
            break;

          case "Symbol":
            return self.args = [], self;
        } else if (exp instanceof AST_Dot) switch (exp.property) {
          case "toString":
            if (0 == self.args.length && !exp.expression.may_throw_on_access(compressor)) return make_node(AST_Binary, self, {
                left: make_node(AST_String, self, {
                    value: ""
                }),
                operator: "+",
                right: exp.expression
            }).optimize(compressor);
            break;

          case "join":
            if (exp.expression instanceof AST_Array) EXIT: {
                var separator;
                if (!(self.args.length > 0 && (separator = self.args[0].evaluate(compressor)) === self.args[0])) {
                    var first, elements = [], consts = [];
                    for (i = 0, len = exp.expression.elements.length; i < len; i++) {
                        var el = exp.expression.elements[i];
                        if (el instanceof AST_Expansion) break EXIT;
                        (value = el.evaluate(compressor)) !== el ? consts.push(value) : (consts.length > 0 && (elements.push(make_node(AST_String, self, {
                            value: consts.join(separator)
                        })), consts.length = 0), elements.push(el));
                    }
                    return consts.length > 0 && elements.push(make_node(AST_String, self, {
                        value: consts.join(separator)
                    })), 0 == elements.length ? make_node(AST_String, self, {
                        value: ""
                    }) : 1 == elements.length ? elements[0].is_string(compressor) ? elements[0] : make_node(AST_Binary, elements[0], {
                        operator: "+",
                        left: make_node(AST_String, self, {
                            value: ""
                        }),
                        right: elements[0]
                    }) : "" == separator ? (first = elements[0].is_string(compressor) || elements[1].is_string(compressor) ? elements.shift() : make_node(AST_String, self, {
                        value: ""
                    }), elements.reduce(function(prev, el) {
                        return make_node(AST_Binary, el, {
                            operator: "+",
                            left: prev,
                            right: el
                        });
                    }, first).optimize(compressor)) : ((node = self.clone()).expression = node.expression.clone(), 
                    node.expression.expression = node.expression.expression.clone(), node.expression.expression.elements = elements, 
                    best_of(compressor, self, node));
                    var node;
                }
            }
            break;

          case "charAt":
            if (exp.expression.is_string(compressor)) {
                var arg = self.args[0], index = arg ? arg.evaluate(compressor) : 0;
                if (index !== arg) return make_node(AST_Sub, exp, {
                    expression: exp.expression,
                    property: make_node_from_constant(0 | index, arg || exp)
                }).optimize(compressor);
            }
            break;

          case "apply":
            if (2 == self.args.length && self.args[1] instanceof AST_Array) return (args = self.args[1].elements.slice()).unshift(self.args[0]), 
            make_node(AST_Call, self, {
                expression: make_node(AST_Dot, exp, {
                    expression: exp.expression,
                    property: "call"
                }),
                args
            }).optimize(compressor);
            break;

          case "call":
            var func = exp.expression;
            if (func instanceof AST_SymbolRef && (func = func.fixed_value()), func instanceof AST_Lambda && !func.contains_this()) return make_sequence(this, [ self.args[0], make_node(AST_Call, self, {
                expression: exp.expression,
                args: self.args.slice(1)
            }) ]).optimize(compressor);
        }
        if (compressor.option("unsafe_Function") && is_undeclared_ref(exp) && "Function" == exp.name) {
            if (0 == self.args.length) return make_node(AST_Function, self, {
                argnames: [],
                body: []
            }).optimize(compressor);
            if (all(self.args, function(x) {
                return x instanceof AST_String;
            })) try {
                var ast = parse(code = "n(function(" + self.args.slice(0, -1).map(function(arg) {
                    return arg.value;
                }).join(",") + "){" + self.args[self.args.length - 1].value + "})"), mangle = {
                    ie8: compressor.option("ie8")
                };
                ast.figure_out_scope(mangle);
                var fun, comp = new Compressor(compressor.options);
                (ast = ast.transform(comp)).figure_out_scope(mangle), base54.reset(), ast.compute_char_frequency(mangle), 
                ast.mangle_names(mangle), ast.walk(new TreeWalker(function(node) {
                    return !!fun || (is_func_expr(node) ? (fun = node, !0) : void 0);
                })), fun.body instanceof AST_Node && (fun.body = [ make_node(AST_Return, fun.body, {
                    value: fun.body
                }) ]);
                var code = OutputStream();
                return AST_BlockStatement.prototype._codegen.call(fun, fun, code), self.args = [ make_node(AST_String, self, {
                    value: fun.argnames.map(function(arg) {
                        return arg.print_to_string();
                    }).join(",")
                }), make_node(AST_String, self.args[self.args.length - 1], {
                    value: code.get().replace(/^\{|\}$/g, "")
                }) ], self;
            } catch (ex) {
                if (!(ex instanceof JS_Parse_Error)) throw ex;
                compressor.warn("Error parsing code passed to new Function [{file}:{line},{col}]", self.args[self.args.length - 1].start), 
                compressor.warn(ex.toString());
            }
        }
        var stat = is_func && fn.body;
        if ((stat instanceof AST_Node ? stat = make_node(AST_Return, stat, {
            value: stat
        }) : stat && (stat = stat[0]), compressor.option("inline") && stat instanceof AST_Return) && (!(value = stat.value) || value.is_constant_expression())) {
            var args = self.args.concat(value || make_node(AST_Undefined, self));
            return make_sequence(self, args).optimize(compressor);
        }
        if (is_func && !fn.is_generator && !fn.async) {
            var def, value, scope, in_loop, level = -1;
            if (compressor.option("inline") && simple_args && !fn.uses_arguments && !fn.uses_eval && !(fn.name && fn instanceof AST_Function) && (value = function(stat) {
                var body = fn.body instanceof AST_Node ? [ fn.body ] : fn.body, len = body.length;
                if (compressor.option("inline") < 3) return 1 == len && return_value(stat);
                stat = null;
                for (var i = 0; i < len; i++) {
                    var line = body[i];
                    if (line instanceof AST_Var) {
                        if (stat && !all(line.definitions, function(var_def) {
                            return !var_def.value;
                        })) return !1;
                    } else {
                        if (stat) return !1;
                        stat = line;
                    }
                }
                return return_value(stat);
            }(stat)) && (exp === fn || compressor.option("unused") && 1 == (def = exp.definition()).references.length && !recursive_ref(compressor, def) && fn.is_constant_expression(exp.scope)) && !self.pure && !fn.contains_this() && function() {
                var catches = Object.create(null);
                do {
                    if ((scope = compressor.parent(++level)) instanceof AST_Catch) catches[scope.argname.name] = !0; else if (scope instanceof AST_IterationStatement) in_loop = []; else if (scope instanceof AST_SymbolRef && scope.fixed_value() instanceof AST_Scope) return !1;
                } while (!(scope instanceof AST_Scope) || scope instanceof AST_Arrow);
                var safe_to_inject = !(scope instanceof AST_Toplevel) || compressor.toplevel.vars, inline = compressor.option("inline");
                return !(!function(catches, safe_to_inject) {
                    for (var len = fn.body.length, i = 0; i < len; i++) {
                        var stat = fn.body[i];
                        if (stat instanceof AST_Var) {
                            if (!safe_to_inject) return !1;
                            for (var j = stat.definitions.length; --j >= 0; ) {
                                var name = stat.definitions[j].name;
                                if (catches[name.name] || identifier_atom(name.name) || scope.var_names()[name.name]) return !1;
                                in_loop && in_loop.push(name.definition());
                            }
                        }
                    }
                    return !0;
                }(catches, inline >= 3 && safe_to_inject) || !function(catches, safe_to_inject) {
                    for (var i = 0, len = fn.argnames.length; i < len; i++) {
                        var arg = fn.argnames[i];
                        if (arg instanceof AST_DefaultAssign) {
                            if (arg.left.__unused) continue;
                            return !1;
                        }
                        if (arg instanceof AST_Destructuring) return !1;
                        if (arg instanceof AST_Expansion) {
                            if (arg.expression.__unused) continue;
                            return !1;
                        }
                        if (!arg.__unused) {
                            if (!safe_to_inject || catches[arg.name] || identifier_atom(arg.name) || scope.var_names()[arg.name]) return !1;
                            in_loop && in_loop.push(arg.definition());
                        }
                    }
                    return !0;
                }(catches, inline >= 2 && safe_to_inject) || in_loop && 0 != in_loop.length && is_reachable(fn, in_loop));
            }()) return make_sequence(self, function() {
                var decls = [], expressions = [];
                (function(decls, expressions) {
                    for (var len = fn.argnames.length, i = self.args.length; --i >= len; ) expressions.push(self.args[i]);
                    for (i = len; --i >= 0; ) {
                        var name = fn.argnames[i], value = self.args[i];
                        if (name.__unused || !name.name || scope.var_names()[name.name]) value && expressions.push(value); else {
                            var symbol = make_node(AST_SymbolVar, name, name);
                            name.definition().orig.push(symbol), !value && in_loop && (value = make_node(AST_Undefined, self)), 
                            append_var(decls, expressions, symbol, value);
                        }
                    }
                    decls.reverse(), expressions.reverse();
                })(decls, expressions), function(decls, expressions) {
                    for (var pos = expressions.length, i = 0, lines = fn.body.length; i < lines; i++) {
                        var stat = fn.body[i];
                        if (stat instanceof AST_Var) for (var j = 0, defs = stat.definitions.length; j < defs; j++) {
                            var var_def = stat.definitions[j], name = var_def.name;
                            if (append_var(decls, expressions, name, var_def.value), in_loop) {
                                var def = name.definition(), sym = make_node(AST_SymbolRef, name, name);
                                def.references.push(sym), expressions.splice(pos++, 0, make_node(AST_Assign, var_def, {
                                    operator: "=",
                                    left: sym,
                                    right: make_node(AST_Undefined, name)
                                }));
                            }
                        }
                    }
                }(decls, expressions), expressions.push(value), decls.length && (i = scope.body.indexOf(compressor.parent(level - 1)) + 1, 
                scope.body.splice(i, 0, make_node(AST_Var, fn, {
                    definitions: decls
                })));
                return expressions;
            }()).optimize(compressor);
            if (compressor.option("side_effects") && !(fn.body instanceof AST_Node) && all(fn.body, is_empty)) {
                args = self.args.concat(make_node(AST_Undefined, self));
                return make_sequence(self, args).optimize(compressor);
            }
        }
        if (compressor.option("drop_console") && exp instanceof AST_PropAccess) {
            for (var name = exp.expression; name.expression; ) name = name.expression;
            if (is_undeclared_ref(name) && "console" == name.name) return make_node(AST_Undefined, self).optimize(compressor);
        }
        if (compressor.option("negate_iife") && compressor.parent() instanceof AST_SimpleStatement && is_iife_call(self)) return self.negate(compressor, !0);
        var ev = self.evaluate(compressor);
        return ev !== self ? (ev = make_node_from_constant(ev, self).optimize(compressor), 
        best_of(compressor, ev, self)) : self;
        function return_value(stat) {
            return stat ? stat instanceof AST_Return ? stat.value ? stat.value.clone(!0) : make_node(AST_Undefined, self) : stat instanceof AST_SimpleStatement ? make_node(AST_UnaryPrefix, stat, {
                operator: "void",
                expression: stat.body.clone(!0)
            }) : void 0 : make_node(AST_Undefined, self);
        }
        function append_var(decls, expressions, name, value) {
            var def = name.definition();
            scope.variables.set(name.name, def), scope.enclosed.push(def), scope.var_names()[name.name] || (scope.var_names()[name.name] = !0, 
            decls.push(make_node(AST_VarDef, name, {
                name,
                value: null
            })));
            var sym = make_node(AST_SymbolRef, name, name);
            def.references.push(sym), value && expressions.push(make_node(AST_Assign, self, {
                operator: "=",
                left: sym,
                right: value
            }));
        }
    }), OPT(AST_New, function(self, compressor) {
        if (compressor.option("unsafe")) {
            var exp = self.expression;
            if (is_undeclared_ref(exp)) switch (exp.name) {
              case "Object":
              case "RegExp":
              case "Function":
              case "Error":
              case "Array":
                return make_node(AST_Call, self, self).transform(compressor);
            }
        }
        return self;
    }), OPT(AST_Sequence, function(self, compressor) {
        if (!compressor.option("side_effects")) return self;
        var first, last, expressions = [];
        first = first_in_statement(compressor), last = self.expressions.length - 1, self.expressions.forEach(function(expr, index) {
            index < last && (expr = expr.drop_side_effect_free(compressor, first)), expr && (merge_sequence(expressions, expr), 
            first = !1);
        });
        var end = expressions.length - 1;
        return function() {
            for (;end > 0 && is_undefined(expressions[end], compressor); ) end--;
            end < expressions.length - 1 && (expressions[end] = make_node(AST_UnaryPrefix, self, {
                operator: "void",
                expression: expressions[end]
            }), expressions.length = end + 1);
        }(), 0 == end ? ((self = maintain_this_binding(compressor.parent(), compressor.self(), expressions[0])) instanceof AST_Sequence || (self = self.optimize(compressor)), 
        self) : (self.expressions = expressions, self);
    }), AST_Unary.DEFMETHOD("lift_sequences", function(compressor) {
        if (compressor.option("sequences") && this.expression instanceof AST_Sequence) {
            var x = this.expression.expressions.slice(), e = this.clone();
            return e.expression = x.pop(), x.push(e), make_sequence(this, x).optimize(compressor);
        }
        return this;
    }), OPT(AST_UnaryPostfix, function(self, compressor) {
        return self.lift_sequences(compressor);
    }), OPT(AST_UnaryPrefix, function(self, compressor) {
        var e = self.expression;
        if ("delete" == self.operator && !(e instanceof AST_SymbolRef || e instanceof AST_PropAccess || is_identifier_atom(e))) return e instanceof AST_Sequence ? ((e = e.expressions.slice()).push(make_node(AST_True, self)), 
        make_sequence(self, e).optimize(compressor)) : make_sequence(self, [ e, make_node(AST_True, self) ]).optimize(compressor);
        var seq = self.lift_sequences(compressor);
        if (seq !== self) return seq;
        if (compressor.option("side_effects") && "void" == self.operator) return (e = e.drop_side_effect_free(compressor)) ? (self.expression = e, 
        self) : make_node(AST_Undefined, self).optimize(compressor);
        if (compressor.in_boolean_context()) switch (self.operator) {
          case "!":
            if (e instanceof AST_UnaryPrefix && "!" == e.operator) return e.expression;
            e instanceof AST_Binary && (self = best_of(compressor, self, e.negate(compressor, first_in_statement(compressor))));
            break;

          case "typeof":
            return compressor.warn("Boolean expression always true [{file}:{line},{col}]", self.start), 
            (e instanceof AST_SymbolRef ? make_node(AST_True, self) : make_sequence(self, [ e, make_node(AST_True, self) ])).optimize(compressor);
        }
        if ("-" == self.operator && e instanceof AST_Infinity && (e = e.transform(compressor)), 
        e instanceof AST_Binary && ("+" == self.operator || "-" == self.operator) && ("*" == e.operator || "/" == e.operator || "%" == e.operator)) return make_node(AST_Binary, self, {
            operator: e.operator,
            left: make_node(AST_UnaryPrefix, e.left, {
                operator: self.operator,
                expression: e.left
            }),
            right: e.right
        });
        if ("-" != self.operator || !(e instanceof AST_Number || e instanceof AST_Infinity)) {
            var ev = self.evaluate(compressor);
            if (ev !== self) return best_of(compressor, ev = make_node_from_constant(ev, self).optimize(compressor), self);
        }
        return self;
    }), AST_Binary.DEFMETHOD("lift_sequences", function(compressor) {
        if (compressor.option("sequences")) {
            if (this.left instanceof AST_Sequence) {
                var x = this.left.expressions.slice();
                return (e = this.clone()).left = x.pop(), x.push(e), make_sequence(this, x).optimize(compressor);
            }
            if (this.right instanceof AST_Sequence && !this.left.has_side_effects(compressor)) {
                for (var e, assign = "=" == this.operator && this.left instanceof AST_SymbolRef, last = (x = this.right.expressions).length - 1, i = 0; i < last && (assign || !x[i].has_side_effects(compressor)); i++) ;
                if (i == last) return x = x.slice(), (e = this.clone()).right = x.pop(), x.push(e), 
                make_sequence(this, x).optimize(compressor);
                if (i > 0) return (e = this.clone()).right = make_sequence(this.right, x.slice(i)), 
                (x = x.slice(0, i)).push(e), make_sequence(this, x).optimize(compressor);
            }
        }
        return this;
    });
    var commutativeOperators = makePredicate("== === != !== * & | ^");
    function recursive_ref(compressor, def) {
        for (var node, i = 0; node = compressor.parent(i); i++) if (node instanceof AST_Lambda) {
            var name = node.name;
            if (name && name.definition() === def) break;
        }
        return node;
    }
    function is_atomic(lhs, self) {
        return lhs instanceof AST_SymbolRef || lhs.TYPE === self.TYPE;
    }
    function is_reachable(self, defs) {
        var reachable = !1, find_ref = new TreeWalker(function(node) {
            return !!reachable || (node instanceof AST_SymbolRef && member(node.definition(), defs) ? reachable = !0 : void 0);
        }), scan_scope = new TreeWalker(function(node) {
            if (reachable) return !0;
            if (node instanceof AST_Scope && node !== self) {
                var parent = scan_scope.parent();
                if (parent instanceof AST_Call && parent.expression === node) return;
                return node.walk(find_ref), !0;
            }
        });
        return self.walk(scan_scope), reachable;
    }
    OPT(AST_Binary, function(self, compressor) {
        function reversible() {
            return self.left.is_constant() || self.right.is_constant() || !self.left.has_side_effects(compressor) && !self.right.has_side_effects(compressor);
        }
        function reverse(op) {
            if (reversible()) {
                op && (self.operator = op);
                var tmp = self.left;
                self.left = self.right, self.right = tmp;
            }
        }
        if (commutativeOperators(self.operator) && self.right.is_constant() && !self.left.is_constant() && (self.left instanceof AST_Binary && PRECEDENCE[self.left.operator] >= PRECEDENCE[self.operator] || reverse()), 
        self = self.lift_sequences(compressor), compressor.option("comparisons")) switch (self.operator) {
          case "===":
          case "!==":
            (self.left.is_string(compressor) && self.right.is_string(compressor) || self.left.is_number(compressor) && self.right.is_number(compressor) || self.left.is_boolean() && self.right.is_boolean() || self.left.equivalent_to(self.right)) && (self.operator = self.operator.substr(0, 2));

          case "==":
          case "!=":
            if (compressor.option("typeofs") && self.left instanceof AST_String && "undefined" == self.left.value && self.right instanceof AST_UnaryPrefix && "typeof" == self.right.operator) {
                var expr = self.right.expression;
                (expr instanceof AST_SymbolRef ? !expr.is_declared(compressor) : expr instanceof AST_PropAccess && compressor.option("ie8")) || (self.right = expr, 
                self.left = make_node(AST_Undefined, self.left).optimize(compressor), 2 == self.operator.length && (self.operator += "="));
            } else if (self.left instanceof AST_SymbolRef && self.right instanceof AST_SymbolRef && self.left.definition() === self.right.definition() && ((node = self.left.fixed_value()) instanceof AST_Array || node instanceof AST_Lambda || node instanceof AST_Object || node instanceof AST_Class)) return make_node("=" == self.operator[0] ? AST_True : AST_False, self);
        }
        var node;
        if ("+" == self.operator && compressor.in_boolean_context()) {
            var ll = self.left.evaluate(compressor), rr = self.right.evaluate(compressor);
            if (ll && "string" == typeof ll) return compressor.warn("+ in boolean context always true [{file}:{line},{col}]", self.start), 
            make_sequence(self, [ self.right, make_node(AST_True, self) ]).optimize(compressor);
            if (rr && "string" == typeof rr) return compressor.warn("+ in boolean context always true [{file}:{line},{col}]", self.start), 
            make_sequence(self, [ self.left, make_node(AST_True, self) ]).optimize(compressor);
        }
        if (compressor.option("comparisons") && self.is_boolean()) {
            if (!(compressor.parent() instanceof AST_Binary) || compressor.parent() instanceof AST_Assign) {
                var negated = make_node(AST_UnaryPrefix, self, {
                    operator: "!",
                    expression: self.negate(compressor, first_in_statement(compressor))
                });
                self = best_of(compressor, self, negated);
            }
            if (compressor.option("unsafe_comps")) switch (self.operator) {
              case "<":
                reverse(">");
                break;

              case "<=":
                reverse(">=");
            }
        }
        if ("+" == self.operator) {
            if (self.right instanceof AST_String && "" == self.right.getValue() && self.left.is_string(compressor)) return self.left;
            if (self.left instanceof AST_String && "" == self.left.getValue() && self.right.is_string(compressor)) return self.right;
            if (self.left instanceof AST_Binary && "+" == self.left.operator && self.left.left instanceof AST_String && "" == self.left.left.getValue() && self.right.is_string(compressor)) return self.left = self.left.right, 
            self.transform(compressor);
        }
        if (compressor.option("evaluate")) {
            switch (self.operator) {
              case "&&":
                if (!(ll = !!self.left.truthy || !self.left.falsy && self.left.evaluate(compressor))) return compressor.warn("Condition left of && always false [{file}:{line},{col}]", self.start), 
                maintain_this_binding(compressor.parent(), compressor.self(), self.left).optimize(compressor);
                if (!(ll instanceof AST_Node)) return compressor.warn("Condition left of && always true [{file}:{line},{col}]", self.start), 
                make_sequence(self, [ self.left, self.right ]).optimize(compressor);
                if (rr = self.right.evaluate(compressor)) {
                    if (!(rr instanceof AST_Node)) {
                        if ("&&" == (parent = compressor.parent()).operator && parent.left === compressor.self() || compressor.in_boolean_context()) return compressor.warn("Dropping side-effect-free && [{file}:{line},{col}]", self.start), 
                        self.left.optimize(compressor);
                    }
                } else {
                    if (compressor.in_boolean_context()) return compressor.warn("Boolean && always false [{file}:{line},{col}]", self.start), 
                    make_sequence(self, [ self.left, make_node(AST_False, self) ]).optimize(compressor);
                    self.falsy = !0;
                }
                if ("||" == self.left.operator) if (!(lr = self.left.right.evaluate(compressor))) return make_node(AST_Conditional, self, {
                    condition: self.left.left,
                    consequent: self.right,
                    alternative: self.left.right
                }).optimize(compressor);
                break;

              case "||":
                var parent, lr;
                if (!(ll = !!self.left.truthy || !self.left.falsy && self.left.evaluate(compressor))) return compressor.warn("Condition left of || always false [{file}:{line},{col}]", self.start), 
                make_sequence(self, [ self.left, self.right ]).optimize(compressor);
                if (!(ll instanceof AST_Node)) return compressor.warn("Condition left of || always true [{file}:{line},{col}]", self.start), 
                maintain_this_binding(compressor.parent(), compressor.self(), self.left).optimize(compressor);
                if (rr = self.right.evaluate(compressor)) {
                    if (!(rr instanceof AST_Node)) {
                        if (compressor.in_boolean_context()) return compressor.warn("Boolean || always true [{file}:{line},{col}]", self.start), 
                        make_sequence(self, [ self.left, make_node(AST_True, self) ]).optimize(compressor);
                        self.truthy = !0;
                    }
                } else if ("||" == (parent = compressor.parent()).operator && parent.left === compressor.self() || compressor.in_boolean_context()) return compressor.warn("Dropping side-effect-free || [{file}:{line},{col}]", self.start), 
                self.left.optimize(compressor);
                if ("&&" == self.left.operator) if ((lr = self.left.right.evaluate(compressor)) && !(lr instanceof AST_Node)) return make_node(AST_Conditional, self, {
                    condition: self.left.left,
                    consequent: self.left.right,
                    alternative: self.right
                }).optimize(compressor);
            }
            var associative = !0;
            switch (self.operator) {
              case "+":
                if (self.left instanceof AST_Constant && self.right instanceof AST_Binary && "+" == self.right.operator && self.right.left instanceof AST_Constant && self.right.is_string(compressor) && (self = make_node(AST_Binary, self, {
                    operator: "+",
                    left: make_node(AST_String, self.left, {
                        value: "" + self.left.getValue() + self.right.left.getValue(),
                        start: self.left.start,
                        end: self.right.left.end
                    }),
                    right: self.right.right
                })), self.right instanceof AST_Constant && self.left instanceof AST_Binary && "+" == self.left.operator && self.left.right instanceof AST_Constant && self.left.is_string(compressor) && (self = make_node(AST_Binary, self, {
                    operator: "+",
                    left: self.left.left,
                    right: make_node(AST_String, self.right, {
                        value: "" + self.left.right.getValue() + self.right.getValue(),
                        start: self.left.right.start,
                        end: self.right.end
                    })
                })), self.left instanceof AST_Binary && "+" == self.left.operator && self.left.is_string(compressor) && self.left.right instanceof AST_Constant && self.right instanceof AST_Binary && "+" == self.right.operator && self.right.left instanceof AST_Constant && self.right.is_string(compressor) && (self = make_node(AST_Binary, self, {
                    operator: "+",
                    left: make_node(AST_Binary, self.left, {
                        operator: "+",
                        left: self.left.left,
                        right: make_node(AST_String, self.left.right, {
                            value: "" + self.left.right.getValue() + self.right.left.getValue(),
                            start: self.left.right.start,
                            end: self.right.left.end
                        })
                    }),
                    right: self.right.right
                })), self.right instanceof AST_UnaryPrefix && "-" == self.right.operator && self.left.is_number(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "-",
                        left: self.left,
                        right: self.right.expression
                    });
                    break;
                }
                if (self.left instanceof AST_UnaryPrefix && "-" == self.left.operator && reversible() && self.right.is_number(compressor)) {
                    self = make_node(AST_Binary, self, {
                        operator: "-",
                        left: self.right,
                        right: self.left.expression
                    });
                    break;
                }

              case "*":
                associative = compressor.option("unsafe_math");

              case "&":
              case "|":
              case "^":
                if (self.left.is_number(compressor) && self.right.is_number(compressor) && reversible() && !(self.left instanceof AST_Binary && self.left.operator != self.operator && PRECEDENCE[self.left.operator] >= PRECEDENCE[self.operator])) {
                    var reversed = make_node(AST_Binary, self, {
                        operator: self.operator,
                        left: self.right,
                        right: self.left
                    });
                    self = self.right instanceof AST_Constant && !(self.left instanceof AST_Constant) ? best_of(compressor, reversed, self) : best_of(compressor, self, reversed);
                }
                associative && self.is_number(compressor) && (self.right instanceof AST_Binary && self.right.operator == self.operator && (self = make_node(AST_Binary, self, {
                    operator: self.operator,
                    left: make_node(AST_Binary, self.left, {
                        operator: self.operator,
                        left: self.left,
                        right: self.right.left,
                        start: self.left.start,
                        end: self.right.left.end
                    }),
                    right: self.right.right
                })), self.right instanceof AST_Constant && self.left instanceof AST_Binary && self.left.operator == self.operator && (self.left.left instanceof AST_Constant ? self = make_node(AST_Binary, self, {
                    operator: self.operator,
                    left: make_node(AST_Binary, self.left, {
                        operator: self.operator,
                        left: self.left.left,
                        right: self.right,
                        start: self.left.left.start,
                        end: self.right.end
                    }),
                    right: self.left.right
                }) : self.left.right instanceof AST_Constant && (self = make_node(AST_Binary, self, {
                    operator: self.operator,
                    left: make_node(AST_Binary, self.left, {
                        operator: self.operator,
                        left: self.left.right,
                        right: self.right,
                        start: self.left.right.start,
                        end: self.right.end
                    }),
                    right: self.left.left
                }))), self.left instanceof AST_Binary && self.left.operator == self.operator && self.left.right instanceof AST_Constant && self.right instanceof AST_Binary && self.right.operator == self.operator && self.right.left instanceof AST_Constant && (self = make_node(AST_Binary, self, {
                    operator: self.operator,
                    left: make_node(AST_Binary, self.left, {
                        operator: self.operator,
                        left: make_node(AST_Binary, self.left.left, {
                            operator: self.operator,
                            left: self.left.right,
                            right: self.right.left,
                            start: self.left.right.start,
                            end: self.right.left.end
                        }),
                        right: self.left.left
                    }),
                    right: self.right.right
                })));
            }
        }
        if (self.right instanceof AST_Binary && self.right.operator == self.operator && (lazy_op(self.operator) || "+" == self.operator && (self.right.left.is_string(compressor) || self.left.is_string(compressor) && self.right.right.is_string(compressor)))) return self.left = make_node(AST_Binary, self.left, {
            operator: self.operator,
            left: self.left,
            right: self.right.left
        }), self.right = self.right.right, self.transform(compressor);
        var ev = self.evaluate(compressor);
        return ev !== self ? (ev = make_node_from_constant(ev, self).optimize(compressor), 
        best_of(compressor, ev, self)) : self;
    }), OPT(AST_SymbolExport, function(self, compressor) {
        return self;
    }), OPT(AST_SymbolRef, function(self, compressor) {
        var def = self.resolve_defines(compressor);
        if (def) return def.optimize(compressor);
        if (!compressor.option("ie8") && is_undeclared_ref(self) && (!self.scope.uses_with || !compressor.find_parent(AST_With))) switch (self.name) {
          case "undefined":
            return make_node(AST_Undefined, self).optimize(compressor);

          case "NaN":
            return make_node(AST_NaN, self).optimize(compressor);

          case "Infinity":
            return make_node(AST_Infinity, self).optimize(compressor);
        }
        if (compressor.option("reduce_vars") && is_lhs(self, compressor.parent()) !== self) {
            var d = self.definition(), fixed = self.fixed_value(), single_use = d.single_use;
            if (single_use && (fixed instanceof AST_Lambda || fixed instanceof AST_Class)) if (d.scope !== self.scope && (!compressor.option("reduce_funcs") && fixed instanceof AST_Lambda || 1 == d.escaped || fixed.inlined)) single_use = !1; else if (recursive_ref(compressor, d)) single_use = !1; else if ((d.scope !== self.scope || d.orig[0] instanceof AST_SymbolFunarg) && "f" == (single_use = fixed.is_constant_expression(self.scope))) {
                var scope = self.scope;
                do {
                    (scope instanceof AST_Defun || is_func_expr(scope)) && (scope.inlined = !0);
                } while (scope = scope.parent_scope);
            }
            if (single_use && fixed) {
                var value;
                if (fixed instanceof AST_DefClass && (fixed = make_node(AST_ClassExpression, fixed, fixed)), 
                fixed instanceof AST_Defun && (fixed._squeezed = !0, fixed = make_node(AST_Function, fixed, fixed)), 
                d.recursive_refs > 0 && fixed.name instanceof AST_SymbolDefun) {
                    var defun_def = (value = fixed.clone(!0)).name.definition(), lambda_def = value.variables.get(value.name.name), name = lambda_def && lambda_def.orig[0];
                    name instanceof AST_SymbolLambda || ((name = make_node(AST_SymbolLambda, value.name, value.name)).scope = value, 
                    value.name = name, lambda_def = value.def_function(name)), value.walk(new TreeWalker(function(node) {
                        node instanceof AST_SymbolRef && node.definition() === defun_def && (node.thedef = lambda_def, 
                        lambda_def.references.push(node));
                    }));
                } else (value = fixed.optimize(compressor)) === fixed && (value = fixed.clone(!0));
                return value;
            }
            if (fixed && void 0 === d.should_replace) {
                var init;
                if (fixed instanceof AST_This) d.orig[0] instanceof AST_SymbolFunarg || !all(d.references, function(ref) {
                    return d.scope === ref.scope;
                }) || (init = fixed); else {
                    var ev = fixed.evaluate(compressor);
                    ev === fixed || !compressor.option("unsafe_regexp") && ev instanceof RegExp || (init = make_node_from_constant(ev, fixed));
                }
                if (init) {
                    var fn, value_length = init.optimize(compressor).print_to_string().length;
                    !function(value) {
                        var found;
                        return value.walk(new TreeWalker(function(node) {
                            if (node instanceof AST_SymbolRef && (found = !0), found) return !0;
                        })), found;
                    }(fixed) ? (value_length = Math.min(value_length, fixed.print_to_string().length), 
                    fn = function() {
                        var result = best_of_expression(init.optimize(compressor), fixed);
                        return result === init || result === fixed ? result.clone(!0) : result;
                    }) : fn = function() {
                        var result = init.optimize(compressor);
                        return result === init ? result.clone(!0) : result;
                    };
                    var name_length = d.name.length, overhead = 0;
                    compressor.option("unused") && !compressor.exposed(d) && (overhead = (name_length + 2 + value_length) / d.references.length), 
                    d.should_replace = value_length <= name_length + overhead && fn;
                } else d.should_replace = !1;
            }
            if (d.should_replace) return d.should_replace();
        }
        return self;
    }), OPT(AST_Undefined, function(self, compressor) {
        if (compressor.option("unsafe_undefined")) {
            var undef = find_variable(compressor, "undefined");
            if (undef) {
                var ref = make_node(AST_SymbolRef, self, {
                    name: "undefined",
                    scope: undef.scope,
                    thedef: undef
                });
                return ref.is_undefined = !0, ref;
            }
        }
        var lhs = is_lhs(compressor.self(), compressor.parent());
        return lhs && is_atomic(lhs, self) ? self : make_node(AST_UnaryPrefix, self, {
            operator: "void",
            expression: make_node(AST_Number, self, {
                value: 0
            })
        });
    }), OPT(AST_Infinity, function(self, compressor) {
        var lhs = is_lhs(compressor.self(), compressor.parent());
        return lhs && is_atomic(lhs, self) ? self : !compressor.option("keep_infinity") || lhs && !is_atomic(lhs, self) || find_variable(compressor, "Infinity") ? make_node(AST_Binary, self, {
            operator: "/",
            left: make_node(AST_Number, self, {
                value: 1
            }),
            right: make_node(AST_Number, self, {
                value: 0
            })
        }) : self;
    }), OPT(AST_NaN, function(self, compressor) {
        var lhs = is_lhs(compressor.self(), compressor.parent());
        return lhs && !is_atomic(lhs, self) || find_variable(compressor, "NaN") ? make_node(AST_Binary, self, {
            operator: "/",
            left: make_node(AST_Number, self, {
                value: 0
            }),
            right: make_node(AST_Number, self, {
                value: 0
            })
        }) : self;
    });
    var ASSIGN_OPS = [ "+", "-", "/", "*", "%", ">>", "<<", ">>>", "|", "^", "&" ], ASSIGN_OPS_COMMUTATIVE = [ "*", "|", "^", "&" ];
    function literals_in_boolean_context(self, compressor) {
        return compressor.in_boolean_context() ? best_of(compressor, self, make_sequence(self, [ self, make_node(AST_True, self) ]).optimize(compressor)) : self;
    }
    function lift_key(self, compressor) {
        if (!compressor.option("computed_props")) return self;
        if (!(self.key instanceof AST_Constant)) return self;
        if (self.key instanceof AST_String || self.key instanceof AST_Number) {
            if ("constructor" == self.key.value && compressor.parent() instanceof AST_Class) return self;
            self.key = self instanceof AST_ObjectKeyVal ? self.key.value : make_node(AST_SymbolMethod, self.key, {
                name: self.key.value
            });
        }
        return self;
    }
    OPT(AST_Assign, function(self, compressor) {
        var def;
        if (compressor.option("dead_code") && self.left instanceof AST_SymbolRef && (def = self.left.definition()).scope === compressor.find_parent(AST_Lambda)) {
            var node, level = 0, parent = self;
            do {
                if (node = parent, (parent = compressor.parent(level++)) instanceof AST_Exit) {
                    if (in_try(level, parent instanceof AST_Throw)) break;
                    if (is_reachable(def.scope, [ def ])) break;
                    return "=" == self.operator ? self.right : make_node(AST_Binary, self, {
                        operator: self.operator.slice(0, -1),
                        left: self.left,
                        right: self.right
                    }).optimize(compressor);
                }
            } while (parent instanceof AST_Binary && parent.right === node || parent instanceof AST_Sequence && parent.tail_node() === node);
        }
        return "=" == (self = self.lift_sequences(compressor)).operator && self.left instanceof AST_SymbolRef && self.right instanceof AST_Binary && (self.right.left instanceof AST_SymbolRef && self.right.left.name == self.left.name && member(self.right.operator, ASSIGN_OPS) ? (self.operator = self.right.operator + "=", 
        self.right = self.right.right) : self.right.right instanceof AST_SymbolRef && self.right.right.name == self.left.name && member(self.right.operator, ASSIGN_OPS_COMMUTATIVE) && !self.right.left.has_side_effects(compressor) && (self.operator = self.right.operator + "=", 
        self.right = self.right.left)), self;
        function in_try(level, no_catch) {
            for (var parent, scope = self.left.definition().scope; (parent = compressor.parent(level++)) !== scope; ) if (parent instanceof AST_Try) {
                if (parent.bfinally) return !0;
                if (no_catch && parent.bcatch) return !0;
            }
        }
    }), OPT(AST_DefaultAssign, function(self, compressor) {
        if (!compressor.option("evaluate")) return self;
        var evaluateRight = self.right.evaluate(compressor);
        return void 0 === evaluateRight ? self = self.left : evaluateRight !== self.right && (evaluateRight = make_node_from_constant(evaluateRight, self.right), 
        self.right = best_of_expression(evaluateRight, self.right)), self;
    }), OPT(AST_Conditional, function(self, compressor) {
        if (!compressor.option("conditionals")) return self;
        if (self.condition instanceof AST_Sequence) {
            var expressions = self.condition.expressions.slice();
            return self.condition = expressions.pop(), expressions.push(self), make_sequence(self, expressions);
        }
        var cond = self.condition.evaluate(compressor);
        if (cond !== self.condition) return cond ? (compressor.warn("Condition always true [{file}:{line},{col}]", self.start), 
        maintain_this_binding(compressor.parent(), compressor.self(), self.consequent)) : (compressor.warn("Condition always false [{file}:{line},{col}]", self.start), 
        maintain_this_binding(compressor.parent(), compressor.self(), self.alternative));
        var negated = cond.negate(compressor, first_in_statement(compressor));
        best_of(compressor, cond, negated) === negated && (self = make_node(AST_Conditional, self, {
            condition: negated,
            consequent: self.alternative,
            alternative: self.consequent
        }));
        var arg_index, condition = self.condition, consequent = self.consequent, alternative = self.alternative;
        if (condition instanceof AST_SymbolRef && consequent instanceof AST_SymbolRef && condition.definition() === consequent.definition()) return make_node(AST_Binary, self, {
            operator: "||",
            left: condition,
            right: alternative
        });
        if (consequent instanceof AST_Assign && alternative instanceof AST_Assign && consequent.operator == alternative.operator && consequent.left.equivalent_to(alternative.left) && (!self.condition.has_side_effects(compressor) || "=" == consequent.operator && !consequent.left.has_side_effects(compressor))) return make_node(AST_Assign, self, {
            operator: consequent.operator,
            left: consequent.left,
            right: make_node(AST_Conditional, self, {
                condition: self.condition,
                consequent: consequent.right,
                alternative: alternative.right
            })
        });
        if (consequent instanceof AST_Call && alternative.TYPE === consequent.TYPE && consequent.args.length > 0 && consequent.args.length == alternative.args.length && consequent.expression.equivalent_to(alternative.expression) && !self.condition.has_side_effects(compressor) && !consequent.expression.has_side_effects(compressor) && "number" == typeof (arg_index = function() {
            for (var a = consequent.args, b = alternative.args, i = 0, len = a.length; i < len; i++) {
                if (a[i] instanceof AST_Expansion) return;
                if (!a[i].equivalent_to(b[i])) {
                    if (b[i] instanceof AST_Expansion) return;
                    for (var j = i + 1; j < len; j++) {
                        if (a[j] instanceof AST_Expansion) return;
                        if (!a[j].equivalent_to(b[j])) return;
                    }
                    return i;
                }
            }
        }())) {
            var node = consequent.clone();
            return node.args[arg_index] = make_node(AST_Conditional, self, {
                condition: self.condition,
                consequent: consequent.args[arg_index],
                alternative: alternative.args[arg_index]
            }), node;
        }
        if (consequent instanceof AST_Conditional && consequent.alternative.equivalent_to(alternative)) return make_node(AST_Conditional, self, {
            condition: make_node(AST_Binary, self, {
                left: self.condition,
                operator: "&&",
                right: consequent.condition
            }),
            consequent: consequent.consequent,
            alternative
        });
        if (consequent.equivalent_to(alternative)) return make_sequence(self, [ self.condition, consequent ]).optimize(compressor);
        if (consequent instanceof AST_Binary && "||" == consequent.operator && consequent.right.equivalent_to(alternative)) return make_node(AST_Binary, self, {
            operator: "||",
            left: make_node(AST_Binary, self, {
                operator: "&&",
                left: self.condition,
                right: consequent.left
            }),
            right: alternative
        }).optimize(compressor);
        var in_bool = compressor.in_boolean_context();
        return is_true(self.consequent) ? is_false(self.alternative) ? booleanize(self.condition) : make_node(AST_Binary, self, {
            operator: "||",
            left: booleanize(self.condition),
            right: self.alternative
        }) : is_false(self.consequent) ? is_true(self.alternative) ? booleanize(self.condition.negate(compressor)) : make_node(AST_Binary, self, {
            operator: "&&",
            left: booleanize(self.condition.negate(compressor)),
            right: self.alternative
        }) : is_true(self.alternative) ? make_node(AST_Binary, self, {
            operator: "||",
            left: booleanize(self.condition.negate(compressor)),
            right: self.consequent
        }) : is_false(self.alternative) ? make_node(AST_Binary, self, {
            operator: "&&",
            left: booleanize(self.condition),
            right: self.consequent
        }) : self;
        function booleanize(node) {
            return node.is_boolean() ? node : make_node(AST_UnaryPrefix, node, {
                operator: "!",
                expression: node.negate(compressor)
            });
        }
        function is_true(node) {
            return node instanceof AST_True || in_bool && node instanceof AST_Constant && node.getValue() || node instanceof AST_UnaryPrefix && "!" == node.operator && node.expression instanceof AST_Constant && !node.expression.getValue();
        }
        function is_false(node) {
            return node instanceof AST_False || in_bool && node instanceof AST_Constant && !node.getValue() || node instanceof AST_UnaryPrefix && "!" == node.operator && node.expression instanceof AST_Constant && node.expression.getValue();
        }
    }), OPT(AST_Boolean, function(self, compressor) {
        if (compressor.in_boolean_context()) return make_node(AST_Number, self, {
            value: +self.value
        });
        if (compressor.option("booleans")) {
            var p = compressor.parent();
            return p instanceof AST_Binary && ("==" == p.operator || "!=" == p.operator) ? (compressor.warn("Non-strict equality against boolean: {operator} {value} [{file}:{line},{col}]", {
                operator: p.operator,
                value: self.value,
                file: p.start.file,
                line: p.start.line,
                col: p.start.col
            }), make_node(AST_Number, self, {
                value: +self.value
            })) : make_node(AST_UnaryPrefix, self, {
                operator: "!",
                expression: make_node(AST_Number, self, {
                    value: 1 - self.value
                })
            });
        }
        return self;
    }), OPT(AST_Sub, function(self, compressor) {
        var expr = self.expression, prop = self.property;
        if (compressor.option("properties")) {
            var key = prop.evaluate(compressor);
            if (key !== prop) {
                if ("string" == typeof key) if ("undefined" == key) key = void 0; else (value = parseFloat(key)).toString() == key && (key = value);
                prop = self.property = best_of_expression(prop, make_node_from_constant(key, prop).transform(compressor));
                var property = "" + key;
                if (is_identifier_string(property) && property.length <= prop.print_to_string().length + 1) return make_node(AST_Dot, self, {
                    expression: expr,
                    property
                }).optimize(compressor);
            }
        }
        if (is_lhs(self, compressor.parent())) return self;
        if (key !== prop) {
            var sub = self.flatten_object(property, compressor);
            sub && (expr = self.expression = sub.expression, prop = self.property = sub.property);
        }
        if (compressor.option("properties") && compressor.option("side_effects") && prop instanceof AST_Number && expr instanceof AST_Array) {
            var index = prop.getValue(), elements = expr.elements;
            FLATTEN: if (index in elements) {
                for (var flatten = !0, values = [], i = elements.length; --i > index; ) {
                    (value = elements[i].drop_side_effect_free(compressor)) && (values.unshift(value), 
                    flatten && value.has_side_effects(compressor) && (flatten = !1));
                }
                var retValue = elements[index];
                if (retValue instanceof AST_Expansion) break FLATTEN;
                for (retValue = retValue instanceof AST_Hole ? make_node(AST_Undefined, retValue) : retValue, 
                flatten || values.unshift(retValue); --i >= 0; ) {
                    var value;
                    if ((value = elements[i]) instanceof AST_Expansion) break FLATTEN;
                    (value = value.drop_side_effect_free(compressor)) ? values.unshift(value) : index--;
                }
                return flatten ? (values.push(retValue), make_sequence(self, values).optimize(compressor)) : make_node(AST_Sub, self, {
                    expression: make_node(AST_Array, expr, {
                        elements: values
                    }),
                    property: make_node(AST_Number, prop, {
                        value: index
                    })
                });
            }
        }
        var ev = self.evaluate(compressor);
        return ev !== self ? best_of(compressor, ev = make_node_from_constant(ev, self).optimize(compressor), self) : self;
    }), AST_Lambda.DEFMETHOD("contains_this", function() {
        var result, self = this;
        return self.walk(new TreeWalker(function(node) {
            return !!result || (node instanceof AST_This ? result = !0 : node !== self && node instanceof AST_Scope && !(node instanceof AST_Arrow) || void 0);
        })), result;
    }), AST_PropAccess.DEFMETHOD("flatten_object", function(key, compressor) {
        if (compressor.option("properties")) {
            var arrows = compressor.option("unsafe_arrows") && compressor.option("ecma") >= 6, expr = this.expression;
            if (expr instanceof AST_Object) for (var props = expr.properties, i = props.length; --i >= 0; ) {
                var prop = props[i];
                if ("" + (prop instanceof AST_ConciseMethod ? prop.key.name : prop.key) == key) {
                    if (!all(props, function(prop) {
                        return prop instanceof AST_ObjectKeyVal || arrows && prop instanceof AST_ConciseMethod && !prop.is_generator;
                    })) break;
                    var value = prop.value;
                    if ((value instanceof AST_Accessor || value instanceof AST_Function) && !(compressor.parent() instanceof AST_New) && value.contains_this()) break;
                    return make_node(AST_Sub, this, {
                        expression: make_node(AST_Array, expr, {
                            elements: props.map(function(prop) {
                                var v = prop.value;
                                v instanceof AST_Accessor && (v = make_node(AST_Function, v, v));
                                var k = prop.key;
                                return k instanceof AST_Node && !(k instanceof AST_SymbolMethod) ? make_sequence(prop, [ k, v ]) : v;
                            })
                        }),
                        property: make_node(AST_Number, this, {
                            value: i
                        })
                    });
                }
            }
        }
    }), OPT(AST_Dot, function(self, compressor) {
        "arguments" != self.property && "caller" != self.property || compressor.warn("Function.protoype.{prop} not supported [{file}:{line},{col}]", {
            prop: self.property,
            file: self.start.file,
            line: self.start.line,
            col: self.start.col
        });
        var def = self.resolve_defines(compressor);
        if (def) return def.optimize(compressor);
        if (is_lhs(self, compressor.parent())) return self;
        if (compressor.option("unsafe_proto") && self.expression instanceof AST_Dot && "prototype" == self.expression.property) {
            var exp = self.expression.expression;
            if (is_undeclared_ref(exp)) switch (exp.name) {
              case "Array":
                self.expression = make_node(AST_Array, self.expression, {
                    elements: []
                });
                break;

              case "Function":
                self.expression = make_node(AST_Function, self.expression, {
                    argnames: [],
                    body: []
                });
                break;

              case "Number":
                self.expression = make_node(AST_Number, self.expression, {
                    value: 0
                });
                break;

              case "Object":
                self.expression = make_node(AST_Object, self.expression, {
                    properties: []
                });
                break;

              case "RegExp":
                self.expression = make_node(AST_RegExp, self.expression, {
                    value: /t/
                });
                break;

              case "String":
                self.expression = make_node(AST_String, self.expression, {
                    value: ""
                });
            }
        }
        var sub = self.flatten_object(self.property, compressor);
        if (sub) return sub.optimize(compressor);
        var ev = self.evaluate(compressor);
        return ev !== self ? best_of(compressor, ev = make_node_from_constant(ev, self).optimize(compressor), self) : self;
    }), OPT(AST_Array, literals_in_boolean_context), OPT(AST_Object, literals_in_boolean_context), 
    OPT(AST_RegExp, literals_in_boolean_context), OPT(AST_Return, function(self, compressor) {
        return self.value && is_undefined(self.value, compressor) && (self.value = null), 
        self;
    }), OPT(AST_Arrow, function(self, compressor) {
        if (self.body instanceof AST_Node || tighten_body(self.body, compressor), compressor.option("arrows") && 1 == self.body.length && self.body[0] instanceof AST_Return) {
            var value = self.body[0].value;
            self.body = value || [];
        }
        return self;
    }), OPT(AST_Function, function(self, compressor) {
        if (tighten_body(self.body, compressor), compressor.option("unsafe_arrows") && compressor.option("ecma") >= 6 && !self.name && !self.is_generator && !self.uses_arguments && !self.uses_eval) {
            var has_special_symbol = !1;
            if (self.walk(new TreeWalker(function(node) {
                return !!has_special_symbol || (node instanceof AST_This ? (has_special_symbol = !0, 
                !0) : void 0);
            })), !has_special_symbol) return make_node(AST_Arrow, self, self).optimize(compressor);
        }
        return self;
    }), OPT(AST_Class, function(self, compressor) {
        return self;
    }), OPT(AST_Yield, function(self, compressor) {
        return self.expression && !self.is_star && is_undefined(self.expression, compressor) && (self.expression = null), 
        self;
    }), OPT(AST_VarDef, function(self, compressor) {
        var defines = compressor.option("global_defs");
        return defines && HOP(defines, self.name.name) && compressor.warn("global_defs " + self.name.name + " redefined [{file}:{line},{col}]", self.start), 
        self;
    }), OPT(AST_TemplateString, function(self, compressor) {
        if (!compressor.option("evaluate") || compressor.parent() instanceof AST_PrefixedTemplateString) return self;
        for (var segments = [], i = 0; i < self.segments.length; i++) {
            var segment = self.segments[i];
            if (segment instanceof AST_Node) {
                var result = segment.evaluate(compressor);
                if (result !== segment && (result + "").length <= segment.print_to_string().length + "${}".length) {
                    segments[segments.length - 1].value = segments[segments.length - 1].value + result + self.segments[++i].value;
                    continue;
                }
            }
            segments.push(segment);
        }
        return self.segments = segments, 1 == segments.length ? make_node(AST_String, self, segments[0]) : self;
    }), OPT(AST_PrefixedTemplateString, function(self, compressor) {
        return self;
    }), OPT(AST_ObjectProperty, lift_key), OPT(AST_ConciseMethod, function(self, compressor) {
        if (lift_key(self, compressor), compressor.option("arrows") && compressor.parent() instanceof AST_Object && !self.value.uses_arguments && !self.value.uses_eval && 1 == self.value.body.length && self.value.body[0] instanceof AST_Return && self.value.body[0].value && !self.value.contains_this()) {
            var arrow = make_node(AST_Arrow, self.value, self.value);
            return arrow.async = self.async, arrow.is_generator = self.is_generator, make_node(AST_ObjectKeyVal, self, {
                key: self.key instanceof AST_SymbolMethod ? self.key.name : self.key,
                value: arrow,
                quote: self.quote
            });
        }
        return self;
    }), OPT(AST_ObjectKeyVal, function(self, compressor) {
        lift_key(self, compressor);
        var unsafe_methods = compressor.option("unsafe_methods");
        if (unsafe_methods && compressor.option("ecma") >= 6 && (!(unsafe_methods instanceof RegExp) || unsafe_methods.test(self.key + ""))) {
            var key = self.key, value = self.value;
            if ((value instanceof AST_Arrow && Array.isArray(value.body) && !value.contains_this() || value instanceof AST_Function) && !value.name) return make_node(AST_ConciseMethod, self, {
                async: value.async,
                is_generator: value.is_generator,
                key: key instanceof AST_Node ? key : make_node(AST_SymbolMethod, self, {
                    name: key
                }),
                value: make_node(AST_Accessor, value, value),
                quote: self.quote
            });
        }
        return self;
    });
}(), function() {
    var normalize_directives = function(body) {
        for (var in_directive = !0, i = 0; i < body.length; i++) in_directive && body[i] instanceof AST_Statement && body[i].body instanceof AST_String ? body[i] = new AST_Directive({
            start: body[i].start,
            end: body[i].end,
            value: body[i].body.value
        }) : !in_directive || body[i] instanceof AST_Statement && body[i].body instanceof AST_String || (in_directive = !1);
        return body;
    }, MOZ_TO_ME = {
        Program: function(M) {
            return new AST_Toplevel({
                start: my_start_token(M),
                end: my_end_token(M),
                body: normalize_directives(M.body.map(from_moz))
            });
        },
        FunctionDeclaration: function(M) {
            return new AST_Defun({
                start: my_start_token(M),
                end: my_end_token(M),
                name: from_moz(M.id),
                argnames: M.params.map(from_moz),
                body: normalize_directives(from_moz(M.body).body)
            });
        },
        FunctionExpression: function(M) {
            return new AST_Function({
                start: my_start_token(M),
                end: my_end_token(M),
                name: from_moz(M.id),
                argnames: M.params.map(from_moz),
                body: normalize_directives(from_moz(M.body).body)
            });
        },
        ExpressionStatement: function(M) {
            return new AST_SimpleStatement({
                start: my_start_token(M),
                end: my_end_token(M),
                body: from_moz(M.expression)
            });
        },
        TryStatement: function(M) {
            var handlers = M.handlers || [ M.handler ];
            if (handlers.length > 1 || M.guardedHandlers && M.guardedHandlers.length) throw new Error("Multiple catch clauses are not supported.");
            return new AST_Try({
                start: my_start_token(M),
                end: my_end_token(M),
                body: from_moz(M.block).body,
                bcatch: from_moz(handlers[0]),
                bfinally: M.finalizer ? new AST_Finally(from_moz(M.finalizer)) : null
            });
        },
        Property: function(M) {
            var key = M.key, args = {
                start: my_start_token(key),
                end: my_end_token(M.value),
                key: "Identifier" == key.type ? key.name : key.value,
                value: from_moz(M.value)
            };
            return "init" == M.kind ? new AST_ObjectKeyVal(args) : (args.key = new AST_SymbolMethod({
                name: args.key
            }), args.value = new AST_Accessor(args.value), "get" == M.kind ? new AST_ObjectGetter(args) : "set" == M.kind ? new AST_ObjectSetter(args) : void 0);
        },
        ArrayExpression: function(M) {
            return new AST_Array({
                start: my_start_token(M),
                end: my_end_token(M),
                elements: M.elements.map(function(elem) {
                    return null === elem ? new AST_Hole() : from_moz(elem);
                })
            });
        },
        ObjectExpression: function(M) {
            return new AST_Object({
                start: my_start_token(M),
                end: my_end_token(M),
                properties: M.properties.map(function(prop) {
                    return prop.type = "Property", from_moz(prop);
                })
            });
        },
        SequenceExpression: function(M) {
            return new AST_Sequence({
                start: my_start_token(M),
                end: my_end_token(M),
                expressions: M.expressions.map(from_moz)
            });
        },
        MemberExpression: function(M) {
            return new (M.computed ? AST_Sub : AST_Dot)({
                start: my_start_token(M),
                end: my_end_token(M),
                property: M.computed ? from_moz(M.property) : M.property.name,
                expression: from_moz(M.object)
            });
        },
        SwitchCase: function(M) {
            return new (M.test ? AST_Case : AST_Default)({
                start: my_start_token(M),
                end: my_end_token(M),
                expression: from_moz(M.test),
                body: M.consequent.map(from_moz)
            });
        },
        VariableDeclaration: function(M) {
            return new ("const" === M.kind ? AST_Const : AST_Var)({
                start: my_start_token(M),
                end: my_end_token(M),
                definitions: M.declarations.map(from_moz)
            });
        },
        Literal: function(M) {
            var val = M.value, args = {
                start: my_start_token(M),
                end: my_end_token(M)
            };
            if (null === val) return new AST_Null(args);
            switch (typeof val) {
              case "string":
                return args.value = val, new AST_String(args);

              case "number":
                return args.value = val, new AST_Number(args);

              case "boolean":
                return new (val ? AST_True : AST_False)(args);

              default:
                var rx = M.regex;
                return rx && rx.pattern ? args.value = new RegExp(rx.pattern, rx.flags).toString() : args.value = M.regex && M.raw ? M.raw : val, 
                new AST_RegExp(args);
            }
        },
        Identifier: function(M) {
            var p = FROM_MOZ_STACK[FROM_MOZ_STACK.length - 2];
            return new ("LabeledStatement" == p.type ? AST_Label : "VariableDeclarator" == p.type && p.id === M ? "const" == p.kind ? AST_SymbolConst : AST_SymbolVar : "FunctionExpression" == p.type ? p.id === M ? AST_SymbolLambda : AST_SymbolFunarg : "FunctionDeclaration" == p.type ? p.id === M ? AST_SymbolDefun : AST_SymbolFunarg : "CatchClause" == p.type ? AST_SymbolCatch : "BreakStatement" == p.type || "ContinueStatement" == p.type ? AST_LabelRef : AST_SymbolRef)({
                start: my_start_token(M),
                end: my_end_token(M),
                name: M.name
            });
        }
    };
    function raw_token(moznode) {
        if ("Literal" == moznode.type) return null != moznode.raw ? moznode.raw : moznode.value + "";
    }
    function my_start_token(moznode) {
        var loc = moznode.loc, start = loc && loc.start, range = moznode.range;
        return new AST_Token({
            file: loc && loc.source,
            line: start && start.line,
            col: start && start.column,
            pos: range ? range[0] : moznode.start,
            endline: start && start.line,
            endcol: start && start.column,
            endpos: range ? range[0] : moznode.start,
            raw: raw_token(moznode)
        });
    }
    function my_end_token(moznode) {
        var loc = moznode.loc, end = loc && loc.end, range = moznode.range;
        return new AST_Token({
            file: loc && loc.source,
            line: end && end.line,
            col: end && end.column,
            pos: range ? range[1] : moznode.end,
            endline: end && end.line,
            endcol: end && end.column,
            endpos: range ? range[1] : moznode.end,
            raw: raw_token(moznode)
        });
    }
    function map(moztype, mytype, propmap) {
        var moz_to_me = "function From_Moz_" + moztype + "(M){\n";
        moz_to_me += "return new U2." + mytype.name + "({\nstart: my_start_token(M),\nend: my_end_token(M)";
        var me_to_moz = "function To_Moz_" + moztype + "(M){\n";
        me_to_moz += "return {\ntype: " + JSON.stringify(moztype), propmap && propmap.split(/\s*,\s*/).forEach(function(prop) {
            var m = /([a-z0-9$_]+)(=|@|>|%)([a-z0-9$_]+)/i.exec(prop);
            if (!m) throw new Error("Can't understand property map: " + prop);
            var moz = m[1], how = m[2], my = m[3];
            switch (moz_to_me += ",\n" + my + ": ", me_to_moz += ",\n" + moz + ": ", how) {
              case "@":
                moz_to_me += "M." + moz + ".map(from_moz)", me_to_moz += "M." + my + ".map(to_moz)";
                break;

              case ">":
                moz_to_me += "from_moz(M." + moz + ")", me_to_moz += "to_moz(M." + my + ")";
                break;

              case "=":
                moz_to_me += "M." + moz, me_to_moz += "M." + my;
                break;

              case "%":
                moz_to_me += "from_moz(M." + moz + ").body", me_to_moz += "to_moz_block(M)";
                break;

              default:
                throw new Error("Can't understand operator in propmap: " + prop);
            }
        }), moz_to_me += "\n})\n}", me_to_moz += "\n}\n}", moz_to_me = new Function("U2", "my_start_token", "my_end_token", "from_moz", "return(" + moz_to_me + ")")(exports, my_start_token, my_end_token, from_moz), 
        me_to_moz = new Function("to_moz", "to_moz_block", "to_moz_scope", "return(" + me_to_moz + ")")(to_moz, to_moz_block, to_moz_scope), 
        MOZ_TO_ME[moztype] = moz_to_me, def_to_moz(mytype, me_to_moz);
    }
    MOZ_TO_ME.UpdateExpression = MOZ_TO_ME.UnaryExpression = function(M) {
        return new (("prefix" in M ? M.prefix : "UnaryExpression" == M.type) ? AST_UnaryPrefix : AST_UnaryPostfix)({
            start: my_start_token(M),
            end: my_end_token(M),
            operator: M.operator,
            expression: from_moz(M.argument)
        });
    }, map("EmptyStatement", AST_EmptyStatement), map("BlockStatement", AST_BlockStatement, "body@body"), 
    map("IfStatement", AST_If, "test>condition, consequent>body, alternate>alternative"), 
    map("LabeledStatement", AST_LabeledStatement, "label>label, body>body"), map("BreakStatement", AST_Break, "label>label"), 
    map("ContinueStatement", AST_Continue, "label>label"), map("WithStatement", AST_With, "object>expression, body>body"), 
    map("SwitchStatement", AST_Switch, "discriminant>expression, cases@body"), map("ReturnStatement", AST_Return, "argument>value"), 
    map("ThrowStatement", AST_Throw, "argument>value"), map("WhileStatement", AST_While, "test>condition, body>body"), 
    map("DoWhileStatement", AST_Do, "test>condition, body>body"), map("ForStatement", AST_For, "init>init, test>condition, update>step, body>body"), 
    map("ForInStatement", AST_ForIn, "left>init, right>object, body>body"), map("DebuggerStatement", AST_Debugger), 
    map("VariableDeclarator", AST_VarDef, "id>name, init>value"), map("CatchClause", AST_Catch, "param>argname, body%body"), 
    map("ThisExpression", AST_This), map("BinaryExpression", AST_Binary, "operator=operator, left>left, right>right"), 
    map("LogicalExpression", AST_Binary, "operator=operator, left>left, right>right"), 
    map("AssignmentExpression", AST_Assign, "operator=operator, left>left, right>right"), 
    map("ConditionalExpression", AST_Conditional, "test>condition, consequent>consequent, alternate>alternative"), 
    map("NewExpression", AST_New, "callee>expression, arguments@args"), map("CallExpression", AST_Call, "callee>expression, arguments@args"), 
    def_to_moz(AST_Toplevel, function(M) {
        return to_moz_scope("Program", M);
    }), def_to_moz(AST_Defun, function(M) {
        return {
            type: "FunctionDeclaration",
            id: to_moz(M.name),
            params: M.argnames.map(to_moz),
            body: to_moz_scope("BlockStatement", M)
        };
    }), def_to_moz(AST_Function, function(M) {
        return {
            type: "FunctionExpression",
            id: to_moz(M.name),
            params: M.argnames.map(to_moz),
            body: to_moz_scope("BlockStatement", M)
        };
    }), def_to_moz(AST_Directive, function(M) {
        return {
            type: "ExpressionStatement",
            expression: {
                type: "Literal",
                value: M.value
            }
        };
    }), def_to_moz(AST_SimpleStatement, function(M) {
        return {
            type: "ExpressionStatement",
            expression: to_moz(M.body)
        };
    }), def_to_moz(AST_SwitchBranch, function(M) {
        return {
            type: "SwitchCase",
            test: to_moz(M.expression),
            consequent: M.body.map(to_moz)
        };
    }), def_to_moz(AST_Try, function(M) {
        return {
            type: "TryStatement",
            block: to_moz_block(M),
            handler: to_moz(M.bcatch),
            guardedHandlers: [],
            finalizer: to_moz(M.bfinally)
        };
    }), def_to_moz(AST_Catch, function(M) {
        return {
            type: "CatchClause",
            param: to_moz(M.argname),
            guard: null,
            body: to_moz_block(M)
        };
    }), def_to_moz(AST_Definitions, function(M) {
        return {
            type: "VariableDeclaration",
            kind: M instanceof AST_Const ? "const" : "var",
            declarations: M.definitions.map(to_moz)
        };
    }), def_to_moz(AST_Sequence, function(M) {
        return {
            type: "SequenceExpression",
            expressions: M.expressions.map(to_moz)
        };
    }), def_to_moz(AST_PropAccess, function(M) {
        var isComputed = M instanceof AST_Sub;
        return {
            type: "MemberExpression",
            object: to_moz(M.expression),
            computed: isComputed,
            property: isComputed ? to_moz(M.property) : {
                type: "Identifier",
                name: M.property
            }
        };
    }), def_to_moz(AST_Unary, function(M) {
        return {
            type: "++" == M.operator || "--" == M.operator ? "UpdateExpression" : "UnaryExpression",
            operator: M.operator,
            prefix: M instanceof AST_UnaryPrefix,
            argument: to_moz(M.expression)
        };
    }), def_to_moz(AST_Binary, function(M) {
        return {
            type: "&&" == M.operator || "||" == M.operator ? "LogicalExpression" : "BinaryExpression",
            left: to_moz(M.left),
            operator: M.operator,
            right: to_moz(M.right)
        };
    }), def_to_moz(AST_Array, function(M) {
        return {
            type: "ArrayExpression",
            elements: M.elements.map(to_moz)
        };
    }), def_to_moz(AST_Object, function(M) {
        return {
            type: "ObjectExpression",
            properties: M.properties.map(to_moz)
        };
    }), def_to_moz(AST_ObjectProperty, function(M) {
        var kind, key = {
            type: "Literal",
            value: M.key instanceof AST_SymbolMethod ? M.key.name : M.key
        };
        return M instanceof AST_ObjectKeyVal ? kind = "init" : M instanceof AST_ObjectGetter ? kind = "get" : M instanceof AST_ObjectSetter && (kind = "set"), 
        {
            type: "Property",
            kind,
            key,
            value: to_moz(M.value)
        };
    }), def_to_moz(AST_Symbol, function(M) {
        var def = M.definition();
        return {
            type: "Identifier",
            name: def ? def.mangled_name || def.name : M.name
        };
    }), def_to_moz(AST_RegExp, function(M) {
        var value = M.value;
        return {
            type: "Literal",
            value,
            raw: value.toString(),
            regex: {
                pattern: value.source,
                flags: value.toString().match(/[gimuy]*$/)[0]
            }
        };
    }), def_to_moz(AST_Constant, function(M) {
        var value = M.value;
        return "number" == typeof value && (value < 0 || 0 === value && 1 / value < 0) ? {
            type: "UnaryExpression",
            operator: "-",
            prefix: !0,
            argument: {
                type: "Literal",
                value: -value,
                raw: M.start.raw
            }
        } : {
            type: "Literal",
            value,
            raw: M.start.raw
        };
    }), def_to_moz(AST_Atom, function(M) {
        return {
            type: "Identifier",
            name: String(M.value)
        };
    }), AST_Boolean.DEFMETHOD("to_mozilla_ast", AST_Constant.prototype.to_mozilla_ast), 
    AST_Null.DEFMETHOD("to_mozilla_ast", AST_Constant.prototype.to_mozilla_ast), AST_Hole.DEFMETHOD("to_mozilla_ast", function() {
        return null;
    }), AST_Block.DEFMETHOD("to_mozilla_ast", AST_BlockStatement.prototype.to_mozilla_ast), 
    AST_Lambda.DEFMETHOD("to_mozilla_ast", AST_Function.prototype.to_mozilla_ast);
    var FROM_MOZ_STACK = null;
    function from_moz(node) {
        FROM_MOZ_STACK.push(node);
        var ret = null != node ? MOZ_TO_ME[node.type](node) : null;
        return FROM_MOZ_STACK.pop(), ret;
    }
    function def_to_moz(mytype, handler) {
        mytype.DEFMETHOD("to_mozilla_ast", function() {
            return mynode = this, moznode = handler(this), start = mynode.start, end = mynode.end, 
            null != start.pos && null != end.endpos && (moznode.range = [ start.pos, end.endpos ]), 
            start.line && (moznode.loc = {
                start: {
                    line: start.line,
                    column: start.col
                },
                end: end.endline ? {
                    line: end.endline,
                    column: end.endcol
                } : null
            }, start.file && (moznode.loc.source = start.file)), moznode;
            var mynode, moznode, start, end;
        });
    }
    function to_moz(node) {
        return null != node ? node.to_mozilla_ast() : null;
    }
    function to_moz_block(node) {
        return {
            type: "BlockStatement",
            body: node.body.map(to_moz)
        };
    }
    function to_moz_scope(type, node) {
        var body = node.body.map(to_moz);
        return node.body[0] instanceof AST_SimpleStatement && node.body[0].body instanceof AST_String && body.unshift(to_moz(new AST_EmptyStatement(node.body[0]))), 
        {
            type,
            body
        };
    }
    AST_Node.from_mozilla_ast = function(node) {
        var save_stack = FROM_MOZ_STACK;
        FROM_MOZ_STACK = [];
        var ast = from_moz(node);
        return FROM_MOZ_STACK = save_stack, ast;
    };
}();

var to_ascii = "undefined" == typeof atob ? function(b64) {
    return new Buffer(b64, "base64").toString();
} : atob, to_base64 = "undefined" == typeof btoa ? function(str) {
    return new Buffer(str).toString("base64");
} : btoa;

function set_shorthand(name, options, keys) {
    options[name] && keys.forEach(function(key) {
        options[key] && ("object" != typeof options[key] && (options[key] = {}), name in options[key] || (options[key][name] = options[name]));
    });
}

function init_cache(cache) {
    cache && ("props" in cache ? cache.props instanceof Dictionary || (cache.props = Dictionary.fromObject(cache.props)) : cache.props = new Dictionary());
}

function to_json(cache) {
    return {
        props: cache.props.toObject()
    };
}

export default {
    TreeWalker,
    parse,
    TreeTransformer,
    Dictionary,
    push_uniq,
    minify: function(files, options) {
        var code, match, warn_function = AST_Node.warn_function;
        try {
            var quoted_props, timings = (options = defaults(options, {
                compress: {},
                ecma: void 0,
                ie8: !1,
                keep_classnames: void 0,
                keep_fnames: !1,
                mangle: {},
                nameCache: null,
                output: {},
                parse: {},
                rename: void 0,
                safari10: !1,
                sourceMap: !1,
                timings: !1,
                toplevel: !1,
                warnings: !1,
                wrap: !1
            }, !0)).timings && {
                start: Date.now()
            };
            void 0 === options.keep_classnames && (options.keep_classnames = options.keep_fnames), 
            void 0 === options.rename && (options.rename = options.compress && options.mangle), 
            set_shorthand("ecma", options, [ "parse", "compress", "output" ]), set_shorthand("ie8", options, [ "compress", "mangle", "output" ]), 
            set_shorthand("keep_classnames", options, [ "compress", "mangle" ]), set_shorthand("keep_fnames", options, [ "compress", "mangle" ]), 
            set_shorthand("safari10", options, [ "mangle", "output" ]), set_shorthand("toplevel", options, [ "compress", "mangle" ]), 
            set_shorthand("warnings", options, [ "compress" ]), options.mangle && (options.mangle = defaults(options.mangle, {
                cache: options.nameCache && (options.nameCache.vars || {}),
                eval: !1,
                ie8: !1,
                keep_classnames: !1,
                keep_fnames: !1,
                properties: !1,
                reserved: [],
                safari10: !1,
                toplevel: !1
            }, !0), options.mangle.properties && ("object" != typeof options.mangle.properties && (options.mangle.properties = {}), 
            options.mangle.properties.keep_quoted && (quoted_props = options.mangle.properties.reserved, 
            Array.isArray(quoted_props) || (quoted_props = []), options.mangle.properties.reserved = quoted_props), 
            !options.nameCache || "cache" in options.mangle.properties || (options.mangle.properties.cache = options.nameCache.props || {})), 
            init_cache(options.mangle.cache), init_cache(options.mangle.properties.cache)), 
            options.sourceMap && (options.sourceMap = defaults(options.sourceMap, {
                content: null,
                filename: null,
                includeSources: !1,
                root: null,
                url: null
            }, !0));
            var toplevel, warnings = [];
            if (options.warnings && !AST_Node.warn_function && (AST_Node.warn_function = function(warning) {
                warnings.push(warning);
            }), timings && (timings.parse = Date.now()), files instanceof AST_Toplevel) toplevel = files; else {
                for (var name in "string" == typeof files && (files = [ files ]), options.parse = options.parse || {}, 
                options.parse.toplevel = null, files) if (HOP(files, name) && (options.parse.filename = name, 
                options.parse.toplevel = parse(files[name], options.parse), options.sourceMap && "inline" == options.sourceMap.content)) {
                    if (Object.keys(files).length > 1) throw new Error("inline source map only works with singular input");
                    options.sourceMap.content = (code = files[name], (match = /\n\/\/# sourceMappingURL=data:application\/json(;.*?)?;base64,(.*)/.exec(code)) ? to_ascii(match[2]) : (AST_Node.warn("inline source map not found"), 
                    null));
                }
                toplevel = options.parse.toplevel;
            }
            quoted_props && function(ast, reserved) {
                function add(name) {
                    push_uniq(reserved, name);
                }
                ast.walk(new TreeWalker(function(node) {
                    node instanceof AST_ObjectKeyVal && node.quote ? add(node.key) : node instanceof AST_ObjectProperty && node.quote ? add(node.key.name) : node instanceof AST_Sub && addStrings(node.property, add);
                }));
            }(toplevel, quoted_props), options.wrap && (toplevel = toplevel.wrap_commonjs(options.wrap)), 
            timings && (timings.rename = Date.now()), timings && (timings.compress = Date.now()), 
            options.compress && (toplevel = new Compressor(options.compress).compress(toplevel)), 
            timings && (timings.scope = Date.now()), options.mangle && toplevel.figure_out_scope(options.mangle), 
            timings && (timings.mangle = Date.now()), options.mangle && (base54.reset(), toplevel.compute_char_frequency(options.mangle), 
            toplevel.mangle_names(options.mangle)), timings && (timings.properties = Date.now()), 
            options.mangle && options.mangle.properties && (toplevel = mangle_properties(toplevel, options.mangle.properties)), 
            timings && (timings.output = Date.now());
            var result = {};
            if (options.output.ast && (result.ast = toplevel), !HOP(options.output, "code") || options.output.code) {
                if (options.sourceMap && ("string" == typeof options.sourceMap.content && (options.sourceMap.content = JSON.parse(options.sourceMap.content)), 
                options.output.source_map = function(options) {
                    options = defaults(options, {
                        file: null,
                        root: null,
                        orig: null,
                        orig_line_diff: 0,
                        dest_line_diff: 0
                    });
                    var generator = new MOZ_SourceMap.SourceMapGenerator({
                        file: options.file,
                        sourceRoot: options.root
                    }), orig_map = options.orig && new MOZ_SourceMap.SourceMapConsumer(options.orig);
                    return orig_map && Array.isArray(options.orig.sources) && orig_map._sources.toArray().forEach(function(source) {
                        var sourceContent = orig_map.sourceContentFor(source, !0);
                        sourceContent && generator.setSourceContent(source, sourceContent);
                    }), {
                        add: function(source, gen_line, gen_col, orig_line, orig_col, name) {
                            if (orig_map) {
                                var info = orig_map.originalPositionFor({
                                    line: orig_line,
                                    column: orig_col
                                });
                                if (null === info.source) return;
                                source = info.source, orig_line = info.line, orig_col = info.column, name = info.name || name;
                            }
                            generator.addMapping({
                                generated: {
                                    line: gen_line + options.dest_line_diff,
                                    column: gen_col
                                },
                                original: {
                                    line: orig_line + options.orig_line_diff,
                                    column: orig_col
                                },
                                source,
                                name
                            });
                        },
                        get: function() {
                            return generator;
                        },
                        toString: function() {
                            return JSON.stringify(generator.toJSON());
                        }
                    };
                }({
                    file: options.sourceMap.filename,
                    orig: options.sourceMap.content,
                    root: options.sourceMap.root
                }), options.sourceMap.includeSources)) {
                    if (files instanceof AST_Toplevel) throw new Error("original source content unavailable");
                    for (var name in files) HOP(files, name) && options.output.source_map.get().setSourceContent(name, files[name]);
                }
                delete options.output.ast, delete options.output.code;
                var stream = OutputStream(options.output);
                toplevel.print(stream), result.code = stream.get(), options.sourceMap && (result.map = options.output.source_map.toString(), 
                "inline" == options.sourceMap.url ? result.code += "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," + to_base64(result.map) : options.sourceMap.url && (result.code += "\n//# sourceMappingURL=" + options.sourceMap.url));
            }
            return options.nameCache && options.mangle && (options.mangle.cache && (options.nameCache.vars = to_json(options.mangle.cache)), 
            options.mangle.properties && options.mangle.properties.cache && (options.nameCache.props = to_json(options.mangle.properties.cache))), 
            timings && (timings.end = Date.now(), result.timings = {
                parse: .001 * (timings.rename - timings.parse),
                rename: .001 * (timings.compress - timings.rename),
                compress: .001 * (timings.scope - timings.compress),
                scope: .001 * (timings.mangle - timings.scope),
                mangle: .001 * (timings.properties - timings.mangle),
                properties: .001 * (timings.output - timings.properties),
                output: .001 * (timings.end - timings.output),
                total: .001 * (timings.end - timings.start)
            }), warnings.length && (result.warnings = warnings), result;
        } catch (ex) {
            return {
                error: ex
            };
        } finally {
            AST_Node.warn_function = warn_function;
        }
    },
    ast: {
        Accessor: AST_Accessor,
        Array: AST_Array,
        Arrow: AST_Arrow,
        Assign: AST_Assign,
        Atom: AST_Atom,
        Await: AST_Await,
        Binary: AST_Binary,
        Block: AST_Block,
        BlockStatement: AST_BlockStatement,
        Boolean: AST_Boolean,
        Break: AST_Break,
        Call: AST_Call,
        Case: AST_Case,
        Catch: AST_Catch,
        Class: AST_Class,
        ClassExpression: AST_ClassExpression,
        ConciseMethod: AST_ConciseMethod,
        Conditional: AST_Conditional,
        Const: AST_Const,
        Constant: AST_Constant,
        Continue: AST_Continue,
        DWLoop: AST_DWLoop,
        Debugger: AST_Debugger,
        DefClass: AST_DefClass,
        Default: AST_Default,
        DefaultAssign: AST_DefaultAssign,
        Definitions: AST_Definitions,
        Defun: AST_Defun,
        Destructuring: AST_Destructuring,
        Directive: AST_Directive,
        Do: AST_Do,
        Dot: AST_Dot,
        EmptyStatement: AST_EmptyStatement,
        Exit: AST_Exit,
        Expansion: AST_Expansion,
        Export: AST_Export,
        False: AST_False,
        Finally: AST_Finally,
        For: AST_For,
        ForIn: AST_ForIn,
        ForOf: AST_ForOf,
        Function: AST_Function,
        Hole: AST_Hole,
        If: AST_If,
        Import: AST_Import,
        Infinity: AST_Infinity,
        IterationStatement: AST_IterationStatement,
        Jump: AST_Jump,
        Label: AST_Label,
        LabelRef: AST_LabelRef,
        LabeledStatement: AST_LabeledStatement,
        Lambda: AST_Lambda,
        Let: AST_Let,
        LoopControl: AST_LoopControl,
        NaN: AST_NaN,
        NameMapping: AST_NameMapping,
        New: AST_New,
        NewTarget: AST_NewTarget,
        Node: AST_Node,
        Null: AST_Null,
        Number: AST_Number,
        Object: AST_Object,
        ObjectGetter: AST_ObjectGetter,
        ObjectKeyVal: AST_ObjectKeyVal,
        ObjectProperty: AST_ObjectProperty,
        ObjectSetter: AST_ObjectSetter,
        PrefixedTemplateString: AST_PrefixedTemplateString,
        PropAccess: AST_PropAccess,
        RegExp: AST_RegExp,
        Return: AST_Return,
        Scope: AST_Scope,
        Sequence: AST_Sequence,
        SimpleStatement: AST_SimpleStatement,
        Statement: AST_Statement,
        StatementWithBody: AST_StatementWithBody,
        String: AST_String,
        Sub: AST_Sub,
        Super: AST_Super,
        Switch: AST_Switch,
        SwitchBranch: AST_SwitchBranch,
        Symbol: AST_Symbol,
        SymbolBlockDeclaration: AST_SymbolBlockDeclaration,
        SymbolCatch: AST_SymbolCatch,
        SymbolClass: AST_SymbolClass,
        SymbolConst: AST_SymbolConst,
        SymbolDeclaration: AST_SymbolDeclaration,
        SymbolDefClass: AST_SymbolDefClass,
        SymbolDefun: AST_SymbolDefun,
        SymbolExport: AST_SymbolExport,
        SymbolExportForeign: AST_SymbolExportForeign,
        SymbolFunarg: AST_SymbolFunarg,
        SymbolImport: AST_SymbolImport,
        SymbolImportForeign: AST_SymbolImportForeign,
        SymbolLambda: AST_SymbolLambda,
        SymbolLet: AST_SymbolLet,
        SymbolMethod: AST_SymbolMethod,
        SymbolRef: AST_SymbolRef,
        SymbolVar: AST_SymbolVar,
        TemplateSegment: AST_TemplateSegment,
        TemplateString: AST_TemplateString,
        This: AST_This,
        Throw: AST_Throw,
        Token: AST_Token,
        Toplevel: AST_Toplevel,
        True: AST_True,
        Try: AST_Try,
        Unary: AST_Unary,
        UnaryPostfix: AST_UnaryPostfix,
        UnaryPrefix: AST_UnaryPrefix,
        Undefined: AST_Undefined,
        Var: AST_Var,
        VarDef: AST_VarDef,
        While: AST_While,
        With: AST_With,
        Yield: AST_Yield
    }
};