app.controller 'BookEventController', ($scope, $state, service, BookingService, Event) ->
  new class BookEventController
    constructor: ->
      @service = service

      @bindListeners()

    bindListeners: ->
      $scope.$on('bookEvent', @bookEvent)

    bookEvent: (_, data) =>
      return if Event.isEventNotFree(data.event)

      BookingService.book(data.event).then =>
        $scope.$broadcast('reloadEvents')

