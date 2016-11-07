app.factory 'BookingService', (
  $q,
  $ionicPopup,
  ToastService,
  ReservationsService,
  translateFilter,
  EVENT_STATUS
) ->
  new class BookingService
    book: (event) ->
      confirmBooking = $ionicPopup.confirm
        title: translateFilter('book.confirm')
        okText: translateFilter('yes')
        cancelText: translateFilter('close')

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
      ToastService.show(response.message, 'bottom', false, 3000);
      @resolveMethod(response)

    bookFailed: (response) =>
      ToastService.error(response.data.message, 'bottom', false, 3000);
      @rejectMethod
