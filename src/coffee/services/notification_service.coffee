class NotificationService
  'use strict'

  constructor: ($ionicPopup) ->
    [@ionicPopup] = arguments

    @push = new Ionic.Push(debug: true, onNotification: @onNotification)

  onNotification: (notification) =>
    @ionicPopup.show
      title: notification.title
      template: notification.text
      buttons:
        [
          { text: 'Cancel' },
          {
            text: 'Open',
            type: 'button-positive',
            onTap: (data) =>
              console.log(notification.payload)
          }
        ]

    console.log('Yeeee i got notification')

app.service('NotificationService', NotificationService)
