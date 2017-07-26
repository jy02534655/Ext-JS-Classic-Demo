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
            type: 'pivotconfigurator'
        }
    },

    layout: 'fit',

    initialize: function(){
        this.addDrawing();
        this.callParent();
    }

});