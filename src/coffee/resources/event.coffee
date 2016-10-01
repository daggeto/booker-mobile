app.factory 'Event', ($resource, EVENT_STATUS, API_URL, translateFilter) ->
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
        {
          value: EVENT_STATUS.FREE,
          label: translateFilter("event.status.#{EVENT_STATUS.FREE}")
        }
        {
          value: EVENT_STATUS.PENDING,
          label: translateFilter("event.status.#{EVENT_STATUS.PENDING}")
        }
        {
          value: EVENT_STATUS.BOOKED,
          label: translateFilter("event.status.#{EVENT_STATUS.BOOKED}")
        }
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
