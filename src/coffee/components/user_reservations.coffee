app.directive('userReservations', ->
  restrict: 'E'
  transclude: true
  scope:
    reservations: '='
  templateUrl: 'templates/components/user_reservations.html'
)
