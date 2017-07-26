/**
 * This class is used internally by the pivot grid component.
 * @private
 */
Ext.define('Ext.pivot.cell.Group', {
    extend: 'Ext.pivot.cell.Cell',
    xtype: 'pivotgridgroupcell',

    config: {
        innerGroupStyle: null,
        innerGroupCls: null,
        userGroupStyle: null,
        userGroupCls: null
    },

    innerTemplate: [{
        reference: 'iconElement',
        classList: [
            Ext.baseCSSPrefix + 'pivot-grid-group-icon',
            Ext.baseCSSPrefix + 'font-icon'
        ]
    },{
        reference: 'groupElement',
        classList: [
            Ext.baseCSSPrefix + 'pivot-grid-group-title'
        ]
    }],

    groupCls: Ext.baseCSSPrefix + 'pivot-grid-group',
    groupHeaderCls: Ext.baseCSSPrefix + 'pivot-grid-group-header',
    groupHeaderCollapsibleCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsible',
    groupHeaderCollapsedCls: Ext.baseCSSPrefix + 'pivot-grid-group-header-collapsed',

    updateCellCls: function(newCls, oldCls) {
        var me = this,
            classes = typeof newCls == 'string' ? newCls.split(' ') : Ext.Array.from(newCls);

        me.callParent([newCls, oldCls]);

        me.setEventCell(classes.indexOf(me.groupHeaderCls) < 0);
        me.setCollapsible(classes.indexOf(me.groupHeaderCollapsibleCls) >= 0);
    },

    updateInnerGroupStyle: function(cellStyle) {
        this.groupElement.applyStyles(cellStyle);
    },

    updateInnerGroupCls: function(cls, oldCls){
        this.groupElement.replaceCls(oldCls, cls);
    },

    updateUserGroupStyle: function(cellStyle) {
        this.groupElement.applyStyles(cellStyle);
    },

    updateUserGroupCls: function(cls, oldCls){
        this.groupElement.replaceCls(oldCls, cls);
    },

    updateRawValue: function (rawValue) {
        var dom = this.groupElement.dom,
            value = rawValue == null ? '' : rawValue;

        if (this.getEncodeHtml()) {
            dom.textContent = value;
        } else {
            dom.innerHTML = value;
        }
    },

    updateRecord: function (record, oldRecord) {
        var me = this,
            info = me.row.getRecordInfo(),
            dataIndex = me.dataIndex;

        if (info && dataIndex) {
            info = info.rendererParams[dataIndex];
            if(info && me[info.fn]) {
                me[info.fn](info, me.row.getGrid());
            }else{
                me.setCellCls('');
            }
        }

        me.callParent([record, oldRecord]);
    },

    groupOutlineRenderer: function(config, grid){
        var me = this,
            cellCls = '',
            group = config.group;

        if(grid.getMatrix().viewLayoutType == 'compact') {
            // the grand total uses this renderer in compact view and margins need to be reset
            me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', '0');
        }

        if(config.colspan > 0){
            cellCls += me.groupHeaderCls + ' ' + me.outlineGroupHeaderCls;
            if(!config.subtotalRow){
                if(group && group.children && group.axis.matrix.collapsibleRows) {
                    cellCls += ' ' + me.groupHeaderCollapsibleCls;
                    if (!config.group.expanded) {
                        cellCls += ' ' + me.groupHeaderCollapsedCls;
                    }
                }
                if(config.previousExpanded){
                    cellCls += ' ' + me.outlineCellGroupExpandedCls;
                }
            }

            me.setCellCls(cellCls);
            me.setInnerGroupCls( me.groupCls );
            return;
        }

        me.setCellCls( me.outlineCellHiddenCls );
    },

    recordOutlineRenderer: function(config, grid){
        var me = this;

        if(config.hidden){
            me.setCellCls( me.outlineCellHiddenCls );
            return;
        }

        me.setCellCls( me.groupHeaderCls );
    },

    groupCompactRenderer: function(config, grid){
        var me = this,
            cellCls = '',
            group = config.group;

        me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', (me.compactLayoutPadding * group.level) + 'px');

        cellCls += me.groupHeaderCls + ' ' + me.compactGroupHeaderCls;
        if(!config.subtotalRow){
            if(group && group.children && group.axis.matrix.collapsibleRows) {
                cellCls += ' ' + me.groupHeaderCollapsibleCls;
                if (!config.group.expanded) {
                    cellCls += ' ' + me.groupHeaderCollapsedCls;
                }
            }
            if(config.previousExpanded){
                cellCls += ' ' + me.outlineCellGroupExpandedCls;
            }
        }

        me.setCellCls(cellCls);
        me.setInnerGroupCls( me.groupCls );
    },

    recordCompactRenderer: function(config, grid){
        var me = this;

        me.bodyElement.setStyle(grid.isRTL() ? 'padding-right' : 'padding-left', (me.compactLayoutPadding * config.group.level) + 'px' );
        me.setCellCls( me.groupHeaderCls + ' ' + me.compactGroupHeaderCls );
    },

    groupTabularRenderer: function(config, grid){
        var me = this,
            cellCls = '',
            group = config.group;

        cellCls += me.groupHeaderCls + ' ' + me.tabularGroupHeaderCls;
        if(!config.subtotalRow && !config.hidden){
            if(group && group.children && group.axis.matrix.collapsibleRows) {
                cellCls += ' ' + me.groupHeaderCollapsibleCls;
                if (!group.expanded) {
                    cellCls += ' ' + me.groupHeaderCollapsedCls;
                }
            }
        }

        me.setCellCls(cellCls);
        me.setInnerGroupCls( me.groupCls );
    },

    recordTabularRenderer: function(config){
        var me = this;

        if(config.hidden){
            me.setCellCls( me.outlineCellHiddenCls );
            return;
        }

        me.setCellCls( me.groupHeaderCls );
    }


});