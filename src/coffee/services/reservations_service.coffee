app.factory 'ReservationsService', (Reservation, AuthWrapper, $cacheFactory) ->
  new class ReservationsService
    save: (params) ->
      AuthWrapper.wrap ->
        Reservation.$r.save(params).$promise

    do: (action, reservation_id) ->
      AuthWrapper.wrap ->
        Reservation.$r.post(reservation_id: reservation_id, action: action).$promise
