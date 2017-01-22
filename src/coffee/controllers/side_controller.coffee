app.controller 'SideController',
  (
    $scope,
    $state,
    $ionicSlideBoxDelegate,
    $ionicPopup,
    translateFilter,
    currentUser,
    UserServicesService,
    AppUpdateService
  ) ->
    new class SideController
      constructor: ->
        @currentUser = currentUser

      providerSettingsClicked: ->
        return @showAlert() unless currentUser.service

        $scope.navigator.go('service.service_settings', id: currentUser.service.id)

      showAlert: ->
        popup = $ionicPopup.confirm
          title: translateFilter('side.new_service.title')
          template: translateFilter('side.new_service.template')
          okText: translateFilter('yes')
          cancelText: translateFilter('close')

        popup.then (confirmed) =>
          @createService() if confirmed

      createService: =>
        UserServicesService.save(confirmed: true).then(@goToService, $scope.error)

      confirmUpdate: ->
        popup = $ionicPopup.confirm
          title: translateFilter('side.update.confirm')
          okText: translateFilter('side.new_service.begin')
          cancelText: translateFilter('side.new_service.cancel')

        popup.then (confirmed) =>
          return unless confirmed

          AppUpdateService.download()

      goToService: (service) =>
        currentUser.service = service
        $scope.navigator.go('service.service_settings', id: service.id)

      slideTo: (index, view) ->
        $ionicSlideBoxDelegate.slide(index)
        state.go(view, {movieid: 1})
