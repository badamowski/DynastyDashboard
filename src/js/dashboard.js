app.controller('DashboardController', function($scope, $routeParams, $location, $rootScope, $timeout) {

	$scope.init = function(){
		spinnerOn();
		userInit().then(function(){
			if($rootScope.user){
				retrieveMflCookies($rootScope.user.uid).then(function(){
					if($rootScope.validMflCookies()){
						mflExport("myleagues", $rootScope.mflCookies, "mflLeagues").then(function(){
							if($scope.mflLeagues && $scope.mflLeagues.leagues && Object.keys($scope.mflLeagues.leagues).length == 1){
								$scope.loadLeague(Object.values($scope.mflLeagues.leagues)[0]);
							}else{
								spinnerOff();
								applyScope();
							}
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
		$scope.leagueInfoById = {};
		$scope.leagueAssetsById = {};

		var allPromises = [];

		allPromises.push(mflExport("assets", $rootScope.mflCookies, "leagueAssets", $scope.league));
		allPromises.push(loadAllPlayers($scope.league));
		allPromises.push(mflExport("league", $rootScope.mflCookies, "leagueInfo", $scope.league));

		Promise.all(allPromises).then(function(){
			$.each($scope.leagueAssets.assets.franchise, function(index, franchise){
				$scope.leagueAssetsById[franchise.id] = franchise;
			});

			$.each($scope.leagueInfo.league.franchises.franchise, function(index, franchise){
				$scope.leagueInfoById[franchise.id] = franchise;
			});

			spinnerOff();
			applyScope();

			$.each($scope.leagueAssetsById[$scope.league.franchise_id].players.player, function(index, player){
				dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueInfo).then(function(){
					applyRootScope();
				});
			});
		});
	};

	$scope.orderFunction = function(player){
		if($rootScope.cache && $rootScope.cache.dynasty101 && $rootScope.cache.dynasty101.players && $rootScope.cache.dynasty101.players[player.id] && $rootScope.cache.dynasty101.players[player.id].value){
			return Number($rootScope.cache.dynasty101.players[player.id].value);
		}else{
			return 0;
		}
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