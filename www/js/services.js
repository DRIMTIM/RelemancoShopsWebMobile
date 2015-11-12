angular.module('app.services', [])

.service('GeoLocationService', function(){
    this.setCurrentLocation = function($scope, $ionicLoading) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var center = { latitude: position.coords.latitude, longitude: position.coords.longitude};
            $scope.map.center = center;
            $ionicLoading.hide();
        }, function error() {
            $scope.errors.push(error);
            $ionicLoading.hide();
        });
    }
    return this;
})

.service('RelevadorService',

function($q, $rootScope){

    this.getRutasRelevador = function(idRelevador) {
        var url = $rootScope;
        var defer = $q.defer();
        $http.get(url)
            .then(
            function success(response){
                defer.resolve(response);
            },
            function error(error, status) {
                defer.reject(error);
            }
        );
        return defer.promise;
    }
})

.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        get: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}]);