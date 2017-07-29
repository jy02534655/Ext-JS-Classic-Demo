/**
 * This class extends the dimension item to be able to provide additional settings in the configurator plugin.
 */
Ext.define('Ext.pivot.plugin.configurator.Field', {
    extend: 'Ext.pivot.dimension.Item',

    requires: [
        'Ext.pivot.plugin.configurator.FieldSettings'
    ],

    config: {
        /**
         * The CellEditing plugin uses an `editor` config on the dimension
         * to be able to set the editor for the aggregate dimensions.
         * When the CellEditing plugin is used together with the Configurator
         * plugin then this config is lost if the dimensions are reconfigured.
         * @private
         */
        editor: null,
        /**
         * @cfg {Ext.pivot.plugin.configurator.FieldSettings} settings
         *
         * Define special restrictions or configurations for this field.
         */
        settings: {}
    },

    isField: true,

    clone: function(){
        return new Ext.pivot.plugin.configurator.Field(Ext.applyIf({id: Ext.id()}, this.getInitialConfig()));
    },

    getConfiguration: function(serializable){
        var cfg = this.callParent([serializable]);

        if(cfg.settings) {
            cfg.settings = cfg.settings.getConfig();
        }

        return cfg;
    },

    updateAggregator: function(agg, oldAgg){
        var settings, fns;

        this.callParent([agg, oldAgg]);
        if(agg) {
            settings = this.getSettings();
            fns = settings.getAggregators();
            if(fns.length === 0) {
                Ext.Array.remove(settings.getAllowed(), 'aggregate');
            } else {
                Ext.Array.include(fns, agg);
            }
        }
    },

    getSettings: function(){
        var ret = this.settings;

        if(!ret){
            ret = new Ext.pivot.plugin.configurator.FieldSettings({});
            this.setSettings(ret);
        }

        return ret;
    },

    applySettings: function(settings, obj){

        if(settings == null || (settings && settings.isFieldSettings)){
            return settings;
        }

        if(settings){
            if(!obj){
                obj = this.getSettings();
            }

            obj.setConfig(settings);
        }

        if(obj){
            this.setAggregator(this.getAggregator());
        }

        return obj;
    },

    getFieldText: function(){
        var header = this.getHeader();

        if(this.isAggregate){
            header += ' (' + this.getAggText() + ')';
        }

        return header;
    },

    getAggText: function(fn){
        var Agg = Ext.pivot.Aggregators,
            f = fn || this.getAggregator();

        if(Ext.isFunction(f)){
            return Agg.customText;
        }

        return Agg[f + 'Text'] || Agg.customText;
    }
});