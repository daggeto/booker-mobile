class FileUploadService
  'use strict'

  constructor: ($cordovaFileTransfer, $http) ->
    @cordovaFileTransfer = $cordovaFileTransfer

    @header = {
      'X-User-Token': $http.defaults.headers.common['X-User-Token']
      'X-User-Email': $http.defaults.headers.common['X-User-Email']
    }

    this

  upload: (method, upload_path, file_uri) ->
    @cordovaFileTransfer.upload(upload_path, file_uri, httpMethod: method, headers:  @header)


app.service('FileUploadService', FileUploadService)
