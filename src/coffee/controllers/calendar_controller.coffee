class CalendarController
  constructor: (
    $scope,
    $state,
    $stateParams,
    $ionicActionSheet
    $ionicPopup,
    UserServicesService,
    Event,
    EventsService,
    ReservationsService,
    service,
    Calendar) ->
    [
      @scope,
      @state,
      @stateParams,
      @ionicActionSheet,
      @ionicPopup,
      @UserServicesService,
      @Event,
      @EventsService,
      @ReservationsService,
      @service
    ] = arguments

    @bindListeners()

    @calendar = new Calendar(@stateParams.selectedDate)

    @scope.$on('$ionicView.enter', (event, data) =>
      @reloadEvents()
    )

    this

  bindListeners: ->
    @scope.$on 'onEventClick', @onEventClick

    @scope.$on 'onEventAvatarClick', (_, data) =>
      console.log

  reloadEvents: ->
    @loadEvents(@calendar.selectedDate)

  loadEvents: (date) =>
    @UserServicesService.events(
      service_id: @service.id
      start_at: date.format()
    ).then(((response) =>
      @calendar.events = response
    ), (refejcted) ->
      console.log('rejected')
    )

  onEventClick: (_, data)=>
    @ionicActionSheet.show
      titleText: 'Options'
      buttons: @actionButtons(data.target)
      buttonClicked: @buttonClicked
      destructiveText: @buttonText('Delete', 'ion-trash-b')
      cancelText: 'Close'
      destructiveButtonClicked: =>
        return @showConfirm(data.target) unless data.target.status == @Event.FREE

        @deleteEvent(data.target)

  actionButtons: (event) ->
    buttons = []

    buttons.push @button('Edit', 'ion-edit', @onEdit, event) unless event.past
    buttons.push @button('Preview', 'ion-eye', @onPreview, event) if event.past

    if event.status == @Event.PENDING
      buttons.push @button('Approve', 'ion-checkmark-round', @approveEvent, event)
      buttons.push @button('Disapprove', 'ion-close-round', @disapproveEvent, event)

    buttons

  button: (text, icon, action, event) ->
    { text: @buttonText(text, icon), action: action, event: event }

  buttonText: (text, icon) ->
    text = "<i class=\"icon #{icon}\"></i> #{text}"  if ionic.Platform.isAndroid()

    text

  buttonClicked: (index, button) ->
    button.action(button.event)

    true

  showConfirm: (event) =>
    popup = @ionicPopup.confirm
      title: 'This time is reserved'
      template: 'Do you really want to delete this event?'

    popup.then (confirmed) =>
      @deleteEvent(event) if confirmed

  deleteEvent: (event) ->
    @EventsService.delete(event.id).then( =>
      @state.reload()
    ).catch( ->
      console.log('not deleted')
    )

  approveEvent: (event) =>
    @changeStatus('approve', event.reservation)

  disapproveEvent: (event) =>
    @changeStatus('disapprove', event.reservation)

  changeStatus: (action, reservation) =>
    @ReservationsService.do(action, reservation.id).then (response) =>
      @reloadEvents()

  onEdit: (event) =>
    @scope.navigator.go("service.calendar.edit_event", event_id: event.id, calendar: @calendar)

  onPreview: (event) =>
    @scope.navigator.go("service.calendar.preview_event", event_id: event.id, calendar: @calendar)

  selectDate: (date) ->
    @calendar.selectDate(date)
    @loadEvents(date)

  addEvent: ->
    @state.go('service.calendar.add_event', calendar: @calendar)

  isPast: ->
    @calendar.selectedDate.isBefore(@calendar.currentDate)

  back: ->
    @state.go('app.main')

app.controller('CalendarController', CalendarController)
