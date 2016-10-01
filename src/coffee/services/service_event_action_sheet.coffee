app.factory 'ServiceEventActionSheet',
  (
    $ionicActionSheet,
    $ionicPopup,
    Navigator,
    ReservationsService,
    Event,
    EventsService,
    EVENT_STATUS,
    translateFilter
  ) ->
    new class ServiceEventActionSheet
      show: (event, reservation, afterActionSelected) =>
        @afterActionSelected = afterActionSelected

        $ionicActionSheet.show
          titleText: translateFilter('event.actions.title')
          buttons: @actionButtons(event, reservation)
          buttonClicked: @buttonClicked
          destructiveText: @buttonText(translateFilter('delete'), 'ion-trash-b')
          cancelText: translateFilter('close')
          destructiveButtonClicked: =>
            return @deleteEvent(event) if event.status == EVENT_STATUS.FREE

            @showConfirm(event, translateFilter('event.actions.confirm_delete'), @deleteEvent)

      actionButtons: (event, reservation) =>
        buttons = []

        buttons.push @button(translateFilter('event.actions.preview'), 'ion-eye', @onPreview, event)

        unless event.past || Event.isEventNotFree(event)
          buttons.push @button(translateFilter('event.actions.edit'), 'ion-edit', @onEdit, event)

        if event.status == EVENT_STATUS.PENDING
          buttons.push(
            @button(
              translateFilter('event.actions.approve'),
              'ion-checkmark-round',
              @approveEvent,
              reservation
            )
          )
          buttons.push(
            @button(
              translateFilter('event.actions.disapprove'),
              'ion-close-round',
              @disapproveEvent,
              reservation
            )
          )

        if event.status == EVENT_STATUS.BOOKED && !event.past
          buttons.push(
            @button(
              translateFilter('event.actions.cancel'),
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
        @showConfirm(
          reservation,
          translateFilter('event.actions.confirm_cancel'),
          @cancelEvent
        )

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
          template: message
          okText: translateFilter('yes')
          cancelText: translateFilter('close')

        popup.then (confirmed) ->
          callback(target) if confirmed

        true

      deleteEvent: (event) =>
        EventsService.delete(event.id).then =>
          @afterActionSelected()

        true
