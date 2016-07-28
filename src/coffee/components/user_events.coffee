app.directive('userEvents', ->
  restrict: 'E'
  transclude: true
  scope:
    events: '='
    onEventClick: '&'
  templateUrl: 'templates/components/user_events.html'
)
