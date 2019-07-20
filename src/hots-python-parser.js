const fs = require("fs");

const tokenTypes = {
    WHITESPACE: 0,
    NAME: 1,
    NUMBER: 2,
    STRING_SINGLE_QUOTE: 3,
    STRING_DOUBLE_QUOTE: 4,
    ASSIGNMENT: 5,
    LIST_START: 10,
    LIST_END: 11,
    TUPLE_START: 20,
    TUPLE_END: 21,
    OBJECT_START: 30,
    OBJECT_END: 31,
    COMMA: 40,
    COMMENT_LINE: 50,
    UNKNOWN: 100
};
const stackTypes = {
    LIST: 0,
    TUPLE: 1,
    OBJECT: 2
};

const pregWhitespace = /\s+/;
const pregNameFirst = /[a-z_]/i;
const pregNameFollowup = /[a-z0-9_]/i;
const pregNumberFirst = /[\-0-9]+/;
const pregNumberFollowup = /[0-9\.]+/;

class HotsPythonParser {

    static getTokenTypes() {
        return tokenTypes;
    }

    static tokensGetNextMeaningful(tokens, offset) {
        for (let i = offset; i < tokens.length; i++) {
            switch (tokens[i].type) {
                // Not meaningful tokens
                case tokenTypes.WHITESPACE:
                case tokenTypes.COMMENT_LINE:
                    break;
                default:
                    return tokens[i];
            }
        }
        return null;
    }

    static tokensAsJsonString(tokens, minified) {
        if (typeof minified === "undefined") {
            minified = false;
        }
        let result = "{"+(minified ? "" : "\n");
        let stack = [ stackTypes.OBJECT ];
        let rootComma = true;
        for (let i = 0; i < tokens.length; i++) {
            switch (tokens[i].type) {
                case tokenTypes.WHITESPACE:
                    if (!minified) {
                        result += tokens[i].text;
                    }
                    break;
                case tokenTypes.NAME:
                    result += JSON.stringify(tokens[i].text);
                    rootComma = false;
                    break;
                case tokenTypes.ASSIGNMENT:
                    result += ":";
                    break;
                case tokenTypes.NUMBER:
                case tokenTypes.STRING_SINGLE_QUOTE:
                case tokenTypes.STRING_DOUBLE_QUOTE:
                    result += JSON.stringify(tokens[i].text);
                    break;
                case tokenTypes.LIST_START:
                    result += "[";
                    stack.push(stackTypes.LIST);
                    break;
                case tokenTypes.LIST_END:
                    result += "]";
                    if (stack.pop() !== stackTypes.LIST) {
                        throw new Error("Invalid token structure! Expected to close a LIST");
                    }
                    break;
                case tokenTypes.TUPLE_START:
                    result += "[";
                    stack.push(stackTypes.TUPLE);
                    break;
                case tokenTypes.TUPLE_END:
                    result += "]";
                    if (stack.pop() !== stackTypes.TUPLE) {
                        throw new Error("Invalid token structure! Expected to close a TUPLE");
                    }
                    break;
                case tokenTypes.OBJECT_START:
                    result += "{";
                    stack.push(stackTypes.OBJECT);
                    break;
                case tokenTypes.OBJECT_END:
                    result += "}";
                    if (stack.pop() !== stackTypes.OBJECT) {
                        throw new Error("Invalid token structure! Expected to close a OBJECT");
                    }
                    break;
                case tokenTypes.COMMA: {
                    // Do not add a comma after the last list element
                    let closingToken = null;
                    switch (stack[stack.length-1]) {
                        case stackTypes.LIST:
                            closingToken = tokenTypes.LIST_END;
                            break;
                        case stackTypes.TUPLE:
                            closingToken = tokenTypes.TUPLE_END;
                            break;
                        case stackTypes.OBJECT:
                            closingToken = tokenTypes.OBJECT_END;
                            break;
                    }
                    let nextToken = HotsPythonParser.tokensGetNextMeaningful(tokens, i+1);
                    if ((nextToken !== null) && (nextToken.type !== closingToken)) {
                        result += ",";
                    }
                    break;
                }
                case tokenTypes.COMMENT_LINE:
                    break;
                default:
                    result += tokens[i].text;
                    break;
            }
            if ((stack.length === 1) && !rootComma) {
                let nextToken = HotsPythonParser.tokensGetNextMeaningful(tokens, i+1);
                if ((nextToken !== null) && (nextToken.type === tokenTypes.NAME)) {
                    // Add commas between the top level elements
                    tokens.splice(i + 1, 0, {type: tokenTypes.COMMA, text: ","});
                    rootComma = true;
                }
            }
        }
        result += (minified ? "" : "\n")+"}";
        return result;
    }

    /**
     * @param {String} filename
     */
    constructor(filename) {
        this.char = "";
        this.text = "";
        this.position = 0;
        this.length = 0;
        this.tokens = [];
        if (typeof filename !== "undefined") {
            this.loadFile(filename);
            this.parse();
        }
    }

    loadFile(filename) {
        this.text = fs.readFileSync(filename).toString();
        this.length = this.text.length;
    }

    readChar() {
        if (this.position < this.length) {
            this.char = this.text[ this.position++ ];
            return true;
        } else {
            return false;
        }
    }

    parse() {
        this.tokens = [];
        this.char = "";
        this.position = 0;
        while (this.readChar()) {
            this.tokens.push( this.parseToken() );
        }
    }

    parseToken() {
        if (this.char.match(pregWhitespace)) {
            return this.parseToken_RegExp(pregWhitespace, tokenTypes.WHITESPACE);
        }
        if (this.char.match(pregNameFirst)) {
            return this.parseToken_RegExp(pregNameFollowup, tokenTypes.NAME);
        }
        if (this.char.match(pregNumberFirst)) {
            return this.parseToken_RegExp(pregNumberFollowup, tokenTypes.NUMBER);
        }
        if (this.char === "'") {
            return this.parseToken_String("'", tokenTypes.STRING_SINGLE_QUOTE);
        }
        if (this.char === '"') {
            return this.parseToken_String('"', tokenTypes.STRING_DOUBLE_QUOTE);
        }
        if (this.char === "[") {
            return { type: tokenTypes.LIST_START, text: this.char };
        }
        if (this.char === "]") {
            return { type: tokenTypes.LIST_END, text: this.char };
        }
        if (this.char === "(") {
            return { type: tokenTypes.TUPLE_START, text: this.char };
        }
        if (this.char === ")") {
            return { type: tokenTypes.TUPLE_END, text: this.char };
        }
        if (this.char === "{") {
            return { type: tokenTypes.OBJECT_START, text: this.char };
        }
        if (this.char === "}") {
            return { type: tokenTypes.OBJECT_END, text: this.char };
        }
        if (this.char === "=") {
            return { type: tokenTypes.ASSIGNMENT, text: this.char };
        }
        if (this.char === ",") {
            return { type: tokenTypes.COMMA, text: this.char };
        }
        if (this.char === "#") {
            return this.parseToken_CommentLine();
        }
        return { type: tokenTypes.UNKNOWN, text: this.char };
    }

    parseToken_RegExp(regExp, tokenType) {
        let token = { type: tokenType, text: this.char };
        while (this.readChar()) {
            if (!this.char.match(regExp)) {
                // Mismatching char should be parsed as a new token
                this.position--;
                break;
            }
            token.text += this.char;
        }
        return token;
    }

    parseToken_String(delimiter, tokenType) {
        let token = { type: tokenType, text: "" };
        let escaped = false;
        while (this.readChar()) {
            if (this.char === "\\") {
                escaped = true;
                this.readChar();
            } else {
                escaped = false;
            }
            if (!escaped && (this.char === delimiter)) {
                // End of string
                break;
            }
            token.text += this.char;
        }
        return token;
    }

    parseToken_CommentLine() {
        let token = { type: tokenTypes.COMMENT_LINE };
        while (this.readChar()) {
            if ((this.char === "\r") || (this.char === "\n")) {
                // Newline should be parsed as a new token
                this.position--;
                break;
            }
            token.text += this.char;
        }
        return token;
    }

    toJson() {
        let jsonData = this.toJsonString();
        return JSON.parse( jsonData );
    }
    toJsonString() {
        return HotsPythonParser.tokensAsJsonString(this.tokens);
    }

}

module.exports = HotsPythonParser;
