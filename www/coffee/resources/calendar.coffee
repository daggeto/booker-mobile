app.factory('Calendar', (moment)->
  class Calendar
    @dateTimeFormat = 'YYYY-MM-DD H:mm'
    dayFormat = 'DD'
    weekDayFormat = 'ddd'
    month = 'MMMM'

    constructor: ->
      @currentDate = moment().startOf('day')
      @selectedDate = moment(@currentDate)
      @startOfWeek = moment(@currentDate).startOf('isoweek')
      @events = []
      @recalculateWeek()

    nextWeek: ->
      @startOfWeek.add(1 , 'week')
      @recalculateWeek()

    previousWeek: ->
      @startOfWeek.subtract(1 , 'week')
      @recalculateWeek()

    recalculateWeek: ->
      @selectedWeek = [0..6].map (index, i ) =>
        day = moment(@startOfWeek).add(i, 'day')
        {
          name: day.format(weekDayFormat)
          number: day.format(dayFormat)
          moment: day
        }

    isDateSelected: (date)->
      @selectedDate.diff(date, 'days', true) == 0

    isCurrent: (date) ->
      @currentDate.diff(date, 'days', true) == 0

    selectDate: (date) ->
      @selectedDate = moment(date)
)
