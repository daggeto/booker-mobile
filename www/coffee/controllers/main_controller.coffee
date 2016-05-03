app.controller('MainController', ($scope, $state, $ionicPopup, $ionicSlideBoxDelegate, AuthService, AUTH_EVENTS) ->
  $scope.username = AuthService.username()

  $scope.android = ionic.Platform.isAndroid()
  $scope.ios = ionic.Platform.isIOS()

  $scope.$on(AUTH_EVENTS.notAuthorized, (event) ->
    alertPopup = $ionicPopup.alert(
      title: 'Unauthorized!'
      template: 'You are not allowed to access this resource.')
	)

  $scope.$on(AUTH_EVENTS.notAuthenticated, (event) ->
    AuthService.logout()
    $state.go('login')
    alertPopup = $ionicPopup.alert(
      title: 'Session Lost!'
      template: 'Sorry, You have to login again.')
	)

  $scope.setCurrentUsername = (name) ->
    $scope.username = name

  $scope.slideTo = (index) ->
    $ionicSlideBoxDelegate.slide(index)

  $scope.goTo = (view) ->
    $state.go(view)

  $scope.goToMain = ->
    $state.go('app.main')
)
