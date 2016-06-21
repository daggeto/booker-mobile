class ServiceSettingsController
  constructor:( $scope, $state, service, UserServicesService) ->
    [@scope, @state, @service, @UserServicesService] = arguments

    @scope.vm = this

    this

  durations: [
      { value: 15, label: '15 min' }
      { value: 30, label: '30 min' }
      { value: 45, label: '45 min' }
      { value: 60, label: '60 min' }
  ]

  save: ->
    @UserServicesService.update(@service).then(((response) =>
      @state.go('app.main')
    ), (refejcted) -> console.log('rejected'))

  showIosSaveButton: ->
    @scope.ios && @state.is('service.service_settings')

  back: ->
    @state.go('app.main')

app.controller('ServiceSettingsController', ServiceSettingsController)
