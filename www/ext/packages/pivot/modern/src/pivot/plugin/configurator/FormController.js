/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.FormController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.pivotconfigform',

    init: function(view){
        var viewModel = this.getViewModel();

        viewModel.getStore('sSorters').loadData([
            [ view.sortClearText, 'none' ],
            [ view.sortAscText, 'ASC' ],
            [ view.sortDescText, 'DESC' ]
        ]);

        viewModel.getStore('sFilters').loadData([
            [ view.clearFilterText, 'none' ],
            [ view.labelFiltersText, 'label' ],
            [ view.valueFiltersText, 'value' ],
            [ view.top10FiltersText, 'top10' ]
        ]);

        viewModel.getStore('sTopOrder').loadData([
            [view.topOrderTopText, 'top'],
            [view.topOrderBottomText, 'bottom']
        ]);

        viewModel.getStore('sTopType').loadData([
            [view.topTypeItemsText, 'items'],
            [view.topTypePercentText, 'percent'],
            [view.topTypeSumText, 'sum']
        ]);

        viewModel.getStore('sAlign').loadData([
            [view.alignLeftText, 'left'],
            [view.alignCenterText, 'center'],
            [view.alignRightText, 'right']
        ]);

        viewModel.set('labelFilterText', view.labelFilterText);
        viewModel.set('valueFilterText', view.valueFilterText);
        viewModel.set('requiredMessage', view.requiredFieldText);
    },

    applySettings: function(){
        var vm = this.getViewModel(),
            view = this.getView(),
            fieldItem = view.getFieldItem(),
            field = fieldItem.getField(),
            cfg = Ext.clone(vm.get('form')),
            item, store, sort, filter, filterType;

        if(!view.isValid()) {
            return;
        }

        if(cfg.align && cfg.align.isModel){
            cfg.align = cfg.align.get('value');
        }
        if(field.isAggregate){
            if(cfg.formatter && cfg.formatter.isModel){
                item = cfg.formatter;
            }else{
                store = vm.getStore('sFormatters');
                item = store.findRecord('value', cfg.formatter, 0, false, true, true);
            }

            if(item){
                if(item.get('type') == 1){
                    cfg.formatter = item.get('value');
                    cfg.renderer = null;
                }else{
                    cfg.renderer = item.get('value');
                    cfg.formatter = null;
                }
            }

            if(cfg.aggregator && cfg.aggregator.isModel){
                cfg.aggregator = cfg.aggregator.get('value');
            }
        }else{
            sort = cfg.direction;
            if(sort && sort.isModel){
                sort = sort.get('value');
            }
            cfg.sortable = (sort !== 'none');
            cfg.direction = sort || 'ASC';

            filter = cfg.filter;
            filterType = filter.type.isModel ? filter.type.get('value') : filter.type;

            if(!filter || !filter.type || filterType === 'none'){
                filter = null;
            }else{
                filter.type = filterType;
                if(filter.operator && filter.operator.isModel){
                    filter.operator = filter.operator.get('value');
                }
                if(filter.dimensionId && filter.dimensionId.isModel){
                    filter.dimensionId = filter.dimensionId.get('value');
                }
                if(filter.topType && filter.topType.isModel){
                    filter.topType = filter.topType.get('value');
                }
                if(filter.topOrder && filter.topOrder.isModel){
                    filter.topOrder = filter.topOrder.get('value');
                }
                if(filter.type === 'top10'){
                    filter.type = 'value';
                    filter.operator = 'top10';
                }

                if(filter.operator === 'between' || filter.operator === 'not between'){
                    filter.value = [filter.from, filter.to];
                }
                delete(filter.from);
                delete(filter.to);
                if(filter.type === 'label'){
                    delete(filter.dimensionId);
                    delete(filter.topSort);
                    delete(filter.topType);
                    delete(filter.topOrder);
                }
            }
            cfg.filter = filter;
        }

        if(view.fireEvent('beforeapplyconfigfieldsettings', view, cfg) !== false){
            field.setConfig(cfg);
            fieldItem.refreshData();
            view.fireEvent('applyconfigfieldsettings', view, cfg);
            this.cancelSettings();
        }
    },

    cancelSettings: function(){
        var view = this.getView();

        view.setFieldItem(null);
        view.fireEvent('close', view);
    },

    onFieldItemChanged: function(view, fieldItem){
        var viewModel = this.getViewModel(),
            form = {},
            dataFormatters = [],
            dataAggregators = [],
            field, settings, formatters, renderers, fns,
            length, i, list, data, filter, format;

        if(!fieldItem){
            viewModel.set('form', form);
            return;
        }

        field = fieldItem.getField();

        data = field.getConfig();

        Ext.apply(form, {
            dataIndex: data.dataIndex,
            header: data.header
        });

        if(field.isAggregate){
            settings = field.getSettings();
            formatters = settings.getFormatters();
            renderers = settings.getRenderers();
            fns = settings.getAggregators();

            length = fns.length;
            for(i = 0; i < length; i++){
                dataAggregators.push([
                    field.getAggText(fns[i]),
                    fns[i]
                ]);
            }

            list = Ext.Object.getAllKeys(formatters || {});
            length = list.length;
            for(i = 0; i < length; i++){
                dataFormatters.push([
                    list[i],
                    formatters[list[i]],
                    1
                ]);
            }

            list = Ext.Object.getAllKeys(renderers || {});
            length = list.length;
            for(i = 0; i < length; i++){
                dataFormatters.push([
                    list[i],
                    renderers[list[i]],
                    2
                ]);
            }

            viewModel.getStore('sFormatters').loadData(dataFormatters);
            viewModel.getStore('sAggregators').loadData(dataAggregators);

            format = data.formatter;
            if(Ext.isFunction(format)){
                format = null;
            }
            if(!format && !Ext.isFunction(data.renderer)){
                format = data.renderer;
            }
            Ext.apply(form, {
                formatter: format,
                aggregator: data.aggregator,
                align: data.align
            });
        }else{
            filter = data.filter;
            Ext.apply(form, {
                direction: (data.sortable ? data.direction : 'none'),
                filter: {
                    type:           (filter ? (filter.type === 'value' && filter.operator === 'top10' ? 'top10' : filter.type) : 'none'),
                    operator:       (filter ? (filter.type === 'value' && filter.operator === 'top10' ? 'top10' : filter.operator) : null),
                    value:          (filter ? filter.value : null),
                    from:           (filter ? (Ext.isArray(filter.value) ? filter.value[0] : null) : null),
                    to:             (filter ? (Ext.isArray(filter.value) ? filter.value[1] : null) : null),
                    caseSensitive:  (filter ? filter.caseSensitive : false),
                    topSort:        (filter ? filter.topSort : false),
                    topOrder:       (filter ? filter.topOrder : false),
                    topType:        (filter ? filter.topType : false),
                    dimensionId:    (filter ? filter.dimensionId : null)
                }
            });
        }
        viewModel.set('form', form);
    },

    prepareOperators: function(type){
        var me = this.getView(),
            viewModel = this.getViewModel(),
            data;

        data = [
            [me.equalsLText, '='],
            [me.doesNotEqualLText, '!='],
            [me.greaterThanLText, '>'],
            [me.greaterThanOrEqualToLText, '>='],
            [me.lessThanLText, '<'],
            [me.lessThanOrEqualToLText, '<='],
            [me.betweenLText, 'between'],
            [me.notBetweenLText, 'not between']
        ];

        if(type === 'label'){
            Ext.Array.insert(data, 3, [
                [me.beginsWithLText, 'begins'],
                [me.doesNotBeginWithLText, 'not begins'],
                [me.endsWithLText, 'ends'],
                [me.doesNotEndWithLText, 'not ends'],
                [me.containsLText, 'contains'],
                [me.doesNotContainLText, 'not contains']
            ]);
        }

        viewModel.getStore('sOperators').loadData(data);
    },

    onChangeFilterType: function(combo, record){
        var type = record && record.isModel ? record.get('value') : record;

        if(type === 'label' || type === 'value'){
            this.prepareOperators(type);
        }
    }

});