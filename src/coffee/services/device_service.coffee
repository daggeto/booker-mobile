app.factory 'DeviceService', (Device) ->
  new class DeviceService
    save: (params) ->
      Device.$r.save(params).$promise

    delete: (token) ->
      Device.$r.delete(token: token).$promise
