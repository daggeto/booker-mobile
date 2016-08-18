class ImageService
  'use strict'

  constructor: ($cacheFactory, FileUploadService) ->
    [@cacheFactory, @FileUploadService] = arguments

    this

  save: (path, image_uri) ->
    @FileUploadService.upload('POST', path, image_uri)

  update: (path, image_uri) ->
    @FileUploadService.upload('PUT', path, image_uri)

app.service('ImageService', ImageService)
