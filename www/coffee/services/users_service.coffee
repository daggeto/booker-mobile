class UsersService
  'use strict'

  constructor: ($q, $cacheFactory, User) ->
    @q = $q
    @cacheFactory = $cacheFactory
    @User = User

    this

  findById: (id) ->
    @User.$r.get(id: id).$promise

  login: (data) ->
    @User.$session.save(action: 'sign_in', user: data).$promise

  toggleProviderSettings: (user_id, provider_flag) ->
    @q (resolve, reject) =>
      @User.$action.save(
        id: user_id
        provider_flag: provider_flag
        action: 'toggle_provider_settings'
      ).$promise.then (data) ->
        if data.success
          resolve(data)
        else
          reject(data)

  disableProviding: (user) ->
    @User.$service.remove(user_id: user.id, id: user.service_id)

app.service('UsersService', UsersService)
