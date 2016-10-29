app.directive('serviceActions', (ServiceActionsSheet) ->
  restrict: 'E',
  scope:
    service: '='
  templateUrl: 'templates/components/service_actions.html'
  link: (scope, element) ->
    element.on 'click', =>
      ServiceActionsSheet.show(scope.service)
)
