app.directive('event', ->
  restrict: 'E'
  scope:
    event: '='
    reservation: '='
    name: '='
    avatar: '@'

  templateUrl: 'templates/components/event.html',

  link: (scope, element) ->
    element.on 'click', =>
      scope.$emit('onEventClick', event: scope.event, reservation: scope.reservation)
    element.find('img').on 'click', (event) =>
      scope.$emit('onEventAvatarClick', event: scope.event, reservation: scope.reservation)
      event.stopPropagation()

)
