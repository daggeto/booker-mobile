class BookingService
  'use strict'

  constructor: ($q, ionicToast, EventsService, Event) ->
    [@q, @ionicToast, @EventsService, @Event] = arguments

  book: (event) ->
    @q((resolve, reject) =>
      return reject() unless event.status == @Event.FREE

      @resolveMethod = resolve

      @EventsService.book(event.id).then(@afterEventBook)
    )

  afterEventBook: (response) =>
    @ionicToast.show(@resolveResponse(response.response_code), 'bottom', false, 3000);
    @resolveMethod(response)

  resolveResponse: (response_code) ->
    switch response_code
      when 1 then "Event can't be booked."
      when 2 then 'It overlaps with your current reservations.'
      when 3 then 'It overlaps with your service events.'
      else 'Event booked. Wait for approval!'

app.service('BookingService', BookingService)
