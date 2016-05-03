class ServiceSettingsController
  constructor: ($scope, $state, $stateParams, UserService) ->
    @scope = $scope
    @state = $state
    @stateParams = $stateParams
    @UserService = UserService

    @loadService()

    this

  durations: [
      { value: 15, label: '15 min' }
      { value: 30, label: '30 min' }
      { value: 45, label: '45 min' }
      { value: 60, label: '60 min' }
  ]

  loadService: ->
    @UserService.get(@stateParams).$promise.then(((response) =>
      @service = response.service
    ), (refejcted) ->
      console.log('rejected')
    )

  save: ->
    @UserService.update(@service).$promise.then(((response) =>
      @state.go('service.calendar')
    ), (refejcted) -> console.log('rejected'))

  showIosSaveButton: ->
    @scope.ios && @state.is('service.service_settings')

  back: ->
    @state.go('app.main')

app.controller('ServiceSettingsController', ServiceSettingsController)
