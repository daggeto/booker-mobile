app.directive('eventButton', ->
  restrict: 'E'
  scope:
    event: '='

  templateUrl: 'templates/components/buttons/event.html',

  link: (scope, element) ->
    element.on 'click', =>
      scope.$emit('onEventButtonClick', event: scope.event)
)
