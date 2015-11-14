angular.module('app.services', [])

/**
 * Requiere GoogleMaps.js
 */
    .service('geoLocationService', function () {
        this.setCurrentLocation = function ($scope, $ionicLoading) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var center = {latitude: position.coords.latitude, longitude: position.coords.longitude};
                $scope.map.center = center;
                $ionicLoading.hide();
            }, function error() {
                $scope.errors.push(error);
                $ionicLoading.hide();
            });
        }

        this.createRoutes = function (markers, map) {

            var directionsDisplay = new google.maps.DirectionsRenderer();
            var directionsService = new google.maps.DirectionsService();

            directionsDisplay.setMap(map.control.getGMap());

            var origen = {lat: markers[0].latitude, lng: markers[0].longitude};
            var destino = {lat: markers[markers.length - 1].latitude, lng: markers[markers.length - 1].longitude};
            console.log(origen);
            console.log(destino);
            var wayPoints = createWayPoints(markers);

            directionsService.route({
                origin: origen,
                destination: destino,
                waypoints: wayPoints,
                optimizeWaypoints: false,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    var route = response.routes[0];
                    //var summaryPanel = document.getElementById('directions-panel');
                    //summaryPanel.innerHTML = '';
                    // For each route, display summary information.
                    //for (var i = 0; i < route.legs.length; i++) {
                    //    var routeSegment = i + 1;
                    //    summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
                    //        '</b><br>';
                    //    summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                    //    summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                    //    summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
                    //}
                } else {
                    window.alert('Failed due to ' + status);
                }
            });
        }

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
                        location: {lat: markers[i].latitude, lng: markers[i].longitude}
                    });
                }
            }
            return wayPoints;
        }

        return this;
    })

    .service('relevadorService',

    function ($q, $rootScope, $http) {

        this.getRutasRelevador = function (idRelevador) {
            var url = $rootScope;
            var defer = $q.defer();
            $http.get(url)
                .then(
                function success(response) {
                    defer.resolve(response);
                },
                function error(error, status) {
                    defer.reject(error);
                }
            );
            return defer.promise;
        }

        this.getComercios = function () {
            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'listaComercios';

            $http.post(url)
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

        this.getProductosComercio = function (idComercio) {
            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'listaProductos';

            var request = {idComercio: idComercio};
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

        this.tomarPedidoProductos = function (request) {

            var defer = $q.defer();
            var url = $rootScope.BACKEND_ENDPOINT + 'tomarPedido';

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
            }
        }
    }])

    .factory('comercioObject', function () {
        var comercio = {};
        var setComercio = function (newComercio) {
            comercio = newComercio;
        }
        var getComercio = function () {
            return comercio;
        }
        var isUndefined = function () {
            return comercio.id == undefined || comercio.id == null;
        }
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
        }
        var getListaComercios = function () {
            return listaComercios;
        }
        var getComercio = function (id) {
            listaComercios.forEach(function (val) {
                if (val.id == id) {
                    return val;
                }
            });
            return null;
        }
        var getAllMarkers = function () {
            var result = [];
            listaComercios.forEach(function (val) {
                var marker = {
                    id: val.id,
                    title: val.nombre,
                    latitude: val.lat,
                    longitude: val.long
                };
                result.push(marker);
            });
            return result;
        }
        return {
            getListaComercios: getListaComercios,
            setListaComercios: setListaComercios,
            getComercio: getComercio,
            getAllMarkers: getAllMarkers
        }
    })

