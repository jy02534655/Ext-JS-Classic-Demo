/**
 * This is the window that allows field settings configuration.
 */
Ext.define('Ext.pivot.plugin.configurator.window.FieldSettings', {
    extend: 'Ext.pivot.plugin.configurator.window.Window',

    requires: [
        'Ext.form.field.Display'
    ],

    title:              'Field settings',

    formatText:         'Format as',
    summarizeByText:    'Summarize by',
    customNameText:     'Custom name',
    sourceNameText:     'Source name',
    alignText:          'Align',
    alignLeftText:      'Left',
    alignCenterText:    'Center',
    alignRightText:     'Right',

    field:              null,

    getSettingsForm: function(){
        var me = this,
            dataFormatters = [],
            dataAggregators = [],
            settings = me.field.getSettings(),
            formatters = settings.getFormatters(),
            renderers = settings.getRenderers(),
            fns = settings.getAggregators(),
            length, i, list;

        length = fns.length;
        for(i = 0; i < length; i++){
            dataAggregators.push([
                me.field.getAggText(fns[i]),
                fns[i]
            ]);
        }

        list = Ext.Object.getAllKeys(formatters || {});
        length = list.length;
        for(i = 0; i < length; i++){
            dataFormatters.push([
                list[i],
                formatters[list[i]],
                1
            ]);
        }

        list = Ext.Object.getAllKeys(renderers || {});
        length = list.length;
        for(i = 0; i < length; i++){
            dataFormatters.push([
                list[i],
                renderers[list[i]],
                2
            ]);
        }

        return Ext.apply(me.callParent(arguments), {
            items: [{
                xtype:      'displayfield',
                fieldLabel: me.sourceNameText,
                name:       'dataIndex'
            },{
                xtype:      'textfield',
                fieldLabel: me.customNameText,
                name:       'header',
                allowBlank: false
            },{
                xtype:      'combo',
                fieldLabel: me.alignText,
                editable:   false,
                queryMode:  'local',
                valueField: 'value',
                name:       'align',
                store: new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data: [
                        [me.alignLeftText, 'left'],
                        [me.alignCenterText, 'center'],
                        [me.alignRightText, 'right']
                    ]
                })
            },{
                xtype:      'combo',
                fieldLabel: me.formatText,
                editable:   false,
                queryMode:  'local',
                valueField: 'value',
                name:       'formatter',
                store: new Ext.data.ArrayStore({
                    fields: ['text', 'value', 'type'],
                    data:   dataFormatters
                })
            },{
                xtype:      'combo',
                fieldLabel: me.summarizeByText,
                editable:   false,
                queryMode:  'local',
                valueField: 'value',
                name:       'aggregator',
                store: new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data:   dataAggregators
                })
            }]
        });
    },

    beforeApplySettings: function(settings){
        var formatAs = this.down('[name=formatter]'),
            store, item;

        if(formatAs){
            store = formatAs.getStore();
            item = store.findRecord('value', settings.formatter, 0, false, true, true);
            if(item){
                if(item.get('type') == 1){
                    settings.formatter = item.get('value');
                    settings.renderer = null;
                }else{
                    settings.renderer = item.get('value');
                    settings.formatter = null;
                }
            }
        }
    },

    loadSettings: function(settings){
        var format = settings.formatter;

        if(Ext.isFunction(format)){
            format = null;
        }
        if(!format && !Ext.isFunction(settings.renderer)){
            format = settings.renderer;
        }
        settings.formatter = format;
        this.callParent([settings]);
    }
});