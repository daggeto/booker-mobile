app.factory 'SupportIssue', ($resource, API_URL) ->
  URL = "#{API_URL}/api/v1/support_issues/"

  $r: $resource(URL)
