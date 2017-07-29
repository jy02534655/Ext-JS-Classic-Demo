/**
 * A source for events for the body of {@link Ext.calendar.view.Days}.
 * 
 * @private
 */
Ext.define('Ext.calendar.dd.DaysBodySource', {
    extend: 'Ext.drag.Source',

    requires: [
        'Ext.calendar.dd.DaysProxy',
        'Ext.calendar.util.Dom'
    ],

    activateOnLongPress: 'touch',

    config: {
        proxy: {
            type: 'calendar-days'
        },
        view: null
    },

    describe: function(info) {
        var view = this.getView();

        info.event = view.getEvent(info.eventTarget);
        info.widget = view.getEventWidget(info.event);
        info.setData('calendar-event', info.event);
        info.view = view;
    },

    beforeDragStart: function(info) {
        var cls = this.getView().$resizerCls;

        if (Ext.fly(info.eventTarget).hasCls(cls)) {
            return false;
        }

        return this.getView().handleChangeStart('drag', info.event);
    },

    updateView: function(view) {
        var me = this;

        if (view) {
            me.setHandle('.' + view.$eventCls);
            me.setElement(view.bodyWrap);
            me.setConstrain({
                snap: {
                    x: me.snapX,
                    y: me.snapY
                }
            });
        }
    },

    onDragStart: function(info) {
        this.callParent([info]);
        info.widget.element.hide();
    },

    onDragEnd: function(info) {
        this.callParent([info]);
        var w = info.widget;
        if (!w.destroyed && !info.deferCleanup) {
            w.element.show();
        }
    },

    destroy: function() {
        this.setView(null);
        this.callParent();
    },

    privates: {
        startMarginName: 'left',

        setup: function(info) {
            this.callParent([info]);

            var view = info.view,
                days = view.getVisibleDays(),
                positions = [],
                i;

            for (i = 0; i < days; ++i) {
                positions.push(Ext.fly(view.getEventColumn(i)).getX());
            }

            info.sizes = {
                height: info.proxy.element.getHeight(),
                slotStyle: view.getSlotStyle(),
                margin: view.getEventStyle().margin,
                startPositions: positions,
                startOffset: info.cursor.initial.y - info.widget.element.getY()
            };
        },

        snapX: function(info, x) {
            var sizes = info.sizes,
                positions = sizes.startPositions,
                index = Ext.calendar.util.Dom.getIndexPosition(positions, x);

            info.dayIndex = index;
            // Scope not "this"
            return positions[index] + sizes.margin[info.source.startMarginName];
        },

        snapY: function(info, y) {
            var sizes = info.sizes,
                view = info.view,
                bodyOffset = view.bodyTable.getY(),
                halfHeight = sizes.slotStyle.halfHeight,
                maxSlots = view.maxSlots,
                offsetY = Math.max(0, y - sizes.startOffset - bodyOffset);


            y = bodyOffset + sizes.margin.top + Ext.Number.roundToNearest(offsetY, halfHeight);
            return Math.min(y, bodyOffset + maxSlots * halfHeight - sizes.height);
        }
    }
});