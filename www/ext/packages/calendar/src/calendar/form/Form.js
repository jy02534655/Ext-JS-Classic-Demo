/**
 * A base form implementation for data used with {@link Ext.calendar.model.Event}.
 * @abstract
 */
Ext.define('Ext.calendar.form.Form', {
    extend: 'Ext.calendar.form.AbstractForm',

    mixins: [
        'Ext.calendar.form.Base'
    ],

    /**
     * @cfg {Number[]} defaultStartTime
     * The default start time for events. Should be in the
     * format `[hour, minute]`.
     */
    defaultStartTime: [9, 0],

    /**
     * @cfg {Number[]} defaultEndTime
     * The default start time for events. Should be in the
     * format `[hour, minute]`.
     */
    defaultEndTime: [10, 0],

    initForm: function() {
        this.createItems();
    },

    consumeEventData: function() {
        var me = this,
            D = Ext.Date,
            view = me.getView(),
            event = me.getEvent(),
            start = event.getStartDate(),
            end = event.getEndDate(),
            allDay = event.getAllDay(),
            // Don't take into account the view TZ for allday events
            startDate = allDay ? D.utcToLocal(start) : view.utcToLocal(start),
            endDate = allDay ? D.utcToLocal(end) : view.utcToLocal(end),
            ignoreTimes = allDay || startDate.getTime() === endDate.getTime(),
            data = {
                calendarId: event.getCalendarId(),
                title: event.getTitle(),
                description: event.getDescription(),
                allDay: allDay,
                startDate: startDate,
                endDate: endDate
            }, editable;

        if (!ignoreTimes) {
            data.startTime = startDate;
            data.endTime = endDate;
        }

        if (allDay) {
            data.endDate = D.subtract(endDate, D.DAY, 1, true);
        }

        me.setDefaultTime(data, 'startTime', me.defaultStartTime);
        me.setDefaultTime(data, 'endTime', me.defaultEndTime);

        if (!data.calendarId) {
            editable = view.getEditableCalendars();
            if (editable.length) {
                data.calendarId = editable[0].id;
            }
        }

        return data;
    },

    produceEventData: function(values) {
        var D = Ext.Date,
            view = this.getView(),
            startTime = values.startTime,
            endTime = values.endTime,
            startDate = values.startDate,
            endDate = values.endDate,
            sYear = startDate.getFullYear(),
            sMonth = startDate.getMonth(),
            sDate = startDate.getDate(),
            eYear = endDate.getFullYear(),
            eMonth = endDate.getMonth(),
            eDate = endDate.getDate();

        if (values.allDay) {
            // All day events are always GMT.
            startDate = D.utc(sYear, sMonth, sDate);
            // midnight the next day
            endDate = D.add(D.utc(eYear, eMonth, eDate), D.DAY, 1, true);
            delete values.startTime;
            delete values.endTime;
        } else {
            startDate = view.toUtcOffset(new Date(sYear, sMonth, sDate, startTime.getHours(), startTime.getMinutes()));
            endDate = view.toUtcOffset(new Date(eYear, eMonth, eDate, endTime.getHours(), endTime.getMinutes()));
        }

        values.startDate = startDate;
        values.endDate = endDate;

        return values;
    },

    privates: {
        setDefaultTime: function(data, key, time) {
            if (!data[key]) {
                data[key] = new Date(2010, 0, 1, time[0], time[1]);
            }
        }
    }
});