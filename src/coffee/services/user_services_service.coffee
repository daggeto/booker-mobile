app.factory 'UserServicesService', ($cacheFactory, UserService, AuthWrapper) ->
  new class UserServicesService
    events: (params) ->
      AuthWrapper.wrap ->
        UserService.$events.get(params).$promise

    service_photos: (params) ->
      AuthWrapper.wrap ->
        UserService.$service_photos.query(params).$promise

    reservations: (service_id, group = true) ->
      AuthWrapper.wrap ->
        UserService.$r.get(id: service_id, action: 'reservations', group: group).$promise

    findById: (id) ->
      AuthWrapper.wrap ->
        UserService.$r.get(id: id).$promise

    findWithGet: (params) ->
      AuthWrapper.wrap ->
        UserService.$r.get(params).$promise

    save: (params) ->
      AuthWrapper.wrap ->
        UserService.$r.save(params).$promise

    update: (params) ->
      AuthWrapper.wrap ->
        UserService.$r.update(params).$promise

    publish: (service_id) ->
      AuthWrapper.wrap ->
        UserService.$r.post(id: service_id, action: 'publish').$promise

    unpublish: (service_id) ->
      AuthWrapper.wrap ->
        UserService.$r.post(id: service_id, action: 'unpublish').$promise
