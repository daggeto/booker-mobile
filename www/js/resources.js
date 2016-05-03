app.factory('Calendar', function(moment) {
  var Calendar;
  return Calendar = (function() {
    var dateFormat, dayFormat, month, weekDayFormat;

    dateFormat = 'YYYY-MM-DD';

    dayFormat = 'DD';

    weekDayFormat = 'ddd';

    month = 'MMMM';

    function Calendar() {
      this.currentDate = moment().startOf('day');
      this.selectedDate = moment(this.currentDate);
      this.startOfWeek = moment(this.currentDate).startOf('isoweek');
      this.recalculateWeek();
    }

    Calendar.prototype.nextWeek = function() {
      this.startOfWeek.add(1, 'week');
      return this.recalculateWeek();
    };

    Calendar.prototype.previousWeek = function() {
      this.startOfWeek.subtract(1, 'week');
      return this.recalculateWeek();
    };

    Calendar.prototype.recalculateWeek = function() {
      return this.selectedWeek = [0, 1, 2, 3, 4, 5, 6].map((function(_this) {
        return function(index, i) {
          var day;
          day = moment(_this.startOfWeek).add(i, 'day');
          return {
            name: day.format(weekDayFormat),
            number: day.format(dayFormat),
            moment: day
          };
        };
      })(this));
    };

    Calendar.prototype.month = function() {
      return this.startOfWeek.format('MMMM');
    };

    Calendar.prototype.isDateSelected = function(date) {
      return this.selectedDate.diff(date, 'days', true) === 0;
    };

    Calendar.prototype.isCurrent = function(date) {
      return this.currentDate.diff(date, 'days', true) === 0;
    };

    Calendar.prototype.selectDate = function(date) {
      return this.selectedDate = moment(date);
    };

    Calendar.prototype.toDateFormat = function(date) {
      return date.format(dateFormat);
    };

    return Calendar;

  })();
});

var Event;

Event = (function() {
  function Event($resource, API_URL) {
    this.$r = $resource(API_URL + "/api/v1/services/:service_id/events.json", {
      service_id: '@service_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
    this.$new = {
      description: '',
      status: '',
      start_at: '',
      end_at: ''
    };
    return this;
  }

  return Event;

})();

app.factory('Event', Event);

app.factory('UserService', function($resource, API_URL) {
  return $resource(API_URL + "/api/v1/services/:id.json", {
    id: '@id'
  }, {
    update: {
      method: 'PUT'
    }
  });
});
