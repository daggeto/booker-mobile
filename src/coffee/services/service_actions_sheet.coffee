app.factory 'ServiceActionsSheet',(
  $ionicActionSheet,
  Navigator,
  actionButtonFilter,
  translateFilter
) ->
  new class ServiceActionsSheet
    show: (service) ->
      $ionicActionSheet.show
        titleText: translateFilter('service.actions.title')
        buttons:
          [
            actionButtonFilter(
              translateFilter('service.actions.report'),
              'ion-flag',
              @onReport,
              service
            )
          ]
        buttonClicked: @buttonClicked

    onReport: (service) ->
      Navigator.go('book_service.reports', id: service.id)

    buttonClicked: (index, button) ->
      button.action(button.target)

      true
