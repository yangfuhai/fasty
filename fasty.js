var Fasty = function (options) {
    //the shared methods and data
    this.share = options && options.share ? options.share : null;

    //default value: false
    this.shareDataFirst = options && typeof options.shareDataFirst != "undefined" ? options.shareDataFirst : false;

    //safely Access mode
    this.safelyAccess = options && typeof options.safelyAccess != "undefined" ? options.safelyAccess : true;

    //the compile funtions cache
    this.funs = {};
};

Fasty.prototype = {
    Tok: function (type) {
        //type: 0 text, 1 output, 2 escape output, 3unescape output   , 9 js
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

        this.arrange = function () {
            if (this.isText()) {
                return;
            }

            this.text = this.text.trim();
            if (this.isOutput() && this.safelyAccess) {
                this.text = this.text.replace(/\?\./g, "$safe.")
                    .replace(/\?\(/g, "$safe(")
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
                fn = new Function("$data", body);
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
            return value.toString()
                .replace(/\&/g, '&amp;')
                .replace(/\</g, '&lt;')
                .replace(/\>/g, '&gt;')
                .replace(/\'/g, '&#39;')
                .replace(/\"/g, '&quot;');
        }

        data['$unescape'] = function (value) {
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
                if (attr.endsWith("$safe")) {
                    attr = attr.substring(0, attr.length - 5);
                    var ret = target[attr];
                    return ret ? that._proxy(ret, true, attr) : that._proxy(() => {
                    }, true, attr);
                } else {
                    var ret = target[attr];
                    return ret ? ret : (this.withSafe ? "" : undefined)
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
        while (!this._isEnd(pos, template)) {

            var c = template.charAt(pos);
            if (c === '\n' || c === '\t') {
                pos++;
                continue;
            }
            if (c === '{' && template.charAt(pos + 1) === '{') {
                if (tok) {
                    toks.push(tok);
                    tok.arrange();
                    tok = null;
                }

                //js
                if (template.charAt(pos + 2) === '~') {
                    pos += 3;
                    tok = new this.Tok(9);
                }

                //escape
                else if (template.charAt(pos + 2) === '#') {
                    pos += 3;
                    tok = new this.Tok(2);
                }

                //unescape
                else if (template.charAt(pos + 2) === '!') {
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

            if (c === '}' && template.charAt(pos + 1) === '}') {
                pos += 2;

                if (tok) {
                    toks.push(tok);
                    tok.arrange();
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
            tok.arrange();
            toks.push(tok);
        }

        return toks;
    },

    _isEnd: function (pos, template) {
        return pos >= template.length;
    },


    _compileComparison: function (tok, contextVars) {
        var tagAfter = tok.getTagAfter().trim();
        var fragment = tagAfter.substring(1, tagAfter.length - 1).trim();
        var comparison = this._getComparison(fragment, contextVars);
        return comparison.before + comparison.op + comparison.after;
    },


    _compileVars: function (tok, contextVars, contextLevel) {
        var vars = tok.getTagAfter().split(",");
        var ret = "";
        for (let i = 0; i < vars.length; i++) {
            var nameAndValue = vars[i].split("=");

            if (nameAndValue.length !== 2) {
                throw new Error("Variable definition error: " + tok.text)
            }

            var name = nameAndValue[0].trim();
            var value = this._compileObjectOrMethodInvoke(contextVars, nameAndValue[1]);

            this._pushContextVars(contextVars, contextLevel, name)

            ret += name + "=" + value;
            if (i === vars.length - 1) {
                ret += ";"
            } else {
                ret += ","
            }
        }
        return ret;
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
                    body += 'ret += $data.$escape(' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ');';
                } else if (tok.isUnEscape()) {
                    body += 'ret += $data.$unescape(' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ');';
                } else {
                    body += 'ret += ' + this._compileObjectOrMethodInvoke(contextVars, tok.text) + ';';
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
                            cTok.arrange();

                            body += "for ("
                            //i=0,len=xxx.length
                            body += cTok.tag + " " + this._compileVars(cTok, contextVars, ++contextLevel);

                            var comparison = this._getComparison(cfragments[1], contextVars);
                            body += comparison.before + comparison.op + comparison.after + ";";
                            body += cfragments[2] + "){"
                            break;
                        }
                        break;
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

    _compileObjectOrMethodInvoke: function (contextVars, objOrMethodInvoke) {
        return this._compileMethodInvoke(contextVars, objOrMethodInvoke, true);
    },


    _compileMethodInvoke: function (contextVars, methodInvoke, firstInvoke) {
        methodInvoke = methodInvoke.trim();

        var p = methodInvoke.indexOf(".");
        var lb = methodInvoke.indexOf("(");
        var rb = methodInvoke.indexOf(")");

        // Not method
        if (!(rb > lb && lb > 0)) {
            if (firstInvoke) {
                return this._inContextVars(contextVars, methodInvoke)
                    ? methodInvoke : "$data." + methodInvoke;
            } else {
                return methodInvoke;
            }
        }

        // Object.keys(obj);
        // func(paras).xxx
        var objIndexOf = p !== -1 && p < lb ? p : lb;
        var obj = methodInvoke.substring(0, objIndexOf);
        if (firstInvoke && !this._inContextVars(contextVars, obj)) {
            obj = "$data." + obj;
        }

        var ret = obj + methodInvoke.substring(objIndexOf, lb) + "("
        var parasString = methodInvoke.substring(lb + 1, rb);
        var paras = parasString.split(",");
        for (let i = 0; i < paras.length; i++) {
            var para = paras[i].trim();
            if (!this._inContextVars(contextVars, para)) {
                para = "$data." + para;
            }
            ret += para;
            if (i !== paras.length - 1) {
                ret += ",";
            }
        }
        ret += ")";

        //end
        if (rb + 1 === methodInvoke.length) {
            return ret;
        }

        //there are some method invoke after
        return ret + this._compileMethodInvoke(contextVars, methodInvoke.substring(rb + 1), false);
    },

    _inContextVars: function (contextVars, key) {
        //string
        if (key.indexOf("\"") === 0 || key.indexOf("\'") === 0) {
            return true;
        }

        //number
        if (!isNaN(key)) {
            return true;
        }

        //object
        var indexOf = key.indexOf(".");
        if (indexOf > 0) {
            key = key.substring(0, indexOf).trim();
        }

        //array
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

        // Javascript Object
        return ["$data", "Object", "Number", "String", "Boolean", "Array", "Math", "Date"].indexOf(key) > -1;
    },

    _getComparison: function (str, contextVars) {
        var ops = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"]
        for (let o of ops) {
            var indexOf = str.indexOf(o);
            if (indexOf > 0) {
                return {
                    before: this._compileObjectOrMethodInvoke(contextVars, str.substring(0, indexOf)),
                    op: o,
                    after: this._compileObjectOrMethodInvoke(contextVars, str.substring(indexOf + o.length))
                }
            }
        }
    },


}

