app.controller 'SupportIssuesController',
  (
    $scope,
    SupportIssuesService,
    ToastService,
    APP_VERSION
  ) ->
    new class SupportIssuesController
      constructor: ->
        @support_issue = {}

      send: (form) ->
        return unless form.$valid

        device = ionic.Platform.device()

        @support_issue.app_version = APP_VERSION
        @support_issue.device_details = device

        SupportIssuesService.save(@support_issue).then (response) ->
          ToastService.show(response.message, 'bottom', false, 3500)

        $scope.navigator.home()
