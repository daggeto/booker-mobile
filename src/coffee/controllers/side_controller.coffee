class SideController
  constructor: ($scope, $state, $ionicSlideBoxDelegate, $ionicPopup, currentUser, UsersService) ->
    @page= 'Side'

    @scope = $scope
    @state = $state
    @ionicSlideBoxDelegate = $ionicSlideBoxDelegate
    @ionicPopup = $ionicPopup

    @currentUser = currentUser
    @UsersService = UsersService

    this

  providerSettingsClicked: ->
    return @showAlert() unless @currentUser.service

    @state.go('service.service_settings', id: @currentUser.service.id)

  showAlert: ->
    @ionicPopup.alert
     title: 'Hey!',
     template: 'You must enable provider toggle first'

  toggleChange: =>
    @UsersService.toggleProviderSettings(@currentUser.id, @currentUser.provider).then (user) =>
      @currentUser = user

  slideTo: (index, view) ->
    @ionicSlideBoxDelegate.slide(index)
    @state.go(view, {movieid: 1});

app.controller('SideController', SideController)
