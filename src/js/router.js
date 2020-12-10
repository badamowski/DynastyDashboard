app.config(function($routeProvider) {
  $routeProvider

  .when('/', {
    templateUrl : 'pages/home.html',
    controller  : 'HomeController'
  })

  .when('/dashboard', {
    templateUrl : 'pages/dashboard.html',
    controller  : 'DashboardController'
  })

  .otherwise({redirectTo: '/'});
});