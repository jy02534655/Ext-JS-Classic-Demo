/**
 * This class remodels the grid store when required.
 *
 * @private
 */
Ext.define('Ext.pivot.feature.PivotStore', {

    config: {
        store: null,
        grid: null,
        matrix: null,
        clsGrandTotal: '',
        clsGroupTotal: ''
    },

    totalRowEvent: 'pivottotal',
    groupRowEvent: 'pivotgroup',
    itemRowEvent: 'pivotitem',

    constructor: function (config) {
        this.initConfig(config);
        return this.callParent(arguments);
    },

    destroy: function () {
        var me = this;

        Ext.destroy(me.storeListeners, me.matrixListeners);

        me.setConfig({
            store: null,
            matrix: null,
            grid: null
        });
        me.storeInfo = me.storeListeners = null;

        me.callParent(arguments);
    },

    updateStore: function (store) {
        var me = this;

        Ext.destroy(me.storeListeners);
        if (store) {
            me.storeListeners = store.on({
                // this event is fired by the pivot grid for private use
                pivotstoreremodel: me.processStore,
                scope: me,
                destroyable: true
            });
        }
    },

    updateMatrix: function (matrix) {
        var me = this;

        Ext.destroy(me.matrixListeners);
        if (matrix) {
            me.matrixListeners = matrix.on({
                // this event is fired by the pivot grid for private use
                groupexpand: me.onGroupExpand,
                groupcollapse: me.onGroupCollapse,
                scope: me,
                destroyable: true
            });
        }
    },

    processStore: function () {
        var me = this,
            store = me.getStore(),
            matrix = me.getMatrix(),
            records = [],
            items, length, i, group, fields;

        if (!matrix || !store) {
            return;
        }

        fields = matrix.getColumns();

        store.suspendEvents();
        store.model.replaceFields(fields, true);

        me.storeInfo = {};

        if (matrix.rowGrandTotalsPosition == 'first') {
            records.push.apply(records, me.processGrandTotal() || []);
        }

        items = matrix.leftAxis.getTree();
        length = items.length;

        for (i = 0; i < length; i++) {
            group = items[i];
            records.push.apply(records, me.processGroup({
                    group: group,
                    previousExpanded: (i > 0 ? items[i - 1].expanded : false)
                }) || []);
        }

        if (matrix.rowGrandTotalsPosition == 'last') {
            records.push.apply(records, me.processGrandTotal() || []);
        }

        // loadRecords called by loadData removes existing records by default.
        store.loadData(records);
        store.resumeEvents();
        store.fireEvent('refresh', store);
    },

    processGroup: function (config) {
        var me = this,
            fn = me['processGroup' + Ext.String.capitalize(me.getMatrix().viewLayoutType)];

        if (!Ext.isFunction(fn)) {
            // specified view type doesn't exist so let's use the outline view
            fn = me.processGroupOutline;
        }

        return fn.call(me, config);
    },

    processGrandTotal: function () {
        var me = this,
            found = false,
            matrix = me.getMatrix(),
            group = {
                key: matrix.grandTotalKey
            },
            records = [],
            lenT = matrix.totals.length,
            dimensions = matrix.leftAxis.dimensions.items,
            lenD = dimensions.length,
            i, j, k, total, column, record, key;

        for (i = 0; i < lenT; i++) {
            total = matrix.totals[i];
            record = total.record;
            k = lenD;

            if (record && record.isModel) {

                me.storeInfo[record.internalId] = {
                    leftKey: group.key,
                    rowStyle: '',
                    rowClasses: [me.getClsGrandTotal()],
                    rowEvent: me.totalRowEvent,
                    rendererParams: {}
                };

                for (j = 0; j < lenD; j++) {
                    column = dimensions[j];

                    if (matrix.viewLayoutType == 'compact' || j === 0) {
                        if (matrix.viewLayoutType == 'compact') {
                            key = matrix.compactViewKey;
                            k = 1;
                        } else {
                            key = column.getId();
                        }
                        record.data[key] = total.title;
                        me.storeInfo[record.internalId].rendererParams[key] = {
                            fn: 'groupOutlineRenderer',
                            group: group,
                            colspan: k,
                            hidden: false,
                            subtotalRow: true
                        };
                        found = true;
                    } else {
                        me.storeInfo[record.internalId].rendererParams[column.id] = {
                            fn: 'groupOutlineRenderer',
                            group: group,
                            colspan: 0,
                            hidden: found,
                            subtotalRow: true
                        };
                        k--;
                    }
                }

                // for all top axis columns use a new renderer
                me.storeInfo[record.internalId].rendererParams['topaxis'] = {
                    fn: 'topAxisRenderer'
                };

                records.push(record);
            }
        }

        return records;
    },

// Outline view functions    

    processGroupOutline: function (config) {
        var me = this,
            group = config['group'],
            results = [];

        if (group.record) {
            me.processRecordOutline({
                results: results,
                group: group
            });
        } else {
            me.processGroupOutlineWithChildren({
                results: results,
                group: group,
                previousExpanded: config.previousExpanded
            });
        }

        return results;
    },

    processGroupOutlineWithChildren: function (config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            hasSummaryData, record, i, len;

        hasSummaryData = (!group.expanded || (group.expanded && matrix.rowSubTotalsPosition == 'first'));
        record = group.expanded ? group.records.expanded : group.records.collapsed;

        me.processGroupHeaderRecordOutline({
            results: config.results,
            group: group,
            record: record,
            previousExpanded: previousExpanded,
            hasSummaryData: hasSummaryData
        });

        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    if (group.children[i]['children']) {
                        me.processGroupOutlineWithChildren({
                            results: config.results,
                            group: group.children[i]
                        });
                    } else {
                        me.processRecordOutline({
                            results: config.results,
                            group: group.children[i]
                        });
                    }
                }
            }
            if (matrix.rowSubTotalsPosition == 'last') {
                record = group.records.footer;
                me.processGroupHeaderRecordOutline({
                    results: config.results,
                    group: group,
                    record: record,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },

    processGroupHeaderRecordOutline: function (config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'],
            items = matrix.leftAxis.dimensions.items,
            len = items.length,
            k = len,
            found = false,
            i, column;

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [me.getClsGroupTotal()],
            rowEvent: me.groupRowEvent,
            rendererParams: {}
        };

        for (i = 0; i < len; i++) {
            column = items[i];

            if (column.id == group.dimension.id) {
                me.storeInfo[record.internalId].rendererParams[column.id] = {
                    fn: 'groupOutlineRenderer',
                    group: group,
                    colspan: k,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                found = true;
            } else {
                me.storeInfo[record.internalId].rendererParams[column.id] = {
                    fn: 'groupOutlineRenderer',
                    group: group,
                    colspan: 0,
                    hidden: found,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                k--;
            }
        }

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: (hasSummaryData ? 'topAxisRenderer' : 'topAxisNoRenderer'),
            group: group
        };

        config.results.push(record);
    },

    processRecordOutline: function (config) {
        var me = this,
            group = config['group'],
            found = false,
            record = group.record,
            items = me.getMatrix().leftAxis.dimensions.items,
            len = items.length,
            i, column;

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };

        for (i = 0; i < len; i++) {
            column = items[i];

            if (column.id == group.dimension.id) {
                found = true;
            }

            me.storeInfo[record.internalId].rendererParams[column.id] = {
                fn: 'recordOutlineRenderer',
                group: group,
                hidden: !found
            };
        }

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };

        config.results.push(record);
    },


// Compact view functions

    processGroupCompact: function (config) {
        var me = this,
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            results = [];

        if (group.record) {
            me.processRecordCompact({
                results: results,
                group: group
            });
        } else {
            me.processGroupCompactWithChildren({
                results: results,
                group: group,
                previousExpanded: previousExpanded
            });
        }

        return results;
    },

    processGroupCompactWithChildren: function (config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            hasSummaryData, i, len;

        hasSummaryData = (!group.expanded || (group.expanded && matrix.rowSubTotalsPosition == 'first'));

        me.processGroupHeaderRecordCompact({
            results: config.results,
            group: group,
            record: group.expanded ? group.records.expanded : group.records.collapsed,
            previousExpanded: previousExpanded,
            hasSummaryData: hasSummaryData
        });

        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    if (group.children[i]['children']) {
                        me.processGroupCompactWithChildren({
                            results: config.results,
                            group: group.children[i]
                        });
                    } else {
                        me.processRecordCompact({
                            results: config.results,
                            group: group.children[i]
                        });
                    }
                }
            }
            if (matrix.rowSubTotalsPosition == 'last') {
                me.processGroupHeaderRecordCompact({
                    results: config.results,
                    group: group,
                    record: group.records.footer,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },

    processGroupHeaderRecordCompact: function (config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'];

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [me.getClsGroupTotal()],
            rowEvent: me.groupRowEvent,
            rendererParams: {}
        };

        me.storeInfo[record.internalId].rendererParams[matrix.compactViewKey] = {
            fn: 'groupCompactRenderer',
            group: group,
            colspan: 0,
            previousExpanded: previousExpanded,
            subtotalRow: subtotalRow
        };

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: (hasSummaryData ? 'topAxisRenderer' : 'topAxisNoRenderer'),
            group: group
        };

        config.results.push(record);
    },

    processRecordCompact: function (config) {
        var me = this,
            group = config['group'],
            record = group.record;

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };

        me.storeInfo[record.internalId].rendererParams[me.getMatrix().compactViewKey] = {
            fn: 'recordCompactRenderer',
            group: group
        };

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };

        config.results.push(record);
    },

// Tabular view functions

    processGroupTabular: function (config) {
        var me = this,
            group = config['group'],
            results = [];

        if (group.record) {
            me.processRecordTabular({
                results: results,
                group: group
            });
        } else {
            me.processGroupTabularWithChildren({
                results: results,
                group: group,
                previousExpanded: config.previousExpanded
            });
        }

        return results;
    },

    processGroupTabularWithChildren: function (config, noFirstRecord) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            previousExpanded = config['previousExpanded'],
            record, i, child, len;

        if (!noFirstRecord) {
            me.processGroupHeaderRecordTabular({
                results: config.results,
                group: group,
                previousExpanded: previousExpanded,
                hasSummaryData: !group.expanded
            });
        }

        if (group.expanded) {
            if (group.children) {
                len = group.children.length;
                for (i = 0; i < len; i++) {
                    child = group.children[i];
                    if (i === 0 && child.children && child.expanded) {
                        me.processGroupTabularWithChildren({
                            results: config.results,
                            group: child
                        }, true);
                    } else if (i > 0) {
                        if (child.children) {
                            me.processGroupTabularWithChildren({
                                results: config.results,
                                group: child
                            });
                        } else {
                            me.processRecordTabular({
                                results: config.results,
                                group: child
                            });
                        }
                    }
                }
            }
            if (matrix.rowSubTotalsPosition !== 'none') {
                record = group.records.footer;
                me.processGroupHeaderRecordTabular({
                    results: config.results,
                    group: group,
                    record: record,
                    previousExpanded: previousExpanded,
                    subtotalRow: true,
                    hasSummaryData: true
                });
            }
        }
    },

    // used in PivotEvents
    getTabularGroupRecord: function (group) {
        var record = group.record;

        if (!record) {
            if (!group.expanded) {
                record = group.records.collapsed;
            } else {
                record = this.getTabularGroupRecord(group.children[0]);
            }
        }
        return record;
    },

    processGroupHeaderRecordTabular: function (config) {
        var me = this,
            matrix = me.getMatrix(),
            group = config['group'],
            record = config['record'],
            previousExpanded = config['previousExpanded'],
            subtotalRow = config['subtotalRow'],
            hasSummaryData = config['hasSummaryData'],
            dimensions = matrix.leftAxis.dimensions,
            len = dimensions.length,
            k = len,
            found = false,
            rendererParams = {},
            rowClasses = [],
            rowEvent = me.itemRowEvent,
            i, dim, item, keys, parentGroup, prevGroup;

        if (!record) {
            item = group;
            record = item.record;
            while (!record) {
                rendererParams[item.dimension.id] = {
                    fn: 'groupTabularRenderer',
                    group: item,
                    colspan: 0,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                if (item.children) {
                    if (!item.expanded) {
                        record = item.records.collapsed;
                        rendererParams[item.dimension.id].colspan = len - item.level;
                    } else {
                        item = item.children[0];
                    }
                } else {
                    record = item.record;
                }
            }
            //Ext.apply(record.data, item.data);
            found = false;
            for (i = 0; i < len; i++) {
                dim = matrix.leftAxis.dimensions.items[i];
                if (rendererParams[dim.id]) {
                    record.data[dim.id] = rendererParams[dim.id].group.name;
                    found = true;
                } else if (found) {
                    rendererParams[dim.id] = {
                        fn: 'groupTabularRenderer',
                        group: group,
                        colspan: 0,
                        hidden: true,
                        previousExpanded: previousExpanded,
                        subtotalRow: subtotalRow
                    };
                } else {
                    record.data[dim.id] = '';
                }
            }
            if (group.level > 0) {
                prevGroup = group;
                keys = prevGroup.key.split(matrix.keysSeparator);
                keys.length--;
                parentGroup = matrix.leftAxis.items.getByKey(keys.join(matrix.keysSeparator));
                while (parentGroup && parentGroup.children[0] == prevGroup) {
                    rendererParams[parentGroup.dimension.id] = {
                        fn: 'groupTabularRenderer',
                        group: parentGroup,
                        colspan: 0,
                        hidden: false,
                        previousExpanded: previousExpanded,
                        subtotalRow: subtotalRow
                    };
                    record.data[parentGroup.dimension.id] = parentGroup.name;

                    prevGroup = parentGroup;
                    keys = prevGroup.key.split(matrix.keysSeparator);
                    keys.length--;
                    parentGroup = matrix.leftAxis.items.getByKey(keys.join(matrix.keysSeparator));
                }
            }
        } else {
            for (i = 0; i < len; i++) {
                dim = matrix.leftAxis.dimensions.items[i];

                rendererParams[dim.id] = {
                    fn: 'groupTabularRenderer',
                    group: group,
                    colspan: 0,
                    hidden: false,
                    previousExpanded: previousExpanded,
                    subtotalRow: subtotalRow
                };
                if (dim.id == group.dimension.id) {
                    rendererParams[dim.id].colspan = k;
                    found = true;
                } else {
                    rendererParams[dim.id].hidden = found;
                    k--;
                }
            }
            item = group;
        }

        if (hasSummaryData) {
            rowClasses.push(me.getClsGroupTotal());
            rowEvent = me.groupRowEvent;
        }

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: rowClasses,
            rowEvent: rowEvent,
            rendererParams: rendererParams
        };

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: item
        };

        config.results.push(record);
    },

    processRecordTabular: function (config) {
        var me = this,
            group = config['group'],
            found = false,
            record = group.record,
            items = me.getMatrix().leftAxis.dimensions.items,
            len = items.length,
            i, column;

        me.storeInfo[record.internalId] = {
            leftKey: group.key,
            rowStyle: '',
            rowClasses: [],
            rowEvent: me.itemRowEvent,
            rendererParams: {}
        };

        for (i = 0; i < len; i++) {
            column = items[i];

            if (column.id == group.dimension.id) {
                found = true;
            } else {
                record.data[column.id] = null;
            }

            me.storeInfo[record.internalId].rendererParams[column.id] = {
                fn: 'recordTabularRenderer',
                group: group,
                hidden: !found
            };
        }

        // for all top axis columns use a new renderer
        me.storeInfo[record.internalId].rendererParams['topaxis'] = {
            fn: 'topAxisRenderer',
            group: group
        };

        config.results.push(record);
    },


// various functions

    doExpandCollapse: function (key, oldRecord) {
        var me = this,
            gridMaster = me.getGrid(),
            group;

        group = me.getMatrix().leftAxis.findTreeElement('key', key);
        if (!group) {
            return;
        }

        me.doExpandCollapseInternal(group.node, oldRecord);

        gridMaster.fireEvent((group.node.expanded ? 'pivotgroupexpand' : 'pivotgroupcollapse'), gridMaster, 'row', group.node);
    },

    doExpandCollapseInternal: function (group, oldRecord) {
        var me = this,
            store = me.getStore(),
            isClassic = Ext.isClassic,
            items, oldItems, startIdx;

        group.expanded = !group.expanded;

        oldItems = me.processGroup({
            group: group,
            previousExpanded: false
        });

        group.expanded = !group.expanded;

        items = me.processGroup({
            group: group,
            previousExpanded: false
        });


        if (items.length && oldItems.length && (startIdx = store.indexOf(oldItems[0])) !== -1) {
            store.suspendEvents();

            if (group.expanded) {
                store.remove(store.getAt(startIdx));
                store.insert(startIdx, items);
            } else {
                store.remove(oldItems);
                store.insert(startIdx, items);

            }

            me.removeStoreInfoData(oldItems);

            store.resumeEvents();
            if (isClassic) {
                // For Classic, the replace event is better than remove and inserts
                store.fireEvent('replace', store, startIdx, oldItems, items);
            } else {
                // For Modern, the refresh event is better than remove and inserts
                store.fireEvent('refresh', store);
            }
        }
    },

    removeStoreInfoData: function (records) {
        var len = records.length,
            record, i;

        for (i = 0; i < len; i++) {
            record = records[i];

            if (this.storeInfo[record.internalId]) {
                delete this.storeInfo[record.internalId];
            }
        }
    },

    onGroupExpand: function (matrix, type, item) {
        if (type == 'row') {
            if (item) {
                this.doExpandCollapseInternal(item, item.records.collapsed);
            } else {
                this.processStore();
            }
        }
    },

    onGroupCollapse: function (matrix, type, item) {
        if (type == 'row') {
            if (item) {
                this.doExpandCollapseInternal(item, item.records.expanded);
            } else {
                this.processStore();
            }
        }
    }
});