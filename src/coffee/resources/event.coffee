app.factory 'Event', ($resource, EVENT_STATUS, API_URL) ->
  new class Event
    URL = "#{API_URL}/api/v1/events/:id/:action.json"
    params =
      id: '@id'
      action: '@action'

    methods =
      update:
        method: 'PUT'
      post:
        method: 'POST'

    statuses:
      [
        { value: EVENT_STATUS.FREE, label: 'Free' }
        { value: EVENT_STATUS.PENDING, label: 'Pending' }
        { value: EVENT_STATUS.BOOKED, label: 'Booked' }
      ]

    $r: $resource(URL, params, methods)

    $new: ->
      {
        description: ''
        status: EVENT_STATUS.FREE
        start_at: null
        end_at: null
      }

    isEventNotFree: (event) ->
      event.status == EVENT_STATUS.PENDING || event.status == EVENT_STATUS.BOOKED
