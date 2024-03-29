var Fasty = function (options) {
    //the shared methods and data
    this.share = options && options.share ? options.share : null;

    //default value: false
    this.shareDataFirst = options && typeof options.shareDataFirst !== "undefined" ? options.shareDataFirst : false;

    //safely Access mode
    this.safelyAccess = options && typeof options.safelyAccess !== "undefined" ? options.safelyAccess : true;

    //debug mode
    this.debugMode = options && typeof options.debugMode !== "undefined" ? options.debugMode : false;

    //support window objects
    this.windowObjectEnable = options && typeof options.windowObjectEnable !== "undefined" ? options.windowObjectEnable : false;

    //only support the objects
    // windowObjects = ['$','....']
    this.windowObjects = options && typeof options.windowObjects !== "undefined" ? options.windowObjects : null;

    //the compile funtions cache
    this.funs = {};

    this.rootParaName = options && typeof options.rootParaName === "string" ? options.rootParaName : "$DATA";
};

Fasty.prototype = {
    Tok: function (type) {
        //type: 0 text, 1 output, 2 escape output, 3 unescape output, 9 js
        this.type = type;
        this.tag = "";
        this.text = "";

        this.addTokText = function (text) {
            this.text += text;
        }

        this.isEmpty = function () {
            return this.text === '';
        }

        this.isText = function () {
            return type === 0;
        }

        this.isOutput = function () {
            return type === 1 || type === 2 || type === 3;
        }

        this.isEscape = function () {
            return type === 2;
        }

        this.isUnEscape = function () {
            return type === 3;
        }

        this.arrange = function (fasty) {
            if (this.isText()) {
                return;
            }

            this.text = this.text.trim();
            if (this.isOutput() && fasty && fasty.safelyAccess) {
                this.text = this.text.replace(/\?\./g, "__safe.")
                    .replace(/\?\(/g, "__safe(")
            }

            var sIndexOf = this.text.indexOf(' ');
            var bIndexOf = this.text.indexOf('(');
            var pIndexOf = this.text.indexOf('.');

            if (sIndexOf === pIndexOf && sIndexOf === bIndexOf && sIndexOf === -1) {
                this.tag = this.text;
            } else {
                this.tag = this.text.substring(0, this.calcMin([sIndexOf, bIndexOf, pIndexOf]));
            }

            //support else if
            if (this.tag === "else") {
                var tagAfter = this.getTagAfter().trim();
                if (tagAfter.startsWith("if")) {
                    this.tag = "elseif";
                    this.text = "elseif " + tagAfter.substring(2);
                }
            }
        }

        this.getTagAfter = function () {
            if (!this.tag) {
                return this.text;
            }
            return this.text.substring(this.tag.length);
        }

        this.calcMin = function (values) {
            var min = values[0];
            for (let value of values) {
                if (min <= 0 || (value > 0 && value < min)) {
                    min = value;
                }
            }
            return min;
        }
    },


    render: function (template, data) {
        var fn = this.funs[template];
        if (!fn) {

            var tokens = this._parseTokens(template);
            if (!tokens || tokens.length === 0) {
                return;
            }

            try {
                var body = this._compileTokens(tokens);
                if (this.debugMode) {
                    console.log("method body >>>>", body)
                }
                fn = new Function(this.rootParaName, body);
                this.funs[template] = fn;
            } catch (err) {
                console.error("template error  >>>", err);
                console.error("template        >>>", template);
                return "";
            }
        }

        if (!data) {
            data = {};
        }

        data['$escape'] = function (value) {
            if (!value) return value;
            return value.toString()
                .replace(/\&/g, '&amp;')
                .replace(/\</g, '&lt;')
                .replace(/\>/g, '&gt;')
                .replace(/\'/g, '&#39;')
                .replace(/\"/g, '&quot;');
        }

        data['$unescape'] = function (value) {
            if (!value) return value;
            return value.toString()
                .replace(/\&amp;/g, '&')
                .replace(/\&lt;/g, '<')
                .replace(/\&gt;/g, '>')
                .replace(/\&#39;/g, '\'')
                .replace(/\&quot;/g, '"');
        }
        // put the share data or functions
        if (this.share) {
            for (let key of Object.keys(this.share)) {
                if (this.shareDataFirst) {
                    data[key] = this.share[key];
                } else if (!data[key]) {
                    data[key] = this.share[key];
                }
            }
        }


        return fn(this._proxy(data, false));
    },


    _proxy: function (data, withSafe, prev) {
        var that = this;
        return !this.safelyAccess ? data : new Proxy(data, {
            withSafe: withSafe,
            pattr: prev,
            get: function (target, attr) {
                if (typeof attr === "symbol") {
                    return () => "";
                }

                //safely access
                if (attr.endsWith("__safe")) {
                    attr = attr.substring(0, attr.length - 6);
                    var ret = target[attr];
                    return ret ? that._proxy(ret, true, attr) : that._proxy(() => {
                    }, true, attr);
                } else {
                    var ret = target[attr];
                    return (ret !== null && ret !== undefined) ? ret : (this.withSafe ? "" : undefined)
                }
            },

            apply: function (target, thisArg, argArray) {
                if (Reflect.has(thisArg, target.name)) {
                    return target(argArray);
                }
                return that._proxy({}, true, this.pattr);
            }
        })
    },


    _parseTokens: function (template) {
        if (!template || template.trim().length === 0) {
            return;
        }
        var toks = [];
        var pos = 0;
        var tok;
        var inString = false;
        var inStringStartChar;
        while (!this._isEnd(pos, template)) {

            var c = template.charAt(pos);
            if (c === '\n' || c === '\t') {
                pos++;
                continue;
            }

            //string start
            if (tok && !tok.isText() && !inString && (c === "\"" || c === "'")) {
                inStringStartChar = c;
                inString = true;
                tok.addTokText(c);
                pos++;
                continue;
            }

            //string end
            if (tok && inString && c === inStringStartChar) {
                inString = false;
                tok.addTokText(c);
                pos++;
                continue;
            }

            if (!inString && c === '{' && template.charAt(pos + 1) === '{') {
                if (tok) {
                    toks.push(tok);
                    tok.arrange(this);
                    tok = null;
                }

                //js
                if (template.charAt(pos + 2) === '~') {
                    pos += 3;
                    tok = new this.Tok(9);
                }

                //escape
                else if (template.charAt(pos + 2) === '!') {
                    pos += 3;
                    tok = new this.Tok(2);
                }

                //unescape
                else if (template.charAt(pos + 2) === '@') {
                    pos += 3;
                    tok = new this.Tok(3);
                }

                //output
                else {
                    pos += 2;
                    tok = new this.Tok(1);
                }
                continue;
            }

            if (!inString && c === '}' && template.charAt(pos + 1) === '}') {
                pos += 2;

                if (tok) {
                    toks.push(tok);
                    tok.arrange(this);
                    tok = null;
                }
                continue;
            }

            if (!tok) {
                tok = new this.Tok(0);
            }

            tok.addTokText(c);
            pos++;
        }

        if (tok) {
            tok.arrange(this);
            toks.push(tok);
        }

        return toks;
    },

    _isEnd: function (pos, template) {
        return pos >= template.length;
    },


    _compileComparison: function (tok, contextVars) {
        var tagAfter = tok.getTagAfter().trim();
        var fragment = tagAfter.substring(1, tagAfter.length - 1);
        return this._compileComparisonString(fragment, contextVars);
    },


    _compileComparisonString: function (fragment, contextVars) {
        if (!fragment) return "";
        fragment = fragment.trim();

        var withBrackets = false;
        if (fragment.indexOf("(") === 0 && fragment.lastIndexOf(")") === fragment.length - 1) {
            fragment = fragment.substring(1, fragment.length - 1);
            withBrackets = true;
        }

        var andIndexOf = fragment.indexOf("&&");
        var orIndexOf = fragment.indexOf("||");

        var result;
        if (andIndexOf !== -1 && (andIndexOf < orIndexOf || orIndexOf === -1)) {
            var comparison = this._getComparison(fragment.substring(0, andIndexOf), contextVars);
            result = comparison.toString() + " && " + this._compileComparisonString(fragment.trim().substring(andIndexOf + 2), contextVars);
        } else if (orIndexOf !== -1 && (orIndexOf < andIndexOf || andIndexOf === -1)) {
            var comparison = this._getComparison(fragment.substring(0, orIndexOf), contextVars);
            result = comparison.toString() + " || " + this._compileComparisonString(fragment.trim().substring(orIndexOf + 2), contextVars);
        } else {
            var comparison = this._getComparison(fragment, contextVars);
            result = comparison.toString();
        }
        return withBrackets ? "( " + result + " )" : result;
    },


    _compileVars: function (tok, contextVars, contextLevel) {
        var strings = tok.getTagAfter().split('=');
        var tokens = [];

        for (let str of strings) {
            str = str.trim();

            //array or string
            if (this._isArrayOrString(str)) {
                tokens.push(str)
            } else {
                var indexOf = str.lastIndexOf(",");
                if (indexOf === -1) {
                    tokens.push(str)
                } else {
                    tokens.push(str.substring(0, indexOf));
                    tokens.push(str.substring(indexOf + 1));
                }
            }

        }

        if (tokens.length === 0 || tokens.length % 2 !== 0) {
            throw new Error("Variable definition error: " + tok.text)
        }

        var ret = "";
        for (let i = 0; i < tokens.length; i += 2) {
            var name = tokens[i];
            var value = this._compileObjectOrMethodInvoke(contextVars, tokens[i + 1]);

            this._pushContextVars(contextVars, contextLevel, name)

            ret += name + "=" + value;
            if (i === tokens.length - 2) {
                ret += ";"
            } else {
                ret += ","
            }
        }
        return ret;
    },

    _isArrayOrString: function (str) {
        return str.indexOf("[") === 0 && str.indexOf("]") === str.length - 1
            || str.indexOf("\"") === 0 && str.indexOf("\"") === str.length - 1
            || str.indexOf("'") === 0 && str.indexOf("'") === str.length - 1;
    },


    _compileTokens: function (toks) {
        var body = 'var ret = "";';
        var contextVars = {};
        var contextLevel = 0;
        for (let tok of toks) {
            if (tok.isEmpty()) {
                body += 'ret += \' \';'
                continue;
            }
            //text
            if (tok.isText()) {
                body += 'ret += \'' + tok.text.replace(/\'/g, '\\\'').replace(/\"/g, '\\\"') + '\';'
            }
            //output
            else if (tok.isOutput()) {
                if (tok.isEscape()) {
                    body += 'ret += (' + this.rootParaName + '.$escape(' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ') ?? "");';
                } else if (tok.isUnEscape()) {
                    body += 'ret += (' + this.rootParaName + '.$unescape(' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ') ?? "");';
                } else {
                    body += 'ret += (' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ') ?? "";';
                }
            }
            //js
            else {
                switch (tok.tag) {
                    case "for":
                        var fragment = tok.text.substring(3).trim();
                        fragment = fragment.substring(1, fragment.length - 1).trim().replace(/\s+/g, ' ');
                        var items = fragment.split(" ");

                        //matched: for (item of array) --- for (item in array)
                        if (items.length === 3 && items[1] === "of" || items[1] === "in") {
                            var newVar = items[0];
                            var useVar = this._compileObjectOrMethodInvoke(contextVars, items[2]);
                            this._pushContextVars(contextVars, ++contextLevel, newVar)
                            body += "for (" + newVar + " " + items[1] + " " + useVar + "){"
                            break;
                        }

                        //matched: for (let item of array) --- for (const item in array)
                        if (items.length === 4 && items[2] === "of" || items[2] === "in") {
                            var newVar = items[1];
                            var useVar = this._compileObjectOrMethodInvoke(contextVars, items[3]);
                            this._pushContextVars(contextVars, ++contextLevel, newVar)
                            body += "for (" + items[0] + " " + newVar + " " + items[2] + " " + useVar + "){"
                            break;
                        }

                        //matched for (var i=0,len=xxx.length; i<len; i++)
                        var cfragments = fragment.split(";");
                        if (cfragments.length === 3) {
                            var cTok = new this.Tok(9);
                            cTok.text = cfragments[0]; //var i=0,len=xxx.length;
                            cTok.arrange(this);

                            body += "for ("
                            //i=0,len=xxx.length
                            body += cTok.tag + " " + this._compileVars(cTok, contextVars, ++contextLevel);

                            var comparison = this._getComparison(cfragments[1], contextVars);
                            body += comparison.before + comparison.op + comparison.after + ";";
                            body += cfragments[2] + "){"
                            break;
                        }

                        throw Error("for loop is error: " + tok.text)
                    case "if":
                        contextLevel++;
                        body += "if(" + this._compileComparison(tok, contextVars) + "){";
                        break;
                    case "else":
                        body += "}else{";
                        break;
                    case "elseif":
                        body += "}else if(" + this._compileComparison(tok, contextVars) + "){";
                        break;
                    case "end":
                    case "/if":
                    case "/for":
                        contextVars[contextLevel--] = null;
                        body += "}";
                        break;
                    case "var":
                    case "let":
                    case "const":
                        body += tok.tag + " " + this._compileVars(tok, contextVars, contextLevel);
                        break;
                    default:
                        body += tok.text + ";";
                }
            }
        }

        body += 'return ret;';
        return body;
    },

    _pushContextVars: function (contextVars, level, data) {
        if (!contextVars[level]) {
            contextVars[level] = [];
        }

        if (Array.isArray(data)) {
            for (let d of data) {
                contextVars[level].push(d);
            }
        } else {
            contextVars[level].push(data);
        }
    },

    _compileObjectOrMethodInvoke: function (contextVars, methodInvoke) {
        var tokens = [];
        var pos = 0;
        var that = this;
        var newToken = function (initValue, isOperator) {
            return {
                value: initValue,
                isOperator: isOperator,
                append: function (text) {
                    this.value += text;
                },
                compile: function (isInvoke) {
                    if (this.value.trim().length === 0) {
                        return this.value
                    }
                    if (this.isOperator || isInvoke || that._inContextVars(contextVars, this.value.trim())) {
                        return this.value;
                    } else {
                        return that.rootParaName + "[\"" + this.value.trim() + "\"]";
                    }
                }
            };
        }
        var token = newToken("", false);
        var inString = false;
        var inStringStartChar;
        while (!this._isEnd(pos, methodInvoke)) {
            var c = methodInvoke.charAt(pos);
            if (c === '\n' || c === '\t') {
                pos++;
                continue;
            }


            //opreator
            if (!inString && ["+", "-", "*", "/", "%", "(", ")", "[", "]", ",", "?", ":", ".", "="].indexOf(c) >= 0) {
                tokens.push(token);
                tokens.push(newToken(c, true));
                token = newToken("", false);
                pos++;
                continue;
            }


            //string start
            if (!inString && (c === "\"" || c === "'")) {
                tokens.push(token);
                token = newToken(c, false)

                inStringStartChar = c;
                inString = true;
                pos++;
                continue;
            }

            //string end
            if (inString && c === inStringStartChar) {
                tokens.push(token);
                token = newToken(c, false);
                inString = false;
                pos++;
                continue;
            }

            token.append(c);
            pos++;
        }

        tokens.push(token);

        var result = "";
        var beforeToken;
        for (let t of tokens) {
            var isInvoke = beforeToken && beforeToken.value === ".";
            result += t.compile(isInvoke);
            beforeToken = t;
        }
        return result;
    },


    _inContextVars: function (contextVars, key) {

        //number
        if (!isNaN(key)) {
            return true;
        }

        //string
        if (key.indexOf("\"") === 0 || key.indexOf("\'") === 0) {
            return true;
        }

        //array : [1,2,3].length
        if (key.indexOf("[") === 0 && key.indexOf("]") > 0) {
            return true;
        }

        //object
        var indexOf = key.indexOf(".");
        if (indexOf > 0) {
            key = key.substring(0, indexOf).trim();
        }

        //array, arrays[i].length == 1
        indexOf = key.indexOf("[");
        if (indexOf > 0 && key.indexOf("]") > indexOf) {
            key = key.substring(0, indexOf).trim();
        }

        //contextVars
        for (var childs of Object.values(contextVars)) {
            if (childs && childs.includes(key)) {
                return true;
            }
        }

        if (key.endsWith("__safe")) {
            key = key.substring(0, key.length - 6);
        }

        if ([this.rootParaName, "Object", "Number", "String", "Boolean", "Array", "Math", "Date", "window"].indexOf(key) > -1) {
            return true;
        }

        // not support window objects
        if (!this.windowObjectEnable) {
            return false;
        }

        if (this.windowObjects
            && Array.isArray(this.windowObjects)
            && this.windowObjects.indexOf(key) > -1) {
            return true;
        } else {
            // window Javascript Object
            return window && window[key];
        }
    },

    _getComparison: function (str, contextVars) {
        var ops = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"]
        for (let o of ops) {
            var indexOf = str.indexOf(o);
            if (indexOf > 0) {
                return {
                    before: this._compileObjectOrMethodInvoke(contextVars, str.substring(0, indexOf)),
                    op: o,
                    after: this._compileObjectOrMethodInvoke(contextVars, str.substring(indexOf + o.length)),
                    toString: function () {
                        return this.before + this.op + this.after
                    }
                }
            }
        }

        return this._compileObjectOrMethodInvoke(contextVars, str);
    },


}

