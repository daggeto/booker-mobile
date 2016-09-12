app.factory 'BookingService', ($q, $ionicPopup, ionicToast, ReservationsService, EVENT_STATUS) ->
  new class BookingService
    book: (event) ->
      confirmBooking = $ionicPopup.confirm
        title: 'Please confirm your reservation',
        okText: 'Yes'

      confirmBooking.then (confirmed) =>
        @bookingConfirmed(event) if confirmed

    bookingConfirmed: (event) ->
      $q((resolve, reject) =>
        return reject() unless event.status == EVENT_STATUS.FREE

        @resolveMethod = resolve
        @rejectMethod = reject

        ReservationsService.save(event_id: event.id)
          .then(@bookSuccess)
          .catch(@bookFailed)
      )

    bookSuccess: (response) =>
      ionicToast.show(response.message, 'bottom', false, 3000);
      @resolveMethod(response)

    bookFailed: (response) =>
      ionicToast.show(response.data.message, 'bottom', false, 3000);
      @rejectMethod
