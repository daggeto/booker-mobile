app.factory 'SupportIssuesService', (SupportIssue) ->
  new class SupportIssuesService
    save: (params) ->
      SupportIssue.$r.save(params).$promise
