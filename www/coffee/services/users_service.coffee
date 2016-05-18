class UsersService
  'use strict'

  constructor: (User, $cacheFactory) ->
    @User = User
    @cacheFactory = $cacheFactory

    this

  findById: (id) ->
    @User.$r.get(id: id).$promise

  login: (data) ->
    @User.$session.save(action: 'sign_in', user: data).$promise

app.service('UsersService', UsersService)
