class EventsService
  'use strict'

  constructor: (Event, $cacheFactory) ->
    @Event = Event
    @cacheFactory = $cacheFactory

    this

  findById: (id) ->
    @Event.$r.get(id: id)

  save: (params) ->
    @Event.$r.save(params).$promise

  update: (params) ->
    @Event.$r.update(params).$promise

  delete: (id) ->
    @Event.$r.delete(id: id).$promise

app.service('EventsService', EventsService)
