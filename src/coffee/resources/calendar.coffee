app.factory('Calendar', ($rootScope, moment)->
  class Calendar
    @dateTimeFormat = 'YYYY-MM-DD H:mm'
    dayFormat = 'D'
    weekDayFormat = 'dd'
    month = 'MMMM'

    constructor: (selectedDate) ->
      @currentDate = moment().startOf('day')
      @selectedDate = moment(selectedDate || @currentDate).startOf('day')
      @startOfWeek = moment(@currentDate).startOf('isoweek')
      @events = []
      @availableDays = {}
      @recalculateWeek()

    nextWeek: ->
      @startOfWeek.add(1 , 'week')
      @recalculateWeek()
      @selectDate(@selectedWeek[0].moment)

    previousWeek: ->
      @startOfWeek.subtract(1 , 'week')
      @recalculateWeek()
      @selectDate(@selectedWeek[0].moment)

    previousDay: ->
      @selectedDate = @selectedDate.subtract(1 , 'day')

      @previousWeek() unless @isInSelectedWeek(@selectedDate)

    nextDay: ->
      @selectedDate = @selectedDate.add(1 , 'day')

      @nextWeek() unless @isInSelectedWeek(@selectedDate)

    isInSelectedWeek: (date) ->
      date.isSameOrAfter(@selectedWeek[0].moment) && date.isSameOrBefore(@selectedWeek[6].moment)

    recalculateWeek: ->
      @selectedWeek = [0..6].map (index, i ) =>
        day = moment(@startOfWeek).add(i, 'day')
        {
          name: day.format(weekDayFormat)
          number: day.format(dayFormat)
          moment: day
          available: @availableDays[day.dayOfYear()] > 0
        }

    isDateSelected: (date)->
      @selectedDate.diff(date, 'days', true) == 0

    isCurrent: (date) ->
      @currentDate.diff(date, 'days', true) == 0

    selectDate: (date) ->
      @selectedDate = moment(date)
      $rootScope.$broadcast('onDateSelected', date: date)


    update: (params) ->
      @events = params.events if params.events
      @availableDays = params.available_days if params.available_days
      @recalculateWeek()
)
