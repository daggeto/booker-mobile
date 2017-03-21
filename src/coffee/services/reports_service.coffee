app.factory 'ReportsService', (Report, AuthWrapper) ->
  new class ReportsService
    save: (params) ->
      AuthWrapper.wrap ->
        Report.$r.save(params).$promise
