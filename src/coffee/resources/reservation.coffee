app.factory 'Reservation', ($resource, API_URL) ->
  new class Reservation
    URL = "#{API_URL}/api/v1/reservations/:reservation_id/:action.json"

    params =
      reservation_id: '@reservation_id'
      action: '@action'
    methods =
      post:
        method: 'POST'
    $r: $resource(URL, params, methods)
