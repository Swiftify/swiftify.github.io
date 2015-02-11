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

function ObjectField(name, value) {
    this.type = _.capitalize(name);
    this.name = _.camelCase(name);
    this.jsonField = name;
    this.children = this.parseChildren(value);
}

ObjectField.prototype.swiftDeclaration = function() {
    return "var " + this.name + ":" + this.type;
};

ObjectField.prototype.parseChildren = function(obj) {
    var children = {};

    _.forOwn(obj, function(value, key) {

        if (typeof value === "string") {
            children[key] = new ScalarField(key, "String");
        } else if (typeof value === "number") {
            children[key] = new ScalarField(key, "Int");
        } else if (typeof value === "boolean") {
            children[key] = new ScalarField(key, "Bool");
        } else if (_.isArray(value)) {
            children[key] = new ScalarField(key, "[AnyObject]");
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
        s += "// Klazz\n"
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
