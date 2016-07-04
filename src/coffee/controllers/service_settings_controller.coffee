class ServiceSettingsController
  constructor:($scope, $state, service, UserServicesService) ->
    [@scope, @state, @service, @UserServicesService] = arguments

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

app.controller('ServiceSettingsController', ServiceSettingsController)
