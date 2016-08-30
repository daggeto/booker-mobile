class MainController
  constructor: ($scope, $state, $ionicSlideBoxDelegate, $q) ->
    [@scope, @state, @ionicSlideBoxDelegate, @q] = arguments

    this

  slideTo: (index) ->
    @ionicSlideBoxDelegate.slide(index)

  isCurrentSlide: (index) ->
    @ionicSlideBoxDelegate.currentIndex() == index

  isAndroid: ->
    @scope.$root.isAndroid()

app.controller('MainController', MainController)
