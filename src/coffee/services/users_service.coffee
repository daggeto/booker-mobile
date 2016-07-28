class UsersService
  'use strict'

  constructor: ($q, $cacheFactory, User) ->
    @q = $q
    @cacheFactory = $cacheFactory
    @User = User

    this

  findById: (id) ->
    @User.$r.get(id: id).$promise

  events: (params) ->
    params.assoc = 'events'
    @User.$a.get(params).$promise

app.service('UsersService', UsersService)
