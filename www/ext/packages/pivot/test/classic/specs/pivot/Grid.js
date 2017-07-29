topSuite("Ext.pivot.Grid.classic", [false, 'Ext.pivot.Grid'], function() {
    var companies = ['Google', 'Apple', 'Dell', 'Microsoft', 'Adobe'],
        companiesLen = companies.length,
        persons = ['John', 'Michael', 'Mary', 'Anne', 'Robert'],
        personsLen = persons.length,
        years = 5;

    function makeData() {
        var data = [],
            count = 1,
            i, j, k,
            company, person;

        for (i = 0; i < companiesLen; ++i) {
            company = companies[i];
            for (j = 0; j < personsLen; ++j) {
                person = persons[j];
                for (k = 1; k <= 20; ++k) {
                    data.push({
                        id: count,
                        company: company,
                        person: person,
                        date: new Date(2012 + (count % years), k, 1),
                        value: count * 1000 + 30
                    });
                    ++count;
                }
            }
        }

        return data;
    }

    var store, grid, view, selModel, navModel, pivotDone, matrix,
        rowGroupExpanded, colGroupExpanded, rowGroupCollapsed, colGroupCollapsed,
        Sale = Ext.define(null, {
            extend: 'Ext.data.Model',

            fields: [
                {name: 'id',        type: 'int'},
                {name: 'company',   type: 'string'},
                {name: 'person',    type: 'string'},
                {name: 'date',      type: 'date', defaultValue: new Date(2012, 0, 1)},
                {name: 'value',     type: 'float'},
                {
                    name: 'year',
                    convert: function(v, record) {
                        return record.get('date').getFullYear();
                    }
                },{
                    name: 'month',
                    convert: function(v, record) {
                        return record.get('date').getMonth();
                    }
                }]
        });

    function onPivotDone() {
        pivotDone = true;
    }

    function onColumnGroupExpand(matrix, type){
        if(type === 'col') {
            colGroupExpanded = true;
        }
        if(type === 'row') {
            rowGroupExpanded = true;
        }
    }
    function onColumnGroupCollapse(matrix, type){
        if(type === 'col') {
            colGroupCollapsed = true;
        }
        if(type === 'row') {
            rowGroupCollapsed = true;
        }
    }

    function makeGrid(cfg, storeData) {
        storeData = storeData || makeData();

        store = new Ext.data.Store({
            model: Sale,
            proxy: {
                type: 'memory',
                limitParam: null,
                data: storeData,
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true
        });

        // Reset flag that is set when the pivot grid has processed the data and rendered
        pivotDone = rowGroupExpanded = colGroupExpanded = rowGroupCollapsed = colGroupCollapsed = false;

        grid = new Ext.pivot.Grid(Ext.merge({
            title: 'Outline layout',
            collapsible: true,
            multiSelect: true,
            height: 350,
            width: 750,
            selModel: {
                type: 'rowmodel'
            },
            listeners: {
                pivotDone: onPivotDone,
                pivotGroupExpand: onColumnGroupExpand,
                pivotGroupCollapse: onColumnGroupCollapse
            },

            // Set this to false if multiple dimensions are configured on leftAxis and
            // you want to automatically expand the row groups when calculations are ready.
            startRowGroupsCollapsed: false,

            matrix: {
                type: 'local',
                calculateAsExcel: false,
                store: store,

                // Set layout type to "outline". If this config is missing then the default layout is "outline"
                viewLayoutType: 'outline',

                // Configure the aggregate dimensions. Multiple dimensions are supported.
                aggregate: [{
                    id: 'agg',
                    dataIndex: 'value',
                    header: 'Sum of value',
                    aggregator: 'sum',
                    width: 90
                }],

                // Configure the left axis dimensions that will be used to generate the grid rows
                leftAxis: [{
                    id: 'person',
                    dataIndex: 'person',
                    header: 'Person',
                    width: 80
                }, {
                    id: 'company',
                    dataIndex: 'company',
                    header: 'Company',
                    sortable: false,
                    width: 80
                }],

                /**
                 * Configure the top axis dimensions that will be used to generate the columns.
                 * When columns are generated the aggregate dimensions are also used. If multiple aggregation dimensions
                 * are defined then each top axis result will have in the end a column header with children
                 * columns for each aggregate dimension defined.
                 */
                topAxis: [{
                    dataIndex: 'year',
                    header: 'Year'
                }, {
                    id: 'month',
                    dataIndex: 'month',
                    header: 'Month'
                }]
            },
            renderTo: document.body
        }, cfg));
        view = grid.getView();
        selModel = view.getSelectionModel();
        navModel = view.getNavigationModel();
        matrix = grid.getMatrix();
    }

    function makeOldGrid(){

        store = new Ext.data.Store({
            model: Sale,
            proxy: {
                type: 'memory',
                limitParam: null,
                data: makeData(),
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true
        });

        // Reset flag that is set when the pivot grid has processed the data and rendered
        pivotDone = rowGroupExpanded = colGroupExpanded = rowGroupCollapsed = colGroupCollapsed = false;

        grid = new Ext.pivot.Grid({
            title: 'Outline layout',
            collapsible: true,
            multiSelect: true,
            height: 350,
            width: 750,
            selModel: {
                type: 'rowmodel'
            },
            listeners: {
                pivotDone: onPivotDone,
                pivotGroupExpand: onColumnGroupExpand,
                pivotGroupCollapse: onColumnGroupCollapse
            },

            matrixConfig: {
                type: 'local',
                store: store
            },

            // Set layout type to "outline". If this config is missing then the default layout is "outline"
            viewLayoutType: 'outline',

            // Configure the aggregate dimensions. Multiple dimensions are supported.
            aggregate: [{
                id: 'agg',
                dataIndex: 'value',
                header: 'Sum of value',
                aggregator: 'sum',
                width: 90
            }],

            // Configure the left axis dimensions that will be used to generate the grid rows
            leftAxis: [{
                id: 'person',
                dataIndex: 'person',
                header: 'Person',
                width: 80
            }, {
                id: 'company',
                dataIndex: 'company',
                header: 'Company',
                sortable: false,
                width: 80
            }],

            /**
             * Configure the top axis dimensions that will be used to generate the columns.
             * When columns are generated the aggregate dimensions are also used. If multiple aggregation dimensions
             * are defined then each top axis result will have in the end a column header with children
             * columns for each aggregate dimension defined.
             */
            topAxis: [{
                id: 'year',
                dataIndex: 'year',
                header: 'Year'
            }, {
                id: 'month',
                dataIndex: 'month',
                header: 'Month'
            }],

            renderTo: document.body
        });
        view = grid.getView();
        selModel = view.getSelectionModel();
        navModel = view.getNavigationModel();
        matrix = grid.getMatrix();
    }

    function destroyGrid(){
        Ext.destroy(grid, store);
        store = grid = view = navModel = selModel = matrix = null;
        pivotDone = rowGroupExpanded = colGroupExpanded = rowGroupCollapsed = colGroupCollapsed = false;
    }

    function checkGrandTotal(filters){
        var result;

        if(filters){
            store.clearFilter();
            store.addFilter(filters);
        }
        result = matrix.results.get(matrix.grandTotalKey, matrix.grandTotalKey);
        if(result) {
            expect(result.getValue('agg')).toBe(store.sum('value'));
        }
    }

    function checkAxisResults(item, index, len, additionalFilters){
        var keys = Ext.Object.getKeys(item.data),
            filters = Ext.Array.from(additionalFilters || []),
            i, result;

        store.clearFilter();

        for(i = 0; i < keys.length; i++){
            filters.push({
                property: keys[i],
                operator: '=',
                value: item.data[keys[i]],
                exactMatch: true
            });
        }
        store.addFilter(filters);

        if(item.axis.isLeftAxis) {
            result = matrix.results.get(item.key, matrix.grandTotalKey);
            if(result) {
                expect(result.getValue('agg')).toBe(store.sum('value'));
            }
        }else{
            result = matrix.results.get(matrix.grandTotalKey, item.key);
            if(result) {
                expect(result.getValue('agg')).toBe(store.sum('value'));
            }
        }
    }

    describe('Previous versions', function(){
        beforeEach(makeOldGrid);
        afterEach(destroyGrid);

        it('should keep compatibility', function(){
            waitsFor(function(){
                return pivotDone;
            });

            runs(function(){
                store.suspendEvents(false);

                // grand totals check
                checkGrandTotal();

                // row grand totals check
                matrix.leftAxis.items.each(checkAxisResults);

                // col grand totals check
                matrix.topAxis.items.each(checkAxisResults);

                store.resumeEvents();
            });
        });
    });

    describe('Outline view', function() {
        beforeEach(function() {
            makeGrid();
        });
        afterEach(destroyGrid);

        // https://sencha.jira.com/browse/EXTJS-17921
        it('should allow cell to cell navigation when there are colSpans', function() {
            function runsKey(cell, key) {
                runs(function() {
                    var el = view.getCellByPosition({
                        row: cell[0],
                        column: cell[1]
                    }, true);
                    jasmine.fireKeyEvent(el, 'keydown', key);
                });
            }

            function expectPos(cell) {
                runs(function() {
                    var el = view.getCellByPosition({
                        row: cell[0],
                        column: cell[1]
                    }, true);
                    expect(navModel.getPosition().getCell(true)).toBe(el);
                });
            }

            waitsFor(function() {
                return pivotDone;
            });

            focusAndWait(view);
            expectPos([0, 0]);

            runsKey([0, 0], Ext.event.Event.DOWN);
            expectPos([1, 0]);

            runsKey([1, 0], Ext.event.Event.RIGHT);
            expectPos([1, 1]);

            runsKey([1, 1], Ext.event.Event.UP);
            expectPos([0, 0]);

            runsKey([0, 0], Ext.event.Event.RIGHT);
            expectPos([0, 2]);

            runsKey([0, 2], Ext.event.Event.LEFT);
            expectPos([0, 0]);
        });

        it('should not lose focus when expanding a grouped column', function(){
            var header = grid.getHeaderContainer();

            waitsFor(function() {
                return pivotDone;
            });

            runs(function() {
                var col2 = header.columnManager.getColumns()[2],
                    col3 = header.columnManager.getColumns()[3];

                jasmine.fireKeyEvent(col2.el, 'keydown', Ext.event.Event.RIGHT);
                jasmine.fireKeyEvent(col3.el, 'keydown', Ext.event.Event.ENTER);

            });

            waitsFor(function(){
                return colGroupExpanded;
            });

            runs(function () {
                expect(header.columnManager.getColumns()[3].ownerCt.el).toHaveCls('x-column-header-focus');
            });
        });

        it('should expand group columns correctly', function(){
            var header = grid.getHeaderContainer(),
                refreshView = view.refreshView,
                count = 0;

            waitsFor(function() {
                return pivotDone;
            });

            runs(function() {
                var col2 = header.columnManager.getColumns()[1],
                    col3 = header.columnManager.getColumns()[2];

                view.refreshView = function(){
                    count++;
                    return refreshView.apply(this, arguments);
                };

                jasmine.fireKeyEvent(col2.el, 'keydown', Ext.event.Event.RIGHT);
                jasmine.fireKeyEvent(col3.el, 'keydown', Ext.event.Event.ENTER);

                view.refreshView = refreshView;
                refreshView = null;
            });

            waitsFor(function(){
                return colGroupExpanded;
            });

            runs(function () {
                var cols = header.columnManager.getColumns(),
                    cells = view.getRow(1).cells;

                expect(cols.length).toBe(cells.length);
                // expect to call refreshView only once
                expect(count).toBe(1);
            });

        });

        it('should collapse group columns correctly', function(){
            var header = grid.getHeaderContainer(),
                refreshView = view.refreshView,
                count = 0;

            waitsFor(function() {
                return pivotDone;
            });

            runs(function() {
                var col2 = header.columnManager.getColumns()[1],
                    col3 = header.columnManager.getColumns()[2];

                view.refreshView = function(){
                    count++;
                    return refreshView.apply(this, arguments);
                };

                jasmine.fireKeyEvent(col2.el, 'keydown', Ext.event.Event.RIGHT);
                jasmine.fireKeyEvent(col3.el, 'keydown', Ext.event.Event.ENTER);
                col3 = header.items.getAt(2);
                jasmine.fireKeyEvent(col3.el, 'keydown', Ext.event.Event.ENTER);

                view.refreshView = refreshView;
                refreshView = null;
            });

            waitsFor(function(){
                return colGroupCollapsed;
            });

            runs(function () {
                var cols = header.columnManager.getColumns(),
                    cells = view.getRow(1).cells;

                expect(cols.length).toBe(cells.length);
                // expect to call refreshView only once for group expand and once for group collapse
                expect(count).toBe(2);
            });

        });

    });

    describe('Compact view', function() {
        beforeEach(function() {
            makeGrid({
                startRowGroupsCollapsed: false,
                startColGroupsCollapsed: false,
                selModel: {
                    type: 'cellmodel'
                }
            });
        });
        afterEach(destroyGrid);

        // https://sencha.jira.com/browse/EXTJS-23143
        it('should collapse all columns without raising errors', function () {
            waitsFor(function () {
                return pivotDone;
            });

            runs(function () {
                var cell = view.getCellByPosition({row:0,column:8}, true);

                selModel.setPosition({
                    row: grid.store.getAt(0),
                    column: grid.getColumns()[8]
                });

                expect(selModel.getPosition().getCell(true)).toBe(cell);

                expect(function(){
                    grid.collapseAll();
                }).not.toThrow();
            });

            runs(function() {
                expect(selModel.getPosition()).toBeNull();
            });
        });
    });

    describe('All views', function() {
        afterEach(destroyGrid);

        it('should expand columns without raising errors', function () {
            var header, refreshView,
                count = 0;

            makeGrid({
                selModel: {
                    type: 'cellmodel'
                },
                matrix: {
                    aggregate: [{
                        dataIndex: 'value',
                        aggregator: 'sum'
                    }],

                    leftAxis: [{
                        dataIndex: 'company',
                        header: 'Company'
                    }],

                    topAxis: [{
                        dataIndex: 'person'
                    },{
                        dataIndex: 'year'
                    },{
                        dataIndex: 'month'
                    }]
                }
            }, [
                {
                    company: 'A',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 10,
                    quantity: 2
                },
                {
                    company: 'B',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 60,
                    quantity: 2
                },
                {
                    company: 'C',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            header = grid.getHeaderContainer();
            refreshView = view.refreshView;
            count = 0;

            waitsFor(function() {
                return pivotDone;
            });

            runs(function() {
                var col2 = header.columnManager.getColumns()[1],
                    col3;

                view.refreshView = function(){
                    count++;
                    return refreshView.apply(this, arguments);
                };

                jasmine.fireKeyEvent(col2.el, 'keydown', Ext.event.Event.ENTER);
                col3 = header.items.getAt(1).items.getAt(0);
                jasmine.fireKeyEvent(col3.el, 'keydown', Ext.event.Event.ENTER);

                view.refreshView = refreshView;
                refreshView = null;
            });

            waitsFor(function(){
                return colGroupExpanded;
            });

            runs(function () {
                // expect to call refreshView only once for group expand
                expect(count).toBe(2);
            });
        });

        it('should display horizontal scrollbar dynamically', function () {
            var scroller;

            makeGrid({
                width: 500,
                matrix: {
                    aggregate: [{
                        dataIndex: 'value',
                        aggregator: 'sum'
                    }],

                    leftAxis: [{
                        dataIndex: 'company',
                        header: 'Company'
                    }],

                    topAxis: [{
                        dataIndex: 'person'
                    },{
                        dataIndex: 'year'
                    },{
                        dataIndex: 'month'
                    }]
                }
            }, [{
                    company: 'A',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 10,
                    quantity: 2
                },{
                    company: 'B',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 60,
                    quantity: 2
                },{
                    company: 'C',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },{
                    company: 'D',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            scroller = grid.getView().getScrollable().getElement();

            waitsFor(function() {
                return pivotDone;
            });

            runs(function() {
                expect(scroller.getStyle('overflow-x')).toBe('hidden');
                grid.expandAllColumns();
            });

            waitsFor(function(){
                return colGroupExpanded;
            });

            runs(function () {
                expect(scroller.getStyle('overflow-x')).toBe('auto');
            });
        });
    });

    describe('Widgets', function () {
        afterEach(destroyGrid);

        function createWidgetSuite(xtype) {
            var viewReady;

            function createInterceptor(){
                viewReady = false;
                Ext.Function.interceptAfterOnce(Ext.sparkline.Base.prototype, 'processRedrawQueue', function(){
                    viewReady = true;
                    // wait for canvas painting
                    waits(200);
                });
            }

            function getWidget(rowIndex, colIndex) {
                var columns = grid.getColumnManager().getColumns();
                return columns[colIndex].getWidget(grid.store.getAt(rowIndex));
            }

            it('should be able to use ' + xtype, function () {
                createInterceptor();
                makeGrid({
                    startRowGroupsCollapsed: true,
                    matrix: {
                        aggregate: [{
                            dataIndex: 'value',
                            header: 'Sum of value',
                            aggregator: function(records, dataIndex){
                                var ret = [],
                                    len = records.length,
                                    i;

                                for(i = 0; i < len; i++){
                                    ret.push(records[i].get(dataIndex));
                                }
                                return ret.length ? ret : null;
                            },
                            width: 90,
                            column: {
                                xtype: 'widgetcolumn',
                                widget: {
                                    xtype: xtype
                                }
                            }
                        }],

                        leftAxis: [{
                            id: 'person',
                            dataIndex: 'person',
                            header: 'Person',
                            width: 80
                        }, {
                            id: 'company',
                            dataIndex: 'company',
                            header: 'Company',
                            sortable: false,
                            width: 80
                        }],

                        topAxis: [{
                            dataIndex: 'year',
                            header: 'Year'
                        }]
                    }
                }, [
                    {
                        company: 'A',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 10,
                        quantity: 2
                    },
                    {
                        company: 'B',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 60,
                        quantity: 2
                    },
                    {
                        company: 'C',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 20,
                        quantity: 2
                    },
                    {
                        company: 'D',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 100,
                        quantity: 2
                    }
                ]);

                waitsFor(function () {
                    return pivotDone && viewReady;
                });

                runs(function () {
                    expect(getWidget(0, 2).isComponent).toBe(true);
                    expect(getWidget(1, 2).isComponent).toBe(true);

                    if(xtype === 'sparklinebox'){
                        // values are ordered ASC
                        expect(getWidget(0, 2).getValues()).toEqual([10, 20, 60, 100]);
                        expect(getWidget(1, 2).getValues()).toEqual([10, 20, 60, 100]);
                    }else {
                        expect(getWidget(0, 2).getValues()).toEqual([10, 60, 20, 100]);
                        expect(getWidget(1, 2).getValues()).toEqual([10, 60, 20, 100]);
                    }

                    createInterceptor();
                    grid.expandAll();
                });

                waitsFor(function () {
                    return rowGroupExpanded && viewReady;
                });

                runs(function () {
                    expect(getWidget(1, 2).getValues()).toEqual([10]);
                    expect(getWidget(2, 2).getValues()).toEqual([60]);
                    expect(getWidget(3, 2).getValues()).toEqual([20]);
                    expect(getWidget(4, 2).getValues()).toEqual([100]);

                    if(xtype === 'sparklinebox'){
                        // values are ordered ASC
                        expect(getWidget(0, 2).getValues()).toEqual([10, 20, 60, 100]);
                        expect(getWidget(5, 2).getValues()).toEqual([10, 20, 60, 100]);
                    }else {
                        expect(getWidget(0, 2).getValues()).toEqual([10, 60, 20, 100]);
                        expect(getWidget(5, 2).getValues()).toEqual([10, 60, 20, 100]);
                    }

                    createInterceptor();
                    grid.collapseAll();
                });

                waitsFor(function () {
                    return rowGroupCollapsed && viewReady;
                });

                runs(function () {
                    if(xtype === 'sparklinebox'){
                        // values are ordered ASC
                        expect(getWidget(0, 2).getValues()).toEqual([10, 20, 60, 100]);
                        expect(getWidget(1, 2).getValues()).toEqual([10, 20, 60, 100]);
                    }else {
                        expect(getWidget(0, 2).getValues()).toEqual([10, 60, 20, 100]);
                        expect(getWidget(1, 2).getValues()).toEqual([10, 60, 20, 100]);
                    }
                    expect(getWidget(2, 2)).toBeNull();
                    expect(getWidget(3, 2)).toBeNull();
                    expect(getWidget(4, 2)).toBeNull();
                    expect(getWidget(5, 2)).toBeNull();
                });

            });
        }

        createWidgetSuite('sparklineline');
        createWidgetSuite('sparklinepie');
        createWidgetSuite('sparklinediscrete');
        createWidgetSuite('sparklinebox');
        createWidgetSuite('sparklinebullet');
        createWidgetSuite('sparklinetristate');
    });


});
