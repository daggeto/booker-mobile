app.factory 'IntervalsService', ($interval) ->
  new class IntervalsService
    constructor: ->
      @intervals = {};

    start: (name, intervalTime, callback) ->
      @intervals[name] = $interval(callback, intervalTime)

    stop: (name) ->
      $interval.cancel(@intervals[name])

      delete @intervals[name]
