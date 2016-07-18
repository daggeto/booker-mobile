class Device
  'use strict'

  constructor: ($resource, API_URL) ->
    URL = "#{API_URL}/api/v1/device/"

    @$r = $resource(URL)

    return this

app.factory('Device', Device)
