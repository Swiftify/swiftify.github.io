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


app.controller("CodeController", function ($scope, jsonAnalyzer) {
    console.log('Entered CODE page');


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
    }
    buildSwiftCode();

    //$scope.$watch('data.rootClass', function(val) {
    //    buildSwiftCode();
    //});
    //
    //$scope.$watch('data.prefix', function(val) {
    //    buildSwiftCode();
    //});
    //
    //$scope.$watch('data.decodeIn', function(val) {
    //    buildSwiftCode();
    //});
    //
    //$scope.$watch('data.decodeMethodName', function(val) {
    //    buildSwiftCode();
    //});

    $scope.$watch('[data.rootClass, data.prefix, data.decodeIn, data.decodeMethodName]', function(val) {
        buildSwiftCode();
    });


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