app.controller 'MainController', (
  $rootScope,
  $scope,
  $ionicSlideBoxDelegate,
  UsersService,
  currentUser,
  EVENTS
) ->
  new class MainController
    constructor: ->
      $rootScope.currentUser = currentUser

      $rootScope.$on EVENTS.UPDATE_CURRENT_USER, @refreshCurrentUser

    refreshCurrentUser: ->
      UsersService.current().then (response) ->
        $rootScope.currentUser = response

    switchSlide: ->
      to = 1 - @currentIndex()

      $ionicSlideBoxDelegate.slide(to)

    isCurrentSlide: (index) ->
     @currentIndex() == index

    isAndroid: ->
      $scope.$root.isAndroid()

    currentIndex: ->
      $ionicSlideBoxDelegate.currentIndex()
