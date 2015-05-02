/**
 * Created by tomek on 22/02/15.
 */

app.controller("JsonController", function ($scope, jsonAnalyzer) {
    console.log('Entered JSON page');

    $scope.example = function() {
        $scope.data.json = JSON.stringify(testFixture);
    };

    $scope.simpleExample = function() {
        $scope.data.json = JSON.stringify({ name: "Tomek", id:12345, location: { lat:-19.20, lon:51.40 } });
    };

});

function convertClassDefinition(cls) {
    var ret = {
        className: cls.type
    };

    ret.fields = _.map(cls.children, function(fieldDef, fieldName) {
        return {
            fieldName: fieldDef.name,
            dataType: fieldDef.type,
            path: fieldDef.path
        }
    });


    return ret;
}


app.controller("CodeController", function ($scope, jsonAnalyzer) {
    console.log('Entered CODE page');

    $scope.data.hints = {};
    $scope.data.selected = {};

    function buildSwiftCode() {
        var obj = JSON.parse($scope.data.json);

        var output = jsonAnalyzer.parse(obj, $scope.data);

        //var of = new ObjectField($scope.data.rootClass, obj);
        var s = "";
        output.forEach(function (t) {
            s += "// " + t.type + "\n";
            s += t.swiftCode();
            s += "\n\n";
        });
        $scope.generated = s;

        $scope.classes = _.map(output, convertClassDefinition);
    }
    buildSwiftCode();

    $scope.$watch('[data.rootClass, data.prefix, data.decodeIn, data.decodeMethodName]', function(val) {
        buildSwiftCode();
    });

    $scope.editField = function(f) {
        console.log('Editing field ', f);
        $scope.data.selected = angular.copy(f);
    };

    $scope.isEdited = function(f) {
        return f.path === $scope.data.selected.path;
    }

    $scope.updateFieldName = function(f) {
        $scope.data.hints[f.path] = { fieldName: $scope.data.selected.fieldName };
        $scope.data.selected = {};
        buildSwiftCode();
    }

});



app.controller("SwiftController", function ($scope, jsonAnalyzer) {
    $scope.data = {
        json: "{}",
        rootClass: "MyClass",
        prefix: "",
        decodeIn: "init",
        decodeMethodName: "decode"
    };

});