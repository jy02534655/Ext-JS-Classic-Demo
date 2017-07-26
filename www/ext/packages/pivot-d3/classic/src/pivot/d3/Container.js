/**
 * This container can host D3 components that need a pivot configurator
 * plugin.
 */
Ext.define('Ext.pivot.d3.Container', {
    extend: 'Ext.pivot.d3.AbstractContainer',
    xtype: 'pivotd3container',

    config: {
        configurator: {
            id: 'configurator',
            ptype: 'pivotconfigurator'
        }
    },

    layout: 'fit',

    beforeRender: function(){
        this.addDrawing();
        this.callParent();
    }

});