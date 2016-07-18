class LoginController
  constructor: ($scope, $stateParams, AuthService) ->
    [@scope, @stateParams, @AuthService] = arguments

    @data = {}

    @message = @stateParams.message

    this

  login: ->
    @AuthService.login(@data).then (authenticated) =>
      @scope.navigator.home(message: '')

app.controller('LoginController', LoginController)
