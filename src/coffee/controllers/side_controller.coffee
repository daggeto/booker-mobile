app.controller 'SideController',
  (
    $scope,
    $state,
    $ionicSlideBoxDelegate,
    $ionicPopup,
    translateFilter,
    UserServicesService,
    AppUpdateService
  ) ->
    new class SideController
      goToServiceSettings: ->
        return @showAlert() unless @currentUser().service

        $scope.navigator.go('service.service_settings', id:  @currentUser().service.id)

      showAlert: ->
        popup = $ionicPopup.confirm
          title: translateFilter('side.new_service.title')
          template: translateFilter('side.new_service.template')
          okText: @getServiceOkText()
          cancelText: translateFilter('close')

        popup.then (confirmed) =>
          return unless confirmed

          return $scope.navigator.go('login') if @currentUser().is_guest

          @createService()

      getServiceOkText: ->
        return translateFilter('login.login') if @currentUser().is_guest

        translateFilter('yes')

      createService: =>
        UserServicesService.save(confirmed: true).then(@goToService, $scope.error)

      confirmUpdate: ->
        popup = $ionicPopup.confirm
          title: translateFilter('side.update.confirm')
          okText: translateFilter('yes')
          cancelText: translateFilter('close')

        popup.then (confirmed) =>
          return unless confirmed

          AppUpdateService.checkForUpdate().then (updateAvailable) ->
            AppUpdateService.download() if updateAvailable

      goToService: (service) =>
        @currentUser().service = service
        $scope.navigator.go('service.service_settings', id: service.id)

      slideTo: (index, view) ->
        $ionicSlideBoxDelegate.slide(index)
        state.go(view, {movieid: 1})

      generateProfileImage: ->
        new Identicon(moment().format().toString(), size: 420, format: 'svg').toString()

      currentUser: ->
        $scope.context.currentUser
