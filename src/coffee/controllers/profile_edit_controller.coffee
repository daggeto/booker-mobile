class ProfileEditController
  constructor: ($scope, currentUser, ProfileImage, ImageService, AuthService) ->
    [@scope, @currentUser, @ProfileImage, @ImageService, @AuthService] = arguments

    this

  onPhotoTaken: (response) ->
    @superAfterUpload = response.afterPhotoUpload
    return @updatePhoto(response) if @currentUser.profile_image

    @savePhoto(response)

  savePhoto: (data) ->
    @ImageService.save(@ProfileImage.PATH, data.photo_uri).then(@afterUpload).catch(@error)

  updatePhoto: (data) ->
    @ImageService.update(@ProfileImage.PATH, data.photo_uri).then(@afterUpload).catch(@error)

  afterUpload: (data) =>
    @currentUser.profile_image = data.profile_image
    @superAfterUpload()

  error: (error) =>
    @superAfterUpload()

  logout: ->
    @AuthService.logout()
    @scope.navigator.go('login')

app.controller('ProfileEditController', ProfileEditController)
