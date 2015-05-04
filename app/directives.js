
/*
 This directive allows us to pass a function in on an enter key to do what we want.
 */
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.directive( 'editInPlace', function() {
    return {
        restrict: 'E',
        scope: {
            value: '=',
            onChange: '&onChange',
            subject: '='
        },
        template: '<span ng-click="edit()" ng-bind="value"></span><input ng-model="value"/>',
        link: function ( $scope, element, attrs ) {
            // Let's get a reference to the input element, as we'll want to reference it.
            var inputElement = angular.element( element.children()[1] );

            // This directive should have a set class so we can style it.
            element.addClass( 'edit-in-place' );

            // Initially, we're not editing.
            $scope.editing = false;

            // ng-click handler to activate edit-in-place
            $scope.edit = function () {
                $scope.editing = true;

                // We control display through a class on the directive itself. See the CSS.
                element.addClass( 'active' );

                // And we must focus the element.
                // `angular.element()` provides a chainable array, like jQuery so to access a native DOM function,
                // we have to reference the first element in the array.
                inputElement[0].focus();
            };

            // End editing on ENTER
            inputElement.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    var target = event.target;
                    target.blur();
                    event.preventDefault();
                }
            });


            var handler = $scope.onChange();

            // When we leave the input, we're done editing.
            inputElement.prop( 'onblur', function() {
                $scope.editing = false;
                element.removeClass( 'active' );
                handler($scope.subject);
            });
        }
    };
});