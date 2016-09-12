app.factory 'ReservationsService', (Reservation, $cacheFactory) ->
  new class ReservationsService
    save: (params) ->
      Reservation.$r.save(params).$promise

    do: (action, reservation_id) ->
      Reservation.$r.post(reservation_id: reservation_id, action: action).$promise
