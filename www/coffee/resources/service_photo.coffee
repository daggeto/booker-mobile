class ServicePhoto
  'use strict'

  constructor: ($resource, API_URL) ->
    @$r = $resource("#{API_URL}/api/v1/service_photos/:id.json",
      { service_id: '@service_id' },
      update: { method:'PUT' }
    )

    return this

app.factory('ServicePhoto', ServicePhoto)
