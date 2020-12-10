app.controller('DashboardController', function($scope, $routeParams, $location, $rootScope, $timeout) {

	$scope.init = function(){
		spinnerOn();
		userInit().then(function(){
			if($rootScope.user){
				retrieveMflCookies($rootScope.user.uid).then(function(){
					if($rootScope.validMflCookies()){
						mflExport("myleagues", null, $rootScope.mflCookies, "mflLeagues").then(function(){
							if($scope.mflLeagues && $scope.mflLeagues.leagues && Object.keys($scope.mflLeagues.leagues).length == 1){
								$scope.loadLeague(Object.values($scope.mflLeagues.leagues)[0]);
							}
							spinnerOff();
							applyScope();
						});
					}else{
						spinnerOff();
						applyScope();
					}
				});
			}
		});
	};

	$scope.loadLeague = function(league){
		$scope.league = league;
	};

	$scope.mflLogin = function(){
		var mflUsername = $("#mflUsername").val();
		var mflPassword = $("#mflPassword").val();

		doMflLogin(mflUsername, mflPassword).then(function(){
			$scope.init();
		});
	};

	$scope.selectLeague = function(){
		var leagueSelect = $("#leagueSelect").val();
		$scope.loadLeague($rootScope.mflLeagues.leagues[leagueSelect]);
		applyScope();
	};
});