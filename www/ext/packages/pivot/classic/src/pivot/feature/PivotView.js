/**
 * This grid feature is automatically used by the pivot grid to customize grid templates.
 * @private
 */
Ext.define('Ext.pivot.feature.PivotView', {
    extend: 'Ext.pivot.feature.PivotEvents',

    alias: 'feature.pivotview',

    // all views css classes
    groupCls: Ext.baseCSSPrefix + 'pivot-grid-group',
    groupTitleCls: Ext.baseCSSPrefix + 'pivot-grid-group-title',
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',

    // outline view css classes
    outlineCellHiddenCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-hidden',
    outlineCellGroupExpandedCls: Ext.baseCSSPrefix + 'pivot-grid-outline-cell-previous-expanded',

    compactGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-compact',
    outlineGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-outline',
    tabularGroupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-tabular',

    compactLayoutPadding: 25,

    outerTpl: [
        '{%',
            // Set up the grouping unless we are disabled
            'var me = this.pivotViewFeature;',
            'if (!(me.disabled)) {',
                'me.setup();',
            '}',

            // Process the item
            'this.nextTpl.applyOut(values, out, parent);',
        '%}',
        {
            priority: 200
        }],

    rowTpl: [
        '{%',
            'var me = this.pivotViewFeature;',
            'me.setupRowData(values.record, values.rowIndex, values);',
            'values.view.renderColumnSizer(values, out);',
            'this.nextTpl.applyOut(values, out, parent);',
            'me.resetRenderers();',
        '%}',
        {
            priority: 200,

            syncRowHeights: function (firstRow, secondRow) {
                var firstHeight, secondHeight;

                firstRow = Ext.fly(firstRow, 'syncDest');
                if (firstRow) {
                    firstHeight = firstRow.offsetHeight;
                }
                secondRow = Ext.fly(secondRow, 'sycSrc');
                if (secondRow) {
                    secondHeight = secondRow.offsetHeight;
                }

                // Sync the heights of row body elements in each row if they need it.
                if (firstRow && secondRow) {
                    if (firstHeight > secondHeight) {
                        Ext.fly(secondRow).setHeight(firstHeight);
                    }
                    else if (secondHeight > firstHeight) {
                        Ext.fly(firstRow).setHeight(secondHeight);
                    }
                }

            }

        }
    ],

    cellTpl: [
        '{%',
            'values.hideCell = values.tdAttr == "hidden";\n',
        '%}',
        '<tpl if="!hideCell">',
            '<td class="{tdCls}" role="{cellRole}" {tdAttr} {cellAttr:attributes}',
                ' style="width:{column.cellWidth}px;<tpl if="tdStyle">{tdStyle}</tpl>"',
                ' tabindex="-1" data-columnid="{[values.column.getItemId()]}">',
                '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner {innerCls}" ',
                'style="text-align:{align};<tpl if="style">{style}</tpl>" ',
                '{cellInnerAttr:attributes}>{value}</div>',
            '</td>',
        '</tpl>', {
            priority: 0
        }
    ],

    rtlCellTpl: [
        '{%',
            'values.hideCell = values.tdAttr == "hidden";\n',
        '%}',
        '<tpl if="!hideCell">',
            '<td class="{tdCls}" role="{cellRole}" {tdAttr} {cellAttr:attributes}',
                ' style="width:{column.cellWidth}px;<tpl if="tdStyle">{tdStyle}</tpl>"',
                ' tabindex="-1" data-columnid="{[values.column.getItemId()]}">',
                '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner {innerCls}" ',
                'style="text-align:{[this.getAlign(values.align)]};<tpl if="style">{style}</tpl>" ',
                '{cellInnerAttr:attributes}>{value}</div>',
            '</td>',
        '</tpl>', {
            priority: 200,
            rtlAlign: {
                right: 'left',
                left: 'right',
                center: 'center'
            },
            getAlign: function (align) {
                return this.rtlAlign[align];
            }
        }
    ],

    init: function (grid) {
        var me = this,
            view = me.view;

        me.callParent(arguments);

        // Add a table level processor
        view.addTpl(Ext.XTemplate.getTpl(me, 'outerTpl')).pivotViewFeature = me;
        // Add a row level processor
        view.addRowTpl(Ext.XTemplate.getTpl(me, 'rowTpl')).pivotViewFeature = me;

        view.preserveScrollOnRefresh = true;

        if (view.bufferedRenderer) {
            view.bufferedRenderer.variableRowHeight = true;
        } else {
            grid.variableRowHeight = view.variableRowHeight = true;
        }

    },

    destroy: function () {
        this.columns = null;
        this.callParent(arguments);
    },

    setup: function () {
        this.columns = this.view.getGridColumns();
    },

    isRTL: function () {
        var me = this,
            grid = me.gridMaster || me.grid;

        if (Ext.isFunction(grid.isLocalRtl)) {
            return grid.isLocalRtl();
        }

        return false;
    },

    getGridListeners: function () {
        var me = this;

        return Ext.apply(me.callParent(arguments) || {}, {
            beforerender: me.onBeforeGridRendered
        });
    },

    onBeforeGridRendered: function (grid) {
        var me = this;

        if (me.isRTL()) {
            me.view.addCellTpl(Ext.XTemplate.getTpl(me, 'rtlCellTpl'));
        } else {
            me.view.addCellTpl(Ext.XTemplate.getTpl(me, 'cellTpl'));
        }

    },

    vetoEvent: function (record, row, rowIndex, e) {
        // Do not veto mouseover/mouseout
        if (e.type !== 'mouseover' && e.type !== 'mouseout' && e.type !== 'mouseenter' && e.type !== 'mouseleave' && e.getTarget(this.eventSelector)) {
            return false;
        }
    },

    setupRowData: function (record, idx, rowValues) {
        var storeInfo = this.dataSource.storeInfo[record.internalId],
            rendererParams = storeInfo ? storeInfo.rendererParams : {};

        rowValues.rowClasses.length = 0;
        Ext.Array.insert(rowValues.rowClasses, 0, storeInfo ? storeInfo.rowClasses : []);

        this.setRenderers(rendererParams);
    },

    setRenderers: function (rendererParams) {
        var len = this.columns.length,
            i, column;

        for (i = 0; i < len; i++) {
            column = this.columns[i];
            if (column.leftAxis && rendererParams[column.dataIndex]) {
                column.savedRenderer = column.renderer;
                column.renderer = this[rendererParams[column.dataIndex].fn](Ext.apply({renderer: column.savedRenderer}, rendererParams[column.dataIndex]));
            }
            if (column.topAxis && rendererParams['topaxis']) {
                column.savedRenderer = column.renderer;
                column.renderer = this[rendererParams['topaxis'].fn](Ext.apply({renderer: column.savedRenderer}, rendererParams[column.dataIndex]));
            }
        }
    },

    resetRenderers: function () {
        var len = this.columns.length,
            i, column;

        for (i = 0; i < len; i++) {
            column = this.columns[i];
            if (Ext.isDefined(column.savedRenderer)) {
                column.renderer = column.savedRenderer;
                delete column.savedRenderer;
            }
        }
    },

    groupOutlineRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            hidden = config['hidden'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            if (colspan > 0) {
                metaData.tdAttr = 'colspan = "' + colspan + '"';
                metaData.tdCls = me.groupHeaderCls + ' ' + me.outlineGroupHeaderCls;
                if (!subtotalRow) {
                    if (group && group.children && group.axis.matrix.collapsibleRows) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                        if (!group.expanded) {
                            metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                        }
                    }
                    if (previousExpanded) {
                        metaData.tdCls += ' ' + me.outlineCellGroupExpandedCls;
                    }
                }

                return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
            }
            if (hidden) {
                metaData.tdAttr = 'hidden';
            }
            metaData.tdCls = me.outlineCellHiddenCls;
            return '';
        }
    },

    recordOutlineRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            hidden = config['hidden'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            if (hidden) {
                metaData.tdCls = me.outlineCellHiddenCls; // a class that hides the cell borders
                return '';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls;
            return value;
        }
    },

    groupCompactRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            if (group.level > 0) {
                metaData.style = (me.isRTL() ? 'margin-right: ' : 'margin-left: ') + (me.compactLayoutPadding * group.level) + 'px;';
            }

            metaData.tdCls = me.groupHeaderCls + ' ' + me.compactGroupHeaderCls;
            if (!subtotalRow) {
                if (group && group.children && group.axis.matrix.collapsibleRows) {
                    metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!group.expanded) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if (previousExpanded) {
                    metaData.tdCls += ' ' + me.outlineCellGroupExpandedCls;
                }
            }

            return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
        }
    },

    recordCompactRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            if (group.level > 0) {
                metaData.style = (me.isRTL() ? 'margin-right: ' : 'margin-left: ') + (me.compactLayoutPadding * group.level) + 'px;';
            }

            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls + ' ' + me.compactGroupHeaderCls;
            return value;
        }
    },

    groupTabularRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            colspan = config['colspan'],
            hidden = config['hidden'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            if (colspan > 0) {
                metaData.tdAttr = 'colspan = "' + colspan + '"';
            }
            metaData.tdCls = me.groupHeaderCls + ' ' + me.tabularGroupHeaderCls;
            if (!subtotalRow) {
                if (group && group.children && group.axis.matrix.collapsibleRows) {
                    metaData.tdCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!group.expanded) {
                        metaData.tdCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
            }

            if (hidden) {
                metaData.tdAttr = 'hidden';
            }

            return '<div class="' + me.groupTitleCls + ' ' + me.groupCls + '">' + value + '</div>';
        }
    },

    recordTabularRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'],
            group = config['group'],
            hidden = config['hidden'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            if (hidden) {
                return '';
            }

            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            metaData.tdCls = me.groupHeaderCls + ' ' + me.groupTitleCls;
            return value;
        }
    },

    topAxisNoRenderer: function (config) {
        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            return '';
        }
    },

    topAxisRenderer: function (config) {
        var me = this,
            prevRenderer = config['renderer'];

        return function (value, metaData, record, rowIndex, colIndex, store, view) {
            var hideValue = (value === 0 && me.gridMaster.showZeroAsBlank);

            if (Ext.isFunction(prevRenderer)) {
                value = prevRenderer.apply(this, arguments);
            }

            return hideValue ? '' : value;
        }
    }
});