class SideController
  constructor: ($scope, $state, $ionicSlideBoxDelegate, currentUser) ->
    @page= 'Side'

    @scope = $scope
    @state = $state
    @ionicSlideBoxDelegate = $ionicSlideBoxDelegate

    @currentUser = currentUser

    this

  slideTo: (index, view) ->
    @ionicSlideBoxDelegate.slide(index)
    @state.go(view, {movieid: 1});

app.controller('SideController', SideController)
