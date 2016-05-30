class ServiceSettingsController
  constructor:( $scope,
                $state,
                $stateParams,
                $ionicPopup,
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

  takePhoto: (index)->
    @CameraService.takePhoto().then(@photoTaken, @error)

  selectPhoto: (index)->
    @CameraService.selectPhoto().then(@photoTaken, @error)

  deletePhoto: (index)->
    alert(index)

  photoTaken: (photo_uri) =>
    @ServicePhotosService.save({ service_id: @stateParams.id, photo_uri: photo_uri })
      .then(@photoUploaded, @error, @progress)

  photoUploaded: (data) =>
    @takePhotoPopup.close()
    @window.location.reload(true)

  progress: (progress) ->

  error: (error) ->
    alert(error.body)

  save: ->
    @UserServicesService.update(@service).then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) -> console.log('rejected'))

  showIosSaveButton: ->
    @scope.ios && @state.is('service.service_settings')

  showAddPhoto: ->
    @service.service_photos.length <= 5

  back: ->
    @state.go('app.main')

app.controller('ServiceSettingsController', ServiceSettingsController)
