/**
 * This plugin allows the user to view all records that were aggregated for a specified cell.
 *
 * The user has to double click that cell to open the records viewer.
 *
 * **Note:** If a {@link Ext.pivot.matrix.Remote} matrix is used then the plugin requires
 * a {@link #remoteStore} to be provided to fetch the records for a left/top keys pair.
 */
Ext.define('Ext.pivot.plugin.DrillDown', {
    alias: [
        'plugin.pivotdrilldown'
    ],

    extend: 'Ext.plugin.Abstract',

    requires: [
        'Ext.pivot.Grid',
        'Ext.Panel',
        'Ext.layout.Fit',
        'Ext.TitleBar',
        'Ext.Button',
        'Ext.data.proxy.Memory',
        'Ext.data.Store',
        'Ext.grid.plugin.PagingToolbar'
    ],

    /**
     * Fired on the pivot component when the drill down panel is visible
     *
     * @event showdrilldownpanel
     * @param {Ext.Panel} panel Drill down panel
     */

    /**
     * Fired on the pivot component when the drill down panel is hidden
     *
     * @event hidedrilldownpanel
     * @param {Ext.Panel} panel Drill down panel
     */

    config: {
        /**
         * @cfg {Ext.grid.column.Column[]} [columns] Specify which columns should be visible in the grid.
         *
         * Use the same definition as for a grid column.
         */
        columns: null,
        /**
         * @cfg {Number} width
         *
         * Width of the viewer's window.
         */
        width: 500,
        /**
         * @cfg {Number} [pageSize=25]
         * The number of records considered to form a 'page'.
         *
         * To disable paging, set the pageSize to `0`.
         */
        pageSize: 25,
        /**
         * @cfg {Ext.data.Store} remoteStore
         * Provide either a store config or a store instance when using a {@link Ext.pivot.matrix.Remote Remote} matrix on the pivot grid.
         *
         * The store will be remotely filtered to fetch records from the server.
         */
        remoteStore: null,

        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the drill down panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'panel',
                hidden: true,
                floated: true,
                modal: true,
                hideOnMaskTap: true,
                right: 0,
                height: '100%',
                showAnimation: {
                    type: 'slideIn',
                    duration: 250,
                    easing: 'ease-out',
                    direction: 'left'
                },
                hideAnimation: {
                    type: 'slideOut',
                    duration: 250,
                    easing: 'ease-in',
                    direction: 'right'
                },

                layout: 'fit',
                items: [{
                    docked: 'top',
                    xtype: 'titlebar',
                    itemId: 'title',
                    items: {
                        xtype: 'button',
                        text: 'Done',
                        ui: 'action',
                        align: 'right',
                        itemId: 'done'
                    }
                }, {
                    xtype: 'grid',
                    itemId: 'grid',
                    plugins: {
                        gridpagingtoolbar: true
                    }
                }]
            }
        },
        /**
         * @private
         */
        pivot: null
    },

    titleText: 'Drill down',
    doneText: 'Done',

    init: function (pivot) {
        //<debug>
        // this plugin is available only for the pivot grid
        if (!pivot.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        //</debug>

        this.setPivot(pivot);
        return this.callParent([pivot]);
    },

    destroy: function () {
        this.setConfig({
            pivot: null,
            panel: null
        });
        this.callParent();
    },

    updatePivot: function (grid) {
        Ext.destroy(this.gridListeners);

        if (grid) {
            this.gridListeners = grid.on({
                pivotitemcelldoubletap: 'showPanel',
                pivotgroupcelldoubletap: 'showPanel',
                pivottotalcelldoubletap: 'showPanel',
                scope: this,
                destroyable: true
            });
        }
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

        Ext.destroy(oldPanel, me.panelListeners, me.buttonListeners);

        if (panel) {
            me.panelListeners = panel.on({
                hiddenchange: 'onPanelHiddenChange',
                scope: me,
                destroyable: true
            });

            panel.down('#title').setTitle(me.titleText);
            me.buttonListeners = panel.down('#done').on({
                tap: 'hidePanel',
                scope: me,
                destroyable: true
            });

            me.initializeStoreAndColumns();

            pivot.add(panel);
        }
    },

    initializeStoreAndColumns: function () {
        var me = this,
            panel = me.getPanel(),
            matrix = me.getPivot().getMatrix(),
            columns = Ext.Array.from(me.getColumns() || []),
            pageSize = me.getPageSize(),
            fields, store, i, len, value, grid;

        if (!matrix || !panel || !(grid = panel.down('#grid'))) {
            return;
        }

        if (matrix.isLocalMatrix) {
            fields = matrix.store.model.getFields();
            store = new Ext.data.Store({
                pageSize: pageSize,
                fields: Ext.clone(fields),
                proxy: {
                    type: 'memory',
                    enablePaging: (pageSize > 0),
                    reader: {
                        type: 'array'
                    }
                }
            });
            // if no columns are defined then use those defined in the pivot grid store
            if (columns.length === 0) {
                len = fields.length;
                for (i = 0; i < len; i++) {
                    value = fields[i];
                    columns.push({
                        text: Ext.String.capitalize(value.name),
                        dataIndex: value.name,
                        xtype: 'column'
                    });
                }
            }
        } else {
            store = Ext.getStore(me.getRemoteStore());

            if (store && store.isStore) {
                store.setPageSize(pageSize);
                store.setRemoteFilter(true);
            }
        }

        //<debug>
        if (columns.length === 0) {
            Ext.raise('No columns defined for the drill down grid!');
        }
        //</debug>

        grid.setConfig({
            store: store,
            columns: columns
        });
    },

    onPanelHiddenChange: function (panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hidedrilldownpanel' : 'showdrilldownpanel', panel);
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

    showPanel: function (params) {
        var me = this,
            panel = me.getPanel(),
            matrix = me.getPivot().getMatrix(),
            result, grid, store, filters;

        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }

        result = matrix.results.get(params.leftKey, params.topKey);

        if (!result || !panel || !(grid = panel.down('#grid'))) {
            return;
        }

        store = grid.getStore();

        if (matrix.isLocalMatrix) {
            //store.loadData(result.records);
            store.getProxy().setData(result.records);
            store.loadPage(1);
        } else {
            filters = Ext.Array.merge(me.getFiltersFromParams(result.getLeftAxisItem() ? result.getLeftAxisItem().data : {}), me.getFiltersFromParams(result.getTopAxisItem() ? result.getTopAxisItem().data : {}));
            store.clearFilter(true);
            if (filters.length > 0) {
                store.addFilter(filters);
            } else {
                store.load();
            }
        }

        panel.setWidth(me.getWidth());
        panel.show();
    },

    hidePanel: function () {
        var panel = this.getPanel();

        if (panel) {
            panel.hide();
        }
    },

    getFiltersFromParams: function (obj) {
        var filters = [],
            i, len, keys;

        if (Ext.isObject(obj)) {
            keys = Ext.Object.getKeys(obj);
            len = keys.length;

            for (i = 0; i < len; i++) {
                filters.push({
                    property: keys[i],
                    exactMatch: true,
                    value: obj[keys[i]]
                });
            }
        }

        return filters;
    }

});
