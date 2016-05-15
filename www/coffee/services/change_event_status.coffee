app.factory('ChangeEventStatus', (Event) ->
  (event_id, service_id, status) =>
    Event.$r.update(id: event_id, service_id: service_id, status: status).$promise
)
