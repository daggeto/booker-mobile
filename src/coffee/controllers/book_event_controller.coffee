app.controller 'BookEventController', ($scope, $state, service, BookingService) ->
  new class BookEventController
    constructor: ->
      @service = service

      @bindListeners()

    bindListeners: ->
      $scope.$on('bookEvent', @bookEvent)

    bookEvent: (_, data) =>
      BookingService.book(data.event).then =>
        $scope.$broadcast('reloadEvents')

    back: ->
      $scope.navigator.back()
