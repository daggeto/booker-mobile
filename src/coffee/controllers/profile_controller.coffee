app.controller 'ProfileController', (user) ->
  new class ProfileController
    constructor: ->
      @user = user
