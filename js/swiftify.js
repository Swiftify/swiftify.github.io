/**
 * Created by tomek on 08/02/15.
 */

function JsonAnalyzer() {
    console.log('Creating JSONanalyzer');
    this.foo = "bar";
    this.config = {};
    this.types = [];

    var reservedSwiftWords = ["class", "deinit", "enum", "extension", "func", "import", "init", "internal", "let", "operator", "private", "protocol", "public", "static", "struct", "subscript", "typealias", "var",
        "break", "case", "continue", "default", "do", "else", "fallthrough", "for", "if", "in", "return", "switch", "where", "while",
        "as", "dynamicType", "false", "is", "nil", "self", "Self", "super", "true",
        "associativity", "convenience", "dynamic", "didSet", "final", "get", "infix", "inout", "lazy", "left", "mutating", "none", "nonmutating", "optional", "override", "postfix", "precedence", "prefix", "Protocol", "required", "right", "set", "Type", "unowned", "weak", "willSet"];
}

JsonAnalyzer.prototype.parse = function (obj, config) {
    this.config = config;

    var types = [];


    function spaces(num) {
        var repeat = num || 1;
        return _.repeat('  ', repeat);
    }

    function typeConversion(swiftType) {
        switch (swiftType) {
            case 'String':
                return 'string';
            case 'Int':
                return 'int';
            case 'Double':
                return 'number?.doubleValue';
            case 'Bool':
                return 'bool';
            case 'AnyObject':
                return 'object';
            default:
                return 'object';
        }
    }

    function ScalarField(name, type) {
        this.name = name;
        this.type = type;
        this.jsonField = name;
    }

    ScalarField.prototype.swiftDeclaration = function () {
        return "var " + this.name + ":" + this.type + '?';
    };

    ScalarField.prototype.unmarshallingCode = function (source) {
        return spaces() + "self." + this.name + " = " + source + '["' + this.jsonField + '"].' + typeConversion(this.type);
    };

    ObjectField = function (name, value) {
        this.type = config.prefix + _.capitalize(name);
        this.name = _.camelCase(name);
        this.jsonField = name;
        this.children = this.parseChildren(value);
    };

    ObjectField.prototype.swiftDeclaration = function () {
        if (decoderInInitializer()) {
            return "var " + this.name + ":" + this.type + '?';
        } else {
            return "var " + this.name + ":" + this.type + ' = ' + this.type + '()'
        }
    };

    ObjectField.prototype.unmarshallingCode = function (source) {
        var sourceVariable = source + '["' + this.jsonField + '"]';
        var fieldReference = spaces() + "self." + this.name;
        if (decoderInInitializer()) {
            return fieldReference + " = " + this.type + "(json: " + sourceVariable + ')';
        } else {
            return fieldReference + "." + config.decodeMethodName + '(' + sourceVariable + ')';
        }
    };


    function ArrayField(name, value) {
        this.type = null;
        this.name = _.camelCase(name);
        this.jsonField = name;
        this.analyze(value);
    }

    function isPrimitive(value) {
        return _.includes(["string", "number", "boolean"], typeof value);
    }

    function singularize(word) {
        if (_.endsWith(word, 'ies')) {
            return word.slice(0, -3) + 'y';
        } else if (_.endsWith(word, 'ues')) {
            return word.slice(0, -1);
        } else if (_.endsWith(word, 'es')) {
            return word.slice(0, -2);
        } else if (_.endsWith(word, 's')) {
            return word.slice(0, -1);
        } else {
            return "A" + word;
        }
    }

    function arrayMergingCustomizer(objectValue, sourceValue, key, object, source) {
        return objectValue || sourceValue || undefined;
    }

    ArrayField.prototype.analyze = function (value) {
        // Corner case - empty array
        if (value.length == 0) {
            this.type = null;
            return;
        }
        // array must be homogenous
        var firstType = typeof(value[0]);
        var oki = _.all(value, function (v) {
            return typeof v === firstType
        });
        if (!oki) {
            return;
        }
        this.primitive = isPrimitive(value[0]);
        if (this.primitive) {
            console.log('Array of ', firstType);
            this.type = swiftType(value[0]);
            return;
        }
        // Array of objects.
        value.push(arrayMergingCustomizer);
        var specimen = _.merge.apply(this, value);
        this.type = singularize(_.capitalize(this.name));
        var of = new ObjectField(this.type, specimen);
    };


    ArrayField.prototype.swiftDeclaration = function () {
        if (this.type) {
            return "var " + this.name + ": [" + config.prefix + this.type + "]" + " = Array<" + config.prefix + this.type + ">()\n";
        } else {
            return "// Unparsed array: " + this.name;
        }
    };

    ArrayField.prototype.arrayElementExpression = function () {
        if (this.primitive) {
            return "i.1." + typeConversion(this.type);    // TODO optional?
        } else {
            return config.prefix + this.type + "(json: i.1)";
        }
    };

    ArrayField.prototype.unmarshallingCode = function (source) {
        if (this.type) {
            var identifier = "self." + this.name;
            var code = spaces() + "for i in " + source + '["' + this.jsonField + '"] {\n';
            if (this.primitive) {
                code += spaces(2) + "if let e = " + this.arrayElementExpression() + " {\n";
                code += spaces(4) + identifier + ".append(e)" + "\n";
                code += spaces(2) + "}\n"
            } else {
                code += spaces(4) + identifier + ".append(" + this.arrayElementExpression() + ")" + "\n";
            }
            code += spaces() + "}\n";
            return code;
        } else {
            return "// Skipped " + this.name + " because of empty array"
        }
    };


    function swiftType(value) {
        switch (typeof value) {
            case "string":
                return "String";
            case "boolean":
                return "Bool";
            case "number":
                if (value % 1 === 0) {
                    return "Int";
                } else {
                    return "Double";
                }
            default:
                return "Any";
        }
    }

    ObjectField.prototype.parseChildren = function (obj) {
        var children = {};
        _.forOwn(obj, function (value, key) {
            if (isPrimitive(value)) {
                children[key] = new ScalarField(key, swiftType(value));
            } else if (_.isArray(value)) {
                children[key] = new ArrayField(key, value);
            } else if (_.isObject(value)) {
                children[key] = new ObjectField(key, value);
            }
        });
        types.push(this);
        return children;
    };

    function decoderInInitializer() {
        return config.decodeIn === "init";
    }

    function decoderMethodName() {
        if (decoderInInitializer()) {
            return "init";
        } else {
            return "func " + config.decodeMethodName;
        }
    }

    ObjectField.prototype.swiftCode = function () {
        var s = "class " + this.type + " {\n";
        _.forOwn(this.children, function (field) {
            s += spaces() + field.swiftDeclaration() + "\n";
        });

        s += "\n\n";

        var methodSignature = decoderMethodName();


        s += spaces() + methodSignature + "(json:JSON) {\n";
        _.forOwn(this.children, function (field) {
            s += spaces() + field.unmarshallingCode('json') + "\n";
        });
        s += spaces() + "}\n\n";

        s += "}\n";
        return s;
    };


    new ObjectField(config.rootClass, obj);
    return types;
};
