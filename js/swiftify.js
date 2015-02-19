/**
 * Created by tomek on 08/02/15.
 */
var app = angular.module('swiftApp', []);

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
    return "  self." + this.name + " = " + source + '["' + this.jsonField + '"].' + typeConversion(this.type);
};

function ObjectField(name, value) {
    this.type = _.capitalize(name);
    this.name = _.camelCase(name);
    this.jsonField = name;
    this.children = this.parseChildren(value);
}

ObjectField.prototype.swiftDeclaration = function () {
    return "var " + this.name + ":" + this.type + '?';
};

ObjectField.prototype.unmarshallingCode = function (source) {
    return "  self." + this.name + " = " + this.type + "(json: " + source + '["' + this.jsonField + '"])';
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
    var specimen = _.merge.apply(this, value);
    this.type = singularize(_.capitalize(this.name));
    var of = new ObjectField(this.type, specimen);
};


ArrayField.prototype.swiftDeclaration = function () {
    if (this.type) {
        return "var " + this.name + ": [" + this.type + "]" + " = Array<" + this.type + ">()\n";
    } else {
        return "// Unparsed array: " + this.name;
    }
};

ArrayField.prototype.arrayElementExpression = function () {
    if (this.primitive) {
        return "i.1." + typeConversion(this.type);    // TODO optional?
    } else {
        return this.type + "(json: i.1)";
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

ObjectField.prototype.swiftCode = function () {
    var s = "class " + this.type + " {\n";
    _.forOwn(this.children, function (field) {
        s += "   " + field.swiftDeclaration() + "\n";
    });

    s += "\n\n";

    s += "  init(json:JSON) {\n";
    _.forOwn(this.children, function (field) {
        s += "   " + field.unmarshallingCode('json') + "\n";
    });
    s += "  }\n\n";

    s += "}\n";
    return s;
};

app.controller("SwiftController", function ($scope) {
    var vm = this;

    $scope.source = JSON.stringify(testFixture);

    var obj = JSON.parse($scope.source);
    var of = new ObjectField("MyClass", obj);
    //vm.generated = of.swiftCode();

    var s = "";
    types.forEach(function (t) {
        s += "// " + t.type + "\n";
        s += t.swiftCode();
        s += "\n\n";
    });

    vm.generated = s;

//};

    $scope.parse = function () {
        vm.generated = new Date();

        var obj = JSON.parse($scope.source);
        console.log(obj);
        //vm.generated = generateSource(obj);


        var of = new ObjectField("MyClass", obj);
        vm.generated = of.swiftCode();
    }

});
