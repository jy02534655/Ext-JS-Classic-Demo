/**
 * @private
 */
Ext.define('Ext.pivot.plugin.rangeeditor.Panel', {
    extend: 'Ext.form.Panel',

    requires: [
        'Ext.pivot.plugin.rangeeditor.PanelController',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.field.Number',
        'Ext.layout.VBox',
        'Ext.TitleBar',
        'Ext.Button'
    ],

    xtype: 'pivotrangeeditor',
    controller: 'pivotrangeeditor',

    viewModel: {
        stores: {
            sTypes: {
                type: 'array',
                fields: ['value', 'text'],
                autoDestroy: true
            }
        }
    },

    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },

    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },

    titleText:      'Range editor',
    valueText:      'Value',
    fieldText:      'Source field is "{form.dataIndex}"',
    typeText:       'Type',
    okText:         'Ok',
    cancelText:     'Cancel',

    initialize: function(){
        var me = this;

        me.add([{
            xtype: 'titlebar',
            docked: 'top',
            title: me.titleText,
            titleAlign: 'left',
            items: [{
                text: me.cancelText,
                align: 'right',
                ui: 'alt',
                handler: 'cancelSettings'
            },{
                text: me.okText,
                align: 'right',
                ui: 'alt',
                handler: 'applySettings',
                margin: '0 0 0 5'
            }]
        }, {
            xtype: 'fieldset',
            bind: {
                instructions: me.fieldText
            },

            defaults: {
                labelAlign: 'top'
            },

            items: [{
                label: me.typeText,
                xtype: 'selectfield',
                autoSelect: false,
                useClearIcon: true,
                bind: {
                    store: '{sTypes}',
                    value: '{form.type}'
                }
            },{
                label: me.valueText,
                xtype: 'numberfield',
                bind: '{form.value}'
            }]
        }]);

        return me.callParent();
    }
});