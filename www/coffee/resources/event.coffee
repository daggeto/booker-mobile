class Event
  constructor: ($resource, API_URL) ->
    @$r = $resource(
      "#{API_URL}/api/v1/services/:service_id/events.json",
      { service_id: '@service_id' },
      update: { method: 'PUT' }
    )

    @$new = {
      description: ''
      status: ''
      start_at: ''
      end_at: ''
    }

    return this

app.factory('Event', Event)
