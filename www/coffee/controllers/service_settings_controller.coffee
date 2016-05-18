class ServiceSettingsController
  constructor: ($scope, $state, $stateParams, UserServicesService) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserServicesService = UserServicesService

    @loadService()

    this

  durations: [
      { value: 15, label: '15 min' }
      { value: 30, label: '30 min' }
      { value: 45, label: '45 min' }
      { value: 60, label: '60 min' }
  ]

  loadService: ->
    @UserServicesService.findById(@stateParams.id).then(((response) =>
      @service = response
    ), (refejcted) ->
      console.log('rejected')
    )

  save: ->
    @UserServicesService.update(@service).then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) -> console.log('rejected'))

  showIosSaveButton: ->
    @scope.ios && @state.is('service.service_settings')

  back: ->
    @state.go('app.main')

app.controller('ServiceSettingsController', ServiceSettingsController)
