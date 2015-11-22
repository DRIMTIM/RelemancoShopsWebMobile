angular.module('app.controllers', [])

    .controller('LoginController', function ($scope, $state, $localstorage, $rootScope) {
        $scope.doLogin = function () {
            $localstorage.set($rootScope.RELEVADOR, 1);
            $state.go('app.home');
        }
    })

    .controller('HomeController',
    function ($scope, $ionicLoading, relevadorService, $localstorage) {

        //var idRelevador = $localstorage.get($rootScope.RELEVADOR);
        var idRelevador = 1;
        $scope.selectedComercio = {};
        $scope.chartComercios = {
            data: [],
            labels: []
        };

        $scope.$on('$ionicView.enter', function () {
            relevadorService.getProductosMasVendidosPorComercio(idRelevador).then(
                function success(data) {
                    if (data.length > 0) {
                        $scope.selectedComercio = data[0];
                        if($scope.selectedComercio.productos && $scope.selectedComercio.productos.length > 0){
                            $scope.chartComercios.data = [];
                            $scope.chartComercios.labels = [];
                            $scope.selectedComercio.productos.forEach(function (val) {
                                $scope.chartComercios.data.push(val.cantidad);
                                $scope.chartComercios.labels.push(val.nombre);
                            });
                        }
                    }
                }
            );
        });
    })

    .controller('RutasController',

    function ($scope, $ionicLoading, geoLocationService, $localstorage, listaComercios, uiGmapIsReady) {
        $scope.map = {center: {latitude: 45, longitude: -73}, zoom: 13, control: {}};
        $scope.comerciosMarkers = listaComercios.getAllMarkers();
        $ionicLoading.show({
            template: 'Cargando...'
        });

        geoLocationService.setCurrentLocation($scope, $ionicLoading);

        $scope.initRuta = function () {
            ruta = {};
            ruta.isInit = true;
            $localstorage.setObject('ruta', ruta);
        }
        uiGmapIsReady.promise(1).then(function(){
            geoLocationService.createRoutes($scope.comerciosMarkers, $scope.map);
        });


    })

    .controller('StockController', function ($scope, comercioObject, relevadorService, $ionicPopup, listaComercios, $ionicLoading) {

        $scope.comercio = { };

        $scope.actualizarStock = function() {

        }

        $scope.updateListaProductos = function(comercio) {
            $ionicLoading.show({
                template: 'Cargando...'
            });
            relevadorService.getProductosComercio(comercio.id)
                .then(function success(data){
                    $scope.listaProductos = data;
                    $ionicLoading.hide();
                },
                function error(response) {
                    $ionicLoading.hide();
                    $ionicPopup.alert({
                        title: 'Error',
                        template: response.message? response.message : 'Ocurrio un error'
                    });
                }
            );
        }

        $scope.$on('$ionicView.enter', function() {
            $scope.listaComercios = listaComercios.getListaComercios();
            if(comercioObject.isUndefined()) {
                comercioObject.setComercio($scope.listaComercios[0]);
            }
            $scope.comercio  = comercioObject.getComercio();
            $scope.updateListaProductos($scope.comercio);
        });

    })

    .controller('PedidosController', function ($scope, comercioObject, relevadorService, $ionicPopup, $ionicLoading, listaComercios, $state) {
        $scope.comercio = { };
        $scope.updateComercio = function(comercio) {
            $scope.comercio = comercio;
        }
        $scope.tomarPedido = function() {

            var request =  {};
            request.listaProductos = [];
            request.idComercio = $scope.comercio.id;

            $scope.listaProductos.forEach(function(value) {
                if(value.cantidad && value.cantidad > 0) {
                    request.listaProductos.push(value);
                }
            });

            if(request.listaProductos.length > 0) {
                relevadorService.tomarPedidoProductos(request)
                    .then(function success(response){
                        $ionicPopup.alert({
                            title: 'Operacion exitosa',
                            template: 'Se ha tomado el pedido correctamente.'
                        }).then(function(){
                            $state.go('app.mapa');
                        });

                    },
                    function error(response) {
                        $ionicPopup.alert({
                            title: 'Error',
                            template: response.message? response.message : 'Ocurrio un error'
                        });
                    }
                );
            }
            else {
                $ionicPopup.alert({
                    title: 'Error',
                    template: 'Debes actualizar por lo menos una cantidad.'
                });
            }
        };
        //Si cambia el valor comercio, busca los productos.
        $scope.$watch('comercio', function(newValue, oldvalue) {
            if(newValue && newValue.id) {
                $ionicLoading.show({
                    template: 'Cargando...'
                });
                relevadorService.getProductosComercio(newValue.id)
                    .then(function success(data){
                        $scope.listaProductos = data;
                        $ionicLoading.hide();
                    },
                    function error(response) {
                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'Error',
                            template: response.message? response.message : 'Ocurrio un error'
                        });

                    }
                )
            }
        }, true);
        $scope.$on('$ionicView.enter', function() {
            $scope.listaComercios = listaComercios.getListaComercios();
            $scope.listaProductos = [];
            if(comercioObject.isUndefined()) {
                comercioObject.setComercio($scope.listaComercios[0]);
            }
            $scope.comercio = comercioObject.getComercio();
        });

    })
/**
 * Controller global de todos los tabs.
 */
    .controller('AppController',
    function ($scope) {

    });

