/**
 * This is the window that allows configuring a top10 value filter
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.FilterTop',{
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    
    titleText:      'Top 10 filter ({0})',
    fieldText:      'Show',
    sortResultsText:'Sort results',

    initComponent: function(){
        var me = this;

        me.callParent(arguments);
        me.setTitle(Ext.String.format(me.titleText, me.title));
    },

    getSettingsForm: function(){
        var me = this,
            items = [];
            
        items.push({
            xtype:          'combo',
            editable:       false,
            queryMode:      'local',
            valueField:     'value',
            store:          me.storeTopOrder,
            name:           'topOrder'
        },{
            xtype:          'textfield',
            margin:         '0 0 0 5',
            name:           'value'
        },{
            xtype:          'combo',
            margin:         '0 0 0 5',
            editable:       false,
            queryMode:      'local',
            valueField:     'value',
            store:          me.storeTopType,
            name:           'topType'
        },{
            xtype:          'combo',
            margin:         '0 0 0 5',
            editable:       false,
            queryMode:      'local',
            valueField:     'value',
            store:          me.storeAgg,
            name:           'dimensionId'
        });
        
        return Ext.apply(me.callParent(arguments), {
            defaults: {
                allowBlank: false
            },

            items: [{
                xtype:  'hidden',
                name:   'type'
            },{
                xtype:  'hidden',
                name:   'operator'
            },{
                xtype:          'fieldcontainer',
                labelSeparator: '',
                fieldLabel:     me.fieldText,
                labelAlign:     'top',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },

                defaults: {
                    flex:       1,
                    allowBlank: false
                },

                items: items
            },{
                xtype:          'checkbox',
                boxLabel:       me.sortResultsText,
                name:           'topSort'
            }]
        });
    }
});