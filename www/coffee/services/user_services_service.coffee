class UserServicesService
  'use strict'

  constructor: ($cacheFactory, UserService) ->
    [@cacheFactory, @UserService] = arguments

    this

  events: (params) ->
    @UserService.$events.query(params).$promise

  findById: (id) ->
    @UserService.$r.get(id: id).$promise

  find: (params) ->
    @UserService.$r.query(params).$promise

  save: (params) ->
    @UserService.$r.save(params).$promise

  update: (params) ->
    @UserService.$r.update(params).$promise

  delete: (id) ->
    @UserService.$r.delete(id: id).$promise

app.service('UserServicesService', UserServicesService)
