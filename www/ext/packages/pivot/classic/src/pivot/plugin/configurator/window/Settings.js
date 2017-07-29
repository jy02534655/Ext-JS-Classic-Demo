/**
 * This is the window that allows pivot matrix settings configuration.
 */
Ext.define('Ext.pivot.plugin.configurator.window.Settings', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',

    requires: [
        'Ext.form.field.Display'
    ],

    title: 'Settings',

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

    getSettingsForm: function(){
        var me = this,
            storePositions = {
                type: 'array',
                fields: ['text', 'value'],
                data: [
                    [me.firstPositionText, 'first'],
                    [me.hidePositionText, 'none'],
                    [me.lastPositionText, 'last']
                ]
            };

        return Ext.apply(me.callParent(arguments), {
            items: [{
                xtype: 'combo',
                fieldLabel: me.layoutText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'viewLayoutType',
                store: {
                    type: 'array',
                    fields: ['text', 'value'],
                    data: [
                        [me.outlineLayoutText, 'outline'],
                        [me.compactLayoutText, 'compact'],
                        [me.tabularLayoutText, 'tabular']
                    ]
                }
            }, {
                xtype: 'combo',
                fieldLabel: me.rowSubTotalPositionText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'rowSubTotalsPosition',
                store: storePositions
            }, {
                xtype: 'combo',
                fieldLabel: me.columnSubTotalPositionText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'colSubTotalsPosition',
                store: storePositions
            }, {
                xtype: 'combo',
                fieldLabel: me.rowTotalPositionText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'rowGrandTotalsPosition',
                store: storePositions
            }, {
                xtype: 'combo',
                fieldLabel: me.columnTotalPositionText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'colGrandTotalsPosition',
                store: storePositions
            }, {
                xtype: 'combo',
                fieldLabel: me.showZeroAsBlankText,
                editable: false,
                queryMode: 'local',
                valueField: 'value',
                name: 'showZeroAsBlank',
                store: {
                    type: 'array',
                    fields: ['text', 'value'],
                    data: [
                        [me.yesText, true],
                        [me.noText, false]
                    ]
                }
            }]
        });
    }
});