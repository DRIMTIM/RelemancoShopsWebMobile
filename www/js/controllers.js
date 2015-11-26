angular.module('app.controllers', [])

    .controller('LoginController', function ($scope, $state, $localstorage, $rootScope, authService) {
        $scope.user =  {};
        $scope.errors = [];
        $scope.doLogin = function () {
            authService.doLogin($scope.user).then(
                function success() {
                    $state.go('app.home');
                },
                function error(error) {
                    $scope.errors = [];
                    $scope.errors.push(error);
                });
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

    function ($scope, $ionicPopup, $ionicLoading, geoLocationService, $localstorage, listaComercios, uiGmapIsReady, $ionicModal, comercioObject, $state, relevadorService) {
        $scope.map = {center: {latitude: 45, longitude: -73}, zoom: 13, control: {}};
        $scope.comerciosMarkers = listaComercios.getAllMarkers();
        $ionicLoading.show({
            template: 'Cargando...'
        });

        $ionicModal.fromTemplateUrl('templates/modals/menumarker.html', {
            scope: $scope,
            animation: 'slide-in-up',
            backdropClickToClose: true
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };

        $scope.refreshRutas = function() {
            $ionicLoading.show({
                template: 'Refrescando rutas...'
            });
            relevadorService.getComercios()
                .then(function success(data){
                    listaComercios.setListaComercios(data);
                    $scope.comerciosMarkers = listaComercios.getAllMarkers();
                    geoLocationService.createRoutes($scope.comerciosMarkers, $scope.map);
                    $ionicLoading.hide();
                },
                function error(response) {
                    $ionicLoading.hide();
                    listaComercios.setListaComercios([]);
                    $ionicPopup.alert({
                        title: 'Error',
                        template: 'Ocurrio un error al actualizar las rutas.'
                    });
                }
            )
        };

        geoLocationService.setCurrentLocation($scope, $ionicLoading);

        uiGmapIsReady.promise(1).then(function(){
            geoLocationService.createRoutes($scope.comerciosMarkers, $scope.map);
        });

        $scope.markersEvents = {
            click: function (gMarker, eventName, model) {
                $scope.currentMarker = model.coords;
                $scope.openModal();
            }
        };

        $scope.goActualizarStock = function(){
            var comercio = listaComercios.findComercio($scope.currentMarker.id);
            comercioObject.setComercio(comercio);
            $scope.modal.hide().then(function(){
                $state.go('app.stock')
            });
        };

        $scope.goTomarPedido = function(){
            var comercio = listaComercios.findComercio($scope.currentMarker.id);
            comercioObject.setComercio(comercio);
            $scope.modal.hide().then(function(){
                $state.go('app.pedidos')
            });
        };
    })

    .controller('StockController', function ($scope, comercioObject, relevadorService, $ionicPopup, listaComercios, $ionicLoading, $state) {

        $scope.comercio = { };

        $scope.actualizarStock = function() {

            var request =  {};
            request.listaProductos = [];
            request.idComercio = $scope.comercio.id;

            $scope.listaProductos.forEach(function(value) {
                if(value.stock) {
                    request.listaProductos.push(value);
                }
            });

            if(request.listaProductos.length > 0) {
                relevadorService.actualizarStock(request)
                    .then(function success(){
                        $ionicPopup.alert({
                            title: 'Operacion exitosa',
                            template: 'Se ha actualizo el stock correctamente.'
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
                    template: 'Debes actualizar por lo menos un stock.'
                });
            }
        };

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
        };

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
        };
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
    function ($scope, $state, authService) {
        $scope.logout = function() {
            authService.logout();
            $state.go('login');
        };
    });

