app.service('AuthService', ($q, $http, UsersService, USER_ROLES, API_URL, LOCAL_CURRENT_USER_ID) ->
  LOCAL_TOKEN_KEY = 'authToken';
  LOCAL_EMAIL_KEY = 'authEmail';
  username = '';
  isAuthenticated = false;
  role = '';
  authToken = undefined;

  loadUserCredentials = ->
    token = window.localStorage.getItem(LOCAL_TOKEN_KEY)
    email = window.localStorage.getItem(LOCAL_EMAIL_KEY)
    if token
      useCredentials(email: email, authentication_token: token)

  storeUserCredentials = (user) ->
    window.localStorage.setItem(LOCAL_TOKEN_KEY, user.authentication_token)
    window.localStorage.setItem(LOCAL_EMAIL_KEY, user.email)
    window.localStorage.setItem(LOCAL_CURRENT_USER_ID, user.id)

    useCredentials(user)

  useCredentials = (user) ->
    isAuthenticated = true

    $http.defaults.headers.common['X-User-Token'] = user.authentication_token
    $http.defaults.headers.common['X-User-Email'] = user.email;

  destroyUserCredentials = ->
    authToken = undefined
    username = ''
    isAuthenticated = false
    $http.defaults.headers.common['X-User-Token'] = undefined
    window.localStorage.removeItem(LOCAL_TOKEN_KEY)

  login = (data) ->
    $q((resolve, reject) ->
      UsersService.login(data).then(((user) ->
        storeUserCredentials(user)
        resolve('Login success.'))
      , (err) ->
        reject('Login failed')
      )
    )

  logout = ->
    destroyUserCredentials()

  loadUserCredentials()

  return {
    login: login
    logout: logout
    isAuthenticated: -> return isAuthenticated
    username: -> return username
    role: -> return role
  }
)
