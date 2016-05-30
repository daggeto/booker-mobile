class ServicePhotosService
  'use strict'

  constructor: ($cacheFactory, ServicePhoto, FileUploadService) ->
    [@cacheFactory, @ServicePhoto, @FileUploadService] = arguments

    this

  save: (params) ->
    @FileUploadService.upload(params.service_id, params.photo_uri)

  delete: (id) ->
    @ServicePhoto.$r.delete(id: id).$promise

app.service('ServicePhotosService', ServicePhotosService)
