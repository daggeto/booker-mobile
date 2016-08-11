app.factory('Calendar', function(moment) {
  var Calendar;
  return Calendar = (function() {
    var dayFormat, month, weekDayFormat;

    Calendar.dateTimeFormat = 'YYYY-MM-DD H:mm';

    dayFormat = 'DD';

    weekDayFormat = 'ddd';

    month = 'MMMM';

    function Calendar(selectedDate) {
      this.currentDate = moment().startOf('day');
      this.selectedDate = moment(selectedDate || this.currentDate).startOf('day');
      this.startOfWeek = moment(this.currentDate).startOf('isoweek');
      this.events = [];
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

    Calendar.prototype.isDateSelected = function(date) {
      return this.selectedDate.diff(date, 'days', true) === 0;
    };

    Calendar.prototype.isCurrent = function(date) {
      return this.currentDate.diff(date, 'days', true) === 0;
    };

    Calendar.prototype.selectDate = function(date) {
      return this.selectedDate = moment(date);
    };

    return Calendar;

  })();
});

var Device;

Device = (function() {
  'use strict';
  function Device($resource, API_URL) {
    var URL;
    URL = API_URL + "/api/v1/device/";
    this.$r = $resource(URL);
    return this;
  }

  return Device;

})();

app.factory('Device', Device);

var Event;

Event = (function() {
  'use strict';
  function Event($resource, API_URL) {
    var URL, methods, params;
    this.FREE = 'free';
    this.PENDING = 'pending';
    this.BOOKED = 'booked';
    this.statuses = [
      {
        value: this.FREE,
        label: 'Free'
      }, {
        value: this.PENDING,
        label: 'Pending'
      }, {
        value: this.BOOKED,
        label: 'Booked'
      }
    ];
    URL = API_URL + "/api/v1/events/:id/:action.json";
    params = {
      id: '@id',
      action: '@action'
    };
    methods = {
      update: {
        method: 'PUT'
      },
      post: {
        method: 'POST'
      }
    };
    this.$r = $resource(URL, params, methods);
    this.$new = function() {
      return {
        description: '',
        status: 'free',
        start_at: '',
        end_at: ''
      };
    };
    return this;
  }

  return Event;

})();

app.factory('Event', Event);

var Reservation;

Reservation = (function() {
  'use strict';
  function Reservation($resource, API_URL) {
    var URL, methods, params;
    URL = API_URL + "/api/v1/reservations/:reservation_id/:action.json";
    params = {
      reservation_id: '@reservation_id',
      action: '@action'
    };
    methods = {
      post: {
        method: 'POST'
      }
    };
    this.$r = $resource(URL, params, methods);
    return this;
  }

  return Reservation;

})();

app.factory('Reservation', Reservation);

var ServicePhoto;

ServicePhoto = (function() {
  'use strict';
  function ServicePhoto($resource, API_URL) {
    this.$r = $resource(API_URL + "/api/v1/service_photos/:id.json", {
      service_id: '@service_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
    return this;
  }

  return ServicePhoto;

})();

app.factory('ServicePhoto', ServicePhoto);

var User;

User = (function() {
  'use strict';
  function User($resource, API_URL) {
    this.$r = $resource(API_URL + "/api/v1/users/:id.json", {
      id: '@id'
    });
    this.$a = $resource(API_URL + "/api/v1/users/:user_id/:assoc.json", {
      user_id: '@user_id',
      assoc: '@assoc'
    });
    this.$session = $resource(API_URL + "/user/:action.json", {
      id: '@id',
      action: '@action'
    });
    return this;
  }

  return User;

})();

app.factory('User', User);

var UserService;

UserService = (function() {
  'use strict';
  function UserService($resource, API_URL) {
    this.$r = $resource(API_URL + "/api/v1/services/:id.json", {
      id: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
    this.$events = $resource(API_URL + "/api/v1/services/:service_id/events/:action.json", {
      service_id: '@service_id',
      action: '@action'
    });
    this.$future_events = $resource(API_URL + "/api/v1/services/:service_id/events.json", {
      service_id: '@service_id'
    });
    this.$service_photos = $resource(API_URL + "/api/v1/services/:service_id/service_photos.json", {
      service_id: '@service_id'
    });
    return this;
  }

  return UserService;

})();

app.factory('UserService', UserService);
