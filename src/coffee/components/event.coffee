app.directive('event', ->
  restrict: 'E'
  scope:
    event: '='
    target: '='
    avatar: '@'

  templateUrl: 'templates/components/event.html',

  link: (scope, element, attr) ->
    element.on 'click', =>
      scope.$emit('eventClicked', target: scope.target)
)
