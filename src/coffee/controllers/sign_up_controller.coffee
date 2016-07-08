class SignUpController
  constructor: ($scope, $ionicPopup, $parse, AuthService) ->
    [@scope, @ionicPopup, @parse, @AuthService] = arguments

    @ERROR_FIELDS = ['email', 'password', 'password_confirmation']

    @signup_data = {}
    @scope.email = ''

    this

  sign_up: (form) ->
    return unless form.$valid

    @AuthService.signup(@signup_data)
    .then (response) =>
      @scope.navigator.go('login', message: 'You are registered. You an login now.')
    .catch (error) =>
      errors = error.data.errors
      for key, value of errors when key in @ERROR_FIELDS
        form[key].$error.serverMessage = value[0]

app.controller('SignUpController', SignUpController)
