class User
  'use strict'

  constructor: ($resource, API_URL) ->
    @$r = $resource("#{API_URL}/api/v1/users/:id.json", id: '@id')

    @$session = $resource("#{API_URL}/users/:action.json", id: '@id', action: '@action')

    return this

app.factory('User', User)
