app.factory 'EventsService', (Event, $cacheFactory) ->
  new class EventsService
    findById: (id) ->
      Event.$r.get(id: id)

    save: (params) ->
      Event.$r.save(params).$promise

    update: (params) ->
      Event.$r.update(params).$promise

    delete: (id) ->
      Event.$r.delete(id: id).$promise
