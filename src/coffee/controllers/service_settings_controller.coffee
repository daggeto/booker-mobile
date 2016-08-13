class ServiceSettingsController
  constructor:($scope, $state, service, ionicToast, UserServicesService) ->
    [@scope, @state, @service, @ionicToast, @UserServicesService] = arguments

    this

  durations: [
      { value: 15, label: '15 min' }
      { value: 30, label: '30 min' }
      { value: 45, label: '45 min' }
      { value: 60, label: '60 min' }
  ]

  save: ->
    @UserServicesService.update(@service).then(@afterSave, @scope.error)

  afterSave: (response) =>
    @scope.navigator.home(reload: true)

  togglePublication: ->
    return @UserServicesService.unpublish(@service.id) unless @service.published

    @UserServicesService.publish(@service.id)
      .then(@togglePublicationSuccess)
      .catch(@togglePublicationFail)

  togglePublicationSuccess: (response) =>
    @ionicToast.show('Your service will be visible in feed now.', 'bottom', true, 3000);

  togglePublicationFail: (response) =>
    @ionicToast.show(response.data.errors[0], 'bottom', true, 3000);
    @service = response.data.service

app.controller('ServiceSettingsController', ServiceSettingsController)
