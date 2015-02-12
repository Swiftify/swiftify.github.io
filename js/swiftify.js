/**
 * Created by tomek on 08/02/15.
 */
var app = angular.module('swiftApp', []);

var types = [];

function ScalarField(name, type) {
	this.name = name;
	this.type = type;
	this.jsonField = name;
}

ScalarField.prototype.swiftDeclaration = function() {
	return "var " + this.name + ":" + this.type;
};

ScalarField.prototype.unmarshallingCode = function(source) {
    return "  this."+this.name + " = " + source + '["' + this.jsonField + '"].' + type
};

function ObjectField(name, value) {
    this.type = _.capitalize(name);
    this.name = _.camelCase(name);
    this.jsonField = name;
    this.children = this.parseChildren(value);
}

ObjectField.prototype.swiftDeclaration = function() {
    return "var " + this.name + ":" + this.type;
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
        return word.slice(0,-3) + 'y';
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

ArrayField.prototype.analyze = function(value) {
    // array must be homogenous
    var firstType = typeof(value[0]);
    var oki = _.all(value, function(v) { return typeof v === firstType });
    if (!oki) {
        return;
    }
    if (isPrimitive(value[0])) {
        console.log('Array of ', firstType);
        this.type = swiftType(value[0]);
        return;
    }
    // Array of objects.
    var specimen = _.merge.apply(this, value);
    this.type = singularize(_.capitalize(this.name));
    var of = new ObjectField(this.type, specimen);
};

ArrayField.prototype.swiftDeclaration = function() {
    //return "var " + this.name + ":" + this.type;
    if (this.type) {
        return "var " + this.name + ": [" + this.type + "]";
    } else {
        return "// Unparsed array: " + this.name;
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

ObjectField.prototype.parseChildren = function(obj) {
    var children = {};
    _.forOwn(obj, function(value, key) {
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

ObjectField.prototype.swiftCode = function() {
    var s = "class " + this.type + " {\n";
    _.forOwn(this.children, function(field) {
       s += "   " + field.swiftDeclaration() + "\n";
    });
    s += "}\n";
    return s;
};

app.controller("SwiftController", function($scope) {
		var vm = this;
		//$scope.generated = "foo";
		vm.generated = "foo";

		$scope.mockup = function() {
		}; 
		var fixture = {
			"expand": "schema,names",
			"startAt": 0,
			"maxResults": 50,
			"total": 6,
            "reporter" : {
                "firstName":"John",
                "lastName":"Doe",
                "id":8899127876
            },
            "tags" : [ "Important", "Urgent" ],
			"issues": [
				{
					"expand": "html",
					"id": "10230",
					"self": "http://kelpie9:8081/rest/api/2/issue/BULK-62",
					"key": "BULK-62",
					"fields": {
						"summary": "testing",
						"timetracking": null,
						"issuetype": {
							"self": "http://kelpie9:8081/rest/api/2/issuetype/5",
							"id": "5",
							"description": "The sub-task of the issue",
							"iconUrl": "http://kelpie9:8081/images/icons/issue_subtask.gif",
							"name": "Sub-task",
							"subtask": true
						},
						"customfield_10071": null
					},
					"transitions": "http://kelpie9:8081/rest/api/2/issue/BULK-62/transitions"
				},

			
			{
				"expand": "html",
				"id": "10004",
				"self": "http://kelpie9:8081/rest/api/2/issue/BULK-47",
				"key": "BULK-47",
				"fields": {
					"summary": "Cheese v1 2.0 issue",
					"timetracking": null,
					"issuetype": {
						"self": "http://kelpie9:8081/rest/api/2/issuetype/3",
						"id": "3",
						"description": "A task that needs to be done.",
						"iconUrl": "http://kelpie9:8081/images/icons/task.gif",
						"name": "Task",
						"subtask": false
					},
					"transitions": "http://kelpie9:8081/rest/api/2/issue/BULK-47/transitions"
				}
			}
			]
		}
		;
		$scope.source = JSON.stringify(fixture);

    var obj = JSON.parse($scope.source);
    var of = new ObjectField("MyClass", obj);
    //vm.generated = of.swiftCode();

    var s = "";
    types.forEach(function(t) {
        s += "// " + t.type + "\n"
        s += t.swiftCode();
        s += "\n\n";
    });

    vm.generated = s;

//};

$scope.parse = function() {
	vm.generated = new Date();

	var obj = JSON.parse($scope.source);
	console.log(obj);
	//vm.generated = generateSource(obj);


    var of = new ObjectField("MyClass", obj);
    vm.generated = of.swiftCode();

}

});
