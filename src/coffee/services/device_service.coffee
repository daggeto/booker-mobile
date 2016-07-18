class DeviceService
  'use strict'

  constructor: (Device) ->
    [@Device] = arguments

  save: (params) ->
    @Device.$r.save(params).$promise

  delete: (token) ->
    @Device.$r.delete(token: token).$promise

app.service('DeviceService', DeviceService)
