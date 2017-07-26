/**
 * This plugin allows the user to view all records that were aggregated for a specified cell.
 *
 * The user has to double click that cell to open the records viewer.
 *
 * **Note:** If a {@link Ext.pivot.matrix.Remote Remote} matrix is used then the plugin requires
 * a {@link #remoteStore} to be provided to fetch the records for a left/top keys pair.
 */
Ext.define('Ext.pivot.plugin.DrillDown', {
    alternateClassName: [
        'Mz.pivot.plugin.DrillDown'
    ],

    alias: [
        'plugin.pivotdrilldown',
        'plugin.mzdrilldown'
    ],

    extend: 'Ext.plugin.Abstract',
    
    requires: [
        'Ext.pivot.Grid',
        'Ext.window.Window',
        'Ext.data.proxy.Memory',
        'Ext.data.Store',
        'Ext.toolbar.Paging'
    ],

    /**
     * Fired on the pivot component when the drill down window is visible
     *
     * @event showdrilldownpanel
     * @param {Ext.window.Window} panel Drill down window
     */

    /**
     * Fired on the pivot component when the drill down window is hidden
     *
     * @event hidedrilldownpanel
     * @param {Ext.window.Window} panel Drill down window
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
         * @cfg {Ext.grid.column.Column[]} [columns] Specify which columns should be visible in the grid.
         *
         * Use the same definition as for a grid column. Header and dataIndex are the most important ones.
         */
        columns:     null,
        /**
         * @cfg {Number} width Width of the viewer's window.
         */
        width:        400,
        /**
         * @cfg {Number} height Height of the viewer's window.
         */
        height:        300,
        /**
         * @cfg {Ext.data.Store} remoteStore
         * Provide either a store config or a store instance when using a {@link Ext.pivot.matrix.Remote Remote} matrix on the pivot grid.
         *
         * The store will be remotely filtered to fetch records from the server.
         */
        remoteStore:    null,
        /**
         * @private
         */
        grid: null,
        /**
         * @private
         */
        view: null
    },

    /**
     * @cfg {String} textWindow Viewer's window title.
     */
    textWindow: 'Drill down window',

    init: function(grid){
        //<debug>
        // this plugin is available only for the pivot grid
        if (!grid.isPivotGrid) {
            Ext.raise('This plugin is only compatible with Ext.pivot.Grid');
        }
        //</debug>

        this.setGrid(grid);
        return this.callParent([grid]);
    },

    destroy: function(){
        this.setConfig({
            grid: null,
            view: null
        });
        this.callParent();
    },

    updateGrid: function(grid){
        Ext.destroy(this.gridListeners);

        if(grid){
            this.gridListeners = grid.on({
                pivotitemcelldblclick:      'showPanel',
                pivotgroupcelldblclick:     'showPanel',
                pivottotalcelldblclick:     'showPanel',
                scope:                      this,
                destroyable:                true
            });
        }
    },

    updateView: function(view, oldView){
        Ext.destroy(oldView);
    },

    showPanel: function(params, e, eOpts){
        var me = this,
            grid = me.getGrid(),
            matrix = grid.getMatrix(),
            columns = Ext.Array.from(me.getColumns() || []),
            result, fields, store, filters, view,
            i, len, value;

        // do nothing if the plugin is disabled
        if(me.disabled) {
            return;
        }

        result = matrix.results.get(params.leftKey, params.topKey);

        if(!result){
            return;
        }

        switch(matrix.type){
            case 'local':
                fields = matrix.store.model.getFields();
                store = new Ext.data.Store({
                    pageSize: 25,
                    remoteSort: true,
                    fields: Ext.clone(fields),
                    proxy: {
                        type: 'memory',
                        reader: {
                            type: 'array'
                        },
                        enablePaging: true
                    }
                });
                // if no columns are defined then use those defined in the pivot grid store
                if (columns.length === 0) {
                    len = fields.length;
                    for(i = 0; i < len; i++){
                        value = fields[i];
                        columns.push({
                            text: Ext.String.capitalize(value.name),
                            dataIndex: value.name
                        });
                    }
                }
                store.getProxy().data = result.records;
                store.load();
                break;

            case 'remote':
                store = Ext.getStore(me.getRemoteStore());

                if(store){
                    store.setRemoteFilter(true);
                }

                //<debug>
                if(columns.length === 0){
                    Ext.raise('No columns defined for the drill down grid!');
                }
                //</debug>

                filters = Ext.Array.merge(me.getFiltersFromParams(result.getLeftAxisItem() ? result.getLeftAxisItem().data : {}), me.getFiltersFromParams(result.getTopAxisItem() ? result.getTopAxisItem().data : {}));
                store.clearFilter(true);
                if(filters.length > 0) {
                    store.addFilter(filters);
                }else{
                    store.load();
                }
                break;

            default:
                return;
        }

        // create the window that will show the records
        view = me.createPanel(store, columns);
        view.show();
        me.setView(view);
        grid.fireEvent('showdrilldownpanel', view);
    },

    createPanel: function(store, columns){
        var me = this;

        return new Ext.window.Window({
            title: me.textWindow,
            width: me.getWidth(),
            height: me.getHeight(),
            layout: 'fit',
            modal: true,
            closeAction: 'hide',
            items: [{
                xtype: 'grid',
                border: false,
                viewConfig: {
                    loadMask: false
                },
                columns: columns,
                store: store,
                dockedItems: [{
                    xtype: 'pagingtoolbar',
                    store: store,   // same store GridPanel is using
                    dock: 'bottom',
                    displayInfo: true
                }]
            }],
            listeners: {
                close: 'onClosePanel',
                scope: me
            }
        });
    },

    onClosePanel: function(){
        var view = this.getView();

        this.getGrid().fireEvent('hidedrilldownpanel', view);
        this.setView(null);
    },

    getFiltersFromParams: function(obj){
        var filters = [],
            i, len, keys;

        if(Ext.isObject(obj)) {
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