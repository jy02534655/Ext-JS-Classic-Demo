/**
 * This is the base class for an exporter plugin. It is extended by the exporter plugins
 * for grid panel and pivot grid.
 *
 * This could be used to create a plugin that allows a component to export tabular data.
 *
 * @private
 */
Ext.define('Ext.exporter.Plugin', {
    extend: 'Ext.plugin.Abstract',

    alias: [
        'plugin.exporterplugin'
    ],

    requires: [
        'Ext.exporter.data.Table',
        'Ext.exporter.Excel'
    ],

    /**
     * @event beforedocumentsave
     * Fires on the component before a document is exported and saved.
     * @param {Ext.Component} component Reference to the component that uses this plugin
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event documentsave
     * Fires on the component whenever a document is exported and saved.
     * @param {Ext.Component} component Reference to the component that uses this plugin
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */
    /**
     * @event dataready
     * Fires on the component when the {@link Ext.exporter.data.Table data} is ready.
     * You could adjust styles or data before the document is generated and saved.
     * @param {Ext.Component} component Reference to the component that uses this plugin
     * @param {Object} params Additional parameters sent with this event
     * @param {Object} params.config The config object used in the {@link #saveDocumentAs} method
     * @param {Ext.exporter.Base} params.exporter A reference to the exporter object used to save the document
     */

    /**
     * Plugin initialization
     *
     * @param cmp
     * @return {Ext.exporter.Plugin}
     * @private
     */
    init: function (cmp) {
        var me = this;

        cmp.saveDocumentAs = Ext.bind(me.saveDocumentAs, me);
        cmp.getDocumentData = Ext.bind(me.getDocumentData, me);
        me.cmp = cmp;

        return me.callParent([cmp]);
    },

    destroy: function(){
        var me = this,
            cmp = me.cmp;

        cmp.saveDocumentAs = cmp.getDocumentData = me.cmp = me.delayedSaveTimer =
            Ext.unasap(me.delayedSaveTimer);

        me.callParent();
    },

    /**
     * Save the export file. This method is added to the component as "saveDocumentAs".
     *
     * Pass in exporter specific configs to the config parameter.
     *
     * @param {Ext.exporter.Base} config Config object used to initialize the proper exporter
     * @param {String} config.type Type of the exporter as defined in the exporter alias. Default is `excel`.
     * @param {String} [config.title] Title added to the export document
     * @param {String} [config.author] Who exported the document?
     * @param {String} [config.fileName] Name of the exported file, including the extension
     * @param {String} [config.charset] Exported file's charset
     *
     * @return {Ext.promise.Promise}
     *
     */
    saveDocumentAs: function(config){
        var cmp = this.cmp,
            deferred = new Ext.Deferred(),
            exporter = this.getExporter(config);

        cmp.fireEvent('beforedocumentsave', cmp, {
            config: config,
            exporter: exporter
        });
        
        this.delayedSaveTimer = Ext.asap(this.delayedSave, this, [exporter, config, deferred]);
        return deferred.promise;
    },

    /**
     * Delayed function that exports the document
     *
     * @param exporter
     * @param config
     * @param deferred
     *
     * @private
     */
    delayedSave: function(exporter, config, deferred){
        var cmp = this.cmp;

        // the plugin might be disabled or the component is already destroyed
        if(this.disabled || !cmp){
            Ext.destroy(exporter);
            deferred.reject();
            return;
        }

        this.setExporterData(exporter, config);

        exporter.saveAs().then(
            function(){
                deferred.resolve(config);
            },
            function(msg){
                deferred.reject(msg);
            }
        ).always(function(){
            var canFire = cmp && !cmp.destroyed;

            if(canFire) {
                cmp.fireEvent('documentsave', cmp, {
                    config: config,
                    exporter: exporter
                });
            }
            Ext.destroy(exporter);
            if(canFire) {
                cmp.fireEvent('exportfinished', cmp, {
                    config: config
                });
            }
        });
    },

    /**
     * Fetch the export data. This method is added to the component as "getDocumentData".
     *
     * Pass in exporter specific configs to the config parameter.
     *
     * @param {Ext.exporter.Base} config Config object used to initialize the proper exporter
     * @param {String} [config.type] Type of the exporter as defined in the exporter alias. Default is `excel`.
     * @param {String} [config.title] Title added to the export document
     * @param {String} [config.author] Who exported the document?
     * @return {String}
     *
     */
    getDocumentData: function(config){
        var exporter, ret;

        if(this.disabled){
            return;
        }

        exporter = this.getExporter(config);
        this.setExporterData(exporter, config);
        ret = exporter.getContent();
        Ext.destroy(exporter);

        return ret;
    },

    /**
     * Builds the exporter object and returns it.
     *
     * @param {Object} config
     * @return {Ext.exporter.Base}
     *
     * @private
     */
    getExporter: function(config){
        var cfg = Ext.apply({
                type: 'excel'
            }, config);

        return Ext.Factory.exporter(cfg);
    },

    /**
     *
     * @param exporter
     * @param config
     * @private
     */
    setExporterData: function(exporter, config){
        var cmp = this.cmp;

        exporter.setData(this.prepareData(config));
        cmp.fireEvent('dataready', cmp, {
            config: config,
            exporter: exporter
        });
    },

    /**
     * @param {Object/Array} style
     * @param {Object} config Configuration passed to saveDocumentAs and getDocumentData methods
     * @return {Object}
     */
    getExportStyle: function(style, config){
        var type = (config && config.type),
            types, def, index;

        if(Ext.isArray(style)) {
            types = Ext.Array.pluck(style, 'type');
            index = Ext.Array.indexOf(types, undefined);
            if (index >= 0) {
                // we found a default style which means that all others are exceptions
                def = style[index];
            }

            index = Ext.Array.indexOf(types, type);
            return index >= 0 ? style[index] : def;
        }else{
            return style;
        }
    },

    /**
     * @method
     * This method creates the data object that will be consumed by the exporter.
     * @param {Object} config The config object passed to the getDocumentData and saveDocumentAs methods
     * @return {Ext.exporter.data.Table}
     *
     * @private
     */
    prepareData: Ext.emptyFn

});
