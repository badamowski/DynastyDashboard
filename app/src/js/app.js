var app = angular.module('dynastyDashboard', ['ngRoute']);

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


app.controller('ParentController', function($scope, $location, loginService, $rootScope, $timeout) {

	var newTagPrefix = "NewTag-";

	$rootScope.carUsers = {};

	$scope.init = function(){
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

app.controller('HomeController', function($scope, $rootScope, $timeout) {

	$scope.init = function(){
		
	};
});


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