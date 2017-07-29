/**
 * A source for events for the all day section of {@link Ext.calendar.view.Days}.
 * 
 * @private
 */
Ext.define('Ext.calendar.dd.DaysAllDaySource', {
    extend: 'Ext.drag.Source',

    requires: [
        'Ext.calendar.dd.WeeksProxy',
        'Ext.calendar.util.Dom'
    ],

    activateOnLongPress: 'touch',

    config: {
        proxy: {
            type: 'calendar-weeks',
            width: 200
        },
        view: null
    },

    describe: function(info) {
        var view = this.getView(),
            event = view.getEvent(info.eventTarget);

        info.event = event;
        info.widget = view.getEventWidget(event);
        info.setData('calendar-event-allday', event);
        info.view = view;
    },

    beforeDragStart: function(info) {
        return this.getView().handleChangeStart('drag', info.event);
    },

    updateView: function(view) {
        if (view) {
            this.setHandle('.' + view.$eventCls);
            this.setElement(view.allDayContent);
        }
    },

    destroy: function() {
        this.setView(null);
        this.callParent();
    },

    privates: {
        setup: function(info) {
            this.callParent([info]);

            var view = info.view,
                event = info.event,
                positions = Ext.calendar.util.Dom.extractPositions(view.backgroundCells, 'getX');

            info.index = Ext.calendar.util.Dom.getIndexPosition(positions, info.cursor.current.x);
            info.positions = positions;
            info.span = view.getEventDaysSpanned(event);
        }
    }
});