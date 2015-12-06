angular.module('app.controllers', [])

    .controller('LoginController', function ($scope, $state, $localstorage, $rootScope, authService, $ionicHistory) {
        $scope.user =  { userName:'admin', password: 'admin1234'};
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
        };
        $scope.$on('$ionicView.enter', function () {
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
        });
    })

    .controller('HomeController',
    function ($rootScope, $scope, $ionicLoading, relevadorService, $localstorage) {

        var user = $localstorage.getObject($rootScope.USER_INDEX);

        $scope.idRelevador = user.id;

        $scope.selectedComercio = {};
        $scope.chartComercios = {
            data: [],
            labels: []
        };

        $scope.$on('$ionicView.enter', function () {
            $scope.tieneProductos = true;
            relevadorService.getProductosMasVendidosPorComercio($scope.idRelevador).then(
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
                    else {
                        $scope.tieneProductos = false;
                    }
                }
            );
        });
    })

    .controller('RutasController',

    function ($rootScope, $scope, $ionicPopup, $ionicLoading, geoLocationService, $localstorage, listaComercios,
              uiGmapIsReady, $ionicModal, comercioObject, $state, relevadorService, authService, $interval)
    {

        $scope.map = {center: {latitude: -34.917606, longitude: -56.161835}, zoom: 13, control: {}};

        $scope.$on($rootScope.BROADCAST_CAMBIO_CENTRO, function(event,args){
           $scope.map.center = {latitude: args.comercio.localizacion.latitud , longitude: args.comercio.localizacion.longitud};
        });

        $scope.$on('REFRESH_RUTAS', function(event, args) {
            $scope.refreshRutas();
        });

        $scope.$on($rootScope.BROADCAST_IR_MI_LOCALIZACION, function(){
            $ionicLoading.show({
                template: 'Cargando...'
            });
            geoLocationService.setCurrentLocation($scope, $ionicLoading);
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

        $scope.comerciosMarkers = listaComercios.getAllMarkers();

        var usuario = authService.getUser();
        if(angular.isObject(usuario.localizacion)) {
            if(usuario.localizacion.latitud && usuario.localizacion.longitud) {
                $scope.homeMarker = {
                    id: usuario.localizacion.id,
                    title: 'Mi casa',
                    latitude: Number(usuario.localizacion.latitud),
                    longitude: Number(usuario.localizacion.longitud),
                    showWindow: false,
                    options: {
                        icon: {
                            url: 'img/home.png',
                            label: 'Mi casita',
                            clickable: true
                        }
                    }
                };
            }
        }

        //$interval(function($scope){
        //    geoLocationService.setMarkerUserLocation($scope)
        //        .then(function(val){
        //            $scope.userMarker = val;
        //        });
        //}, 10000);

        $scope.refreshRutas = function() {
            $ionicLoading.show({
                template: 'Refrescando rutas...'
            });
            relevadorService.getComercios()
                .then(function success(data){
                    listaComercios.setListaComercios(data);
                    $scope.comerciosMarkers = listaComercios.getAllMarkers();
                    geoLocationService.clearRoutes($scope.map);
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
        $scope.$on('$ionicView.enter', function() {
            uiGmapIsReady.promise(1).then(function(){
                var comercio = comercioObject.getComercio();
                if(angular.isDefined(comercio) && comercio.id) {
                    $scope.map.center = {latitude: comercio.localizacion.latitud, longitude: comercio.localizacion.longitud};
                }
                geoLocationService.clearRoutes($scope.map);
                geoLocationService.createRoutes($scope.comerciosMarkers, $scope.map);
            });
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

    .controller('StockController', function ($scope, comercioObject, relevadorService, $ionicPopup, listaComercios, $ionicLoading, $state, $timeout, authService) {

        $scope.comercio = { };

        $scope.actualizarStock = function() {

            var productos = [];
            var userId = authService.getUser().id;
            var idComercio = $scope.comercio.id;

            $scope.listaProductos.forEach(function(value) {
                if(value.cantidad) {
                    productos.push({
                        id: value.id,
                        cantidad: value.cantidad
                    });
                }
            });
            //dRelevador, idComercio, productos
            if(productos.length > 0) {
                relevadorService.actualizarStock(userId, idComercio, productos)
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

            comercioObject.setComercio(comercio);

            $ionicLoading.show({
                template: 'Cargando...'
            });
            relevadorService.getProductosComercio(comercio.id)
                .then(function success(data){
                    $scope.listaProductos = [];
                    $ionicLoading.hide();
                    $timeout(function() {
                        $scope.listaProductos = data;
                    }, 700);
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
            $scope.comercio  = comercioObject.getComercio();
            if(comercioObject.isUndefined() && $scope.listaComercios.length > 0) {
                comercioObject.setComercio($scope.listaComercios[0]);
            }
            if($scope.listaComercios.length > 0) {
                $scope.comercio  = comercioObject.getComercio();
                $scope.updateListaProductos($scope.comercio);
            }
        });

    })

    .controller('PedidosController', function ($scope, comercioObject, relevadorService, $ionicPopup, $ionicLoading, listaComercios, $state, authService, $timeout) {
        $scope.comercio = { };
        $scope.updateComercio = function(comercio) {
            $scope.comercio = comercio;
            comercioObject.setComercio(comercio);
        };
        $scope.tomarPedido = function() {

            var request =  {};
            var user = authService.getUser();

            request.productos = [];
            request.id_comercio = $scope.comercio.id;
            request.id_relevador = user.id;

            $scope.listaProductos.forEach(function(value) {
                if(value.cantidad && value.cantidad > 0) {
                    request.productos.push({
                        id: value.id,
                        cantidad: value.cantidad
                    });
                }
            });

            if(request.productos.length > 0) {
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
                        $scope.listaProductos = [];
                        $ionicLoading.hide();
                        $timeout(
                            function(){
                                $scope.listaProductos = data;
                            }, 700);
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
            if(comercioObject.isUndefined() && $scope.listaComercios.length > 0) {
                $scope.listaProductos = [];
                comercioObject.setComercio($scope.listaComercios[0]);
            }
            if($scope.listaComercios.length > 0) {
                $scope.comercio = comercioObject.getComercio();
            }
        });

    })
/**
 * Controller global de todos los tabs.
 */
    .controller('AppController',
    function ($scope, $state, authService, $rootScope) {
        $scope.logout = function() {
            authService.logout();
            $state.go('login');
        };
        $scope.listaComercios = [];

        $scope.dispararCentroMapa = function(comercio) {
            if(angular.isObject(comercio)){
                $rootScope.$broadcast($rootScope.BROADCAST_CAMBIO_CENTRO, {comercio:comercio});
                if($state.current !== 'app.mapa') {
                    $state.go('app.mapa');
                }
            }
        };

        $scope.dispararIrMiLocalizacion = function() {
            $rootScope.$broadcast($rootScope.BROADCAST_IR_MI_LOCALIZACION);
            if($state.current !== 'app.mapa') {
                $state.go('app.mapa');
            }
        };
        $rootScope.$on($rootScope.BROADCAST_COMERCIOS, function(event, args){
            $scope.listaComercios = args.listaComercios;
        });
    })

    .controller('HistoricoController', function($scope, relevadorService, authService, geoLocationService) {
        $scope.map = {center: {latitude: -34.921337, longitude: -56.161663}, zoom: 16, control: {}, options: {disableDefaultUI:true}};
        $scope.markers = [];
        $scope.rutas = [];

        $scope.dibujarRuta = function(ruta){
            geoLocationService.clearRoutes($scope.map);
            $scope.markers = [];
            ruta.comercios.forEach(function(val){
                $scope.markers.push({
                    id: val.id,
                    title: val.nombre,
                    latitude: Number(val.localizacion.latitud),
                    longitude: Number(val.localizacion.longitud),
                    options: {
                        icon: {
                            url: 'img/icon.png'
                        }
                    }
                });
            });
            geoLocationService.createRoutes($scope.markers, $scope.map);
        };

        var user = authService.getUser();
        $scope.$on('$ionicView.enter', function () {
            relevadorService.obtenerHistoricoRutas(user.id).then(
                function success(data){
                    $scope.rutas = data;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                },
                function error(){
                    $ionicPopup.alert({
                        title: 'Error',
                        template: 'Ocurrio un error al obtener las rutas.'
                    });
                });
        });

    })
    .controller('TerminarRutaController', function($rootScope, $scope, relevadorService, authService, listaComercios, $state, $ionicPopup) {
        $scope.estados = [];
        $scope.errors = [];
        $scope.checkEvent = function(estado) {
            $scope.estados.forEach(function(val){
                if(estado.id !== val.id) {
                    val.isChecked = false;
                }
            });
        };

        $scope.actualizarEstado = function() {

            if($scope.comercios.length == 0)
                return;

            var estadoActualizar = null;
            for(var i = 0; i < $scope.estados.length ; i++) {
                var current = $scope.estados[i];
                if(current.isChecked === true) {
                    estadoActualizar = current;
                    break;
                }
            }

            if(estadoActualizar == null) {
                $scope.errors = [];
                $scope.errors.push('Debes seleccionar un estado.')
            }
            else {
                var ruta = listaComercios.getRuta();
                ruta.estado = {
                    id: estadoActualizar.id,
                    nombre: estadoActualizar.nombre
                };
                relevadorService.relevarRuta(ruta).then(
                    function success(){
                        $ionicPopup.alert({
                            title: 'Operacion exitosa',
                            template: 'Se ha actualizo la ruta correctamente.'
                        }).then(function(){
                            $state.go('app.mapa').then(function(){
                                $rootScope.$broadcast('REFRESH_RUTAS');
                            });
                        });
                    },
                    function error(error){
                        $scope.errors = [];
                        $scope.errors.push(error);
                    }
                )
            }

        };

        $scope.$on('$ionicView.enter', function () {
            $scope.comercios = listaComercios.getListaComercios();
            if($scope.comercios.length == 0){
                $scope.tieneComercios = false;
                $scope.errors = [];
                $scope.errors.push('No tienes rutas asignadas');
            }
            else {
                $scope.tieneComercios = true;
            }
            if($scope.estados.length === 0) {
                relevadorService.getEstadosRuta().then(
                    function success(data){
                        if(data.length > 0){
                            $scope.estados = data;
                            $scope.estados[2].isChecked = true;
                        }
                    },
                    function error(error){
                        $scope.errors = [];
                        $scope.errors.push(error);
                    }
                );
            }
        });
    });


