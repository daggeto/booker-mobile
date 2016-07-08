class LoginController
  constructor: ($scope, $stateParams, AuthService) ->
    [@scope, @stateParams, @AuthService] = arguments

    @data = {}

    @message = @stateParams.message

    this

  login: ->
    @AuthService.login(@data).then ((authenticated) =>
     @scope.navigator.go('app.main')
   )

app.controller('LoginController', LoginController)
