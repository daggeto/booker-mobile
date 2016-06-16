class FeedController
  constructor: ($scope, UserServicesService) ->
    @scope = $scope
    @UserServicesService = UserServicesService

    @loadServices()

    this

  loadServices: ->
    @UserServicesService.find().then(((response) =>
      @services = response
    ), (refejcted) ->
      console.log('rejected')
    )

app.controller('FeedController', FeedController)
