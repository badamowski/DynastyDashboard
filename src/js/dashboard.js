app.controller('DashboardController', function($scope, $routeParams, $location, $rootScope, $timeout) {

	var qbSelectOptions = [
		{id: "qb_1QBValue", text: "1 QB"},
		{id: "qb_2QBValue", text: "2 QB (Superflex)"}
	], groupBySelectOptions = [
		{id: "dynasty-tier", text: "Dynasty Tier"},
		{id: "position", text: "Position"},
		{id: "projected", text: "Projected Score"}
	];

	$scope.searchResults = [];
	$scope.playerSearchExpanded = false;
	$scope.watchListExpanded = false;
	$scope.otherTeamsExpanded = false;
	$scope.groupBy = "dynasty-tier";
	$scope.dynastyTierGroups = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "Other"];
	$scope.positionGroups = ["QB", "RB", "WR", "TE", "Def", "PK", "Other", "Pick"];
	$scope.projectedGroups = ["20+", "10+", ">0", "0"]

	$scope.init = function(){
		spinnerOn();
		buildSortSelect();
		userInit().then(function(){
			if($rootScope.user){
				retrieveMflCookies($rootScope.user.uid).then(function(){
					if($rootScope.validMflCookies()){
						mflExport("myleagues", $rootScope.mflCookies, "mflLeagues").then(function(){
							if($scope.mflLeagues && $scope.mflLeagues.leagues && Object.keys($scope.mflLeagues.leagues).length == 1){
								var onlyLeague = Object.values($scope.mflLeagues.leagues)[0];
								buildLeagueSelect(onlyLeague, true);
								$scope.loadLeague(onlyLeague);
							}else{
								buildLeagueSelect();
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
		$scope.league = undefined;
		$scope.leagueSettings = {
			franchiseCount: 12,
			is2QBStringValue: "qb_1QBValue"
		};

		buildQBSelect($scope.leagueSettings.is2QBStringValue, false);

		loadAllInjuries();
		loadAllPlayers().then(function(){
			$scope.playerSearchExpanded = true;
			$scope.leftSelectedPlayers = [];
			$scope.rightSelectedPlayers = [];

			buildPlayerSelect("");
			buildPlayerSelect("left");
			spinnerOff();
			applyScope();
		});	
	};

	$scope.getGroups = function(){
		if($scope.groupBy == "dynasty-tier"){
			return $scope.dynastyTierGroups;
		}else if($scope.groupBy == "position"){
			return $scope.positionGroups;
		}else if($scope.groupBy == "projected"){
			return $scope.projectedGroups;
		}

		return [];
	};

	$scope.loadLeague = function(league){
		$scope.league = league;
		$scope.leagueInfoById = {};
		$scope.leagueInfoByName = {};
		$scope.leagueAssetsById = {};
		$scope.fullAssetListById = {};
		$scope.leagueStandingsById = {};
		$scope.projectedScoresById = {};
		$scope.franchiseIdByAssetId = {};
		$scope.franchisePickByPickId = {}
		$scope.leftSelectedPlayers = [];
		$scope.rightSelectedPlayers = [];

		var allPromises = [];

		loadAllInjuries();
		
		allPromises.push(mflExport("assets", $rootScope.mflCookies, "leagueAssets", $scope.league));
		allPromises.push(loadAllPlayers());
		allPromises.push(mflExport("league", $rootScope.mflCookies, "leagueInfo", $scope.league));
		allPromises.push(mflExport("myWatchList", $rootScope.mflCookies, "myWatchList", $scope.league));
		allPromises.push(mflExport("leagueStandings", $rootScope.mflCookies, "leagueStandings", $scope.league));
		allPromises.push(mflExport("projectedScores", $rootScope.mflCookies, "projectedScores", $scope.league));

		Promise.all(allPromises).then(function(){

			$scope.leagueSettings = {
				franchiseCount: 12,
				is2QBStringValue: determine2QbStringValue($scope.leagueInfo)
			};

			buildQBSelect($scope.leagueSettings.is2QBStringValue, true);

			if($scope.leagueInfo && $scope.leagueInfo.league && $scope.leagueInfo.league.franchises && $scope.leagueInfo.league.franchises.count){
				$scope.leagueSettings.franchiseCount = $scope.leagueInfo.league.franchises.count;
			}

			$.each($scope.leagueInfo.league.franchises.franchise, function(index, franchise){
				$scope.leagueInfoById[franchise.id] = franchise;
				$scope.leagueInfoByName[franchise.name] = franchise;
			});

			$scope.leagueStandings.leagueStandings.franchise.sort(function(franchise1, franchise2){
				return parseFloat(franchise1.altpwr) - parseFloat(franchise2.altpwr);
			});

			populateLeagueStandings();
			populateFranchiseAssets();

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

	$scope.sortableOptions = {
		stop: function() {
			populateLeagueStandings();
			populateFranchiseAssets();
			recalculateValues(true);
		}
	};

	$scope.showPlayerSearch = function(hasMFLUser){
		if(hasMFLUser){
			return "collapse";
		}else{
			return "";
		}
	};

	populateLeagueStandings = function(){
		$.each($scope.leagueStandings.leagueStandings.franchise, function(index, franchise){
			$scope.leagueStandings.leagueStandings.franchise[index].pick = index + 1
			$scope.leagueStandings.leagueStandings.franchise[index].rank = $scope.leagueSettings.franchiseCount - index;
			$scope.leagueStandingsById[franchise.id] = $scope.leagueStandings.leagueStandings.franchise[index];
		});
	};

	populateFranchiseAssets = function(){
		$.each($scope.leagueAssets.assets.franchise, function(index, franchise){
			$.each(franchise.futureYearDraftPicks.draftPick, function(pickIndex, draftPick){
				var pickId = $scope.dynasty101PickKeyFromMFLPickDescription(draftPick.description);
				franchise.futureYearDraftPicks.draftPick[pickIndex].isPick = true;
				franchise.futureYearDraftPicks.draftPick[pickIndex].id = pickId;
				franchise.futureYearDraftPicks.draftPick[pickIndex].year = $scope.extractYear(draftPick.description);
				franchise.futureYearDraftPicks.draftPick[pickIndex].round = $scope.extractRound(draftPick.description);
				$scope.franchisePickByPickId[pickId] = franchise.futureYearDraftPicks.draftPick[pickIndex];
				$scope.franchiseIdByAssetId[pickId] = franchise.id;
			});

			$.each(franchise.players.player, function(playerIndex, player){
				$scope.franchiseIdByAssetId[player.id] = franchise.id;
			});

			$scope.leagueAssetsById[franchise.id] = franchise;
			$scope.fullAssetListById[franchise.id] = _.union(franchise.players.player, franchise.futureYearDraftPicks.draftPick);
		});
	};

	determine2QbStringValue = function(leagueInfo){
		var twoQb = "qb_1QBValue";
		if(leagueInfo && leagueInfo.league && leagueInfo.league.starters && leagueInfo.league.starters.position){
			$.each(leagueInfo.league.starters.position, function(index, position){
				if(position.name == "QB" && position.limit == "1-2"){
					twoQb = "qb_2QBValue";
				}
			});
		}
		return twoQb;
	};

	$scope.orderFunction = function(asset){
		if($scope.groupBy == "projected"){
			return $scope.getProjectedScore(asset);
		}else{
			return $scope.getDynasty101ValueForAsset(asset);
		}
	};

	$scope.getDynasty101ValueForAsset = function(asset){
		if(asset && $scope.leagueSettings && $scope.leagueSettings.is2QBStringValue){
			if($rootScope.cache 
				&& $rootScope.cache.dynasty101 
				&& $rootScope.cache.dynasty101.players 
				&& $rootScope.cache.dynasty101.players[asset.id] 
				&& $rootScope.cache.dynasty101.players[asset.id][$scope.leagueSettings.is2QBStringValue]
				&& $rootScope.cache.dynasty101.players[asset.id][$scope.leagueSettings.is2QBStringValue].value){
				return Number($rootScope.cache.dynasty101.players[asset.id][$scope.leagueSettings.is2QBStringValue].value);
			}
		}
		return 0;
	};

	$scope.extractYear = function(pickDescription){
		if(pickDescription){
			return pickDescription.split("Year ")[1].split(" ")[0];
		}else{
			return "";
		}
	};

	$scope.getTierForAsset = function(asset){
		if(asset){
			if($rootScope.cache.dynasty101.players[asset.id] && $rootScope.cache.dynasty101.players[asset.id][$scope.leagueSettings.is2QBStringValue]){
				return $rootScope.cache.dynasty101.players[asset.id][$scope.leagueSettings.is2QBStringValue].tier;
			}
		}
		
		return "";
	};

	$scope.dynasty101PickKeyFromMFLPickDescription = function(pickDescription){
		if($scope.leagueInfo && $scope.leagueInfo.league && $scope.leagueInfo.league.franchises && $scope.leagueInfo.league.franchises.count){
			return dynasty101PickKey($scope.extractYear(pickDescription), $scope.estimatedPickFromDescription(pickDescription), $scope.leagueInfo.league.franchises.count);
		}
	};

	$scope.extractTeam = function(asset){
		if(asset && asset.isPick && $scope.league){
			if(asset.description){
				return $scope.extractTeamFromDescription(asset.description);
			}else if($scope.franchisePickByPickId[asset.id] && $scope.franchisePickByPickId[asset.id].description){
				return $scope.extractTeamFromDescription($scope.franchisePickByPickId[asset.id].description);
			}
		}
		return "";
	};

	$scope.extractTeamFromDescription = function(pickDescription){
		if(pickDescription){
			return pickDescription.split("Pick from ")[1];
		}else{
			return "";
		}
	};

	$scope.estimatedPickFromDescription = function(pickDescription){
		var round = $scope.extractRound(pickDescription),
			teamName = $scope.extractTeamFromDescription(pickDescription);

		if($scope.leagueInfo 
			&& $scope.leagueInfo.league 
			&& $scope.leagueInfo.league.franchises 
			&& $scope.leagueInfo.league.franchises.count 
			&& $scope.leagueStandingsById 
			&& $scope.leagueInfoByName 
			&& $scope.leagueInfoByName[teamName] 
			&& $scope.leagueStandingsById[$scope.leagueInfoByName[teamName].id]
			&& $scope.leagueStandingsById[$scope.leagueInfoByName[teamName].id].pick){
			return round + "." + $scope.leagueStandingsById[$scope.leagueInfoByName[teamName].id].pick;
		}else{
			return "";
		}
	};

	$scope.estimatedPick = function(asset){
		if(asset && asset.isPick){
			if($scope.league && $scope.franchisePickByPickId[asset.id] && $scope.franchisePickByPickId[asset.id].description){
				return $scope.estimatedPickFromDescription($scope.franchisePickByPickId[asset.id].description);
			}

			if(asset.pick){
				return asset.pick;
			}
		}
		return "";
	};

	$scope.orderByFranchisePick = function(franchise){
		if(franchise && franchise.pick){
			return franchise.pick;
		}
		return 0;
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

	$scope.groupHasAssets = function(assets, group){
		return assets && group && $scope.filterAssetsByGroup(assets, group).length > 0;
	};

	$scope.filterAssetsByGroup = function(assets, group){
		return _.filter(assets, function(asset){
			return filterAssetsByGroupFilterFunction(asset, group);
		});
	};

	filterAssetsByGroupFilterFunction = function(asset, group){
		if($scope.groupBy == "dynasty-tier" && asset && group){
			var tier = $scope.getTierForAsset(asset);
			if(group == "Other"){
				return !tier || !_.contains($scope.dynastyTierGroups, tier);
			}else{
				return group == tier;
			}
		}else if($scope.groupBy == "position" && asset && group){
			if(group == "Other"){
				return !asset.isPick && !_.contains($scope.positionGroups, $scope.cache.mfl.players[asset.id].position);
			}else if(group == "Pick"){
				return asset.isPick;
			}else{
				return !asset.isPick && group == $scope.cache.mfl.players[asset.id].position;
			}
		}else if($scope.groupBy == "projected" && asset && group){
			var projectedScore = $scope.getProjectedScore(asset);

			if(group == "20+"){
				return projectedScore >= 20;
			}else if(group == "10+"){
				return projectedScore >= 10 && projectedScore < 20;
			}else if(group == ">0"){
				return projectedScore > 0 && projectedScore < 10;
			}else {
				return projectedScore <= 0;
			}
		}else{
			return true;
		}
	};

	$scope.getProjectedScore = function(asset){
		var projectedScore = 0;
		if($scope.projectedScoresById && $scope.projectedScoresById[asset.id] && $scope.projectedScoresById[asset.id].score){
			projectedScore = $scope.projectedScoresById[asset.id].score;
		}
		return Number(projectedScore);
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
			totalValue += $scope.getProjectedScore(asset);
		});
		return totalValue.toFixed(2);
	};

	sumValues = function(selectAssetList){
		var totalValue = 0;
		$.each(selectAssetList, function(index, asset){
			totalValue += $scope.getDynasty101ValueForAsset(asset);
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
			dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueSettings).then(function(){
				applyRootScope();
			});
		});
		applyScope();
	};

	loadFranchise = function(franchiseId){
		$.each($scope.leagueAssetsById[franchiseId].futureYearDraftPicks.draftPick, function(index, draftPick){
			dynasty101TradeValue(draftPick, $scope.leagueSettings).then(function(){
				applyRootScope();
			});
		});

		$.each($scope.leagueAssetsById[franchiseId].players.player, function(index, player){
			dynasty101TradeValue($rootScope.cache.mfl.players[player.id], $scope.leagueSettings).then(function(){
				applyRootScope();
			});
		});
	};

	buildLeagueSelect = function(league, disabled){
		var leagueOptions = "<option></option>";

		$.each($scope.mflLeagues.leagues, function(key, value){
			leagueOptions += "<option value='" + key + "'";
			if(league && league.league_id == value.league_id){
				leagueOptions += " selected='selected'";
			}
			leagueOptions += ">" + value.name + "</option>";
		});

		$("#leagueSelect").empty().html(leagueOptions);
		$("#leagueSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#leagueSelect").prop("disabled", disabled);

		$("#leagueSelect").change(function(event){
			var leagueSelect = $("#leagueSelect").val();
			spinnerOn();
			if(leagueSelect && $scope.mflLeagues && $scope.mflLeagues.leagues && $scope.mflLeagues.leagues[leagueSelect]){
				$scope.loadLeague($scope.mflLeagues.leagues[leagueSelect]);
			}else{
				loadNonLoggedInView();
			}
		});
	};

	buildSortSelect = function(){
		var sortOptions = ""; 
		
		$.each(groupBySelectOptions, function(index, groupBySelectOption){
			sortOptions += "<option value='" + groupBySelectOption.id + "'";
			if($scope.groupBy == groupBySelectOption.id){
				sortOptions += " selected='selected'";
			}
			sortOptions += ">" + groupBySelectOption.text + "</option>";
		});

		$("#sortSelect").empty().html(sortOptions);
		$("#sortSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#sortSelect").change(function(event){
			var value = $("#sortSelect").val();
			if(value){
				$scope.groupBy = value;
			}
			applyScope();
		});
	};

	buildQBSelect = function(selectedValue, disabled){
		var qbOptions = "";

		$.each(qbSelectOptions, function(index, qbSelectOption){
			qbOptions += "<option value='" + qbSelectOption.id + "'";
			if(selectedValue == qbSelectOption.id){
				qbOptions += " selected='selected'";
			}
			qbOptions += ">" + qbSelectOption.text + "</option>";
		});

		$("#qbSelect").empty().html(qbOptions);
		$("#qbSelect").select2({
			allowClear: true,
			theme: "material"
		});

		$("#qbSelect").prop("disabled", disabled);

		$("#qbSelect").change(function(event){
			var value = $("#qbSelect").val();
			$scope.leagueSettings.is2QBStringValue = value;
			recalculateValues();
		});
	};

	recalculateValues = function(picksOnly){
		var assetsToUpdate = _.union($scope.leftSelectedPlayers, $scope.rightSelectedPlayers, $scope.searchResults);

		if($scope.league){
			assetsToUpdate = _.union(assetsToUpdate, $scope.fullAssetListById[$scope.league.franchise_id]);
			if($scope.myWatchList && $scope.myWatchList.myWatchList && $scope.myWatchList.myWatchList.player){
				assetsToUpdate = _.union(assetsToUpdate, $scope.myWatchList.myWatchList.player);
			}
			if($scope.compareOtherTeamId){
				assetsToUpdate = _.union(assetsToUpdate, $scope.fullAssetListById[$scope.compareOtherTeamId]);
			}
		}else{
			assetsToUpdate = _.union(assetsToUpdate, $scope.leftsearchResults);
		}

		$.each(assetsToUpdate, function(index, asset){
			if(!picksOnly || asset.isPick){
				dynasty101TradeValue(asset, $scope.leagueSettings).then(function(){
					applyRootScope();
				});
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
					$scope[append + "searchResults"].push(selectedAsset);
					dynasty101TradeValue(selectedAsset, $scope.leagueSettings).then(function(){
						applyRootScope();
					});
				});
			}

			applyScope();
		});
	};
});