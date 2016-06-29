class BookingService
  'use strict'

  constructor: (ionicToast, EventsService, Event) ->
    [@ionicToast, @EventsService, @Event] = arguments

  book: (event) ->
    return unless event.status == @Event.FREE

    @EventsService.book(event.id).then(@afterEventBook)

  afterEventBook: (response) =>
    @ionicToast.show(@resolveResponse(response.response_code), 'bottom', false, 3000);

  resolveResponse: (response_code) ->
    switch response_code
      when 1 then "Event can't be booked."
      when 2 then 'It overlaps with your current reservations.'
      when 3 then 'It overlaps with your service events.'
      else 'Event booked. Wait for approval!'

app.service('BookingService', BookingService)
