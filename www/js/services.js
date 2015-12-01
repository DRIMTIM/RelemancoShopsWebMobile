angular.module('app.services', [])

/**
 * Requiere GoogleMaps.js
 */
    .service('geoLocationService', function ($q) {
        this.setCurrentLocation = function ($scope, $ionicLoading) {
            navigator.geolocation.getCurrentPosition(function (position) {
                $scope.map.center = {latitude: position.coords.latitude, longitude: position.coords.longitude};
                $ionicLoading.hide();
            }, function error() {
                $scope.errors.push(error);
                $ionicLoading.hide();
            });
        };

        this.clearRoutes = function(Gmap) {
            if(angular.isArray(Gmap._directions)){
                var directionsRenderer = Gmap._directions;
                if(directionsRenderer.length > 0) {
                    directionsRenderer.forEach(function(val){
                       val.setMap(null);
                    });
                    Gmap._directions = [];
                }
            }
        };

        this.setMarkerUserLocation = function () {
            var defer = $q.defer();
            navigator.geolocation.getCurrentPosition(function (position) {
                var location = 'USER-LOCATION';
                var userMarker = {
                    id: location,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    showWindow: false,
                    options: {
                        icon: {
                            url: 'img/man.png',
                        }
                    }
                };
                defer.resolve(userMarker);
            });
            return defer.promise;
        };


        this.createRoutes = function (markers, Gmap) {

            var directionsService = new google.maps.DirectionsService();
            var map = Gmap.control.getGMap();
            Gmap._directions = [];
            function renderDirections(result) {
                var directionsRenderer = new google.maps.DirectionsRenderer({
                    suppressMarkers: true
                });
                directionsRenderer.setMap(map);
                directionsRenderer.setDirections(result);
                Gmap._directions.push(directionsRenderer);
            }

            function requestDirections(start, end) {
                directionsService.route({
                    origin: start,
                    destination: end,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, function (result) {
                    renderDirections(result);
                });
            }

            for (var i = 0; i < markers.length; i++) {
                if (i < markers.length - 1) {
                    var origen = {lat: markers[i].latitude, lng: markers[i].longitude};
                    var destino = {lat: markers[i + 1].latitude, lng: markers[i + 1].longitude};
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

    .service('authService', function ($localstorage, $rootScope, $q, $http, xFormConverter) {

        this.doLogin = function (user) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'secure/login';

            var data = {
                "login-form": {
                    login: user.userName,
                    password: user.password
                }
            };

            var request = {
                method: 'POST',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: data,
                transformRequest: xFormConverter.transformRequest
            };

            $http(request)
                .then(
                function success(response) {
                    if(response.data == false) {
                        defer.reject('El nombre de usuario o contraseña es incorrecto.')
                    }
                    else if (response.data.length > 0 && angular.isObject(response.data[0]) && angular.isNumber(response.data[0].id)) {
                        storeUser(response.data);
                        defer.resolve(response.data)
                    }
                },
                function error() {
                    defer.reject('Ocurrio un error.');
                }
            );
            return defer.promise;
        };

        this.isAuthenticated = function () {
            var user = $localstorage.getObject($rootScope.USER_INDEX);
            return angular.isObject(user) && user.id;
        };

        this.logout = function () {
            $localstorage.remove($rootScope.USER_INDEX);
        };

        this.getUser = function () {
            return $localstorage.getObject($rootScope.USER_INDEX);
        };

        function storeUser(user) {
            var usuario = user[0];
            if(user.length > 1) {
                usuario.localizacion = user[1];
            }
            $localstorage.setObject($rootScope.USER_INDEX, usuario);
        }

    })

    .service('relevadorService',

    function ($q, $rootScope, $http, xFormConverter, authService) {

        this.getProductosMasVendidosPorComercio = function (idRelevador) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'pedidos/masvendidos';

            var request = {
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

        this.actualizarStock = function (idRelevador, idComercio, productos) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'pedidos/relevar-stock-comercio';

            var data = {
                id_comercio: idComercio,
                id_relevador: idRelevador,
                productos: productos
            };

            var json = angular.toJson(data);

            var request = {
                method: 'POST',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: json,
                transformRequest: xFormConverter.transformRequest
            };

            $http(request)
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
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'rutas/obtenerruta';
            //var url = $rootScope.BACKEND_ENDPOINT_PROD + 'comercios/obtenercomercios';

            var user = authService.getUser();

            $http.get(url, {params: {id_relevador : user.id}})
                .then(
                function success(response) {
                    var json = angular.fromJson(response.data);
                    if(angular.isArray(json)) {
                        defer.resolve(angular.fromJson(response.data));
                    }
                    else {
                        defer.reject(response.data);
                    }
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
                    if(angular.isArray(response.data)){
                        var result = [];
                        response.data.forEach(function(value){
                            var producto = value.producto;
                            producto.stock = value.cantidad;
                            result.push(producto);
                        });
                        defer.resolve(result)
                    }
                    else {
                        defer.reject(response.data);
                    }
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

        this.tomarPedidoProductos = function (data) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'pedidos/confirmarpedido';

            var json = angular.toJson(data);

            var request = {
                method: 'POST',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: json,
                transformRequest: xFormConverter.transformRequest
            };
            $http(request)
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

        this.obtenerHistoricoRutas = function(idRelevador) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT_PROD + 'rutas/obtenerhistoricorutas';

            $http.get(url, {params: {id_relevador: idRelevador}})
                .then(
                function success(response) {
                    defer.resolve(angular.fromJson(response.data));
                },
                function error(response) {
                    defer.reject(response.data);
                }
            );
            return defer.promise;
        };

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
            remove: function (key) {
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
            return comercio == undefined || comercio.id == undefined || comercio.id == null;
        };
        return {
            setComercio: setComercio,
            getComercio: getComercio,
            isUndefined: isUndefined
        }
    })

    .factory('listaComercios', function ($rootScope) {
        var listaComercios = [];
        var setListaComercios = function (newListaComercios) {
            listaComercios = newListaComercios;
            $rootScope.$broadcast($rootScope.BROADCAST_COMERCIOS, {listaComercios: listaComercios});
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
        var findComercio = function (idComercio) {
            for (var i = 0; i < listaComercios.length; i++) {
                if (listaComercios[i].id === idComercio) {
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
                    options: {
                        icon: {
                            url: 'img/icon.png'
                        }
                    }
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
    })

    .service('xFormConverter', function () {
        //Credito a -> http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/asdasdgfdgohttprovider%20Httprovider
        /**
         * The workhorse; converts an object to x-www-form-urlencoded serialization.
         * @param {Object} obj
         * @return {String}
         */
        var param = function (obj) {
            var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

            for (name in obj) {
                value = obj[name];

                if (value instanceof Array) {
                    for (i = 0; i < value.length; ++i) {
                        subValue = value[i];
                        fullSubName = name + '[' + i + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value instanceof Object) {
                    for (subName in value) {
                        subValue = value[subName];
                        fullSubName = name + '[' + subName + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value !== undefined && value !== null)
                    query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
            }

            return query.length ? query.substr(0, query.length - 1) : query;
        };

        // Override $http service's default transformRequest
        return {
            transformRequest: transformRequest = [function (data) {
                return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
            }]
        }
    });