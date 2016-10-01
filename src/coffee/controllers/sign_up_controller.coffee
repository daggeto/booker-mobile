app.controller 'SignUpController', ($scope, translateFilter, AuthService) ->
  new class SignUpController
    constructor:  ->
      @ERROR_FIELDS = ['email', 'password', 'password_confirmation']

      @signup_data = {}
      $scope.email = ''

    sign_up: (form) ->
      return unless form.$valid

      AuthService.signup(@signup_data)
        .then =>
          $scope.navigator.go('login', message: translateFilter('sign_up.success_message'))
        .catch (error) =>
          errors = error.data.errors
          for key, value of errors when key in @ERROR_FIELDS
            form[key].$error.serverMessage = value[0]
