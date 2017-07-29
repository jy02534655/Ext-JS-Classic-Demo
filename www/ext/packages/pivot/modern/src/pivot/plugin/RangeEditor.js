/**
 *
 * This plugin allows the user to modify records behind a pivot cell.
 *
 * The user has to double click that cell to open the range editor window.
 *
 * The following types of range editing are available:
 *
 * - `percentage`: the user fills in a percentage that is applied to each record.
 * - `increment`:  the user fills in a value that is added to each record.
 * - `overwrite`:  the new value filled in by the user overwrites each record.
 * - `uniform`:  replace sum of values with a provided value using uniform distribution
 *
 * More pivot updater types can be defined by extending {@link Ext.pivot.update.Base}.
 *
 * **Note:** Only works when using a {@link Ext.pivot.matrix.Local} matrix on a pivot grid.
 */
Ext.define('Ext.pivot.plugin.RangeEditor', {
    alias: [
        'plugin.pivotrangeeditor'
    ],

    extend: 'Ext.plugin.Abstract',

    requires: [
        'Ext.pivot.Grid',
        'Ext.pivot.plugin.rangeeditor.Panel',
        'Ext.Panel',
        'Ext.layout.Fit',
        'Ext.pivot.update.Increment',
        'Ext.pivot.update.Overwrite',
        'Ext.pivot.update.Percentage',
        'Ext.pivot.update.Uniform'
    ],

    /**
     * Fires on the pivot grid before updating all result records.
     *
     * @event pivotbeforeupdate
     * @param {Ext.pivot.update.Base} updater Reference to the updater object
     */

    /**
     * Fires on the pivot grid after updating all result records.
     *
     * @event pivotupdate
     * @param {Ext.pivot.update.Base} updater Reference to the updater object
     */

    /**
     * Fired on the pivot component when the range editor panel is visible
     *
     * @event showrangeeditorpanel
     * @param {Ext.Panel} panel Range editor panel
     */

    /**
     * Fired on the pivot component when the range editor panel is hidden
     *
     * @event hiderangeeditorpanel
     * @param {Ext.Panel} panel Range editor panel
     */


    config: {
        /**
         * @cfg {Array} updaters
         *
         * Define here the updaters available for the user.
         */
        updaters: [
            ['percentage', 'Percentage'],
            ['increment', 'Increment'],
            ['overwrite', 'Overwrite'],
            ['uniform', 'Uniform']
        ],
        /**
         * @cfg {String} defaultUpdater
         *
         * Define which updater is selected by default.
         */
        defaultUpdater: 'uniform',
        /**
         * @cfg {Number} width
         *
         * Width of the viewer's window.
         */
        width: 400,
        /**
         * @cfg {Object} panel
         *
         * Configuration object used to instantiate the range editor panel.
         */
        panel: {
            lazy: true,
            $value: {
                xtype: 'pivotrangeeditor',
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
                close: 'hidePanel',
                scope: me,
                destroyable: true
            });

            panel.getViewModel().getStore('sTypes').loadData(me.getUpdaters());
            pivot.relayEvents(panel, ['beforeupdate', 'update'], 'pivot');

            pivot.add(panel);
        }
    },

    onPanelHiddenChange: function (panel, hidden) {
        this.getPivot().fireEvent(hidden ? 'hiderangeeditorpanel' : 'showrangeeditorpanel', panel);
    },

    updatePivot: function (grid, oldGrid) {
        var me = this;

        Ext.destroy(me.gridListeners);

        if (grid) {
            me.gridListeners = grid.on({
                pivotitemcelldoubletap: 'showPanel',
                pivotgroupcelldoubletap: 'showPanel',
                pivottotalcelldoubletap: 'showPanel',
                scope: me,
                destroyable: true
            });
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

    showPanel: function (params, e, eOpts) {
        var me = this,
            pivot = me.getPivot(),
            panel = me.getPanel(),
            matrix = pivot.getMatrix(),
            vm, result, col, dataIndex;

        // do nothing if the plugin is disabled
        if (me.disabled) {
            return;
        }

        result = matrix.results.get(params.leftKey, params.topKey);

        if (!result || !panel) {
            return;
        }

        vm = panel.getViewModel();

        col = params.column;
        dataIndex = col.dimension.getDataIndex();

        vm.set('form', {
            leftKey: params.leftKey,
            topKey: params.topKey,
            dataIndex: dataIndex,
            //field:      col.dimension.header || col.text || dataIndex,
            value: result.getValue(col.dimension.getId()),
            type: me.getDefaultUpdater(),
            matrix: matrix
        });

        panel.setWidth(me.getWidth());
        panel.show();
    },

    hidePanel: function () {
        var panel = this.getPanel();

        if (panel) {
            panel.hide();
        }
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