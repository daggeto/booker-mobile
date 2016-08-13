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
      @rejectMethod = reject

      @ReservationsService.save(event_id: event.id)
        .then(@bookSuccess)
        .catch(@bookFailed)
    )

  bookSuccess: (response) =>
    @ionicToast.show(response.message, 'bottom', false, 3000);
    @resolveMethod(response)

  bookFailed: (response) =>
    @ionicToast.show(response.data.message, 'bottom', false, 3000);
    @rejectMethod

app.service('BookingService', BookingService)
