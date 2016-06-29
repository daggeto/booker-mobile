app.directive('calendar', ->
  restrict: 'E'
  scope: {}
  controller: 'ServiceCalendarController'
  controllerAs: "vm"
  bindToController:
    service: '='
  templateUrl: 'templates/components/calendar.html'
)
