app.directive('uploadPhoto', ->
  restrict: 'E'
  transclude: true
  scope:
    onPhotoTaken: '&onPhotoTaken'
    photo_id: '=?photoId'
  controller: 'UploadPhotoController'
  controllerAs: "vm"
  templateUrl: 'templates/components/buttons/upload_photo.html'
)
