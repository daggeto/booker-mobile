app.controller 'UserServiceController', (service) ->
  new class UserServiceController
    constructor: ->
      @service = service
