class Event
  'use strict'

  constructor: ($resource, API_URL) ->
    @FREE = 'free'
    @PENDING = 'pending'
    @BOOKED = 'booked'

    @statuses =
      [
        { value: @FREE, label: 'Free' }
        { value: @PENDING, label: 'Pending' }
        { value: @BOOKED, label: 'Booked' }
      ]

    URL = "#{API_URL}/api/v1/events/:event_id/:action.json"
    params =
      event_id: '@event_id'
      action: '@action'
    methods =
      update:
        method: 'PUT'
      post:
        method: 'POST'
    @$r = $resource(URL, params, methods)

    @$new = ->
      {
        description: ''
        status: 'free'
        start_at: ''
        end_at: ''
      }

    return this

app.factory('Event', Event)
