/**
 * This plugin allows the end user to configure the pivot component.
 *
 * It adds the following methods to the pivot grid:
 * - showConfigurator: which when called will show the configurator panel
 * - hideConfigurator: which when called will hide the configurator panel
 *
 * The configurator panel will be shown when the end-user does a `longpress` event
 * on the column headers.
 *
 * On phones a field can be moved between fields areas after a `longpress` event
 * is triggered on the field.
 */
Ext.define('Ext.pivot.plugin.Configurator', {
    extend: 'Ext.plugin.Abstract',

    requires: [
        'Ext.util.Collection',
        'Ext.pivot.plugin.configurator.Panel'
    ],

    alias: 'plugin.pivotconfigurator',

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
     * Fired on the pivot component before the pivot settings container is shown.
     *
     * Return false if you don't want to show the container.
     *
     * @event beforeshowpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after the configurator pivot settings container is shown.
     *
     * @event showpivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.window.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before settings are applied to the pivot matrix.
     *
     * Return false if you don't want to apply the settings to the pivot matrix.
     *
     * @event beforeapplypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Settings} config.container Form panel container that contains all
     * pivot matrix settings.
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after settings are applied to the pivot matrix.
     *
     * @event applypivotsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Settings} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that were loaded into the form
     */

    /**
     * Fired on the pivot component before the field settings container is shown.
     *
     * Return false if you don't want to show the field settings container.
     *
     * @event beforeshowconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container where you can inject
     * additional fields
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after the configurator field settings container is shown.
     *
     * @event showconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container where you can inject
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
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container that contains all field settings
     * @param {Object} config.settings Settings that will be loaded into the form
     */

    /**
     * Fired on the pivot component after settings are applied to the configurator field.
     *
     * @event applyconfigfieldsettings
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     * @param {Object} config
     * @param {Ext.pivot.plugin.configurator.Form} config.container Form panel container that contains all field settings
     * @param {Object} config.settings Settings that were loaded into the form
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
     * Fired on the pivot component when the configurator panel is disabled
     *
     * @event hideconfigpanel
     * @param {Ext.pivot.plugin.configurator.Panel} panel Configurator panel
     */


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
        fields: [],
        /**
         * @cfg {Number} width
         *
         * The width of the configurator panel.
         */
        width: 400,
        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the configurator panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'pivotconfigpanel',
                hidden: true,
                floated: true,
                modal: true,
                hideOnMaskTap: true,
                right: 0,
                height: '100%'
            }
        },
        /**
         * @private
         */
        pivot: null
    },

    init: function (pivot) {
        this.setPivot(pivot);
    },

    /**
     * @private
     * AbstractComponent calls destroy on all its plugins at destroy time.
     */
    destroy: function () {
        this.setConfig({
            pivot: null,
            panel: null
        });
        this.callParent();
    },

    /**
     * Enable the plugin to show the configurator panel.
     */
    enable: function () {
        this.disabled = false;
        this.showConfigurator();
    },

    /**
     * Disable the plugin to hide the configurator panel.
     */
    disable: function () {
        this.disabled = true;
        this.hideConfigurator();
    },

    applyPanel: function (panel, oldPanel) {
        if (panel) {
            panel = panel.isInstance ? panel : Ext.create(panel);
        }

        return panel;
    },

    updatePanel: function (panel, oldPanel) {
        var me = this,
            pivot = this.getPivot();

        Ext.destroy(oldPanel, me.panelListeners);

        if (panel) {
            me.panelListeners = panel.on({
                hiddenchange: 'onPanelHiddenChange',
                close: 'hideConfigurator',
                scope: me,
                destroyable: true
            });

            panel.setConfig({
                pivot: pivot,
                fields: me.getFields()
            });

            pivot.add(panel);
        }
    },

    onPanelHiddenChange: function (panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hideconfigpanel' : 'showconfigpanel', panel);
    },

    updatePivot: function (pivot, oldPivot) {
        var me = this;

        Ext.destroy(me.pivotListeners);

        if (oldPivot) {
            oldPivot.showConfigurator = oldPivot.hideConfigurator = null;
        }

        if (pivot) {
            //<debug>
            // this plugin is only available for the pivot components
            if (!pivot.isPivotComponent) {
                Ext.raise('This plugin is only compatible with pivot components');
            }
            //</debug>
            pivot.showConfigurator = Ext.bind(me.showConfigurator, me);
            pivot.hideConfigurator = Ext.bind(me.hideConfigurator, me);

            if (pivot.initialized) {
                me.onPivotInitialized();
            } else {
                pivot.on({
                    initialize: 'onPivotInitialized',
                    single: true,
                    scope: me
                });
            }
        }
    },

    getWidth: function () {
        var pivot = this.getPivot(),
            viewport = Ext.Viewport,
            maxWidth = 100;

        if (pivot && pivot.element) {
            maxWidth = pivot.element.getWidth();
        }
        if (viewport) {
            maxWidth = Math.min(maxWidth, viewport.element.getHeight(), viewport.element.getWidth());
        }

        return Ext.Number.constrain(this._width, 100, maxWidth);
    },

    /**
     * @private
     */
    onPivotInitialized: function () {
        var me = this,
            pivot = me.getPivot(),
            fields = me.getFields(),
            matrix = pivot.getMatrix(),
            header = pivot.getHeaderContainer && pivot.getHeaderContainer(),
            fieldsToUpdate = [],
            duplicates = {},
            noFields = false,
            store, newFields, field, name, length, i, dim, config;

        if (fields.length === 0 && matrix instanceof Ext.pivot.matrix.Local) {
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
            if (!field) {
                fields.add(dim);
            } else if (noFields) {
                if (!duplicates[dim.dataIndex]) {
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
        me.doneSetup = false;

        if (header) {
            me.pivotListeners = header.renderElement.on({
                longpress: 'showConfigurator',
                scope: this
            });
        }
    },

    /**
     * @private
     */
    hideConfigurator: function () {
        var panel = this.getPanel();

        if (panel) {
            panel.hide();
        }
    },

    /**
     * @private
     */
    showConfigurator: function () {
        var panel = this.getPanel();

        if (panel) {
            panel.setWidth(this.getWidth());
            panel.show();
        }
    },

    getFields: function () {
        var ret = this._fields;

        if (!ret) {
            ret = new Ext.util.Collection({
                extraKeys: {
                    byDataIndex: 'dataIndex'
                },
                decoder: function (field) {
                    return (field && field.isField) ? field : new Ext.pivot.plugin.configurator.Field(field || {});
                }
            });
            this.setFields(ret);
        }

        return ret;
    },

    applyFields: function (fields, fieldsCollection) {
        if (fields == null || (fields && fields.isCollection)) {
            return fields;
        }

        if (fields) {
            if (!fieldsCollection) {
                fieldsCollection = this.getFields();
            }

            fieldsCollection.splice(0, fieldsCollection.length, fields);
        }

        return fieldsCollection;
    },

    deprecated: {
        '6.5': {
            configs: {
                panelWrapper: null,
                panelWrap: null
            }
        }
    }

});
