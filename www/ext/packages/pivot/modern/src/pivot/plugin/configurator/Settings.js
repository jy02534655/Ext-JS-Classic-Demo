/**
 * This class implements the form that allows changing the pivot matrix settings.
 */
Ext.define('Ext.pivot.plugin.configurator.Settings', {
    extend: 'Ext.form.Panel',

    requires: [
        'Ext.pivot.plugin.configurator.store.Select',
        'Ext.pivot.plugin.configurator.SettingsController',
        'Ext.form.FieldSet',
        'Ext.field.Select',
        'Ext.layout.VBox',
        'Ext.layout.HBox',
        'Ext.TitleBar'
    ],

    xtype: 'pivotsettings',
    controller: 'pivotsettings',
    viewModel: {
        stores: {
            sLayout: {
                type: 'pivotselect'
            },
            sPositions: {
                type: 'pivotselect'
            },
            sYesNo: {
                type: 'pivotselect'
            }
        }
    },

    eventedConfig: {
        matrixProperties: null
    },

    listeners: {
        matrixpropertieschange: 'onMatrixPropertiesChanged'
    },

    defaults: {
        xtype:      'fieldset',
        defaults: {
            labelAlign: 'top'
        }
    },

    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },

    /**
     * @cfg
     * @inheritdoc
     */
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },

    titleText: 'Settings',
    okText: 'Ok',
    cancelText: 'Cancel',
    layoutText: 'Layout',
    outlineLayoutText: 'Outline',
    compactLayoutText: 'Compact',
    tabularLayoutText: 'Tabular',
    firstPositionText: 'First',
    hidePositionText: 'Hide',
    lastPositionText: 'Last',
    rowSubTotalPositionText: 'Row subtotal position',
    columnSubTotalPositionText: 'Column subtotal position',
    rowTotalPositionText: 'Row total position',
    columnTotalPositionText: 'Column total position',
    showZeroAsBlankText: 'Show zero as blank',
    yesText: 'Yes',
    noText: 'No',

    updateMatrixProperties: function(settings){
        var me = this,
            items;

        me.removeAll(true, true);
        if(!settings){
            return;
        }

        items = [{
            xtype:      'titlebar',
            docked:     'top',
            titleAlign: 'left',
            title:      me.titleText,
            items: [{
                text:   me.cancelText,
                align:  'right',
                ui:     'alt',
                handler:'cancelSettings'
            },{
                text:   me.okText,
                align:  'right',
                ui:     'alt',
                handler:'applySettings',
                margin: '0 0 0 5'
            }]
        },{
            label:          me.layoutText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'viewLayoutType',
            bind: {
                store:      '{sLayout}',
                value:      '{form.viewLayoutType}'
            }
        },{
            label:          me.rowSubTotalPositionText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'rowSubTotalsPosition',
            bind: {
                store:      '{sPositions}',
                value:      '{form.rowSubTotalsPosition}'
            }
        },{
            label:          me.columnSubTotalPositionText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'colSubTotalsPosition',
            bind: {
                store:      '{sPositions}',
                value:      '{form.colSubTotalsPosition}'
            }
        },{
            label:          me.rowTotalPositionText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'rowGrandTotalsPosition',
            bind: {
                store:      '{sPositions}',
                value:      '{form.rowGrandTotalsPosition}'
            }
        },{
            label:          me.columnTotalPositionText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'colGrandTotalsPosition',
            bind: {
                store:      '{sPositions}',
                value:      '{form.colGrandTotalsPosition}'
            }
        },{
            label:          me.showZeroAsBlankText,
            xtype:          'selectfield',
            autoSelect:     false,
            useClearIcon:   true,
            name:           'showZeroAsBlank',
            bind: {
                store:      '{sYesNo}',
                value:      '{form.showZeroAsBlank}'
            }
        }];

        me.add(items);
    }

});