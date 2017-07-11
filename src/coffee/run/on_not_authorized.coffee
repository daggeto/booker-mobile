app.run ($rootScope, $auth, $state, translateFilter, ToastService, AUTH_EVENTS) ->
  redirectToLogin = ->
    $rootScope.navigator.go(
      'login',
      message:
        text: translateFilter('errors.please_login')
        severity: 'warning'
    )

  $rootScope.$on(AUTH_EVENTS.notAuthorized, ->
    $auth.deleteData('auth_headers')

    redirectToLogin() if $state.current.name != 'login'
  )
