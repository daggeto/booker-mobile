app.controller 'ReservationsController',
  (
    $scope,
    $ionicActionSheet,
    $ionicPopup,
    currentUser,
    UsersService,
    ReservationsService
    translateFilter
  ) ->
    new class ReservationsController
      constructor: ->
        @currentUser = currentUser

        @bindListeners()

      bindListeners: ->
        $scope.$on '$ionicView.enter', (event, data) =>
          @reloadReservations()


        $scope.$on 'onEventClick', @onEventClick
        $scope.$on 'onEventAvatarClick', @onEventAvatarClick

      onEventClick: (_, data) =>
        $ionicActionSheet.show
          titleText: translateFilter('reservations.actions.title')
          destructiveText:
            '<i class="icon ion-close-round"></i> ' +
              translateFilter('reservations.actions.cancel')
          cancelText: translateFilter('close')
          destructiveButtonClicked: =>
            @showConfirm(data.reservation)

            true

      onEventAvatarClick: (_, data) =>
        $scope.navigator.go('book_service', id: data.reservation.service.id)

      reloadReservations: =>
        UsersService.reservations(user_id: currentUser.id, group: true).then (response) =>
          @reservations = response.reservations

      showConfirm: (reservation) =>
        popup = $ionicPopup.confirm
          title: translateFilter('reservations.actions.confirm_cancel')
          okText: translateFilter('yes')
          cancelText: translateFilter('close')

        popup.then (confirmed) =>
          @cancelReservation(reservation) if confirmed

      cancelReservation: (reservation) ->
        ReservationsService.do('cancel_by_client', reservation.id)
          .then =>
            @reloadReservations()
          .catch($scope.error)
