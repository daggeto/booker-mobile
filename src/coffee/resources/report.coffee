app.factory 'Report', ($resource, API_URL) ->
  new class Report
    URL = "#{API_URL}/api/v1/services/:service_id/reports.json"

    $r: $resource(URL, service_id: '@service_id')

