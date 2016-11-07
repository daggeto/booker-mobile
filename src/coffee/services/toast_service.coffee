app.factory 'ToastService', (ionicToast) ->
  new class ToastService
    show: (message, position, closeBtn, duration) ->
      ionicToast.show(message , position, closeBtn, duration)

    error: (message, position, closeBtn, duration) ->
      wrapped =
        "<i class=\"ion-alert-circled b-toast--icon b-toast--icon__error\"> #{message} </i>"

      @show(wrapped , position, closeBtn, duration)
