class CameraService
  'use strict'

  constructor: ($cordovaCamera) ->
    @cordovaCamera = $cordovaCamera

  takePhoto: ->
    @loadPhoto(Camera.PictureSourceType.CAMERA)

  selectPhoto: ->
    @loadPhoto(Camera.PictureSourceType.PHOTOLIBRARY)

  loadPhoto: (sourceType) ->
    options = {
      quality: 50
      destinationType: Camera.DestinationType.FILE_URI
      sourceType: sourceType
      encodingType: Camera.EncodingType.JPEG
      popoverOptions: CameraPopoverOptions
      saveToPhotoAlbum: false
      correctOrientation: true
    }

    @cordovaCamera.getPicture(options)

app.service('CameraService', CameraService)
