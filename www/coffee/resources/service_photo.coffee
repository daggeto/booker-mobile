class ServicePhoto
  'use strict'

  constructor: ($resource, API_URL) ->
    @$r = $resource("#{API_URL}/api/v1/services/:service_id/service_photos.json",
      { service_id: '@service_id' },
      update: { method:'PUT' }
    )

    return this

app.factory('ServicePhoto', ServicePhoto)
