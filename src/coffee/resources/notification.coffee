app.factory 'Notification', ($resource, API_URL) ->
  new class Notification
    URL = "#{API_URL}/api/v1/notifications/:notification_id/:action.json"

    params =
      notification_id: '@notification_id'
      action: '@action'

    methods =
      post:
        method: 'POST'
    $r: $resource(URL, params, methods)
