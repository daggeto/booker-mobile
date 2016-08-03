app.directive('reservation', ->
  restrict: 'E'
  transclude: true

  scope:
    reservation: '='

  templateUrl: 'templates/components/reservation.html',

  link: (scope, element, attr) ->
    element.on 'click', =>
      scope.$emit('reservationClick', reservation: scope.reservation)
)
