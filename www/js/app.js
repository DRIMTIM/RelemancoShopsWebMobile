// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.services', 'uiGmapgoogle-maps', 'chart.js'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {

        $httpProvider.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8';
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';

        $stateProvider

            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginController'
            })

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppController'
            })
            .state('app.home', {
                url: '/home',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/home.html',
                        controller: 'HomeController'
                    }
                },
                onEnter: function (listaComercios, relevadorService) {
                    relevadorService.getComercios()
                        .then(function success(data) {
                            listaComercios.setListaComercios(data);
                        },
                        function error(response) {
                            listaComercios.setListaComercios([]);
                        }
                    )
                }

            })
            .state('app.mapa', {
                url: '/mapa',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/mapa.html',
                        controller: 'RutasController'
                    }
                }
            })
            .state('app.pedidos', {
                url: '/pedidos',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/pedidos.html',
                        controller: 'PedidosController'
                    }
                }
            })
            .state('app.stock', {
                url: '/stock',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/stock.html',
                        controller: 'StockController'
                    }
                }
            });

        $urlRouterProvider.otherwise('/login');
    })
    .run(function ($rootScope) {

        //Broadcasts
        $rootScope.BROADCAST_COMERCIOS = 'comercios-update';
        $rootScope.BROADCAST_CAMBIO_CENTRO = 'comercios-centro';
        $rootScope.BROADCAST_IR_MI_LOCALIZACION = 'mi-localizacion';
        //Cookie Indexes
        $rootScope.USER_INDEX = 'RMW_LOGGED_USER';
        //$rootScope.BACKEND_ENDPOINT = 'http://localhost/RelemancoShopsWeb/api/web/v1/';
        //URLS BAKCEND
        $rootScope.BACKEND_ENDPOINT = 'http://demo2039282.mockable.io/';
        $rootScope.BACKEND_ENDPOINT_PROD = 'http://192.168.0.102/RelemancoShopsWeb/api/web/v1/';
    });
