app.run ($rootScope, $auth, translateFilter, ToastService, AUTH_EVENTS) ->
  $rootScope.$on(AUTH_EVENTS.notAuthorized, ->

    $rootScope.navigator.go(
      'login',
      message:
        text: translateFilter('errors.please_login')
        severity: 'warning'
    )

    $auth.deleteData('auth_headers')
  )
