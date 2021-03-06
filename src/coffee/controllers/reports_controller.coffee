app.controller 'ReportsController', ($scope, service, ToastService, Navigator, ReportsService) ->
  new class ReportsController
    send: (form) ->
      return unless form.$valid

      ReportsService.save(service_id: service.id, message: @message)
        .then (response) ->
          ToastService.show(response.message, 'bottom', false, 3000)
          Navigator.back()
        .catch($scope.error)
