app.factory 'Device', ($resource, API_URL) ->
  URL = "#{API_URL}/api/v1/device/"

  $r: $resource(URL)
