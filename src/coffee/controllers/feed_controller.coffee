class FeedController
  constructor: ($scope, $state, UserServicesService) ->
    [@scope, @state, @UserServicesService] = arguments

    @bindListeners()

    @refreshServices()

    this

  bindListeners: ->
    @scope.$on('booked', (event, data) ->

    )

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

  goTo: (state, params) ->
    @state.go(state, params)

app.controller('FeedController', FeedController)
