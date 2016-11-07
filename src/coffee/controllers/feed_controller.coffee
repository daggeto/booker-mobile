app.controller 'FeedController', ($scope, $state, UserServicesService, BookingService) ->
  new class FeedController
    constructor: ->
      @bindListeners()

      @refreshServices()

    bindListeners: ->
      $scope.$on('bookEvent', (_, data) =>
        BookingService.book(data.event).then (response) =>
          @reloadService(response.service, data.index) if response
      )

    refreshServices: ->
      @currentPage = 1
      @loadServices((response) =>
        @services = response.services
        @anyMoreServices = response.more

        $scope.$broadcast('scroll.refreshComplete')
      )

    loadMoreServices: ->
      @currentPage++
      @loadServices((response) =>
        @services = @services.concat(response.services)
        @anyMoreServices = response.more

        $scope.$broadcast('scroll.infiniteScrollComplete')
      )

    loadServices: (handleResponse) ->
      params = { per_page: 3, page: @currentPage }

      UserServicesService.findWithGet(params).then(handleResponse, $scope.error)

    reloadService: (service, index) =>
      @services[index].nearest_event = service.nearest_event

    goTo: (state, params) ->
      $state.go(state, params)
