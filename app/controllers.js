/**
 * Created by tomek on 22/02/15.
 */

app.controller("JsonController", function ($scope, jsonAnalyzer) {
    console.log('Entered JSON page');

    $scope.example = function() {
        $scope.data.json = JSON.stringify(testFixture);
    }
});


app.controller("CodeController", function ($scope, jsonAnalyzer) {
    console.log('Entered CODE page');


    function buildSwiftCode() {
        types = [];
        var obj = JSON.parse($scope.data.json);
        var of = new ObjectField($scope.data.rootClass, obj);
        var s = "";
        types.forEach(function (t) {
            s += "// " + t.type + "\n";
            s += t.swiftCode();
            s += "\n\n";
        });
        $scope.generated = s;
    }
    buildSwiftCode();

    $scope.$watch('data.rootClass', function(val) {
        buildSwiftCode();
    });


});



app.controller("SwiftController", function ($scope, jsonAnalyzer) {
    $scope.data = {
        json: "{}",
        rootClass: "MyClass",
        prefix: ""
    };

});