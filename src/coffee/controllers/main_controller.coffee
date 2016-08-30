class MainController
  constructor: ($scope, $state, $ionicSlideBoxDelegate, $q) ->
    [@scope, @state, @ionicSlideBoxDelegate, @q] = arguments

    this

  slideTo: (index) ->
    $ionicSlideBoxDelegate.slide(index)

app.controller('MainController', MainController)
