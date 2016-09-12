app.controller 'MainController', ($scope, $ionicSlideBoxDelegate) ->
  new class MainController
    slideTo: (index) ->
      $ionicSlideBoxDelegate.slide(index)

    isCurrentSlide: (index) ->
      $ionicSlideBoxDelegate.currentIndex() == index

    isAndroid: ->
      $scope.$root.isAndroid()
