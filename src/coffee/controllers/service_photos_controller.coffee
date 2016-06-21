class ServicePhotosController
  constructor:( $scope,
                $state,
                $stateParams,
                $ionicPopup,
                $q,
                $ionicSlideBoxDelegate,
                $window,
                $ionicLoading,
                UserServicesService,
                ServicePhotosService,
                CameraService,
                service) ->
    [
      @scope,
      @state,
      @stateParams,
      @ionicPopup,
      @q,
      @ionicSlideBoxDelegate,
      @window,
      @ionicLoading,
      @UserServicesService,
      @ServicePhotosService,
      @CameraService,
      @service
    ] = arguments

    @scope.vm = this

    this

  addNewPhoto: ->
    @showTakePhotoPopup()

  showTakePhotoPopup: (photo_id) ->
    @scope.photo_id = photo_id

    @takePhotoPopup = @ionicPopup.show(
      title: 'Select method'
      templateUrl: 'templates/service/upload_photo_popup.html'
      scope: @scope
      buttons: [
        { text: 'Cancel' }
      ]
    )

  deletePhoto: (id)->
    @ServicePhotosService.delete(id).then(@reloadPhotos, @error)

  takePhoto: (photo_id)->
    @promisePhoto(Camera.PictureSourceType.CAMERA, photo_id).then(@photoTaken, @error)

  selectPhoto: (photo_id)->
    @promisePhoto(Camera.PictureSourceType.PHOTOLIBRARY, photo_id).then(@photoTaken, @error)

  promisePhoto: (method, photo_id) ->
    @ionicLoading.show()
    @takePhotoPopup.close()
    @q((resolve, reject) =>
      @CameraService.takePhoto(method).then( (photo_uri) =>
        resolve(photo_uri: photo_uri, photo_id: photo_id)
      , (error) ->
        reject(error)
      )
    )

  photoTaken: (response) =>
    if response.photo_id
      @ServicePhotosService
        .update(
          service_id: @stateParams.id,
          photo_id: response.photo_id,
          photo_uri: response.photo_uri
        ).then(@photoUploaded, @error, @progress)
    else
      @ServicePhotosService
        .save(service_id: @stateParams.id, photo_uri: response.photo_uri)
        .then(@photoUploaded, @error, @progress)

  photoUploaded: (data) =>
    @takePhotoPopup.close()
    @CameraService.cleanup()
    @reloadPhotos()
    @ionicLoading.hide()

  progress: (progress) ->

  reloadPhotos: =>
    @UserServicesService.service_photos(service_id: @service.id).then (service_photos) =>
      @service.service_photos = service_photos
      @ionicSlideBoxDelegate.update()

  showAddPhoto: ->
    @service.service_photos.length < 5

  error: (error) =>
    @ionicLoading.hide()
    alert(error.body)

app.controller('ServicePhotosController', ServicePhotosController)
