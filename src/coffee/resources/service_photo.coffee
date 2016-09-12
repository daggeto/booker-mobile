app.factory 'ServicePhoto', ($resource, API_URL) ->
  new class ServicePhoto
    $r: $resource("#{API_URL}/api/v1/service_photos/:id.json",
          { service_id: '@service_id' },
          update: { method:'PUT' }
        )
