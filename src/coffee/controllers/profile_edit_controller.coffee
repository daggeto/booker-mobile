app.controller 'ProfileEditController',
  (
    $scope,
    ProfileImage,
    ImageService,
    AuthService,
    UsersService,
    Context
  ) ->
    new class ProfileEditController
      constructor: ->
        Context.resolveCurrentUser().then (user) =>
          @currentUser = user
          @userData =
            first_name: @currentUser.first_name
            last_name: @currentUser.last_name

      onPhotoTaken: (response) ->
        @superAfterUpload = response.afterPhotoUpload
        return @updatePhoto(response) if @currentUser.profile_image

        @savePhoto(response)

      savePhoto: (data) ->
        ImageService.save(ProfileImage.PATH, data.photo_uri).then(@afterUpload).catch(@error)

      updatePhoto: (data) ->
        ImageService.update(ProfileImage.PATH, data.photo_uri).then(@afterUpload).catch(@error)

      afterUpload: (data) =>
        @currentUser.profile_image = data.profile_image
        @superAfterUpload()

      error: (error) =>
        @superAfterUpload()

      save: =>
        UsersService.update(@userData).then (response) ->
          Context.setCurrentUser(response.user)
          $scope.navigator.home()

      logout: ->
        AuthService.logout()
        $scope.navigator.go('login')
