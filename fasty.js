var Fasty = function (options) {
    this.funs = {};
};
Fasty.prototype = {
    Tok: function (type) {
        //type: 0 text, 1 output, 2 js
        this.type = type;
        this.tag = "";
        this.text = "";

        this.addTokText = function (text) {
            this.text += text;
        }

        this.isEmpty = function (){
            return this.text === '';
        }

        this.isText = function () {
            return type === 0;
        }

        this.isOutput = function () {
            return type === 1;
        }

        this.arrange = function () {
            this.text = this.text.trim();
            if (this.isText()) {
                return;
            }
            var sIndexOf = this.text.indexOf(' ');
            var bIndexOf = this.text.indexOf('(');
            var pIndexOf = this.text.indexOf('.');

            if (sIndexOf === pIndexOf && sIndexOf === bIndexOf && sIndexOf === -1) {
                this.tag = this.text;
            } else {
                this.tag = this.text.substring(0, this.calcMin([sIndexOf, bIndexOf, pIndexOf]));
            }
        }

        this.getTagAfter = function () {
            if (!this.tag) {
                return this.text;
            }
            return this.text.substring(this.tag.length);
        }


        this.isSafeTag = function () {
            return this.tag.endsWith("?");
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

        var proxy = new Proxy(data, {
            get: function (target, attr) {
                return target[attr] || "";
            }
        })

        return fn(proxy);
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
                    tok = new this.Tok(2);
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
        var comparison = this._appendData(this._getComparison(fragment), contextVars);
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
            var value = nameAndValue[1].trim();

            if (!this._inContextVars(contextVars, value)) {
                value = "$data." + value;
            }

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
            if (tok.isText()) {
                body += 'ret += \'' + tok.text.replace(/\'/g, '\\\'').replace(/\"/g, '\\\"') + '\';'
            } else if (tok.isOutput()) {
                if (this._inContextVars(contextVars, tok.tag)) {
                    body += 'ret += ' + tok.text + ';'
                } else {
                    body += 'ret += $data.' + tok.text + ';'
                }
            } else {
                switch (tok.tag) {
                    case "for":
                        var fragment = tok.text.substring(3).trim();
                        fragment = fragment.substring(1, fragment.length - 1).trim().replace(/\s+/g, ' ');
                        var items = fragment.split(" ");

                        //matched: for (item of array) --- for (item in array)
                        if (items.length === 3 && items[1] === "of" || items[1] === "in") {
                            var newVar = items[0];
                            var useVar = items[2];
                            if (!this._inContextVars(contextVars, useVar)) {
                                useVar = "$data." + useVar;
                            }
                            this._pushContextVars(contextVars, ++contextLevel, newVar)
                            body += "for (" + newVar + " " + items[1] + " " + useVar + "){"
                            break;
                        }

                        //matched for (var i=0,len=xxx.length; i<len; i++)
                        var cfragments = fragment.split(";");
                        if (cfragments.length === 3) {
                            var cTok = new this.Tok(2);
                            cTok.text = cfragments[0]; //var i=0,len=xxx.length;
                            cTok.arrange();

                            body += "for ("
                            //i=0,len=xxx.length
                            body += cTok.tag + " " + this._compileVars(cTok, contextVars, ++contextLevel);

                            var comparison = this._appendData(this._getComparison(cfragments[1]), contextVars);
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

    _inContextVars: function (contextVars, v) {
        //string
        if (v.indexOf("\"") === 0 || v.indexOf("\'") === 0) {
            return true;
        }

        //number
        if (!isNaN(v)) {
            return true;
        }

        //object
        var indexOf = v.indexOf(".");
        if (indexOf > 0) {
            v = v.substring(0, indexOf).trim();
        }

        //array
        indexOf = v.indexOf("[");
        if (indexOf > 0 && v.indexOf("]") > indexOf) {
            v = v.substring(0, indexOf).trim();
        }

        for (var childs of Object.values(contextVars)) {
            if (childs && childs.includes(v)) {
                return true;
            }
        }
        return false;
    },

    _getComparison: function (str) {
        var ops = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"]
        for (let o of ops) {
            var indexOf = str.indexOf(o);
            if (indexOf > 0) {
                return {
                    before: str.substring(0, indexOf).trim(),
                    op: o,
                    after: str.substring(indexOf + o.length).trim()
                }
            }
        }
    },

    _appendData: function (cprs, contextVars) {
        if (!this._inContextVars(contextVars, cprs.before)) {
            cprs.before = "$data." + cprs.before;
        }
        if (!this._inContextVars(contextVars, cprs.after)) {
            cprs.after = "$data." + cprs.after;
        }
        return cprs;
    }


}

