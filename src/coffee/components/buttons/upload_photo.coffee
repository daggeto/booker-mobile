app.directive('uploadPhoto', ->
  restrict: 'E'
  transclude: true
  scope:
    onPhotoTaken: '&onPhotoTaken'
  controller: 'UploadPhotoController'
  controllerAs: "vm"
  templateUrl: 'templates/components/buttons/upload_photo.html'
)
