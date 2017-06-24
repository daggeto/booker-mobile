app.factory 'BookingService', (
  $rootScope,
  $q,
  $ionicPopup,
  ToastService,
  ReservationsService,
  translateFilter,
  EVENT_STATUS
) ->
  new class BookingService
    book: (event) ->
      $rootScope.data = {}

      confirmBooking = $ionicPopup.confirm
        title: translateFilter('book.confirm')
        templateUrl: 'templates/book/_confirm.html'
        okText: translateFilter('yes')
        cancelText: translateFilter('close')
        scope: $rootScope

      confirmBooking.then (confirmed) =>
        @bookingConfirmed(event) if confirmed

    bookingConfirmed: (event) ->
      $q((resolve, reject) =>
        return reject() unless event.status == EVENT_STATUS.FREE

        @resolveMethod = resolve
        @rejectMethod = reject

        params = { event_id: event.id, message: $rootScope.data.message }

        ReservationsService.save(params)
          .then(@bookSuccess)
          .catch(@bookFailed)
      )

    bookSuccess: (response) =>
      ToastService.show(response.message, 'bottom', false, 3000)

      @resolveMethod(response)

    bookFailed: (response) =>
      @showError(response.data.message)

      @rejectMethod

    showError: (message) ->
      return ToastService.error(message) if message

      $rootScope.error()
