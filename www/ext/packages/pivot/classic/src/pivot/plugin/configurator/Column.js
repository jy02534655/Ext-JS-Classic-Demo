/**
 * This class is used for creating a configurator field component.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.Column',{
    extend: 'Ext.Component',
    
    requires: [
        'Ext.menu.Menu',
        'Ext.menu.CheckItem',
        'Ext.menu.Item',
        'Ext.menu.Separator',
        'Ext.pivot.plugin.configurator.Field',
        'Ext.pivot.plugin.configurator.window.FilterLabel',
        'Ext.pivot.plugin.configurator.window.FilterValue',
        'Ext.pivot.plugin.configurator.window.FilterTop',
        'Ext.pivot.plugin.configurator.window.FieldSettings'
    ],
    
    alias: 'widget.pivotconfigfield',

    childEls: ['textCol', 'filterCol', 'sortCol'],

    tabIndex:               0,
    focusable:              true,
    isConfiguratorField:    true,

    renderTpl:
        '<div id="{id}-configCol" role="button" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-inner" >' +
            '<span id="{id}-customCol" role="presentation" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-customize ' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-image"></span>' +
            '<span id="{id}-sortCol" role="presentation" data-ref="sortCol" class="' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn"></span>' +
            '<span id="{id}-filterCol" role="presentation" data-ref="filterCol" class="' + Ext.baseCSSPrefix + 'border-box ' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn"></span>' +
            '<span id="{id}-textCol" role="presentation" data-ref="textCol" data-qtip="{header}" class="' + Ext.baseCSSPrefix + 'pivot-grid-config-column-text ' + Ext.baseCSSPrefix + 'column-header-text ' + Ext.baseCSSPrefix + 'border-box">' +
                '{header}' +
            '</span>' +
        '</div>',
        
    header:                     '&#160;',
    minWidth:                   80,

    sortAscText:                'Sort A to Z',
    sortDescText:               'Sort Z to A',
    sortClearText:              'Disable sorting',
    clearFilterText:            'Clear filter from "{0}"',
    labelFiltersText:           'Label filters',
    valueFiltersText:           'Value filters',
    equalsText:                 'Equals...',
    doesNotEqualText:           'Does not equal...',
    beginsWithText:             'Begins with...',
    doesNotBeginWithText:       'Does not begin with...',
    endsWithText:               'Ends with...',
    doesNotEndWithText:         'Does not end with...',
    containsText:               'Contains...',
    doesNotContainText:         'Does not contain...',
    greaterThanText:            'Greater than...',
    greaterThanOrEqualToText:   'Greater than or equal to...',
    lessThanText:               'Less than...',
    lessThanOrEqualToText:      'Less than or equal to...',
    betweenText:                'Between...',
    notBetweenText:             'Not between...',
    top10Text:                  'Top 10...',

    equalsLText:                'equals',
    doesNotEqualLText:          'does not equal',
    beginsWithLText:            'begins with',
    doesNotBeginWithLText:      'does not begin with',
    endsWithLText:              'ends with',
    doesNotEndWithLText:        'does not end with',
    containsLText:              'contains',
    doesNotContainLText:        'does not contain',
    greaterThanLText:           'is greater than',
    greaterThanOrEqualToLText:  'is greater than or equal to',
    lessThanLText:              'is less than',
    lessThanOrEqualToLText:     'is less than or equal to',
    betweenLText:               'is between',
    notBetweenLText:            'is not between',
    top10LText:                 'Top 10...',
    topOrderTopText:            'Top',
    topOrderBottomText:         'Bottom',
    topTypeItemsText:           'Items',
    topTypePercentText:         'Percent',
    topTypeSumText:             'Sum',

    baseCls:            Ext.baseCSSPrefix + 'pivot-grid-config-column',
    btnIconCls:         Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-image',
    setFilterIconCls:   Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-filter-set',
    clearFilterIconCls: Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-filter-clear',
    ascSortIconCls:     Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-asc',
    descSortIconCls:    Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-desc',
    clearSortIconCls:   Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-sort-clear',
    overCls:            Ext.baseCSSPrefix + 'pivot-grid-config-column-over',
    cls:                Ext.baseCSSPrefix + 'unselectable',

    config: {
        /**
         * @cfg {String} fieldType
         *
         * Defines in which area this configurator field exists.
         *
         * Possible values:
         *
         * - `all` = the field is located in the "all fields" area;
         * - `aggregate` = the field is located in the "values" area;
         * - `leftAxis` = the field is located in the "row values" area;
         * - `topAxis` = the field is located in the "column values" area;
         *
         */
        fieldType:  'all',
        /**
         * @cfg {Ext.pivot.plugin.configurator.Field} field
         *
         * Reference to the configured dimension on this configurator field.
         */
        field:      null
    },

    destroy: function(){
        this.setField(null);
        this.callParent();
    },
    
    initRenderData: function() {
        var dim = this.getField();

        return Ext.apply(this.callParent(arguments), {
            header:         this.getFieldType() == 'aggregate' ? dim.getFieldText() : dim.getHeader(),
            dimension:      dim
        });
    },

    afterRender: function(){
        var me = this,
            dim = me.getField(),
            settings = dim.getSettings();
        
        me.callParent();

        if(Ext.Array.indexOf(['leftAxis', 'topAxis'], me.getFieldType()) >= 0){

            if( !Ext.isDefined(dim.sortable) || dim.sortable ){
                me.addSortCls(dim.direction);
            }
            
            if(dim.filter){
                me.addFilterCls();
            }
        }

        // the custom style we configure it on the textCol since that one is one level deeper
        me.textCol.setStyle(settings.getStyle());
        // but the custom class we configure it on the component itself since it's more flexible this way
        me.addCls(settings.getCls());
    },

    getMenuConfig: function(){
        var fieldType = this.getFieldType();

        if(fieldType == 'leftAxis' || fieldType == 'topAxis'){
            return this.getColMenuConfig();
        }
    },

    addSortCls: function(direction){
        var me = this;

        if(!me.sortCol){
            return;
        }

        if(direction === 'ASC' || !direction){
            me.sortCol.addCls(me.ascSortIconCls);
            me.sortCol.removeCls(me.descSortIconCls);
        }else{
            me.sortCol.addCls(me.descSortIconCls);
            me.sortCol.removeCls(me.ascSortIconCls);
        }
        me.sortCol.addCls(me.btnIconCls);
    },

    removeSortCls: function(direction){
        var me = this;

        if(!me.sortCol){
            return;
        }

        if(direction === 'ASC'){
            me.sortCol.removeCls(me.ascSortIconCls);
        }else{
            me.sortCol.removeCls(me.descSortIconCls);
        }
        me.sortCol.removeCls(me.btnIconCls);

    },

    addFilterCls: function(){
        var me = this;

        if(me.filterCol && !me.filterCol.hasCls(me.setFilterIconCls)){
            me.filterCol.addCls(me.setFilterIconCls);
            me.filterCol.addCls(me.btnIconCls);
        }
    },

    removeFilterCls: function(){
        var me = this;

        if(me.filterCol){
            me.filterCol.removeCls(me.setFilterIconCls);
            me.filterCol.removeCls(me.btnIconCls);
        }
    },

    getColMenuConfig: function(){
        var me = this,
            items = [],
            labelItems, valueItems, commonItems, i,
            filter = me.getField().filter;

        // check if the dimension is sortable
        items.push({
            text:       me.sortAscText,
            direction:  'ASC',
            iconCls:    me.ascSortIconCls,
            handler:    me.sortMe
        }, {
            text:       me.sortDescText,
            direction:  'DESC',
            iconCls:    me.descSortIconCls,
            handler:    me.sortMe
        }, {
            text:       me.sortClearText,
            direction:  '',
            disabled:   me.getField().sortable === false,
            iconCls:    me.clearSortIconCls,
            handler:    me.sortMe
        },{
            xtype:  'menuseparator'
        });

        commonItems = [{
            text:       me.equalsText,
            operator:   '='
        },{
            text:       me.doesNotEqualText,
            operator:   '!='
        },{
            xtype:  'menuseparator'
        },{
            text:       me.greaterThanText,
            operator:   '>'
        },{
            text:       me.greaterThanOrEqualToText,
            operator:   '>='
        },{
            text:       me.lessThanText,
            operator:   '<'
        },{
            text:       me.lessThanOrEqualToText,
            operator:   '<='
        },{
            xtype:  'menuseparator'
        },{
            text:       me.betweenText,
            operator:   'between'
        },{
            text:       me.notBetweenText,
            operator:   'not between'
        }];

        labelItems = Ext.clone(commonItems);
        Ext.Array.insert(labelItems, 3, [{
            text:       me.beginsWithText,
            operator:   'begins'
        },{
            text:       me.doesNotBeginWithText,
            operator:   'not begins'
        },{
            text:       me.endsWithText,
            operator:   'ends'
        },{
            text:       me.doesNotEndWithText,
            operator:   'not ends'
        },{
            xtype:  'menuseparator'
        },{
            text:       me.containsText,
            operator:   'contains'
        },{
            text:       me.doesNotContainText,
            operator:   'not contains'
        },{
            xtype:  'menuseparator'
        }]);

        for(i = 0; i < labelItems.length; i++){
            labelItems[i]['checked'] = (filter && filter.type == 'label' && filter.operator == labelItems[i].operator);
        }

        valueItems = Ext.clone(commonItems);
        valueItems.push({
            xtype:  'menuseparator'
        },{
            text:       me.top10Text,
            operator:   'top10'
        });

        for(i = 0; i < valueItems.length; i++){
            valueItems[i]['checked'] = (filter && filter.type == 'value' && filter.operator == valueItems[i].operator);
        }

        items.push({
            text:       Ext.String.format(me.clearFilterText, me.header),
            iconCls:    me.clearFilterIconCls,
            disabled:   !filter,
            handler:    me.onRemoveFilter
        },{
            text:   me.labelFiltersText,
            menu: {
                defaults: {
                    handler:    me.onShowFilter,
                    scope:      me,
                    xtype:      'menucheckitem',
                    group:      'filterlabel',
                    type:       'label'
                },
                items: labelItems
            }
        },{
            text:   me.valueFiltersText,
            menu: {
                defaults: {
                    handler:    me.onShowFilter,
                    scope:      me,
                    xtype:      'menucheckitem',
                    group:      'filtervalue',
                    type:       'value'
                },
                items: valueItems
            }
        });

        return {
            defaults: {
                scope:      me
            },
            items: items
        };
    },

    sortMe: function(btn){
        var me = this,
            field = me.getField();

        if(Ext.isEmpty(btn.direction)){
            //disable sorting
            field.setSortable(false);
            me.removeSortCls(field.getDirection());
        }else{
            field.setSortable(true);
            me.addSortCls(btn.direction);
            field.setDirection(btn.direction);
        }
        me.applyChanges();
    },

    onShowFilter: function(btn){
        var me = this,
            panel = me.up('pivotconfigpanel'),
            dataAgg = [],
            winCfg = {},
            filter = me.getField().getFilter(),
            values = {
                type:           btn.type,
                operator:       btn.operator,
                value:          (filter ? filter.value : ''),
                from:           (filter ? (Ext.isArray(filter.value) ? filter.value[0] : '') : ''),
                to:             (filter ? (Ext.isArray(filter.value) ? filter.value[1] : '') : ''),
                caseSensitive:  (filter ? filter.caseSensitive : false),
                topSort:        (filter ? filter.topSort : false)
            },
            items = panel.getAggregateContainer().items,
            len = items.getCount(),
            win, winClass, data, i, field;

        for(i = 0; i < len; i++){
            field = items.getAt(i).getField();
            dataAgg.push([field.getHeader(), field.getId()]);
        }

        if(btn.type == 'label' || (btn.type == 'value' && btn.operator != 'top10')){
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

            if(btn.type == 'label'){
                Ext.Array.insert(data, 3, [
                    [me.beginsWithLText, 'begins'],
                    [me.doesNotBeginWithLText, 'not begins'],
                    [me.endsWithLText, 'ends'],
                    [me.doesNotEndWithLText, 'not ends'],
                    [me.containsLText, 'contains'],
                    [me.doesNotContainLText, 'not contains']
                ]);
                winClass = 'Ext.pivot.plugin.configurator.window.FilterLabel';
            }else{
                winClass = 'Ext.pivot.plugin.configurator.window.FilterValue';
                Ext.apply(values, {
                    dimensionId:    (filter ? filter.dimensionId : '')
                });

                winCfg.storeAgg = new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data:   dataAgg
                });
            }

            winCfg.store = new Ext.data.ArrayStore({
                fields: ['text', 'value'],
                data:   data
            });
        }else{
            winClass = 'Ext.pivot.plugin.configurator.window.FilterTop';
            data = [];

            Ext.apply(winCfg, {
                storeTopOrder: new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data:[
                        [me.topOrderTopText, 'top'],
                        [me.topOrderBottomText, 'bottom']
                    ]
                }),
                storeTopType: new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data:[
                        [me.topTypeItemsText, 'items'],
                        [me.topTypePercentText, 'percent'],
                        [me.topTypeSumText, 'sum']
                    ]
                }),
                storeAgg: new Ext.data.ArrayStore({
                    fields: ['text', 'value'],
                    data:   dataAgg
                })
            });

            Ext.apply(values, {
                operator:       'top10',
                dimensionId:    (filter ? filter.dimensionId : ''),
                topType:        (filter ? filter.topType : 'items'),
                topOrder:       (filter ? filter.topOrder : 'top')
            });
        }

        win = Ext.create(winClass, Ext.apply(winCfg || {}, {
            title:      me.header,
            listeners: {
                applysettings: Ext.bind(me.onApplyFilterSettings, me)
            }
        }));

        win.loadSettings(values);
        win.show();
    },

    onApplyFilterSettings: function(win, filter){
        var me = this;

        win.close();
        me.addFilterCls();
        me.getField().setFilter(filter);
        me.applyChanges();
    },

    onRemoveFilter: function(){
        var me = this;

        me.removeFilterCls();
        me.getField().setFilter(null);
        me.applyChanges();
    },

    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function(){
        if(this.ownerCt) {
            this.ownerCt.applyChanges(this);
        }
    }
});