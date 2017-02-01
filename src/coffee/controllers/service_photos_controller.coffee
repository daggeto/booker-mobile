app.controller 'ServicePhotosController',
  (
    $scope,
    $stateParams,
    $ionicSlideBoxDelegate,
    UserServicesService,
    ServicePhotosService,
    service
  ) ->
    new class ServicePhotosController
      constructor: ->
        @service = service

      onPhotoTaken: (response) ->
        @superAfterUpload = response.afterPhotoUpload
        return @updatePhoto(response) if response.photo_id

        @savePhoto(response)

      savePhoto: (data) ->
        ServicePhotosService
          .save(service_id: $stateParams.id, photo_uri: data.photo_uri)
          .then(@afterUpload, @error)

      updatePhoto: (data) =>
        ServicePhotosService
          .update(
            service_id: $stateParams.id,
            photo_id: data.photo_id,
            photo_uri: data.photo_uri
          ).then(@afterUpload, @error)

      afterUpload: =>
        @reloadPhotos()
        @superAfterUpload()

      reloadPhotos: =>
        UserServicesService.service_photos(service_id: service.id).then (service_photos) =>
          service.service_photos = service_photos
          $ionicSlideBoxDelegate.update()

      deletePhoto: (id)->
        ServicePhotosService.delete(id).then(@reloadPhotos, @error)

      error: (error) =>
        $scope.error(error)

        @superAfterUpload()

      showAddPhoto: ->
        service.service_photos.length < 5

      onImageClick: ->
        @imageClicked = !@imageClicked

      clickedClass: (clazz)->
        return "#{clazz}__clicked" if @imageClicked
