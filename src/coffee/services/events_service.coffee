class EventsService
  'use strict'

  constructor: (Event, $cacheFactory) ->
    @Event = Event
    @cacheFactory = $cacheFactory

    this

  findById: (id) ->
    @Event.$r.get(event_id: id)

  save: (params) ->
    @Event.$r.save(params).$promise

  update: (params) ->
    @Event.$r.update(params).$promise

  delete: (id) ->
    @Event.$r.delete(event_id: id).$promise

  book: (id) ->
    @Event.$r.post(event_id: id, action: 'book').$promise

  do: (action, id) ->
    @Event.$r.post(event_id: id, action: action).$promise

app.service('EventsService', EventsService)
