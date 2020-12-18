app.controller('DashboardController', function($scope, $routeParams, $location, $rootScope, $timeout) {

	var initialLoad = true,
		studTiers = ["T1", "T2", "T3", "T4", "T5"];

	$scope.searchResults = [];
	$scope.playerSearchExpanded = false;
	$scope.watchListExpanded = false;
	$scope.otherTeamsExpanded = false;

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
								loadNonLoggedInView();
							}
						});
					}else{
						loadNonLoggedInView();
					}
				});
			}else{
				loadNonLoggedInView();
			}
		});
	};

	loadNonLoggedInView = function(){
		loadAllPlayers().then(function(){
			$scope.playerSearchExpanded = true;
			$scope.leftSelectedPlayers = [];
			$scope.rightSelectedPlayers = [];
			$scope.leagueInfo = {
				league: {
					franchises: {
						count: 12
					},
					starters: {
						position: [
							{
								name: "QB",
								limit: "1"
							}
						]
					}
				}
			};

			buildPlayerSelect("");
			buildPlayerSelect("left");
			spinnerOff();
			applyScope();
		});	
	};

	$scope.loadLeague = function(league){
		$scope.league = league;
		$scope.leagueInfoById = {};
		$scope.leagueInfoByName = {};
		$scope.leagueAssetsById = {};
		$scope.fullAssetListById = {};
		$scope.leagueStandingsById = {};
		$scope.teamRankById = {};
		$scope.projectedScoresById = {};
		$scope.franchiseIdByAssetId = {};
		$scope.franchisePickByPickId = {}
		$scope.leftSelectedPlayers = [];
		$scope.rightSelectedPlayers = [];

		var allPromises = [];

		loadAllInjuries();
		
		allPromises.push(mflExport("assets", $rootScope.mflCookies, "leagueAssets", $scope.league));
		allPromises.push(loadAllPlayers($scope.league));
		allPromises.push(mflExport("league", $rootScope.mflCookies, "leagueInfo", $scope.league));
		allPromises.push(mflExport("myWatchList", $rootScope.mflCookies, "myWatchList", $scope.league));
		allPromises.push(mflExport("leagueStandings", $rootScope.mflCookies, "leagueStandings", $scope.league));
		allPromises.push(mflExport("projectedScores", $rootScope.mflCookies, "projectedScores", $scope.league));

		Promise.all(allPromises).then(function(){
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

			$.each($scope.leagueAssets.assets.franchise, function(index, franchise){
				$.each(franchise.futureYearDraftPicks.draftPick, function(pickIndex, draftPick){
					var pickId = $scope.dynasty101PickKeyFromMFLPickDescription(draftPick.description);
					franchise.futureYearDraftPicks.draftPick[pickIndex].isPick = true;
					franchise.futureYearDraftPicks.draftPick[pickIndex].id = pickId;
					$scope.franchisePickByPickId[pickId] = franchise.futureYearDraftPicks.draftPick[pickIndex];
					$scope.franchiseIdByAssetId[pickId] = franchise.id;
				});

				$.each(franchise.players.player, function(playerIndex, player){
					$scope.franchiseIdByAssetId[player.id] = franchise.id;
				});

				$scope.leagueAssetsById[franchise.id] = franchise;
				$scope.fullAssetListById[franchise.id] = _.union(franchise.players.player, franchise.futureYearDraftPicks.draftPick);
			});

			$.each($scope.projectedScores.projectedScores.playerScore, function(index, playerProjectedScore){
				$scope.projectedScoresById[playerProjectedScore.id] = playerProjectedScore;
			});

			$rootScope.pageTitle = $scope.leagueInfoById[$scope.league.franchise_id].name + " (" + $scope.leagueStandingsById[$scope.league.franchise_id].h2hw + "-" + $scope.leagueStandingsById[$scope.league.franchise_id].h2hl + "-" + $scope.leagueStandingsById[$scope.league.franchise_id].h2ht + ")";

			spinnerOff();
			applyScope();

			loadFranchise($scope.league.franchise_id);

			loadWatchList();
			buildPlayerSelect("");
			buildOtherTeamSelect();
		});
	};

	$scope.showPlayerSearch = function(hasMFLUser){
		if(hasMFLUser){
			return "collapse";
		}else{
			return "";
		}
	};

	$scope.orderFunction = function(asset){
		if(asset.isPick){
			if($rootScope.cache && $rootScope.cache.dynasty101 && $rootScope.cache.dynasty101.picks && $rootScope.cache.dynasty101.picks[asset.id] && $rootScope.cache.dynasty101.picks[asset.id].value){
				return Number($rootScope.cache.dynasty101.picks[asset.id].value);
			}else{
				return 0;
			}
		}else{
			if($rootScope.cache && $rootScope.cache.dynasty101 && $rootScope.cache.dynasty101.players && $rootScope.cache.dynasty101.players[asset.id] && $rootScope.cache.dynasty101.players[asset.id].value){
				return Number($rootScope.cache.dynasty101.players[asset.id].value);
			}else{
				return 0;
			}
		}
	};

	$scope.extractYear = function(pickDescription){
		if(pickDescription){
			return pickDescription.split("Year ")[1].split(" ")[0];
		}else{
			return "";
		}
	};

	$scope.dynasty101PickKeyFromMFLPickDescription = function(pickDescription){
		return dynasty101PickKey($scope.extractYear(pickDescription), $scope.estimatedPick(pickDescription), $scope.leagueInfo.league.franchises.count);
	};

	$scope.extractTeam = function(pickDescription){
		if(pickDescription){
			return pickDescription.split("Pick from ")[1];
		}else{
			return "";
		}
	};

	$scope.estimatedPick = function(pickDescription){
		var round = $scope.extractRound(pickDescription),
			teamName = $scope.extractTeam(pickDescription);

		if($scope.leagueInfo && $scope.leagueInfo.league && $scope.leagueInfo.league.franchises && $scope.leagueInfo.league.franchises.count && $scope.teamRankById && $scope.leagueInfoByName && $scope.leagueInfoByName[teamName] && $scope.teamRankById[$scope.leagueInfoByName[teamName].id]){
			return round + "." + ($scope.leagueInfo.league.franchises.count - ($scope.teamRankById[$scope.leagueInfoByName[teamName].id] - 1)).toString();
		}else{
			return "";
		}
	};

	$scope.displayProjectedScore = function(projectedScore){
		if(projectedScore){
			return projectedScore;
		}else{
			return "0";
		}
	};

	$scope.extractRound = function(pickDescription){
		if(pickDescription){
			return pickDescription.split("Round ")[1].split(" ")[0]
		}else{
			return "";
		}
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
		if(!$scope.league){
			return "";
		}
		if($scope.franchiseIdByAssetId && $scope.franchiseIdByAssetId[playerId]){
			return $scope.leagueInfoById[$scope.franchiseIdByAssetId[playerId]].name;
		}else{
			return "Free Agent";
		}
	};

	$scope.isSelectedAsset = function(asset, type){
		if(asset && asset.id){
			if($scope.canUnSelectAsset(asset, type)){
				return "selected-lap";
			}
		}
		return "";
	};

	$scope.canSelectAsset = function(asset, type){
		return !_.contains(justPlayerIds($scope[selectList(type)]), asset.id);
	};

	$scope.canUnSelectAsset = function(asset, type){
		return _.contains(justPlayerIds($scope[selectList(type)]), asset.id);
	};

	$scope.selectAssetKebab = function(asset, $event, id, type) {
		$event.preventDefault();
		$event.stopImmediatePropagation();
		toggleKebab(id);

		var existingIndex = selectedPlayerIndex(asset, selectList(type));
		if(existingIndex >= 0){
			$scope[selectList(type)].splice(existingIndex, 1);
		}else{
			$scope[selectList(type)].push(asset);
		}
		applyScope();
	};

	$scope.openDropdown = function($event, id){
		$event.preventDefault();
		$event.stopImmediatePropagation();
		toggleKebab(id);
	};

	$scope.leftValueSum = function(){
		return sumValues($scope.leftSelectedPlayers);
	};

	$scope.rightValueSum = function(){
		return sumValues($scope.rightSelectedPlayers);
	};

	$scope.leftProjectedSum = function(){
		return sumProjected($scope.leftSelectedPlayers);
	};

	$scope.rightProjectedSum = function(){
		return sumProjected($scope.rightSelectedPlayers);
	};

	$scope.leftTitle = function(){
		return determineTitle(true, $scope.leftSelectedPlayers);
	};

	$scope.rightTitle = function(){
		return determineTitle(false, $scope.rightSelectedPlayers);
	};

	$scope.shouldDisplayPlayerRosterStatus = function(assetId, type){
		if(type.indexOf("left") >= 0 || type == "other"){
			return false;
		}else if(type.indexOf("right") >= 0){
			var rightTitle = $scope.rightTitle();
			return rightTitle == "Warning: Comparing combination of players across teams/waivers";
		}else{
			return true;
		}
	};

	determineTitle = function(isLeft, selectAssetList){
		if($scope.user && $scope.league && selectAssetList && selectAssetList.length > 0){
			if(isLeft){
				return $scope.leagueInfoById[$scope.league.franchise_id].name;
			}else{
				var name;
				$.each(selectAssetList, function(index, asset){
					var thisName = $scope.displayPlayerRosterStatus(asset.id);
					if(!name){
						name = thisName;
					} else if(name != thisName){
						name = "Warning: Comparing combination of players across teams/waivers";
					}
				});
				return name;
			}
		}
		return "";
	};

	sumProjected = function(selectAssetList){
		var totalValue = 0;
		$.each(selectAssetList, function(index, asset){
			if(!asset.isPick && $scope.projectedScoresById && $scope.projectedScoresById[asset.id]){
				totalValue += parseFloat($scope.displayProjectedScore($scope.projectedScoresById[asset.id].score));
			}
		});
		return totalValue.toFixed(2);
	};

	sumValues = function(selectAssetList){
		var totalValue = 0;
		$.each(selectAssetList, function(index, asset){
			if(asset.isPick){
				totalValue += parseInt($rootScope.cache.dynasty101.picks[asset.id].value);
			}else{
				totalValue += parseInt($rootScope.cache.dynasty101.players[asset.id].value);
			}
		});
		return totalValue;
	};

	selectList = function(type){
		if(type.indexOf("left") >= 0){
			return "leftSelectedPlayers";
		}else{
			return "rightSelectedPlayers";
		}
	};

	selectPickList = function(type){
		if(type.indexOf("left") >= 0){
			return "leftSelectedPicks";
		}else{
			return "rightSelectedPicks";
		}
	};

	selectedPickIndex = function(draftPick, selectList){
		var selectedIndex = -1;
		$.each($scope[selectList], function(index, selectedDraftpick){
			if(draftPick.description && selectedDraftpick.description == draftPick.description){
				selectedIndex = index;
			}
		});
		return selectedIndex;
	}

	selectedPlayerIndex = function(player, selectList){
		var selectedIndex = -1;
		$.each($scope[selectList], function(index, selectedPlayer){
			if(player.id && selectedPlayer.id == player.id){
				selectedIndex = index;
			}
		});
		return selectedIndex;
	}

	justPickDescriptions = function(pickList){
		return _.map(pickList, function(pick){
			return pick.description;
		});
	};

	justPlayerIds = function(playerList){
		return _.map(playerList, function(player){
			return player.id;
		});
	};

	toggleKebab = function(id){
		$('#' + id).dropdown('toggle');
	};

	loadWatchList = function(){
		$.each($scope.myWatchList.myWatchList.player, function(index, player){
			dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueInfo).then(function(){
				applyRootScope();
			});
		});
		applyScope();
	};

	loadFranchise = function(franchiseId){
		$.each($scope.leagueAssetsById[franchiseId].futureYearDraftPicks.draftPick, function(index, draftPick){
			dynasty101PickTradeValue($scope.extractYear(draftPick.description), $scope.estimatedPick(draftPick.description), $scope.leagueInfo).then(function(){
				applyRootScope();
			});
		});

		$.each($scope.leagueAssetsById[franchiseId].players.player, function(index, player){
			dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueInfo).then(function(){
				applyRootScope();
			});
		});
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

	buildOtherTeamSelect = function(){
		var teamOptions = "<option></option>";

		$.each($scope.leagueInfo.league.franchises.franchise, function(index, franchise){	
			if(franchise.id != $scope.league.franchise_id){
				teamOptions += "<option value='" + franchise.id + "'>" + franchise.name + "</option>";
			}
		});

		$("#otherTeamSelect").empty().html(teamOptions);
		$("#otherTeamSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#otherTeamSelect").change(function(event){
			var value = $("#otherTeamSelect").select2('data');
			$scope.searchResults = [];
			if(value && value.length > 0){
				$scope.compareOtherTeamId = value[0].id;
				loadFranchise(value[0].id);
			}else{
				$scope.compareOtherTeamId = undefined;
			}
			applyScope();
		});
	};

	buildPlayerSelect = function(append){
		var playerOptions = "<option></option>";

		$.each($rootScope.cache.mfl.players, function(key, value){
			if(value.isPick){
				playerOptions += "<option value='" + key + "'>" + value.name + "</option>";
			}else{
				playerOptions += "<option value='" + key + "'>" + value.name + " " + value.position + " " + value.team + "</option>";
			}
		});

		$("#" + append + "playerSelect").empty().html(playerOptions);
		$("#" + append + "playerSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#" + append + "playerSelect").change(function(event){
			var value = $("#" + append + "playerSelect").select2('data');
			$scope[append + "searchResults"] = [];
			if(value && value.length > 0){
				$.each(value, function(index, selectedPlayer){
					var selectedAsset = $rootScope.cache.mfl.players[selectedPlayer.id];
					if(selectedAsset.isPick){
						if($scope.franchisePickByPickId && $scope.franchisePickByPickId[selectedAsset.id]){
							$scope[append + "searchResults"].push($scope.franchisePickByPickId[selectedAsset.id]);
							dynasty101PickTradeValue($scope.extractYear($scope.franchisePickByPickId[selectedAsset.id].description), $scope.estimatedPick($scope.franchisePickByPickId[selectedAsset.id].description), $scope.leagueInfo).then(function(){
								applyRootScope();
							});
						}else{
							$scope[append + "searchResults"].push(selectedAsset);
							dynasty101PickTradeValue(selectedAsset.year, selectedAsset.pick, $scope.leagueInfo).then(function(){
								applyRootScope();
							});
						}
					}else{
						$scope[append + "searchResults"].push(selectedAsset);
						dynasty101TradeValue($rootScope.cache.mfl.players[selectedAsset.id], $scope.leagueInfo).then(function(){
							applyRootScope();
						});
					}
				});
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