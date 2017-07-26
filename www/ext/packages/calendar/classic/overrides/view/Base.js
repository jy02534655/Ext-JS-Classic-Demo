Ext.define('Ext.overrides.calendar.view.Base', {
    override: 'Ext.calendar.view.Base',

    constructor: function(config) {
        this.callParent([config]);
        this.initialized = true;
    },

    render: function(container, position) {
        var me = this;

        me.callParent([container, position]);
        if (me.initialized && !me.getRefOwner()) {
            me.refresh();
        }
    },

    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        this.callParent([width, height, oldWidth, oldHeight]);
        this.handleResize();
    },

    privates: {
        refreshEvents: function() {
            if (this.element.dom.offsetHeight === 0) {
                return;
            }
            this.callParent();
        }
    }
});