app.controller 'MainController', ($scope, $ionicSlideBoxDelegate) ->
  new class MainController
    switchSlide: ->
      to = 1 - @currentIndex()

      $ionicSlideBoxDelegate.slide(to)

    isCurrentSlide: (index) ->
     @currentIndex() == index

    isAndroid: ->
      $scope.$root.isAndroid()

    currentIndex: ->
      $ionicSlideBoxDelegate.currentIndex()
