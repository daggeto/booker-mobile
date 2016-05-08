class Event
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

    @$r = $resource(
      "#{API_URL}/api/v1/services/:service_id/events/:id.json",
      { service_id: '@service_id', id: '@id' },
      update: { method: 'PUT' }
    )

    @$new = ->
      {
        description: ''
        status: 'free'
        start_at: ''
        end_at: ''
      }

    return this

app.factory('Event', Event)
