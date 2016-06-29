app.directive('bookButton', ->
  restrict: 'E',
  scope: {
    event: '='
  }
  templateUrl: 'templates/components/book_button.html'

  link: (scope, element, attr) ->
    element.on('click', =>
      scope.$emit('booked', {event: scope.$eval(attr.event)})
    )
)
