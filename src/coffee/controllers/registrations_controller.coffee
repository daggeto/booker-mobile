class RegistrationsController
  constructor: (
    $scope,
    $ionicActionSheet,
    $ionicPopup,
    currentUser,
    UsersService,
    EventsService
  ) ->

    [
      @scope,
      @ionicActionSheet,
      @ionicPopup,
      @currentUser,
      @UsersService,
      @EventsService
    ] = arguments

    @bindListeners()

    this

  bindListeners: ->
    @scope.$on '$ionicView.enter', (event, data) =>
      @reloadEvents()

    @scope.$on 'eventClick', (_, data) =>
      @ionicActionSheet.show
        titleText: 'Modify your reservation'
        destructiveText: 'Cancel'
        cancelText: 'Close'
        destructiveButtonClicked: =>
          @showConfirm(data.event)

          true

  reloadEvents: ->
    @UsersService.events(user_id: @currentUser.id, group: true).then (response) =>
      @events = response.events


  showConfirm: (event) =>
    popup = @ionicPopup.confirm
      title: 'Do you realy want to cancel this reservation?',

    popup.then (confirmed) =>
      @cancelReservation(event) if confirmed

  cancelReservation: (event) ->
    @EventsService.do('cancel', event.id).then =>
      @reloadEvents()

app.controller('RegistrationsController', RegistrationsController)
