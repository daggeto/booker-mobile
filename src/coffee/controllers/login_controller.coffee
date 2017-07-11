app.controller 'LoginController',
  (
    $scope,
    $stateParams,
    AuthService,
    ToastService,
    translateFilter
  ) ->
    new class LoginController
      constructor:  ->
        @data = {}

        @message = $stateParams.message

      login: ->
        AuthService.login(@data).then(@success).catch(@error)

      success: ->
        $scope.navigator.home()

      error: ->
        ToastService.error(translateFilter('errors.login_failed'))
