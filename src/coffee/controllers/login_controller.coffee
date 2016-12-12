app.controller 'LoginController', ($scope, $stateParams, AuthService) ->
  new class LoginController
    constructor: ->
      @data = {}

      @message = $stateParams.message

    login: ->
      AuthService.login(@data).then =>
        $scope.navigator.home(message: '')
