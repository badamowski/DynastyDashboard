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

	$scope.loadPlayer = function(playerId){
		/*if($rootScope.players[playerId]){
			return $rootScope.players[playerId];
		}else{
			mflExport
		}*/
	};

	$scope.loadLeague = function(league){
		$scope.league = league;
		mflExport("assets", $scope.league.league_id, "leagueAssets").then(function(){
			$.each($scope.leagueAssets.assets.franchise, function(franchise){
				if(franchise.id == $scope.league.franchise_id){
					$scope.assets = franchise;
				}
			});

			/*var listOfPlayers = "";
			$.each($scope.assets.players.player, function(player){
				listOfPlayers += player.id + ","
			});
			mflExport("players", 24385)*/
		});
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