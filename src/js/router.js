app.config(function($routeProvider) {
  $routeProvider

  .when('/', {
    templateUrl : 'pages/dashboard.html',
    controller  : 'DashboardController'
  })

  .otherwise({redirectTo: '/'});
});