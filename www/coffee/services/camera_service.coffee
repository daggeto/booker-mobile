class CameraService
  'use strict'

  constructor: ($cordovaCamera) ->
    @cordovaCamera = $cordovaCamera

  capturePhoto: ->
    @takePhoto(Camera.PictureSourceType.CAMERA)

  selectPhoto: ->
    @takePhoto(Camera.PictureSourceType.PHOTOLIBRARY)

  takePhoto: (sourceType) ->
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
