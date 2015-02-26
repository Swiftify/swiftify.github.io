var app = angular.module('swiftApp', ['ngRoute']);

console.log('Angular app');

app.config(function($routeProvider) {

    console.log('Setting routes');

    $routeProvider.
        when('/json', {
            templateUrl: 'partials/json.html',
            controller: 'JsonController'
        }).
        when('/code', {
            templateUrl: 'partials/code.html',
            controller: 'CodeController'
        }).
        otherwise({
            redirectTo: '/json'
        });


});
