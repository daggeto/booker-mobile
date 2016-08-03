class UsersService
  'use strict'

  constructor: ($q, $cacheFactory, User) ->
    @q = $q
    @cacheFactory = $cacheFactory
    @User = User

    this

  findById: (id) ->
    @User.$r.get(id: id).$promise

  reservations: (params) ->
    params.assoc = 'reservations'
    @User.$a.get(params).$promise

app.service('UsersService', UsersService)
