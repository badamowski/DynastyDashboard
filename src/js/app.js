var app = angular.module('dynastyDashboard', ['ngRoute', 'ui.sortable']);

var utcDateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZZ";

$.fn.modal.Constructor.prototype.enforceFocus = function() {};

var config = {
		apiKey: "AIzaSyC9Xp_f0Q5Gg02RFJ5GYsoyH0uiu7-PGXQ",
		authDomain: "dynastydashboard.firebaseapp.com",
		databaseURL: "https://dynastydashboard-default-rtdb.firebaseio.com/",
		storageBucket: "gs://dynastydashboard.appspot.com",
	},
	dynastyDashboardFirebase = firebase.initializeApp(config),
	dynastyDashboardDatabase = dynastyDashboardFirebase.database(),
	dynastyDashboardStorage = dynastyDashboardFirebase.storage(),
	provider = new firebase.auth.GoogleAuthProvider();

 app.factory('loginService', function($location, $rootScope, $route) {
    return {
        loginReload: function() {
        	if(!$rootScope.user){
		        this.loginPromise().then(function(){
		        	applyRootScope();
		        	$route.reload();
		        });
			}else{
				$route.reload();
			}
        },

        loginDashboard: function() {
        	if(!$rootScope.user){
		        this.loginPromise().then(function(){
					$location.path("/user/" + $rootScope.user.uid);
				});
			}else{
				$location.path("/user/" + $rootScope.user.uid);
			}
        },

        logout: function(){
        	firebase.auth().signOut().then(function() {
        		$rootScope.user = undefined;
        		$rootScope.$apply();
				$route.reload();
			}).catch(function(error) {
				console.error(error);
				$route.reload();
			});
        },

        loginPromise: function(){
			return new Promise(function(resolve, reject) {
				firebase.auth().signInWithPopup(provider).then(function(result) {
					$rootScope.user = result.user;
					$rootScope.$apply();
					updateUserInfo($rootScope.user).then(function(){
						resolve();
					});
				}).catch(function(error) {
					console.error(error);
					resolve();
				});
			});
		}
    };

});


app.controller('ParentController', function($scope, $location, loginService, $rootScope, $timeout, $route) {

	var newTagPrefix = "NewTag-";

	$rootScope.carUsers = {};

	$scope.init = function(){
		$rootScope.cache = {
			dynasty101: {players: {}, picks: {}},
			mfl: {players: {}}
		};
		userInit();
	};

	$scope.login = function($event){
		$event.preventDefault();
		loginService.loginReload();
	};

	$scope.loginToDashboard = function($event){
		$event.preventDefault();
		loginService.loginDashboard();
	};

	$scope.logout = function($event){
		$event.preventDefault();
		loginService.logout();
	};

	$scope.openModal = function($event, modal){
		$event.preventDefault();
		$event.stopImmediatePropagation();
		$("#" + modal).modal(true);
	};

	$scope.showBirthdate = function(datetime){
		if(datetime){
			var birthdate = moment(datetime * 1000);
			return birthdate.format("MM/DD/YYYY") + " (" + moment().diff(birthdate, "years") + ")";
		}else{
			return "";
		}
	};

	retrievePlayer = function(playerId, league){
		if($rootScope.players && $rootScope.players[playerId]){
			return $rootScope.players[playerId];
		}else{
			loadPlayers(playerId, league).then(function(){
				return $rootScope.players[playerId];
			});
		}
	};

	loadAllPlayers = function(){
		return new Promise(function(resolve, reject){
			dynastyDashboardDatabase.ref("cache/mfl/players").once("value", function(data){
				var cachedPlayerData = data.val();

				if(cachedPlayerData 
					&& cachedPlayerData.lastUpdated 
					&& isToday(cachedPlayerData.lastUpdated)){
					$rootScope.cache.mfl.players = cachedPlayerData.players;
					resolve();
				}else{
					mflExport("players", "none", "tempPlayers", undefined, "DETAILS=1").then(function(){
						if(Array.isArray($scope.tempPlayers.players.player)){
							$.each($scope.tempPlayers.players.player, function(index, player){
								$rootScope.cache.mfl.players[player.id] = player;
							});

							//Add picks to cache of players
							var round = 1;
							for (round = 1; round <= 5; round++) {
								var pick;
								for (pick = 1; pick <= 12; pick++) {
									var year = "2021",
										estimatedPick = round.toString() + "." + pick.toString();

									var pickName = dynasty101PickName(year, estimatedPick, 12),
										pickKey = dynasty101PickKey(year, estimatedPick, 12);

									$rootScope.cache.mfl.players[pickKey] = {
										id: pickKey,
										name: pickName,
										year: year,
										round: round,
										pick: estimatedPick,
										isPick: true
									};
								}
							}

							round = 1;
							for (round = 1; round <= 5; round++) {
								var year = "2022",
									earlyEstimatedPick = round.toString() + ".1",
									midEstimatedPick = round.toString() + ".6",
									lateEstimatedPick = round.toString() + ".12";

								var earlyPickKey = dynasty101PickKey(year, earlyEstimatedPick, 12),
									midPickKey = dynasty101PickKey(year, midEstimatedPick, 12),
									latePickKey = dynasty101PickKey(year, lateEstimatedPick, 12);

								var earlyPickName = dynasty101PickName(year, earlyEstimatedPick, 12),
									midPickName = dynasty101PickName(year, midEstimatedPick, 12),
									latePickName = dynasty101PickName(year, lateEstimatedPick, 12);

								$rootScope.cache.mfl.players[earlyPickKey] = {
									id: earlyPickKey,
									name: earlyPickName,
									year: year,
									round: round,
									pick: earlyEstimatedPick,
									isPick: true
								};
								$rootScope.cache.mfl.players[midPickKey] = {
									id: midPickKey,
									name: midPickName,
									year: year,
									round: round,
									pick: midEstimatedPick,
									isPick: true
								};
								$rootScope.cache.mfl.players[latePickKey] = {
									id: latePickKey,
									name: latePickName,
									year: year,
									round: round,
									pick: lateEstimatedPick,
									isPick: true
								};
							}

							var firebaseMFLPlayers = {
								players: $rootScope.cache.mfl.players,
								lastUpdated: moment().tz(moment.tz.guess()).format(utcDateFormat)
							};

							dynastyDashboardDatabase.ref("cache/mfl/players").update(firebaseMFLPlayers).then(function(){
								resolve();
							});
						}else{
							$rootScope.cache.mfl.players[$scope.tempPlayers.players.player.id] = $scope.tempPlayers.players.player;
							resolve();
						}			
					});
				}
			});
		});
	};

	dynasty101PickKey = function(year, estimatedPick, teamCount){
		var pickName = dynasty101PickName(year, estimatedPick, teamCount);
		if(pickName){
			return pickName.replaceAll(" ", "_");
		}else{
			return "";
		}
	};

	dynasty101PickName = function(year, estimatedPick, teamCount){
		if(year == "2021"){
			var splitPick = estimatedPick.split("."),
				round = parseInt(splitPick[0]),
				pick = parseInt(splitPick[1]),
				totalPick = ((round - 1) * teamCount) + pick;
			return "2021 Pick " + totalPick.toString();
		}else if(year == "2022"){
			var splitPick = estimatedPick.split("."),
				round = parseInt(splitPick[0]),
				pick = parseInt(splitPick[1]),
				pickPercentage = pick/teamCount,
				roundString, pickString;

			if(round == 1){
				roundString = "1st";
			}else if(round == 2){
				roundString = "2nd";
			}else if(round == 3){
				roundString = "3rd";
			}else{
				roundString = round.toString() + "th";
			}

			if(pickPercentage <= 0.33){
				pickString = "Early ";
			} else if(pickPercentage <= 0.66){
				pickString = "Mid ";
			} else {
				pickString = "Late ";
			}

			return "2022 " + pickString + roundString;
		}else{
			return false;
		}
	};

	isToday = function(compareDate){
		return moment(compareDate, utcDateFormat).isSame(moment(), "day")
	};

	dynasty101TradeValue = function(player, leagueSettings){
		return new Promise(function(resolve, reject){
			findDynasty101Player(player).then(function(){
				if($rootScope.cache.dynasty101.players[player.id]){
					if($rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue]
						&& $rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].value 
						&& $rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].lastUpdated
						&& isToday($rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].lastUpdated)){
						resolve();
					}else{
						var body = {
							info: $rootScope.cache.dynasty101.players[player.id].name,
							QB: leagueSettings.is2QBStringValue.split("qb_")[1]
						};

						$.ajax({
							url: "/.netlify/functions/dynasty-101-value",
							type: "POST",
							data: JSON.stringify(body),
							contentType:"application/json",
							dataType:"json",
							success: function(data){
								if(!$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue]){
									$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue] = {};
								}
								$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].value = data.value;
								$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].tier = data.tier;
								$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue].lastUpdated = moment().tz(moment.tz.guess()).format(utcDateFormat);
								dynastyDashboardDatabase.ref("cache/dynasty101/players/" + player.id).update($rootScope.cache.dynasty101.players[player.id]).then(function(){
									resolve();
								});
							}
						});
					}
				}else{
					$rootScope.cache.dynasty101.players[player.id][leagueSettings.is2QBStringValue] = {
						value: "0",
						tier: "T11"
					}
					resolve();
				}
			});
		});
	};

	findDynasty101Player = function(player){
		return new Promise(function(resolve, reject){
			if(!$rootScope.cache.dynasty101.players[player.id]){
				dynastyDashboardDatabase.ref("cache/dynasty101/players/" + player.id).once("value", function(data){
					var dynasty101Player = data.val();
					if(dynasty101Player 
						&& (!dynasty101Player.error 
							|| (dynasty101Player.lastUpdated 
								&& isToday(dynasty101Player.lastUpdated)))){
						$rootScope.cache.dynasty101.players[player.id] = dynasty101Player;
						resolve();
					}else{
						console.log(player);
						var body = {};

						if(player.isPick){
							body.entry = player.id.replaceAll("_", " ");
						}else{
							var splitPlayerName = player.name.split(",");
							body.entry = splitPlayerName[1].trim() + " " + splitPlayerName[0].trim();
						}

						$.ajax({
							url: "/.netlify/functions/dynasty-101-search",
							type: "POST",
							data: JSON.stringify(body),
							contentType:"application/json",
							dataType:"json",
							success: function(data){
								$rootScope.cache.dynasty101.players[player.id] = data;
								dynastyDashboardDatabase.ref("cache/dynasty101/players/" + player.id).update(data).then(function(){
									resolve();
								});
							}, error: function(error){
								console.error("unable to find " + player.name + " in Dynasty 101. MFL Id: " + player.id);
								console.error(error);
								$rootScope.cache.dynasty101.players[player.id] = {
									name: player.name,
									error: true,
									lastUpdated: moment().tz(moment.tz.guess()).format(utcDateFormat)
								};
								$rootScope.cache.dynasty101.players[player.id].qb_1QBValue = {
									error: true,
									lastUpdated: moment().tz(moment.tz.guess()).format(utcDateFormat),
									value: "0",
									tier: "T11"
								};
								$rootScope.cache.dynasty101.players[player.id].qb_2QBValue = {
									error: true,
									lastUpdated: moment().tz(moment.tz.guess()).format(utcDateFormat),
									value: "0",
									tier: "T11"
								};
								dynastyDashboardDatabase.ref("cache/dynasty101/players/" + player.id).update($rootScope.cache.dynasty101.players[player.id]).then(function(){
									resolve();
								});
							}
						});
					}
				});
			}else{
				resolve();
			}
		});
	};

	loadAllInjuries = function(){
		$rootScope.injuriesById = {};
		mflExport("injuries", "none", "allInjuries", $scope.league).then(function(){
			$.each($scope.allInjuries.injuries.injury, function(index, injury){
				$rootScope.injuriesById[injury.id] = injury;
			});
		});
	};

	mflExport = function(type, mflCookies, saveTo, league, otherParams, method, saveToTwo){
		return new Promise(function(resolve, reject){
			var body = {
					mflCookies: mflCookies
				},
				queryParams = "";

			if(otherParams){
				queryParams += "&" + otherParams;
			}

			if(league){
				if(league.league_id){
					queryParams += "&L=" + league.league_id;
				}
				if(league.url){
					body.hostname = league.url.substr(league.url.indexOf("://") + 3).split("/")[0];
				}
			}

			if(method){
				body.method = method;
			}

			$.ajax({
				url: "/.netlify/functions/mfl-export?TYPE=" + type + queryParams,
				type: "POST",
				data: JSON.stringify(body),
				contentType:"application/json",
				dataType:"json",
				success: function(data){
					if(saveToTwo){
						$scope[saveTo][saveToTwo] = data;
					}else{
						$scope[saveTo] = data;
					}
					resolve();
				}
			});
		});
	};

	validMflLogin = function(){
		return new Promise(function(resolve, reject){
			if($rootScope.user){
				if(!$rootScope.mflCookies){
					retrieveMflCookies($rootScope.user.uid).then(function(){
						if(!validMflCookies($rootScope.mflCookies)){
							$rootScope.mflCookies = null;
						}
						resolve();
					});
				}else {
					if(!validMflCookies($rootScope.mflCookies)){
						$rootScope.mflCookies = null;
					}
					resolve();
				}
			}else{
				resolve();
			}
		});
	};

	$rootScope.validMflCookies = function(){
		if($rootScope.mflCookies){
			var expiration = $rootScope.mflCookies[1].substring($rootScope.mflCookies[1].indexOf("expires=") + 8);
			return moment(expiration).isAfter(moment());
		}else{
			return false;
		}
	};

	$scope.mflLogin = function(){
		var mflUsername = $("#mflUsername").val();
		var mflPassword = $("#mflPassword").val();

		doMflLogin(mflUsername, mflPassword).then(function(){
			$route.reload();
		});
	};

	retrieveMflCookies = function(uid){
		return new Promise(function(resolve, reject){
			if($rootScope.mflCookies){
				resolve();
			}
			dynastyDashboardDatabase.ref("mflCookies/" + uid).once("value", function(data){
				$rootScope.mflCookies = data.val();
				resolve();
			});
		});
	};

	retrieveMfl = function(uid){
		return new Promise(function(resolve, reject){
			dynastyDashboardDatabase.ref("mfl/" + uid).once("value", function(data){
				$rootScope.mfl = data.val();
				resolve();
			});
		});
	};

	doMflLogin = function(mflUsername, mflPassword){
		return new Promise(function(resolve, reject){
			$.ajax({
				url: "/.netlify/functions/mfl-login",
				type: "POST",
				data: JSON.stringify({
					mflUsername: mflUsername,
					mflPassword: mflPassword
				}),
				contentType:"application/json",
				dataType:"json",
				success: function(data){
					$rootScope.mflCookies = data;
					updateMflCookies($rootScope.user.uid, $rootScope.mflCookies).then(function(){
						resolve();
					});
				}
			});
		});
	};

	userInit = function(){
		return new Promise(function(resolve, reject) {
			firebase.auth().onAuthStateChanged(function(var1, var2){
				if(!$rootScope.user && firebase.auth().currentUser){
					$rootScope.user = firebase.auth().currentUser;
					$rootScope.readonly = false;
					updateUserInfo($rootScope.user).then(function(){
						applyRootScope();
					});
				}
				resolve();
			});
		});
	};

	applyScope = function(){
		$timeout(function () {
		    $scope.$apply();
		}, 300);
	};

	applyRootScope = function(){
		$timeout(function () {
		    $rootScope.$apply();
		}, 300);
	};

});

updateMflCookies = function(uid, mflCookies){
	return new Promise(function(resolve, reject){
		dynastyDashboardDatabase.ref("mflCookies/" + uid).update(mflCookies).then(function(){
			resolve();
		});
	});
};

updateMfl = function(uid, mfl){
	return new Promise(function(resolve, reject){
		dynastyDashboardDatabase.ref("mflCookies/" + uid).update(mfl).then(function(){
			resolve();
		});
	});
};

updateUserInfo = function(user){
	return new Promise(function(resolve, reject){
		dynastyDashboardDatabase.ref("users/" + user.uid + "/info").update({
			displayName: user.displayName,
			email: user.email,
			photoURL: user.photoURL,
			uid: user.uid
		}).then(function(){
			resolve();
		});
	});
};

spinnerOn = function(){
	$('#cover-spin').show();
};

spinnerOff = function(){
	$('#cover-spin').hide();
};