class BookingService
  'use strict'

  constructor: ($q, $ionicPopup, ionicToast, ReservationsService, Event) ->
    [@q, @ionicPopup, @ionicToast, @ReservationsService, @Event] = arguments

  book: (event) ->
    confirmBooking = @ionicPopup.confirm
      title: 'Please confirm your reservation',
      okText: 'Yes'

    confirmBooking.then (confirmed) =>
      @bookingConfirmed(event) if confirmed

  bookingConfirmed: (event) ->
    @q((resolve, reject) =>
      return reject() unless event.status == @Event.FREE

      @resolveMethod = resolve

      @ReservationsService.save(event_id: event.id).then(@afterEventBook)
    )

  afterEventBook: (response) =>
    @ionicToast.show(@resolveResponse(response.response_code), 'bottom', false, 3000);
    @resolveMethod(response)

  resolveResponse: (response_code) ->
    switch response_code
      when 1 then "Event can't be booked."
      when 2 then 'It overlaps with your current reservations.'
      when 3 then 'It overlaps with your service events.'
      else 'Event booked. You will get answer in 1 hour!'

app.service('BookingService', BookingService)
