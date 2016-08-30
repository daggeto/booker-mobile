class SearchResultController
  constructor: ($scope, $stateParams) ->
    [@scope, @stateParams] = arguments

    @results = angular.fromJson(@stateParams.results)

    @scope.$on 'resultsUpdate', @updateResults

    this

  updateResults: (scope, data) =>
    @results = data.results
app.controller('SearchResultController', SearchResultController)
