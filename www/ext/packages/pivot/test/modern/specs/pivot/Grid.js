/* global Ext, jasmine, expect */

topSuite("Ext.pivot.Grid.modern",
    [false, 'Ext.pivot.Grid', 'Ext.sparkline.*', 'Ext.grid.cell.Widget'],
function() {
    var companies = ['Google', 'Apple', 'Dell', 'Microsoft', 'Adobe'],
        companiesLen = companies.length,
        persons = ['John', 'Michael', 'Mary', 'Anne', 'Robert'],
        personsLen = persons.length,
        years = 5;

    function isBlank (s) {
        return !s || s === '\xA0' || s === '&nbsp;';
    }
    function expectBlank (s) {
        if (!isBlank(s)) {
            expect(s).toBe('{BLANK}');
        }
    }

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
                        date: new Date(2012 + (count % years), 0, 1),
                        value: count * 1000 + 30
                    });
                    ++count;
                }
            }
        }

        return data;
    }

    var store, grid, matrix,
        pivotEvents = {},
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

    function fireClick(target) {
        jasmine.fireMouseEvent(target, 'click');
    }

    function fireDblClick(target) {
        jasmine.fireMouseEvent(target, 'dblclick');
    }

    function getEventHandler(type){
        return function(){
            pivotEvents[type] = true;
        };
    }

    function checkRowCells(index, values) {
        var cells = grid.getItemAt(index).cells,
            len = values.length,
            html, i, cell;

        for(i = 0; i < len; i++){
            cell = cells[i].element.down('.x-pivot-grid-group-title', true) ||
                cells[i].element.down('.x-body-el', true);

            html = cell.innerHTML;

            if (isBlank(values[i])) {
                expectBlank(html);
            }
            else {
                expect(html).toBe(values[i]);
            }
        }
    }

    function makeGrid(gridConfig, storeData) {
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
        pivotEvents = {};

        grid = new Ext.pivot.Grid(Ext.merge({
            title: 'Test pivot',
            collapsible: true,
            multiSelect: true,
            height: 350,
            width: 750,
            listeners: {
                pivotDone: getEventHandler('done'),
                pivotGroupExpand: function(matrix, type){
                    if(type === 'row') {
                        pivotEvents.groupRowExpand = true;
                    }else{
                        pivotEvents.groupColExpand = true;
                    }
                },
                pivotGroupCollapse: function(matrix, type){
                    if(type === 'row') {
                        pivotEvents.groupRowCollapse = true;
                    }else{
                        pivotEvents.groupColCollapse = true;
                    }
                },
                pivotGroupTap: getEventHandler('groupTap'),
                pivotGroupDoubleTap: getEventHandler('groupDoubleTap'),
                pivotGroupTapHold: getEventHandler('groupTapHold'),
                pivotGroupCellTap: getEventHandler('groupCellTap'),
                pivotGroupCellDoubleTap: getEventHandler('groupCellDoubleTap'),
                pivotGroupCellTapHold: getEventHandler('groupCellTapHold'),
                pivotItemTap: getEventHandler('itemTap'),
                pivotItemDoubleTap: getEventHandler('itemDoubleTap'),
                pivotItemTapHold: getEventHandler('itemTapHold'),
                pivotItemCellTap: getEventHandler('itemCellTap'),
                pivotItemCellDoubleTap: getEventHandler('itemCellDoubleTap'),
                pivotItemCellTapHold: getEventHandler('itemCellTapHold')
            },

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
                }]
            },

            renderTo: document.body
        }, gridConfig));

        matrix = grid.getMatrix();
    }

    function destroyGrid(){
        Ext.destroy(grid, store);
        store = grid = matrix = null;
        pivotEvents = {};
    }

    afterEach(destroyGrid);

    describe('styling via data binding', function(){

        describe('viewModel on row level', function(){
            it('should style a row using a formula', function(){
                makeGrid({
                    itemConfig: {
                        viewModel: {
                            type: 'default',
                            formulas: {
                                rowStyle: function (get) {
                                    var isGrandTotal = get('record.isRowGrandTotal'),
                                        isHeader = get('record.isRowGroupHeader'),
                                        isFooter = get('record.isRowGroupTotal'),
                                        cls = '';

                                    if (isGrandTotal) {
                                        cls = 'pivotRowGrandTotal';
                                    } else if (isHeader) {
                                        cls = 'pivotRowHeader';
                                    } else if (isFooter) {
                                        cls = 'pivotRowTotal';
                                    }
                                    return cls;
                                }
                            }
                        },
                        bind: {
                            userCls: '{rowStyle}'
                        }
                    }
                });

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    var row = grid.getItemAt(0);
                    row.lookupViewModel().notify();
                    expect(row.element.hasCls('pivotRowHeader')).toBe(true);
                });
            });

            it('should style a row using a template', function(){
                makeGrid({
                    itemConfig: {
                        viewModel: {
                            type: 'default'
                        },
                        bind: {
                            userCls: '{record.isRowGroupHeader:pick("","pivotRowHeader")}'
                        }
                    }
                });

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    var row = grid.getItemAt(0);
                    row.lookupViewModel().notify();
                    expect(row.element.hasCls('pivotRowHeader')).toBe(true);
                });
            });

            it('should style a cell using a cell template', function(){
                makeGrid({
                    itemConfig: {
                        viewModel: {}
                    },
                    topAxisCellConfig: {
                        bind: {
                            // you can't define formulas that use `column` since `column` can't be
                            // replaced in a formula with the dynamically generated column information
                            userCls: '{column.isColGrandTotal:pick(null,"pivotCellGrandTotal")}'
                        }
                    }
                });

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    var row = grid.getItemAt(0);
                    row.lookupViewModel().notify();
                    expect(row.cells[7].element.hasCls('pivotCellGrandTotal')).toBe(true);
                });
            });

            it('should style a cell using an aggregate bind', function(){
                makeGrid({
                    itemConfig: {
                        viewModel: {
                            type: 'default'
                        }
                    },
                    matrix: {
                        aggregate: [{
                            id: 'agg',
                            dataIndex: 'value',
                            header: 'Sum of value',
                            aggregator: 'sum',
                            width: 90,
                            cellConfig: {
                                bind: {
                                    userCls: '{value:sign("pivotCellNegative","pivotCellPositive")}'
                                }
                            }
                        }]
                    }
                });

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    var row = grid.getItemAt(0);
                    row.lookupViewModel().notify();
                    expect(row.cells[6].element.hasCls('pivotCellPositive')).toBe(true);
                });
            });

        });

        describe('viewModel on cell level', function(){

            it('should style a cell using a formula', function(){
                makeGrid({
                    topAxisCellConfig: {
                        viewModel: {
                            type: 'default',
                            formulas: {
                                cellStyle: function (get) {
                                    var isGrandTotal = get('record.isRowGrandTotal') || get('column.isColGrandTotal'),
                                        isHeader = get('record.isRowGroupHeader') || get('column.isColGroupTotal'),
                                        isFooter = get('record.isRowGroupTotal'),
                                        value = get('value'),
                                        cls = get('column.topAxisColumn') ?
                                            (value >= 500 ? 'pivotCellAbove500' : 'pivotCellUnder500') : '';

                                    if(isGrandTotal){
                                        cls = 'pivotCellGrandTotal';
                                    }else if(isFooter){
                                        cls = 'pivotCellGroupFooter';
                                    }else if(isHeader){
                                        cls = 'pivotCellGroupHeader';
                                    }

                                    return cls;
                                }
                            }
                        },
                        bind: {
                            userCls: '{cellStyle}'
                        }
                    }
                });

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function () {
                    var cell = grid.getItemAt(0).cells[7];
                    cell.lookupViewModel().notify();
                    expect(cell.element.hasCls('pivotCellGrandTotal')).toBe(true);
                });
            });

        });

    });

    describe('Events', function(){
        function getCenter(el) {
            return Ext.fly(el).getXY();
        }

        function doTouch(method, idx, cellIdx, cfg) {
            runs(function() {
                cfg = cfg || {};

                var el = grid.getItemAt(idx).cells[cellIdx].element,
                    center = getCenter(el),
                    x = cfg.hasOwnProperty('x') ? cfg.x : center[0],
                    y = cfg.hasOwnProperty('y') ? cfg.y : center[1],
                    offsetX = cfg.hasOwnProperty('offsetX') ? cfg.offsetX : 0,
                    offsetY = cfg.hasOwnProperty('offsetY') ? cfg.offsetY : 0;

                Ext.testHelper[method](el, {
                    x: x + offsetX,
                    y: y + offsetY
                });
            });
        }

        function touchStart(idx, cellIdx, cfg) {
            doTouch('touchStart', idx, cellIdx, cfg);
        }

        function touchMove(idx, cellIdx, cfg) {
            doTouch('touchMove', idx, cellIdx, cfg);
        }

        function touchEnd(idx, cellIdx, cfg) {
            doTouch('touchEnd', idx, cellIdx, cfg);
        }

        function touchCancel(idx, cellIdx, cfg) {
            doTouch('touchCancel', idx, cellIdx, cfg);
        }

        function tap(idx, cellIdx, cfg) {
            doTouch('tap', idx, cellIdx, cfg);
        }

        it('should fire "pivotgroupexpand" on rows', function(){
            makeGrid();

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                var cell = grid.getItemAt(0).cells[0];
                fireClick(cell.element);
            });

            waitsFor(function() {
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function() {
                var result = matrix.results.get(matrix.leftAxis.tree[0].children[0].key, matrix.topAxis.tree[0].key);

                expect(pivotEvents.groupRowExpand).toBe(true);

                if (result) {
                    // check the value of an expanded cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(1).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgroupexpand" on leftAxis items', function(){
            makeGrid();

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                matrix.leftAxis.tree[0].expand();
            });

            waitsFor(function() {
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function() {
                var result = matrix.results.get(matrix.leftAxis.tree[0].children[0].key, matrix.topAxis.tree[0].key);

                expect(pivotEvents.groupRowExpand).toBe(true);

                if (result) {
                    // check the value of an expanded cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(1).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgroupexpand" on columns', function(){
            makeGrid();

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[2];

                fireClick(column.element);
            });

            waitsFor(function() {
                return pivotEvents.groupColExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[2],
                    topKey = column.group.children[0].key,
                    leftKey = grid.getItemAt(0).getRecordInfo().leftKey,
                    result = matrix.results.get(leftKey, topKey);

                expect(pivotEvents.groupColExpand).toBe(true);

                if (result) {
                    // check the value of an expanded cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(0).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgroupcollapse" on columns', function(){
            makeGrid({
                startColGroupsCollapsed: false
            });

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[2];

                fireClick(column.element);
            });

            waitsFor(function() {
                return pivotEvents.groupColCollapse;
            }, 'pivotgroupcollapse event to be fired');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[2],
                    topKey = column.group.children[0].key,
                    leftKey = grid.getItemAt(0).getRecordInfo().leftKey,
                    result = matrix.results.get(leftKey, topKey);

                expect(pivotEvents.groupColCollapse).toBe(true);

                if (result) {
                    // check the value of an expanded cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(0).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgroupexpand" on topAxis items', function(){
            makeGrid();

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                matrix.topAxis.tree[0].expand();
            });

            waitsFor(function() {
                return pivotEvents.groupColExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function() {
                var result = matrix.results.get(matrix.leftAxis.tree[0].key, matrix.topAxis.tree[0].children[0].key);
                expect(pivotEvents.groupColExpand).toBe(true);

                if (result) {
                    // check the value of an expanded cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(0).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgroupcollapse" on topAxis items', function(){
            makeGrid({
                startColGroupsCollapsed: false
            });

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                matrix.topAxis.tree[0].collapse();
            });

            waitsFor(function() {
                return pivotEvents.groupColCollapse;
            }, 'pivotgroupcollapse event to be fired');

            runs(function() {
                var result = matrix.results.get(matrix.leftAxis.tree[0].key, matrix.topAxis.tree[0].children[0].key);
                expect(pivotEvents.groupColCollapse).toBe(true);

                if (result) {
                    // check the value of a collapsed cell
                    expect(result.getValue('agg')).toBe(grid.getItemAt(0).cells[2].getValue());
                }
            });
        });

        it('should fire "pivotgrouptap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupTap;
            }, 'pivotgrouptap event to be fired');

            runs(function(){
                expect(pivotEvents.groupTap).toBe(true);
                touchCancel(0, 0);
            });
        });

        // Android appears to always double-tap-zoom
        if (!Ext.isAndroid) {
            it('should fire "pivotgroupdoubletap"', function(){
                makeGrid({
                    startRowGroupsCollapsed: false,
                    matrix: {
                        rowSubTotalsPosition: 'last'
                    }
                },
                [
                    {
                        company: 'A',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 80,
                        quantity: 2
                    },
                    {
                        company: 'B',
                        country: 'USA',
                        person: 'Adrian',
                        date: new Date(2015, 0, 1),
                        value: 60,
                        quantity: 2
                    }
                ]);

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    // doubletap on the expandable group header doesn't work because it
                    // will cause a collapse/expand but we can doubletap the group footer
                    // where the subtotal exists
                    tap(3, 0);
                    tap(3, 0);
                });

                waitsFor(function(){
                    return pivotEvents.groupDoubleTap;
                }, 'pivotgroupodoubletap event to be fired');

                runs(function(){
                    expect(pivotEvents.groupDoubleTap).toBe(true);
                    touchCancel(3, 0);
                });
            });
        }

        it('should fire "pivotgrouptaphold"', function(){
            makeGrid();

            waitsFor(function(){
               // Also wait for data to appear in case it comes from a binding
               return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                touchStart(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupTapHold;
            }, 'pivotgrouptaphold event to be fired');

            runs(function(){
                expect(pivotEvents.groupTapHold).toBe(true);
                touchCancel(0, 0);
            });
        });

        it('should fire "pivotgroupcelltap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 3);
            });

            waitsFor(function(){
                return pivotEvents.groupCellTap;
            }, 'pivotgroupcelltap event to be fired');

            runs(function(){
                expect(pivotEvents.groupCellTap).toBe(true);
                touchCancel(0, 3);
            });
        });

        it('should fire "pivotgroupcelldoubletap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 3);
                tap(0, 3);
            });

            waitsFor(function(){
                return pivotEvents.groupCellDoubleTap;
            }, 'pivotgroupcelldoubletap event to be fired');

            runs(function(){
                expect(pivotEvents.groupCellDoubleTap).toBe(true);
                touchCancel(0, 3);
            });
        });

        it('should fire "pivotitemtap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function(){
                touchCancel(0, 0);
                tap(1, 1);
            });

            waitsFor(function(){
                return pivotEvents.itemTap;
            }, 'pivotitemtap event to be fired');

            runs(function(){
                expect(pivotEvents.itemTap).toBe(true);
                touchCancel(1, 1);
            });
        });

        it('should fire "pivotitemdoubletap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            // Wait for the the doubletap timer to expire after the above single tap.
            // Otherwise the upcoming two taps won't be recognized as a double tap pair.
            waits(300);

            runs(function(){
                touchCancel(0, 0);
                tap(1, 1);
                tap(1, 1);
            });

            waitsFor(function(){
                return pivotEvents.itemDoubleTap;
            }, 'pivotitemdoubletap event to be fired');

            runs(function(){
                expect(pivotEvents.itemDoubleTap).toBe(true);
                touchCancel(1, 1);
            });
        });

        it('should fire "pivotitemcelltap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function(){
                touchCancel(0, 0);
                tap(1, 3);
            });

            waitsFor(function(){
                return pivotEvents.itemCellTap;
            }, 'pivotitemcelltap event to be fired');

            runs(function(){
                expect(pivotEvents.itemCellTap).toBe(true);
                touchCancel(1, 3);
            });
        });

        it('should fire "pivotitemcelldoubletap"', function(){
            makeGrid();

            waitsFor(function(){
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function(){
                tap(0, 0);
            });

            waitsFor(function(){
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            // Wait for the the doubletap timer to expire after the above single tap.
            // Otherwise the upcoming two taps won't be recognized as a double tap pair.
            waits(300);

            runs(function(){
                touchCancel(0, 0);
                tap(1, 3);
                tap(1, 3);
            });

            waitsFor(function(){
                return pivotEvents.itemCellDoubleTap;
            }, 'pivotitemcelldoubletap event to be fired');

            runs(function(){
                expect(pivotEvents.itemCellDoubleTap).toBe(true);
                touchCancel(1, 3);
            });
        });

    });

    describe('showZeroAsBlank', function(){

        it('should show cells that have 0s as blanks', function(){
            makeGrid({
                matrix: {
                    showZeroAsBlank: true
                }
            });
            matrix.store.each(function(rec) {
                rec.set('value', 0);
            });
            pivotEvents = {};

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done;
            }, 'pivot to be ready');

            runs(function() {
                var cell = grid.getItemAt(0).cells[7];
                var html = cell.element.down('.x-body-el', true).innerHTML;

                expectBlank(html);
            });
        });

        it('should show cells that have 0s as 0s', function(){
            makeGrid({
                matrix: {
                    showZeroAsBlank: false
                }
            });
            matrix.store.each(function(rec) {
                rec.set('value', 0);
            });
            pivotEvents = {};

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done;
            }, 'pivot to be ready');

            runs(function() {
                var cell = grid.getItemAt(0).cells[7];
                var html = cell.element.down('.x-body-el', true).innerHTML;

                expect(html).toBe('0');
            });

        });
    });

    describe('Outline view', function () {
        afterEach(destroyGrid);

        it('should render cells correctly on left axis columns', function () {
            makeGrid();

            waitsFor(function () {
                return pivotEvents.done;
            }, 'pivot to be ready');

            runs(function () {
                var cell = grid.getItemAt(0).cells[0];
                var html;

                html = cell.element.down('.x-pivot-grid-group-title', true).innerHTML;
                expect(html).toBe(matrix.leftAxis.getTree()[0].value);

                cell = grid.getItemAt(0).cells[1];
                html = cell.element.down('.x-pivot-grid-group-title', true).innerHTML;

                expectBlank(html);
            });
        });

        it('should not throw when expanding row groups', function () {
            makeGrid({
                selectable: {
                    cells: true
                },
                startRowGroupsCollapsed: true,
                matrix: {
                    viewLayoutType: 'outline',
                    leftAxis: [{
                        dataIndex: 'person',
                        header: 'Person'
                    },{
                        dataIndex: 'year',
                        header: 'Year'
                    }],
                    topAxis: [{
                        dataIndex: 'country'
                    },{
                        dataIndex: 'company'
                    }]
                }
            }, [
                {
                    company: 'A',
                    country: 'USA',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 80,
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
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    country: 'USA',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            waitsFor(function () {
                return pivotEvents.done;
            }, 'pivot to be ready');

            runs(function() {
                var cell = grid.getItemAt(0).cells[0];
                fireClick(cell.element);
            });

            waitsFor(function() {
                return pivotEvents.groupRowExpand;
            }, 'pivotgroupexpand event to be fired');

            runs(function() {
                var cell = grid.getItemAt(2).cells[0];
                expect(function() {
                    fireClick(cell.element);
                }).not.toThrow();
            });
        });

        it('should render cells correctly when expanding top axis columns', function () {
            makeGrid({
                startRowGroupsCollapsed: true,
                matrix: {
                    viewLayoutType: 'outline',
                    leftAxis: {
                        dataIndex: 'person',
                        header: 'Person'
                    },
                    topAxis: [{
                        dataIndex: 'year'
                    },{
                        dataIndex: 'country'
                    },{
                        dataIndex: 'company'
                    }]
                }
            }, [
                {
                    company: 'A',
                    country: 'USA',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 80,
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
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    country: 'USA',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                fireClick(grid.getHeaderContainer().innerItems[1].element);
            });

            waitsFor(function () {
                return pivotEvents.groupColExpand;
            });

            runs(function () {
                pivotEvents.groupColExpand = false;
                fireClick(grid.getHeaderContainer().innerItems[1].innerItems[0].element);
            });

            waitsFor(function() {
                return pivotEvents.groupColExpand;
            });

            runs(function() {
                checkRowCells(0, ['Adrian',     '80.00',    '60.00',    '',         '',         '140.00', '140.00', '140.00']);
                checkRowCells(1, ['Nige',       '',         '',         '20.00',    '100.00',   '120.00', '120.00', '120.00']);
                checkRowCells(2, ['Grand total','80.00',    '60.00',    '20.00',    '100.00',   '260.00', '260.00', '260.00']);
            });
        });

        it('should render cells correctly when expanding all', function () {
            makeGrid({
                startRowGroupsCollapsed: true,
                startColGroupsCollapsed: true,
                matrix: {
                    viewLayoutType: 'outline',
                    leftAxis: {
                        dataIndex: 'person',
                        header: 'Person'
                    },
                    topAxis: [{
                        dataIndex: 'year'
                    },{
                        dataIndex: 'country'
                    },{
                        dataIndex: 'company'
                    }]
                }
            }, [
                {
                    company: 'A',
                    country: 'USA',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 80,
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
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    country: 'USA',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                grid.expandAll();
            });

            waitsFor(function () {
                return pivotEvents.groupRowExpand && pivotEvents.groupColExpand;
            });

            runs(function() {
                checkRowCells(0, ['Adrian',     '80.00',    '60.00',    '',         '',         '140.00', '140.00', '140.00']);
                checkRowCells(1, ['Nige',       '',         '',         '20.00',    '100.00',   '120.00', '120.00', '120.00']);
                checkRowCells(2, ['Grand total','80.00',    '60.00',    '20.00',    '100.00',   '260.00', '260.00', '260.00']);
            });
        });
    });

    describe('Tabular view', function () {
        afterEach(destroyGrid);

        it('should render cells correctly on left axis columns', function () {
            makeGrid({
                startRowGroupsCollapsed: false,
                matrix: {
                    viewLayoutType: 'tabular'
                }
            });

            waitsFor(function () {
                return pivotEvents.done;
            }, 'pivot to be ready');

            runs(function () {
                var cell = grid.getItemAt(0).cells[0];

                expect(cell.element.down('.x-pivot-grid-group-title', true).innerHTML).toBe(matrix.leftAxis.getTree()[0].value);

                cell = grid.getItemAt(0).cells[1];
                expect(cell.element.down('.x-pivot-grid-group-title', true).innerHTML).toBe(matrix.leftAxis.getTree()[0].children[0].name);
            });
        });

        it('should sort top axis columns', function(){
            makeGrid({
                startRowGroupsCollapsed: false,
                matrix: {
                    viewLayoutType: 'tabular'
                }
            }, [
                {
                    company: 'A',
                    country: 'USA',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 80,
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
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    country: 'USA',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[3];

                grid.getStore().on({
                    pivotstoreremodel: function () {
                        pivotEvents.pivotstoreremodel = true;
                    },
                    single: true
                });

                fireClick(column.element);
            });

            waitsFor(function() {
                return pivotEvents.pivotstoreremodel;
            });

            runs(function() {
                checkRowCells(0, ['Nige',           'C',    '20.00',    '20.00']);
                checkRowCells(1, ['',               'D',    '100.00',   '100.00']);
                checkRowCells(2, ['Total (Nige)',   '',     '120.00',   '120.00']);
                checkRowCells(3, ['Adrian',         'B',    '60.00',    '60.00']);
                checkRowCells(4, ['',               'A',    '80.00',    '80.00']);
                checkRowCells(5, ['Total (Adrian)', '',     '140.00',   '140.00']);
                checkRowCells(6, ['Grand total',    '',     '260.00',   '260.00']);
            });
        });

        it('should sort left axis columns after a top axis column was sorted', function(){
            makeGrid({
                startRowGroupsCollapsed: false,
                matrix: {
                    viewLayoutType: 'tabular'
                }
            }, [
                {
                    company: 'A',
                    country: 'USA',
                    person: 'Adrian',
                    date: new Date(2015, 0, 1),
                    value: 80,
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
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 20,
                    quantity: 2
                },
                {
                    company: 'D',
                    country: 'USA',
                    person: 'Nige',
                    date: new Date(2015, 0, 1),
                    value: 100,
                    quantity: 2
                }
            ]);

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[3];

                grid.getStore().on({
                    pivotstoreremodel: function () {
                        pivotEvents.pivotstoreremodel = true;
                    },
                    single: true
                });

                fireClick(column.element);
            });

            waitsFor(function() {
                return pivotEvents.pivotstoreremodel;
            });

            runs(function() {
                var column = grid.getHeaderContainer().innerItems[1];

                checkRowCells(0, ['Nige',           'C',    '20.00',    '20.00']);
                checkRowCells(1, ['',               'D',    '100.00',   '100.00']);
                checkRowCells(2, ['Total (Nige)',   '',     '120.00',   '120.00']);
                checkRowCells(3, ['Adrian',         'B',    '60.00',    '60.00']);
                checkRowCells(4, ['',               'A',    '80.00',    '80.00']);
                checkRowCells(5, ['Total (Adrian)', '',     '140.00',   '140.00']);
                checkRowCells(6, ['Grand total',    '',     '260.00',   '260.00']);

                pivotEvents.pivotstoreremodel = false;

                grid.getStore().on({
                    pivotstoreremodel: function () {
                        pivotEvents.pivotstoreremodel = true;
                    },
                    single: true
                });

                fireClick(column.element);
            });

            waitsFor(function() {
                return pivotEvents.pivotstoreremodel;
            });

            runs(function() {
                // it should sort company ascending
                checkRowCells(0, ['Nige',           'C',    '20.00',    '20.00']);
                checkRowCells(1, ['',               'D',    '100.00',   '100.00']);
                checkRowCells(2, ['Total (Nige)',   '',     '120.00',   '120.00']);
                checkRowCells(3, ['Adrian',         'A',    '80.00',    '80.00']);
                checkRowCells(4, ['',               'B',    '60.00',    '60.00']);
                checkRowCells(5, ['Total (Adrian)', '',     '140.00',   '140.00']);
                checkRowCells(6, ['Grand total',    '',     '260.00',   '260.00']);
            });
        });

        it('should not throw when reconfigured and focused', function() {
            makeGrid({
                matrix: {
                    collapsibleRows: true,
                    collapsibleColumns: true
                }
            });

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                pivotEvents.done = false;
                grid.reconfigurePivot({
                    collapsibleRows: false,
                    collapsibleColumns: false
                })
            });

            waitsFor(function() {
                // Also wait for data to appear in case it comes from a binding
                return pivotEvents.done && store.getCount();
            }, 'pivot to be ready');

            runs(function() {
                expect(function() {
                    var scroller = grid.getScrollable();

                    scroller.doScrollTo(50,50);
                    fireClick(scroller.getElement());
                }).not.toThrow();
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
                var columns = grid.getColumns();
                return columns[colIndex].getCells()[rowIndex].getWidget();
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
                                cell: {
                                    xtype: 'widgetcell',
                                    forceWidth: true,
                                    widget: {
                                        xtype: xtype
                                    }
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
                    return pivotEvents.done && viewReady;
                }, 'pivot to be ready');

                runs(function () {
                    if (xtype === 'sparklinebox') {
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
                    return pivotEvents.groupRowExpand && viewReady;
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
                    return pivotEvents.groupRowCollapse && viewReady;
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

                    // remove all records
                    pivotEvents.done = false;
                    store.removeAll();
                });

                waitsFor(function () {
                    return pivotEvents.done && viewReady;
                });

                runs(function () {
                    expect(getWidget(0, 2).getValues()).toEqual(null);
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
