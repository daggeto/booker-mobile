app.controller 'ServiceReservationsController',
  (
    $scope,
    $ionicPopup,
    service,
    ReservationsService,
    UserServicesService
    ServiceEventActionSheet,
  ) ->
    new class ServiceReservationsController
      constructor: ->
        @bindListeners()

      bindListeners: ->
        $scope.$on '$ionicView.enter',  =>
          @reloadReservations()

        $scope.$on 'onEventClick', @onEventClick

      onEventClick: (_, data) =>
        ServiceEventActionSheet.show(data.event, data.reservation, @reloadReservations)

      reloadReservations: =>
        UserServicesService.reservations(service.id).then (response) =>
          @reservations = response.reservations
