/**
 * A base panel class for panels with a header a single view.
 * 
 * @private
 */
Ext.define('Ext.calendar.panel.AbstractBase', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.layout.container.Fit'
    ],

    layout: 'fit',

    // Appliers/Updaters
    updateDayHeader: function(dayHeader) {
        if (dayHeader) {
            this.addItem(dayHeader, 'dockedItems', 'addDocked');
        }
    },

    updateView: function(view) {
        this.addItem(view, 'items', 'add');
    },

    // Overrides
    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        this.callParent([width, height, oldWidth, oldHeight]);
        this.syncHeaders();
    },

    privates: {
        addItem: function(item, existing, addMethod) {
            var me = this,
                items = me[existing];

            if (items) {
                if (items.isMixedCollection) {
                    me[addMethod](item);
                } else {
                    if (!Ext.isArray(items)) {
                        items = [items];
                    }
                    me[existing] = items.concat(item);
                }
            } else {
                me[existing] = item;
            }
        },

        syncHeaders: function() {
            var me = this,
                header;

            if (me.syncHeaderSize) {
                header = me.getDayHeader();

                if (header && header.setOverflowWidth) {
                    header.setOverflowWidth(me.getView().scrollable.getScrollbarSize().width);
                }
            }
        }
    }
});