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


    @scope.$on 'onEventClick', (_, data) =>
      @ionicActionSheet.show
        titleText: 'Modify your reservation'
        destructiveText: '<i class="icon ion-close-round"></i> Cancel Reservation'
        cancelText: 'Close'
        destructiveButtonClicked: =>
          @showConfirm(data.target)

          true
    @scope.$on 'onEventAvatarClick', (_, data) =>
      console.log

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
