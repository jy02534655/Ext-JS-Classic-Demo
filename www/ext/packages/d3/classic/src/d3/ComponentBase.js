/**
 * @private
 * Classic.
 */
Ext.define('Ext.d3.ComponentBase', {
    extend: 'Ext.Widget',

    onElementResize: function (element, size) {
        this.handleResize(size);
    },

    destroy: function () {
        var me = this;

        if (me.hasListeners.destroy) {
            // This is consistent with Modern Component - `destroy` event is fired
            // _before_ component is destroyed, but not with Classic Component, where
            // the `destroy` event is fired _after_ component is destroyed.
            me.fireEvent('destroy', me);
        }

        me.callParent();
    }

});