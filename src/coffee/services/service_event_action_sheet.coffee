app.factory 'ServiceEventActionSheet',
  (
    $ionicActionSheet,
    $ionicPopup,
    Navigator,
    ReservationsService,
    Event,
    EventsService,
    EVENT_STATUS
  ) ->
    new class ServiceEventActionSheet
      show: (event, reservation, afterActionSelected) =>
        @afterActionSelected = afterActionSelected

        $ionicActionSheet.show
          titleText: 'Options'
          buttons: @actionButtons(event, reservation)
          buttonClicked: @buttonClicked
          destructiveText: @buttonText('Delete', 'ion-trash-b')
          cancelText: 'Close'
          destructiveButtonClicked: =>
            return @deleteEvent(event) if event.status == EVENT_STATUS.FREE

            @showConfirm(event, 'Do you really want to delete this event?', @deleteEvent)

      actionButtons: (event, reservation) =>
        buttons = []

        buttons.push @button('Preview', 'ion-eye', @onPreview, event)

        unless event.past || Event.isEventNotFree(event)
          buttons.push @button('Edit', 'ion-edit', @onEdit, event)

        if event.status == EVENT_STATUS.PENDING
          buttons.push @button('Approve', 'ion-checkmark-round', @approveEvent, reservation)
          buttons.push @button('Disapprove', 'ion-close-round', @disapproveEvent, reservation)

        if event.status == EVENT_STATUS.BOOKED && !event.past
          buttons.push(
            @button(
              'Cancel Reservation',
              'ion-close-round',
              @showCancelConfirmation,
              reservation
            )
          )

        buttons

      button: (text, icon, action, target) ->
        { text: @buttonText(text, icon), action: action, target: target }

      buttonText: (text, icon) ->
        text = "<i class=\"icon #{icon}\"></i> #{text}"  if ionic.Platform.isAndroid()

        text

      buttonClicked: (index, button) ->
        button.action(button.target)

        true

      approveEvent: (reservation) =>
        @doAction('approve', reservation)

      disapproveEvent: (reservation) =>
        @doAction('disapprove', reservation)

      showCancelConfirmation: (reservation) =>
        @showConfirm(reservation, 'Do you really want to cancel reservation?', @cancelEvent)

      cancelEvent: (reservation) =>
        @doAction('cancel_by_service', reservation)

      doAction: (action, reservation) =>
        ReservationsService.do(action, reservation.id).then =>
          @afterActionSelected()

      onEdit: (event) =>
        Navigator.go("service.calendar.edit_event", event_id: event.id, calendar: @calendar)

      onPreview: (event) =>
        Navigator.go("service.calendar.preview_event", event_id: event.id, calendar: @calendar)

      showConfirm: (target, message, callback) =>
        popup = $ionicPopup.confirm
          title: 'This time is reserved'
          template: message

        popup.then (confirmed) ->
          callback(target) if confirmed

        true

      deleteEvent: (event) =>
        EventsService.delete(event.id).then =>
          @afterActionSelected()

        true
