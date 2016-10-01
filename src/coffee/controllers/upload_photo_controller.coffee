app.controller 'UploadPhotoController',
  ($scope, $ionicActionSheet, $ionicLoading, $q, CameraService, translateFilter) ->
    new class UploadPhotoController
      constructor: ->
        buttons: []

      click: =>
        $ionicActionSheet.show
          buttons:[
            { text: @cameraText(), photo_id: $scope.photo_id },
            { text: @galleryText(), photo_id: $scope.photo_id }
          ]
          titleText: translateFilter('upload_photo.actions.title')
          cancelText: translateFilter('close')
          buttonClicked: @buttonClicked

      cameraText: ->
        text = translateFilter('upload_photo.actions.camera')

        text = "<i class=\"icon ion-camera\"></i> #{text}"  if ionic.Platform.isAndroid()

        text

      galleryText: ->
        text = translateFilter('upload_photo.actions.gallery')

        text = "<i class=\"icon ion-images\"></i> #{text}"  if ionic.Platform.isAndroid()

        text

      buttonClicked: (index, button) =>
        switch index
          when 0 then @takePhoto(button.photo_id)
          when 1 then @selectPhoto(button.photo_id)

        true

      takePhoto: (photo_id) ->
        @promisePhoto(Camera.PictureSourceType.CAMERA, photo_id)
          .then($scope.onPhotoTaken, @error)

      selectPhoto: (photo_id) ->
        @promisePhoto(Camera.PictureSourceType.PHOTOLIBRARY, photo_id)
          .then($scope.onPhotoTaken, @error)

      promisePhoto: (method, photo_id) ->
        $ionicLoading.show()
        $q((resolve, reject) =>
          CameraService.takePhoto(method).then( (photo_uri) =>
            resolve(
              response:
                photo_uri: photo_uri
                photo_id: photo_id
                afterPhotoUpload: @afterPhotoUpload
            )
          ).catch( (error) ->
            reject(error)
          )
        )

      error: =>
        $ionicLoading.hide()

      afterPhotoUpload: =>
        CameraService.cleanup()
        $ionicLoading.hide()
