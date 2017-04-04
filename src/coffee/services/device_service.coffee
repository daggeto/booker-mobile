app.factory 'DeviceService', (Device, AuthWrapper) ->
  new class DeviceService
    save: (params) ->
      AuthWrapper.wrap ->
        Device.$r.save(params).$promise
