angular.module('app.controllers', [])


    .controller('LoginController', function ($scope, $state) {
        $scope.doLogin = function () {
            $state.go('app.home');
        }
    })

    .controller('HomeController',

    function ($scope, $ionicLoading, geoLocationService, $localstorage) {

        $scope.$on('$ionicView.enter', function () {
            // code to run each time view is entered
            var ruta = $localstorage.get('ruta');
            if (ruta && ruta.isInit == true) {
                $scope.rutaInicia = true;
                $scope.map = {center: {latitude: 45, longitude: -73}, zoom: 26};
                $ionicLoading.show({
                    template: 'Cargando...'
                });
                geoLocationService.setCurrentLocation($scope, $ionicLoading);
            }
        });

    })

    .controller('RutasController',

    function ($scope, $ionicLoading, geoLocationService, $localstorage) {
        $scope.map = {center: {latitude: 45, longitude: -73}, zoom: 13};
        $ionicLoading.show({
            template: 'Cargando...'
        });

        geoLocationService.setCurrentLocation($scope, $ionicLoading);

        $scope.initRuta = function () {
            ruta = {};
            ruta.isInit = true;
            $localstorage.setObject('ruta', ruta);
        }
    })

    .controller('StockController', function ($scope, comercioObject, relevadorService, $ionicPopup) {

        $scope.$on('$ionicView.enter', function() {

            $scope.comercio  = comercioObject.getComercio();
            $scope.listaProductos = [];

            relevadorService.getProductosComercio(comercio.id)
                .then(function success(response){
                    $scope.listaProductos = response.listaProductos;
                },
                function error(response) {
                    $ionicPopup.alert({
                        title: 'Error',
                        template: response.message? response.message : 'Ocurrio un error'
                    });
                }
            )
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
        }
        //Si cambia el valor comercio, busca los productos.
        $scope.$watch('comercio', function(newValue, oldvalue) {
            if(newValue && newValue.id) {
                $ionicLoading.show({
                    template: 'Cargando...'
                });
                relevadorService.getProductosComercio(newValue.id)
                    .then(function success(response){
                        $scope.listaProductos = response.listaProductos;
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

    })