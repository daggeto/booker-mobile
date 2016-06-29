app.directive('photosCarousel', ->
  restrict: 'E'
  scope: {}
  controller: 'PhotosCarouselController'
  controllerAs: "vm"
  bindToController:
    photos: '='
  templateUrl: 'templates/components/photos_carousel.html'
)
