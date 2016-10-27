app.controller 'SignUpController', ($scope, translateFilter, AuthService) ->
  new class SignUpController
    constructor:  ->
      @ERROR_FIELDS = ['email', 'password', 'password_confirmation']

      @signup_data = {}
      $scope.email = ''

    sign_up: (form) ->
      return unless @validate(form)

      AuthService.signup(@signup_data)
        .then =>
          $scope.navigator.go('login', message: translateFilter('sign_up.success_message'))
        .catch (error) =>
          errors = error.data.errors
          for key, value of errors when key in @ERROR_FIELDS
            form[key].$error.serverMessage = value[0]

    validate: (form) ->
      return false unless form.$valid

      return false unless @validateTerms(form)

      return true

    validateTerms: (form) ->
      return true if @signup_data.terms

      form['terms'].$error.message = translateFilter('form.errors.terms_required')

      return false
