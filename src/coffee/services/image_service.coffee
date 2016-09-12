app.factory 'ImageService', (FileUploadService, $cacheFactory) ->
  new class ImageService
    save: (path, image_uri) ->
      FileUploadService.upload('POST', path, image_uri)

    update: (path, image_uri) ->
      FileUploadService.upload('PUT', path, image_uri)
