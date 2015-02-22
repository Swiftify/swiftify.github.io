/**
 * Created by tomek on 22/02/15.
 */
app.controller("SwiftController", function ($scope, jsonAnalyzer) {
    var vm = this;

    $scope.source = JSON.stringify(testFixture);

    $scope.classNamePrefix = "";

    $scope.current = "json";

    var obj = JSON.parse($scope.source);
    var of = new ObjectField("MyClass", obj);

    var s = "";
    types.forEach(function (t) {
        s += "// " + t.type + "\n";
        s += t.swiftCode();
        s += "\n\n";
    });

    vm.generated = s;


    $scope.parse = function () {
        vm.generated = new Date();
        var obj = JSON.parse($scope.source);
        console.log(obj);
        //vm.generated = generateSource(obj);
        var of = new ObjectField("MyClass", obj);
        vm.generated = of.swiftCode();
    };

    $scope.showJson = function() {
        console.log('Clicked json');
        $scope.current = "json";
    };

    $scope.showCode = function() {
        console.log('clicked Code');
        $scope.current = "code";

    };



});