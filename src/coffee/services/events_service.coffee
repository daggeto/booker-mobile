app.factory 'EventsService', (Event, AuthWrapper, $cacheFactory) ->
  new class EventsService
    findById: (id) ->
      AuthWrapper.wrap ->
        Event.$r.get(id: id).$promise

    save: (params) ->
      AuthWrapper.wrap ->
        Event.$r.save(params).$promise

    update: (params) ->
      AuthWrapper.wrap ->
        Event.$r.update(params).$promise

    delete: (id) ->
      AuthWrapper.wrap ->
        Event.$r.delete(id: id).$promise
