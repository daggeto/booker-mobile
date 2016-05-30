class ServicePhotosService
  'use strict'

  constructor: ($cacheFactory, FileUploadService) ->
    [@cacheFactory, @FileUploadService] = arguments

    this

  save: (params) ->
    @FileUploadService.upload(params.service_id, params.photo_uri)

  delete: (id) ->
    @UserService.$r.delete(id: id).$promise

app.service('ServicePhotosService', ServicePhotosService)
