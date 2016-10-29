app.factory 'ReportsService', (Report) ->
  new class ReportsService
    save: (params) ->
      Report.$r.save(params).$promise
