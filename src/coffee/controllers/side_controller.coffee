class SideController
  constructor: ($scope,
                $state,
                $ionicSlideBoxDelegate,
                $ionicPopup,
                currentUser,
                UserServicesService) ->
    [
      @scope,
      @state,
      @ionicSlideBoxDelegate,
      @ionicPopup,
      @currentUser,
      @UserServicesService
    ] = arguments

    this

  providerSettingsClicked: ->
    return @showAlert() unless @currentUser.service

    @scope.navigator.go('service.service_settings', id: @currentUser.service.id)

  showAlert: ->
    popup = @ionicPopup.confirm
      title: 'Start to sell your time!',
      template: 'Here you can setup your service information and your time when you are available.'
      okText: 'Create Service'

    popup.then (confirmed) =>
      @createService() if confirmed

  createService: =>
    @UserServicesService.save(confirmed: true).then(@goToService, @scope.error)

  goToService: (service) =>
    @currentUser.service = service
    @scope.navigator.go('service.service_settings', id: service.id)

  slideTo: (index, view) ->
    @ionicSlideBoxDelegate.slide(index)
    @state.go(view, {movieid: 1});

  isServicePublished: ->
    @currentUser.service.published

  publicationText: ->
    return 'Published' if @currentUser.service.published

    'Unpublished'

app.controller('SideController', SideController)
