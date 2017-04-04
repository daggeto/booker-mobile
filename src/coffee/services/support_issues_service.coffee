app.factory 'SupportIssuesService', (SupportIssue, AuthWrapper) ->
  new class SupportIssuesService
    save: (params) ->
      AuthWrapper.wrap ->
        SupportIssue.$r.save(params).$promise
