class SideController
  constructor: ($scope, $state, $ionicSlideBoxDelegate) ->
    @page= 'Side'

    @scope = $scope
    @state = $state
    @ionicSlideBoxDelegate = $ionicSlideBoxDelegate

    this

  slideTo: (index, view) ->
    @ionicSlideBoxDelegate.slide(index)
    @state.go(view, {movieid: 1});

app.controller('SideController', SideController)
