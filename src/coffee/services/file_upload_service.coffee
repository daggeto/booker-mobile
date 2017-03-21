app.factory 'FileUploadService', ($window, $cordovaFileTransfer, $q, TokenService, AuthWrapper) ->
  new class FileUploadService
    upload: (method, upload_path, file_uri) ->
      AuthWrapper.wrap =>
        @run(method, upload_path, file_uri)

    run: (method, upload_path, file_uri) ->
      auth_header = JSON.parse(TokenService.getTokenFromLocalStorage())

      fileTransfer = $cordovaFileTransfer.upload(
        upload_path,
        file_uri,
        httpMethod: method,
        headers: auth_header
       )

      @d = $q.defer()
      fileTransfer.then(@success).catch(@error)

      @d.promise

    success: (data) =>
      @d.resolve(angular.fromJson(data.response))

    error: (data) =>
      @d.reject(data)
