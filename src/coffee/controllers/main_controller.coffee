app.controller('MainController', ($scope, $state, $ionicSlideBoxDelegate) ->
  $scope.android = ionic.Platform.isAndroid()
  $scope.ios = ionic.Platform.isIOS()

  $scope.setCurrentUsername = (name) ->
    $scope.username = name

  $scope.slideTo = (index) ->
    $ionicSlideBoxDelegate.slide(index)

  $scope.goTo = (view) ->
    $state.go(view)

  $scope.goToMain = ->
    $state.go('app.main')
)
