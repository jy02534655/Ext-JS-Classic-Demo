topSuite("Ext.grid.plugin.Exporter", ['Ext.exporter.*', 'Ext.grid.*', 'Ext.data.*'], function() {
    var cmp, events, ready, saveAs, saveBinaryAs, savePopup, table;

    function onEventFired(event){
        return function(){
            var deferred = new Ext.Deferred();

            events[event] = true;
            deferred.resolve();

            return deferred.promise;
        }
    }

    function makeCmp(docCfg, gridCfg, dataReadyCallback){
        events = {};
        cmp = Ext.create(Ext.merge({
            xtype: 'grid',
            title: 'Simpsons',
            store: {
                fields: ['name', 'email', 'phone', 'age'],
                data: [
                    { name: 'Lisa', email: 'lisa@simpsons.com', phone: '555-111-1224', age: 15 },
                    { name: 'Bart', email: 'bart@simpsons.com', phone: '555-222-1234' , age: 17 },
                    { name: 'Homer', email: 'homer@simpsons.com', phone: '555-222-1244', age: 44 },
                    { name: 'Marge', email: 'marge@simpsons.com', phone: '555-222-1254', age: 42 }
                ]
            },
            columns: [{
                text: 'Name',
                dataIndex: 'name',
                width: 100
            },{
                text: 'Email',
                dataIndex: 'email',
                flex: 1,
                exportStyle: [{
                    font: {
                        italic: true
                    }
                },{
                    type: 'html',
                    alignment:{
                        horizontal: 'Right'
                    }
                }]
            },{
                text: 'Phone',
                dataIndex: 'phone',
                flex: 1,
                ignoreExport: true
            },{
                text: 'Age',
                dataIndex: 'age',
                width: 50
            }],

            plugins: 'gridexporter',
            listeners: {
                beforedocumentsave: onEventFired('beforedocumentsave'),
                documentsave: onEventFired('documentsave'),

                dataready: function(cmp, params) {
                    table = params.exporter.getData();
                    events.dataready = true;
                    if(dataReadyCallback) {
                        dataReadyCallback(table);
                    }
                }
            },
            renderTo: document.body,
            width: 500,
            height: 300
        }, gridCfg));

        ready = false;
        backupFileFunctions();
        cmp.saveDocumentAs(Ext.apply({
            type: 'excel'
        }, docCfg)).always(function() {
            ready = true;
        });
    }

    function backupFileFunctions() {
        // temporarily disable saveAs and saveBinaryAs
        savePopup = Ext.exporter.File.initializePopup;
        Ext.exporter.File.initializePopup = Ext.emptyFn;
        saveAs = Ext.exporter.File.saveAs;
        Ext.exporter.File.saveAs = onEventFired('saved');
        saveBinaryAs = Ext.exporter.File.saveBinaryAs;
        Ext.exporter.File.saveBinaryAs = onEventFired('saved');
    }

    function restoreFileFunctions() {
        Ext.exporter.File.saveAs = saveAs;
        Ext.exporter.File.saveBinaryAs = saveBinaryAs;
        Ext.exporter.File.initializePopup = savePopup;
    }

    function destroyCmp(){
        events = cmp = ready = table = Ext.destroy(cmp);
        restoreFileFunctions();
    }

    describe('extract grid columns', function () {
        afterEach(destroyCmp);

        it('should ignore hidden columns', function(){
            makeCmp({
                type: 'csv'
            },{
                columns: [{
                    text: 'Name',
                    dataIndex: 'name',
                    width: 100
                },{
                    text: 'Email',
                    dataIndex: 'email',
                    flex: 1,
                    hidden: true
                },{
                    text: 'Phone',
                    dataIndex: 'phone',
                    flex: 1,
                    hidden: true
                },{
                    text: 'Age',
                    dataIndex: 'age',
                    width: 50
                }]
            }, function(table) {
                expect(table.getColumns().length).toBe(2);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should ignore hidden group headers', function(){
            makeCmp({
                type: 'csv'
            },{
                columns: [{
                    text: 'Name',
                    dataIndex: 'name',
                    width: 100
                },{
                    text: 'Info',
                    columns: [{
                        text: 'Email',
                        dataIndex: 'email',
                        flex: 1,
                        hidden: true
                    },{
                        text: 'Phone',
                        dataIndex: 'phone',
                        flex: 1,
                        hidden: true
                    }]
                },{
                    text: 'Age',
                    dataIndex: 'age',
                    width: 50
                }]
            }, function(table) {
                expect(table.getColumns().length).toBe(2);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should ignore columns that have ignoreExport = true', function(){
            makeCmp({
                type: 'csv'
            },{
                columns: [{
                    text: 'Name',
                    dataIndex: 'name',
                    width: 100
                },{
                    text: 'Email',
                    dataIndex: 'email',
                    flex: 1,
                    ignoreExport: true
                },{
                    text: 'Phone',
                    dataIndex: 'phone',
                    flex: 1,
                    ignoreExport: true
                },{
                    text: 'Age',
                    dataIndex: 'age',
                    width: 50,
                    ignoreExport: true
                }]
            }, function(table) {
                expect(table.getColumns().length).toBe(1);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });
    });

    describe('exportStyle', function() {
        afterEach(destroyCmp);

        it('should match config for csv exporter', function(){
            makeCmp({
                type: 'csv'
            }, null, function(table) {
                var cols = table.getColumns();

                expect(cols.length).toBe(3);
                expect(cols.getAt(1).getStyle()).toEqual({
                    font: {
                        italic: true
                    }
                });
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should match config for tsv exporter', function(){
            makeCmp({
                type: 'tsv'
            }, null, function(table) {
                var cols = table.getColumns();

                expect(cols.length).toBe(3);
                expect(cols.getAt(1).getStyle()).toEqual({
                    font: {
                        italic: true
                    }
                });
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should match config for html exporter', function(){
            makeCmp({
                type: 'html'
            }, null, function(table) {
                var cols = table.getColumns();

                expect(cols.length).toBe(3);
                expect(cols.getAt(1).getStyle()).toEqual({
                    type: 'html',
                    alignment:{
                        horizontal: 'Right'
                    }
                });
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should match config for excel03 exporter', function(){
            makeCmp({
                type: 'excel03'
            }, null, function(table) {
                var cols = table.getColumns();

                expect(cols.length).toBe(3);
                expect(cols.getAt(1).getStyle()).toEqual({
                    font: {
                        italic: true
                    }
                });
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should match config for excel07 exporter', function(){
            makeCmp({
                type: 'excel07'
            }, null, function(table) {
                var cols = table.getColumns();

                expect(cols.length).toBe(3);
                expect(cols.getAt(1).getStyle()).toEqual({
                    font: {
                        italic: true
                    }
                });
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });
    });

    describe('generate content', function() {
        afterEach(destroyCmp);

        it('should extract store data', function () {
            makeCmp({
                type: 'csv'
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd'],
                    data: [
                        { a: 'test',    b: null,    c: undefined,   d: 0 },
                        { a: 'test 2',  b: 3,       c: true,        d: 2.5 }
                    ]
                },
                columns: [{
                    text: 'A',
                    dataIndex: 'a'
                },{
                    text: 'B',
                    dataIndex: 'b'
                },{
                    text: 'C',
                    dataIndex: 'c'
                },{
                    text: 'D',
                    dataIndex: 'd'
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    rows;

                rows = table.getRows();
                expect(rows.length).toBe(2);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(null);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(undefined);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(0);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(3);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe(true);
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe(2.5);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should extract grouped store data', function () {
            makeCmp({
                type: 'csv',
                includeGroups: true
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd'],
                    data: [
                        { a: 'test',    b: 1,   c: 5,   d: 1.34 },
                        { a: 'test 2',  b: 2,   c: 6,   d: 2.81 },
                        { a: 'test',    b: 3,   c: 7,   d: 3.45 },
                        { a: 'test 2',  b: 4,   c: 8,   d: 4.98 }
                    ],
                    grouper: 'a'
                },
                columns: [{
                    text: 'A',
                    dataIndex: 'a'
                },{
                    text: 'B',
                    dataIndex: 'b'
                },{
                    text: 'C',
                    dataIndex: 'c'
                },{
                    text: 'D',
                    dataIndex: 'd'
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    rows;

                expect(table.getRows()).toBeNull();

                rows = groups.getAt(0).getRows();
                expect(rows.length).toBe(2);

                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(1);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(5);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(1.34);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(3);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe(7);
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe(3.45);

                rows = groups.getAt(1).getRows();
                expect(rows.length).toBe(2);

                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(2);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(6);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(2.81);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(4);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe(8);
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe(4.98);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should extract grouped store data including summaries on store model', function () {
            makeCmp({
                type: 'csv',
                includeGroups: true,
                includeSummary: true
            },{
                store: {
                    fields: [
                        {name: 'a' },
                        {name: 'b', summary: 'sum' },
                        {name: 'c', summary: 'max' },
                        {name: 'd', summary: 'average' }
                    ],
                    data: [
                        { a: 'test',    b: 1,   c: 5,   d: 9 },
                        { a: 'test 2',  b: 2,   c: 6,   d: 10 },
                        { a: 'test',    b: 3,   c: 7,   d: 11 },
                        { a: 'test 2',  b: 4,   c: 8,   d: 12 }
                    ],
                    grouper: 'a'
                },
                columns: [{
                    text: 'A',
                    dataIndex: 'a'
                },{
                    text: 'B',
                    dataIndex: 'b'
                },{
                    text: 'C',
                    dataIndex: 'c'
                },{
                    text: 'D',
                    dataIndex: 'd'
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    group1, group2, rows;

                expect(table.getRows()).toBeNull();

                group1 = groups.getAt(0);
                group2 = groups.getAt(1);

                rows = group1.getRows();
                expect(rows.length).toBe(2);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(1);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(5);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(9);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(3);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe(7);
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe(11);

                rows = group1.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(4);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(7);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(10);

                rows = group2.getRows();
                expect(rows.length).toBe(2);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(2);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(6);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(10);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(4);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe(8);
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe(12);

                rows = group2.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(6);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(8);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(11);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should format data using exportRenderer/renderer/formatter', function () {
            makeCmp({
                type: 'csv'
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd', 'e', 'f'],
                    data: [
                        { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }
                    ]
                },
                columns: [{
                    text: 'A',
                    dataIndex: 'a'
                },{
                    text: 'B',
                    dataIndex: 'b',
                    width: 130,
                    exportStyle: {
                        format: 'General',
                        width: 47
                    }
                },{
                    text: 'C',
                    dataIndex: 'c',
                    formatter: 'number("0.00")'
                },{
                    text: 'D',
                    dataIndex: 'd',
                    exportRenderer: true,
                    renderer: function(v) {
                        return 'Test' + v;
                    }
                },{
                    text: 'E',
                    dataIndex: 'e',
                    exportRenderer: function(v) {
                        return 'Export' + v
                    }
                },{
                    text: 'F',
                    dataIndex: 'f',
                    exportRenderer: false
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    columns = table.getColumns(),
                    rows, cells;

                expect(columns.length).toBe(6);
                expect(columns.getAt(1).getWidth()).toBe(47);

                rows = table.getRows();
                expect(rows.length).toBe(1);
                cells = rows.getAt(0).getCells();

                expect(cells.getAt(0).getValue()).toBe(1);
                expect(cells.getAt(1).getValue()).toBe(2);
                expect(cells.getAt(2).getValue()).toBe('3.00');
                expect(cells.getAt(3).getValue()).toBe('Test4');
                expect(cells.getAt(4).getValue()).toBe('Export5');
                expect(cells.getAt(5).getValue()).toBe(6);
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

    });

    describe('exporters', function() {
        beforeEach(backupFileFunctions);
        afterEach(restoreFileFunctions);

        it('should generate an xlsx cell correctly', function () {
            var excel = new Ext.exporter.file.ooxml.Excel(),
                d = new Date(),
                ws, row, cell;

            ws = excel.addWorksheet();
            row = ws.addRow();

            cell = row.addCell({
                value: 'test'
            });
            expect(cell.render()).toBe('<c r="A1" t="s"><v>0</v></c>');
            expect(excel.getWorkbook().getSharedStrings().getStrings().getAt(0)).toBe('test');

            cell = row.addCell({
                value: null
            });
            expect(cell.render()).toBe('<c r="B1"/>');

            cell = row.addCell({
                value: undefined
            });
            expect(cell.render()).toBe('<c r="C1"/>');

            cell = row.addCell({
                value: 0
            });
            expect(cell.render()).toBe('<c r="D1" t="n"><v>0</v></c>');

            cell = row.addCell({
                value: 5.3
            });
            expect(cell.render()).toBe('<c r="E1" t="n"><v>5.3</v></c>');

            cell = row.addCell({
                value: d
            });
            expect(cell.render()).toBe('<c r="F1" t="n"><v>' + cell.dateValue(d) + '</v></c>');

            cell = row.addCell({
                value: d,
                serializeDateToNumber: false
            });
            expect(cell.render()).toBe('<c r="G1" t="d"><v>' + Ext.Date.format(d, 'Y-m-d\\TH:i:s.u') + '</v></c>');

            cell = row.addCell({
                value: false
            });
            expect(cell.render()).toBe('<c r="H1" t="b"><v>false</v></c>');

            cell = row.addCell({});
            expect(cell.render()).toBe('<c r="I1"/>');
        });
    });

    describe('errors', function () {
        afterEach(destroyCmp);

        it('should not throw if no store is available', function () {
            makeCmp(null, {
                store: null
            });

            waitsFor(function(){
                return ready;
            }, 'exporter to become ready', 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });

        });
    });
    
});
