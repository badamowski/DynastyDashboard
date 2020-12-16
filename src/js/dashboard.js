app.controller('DashboardController', function($scope, $routeParams, $location, $rootScope, $timeout) {

	var initialLoad = true,
		studTiers = ["T1", "T2", "T3", "T4", "T5"];

	$scope.searchResults = [];

	$scope.init = function(){
		initialLoad = true;
		spinnerOn();
		userInit().then(function(){
			if($rootScope.user){
				retrieveMflCookies($rootScope.user.uid).then(function(){
					if($rootScope.validMflCookies()){
						mflExport("myleagues", $rootScope.mflCookies, "mflLeagues").then(function(){
							buildLeagueSelect();
							if($scope.mflLeagues && $scope.mflLeagues.leagues && Object.keys($scope.mflLeagues.leagues).length == 1){
								$("#leagueSelect").val(Object.keys($scope.mflLeagues.leagues)[0]).prop("disabled", true).trigger("change");
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
		$scope.leagueInfoByName = {};
		$scope.leagueAssetsById = {};
		$scope.playerRosterStatus = {};
		$scope.leagueStandingsById = {};
		$scope.teamRankById = {};

		var allPromises = [];

		allPromises.push(mflExport("assets", $rootScope.mflCookies, "leagueAssets", $scope.league));
		allPromises.push(loadAllPlayers($scope.league));
		allPromises.push(mflExport("league", $rootScope.mflCookies, "leagueInfo", $scope.league));
		allPromises.push(mflExport("myWatchList", $rootScope.mflCookies, "myWatchList", $scope.league));
		allPromises.push(mflExport("leagueStandings", $rootScope.mflCookies, "leagueStandings", $scope.league));

		Promise.all(allPromises).then(function(){
			$.each($scope.leagueAssets.assets.franchise, function(index, franchise){
				$scope.leagueAssetsById[franchise.id] = franchise;
			});

			$.each($scope.leagueInfo.league.franchises.franchise, function(index, franchise){
				$scope.leagueInfoById[franchise.id] = franchise;
				$scope.leagueInfoByName[franchise.name] = franchise;
			});

			$scope.leagueStandings.leagueStandings.franchise.sort(function(franchise1, franchise2){
				return parseFloat(franchise2.altpwr) - parseFloat(franchise1.altpwr);
			});

			$.each($scope.leagueStandings.leagueStandings.franchise, function(index, franchise){
				$scope.teamRankById[franchise.id] = index + 1;
				$scope.leagueStandingsById[franchise.id] = franchise;
			});

			$rootScope.pageTitle = $scope.leagueInfoById[$scope.league.franchise_id].name + " (" + $scope.leagueStandingsById[$scope.league.franchise_id].h2hw + "-" + $scope.leagueStandingsById[$scope.league.franchise_id].h2hl + "-" + $scope.leagueStandingsById[$scope.league.franchise_id].h2ht + ")";

			spinnerOff();
			applyScope();

			$.each($scope.leagueAssetsById[$scope.league.franchise_id].futureYearDraftPicks.draftPick, function(index, draftPick){
				dynasty101PickTradeValue($scope.extractYear(draftPick.description), $scope.estimatedPick(draftPick.description), $scope.leagueInfo).then(function(){
					applyRootScope();
				});
			});

			$.each($scope.leagueAssetsById[$scope.league.franchise_id].players.player, function(index, player){
				dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueInfo).then(function(){
					applyRootScope();
				});
			});

			var watchListPlayerIds = "";
			$.each($scope.myWatchList.myWatchList.player, function(index, player){
				if(!$scope.playerRosterStatus[player.id]){
					watchListPlayerIds += player.id + ",";
				}
				dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueInfo).then(function(){
					applyRootScope();
				});
			});
			if(watchListPlayerIds){
				mflExport("playerRosterStatus", $rootScope.mflCookies, "watchPlayerRosterStatus", $scope.league, "PLAYERS=" + watchListPlayerIds).then(function(){
					$.each($scope.watchPlayerRosterStatus.playerRosterStatuses.playerStatus, function(index, playerStatus){
						$scope.playerRosterStatus[playerStatus.id] = playerStatus;
					});
				});
			}else{
				applyScope();
			}

			buildPlayerSelect();
		});
	};

	$scope.orderFunction = function(player){
		if($rootScope.cache && $rootScope.cache.dynasty101 && $rootScope.cache.dynasty101.players && $rootScope.cache.dynasty101.players[player.id] && $rootScope.cache.dynasty101.players[player.id].value){
			return Number($rootScope.cache.dynasty101.players[player.id].value);
		}else{
			return 0;
		}
	};

	$scope.extractYear = function(pickDescription){
		return pickDescription.split("Year ")[1].split(" ")[0];
	};

	$scope.dynasty101PickKeyFromMFLPickDescription = function(pickDescription){
		return dynasty101PickKey($scope.extractYear(pickDescription), $scope.estimatedPick(pickDescription), $scope.leagueInfo.league.franchises.count);
	};

	$scope.estimatedPick = function(pickDescription){
		var round = $scope.extractRound(pickDescription),
			teamName = pickDescription.split("Pick from ")[1];

		if($scope.leagueInfo && $scope.leagueInfo.league && $scope.leagueInfo.league.franchises && $scope.leagueInfo.league.franchises.count && $scope.teamRankById && $scope.leagueInfoByName && $scope.leagueInfoByName[teamName] && $scope.teamRankById[$scope.leagueInfoByName[teamName].id]){
			return round + "." + ($scope.leagueInfo.league.franchises.count - ($scope.teamRankById[$scope.leagueInfoByName[teamName].id] - 1)).toString();
		}else{
			return "";
		}
	};

	$scope.mflLogin = function(){
		var mflUsername = $("#mflUsername").val();
		var mflPassword = $("#mflPassword").val();

		doMflLogin(mflUsername, mflPassword).then(function(){
			$scope.init();
		});
	};

	$scope.extractRound = function(pickDescription){
		return pickDescription.split("Round ")[1].split(" ")[0]
	};

	$scope.studsFilterFunction = function(player) {
		if($rootScope.cache && $rootScope.cache.dynasty101 && $rootScope.cache.dynasty101.players && $rootScope.cache.dynasty101.players[player.id] && $rootScope.cache.dynasty101.players[player.id].tier){
			return studTiers.includes($rootScope.cache.dynasty101.players[player.id].tier);
		} else {
			return false;
		}
	};

	$scope.stashFilterFunction = function(player) {
		return !$scope.studsFilterFunction(player);
	};

	$scope.displayPlayerRosterStatus = function(playerId){
		if($scope.playerRosterStatus && $scope.playerRosterStatus[playerId]){
			if($scope.playerRosterStatus[playerId].is_fa == "1" || $scope.playerRosterStatus[playerId].error == "NFL FA"){
				return "Free Agent";
			}else if($scope.playerRosterStatus[playerId].roster_franchise.franchise_id != $scope.league.franchise_id){
				return $scope.leagueInfoById[$scope.playerRosterStatus[playerId].roster_franchise.franchise_id].name;
			}else{
				return "";
			}
		}else{
			return "";
		}
	};

	buildLeagueSelect = function(){
		var leagueOptions = "<option></option>";

		$.each($scope.mflLeagues.leagues, function(key, value){
			leagueOptions += "<option value='" + key + "'>" + value.name + "</option>";
		});

		$("#leagueSelect").empty().html(leagueOptions);
		$("#leagueSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#leagueSelect").change(function(event){
			if(!initialLoad){
				selectLeague();
			}else{
				initialLoad = false;
			}
		});
	};

	buildPlayerSelect = function(){
		var playerOptions = "<option></option>";

		$.each($rootScope.cache.mfl.players, function(key, value){
			playerOptions += "<option value='" + key + "'>" + value.name + " " + value.position + " " + value.team + "</option>";
		});

		/*var round = 1;
		for (round = 1; round <= 5; round++) {
			var pick;
			for (pick = 1; pick <= 12; pick++) {
				var dynasty101PickName = dynasty101PickName("2021", round.toString() + "." + pick.toString(), 12);
				playerOptions += "<option value='" + dynasty101PickName.replace(" ", "") + "'>" + dynasty101PickName + "</option>";
			}
		}

		round = 1;
		for (round = 1; round <= 5; round++) {
			var earlyDynasty101PickName = dynasty101PickName("2022", round.toString() + ".1", 12),
				midDynasty101PickName = dynasty101PickName("2022", round.toString() + ".6", 12),
				lateDynasty101PickName = dynasty101PickName("2022", round.toString() + ".12", 12);
			playerOptions += "<option value='" + earlyDynasty101PickName.replace(" ", "") + "'>" + earlyDynasty101PickName + "</option>";
			playerOptions += "<option value='" + midDynasty101PickName.replace(" ", "") + "'>" + midDynasty101PickName + "</option>";
			playerOptions += "<option value='" + lateDynasty101PickName.replace(" ", "") + "'>" + lateDynasty101PickName + "</option>";
		}*/

		$("#playerSelect").empty().html(playerOptions);
		$("#playerSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#playerSelect").change(function(event){
			var value = $("#playerSelect").select2('data');
			$scope.searchResults = [];
			if(value && value.length > 0){
				var playerIdList = "";
				$.each(value, function(index, selectedPlayer){
					$scope.searchResults.push({id: selectedPlayer.id});

					if(!$scope.playerRosterStatus[selectedPlayer.id]){
						playerIdList += selectedPlayer.id + ",";
					}

					dynasty101TradeValue($rootScope.cache.mfl.players[selectedPlayer.id], $scope.leagueInfo).then(function(){
						applyRootScope();
					});
				});

				if(playerIdList){
					mflExport("playerRosterStatus", $rootScope.mflCookies, "searchPlayerRosterStatus", $scope.league, "PLAYERS=" + playerIdList).then(function(){
						if(Array.isArray($scope.searchPlayerRosterStatus.playerRosterStatuses.playerStatus)){
							$.each($scope.searchPlayerRosterStatus.playerRosterStatuses.playerStatus, function(index, playerStatus){
								$scope.playerRosterStatus[playerStatus.id] = playerStatus;
							});
						}else{
							$scope.playerRosterStatus[$scope.searchPlayerRosterStatus.playerRosterStatuses.playerStatus.id] = $scope.searchPlayerRosterStatus.playerRosterStatuses.playerStatus;
						}
						applyScope();
					});
				}else{
					applyScope();
				}
			}

			applyScope();
		});
	};

	selectLeague = function(){
		var leagueSelect = $("#leagueSelect").val();
		if(leagueSelect && $scope.mflLeagues && $scope.mflLeagues.leagues && $scope.mflLeagues.leagues[leagueSelect]){
			spinnerOn();
			$scope.loadLeague($scope.mflLeagues.leagues[leagueSelect]);
		}
	};
});