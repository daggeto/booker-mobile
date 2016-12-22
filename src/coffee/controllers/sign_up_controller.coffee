app.controller 'SignUpController', ($scope, $stateParams, translateFilter, AuthService) ->
  new class SignUpController
    constructor:  ->
      @ERROR_FIELDS = ['email', 'password', 'password_confirmation']
      @signup_data = terms: true

      angular.merge(@signup_data, $stateParams.login_data)

    sign_up: (form) ->
      return unless @validate(form)

      AuthService
        .signup(@signup_data)
        .then @login
        .catch (error) =>
          errors = error.data.errors
          for key, value of errors when key in @ERROR_FIELDS
            form[key].$error.serverMessage = value[0]

    login: =>
      @login_data = { email: @signup_data.email, password: @signup_data.password }

      AuthService
        .login(@login_data)
        .then =>
          $scope.navigator.home()
        .catch ->
          $scope.navigator.go('login',
            message
              text: translateFilter('sign_up.fail_message')
              severity: 'warning'
          )

    validate: (form) ->
      return false unless form.$valid

      return false unless @validateTerms(form)

      return true

    validateTerms: (form) ->
      return true if @signup_data.terms

      form['terms'].$error.message = translateFilter('form.errors.terms_required')

      return false
