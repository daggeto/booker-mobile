app.directive('bookButton', ->
  restrict: 'E',
  scope:
    event: '='
    index: '='

  templateUrl: 'templates/components/book_button.html'

  link: (scope, element, attr) ->
    element.on('click', =>
      scope.$emit('bookEvent', {event: scope.event, index: scope.index})
    )
)
