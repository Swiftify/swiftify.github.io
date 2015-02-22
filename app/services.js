var app = angular.module('swiftApp', []);

app.factory('jsonAnalyzer', function() {
    return new JsonAnalyzer();
});
