app.directive('searchResult', ->
  restrict: 'E',
  scope:
    service: '='

  templateUrl: 'templates/components/search_result.html'

  link: (scope, element) ->
    element.on('click', =>
      scope.$emit('serviceClick', event: scope.service)
    )
)
