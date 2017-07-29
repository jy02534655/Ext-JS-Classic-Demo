Ext.define('Ext.overrides.calendar.panel.Days', {
    override: 'Ext.calendar.panel.Days',

    updateView: function(view, oldView) {
        this.callParent([view, oldView]);
        view.on('eventrefresh', 'onEventRefresh', this);
    },

    privates: {
        onEventRefresh: function() {
            this.syncHeaders();
        }
    }
});