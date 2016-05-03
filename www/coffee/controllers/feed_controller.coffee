class FeedController
  constructor: ($scope, UserService) ->
    @scope = $scope
    @UserService = UserService

    @loadServices()

    this

  loadServices: ->
    @UserService.query().$promise.then(((response) =>
      @services = response
    ), (refejcted) ->
      console.log('rejected')
    )

app.controller('FeedController', FeedController)
