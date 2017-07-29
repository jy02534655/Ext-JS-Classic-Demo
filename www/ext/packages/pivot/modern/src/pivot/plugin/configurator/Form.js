/**
 * This class implements the form that allows changing the field settings.
 */
Ext.define('Ext.pivot.plugin.configurator.Form', {
    extend: 'Ext.form.Panel',

    requires: [
        'Ext.pivot.plugin.configurator.store.Select',
        'Ext.pivot.plugin.configurator.FormController',
        'Ext.form.FieldSet',
        'Ext.field.Toggle',
        'Ext.field.Select',
        'Ext.field.Radio',
        'Ext.field.Text',
        'Ext.field.Hidden',
        'Ext.layout.VBox',
        'Ext.layout.HBox',
        'Ext.TitleBar'
    ],

    xtype: 'pivotconfigform',
    controller: 'pivotconfigform',
    viewModel: {
        stores: {
            sFormatters: {
                type: 'pivotselect'
            },
            sAggregators: {
                type: 'pivotselect'
            },
            sSorters: {
                type: 'pivotselect'
            },
            sFilters: {
                type: 'pivotselect'
            },
            sOperators: {
                type: 'pivotselect'
            },
            sTopOrder: {
                type: 'pivotselect'
            },
            sTopType: {
                type: 'pivotselect'
            },
            sDimensions: {
                type: 'pivotselect'
            },
            sAlign: {
                type: 'pivotselect'
            }
        },
        data: {
            requiredMessage: null,
            labelFilterText: null,
            valueFilterText: null
        },
        formulas: {
            filterType: {
                bind: {
                    bindTo: '{form.filter.type}',
                    deep: true
                },

                get: function(record) { return record && record.isModel ? record.get('value') : record; }
            },
            filterOperator: {
                bind: {
                    bindTo: '{form.filter.operator}',
                    deep: true
                },

                get: function(record) { return record && record.isModel ? record.get('value') : record; }
            },
            filterOperatorValue: {
                bind: '{filterCommon && !(filterOperator === "between" || filterOperator === "not between")}',
                get: function(v) { return v; }
            },
            filterOperatorBetween: {
                bind: '{filterCommon && (filterOperator === "between" || filterOperator === "not between")}',
                get: function(v) { return v; }
            },
            filterCommon: {
                bind: '{filterType === "label" || filterType === "value"}',
                get: function(v) { return v; }
            },
            filterLabel: {
                bind: '{filterType === "label"}',
                get: function(v) { return v; }
            },
            filterValue: {
                bind: '{filterType === "value"}',
                get: function(v) { return v; }
            },
            filterTop10: {
                bind: '{filterType === "top10"}',
                get: function(v) { return v; }
            }
        }
    },

    eventedConfig: {
        fieldItem: null,
        title: null
    },

    listeners: {
        fielditemchange: 'onFieldItemChanged'
    },

    defaults: {
        xtype: 'fieldset',
        defaults: {
            labelAlign: 'top'
        }
    },

    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },

    /**
     * @cfg
     * @inheritdoc
     */
    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },

    okText: 'Ok',
    cancelText: 'Cancel',
    formatText: 'Format as',
    summarizeByText: 'Summarize by',
    customNameText: 'Custom name',
    sourceNameText: 'The source name for this field is "{form.dataIndex}"',
    sortText: 'Sort',
    filterText: 'Filter',
    sortResultsText: 'Sort results',
    alignText: 'Align',
    alignLeftText: 'Left',
    alignCenterText: 'Center',
    alignRightText: 'Right',

    caseSensitiveText: 'Case sensitive',
    valueText: 'Value',
    fromText: 'From',
    toText: 'To',
    labelFilterText: 'Show items for which the label',
    valueFilterText: 'Show items for which',
    top10FilterText: 'Show',

    sortAscText: 'Sort A to Z',
    sortDescText: 'Sort Z to A',
    sortClearText: 'Disable sorting',
    clearFilterText: 'Disable filtering',
    labelFiltersText: 'Label filters',
    valueFiltersText: 'Value filters',
    top10FiltersText: 'Top 10 filters',

    equalsLText: 'equals',
    doesNotEqualLText: 'does not equal',
    beginsWithLText: 'begins with',
    doesNotBeginWithLText: 'does not begin with',
    endsWithLText: 'ends with',
    doesNotEndWithLText: 'does not end with',
    containsLText: 'contains',
    doesNotContainLText: 'does not contain',
    greaterThanLText: 'is greater than',
    greaterThanOrEqualToLText: 'is greater than or equal to',
    lessThanLText: 'is less than',
    lessThanOrEqualToLText: 'is less than or equal to',
    betweenLText: 'is between',
    notBetweenLText: 'is not between',
    topOrderTopText: 'Top',
    topOrderBottomText: 'Bottom',
    topTypeItemsText: 'Items',
    topTypePercentText: 'Percent',
    topTypeSumText: 'Sum',

    requiredFieldText: 'This field is required',
    operatorText: 'Operator',
    dimensionText: 'Dimension',
    orderText: 'Order',
    typeText: 'Type',

    updateFieldItem: function (item) {
        var me = this,
            items, field;

        me.removeAll(true, true);
        if (!item) {
            return;
        }

        field = item.getField();
        items = [{
            xtype: 'titlebar',
            docked: 'top',
            titleAlign: 'left',
            bind: {
                title: '{form.header}'
            },
            items: [{
                text: me.cancelText,
                align: 'right',
                ui: 'alt',
                handler: 'cancelSettings'
            }, {
                text: me.okText,
                align: 'right',
                ui: 'alt',
                handler: 'applySettings',
                margin: '0 0 0 5'
            }]
        }, {
            bind: {
                instructions: me.sourceNameText
            },
            items: [{
                label: me.customNameText,
                xtype: 'textfield',
                name: 'header',
                required: true,
                requiredMessage: me.requiredFieldText,
                bind: '{form.header}'
            }]
        }];

        if (field.isAggregate) {
            items.push({
                items: [{
                    label: me.alignText,
                    xtype: 'selectfield',
                    autoSelect: false,
                    useClearIcon: true,
                    name: 'align',
                    bind: {
                        store: '{sAlign}',
                        value: '{form.align}'
                    }
                }, {
                    label: me.formatText,
                    xtype: 'selectfield',
                    autoSelect: false,
                    useClearIcon: true,
                    name: 'formatter',
                    bind: {
                        store: '{sFormatters}',
                        value: '{form.formatter}'
                    }
                }, {
                    label: me.summarizeByText,
                    xtype: 'selectfield',
                    autoSelect: false,
                    useClearIcon: true,
                    name: 'aggregator',
                    bind: {
                        store: '{sAggregators}',
                        value: '{form.aggregator}'
                    }
                }]
            });
        } else {
            items.push({
                xtype: 'fieldset',
                items: [{
                    label: me.sortText,
                    labelAlign: 'top',
                    xtype: 'selectfield',
                    autoSelect: false,
                    useClearIcon: true,
                    name: 'sort',
                    bind: {
                        store: '{sSorters}',
                        value: '{form.direction}'
                    }
                }, {
                    label: me.filterText,
                    labelAlign: 'top',
                    xtype: 'selectfield',
                    autoSelect: false,
                    useClearIcon: true,
                    name: 'filter',
                    bind: {
                        store: '{sFilters}',
                        value: '{form.filter.type}'
                    },
                    listeners: {
                        change: 'onChangeFilterType'
                    }
                }]
            }, {
                defaults: {
                    labelAlign: 'top'
                },
                bind: {
                    hidden: '{!filterCommon}',
                    title: '{filterLabel ? labelFilterText : valueFilterText}'
                },
                items: [{
                    xtype: 'selectfield',
                    autoSelect: false,
                    placeholder: me.dimensionText,
                    name: 'dimensionId',
                    bind: {
                        store: '{sDimensions}',
                        value: '{form.filter.dimensionId}',
                        hidden: '{!filterValue}',
                        required: '{filterValue}',
                        requiredMessage: '{filterValue ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'selectfield',
                    autoSelect: false,
                    placeholder: me.operatorText,
                    name: 'operator',
                    bind: {
                        store: '{sOperators}',
                        value: '{form.filter.operator}',
                        required: '{filterCommon}',
                        requiredMessage: '{filterCommon ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'textfield',
                    placeholder: me.valueText,
                    name: 'value',
                    bind: {
                        value: '{form.filter.value}',
                        hidden: '{filterOperatorBetween}',
                        required: '{filterOperatorValue}',
                        requiredMessage: '{filterOperatorValue ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'textfield',
                    placeholder: me.fromText,
                    name: 'from',
                    bind: {
                        value: '{form.filter.from}',
                        hidden: '{filterOperatorValue}',
                        required: '{filterOperatorBetween}',
                        requiredMessage: '{filterOperatorBetween ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'textfield',
                    placeholder: me.toText,
                    name: 'to',
                    bind: {
                        value: '{form.filter.to}',
                        hidden: '{filterOperatorValue}',
                        required: '{filterOperatorBetween}',
                        requiredMessage: '{filterOperatorBetween ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'togglefield',
                    label: me.caseSensitiveText,
                    name: 'caseSensitive',
                    bind: '{form.filter.caseSensitive}'
                }]
            }, {
                xtype: 'fieldset',
                title: me.top10FilterText,
                defaults: {
                    labelAlign: 'top'
                },
                bind: {
                    hidden: '{!filterTop10}'
                },
                items: [{
                    xtype: 'selectfield',
                    autoSelect: false,
                    placeholder: me.orderText,
                    name: 'topOrder',
                    bind: {
                        store: '{sTopOrder}',
                        value: '{form.filter.topOrder}',
                        required: '{filterTop10}',
                        requiredMessage: '{filterTop10 ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'textfield',
                    placeholder: me.valueText,
                    name: 'topValue',
                    bind:{
                        value: '{form.filter.value}',
                        required: '{filterTop10}',
                        requiredMessage: '{filterTop10 ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'selectfield',
                    autoSelect: false,
                    placeholder: me.typeText,
                    name: 'topType',
                    bind: {
                        store: '{sTopType}',
                        value: '{form.filter.topType}',
                        required: '{filterTop10}',
                        requiredMessage: '{filterTop10 ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'selectfield',
                    autoSelect: false,
                    placeholder: me.dimensionText,
                    name: 'topDimensionId',
                    bind: {
                        store: '{sDimensions}',
                        value: '{form.filter.dimensionId}',
                        required: '{filterTop10}',
                        requiredMessage: '{filterTop10 ? requiredMessage : null}'
                    }
                }, {
                    xtype: 'togglefield',
                    label: me.sortResultsText,
                    name: 'topSort',
                    bind: '{form.filter.topSort}'
                }]
            });
        }

        me.add(items);
    }

});