app.directive('event', ->
  restrict: 'E'
  scope:
    event: '='
    name: '='
    target: '='
    avatar: '@'

  templateUrl: 'templates/components/event.html',

  link: (scope, element) ->
    element.on 'click', =>
      scope.$emit('onEventClick', target: scope.target)
    element.find('img').on 'click', (event) =>
      scope.$emit('onEventAvatarClick', target: scope.target)
      event.stopPropagation()

)
