class FeedController
  constructor: ($scope, UserServicesService) ->
    @scope = $scope
    @UserServicesService = UserServicesService

    @refreshServices()

    this

  refreshServices: ->
    @currentPage = 1
    @loadServices((response) =>
      @services = response.services
      @anyMoreServices = response.more

      @scope.$broadcast('scroll.refreshComplete')
    )

  loadMoreServices: ->
    @currentPage++
    @loadServices((response) =>
      @services = @services.concat(response.services)
      @anyMoreServices = response.more

      @scope.$broadcast('scroll.infiniteScrollComplete')
    )

  loadServices: (handleResponse) ->
    params = { per_page: 3, page: @currentPage }

    @UserServicesService.findWithGet(params).then(handleResponse, @scope.error)

app.controller('FeedController', FeedController)
