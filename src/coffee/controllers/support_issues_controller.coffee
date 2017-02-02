app.controller 'SupportIssuesController',
  (
    $scope,
    SupportIssuesService,
    ToastService,
    LoggerService,
    translateFilter
  ) ->
    new class SupportIssuesController
      constructor: ->
        @support_issue = {}

      send: (form) ->
        return unless form.$valid

        LoggerService.sendMessage(@support_issue.message, level: 'info')
        ToastService.show(translateFilter('support_issue.message_sent'), 'bottom', false, 3500)

        $scope.navigator.home()
