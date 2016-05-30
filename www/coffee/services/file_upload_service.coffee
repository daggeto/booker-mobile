class FileUploadService
  'use strict'

  constructor: ($cordovaFileTransfer, $http, API_URL) ->
    @cordovaFileTransfer = $cordovaFileTransfer
    @API_URL = API_URL

    @options = {
      'X-User-Token': $http.defaults.headers.common['X-User-Token']
      'X-User-Email': $http.defaults.headers.common['X-User-Email']
    }

    this

  upload: (service_id, file_uri) ->
    path = @upload_path(service_id)

    @cordovaFileTransfer.upload(path, file_uri, headers:  @options)

  upload_path: (service_id) ->
    "#{@API_URL}/api/v1/services/#{service_id}/service_photos.json"


app.service('FileUploadService', FileUploadService)
