app.factory 'NotificationService', (Notification, AuthWrapper) ->
  new class NotificationService
    findAll: ->
      AuthWrapper.wrap ->
        Notification.$r.get().$promise

    markAsRead: (id) ->
      AuthWrapper.wrap ->
        Notification.$r.post(notification_id: id, action: 'mark_as_read').$promise

    markAllAsRead: ->
      AuthWrapper.wrap ->
        Notification.$r.post(action: 'mark_all_as_read').$promise
