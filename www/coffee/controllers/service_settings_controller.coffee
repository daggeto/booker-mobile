class ServiceSettingsController
  constructor:( $scope,
                $state,
                $stateParams,
                $ionicPopup,
                $q,
                service,
                UserServicesService,
                ServicePhotosService,
                CameraService,
                $window) ->
    [
      @scope,
      @state,
      @stateParams,
      @ionicPopup,
      @q,
      @service,
      @UserServicesService,
      @ServicePhotosService,
      @CameraService,
      @window
    ] = arguments

    @scope.vm = this

    this

  durations: [
      { value: 15, label: '15 min' }
      { value: 30, label: '30 min' }
      { value: 45, label: '45 min' }
      { value: 60, label: '60 min' }
  ]

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
    @ServicePhotosService.delete(id).then(@reloadPage, @error)

  takePhoto: (photo_id)->
    @promisePhoto(Camera.PictureSourceType.CAMERA, photo_id).then(@photoTaken, @error)

  selectPhoto: (photo_id)->
    @promisePhoto(Camera.PictureSourceType.PHOTOLIBRARY, photo_id).then(@photoTaken, @error)

  promisePhoto: (method, photo_id) ->
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
    @UserServicesService.service_photos(service_id: @service.id).then (service_photos) =>
      @service.service_photos = service_photos

  progress: (progress) ->

  reloadPage: ->
    @window.location.reload(true)

  error: (error) ->
    alert(error.body)

  save: ->
    @UserServicesService.update(@service).then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) -> console.log('rejected'))

  showIosSaveButton: ->
    @scope.ios && @state.is('service.service_settings')

  showAddPhoto: ->
    @service.service_photos.length < 5

  back: ->
    @state.go('app.main')

app.controller('ServiceSettingsController', ServiceSettingsController)
