angular.module('app.controllers', [])


    .controller('LoginController', function($scope, $state){
      $scope.doLogin = function() {
        $state.go('app.home');
      }
    })

    .controller('HomeController',

    function($scope, $ionicLoading, GeoLocationService, $localstorage){

      $scope.$on('$ionicView.enter', function() {
        // code to run each time view is entered
        var ruta = $localstorage.get('ruta');
        console.log("ENTRE HHOME");
        if(ruta && ruta.isInit == true) {
          $scope.rutaInicia = true;
          $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 26 };
          $ionicLoading.show({
            template: 'Cargando...'
          });
          GeoLocationService.setCurrentLocation($scope, $ionicLoading);
        }
      });

    })

    .controller('RutasController',

    function($scope, $ionicLoading, GeoLocationService, $localstorage) {
      $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 13 };
      $ionicLoading.show({
        template: 'Cargando...'
      });

      GeoLocationService.setCurrentLocation($scope, $ionicLoading);

      $scope.initRuta = function() {
        ruta = { };
        ruta.isInit = true;
        $localstorage.set('ruta', ruta);

      }
    })

    .controller('StockPedidosController', function($scope) {
      $scope.settings = {
        enableFriends: true
      };
    })

    .controller('PedidosController', function($scope) {

    })
/**
 * Controller global de todos los tabs.
 */
    .controller('AppController',

    function($scope) {

    })