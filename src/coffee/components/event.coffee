app.directive('event', ->
  restrict: 'E'
  transclude: true

  scope:
    event: '='
    onEventClick: '&'

  templateUrl: 'templates/components/event.html',

  link: (scope, element, attr) ->
    element.on 'click', =>
      scope.$emit('eventClick', event: scope.event)
)
