app.factory 'ProfileImage', (API_URL) ->
  new class ProfileImage
    @PATH: "#{API_URL}/api/v1/users/profile_image.json"
