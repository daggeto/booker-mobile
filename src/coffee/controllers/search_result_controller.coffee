app.controller 'SearchResultController', ($scope, $stateParams) ->
  new class SearchResultController
    constructor: ->
      @results = angular.fromJson($stateParams.results)

      $scope.$on 'resultsUpdate', @updateResults

    updateResults: (scope, data) =>
      @results = data.results
