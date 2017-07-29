/**
 * A target for events for the all day section of {@link Ext.calendar.view.Days}.
 * 
 * @private
 */
Ext.define('Ext.calendar.dd.DaysAllDayTarget', {
    extend: 'Ext.drag.Target',

    requires: [
        'Ext.calendar.util.Dom',
        'Ext.calendar.date.Range'
    ],

    config: {
        view: null
    },

    updateView: function(view) {
        if (view) {
            this.setElement(view.allDayContent);
        }
    },

    accepts: function(info) {
        return Ext.Array.contains(info.types, 'calendar-event-allday');
    },

    onDragMove: function(info) {
        var view = info.view,
            index;

        if (info.valid) {
            index = Ext.calendar.util.Dom.getIndexPosition(info.positions, info.cursor.current.x);
            view.selectRange(index, index + info.span - 1);
        }
        this.callParent([info]);
    },

    onDragLeave: function(info) {
        this.getView().clearSelected();
        this.callParent([info]);
    },

    onDrop: function(info) {
        var D = Ext.Date,
            view = info.view,
            event = info.event,
            index = Ext.calendar.util.Dom.getIndexPosition(info.positions, info.cursor.current.x),
            newStart = view.utcTimezoneOffset(D.add(view.dateInfo.full.start, D.DAY, index, true)),
            start = event.getStartDate(),
            before = newStart < start,
            difference = D.diff(before ? newStart : start, before ? start : newStart, D.DAY);

        if (before) {
            difference = -difference;
        }
  
        view.handleChange('drop', event, new Ext.calendar.date.Range(
            D.add(event.getStartDate(), D.DAY, difference, true),
            D.add(event.getEndDate(), D.DAY, difference, true)
        ), function() {
            view.clearSelected();
        });

        this.callParent([info]);
    },

    destroy: function() {
        this.setView(null);
        this.callParent();
    }
});