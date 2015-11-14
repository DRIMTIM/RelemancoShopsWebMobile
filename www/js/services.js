angular.module('app.services', [])

.service('geoLocationService', function(){
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

.service('relevadorService',

function($q, $rootScope, $http){

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

    this.getComercios = function() {
        var defer = $q.defer();
        var url = $rootScope.BACKEND_ENDPOINT + 'listaComercios';

        $http.post(url)
            .then(
            function success(response){
                defer.resolve(response.data)
            },
            function error(response) {
                defer.reject(response.data);
            }
        );
        return defer.promise;
    }

    this.getProductosComercio = function(idComercio) {
        var defer = $q.defer();
        var url = $rootScope.BACKEND_ENDPOINT + 'listaProductos';

        var request = { idComercio: idComercio };
        $http.post(url, request)
            .then(
            function success(response){
                defer.resolve(response.data)
            },
            function error(response) {
                defer.reject(response.data);
            }
        );
        return defer.promise;
    }

    this.tomarPedidoProductos = function(request) {

        var defer = $q.defer();
        var url = $rootScope.BACKEND_ENDPOINT + 'tomarPedido';

        $http.post(url, request)
            .then(
            function success(response){
                defer.resolve(response.data)
            },
            function error(response) {
                defer.reject(response.data);
            }
        );
        return defer.promise;
    }

})

    .factory('$localstorage', ['$window', function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
    }])

    .factory('comercioObject', function(){
        var comercio = { };
        var setComercio = function(newComercio) {
            comercio = newComercio;
        }
        var getComercio = function(){
            return comercio;
        }
        var isUndefined = function() {
            return comercio.id == undefined || comercio.id == null;
        }
        return {
            setComercio: setComercio,
            getComercio : getComercio,
            isUndefined: isUndefined
        }
    })

    .factory('listaComercios', function(){
        var listaComercios = []
        var setListaComercios = function(newListaComercios) {
            listaComercios = newListaComercios;
        }
        var getListaComercios = function() {
            return listaComercios;
        }
        var getComercio = function(id) {
            listaComercios.forEach(function(val){
                if(val.id == id) {
                    return val;
                }
            });
            return null;
        }
        return {
            getListaComercios: getListaComercios,
            setListaComercios: setListaComercios
        }
    })