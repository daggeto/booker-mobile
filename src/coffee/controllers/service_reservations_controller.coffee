app.controller 'ServiceReservationsController',
  (
    $scope,
    $ionicPopup,
    service,
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
        $scope.$on 'onEventAvatarClick', @onEventAvatarClick

      onEventClick: (_, data) =>
        ServiceEventActionSheet.show(data.event, data.reservation, @reloadReservations)

      onEventAvatarClick: (_, data) =>
        $scope.navigator.go('app.main.profile', user_id: data.reservation.user.id)

      reloadReservations: =>
        UserServicesService.reservations(service.id).then (response) =>
          @reservations = response.reservations
