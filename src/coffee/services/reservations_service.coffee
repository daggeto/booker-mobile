class ReservationsService
  'use strict'

  constructor: (Reservation, $cacheFactory) ->
    [@Reservation, @cacheFactory] = arguments

    this

  save: (params) ->
    @Reservation.$r.save(params).$promise

  do: (action, reservation_id) ->
    @Reservation.$r.post(reservation_id: reservation_id, action: action).$promise

app.service('ReservationsService', ReservationsService)
