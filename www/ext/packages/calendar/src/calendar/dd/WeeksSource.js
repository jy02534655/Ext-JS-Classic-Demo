/**
 * A source for events for {@link Ext.calendar.view.Weeks}.
 * 
 * @private
 */
Ext.define('Ext.calendar.dd.WeeksSource', {
    extend: 'Ext.drag.Source',

    requires: [
        'Ext.calendar.dd.WeeksProxy'
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
        var view = this.getView();

        info.event = view.getEvent(info.eventTarget);
        info.widget = view.getEventWidget(info.eventTarget);
        info.setData('calendar-event', info.event);
        info.view = view;
    },

    beforeDragStart: function(info) {
        return this.getView().handleChangeStart('drag', info.event);
    },

    onDragStart: function(info) {
        var view = info.view,
            cursor = info.cursor.current,
            cell = view.getCellByPosition(cursor.x, cursor.y),
            event = info.event;

        info.span = view.getEventDaysSpanned(event);
        info.startDate = view.getDateFromCell(cell);
        this.callParent([info]);
    },

    updateView: function(view) {
        if (view) {
            this.setHandle('.' + view.$eventCls);
            this.setElement(view.element);
        }
    },

    destroy: function() {
        this.setView(null);
        this.callParent();
    }
});