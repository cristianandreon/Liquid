"use strict";

/* datepicker component definition */
(function(window, $) {
    var $document = $(window);
    var $body = $('body');
    var $html = $('html');
    var NS_DATEPICKER = 'jquery-datepicker';

    var Datepicker = function(element, options) {
        var properties;
        var $element = $(element);

        options = $.isPlainObject(options) ? options : {};
        properties = {
            options : $.extend({}, Datepicker.prototype.DEFAULTS, options),
            isMobile: $html.hasClass('mobile'),
            $elem : $element,
            $input: $element.find('.jquery-datepicker__input'),
            $panel: null,
            selectedDate: null,  /* store the selected date */
            displayMonth: null, /* store the currently displayed month */
            isCreated: false,
            isShown: false,
            isDateSelected: (options.date !== 'none')    /* indicator for date selection */
        };

        $.extend(this, properties);
        this.init();
    };

    Datepicker.prototype = {
        constructor: Datepicker,

        DEFAULTS: {
            lang: 'en',
            date: null,   /* date strings should be in YYYY-M-D format like '2017-1-3', or format like '+3d' */
            startDate: null,
            endDate: null,
            disabledDates: [],
            format: 'ddmmyy',
            position: 'below'   /* above or below the input field */
        },

        msg: {
            en: {
                months : ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'],
                days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
            }
        },
        
        init: function() {
            /* initialise internal date objects */
            this.initDateObj();

            /* initialise attached input field,
             * set to readonly to disable keyboard in mobile devices */
            this.$input.attr('readonly', 'readonly');
            if (this.isDateSelected) {
                this.updateInputfield(this.formatDateStr(this.selectedDate));
            }

            /* create container for mobile browsers */
            if (this.isMobile === true) {
                this.$container = $('<div>').addClass('jquery-datepicker__container').appendTo($body);
            }

            /* create datepicker view */
            this.updateView(this.selectedDate);
            if (this.isMobile === true) {
                this.$container.addClass('-is--hidden');
            } else {
                this.$panel.addClass('-is--hidden');
            }

            /* click on the input field will trigger datepicker*/
            this.attachToInput();

            this.isCreated = true;
        },

        initDateObj: function() {
            this.selectedDate = this.getDateObj(this.options.date);

            if (this.options.startDate) {
                this.startDate = this.getDateObj(this.options.startDate);
            }

            if (this.options.endDate) {
                this.endDate = this.getDateObj(this.options.endDate);
            }
        },

        updateView: function(dateObj) {
            var $header, $content, $table;

            $header = this.getHeader(this.msg[this.options.lang], dateObj);
            $content = this.getContent(this.msg[this.options.lang], dateObj);
            $table = $('<table>').addClass('jquery-datepicker__table').append($header, $content);

            /* create the panel */
            if (this.isCreated) {
                /* clean up before insert new child elements */
                this.$panel.empty().append($table);
            } else {
                this.$panel = $('<div>').addClass('jquery-datepicker__panel').append($table);
            }

            /* add special class in mobile devices */
            if (this.isMobile) {
                this.$panel.addClass('-device--mobile').appendTo(this.$container);
            } else {
                this.$panel.appendTo($body);
            }

            this.adjustPanelPosition();
            this.displayMonth = new Date(dateObj.getTime());

            /* update event handlers */
            this.registerEventHandlers();
        },

        getHeader: function(msg, dateObj) {
            var year, month;
            var $previous, $next, $title, $header;

            year = dateObj.getFullYear();
            month = dateObj.getMonth();

            $previous = $('<th>').addClass('jquery-datepicker__prev')
                        .append($('<span>').addClass('fa fa-chevron-left'));
            $next = $('<th>').addClass('jquery-datepicker__next')
                        .append($('<span>').addClass('fa fa-chevron-right'));
            $title = $('<th>').attr('colspan', '5').addClass('jquery-datepicker__title')
                        .append($('<span>').text(msg.months[month] + ' ' + year));
            $header = $('<thead>');

            $('<tr>').append($previous, $title, $next).appendTo($header);
            return $header;
        },

        getContent: function(msg, dateObj) {
            var year, month;
            var $content;
            var firstDay, i;
            var dayItems = [], dayItem;

            year = dateObj.getFullYear();
            month = dateObj.getMonth();

            /* create day names row */
            $content = $('<tr>');
            msg.days.forEach(function(name) {
                $content.append($('<td>').addClass('jquery-datepicker__dayName').append($('<span>').text(name)));
            });

            /* create elements for days of current month */
            if ((firstDay = new Date(year, month, 1).getDay()) === 0) {
                firstDay = 7;
            }
            for (i = 0; i < firstDay - 1; i++) {
                /* place empty cells before the first day */
                dayItems.push($('<td>').addClass('-is--disabled').append('<span>'));
            }
            for (i = 1; i <= this.getDaysOfMonth(month + 1, year); i++) {
                dayItem = $('<td>').addClass('jquery-datepicker__day').append($('<span>').text(i));

                /* add classes to selected date and disabled dates */
                if (this.isDateSelected &&
                    this.selectedDate.getFullYear() === year &&
                    this.selectedDate.getMonth() === month &&
                    this.selectedDate.getDate() === i) {
                    dayItem.addClass('-is--selected');
                }
                    if (this.startDate && (this.startDate.getTime() > new Date(year, month, i).getTime())) {
                    dayItem.addClass('-is--disabled');
                }
                if (this.endDate && (this.endDate.getTime() < new Date(year, month, i).getTime())) {
                    dayItem.addClass('-is--disabled');
                }

                dayItems.push(dayItem);
            }

            /* put day cells in order */
            for (i = 0; i < dayItems.length; i = i + 7) {
                $content = $content.add($('<tr>').append(dayItems.slice(i, i + 7)));
            }

            return $content;
        },

        getDaysOfMonth: function (month, year) {
            return (new Date(year, month, 0).getDate());
        },

        getDateObj: function(dateStr) {
            var dateObj, dateArray, now, op, num;

            if (!this.isDateSelected || !dateStr || typeof dateStr !== 'string') {
                /*  use today if no date is specified */
                now = new Date();
                dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else {
                op = dateStr.charAt(0);
                if (op === '+' || op === '-') {
                    /* format #1: -3d, +1d, etc */
                    num = parseInt(dateStr.slice(1, -1), 10);
                    now = new Date();
                    dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    if (isNaN(num)) {
                        num = 0;
                    }

                    switch (op) {
                        case '-':
                            dateObj.setDate(dateObj.getDate() - num);
                            break;
                        case '+':
                        default:
                            dateObj.setDate(dateObj.getDate() + num);
                            break;
                    }
                } else {
                    /* format #2: YYYY-M-D */
                    dateArray = dateStr.split('-');
                    dateObj = new Date(dateArray[0], parseInt(dateArray[1], 10) - 1, dateArray[2]);}
            }

            return dateObj;
        },

        formatDateStr: function(dateObj) {
            var year, fullYear, month, day, dateStr;

            year = (dateObj.getFullYear() + '').slice(-2);
            fullYear = dateObj.getFullYear() + '';
            month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
            day = ('0' + dateObj.getDate()).slice(-2);

            switch (this.options.format) {
                case 'yyyymmdd':
                    dateStr = fullYear + '/' + month + '/' + day;
                    break;
                case 'mmddyyyy':
                    dateStr = month + '/' + day + '/' + fullYear;
                    break;
                case 'ddmmyyyy':
                    dateStr = day + '/' + month + '/' + fullYear;
                    break;
                case 'yymmdd':
                    dateStr = year + '/' + month + '/' + day;
                    break;
                case 'mmddyy':
                    dateStr = month + '/' + day + '/' + year;
                    break;
                case 'ddmmyy':
                default:
                    dateStr = day + '/' + month + '/' + year;
                    break;
            }

            return dateStr;
        },

        registerEventHandlers: function() {
            var that = this;
            var $prevBtn = this.$panel.find('.jquery-datepicker__prev');
            var $nextBtn = this.$panel.find('.jquery-datepicker__next');
            var $dayItems = this.$panel.find('table td');

            $prevBtn.on('click', function(ev) {
                ev.stopPropagation();
                that.displayMonth = new Date(that.displayMonth.getFullYear(), that.displayMonth.getMonth() - 1, 1);
                that.updateView(that.displayMonth);
            });

            $nextBtn.on('click', function(ev) {
                ev.stopPropagation();
                that.displayMonth = new Date(that.displayMonth.getFullYear(), that.displayMonth.getMonth() + 1, 1);
                that.updateView(that.displayMonth);
            });

            $dayItems.on('click', function(ev) {
                var $this = $(this);
                ev.stopPropagation();

                /* ignore disabled dates */
                if ($this.hasClass('-is--disabled') || $this.hasClass('jquery-datepicker__dayName')) {
                    return false;
                }

                /* update classes */
                that.$panel.find('.-is--selected').removeClass('-is--selected');
                $this.addClass('-is--selected');

                /* update selectedDate object and associated input field value */
                that.selectedDate = that.getDateObj('' + that.displayMonth.getFullYear() + '-' +
                                    (that.displayMonth.getMonth() + 1) + '-' +
                                    $this.find('span').text());

                /* update input field value, and trigger change event */
                that.updateInputfield(that.formatDateStr(that.selectedDate));
                that.isDateSelected = true;
                that.hide();
            });
        },

        attachToInput: function() {
            var that = this;
            this.$input.on('click', function() {
                that.$input.blur(); /* prevent ios browsers to show the input caret */
                if (that.isShown === false){
                    that.show();
                }
            });
        },

        updateInputfield: function(str) {
            this.$input.val(str).trigger('change');
        },

        adjustPanelPosition: function() {
            var offset = this.$input.offset();

            if (this.isMobile === true) {
                /* for mobile browsers */
                this.$panel.width(this.$panel.find('table').width());
            } else {
                /* for desktop browsers */
                if (this.options.position === 'below') {
                    this.$panel.addClass('-position--below').removeClass('-position--above');
                    this.$panel.css({top: (offset.top + this.$input.outerHeight()), left: offset.left});
                } else {
                    this.$panel.addClass('-position--above').removeClass('-position--below');
                    this.$panel.css({bottom: ($document.height() - offset.top), left: offset.left});
                }
            }
            this.$panel.height(this.$panel.find('table').height());
        },

        show: function() {
            var that = this;

            /* clicking on other area of window will cause datepicker to hide */
            $document.click(function (ev) {
                if (!that.$input.is(ev.target) &&
                    !that.$panel.is(ev.target) && that.$panel.has(ev.target).length === 0) {
                    that.hide();
                }
            });

            /* add transition effect */
            if (this.isMobile) {
                this.$container.fadeIn(250, function() {
                    $body.css('cursor', 'pointer'); /* ios hack */
                    that.$container.removeClass('-is--hidden');
                });
            } else {
                this.$panel.fadeIn(250, function() {
                    that.$panel.removeClass('-is--hidden');
                });
            }

            /* re-calculate panel position */
            this.adjustPanelPosition();
            this.isShown = true;
        },

        hide: function() {
            var that = this;

            /* add transition effect */
            if (this.isMobile) {
                this.$container.fadeOut(250, function() {
                    $body.css('cursor', '');    /* ios hack */
                    that.$container.addClass('-is--hidden');
                });
            } else {
                this.$panel.fadeOut(250, function() {
                    that.$panel.addClass('-is--hidden');
                });
            }

            this.isShown = false;
        },

        /* APIs to set/get date object */
        get: function() {
            if (this.isDateSelected) {
                return this.selectedDate;
            } else {
                /* return null if no date is selected */
                return null;
            }
        },

        set: function(obj) {
            if (obj === null) {
                /* if null is passed, set datepicker to no date selected */
                this.isDateSelected = false;
                this.selectedDate = this.getDateObj();
                this.updateView(this.selectedDate);
                this.updateInputfield('');
            } else {
                /* assuming Date object is passed */
                this.isDateSelected = true;
                this.selectedDate = obj;
                this.updateView(this.selectedDate);
                this.updateInputfield(this.formatDateStr(this.selectedDate));
            }
        }
    };

    $.fn.datepicker = function(options) {
        var args = Array.prototype.slice.call(arguments);
        var ret;

        this.each(function() {
            var $this = $(this);
            var data = $this.data(NS_DATEPICKER);
            var func;
            var dataOpts;

            dataOpts = {
                date: $this.attr('data-selected-date'),
                startDate: $this.attr('data-start-date'),
                endDate: $this.attr('data-end-date'),
                format: $this.attr('data-format')
            };

            /* if no datepicker data, create one */
            if (!data) {
                $this.data(NS_DATEPICKER, (data = new Datepicker(this, $.extend({}, dataOpts, options))));
            }

            /* invoke function */
            if (typeof options === 'string' && typeof (func = data[options]) === 'function') {
                ret = func.apply(data, args.slice(1));
            }
        });

        return ret === undefined ? this : ret;
    };

    $.fn.datepicker.Constructor = Datepicker;

})(window, jQuery);