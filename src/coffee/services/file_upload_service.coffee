class FileUploadService
  'use strict'

  constructor: ($cordovaFileTransfer, $auth, $q) ->

    [@cordovaFileTransfer, @auth, @q] = arguments

    this

  upload: (method, upload_path, file_uri) ->
    fileTransfer = @cordovaFileTransfer.upload(
      upload_path,
      file_uri,
      httpMethod: method,
      headers:  @auth.retrieveData('auth_headers')
     )

    @d = @q.defer()
    fileTransfer.then(@success).catch(@error)

    @d.promise

  success: (data) =>
    @d.resolve(angular.fromJson(data.response))

  error: (data) =>
    @d.reject(data)

app.service('FileUploadService', FileUploadService)
