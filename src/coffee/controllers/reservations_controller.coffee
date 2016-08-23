class ReservationsController
  constructor: ($scope,
                $ionicActionSheet,
                $ionicPopup,
                currentUser,
                UsersService,
                ReservationsService) ->
    [ @scope,
      @ionicActionSheet,
      @ionicPopup,
      @currentUser,
      @UsersService,
      @ReservationsService
    ] = arguments

    @bindListeners()

    this

  bindListeners: ->
    @scope.$on '$ionicView.enter', (event, data) =>
      @reloadReservations()


    @scope.$on 'onEventClick', @onEventClick
    @scope.$on 'onEventAvatarClick', @onEventAvatarClick

  onEventClick: (_, data) =>
    @scope.$on 'onEventClick', (_, data) =>
      @ionicActionSheet.show
        titleText: 'Modify your reservation'
        destructiveText: '<i class="icon ion-close-round"></i> Cancel Reservation'
        cancelText: 'Close'
        destructiveButtonClicked: =>
          @showConfirm(data.target)

          true

  onEventAvatarClick: (_, data) =>
    @scope.navigator.go('book_service', id: data.target.service.id)

  reloadReservations: ->
    @UsersService.reservations(user_id: @currentUser.id, group: true).then (response) =>
      @reservations = response.reservations

  showConfirm: (reservation) =>
    popup = @ionicPopup.confirm
      title: 'Do you realy want to cancel this reservation?',

    popup.then (confirmed) =>
      @cancelReservation(reservation) if confirmed

  cancelReservation: (reservation) ->
    @ReservationsService.do('cancel', reservation.id).then =>
      @reloadReservations()

app.controller('ReservationsController', ReservationsController)
