/**
 * This plugin allows the end user to configure the pivot component.
 *
 * It adds the following methods to the pivot grid:
 * - showConfigurator: which when called will show the configurator panel
 * - hideConfigurator: which when called will hide the configurator panel
 *
 * The configurator panel will be shown docked to the pivot grid.
 */
Ext.define('Ext.pivot.plugin.Configurator', {
    alternateClassName: [
        'Mz.pivot.plugin.Configurator'
    ],

    extend: 'Ext.plugin.Abstract',

    requires: [
        'Ext.util.DelayedTask',
        'Ext.menu.Menu',        
        'Ext.menu.CheckItem',
        'Ext.util.Collection',
        'Ext.pivot.plugin.configurator.Panel'
    ],

    alias: [
        'plugin.pivotconfigurator',
        'plugin.mzconfigurator'
    ],

    /**
     * Fired on the pivot component before a configurator field is moved.
     *
     * Return false if you don't want to move that field.
     *
     * @event beforemoveconfigfield
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Container} config.fromContainer Source container to move from
     * @param {Ext.pivot.plugin.configurator.Container} config.toContainer Destination container to move to
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     */

    /**
     * Fired on the pivot component before the pivot settings window is shown.
     *
     * Return false if you don't want to show the window.
     *
     * @event beforeshowpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after the configurator pivot settings window is shown.
     *
     * @event showpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before settings are applied to the pivot matrix.
     *
     * Return false if you don't want to apply the settings to the field.
     *
     * @event beforeapplypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object that contains all
     * pivot matrix settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after settings are applied to the pivot matrix.
     *
     * @event applypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Window object
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before the field settings window is shown.
     *
     * Return false if you don't want to show the window.
     *
     * @event beforeshowconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after the configurator field settings window is shown.
     *
     * @event showconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before settings are applied to the configurator field.
     *
     * Return false if you don't want to apply the settings to the field.
     *
     * @event beforeapplyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object that contains all
     * field settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after settings are applied to the configurator field.
     *
     * @event applyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.FieldSettings} config.container Window object
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before the configurator field menu is shown.
     *
     * Return false if you don't want to show the menu.
     *
     * @event beforeshowconfigfieldmenu
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.menu.Menu} config.menu Menu object
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     * @param {String} config.container Type of container in which the field is located: `all`, `leftAxis`,
     * `topAxis` or `aggregate`.
     */

    /**
     * Fired on the pivot component after the configurator field menu is shown.
     *
     * @event showconfigfieldmenu
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.menu.Menu} config.menu Menu object
     * @param {Ext.pivot.plugin.configurator.Field} config.field Field configuration
     * @param {String} config.container Type of container in which the field is located: `all`, `leftAxis`,
     * `topAxis` or `aggregate`.
     */

    /**
     * Fired on the pivot component before the new configuration is applied.
     *
     * Return false if you don't want to apply the new configuration to the pivot grid.
     *
     * @event beforeconfigchange
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config Config object used to reconfigure the pivot
     */

    /**
     * Fired on the pivot component when the configuration changes.
     *
     * @event configchange
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config Config object used to reconfigure the pivot
     */

    /**
     * Fired on the pivot component when the configurator panel is visible
     *
     * @event showconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */

    /**
     * Fired on the pivot component when the configurator panel is hidden
     *
     * @event hideconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */


    /**
     *  `"both"` (the default) - The plugin is added to both grids
     *  `"top"` - The plugin is added to the containing Panel
     *  `"locked"` - The plugin is added to the locked (left) grid
     *  `"normal"` - The plugin is added to the normal (right) grid
     *
     * @private
     */
    lockableScope:  'top',

    config: {
        /**
         * @cfg {Ext.pivot.plugin.configurator.Field[]} fields
         *
         * This is the array of fields you want to be used in the configurator.
         *
         * If no fields are defined then all fields are fetched from the store model if
         * a {@link Ext.pivot.matrix.Local Local} matrix is used.
         *
         * The fields are indexed by the dataIndex supplied to them which means that you can't have two fields
         * sharing the same dataIndex. If you want to define two fields that share the same dataIndex then
         * it's best to use a unique dataIndex for the 2nd field and define a grouperFn on it.
         *
         * The dimensions that are configured on the pivot component but do not exist in this fields collection
         * will be added here with a set of default settings.
         */
        fields:         [],

        /**
         * @cfg {Number} refreshDelay Number of milliseconds to wait for pivot refreshing when a config change occurred.
         */
        refreshDelay:   300,

        /**
         * @cfg {String} dock Docking position for the configurator panel. Possible values: top, right, bottom, left
         */
        dock: 'right',

        /**
         * @cfg {Boolean} collapsible Is the configurator panel collapsible?
         */
        collapsible:    true,

        /**
         * @private
         */
        configPanel:    null
    },

    init: function(cmp) {
        var me = this;

        //<debug>
        // this plugin is only available for the pivot components
        if (!cmp.isPivotComponent) {
            Ext.raise('This plugin is only compatible with pivot components');
        }
        //</debug>

        cmp.showConfigurator = Ext.bind(me.showConfigurator, me);
        cmp.hideConfigurator = Ext.bind(me.hideConfigurator, me);

        cmp.on({
            afterrender:    me.onAfterPivotRendered,
            single:         true,
            scope:          me
        });

        me.callParent([cmp]);
    },

    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function() {
        var me = this,
            cmp = me.getCmp();

        cmp.showConfigurator = cmp.hideConfigurator = null;
        me.setConfigPanel(Ext.destroy(me.getConfigPanel()));
        me.setFields(null);

        me.callParent();
    },
    
    /**
     * Enable the plugin to show the configurator panel.
     *
     */
    enable: function() {
        this.disabled = false;
        this.showConfigurator();
    },
    
    /**
     * Disable the plugin to hide the configurator panel.
     *
     */
    disable: function() {
        this.disabled = true;
        this.hideConfigurator();
    },

    /**
     * @private
     */
    showConfigurator: function(){
        this.renderConfigPanel();
    },

    /**
     * @private
     */
    hideConfigurator: function(){
        var cfgPanel = this.getConfigPanel();

        if(cfgPanel){
            cfgPanel.disable();
            this.getCmp().fireEvent('hideconfigpanel', cfgPanel);
        }
    },

    /**
     * @private
     */
    onAfterPivotRendered: function(){
        var me = this,
            fields = me.getFields(),
            matrix = me.getCmp().getMatrix(),
            fieldsToUpdate = [],
            duplicates = {},
            noFields = false,
            store, newFields, field, name, length, i, dim, config;

        if(fields.length === 0 && matrix instanceof Ext.pivot.matrix.Local) {
            // if no fields were provided then try to extract them from the matrix store
            noFields = true;
            store = matrix.store;
            newFields = store ? store.model.getFields() : [];
            length = newFields.length;

            for (i = 0; i < length; i++) {
                name = newFields[i].getName();

                if (!fields.byDataIndex.get(name)) {
                    fields.add({
                        header: Ext.String.capitalize(name),
                        dataIndex: name
                    });
                }
            }
        }

        // extract fields from the existing pivot configuration
        newFields = Ext.Array.merge(matrix.leftAxis.dimensions.getRange(), matrix.topAxis.dimensions.getRange(), matrix.aggregate.getRange());
        length = newFields.length;
        for (i = 0; i < length; i++) {
            dim = newFields[i].getConfig();
            delete(dim.matrix);
            delete(dim.values);
            delete(dim.id);
            field = fields.byDataIndex.get(dim.dataIndex);
            if(!field) {
                fields.add(dim);
            }else if(noFields) {
                if(!duplicates[dim.dataIndex]){
                    duplicates[dim.dataIndex] = 0;
                }
                delete(dim.header);
                duplicates[dim.dataIndex]++;
                fieldsToUpdate.push(dim);
            }
        }

        // Some fields defined on the pivot axis already exist in the configurator fields
        // so we need to update the configurator fields for later usage.
        // This is important because the dimensions may have labelRenderer/renderer/formatter defined
        // This happens only when no fields were defined on the Configurator plugin.
        length = fieldsToUpdate.length;
        for (i = 0; i < length; i++) {
            dim = fieldsToUpdate[i];
            if (duplicates[dim.dataIndex] === 1) {
                field = fields.byDataIndex.get(dim.dataIndex);
                if (field) {
                    config = field.getConfig();
                    Ext.merge(config, dim);
                    field.setConfig(config);
                }
            }
        }

        me.isReady = true;

        if(me.disabled === true){
            me.disable();
        }else{
            me.enable();
        }
    },

    /**
     * Change configurator panel position.
     * @method setDock
     *
     * @param {String} position Possible values: `top`, `right`, `bottom`, `left`.
     */

    /**
     * Get a reference to the configurator panel
     * @method getConfigPanel
     *
     * @returns {Ext.pivot.plugin.configurator.Panel}
     */


    /**
     * @private
     * @param value
     */
    updateDock: function(value){
        this.renderConfigPanel(value);
    },

    /**
     * @private
     * @param value
     */
    updateCollapsible: function(value){
        this.renderConfigPanel(value);
    },

    getFields: function(){
        var ret = this.fields;

        if(!ret){
            ret = new Ext.util.Collection({
                extraKeys: {
                    byDataIndex: 'dataIndex'
                },
                decoder: function(field){
                    return (field && field.isField) ? field : new Ext.pivot.plugin.configurator.Field(field || {});
                }
            });
            this.setFields(ret);
        }

        return ret;
    },

    applyFields: function(fields, fieldsCollection){
        if(fields == null || (fields && fields.isCollection)){
            return fields;
        }

        if(fields){
            if(!fieldsCollection){
                fieldsCollection = this.getFields();
            }

            fieldsCollection.splice(0, fieldsCollection.length, fields);
        }

        return fieldsCollection;
    },

    /**
     * Render the configurator panel as a docked panel to the pivot component
     *
     * @private
     * @param position
     */
    renderConfigPanel: function(position){
        var me = this,
            cmp = me.getCmp(),
            cfgPanel = me.getConfigPanel(),
            exists = !Ext.isEmpty(cfgPanel);

        if(!cmp || !me.isReady || me.disabled){
            // nothing to do
            return;
        }

        Ext.destroy(cfgPanel);

        cfgPanel = cmp.addDocked({
            xtype:          'pivotconfigpanel',
            dock:           position || me.getDock(),
            refreshDelay:   me.getRefreshDelay(),
            pivot:          me.getCmp(),
            fields:         me.getFields(),
            listeners: {
                afterrender: 'onRenderConfigPanel',
                single: true,
                scope: me
            }
        })[0];

        me.setConfigPanel(cfgPanel);

        if(exists){
            cfgPanel.enable();
        }
    },

    onRenderConfigPanel: function(panel){
        this.getCmp().fireEvent('showconfigpanel', panel);
    }
    

});