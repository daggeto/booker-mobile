app.controller 'ReportsController', ($scope, service, ionicToast, Navigator, ReportsService) ->
  new class ReportsController
    send: (form) ->
      ReportsService.save(service_id: service.id, message: @message).then (response) ->
        ionicToast.show(response.message, 'bottom', false, 3000)
        Navigator.back()
