/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.window.Window', {
    extend: 'Ext.window.Window',

    requires: [
        'Ext.form.Panel',
        'Ext.form.FieldContainer',
        'Ext.form.field.Text',
        'Ext.form.field.Hidden',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.HBox'
    ],

    modal:          true,
    closeAction:    'destroy',

    initComponent: function(){
        var me = this;

        Ext.apply(me, {
            layout:     'fit',

            items: [
                me.getSettingsForm()
            ],

            buttons: [{
                text:       Ext.Msg.buttonText.ok,
                handler:    me.applySettings,
                scope:      me
            },{
                text:       Ext.Msg.buttonText.cancel,
                handler:    me.cancelSettings,
                scope:      me
            }]
        });

        return me.callParent(arguments);
    },

    /**
     * @method
     * Override to change settings before applying them. Return false to cancel changes.
     *
     * @param {Object} settings
     */
    beforeApplySettings: Ext.emptyFn,

    /**
     * Override to supply own form for settings
     */
    getSettingsForm: function(){
        return {
            xtype:      'form',
            bodyPadding:5,
            items:      []
        };
    },

    loadSettings: function(settings){
        var form = this.down('form');

        if(form){
            form.getForm().setValues(settings || {});
        }
    },

    applySettings: function(){
        var form = this.down('form'),
            settings;

        if(form && form.getForm().isValid()) {
            settings = form.getForm().getValues();
            if(this.beforeApplySettings(settings) !== false){
                if(this.fireEvent('applysettings', this, settings) !== false){
                    this.cancelSettings();
                }
            }
        }
    },

    cancelSettings: function(){
        this.close();
    }
});