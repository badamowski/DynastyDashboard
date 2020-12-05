app.config(function($routeProvider) {
  $routeProvider

  .when('/', {
    templateUrl : 'pages/home.html',
    controller  : 'HomeController'
  })

  .when('/user/:uid', {
    templateUrl : 'pages/dashboard.html',
    controller  : 'DashboardController'
  })

  .otherwise({redirectTo: '/'});
});