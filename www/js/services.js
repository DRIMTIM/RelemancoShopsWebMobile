angular.module('app.services', [])

/**
 * Requiere GoogleMaps.js
 */
    .service('geoLocationService', function () {
        this.setCurrentLocation = function ($scope, $ionicLoading) {
            navigator.geolocation.getCurrentPosition(function (position) {
                $scope.map.center = {latitude: position.coords.latitude, longitude: position.coords.longitude};
                $ionicLoading.hide();
            }, function error() {
                $scope.errors.push(error);
                $ionicLoading.hide();
            });
        };

        this.createRoutes = function (markers, Gmap) {

                var directionsService = new google.maps.DirectionsService();
                var map = Gmap.control.getGMap();

                var start = new google.maps.LatLng(51.47482547819850,-0.37739553384529);

                function renderDirections(result) {
                    var directionsRenderer = new google.maps.DirectionsRenderer({
                        suppressMarkers: true
                    });
                    directionsRenderer.setMap(map);
                    directionsRenderer.setDirections(result);
                }

                function requestDirections(start, end) {
                    directionsService.route({
                        origin: start,
                        destination: end,
                        travelMode: google.maps.DirectionsTravelMode.DRIVING,
                        unitSystem: google.maps.UnitSystem.METRIC
                    }, function(result) {
                        renderDirections(result);
                    });
                }

                for (var i = 0; i < markers.length; i++) {
                    if (i < markers.length - 1) {
                        var origen = {lat: markers[i].latitude, lng: markers[i].longitude};
                        var destino = {lat: markers[i+1].latitude, lng: markers[i+1].longitude};
                        requestDirections(origen, destino);
                    }
                }
        };

        /**
         * Crea los puntos extra en el mapa empezando del segundo elemento
         * @param markers
         * @returns {Array}
         */
        function createWayPoints(markers) {
            var wayPoints = [];
            //Si hay solo 2 elementos no deberian haber waypoints...
            if (markers.length > 2) {
                for (var i = 1; i < markers.length - 1; i++) {
                    wayPoints.push({
                        location: {id: markers[i].id, lat: markers[i].latitude, lng: markers[i].longitude}
                    });
                }
            }
            return wayPoints;
        }

        return this;
    })

    .service('authService', function($localstorage, $rootScope, $q, $http){

        this.doLogin = function(user) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'secure/login';

            var data =  {
                "login-form" : {
                    login: user.userName,
                    password: user.password
                }
            };

            var request = {
                method: 'POST',
                url: url,
                headers : {'Content-Type': 'application/x-www-form-urlencoded'},
                data: data
            };

            $http(request)
                .then(
                function success(response) {
                    if(angular.isObject(response.data && response.data.id)) {
                        storeUser(response.data);
                        defer.resolve(response.data)
                    }
                    else {
                        defer.reject('El nombre de usuario o contraseña es incorrecto.')
                    }
                },
                function error() {
                    defer.reject('Ocurrio un error.');
                }
            );
            return defer.promise;
        };

        this.isAuthenticated = function() {
            var user = $localstorage.getObject($rootScope.USER_INDEX);
            return angular.isObject(user) && user.id;
        };

        this.logout = function() {
            $localstorage.remove($rootScope.USER_INDEX);
        };

        function storeUser(user) {
            $localstorage.setObject($rootScope.USER_INDEX, user);
        }

    })

    .service('relevadorService',

    function ($q, $rootScope, $http) {

        this.getProductosMasVendidosPorComercio = function (idRelevador) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'pedidos/masvendidos';

            var request =  {
                idRelevador: idRelevador
            };

            $http.post(url, request)
                .then(
                function success(response) {
                    defer.resolve(response.data)
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

        this.actualizarStock = function(idComercio, productos) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'pedido/tomarpedido';
            var request =  {
                idComercio: idComercio,
                productos: productos
            };

            $http.post(url, request)
                .then(
                function success(response) {
                    defer.resolve(response.data)
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

        this.getComercios = function () {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'comercios/obtenercomercios';

            $http.get(url)
                .then(
                function success(response) {
                    defer.resolve(response.data)
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

        this.getProductosComercio = function (idComercio) {
            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'comercios/obtenerproductos';

            var request = {params: {id_comercio: idComercio}};
            $http.get(url, request)
                .then(
                function success(response) {
                    defer.resolve(response.data)
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

        this.tomarPedidoProductos = function (request) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'pedidos/tomarpedido';

            $http.post(url, request)
                .then(
                function success(response) {
                    defer.resolve(response.data)
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        }

    })

    .factory('$localstorage', ['$window', function ($window) {
        return {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            },
            remove: function(key) {
                $window.localStorage[key] = null;
            }
        }
    }])

    .factory('comercioObject', function () {
        var comercio = {};
        var setComercio = function (newComercio) {
            comercio = newComercio;
        };
        var getComercio = function () {
            return comercio;
        };
        var isUndefined = function () {
            return comercio.id == undefined || comercio.id == null;
        };
        return {
            setComercio: setComercio,
            getComercio: getComercio,
            isUndefined: isUndefined
        }
    })

    .factory('listaComercios', function () {
        var listaComercios = []
        var setListaComercios = function (newListaComercios) {
            listaComercios = newListaComercios;
        };
        var getListaComercios = function () {
            return listaComercios;
        };
        var getComercio = function (id) {
            listaComercios.forEach(function (val) {
                if (val.id == id) {
                    return val;
                }
            });
            return null;
        };
        var findComercio = function(idComercio) {
            for(var i = 0; i < listaComercios.length; i++) {
                if(listaComercios[i].id === idComercio){
                    return listaComercios[i];
                }
            }
        };
        var getAllMarkers = function () {
            var result = [];
            var i = 0;
            listaComercios.forEach(function (val) {
                var marker = {
                    id: val.id,
                    title: val.nombre,
                    latitude: Number(val.localizacion.latitud),
                    longitude: Number(val.localizacion.longitud),
                    showWindow: false,
                };
                result.push(marker);
                i++;
            });
            return result;
        };
        return {
            getListaComercios: getListaComercios,
            setListaComercios: setListaComercios,
            getComercio: getComercio,
            getAllMarkers: getAllMarkers,
            findComercio: findComercio
        }
    });

