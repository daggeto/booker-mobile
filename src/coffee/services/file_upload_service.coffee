class FileUploadService
  'use strict'

  constructor: ($cordovaFileTransfer, $auth) ->

    [@cordovaFileTransfer, @auth] = arguments

    this

  upload: (method, upload_path, file_uri) ->
    @cordovaFileTransfer.upload(
      upload_path,
      file_uri,
      httpMethod: method,
      headers:  @auth.retrieveData('auth_headers')
     )

app.service('FileUploadService', FileUploadService)
