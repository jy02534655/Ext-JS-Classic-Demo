/**
 * This is the window that allows configuring a label filter
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.FilterLabel',{
    extend: 'Ext.pivot.plugin.configurator.window.Window',
    
    titleText:          'Label filter ({0})',
    fieldText:          'Show items for which the label',
    caseSensitiveText:  'Case sensitive',

    initComponent: function(){
        var me = this;

        me.callParent(arguments);
        me.setTitle(Ext.String.format(me.titleText, me.title));
    },

    getSettingsForm: function(){
        var me = this,
            items = me.filterFields || [];
        
        items.push({
            xtype:          'combo',
            editable:       false,
            queryMode:      'local',
            valueField:     'value',
            store:          me.store,
            name:           'operator',
            
            listeners: {
                change: function(combo, newValue){
                    var me = this,
                        hidden = me.isOperatorBetween(newValue);

                    me.down('#fValue').setVisible(!hidden);
                    me.down('#fValue').allowBlank = hidden;
                    me.down('#fFrom').setVisible(hidden);
                    me.down('#fFrom').allowBlank = !hidden;
                    me.down('#fTo').setVisible(hidden);
                    me.down('#fTo').allowBlank = !hidden;
                },
                scope:  me
            }
        },{
            itemId:     'fValue',
            xtype:      'textfield',
            margin:     '0 0 0 5',
            name:       'value'
        },{
            itemId:     'fFrom',
            xtype:      'textfield',
            margin:     '0 0 0 5',
            name:       'from'
        },{
            itemId:     'fTo',
            xtype:      'textfield',
            margin:     '0 0 0 5',
            name:       'to'
        });
        
        return Ext.apply(me.callParent(arguments), {
            items: [{
                xtype:  'hidden',
                name:   'type'
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
                    allowBlank: false,
                    flex:       1
                },

                items: items
            },{
                xtype:          'checkbox',
                boxLabel:       me.caseSensitiveText,
                name:           'caseSensitive'
            }]
        });
    },

    beforeApplySettings: function(settings){
        if(this.isOperatorBetween(settings.operator)){
            settings.value = [settings.from, settings.to];
        }
        delete(settings.from);
        delete(settings.to);

        settings.caseSensitive = (settings.caseSensitive === 'on');
        settings.topSort = (settings.topSort === 'on');
    },
    
    isOperatorBetween: function(operator){
        return Ext.Array.indexOf(['between', 'not between'], operator) >= 0;
    }
});