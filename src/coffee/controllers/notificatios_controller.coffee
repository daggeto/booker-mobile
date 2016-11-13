app.controller 'NotificationsController',
  ($scope, NotificationService, EVENTS) ->
    new class NotificationsController
      constructor: ->
        @bindListeners()

      bindListeners: ->
        $scope.$on '$ionicView.enter',  =>
          @reloadNotifications()

      reloadNotifications: ->
        NotificationService.findAll().then (response) =>
          @notifications = response.notifications
          @markAsRead()

      markAsRead: ->
        NotificationService.markAllAsRead().then =>
          $scope.$emit(EVENTS.UPDATE_CURRENT_USER)
