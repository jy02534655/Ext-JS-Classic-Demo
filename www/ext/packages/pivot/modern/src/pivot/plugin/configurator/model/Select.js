/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.model.Select', {
    extend: 'Ext.data.Model',

    fields: [
        { name: 'text', type: 'string' },
        { name: 'value', type: 'auto' },
        { name: 'type', type: 'integer' }
    ]
});