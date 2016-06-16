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

    @$r = $resource("#{API_URL}/api/v1/events/:id.json", { id: '@id' }, update: { method: 'PUT' })

    @$new = ->
      {
        description: ''
        status: 'free'
        start_at: ''
        end_at: ''
      }

    return this

app.factory('Event', Event)
