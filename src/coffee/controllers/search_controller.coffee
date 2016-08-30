class SearchController
  constructor: ($scope, $state, $ionicModal, UserServicesService) ->
    [@scope, @state, @ionicModal, @UserServicesService] = arguments

    @init()

    this

  init: ->
    @term = ''
    @scope.$watch 'vm.term', @watchTerm if @getData

    @scope.$on 'serviceClick', @serviceClick

  watchTerm: (newValue, oldValue) =>
    return if newValue == oldValue

    if newValue.length > @scope.minLength
      @searchServices(newValue).then (results) =>
        @goToResults(results.services) unless @state.is('app.main.search_results')

        @scope.$root.$broadcast('resultsUpdate', results: results.services)

        return
    else
      @results = []
    return

  searchServices: (value) ->
    @UserServicesService.findWithGet(action: 'search', term: value)

  goToResults: (services) ->
    @scope.$root.navigator.go('app.main.search_results', results: angular.toJson(services))

  serviceClick: (event, data) =>
    @scope.$root.navigator.go('book_service', id: data.service.id)


  back: ->
    @term = ''
    @scope.$root.navigator.back()

app.controller('SearchController', SearchController)
