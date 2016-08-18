class ProfileImage
  'use strict'

  constructor: (API_URL) ->
    @PATH = "#{API_URL}/api/v1/users/profile_image.json"

    return this

app.factory('ProfileImage', ProfileImage)
