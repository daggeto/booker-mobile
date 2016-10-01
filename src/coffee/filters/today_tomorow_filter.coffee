app.filter('todayTomorrow', (translateFilter) ->
  (date) ->
    moment(date).calendar(
      null,
      sameDay: '[' + translateFilter('date.today') + ']',
      nextDay: '[' + translateFilter('date.tomorrow') + ']',
      nextWeek: 'dddd',
      lastDay: '[' + translateFilter('date.yesterday') + ']',
      lastWeek: '[' + translateFilter('date.last') + '] dddd',
      sameElse: 'DD/MM/YYYY'
    )
)
