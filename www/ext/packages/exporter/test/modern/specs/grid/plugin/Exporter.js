topSuite("Ext.grid.plugin.Exporter.modern",
    [false, 'Ext.exporter.*', 'Ext.grid.*', 'Ext.data.*'],
function() {
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

    describe('generate content', function() {
        afterEach(destroyCmp);

        it('should extract grouped store data including summaries (summaryType)', function () {
            makeCmp({
                type: 'csv',
                includeGroups: true,
                includeSummary: true
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd'],
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
                    dataIndex: 'b',
                    summaryType: 'sum'
                },{
                    text: 'C',
                    dataIndex: 'c',
                    summaryType: 'max'
                },{
                    text: 'D',
                    dataIndex: 'd',
                    summaryType: 'average'
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
            }, 'exporter to become ready', Ext.isIE ? 5000 : 1000);

            runs(function(){
                expect(events && events.beforedocumentsave && events.documentsave).toBe(true);
            });
        });

        it('should extract grouped store data including summaries (summary)', function () {
            makeCmp({
                type: 'csv',
                includeGroups: true,
                includeSummary: true
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd'],
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
                    dataIndex: 'b',
                    summary: 'sum'
                },{
                    text: 'C',
                    dataIndex: 'c',
                    summary: 'max'
                },{
                    text: 'D',
                    dataIndex: 'd',
                    summary: 'average'
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    group1, group2, rows;

                expect(table.getRows()).toBeNull();

                rows = table.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(10);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe(8);
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe(10.5);

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

        it('should extract grouped store data including summaries using exportRenderer/renderer/formatter', function () {
            makeCmp({
                type: 'csv',
                includeGroups: true,
                includeSummary: true
            },{
                store: {
                    fields: ['a', 'b', 'c', 'd', 'e', 'f'],
                    data: [
                        { a: 'test',    b: 1,   c: 5,   d: 9,   e: 13,   f: 17 },
                        { a: 'test 2',  b: 2,   c: 6,   d: 10,  e: 14,   f: 18 },
                        { a: 'test',    b: 3,   c: 7,   d: 11,  e: 15,   f: 19 },
                        { a: 'test 2',  b: 4,   c: 8,   d: 12,  e: 16,   f: 20 }
                    ],
                    grouper: 'a'
                },
                columns: [{
                    text: 'A',
                    dataIndex: 'a'
                },{
                    text: 'B',
                    dataIndex: 'b',
                    width: 130,
                    summaryType: 'sum',
                    exportStyle: {
                        format: 'General',
                        width: 47
                    }
                },{
                    text: 'C',
                    dataIndex: 'c',
                    summary: 'max',
                    formatter: 'number("0.00")',
                    summaryFormatter: 'number("0.0")'
                },{
                    text: 'D',
                    dataIndex: 'd',
                    summary: 'min',
                    exportRenderer: true,
                    renderer: function(v) {
                        return 'Test' + v;
                    },
                    exportSummaryRenderer: function (v) {
                        return 'Min summary ' + v
                    }
                },{
                    text: 'E',
                    dataIndex: 'e',
                    summaryType: 'count',
                    exportRenderer: function(v) {
                        return 'Export' + v
                    },
                    exportSummaryRenderer: function (v) {
                        return 'Count summary ' + v
                    }
                },{
                    text: 'F',
                    dataIndex: 'f',
                    summaryType: 'average',
                    exportRenderer: false
                }]
            }, function(table) {
                var groups = table.getGroups(),
                    group1, group2, rows;

                expect(table.getRows()).toBeNull();

                rows = table.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(10);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe('8.0');
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe('Min summary 9');
                expect(rows.getAt(0).getCells().getAt(4).getValue()).toBe('Count summary 4');
                expect(rows.getAt(0).getCells().getAt(5).getValue()).toBe(18.5);

                group1 = groups.getAt(0);
                group2 = groups.getAt(1);

                rows = group1.getRows();
                expect(rows.length).toBe(2);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(1);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe('5.00');
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe('Test9');
                expect(rows.getAt(0).getCells().getAt(4).getValue()).toBe('Export13');
                expect(rows.getAt(0).getCells().getAt(5).getValue()).toBe(17);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(3);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe('7.00');
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe('Test11');
                expect(rows.getAt(1).getCells().getAt(4).getValue()).toBe('Export15');
                expect(rows.getAt(1).getCells().getAt(5).getValue()).toBe(19);

                rows = group1.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(4);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe('7.0');
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe('Min summary 9');
                expect(rows.getAt(0).getCells().getAt(4).getValue()).toBe('Count summary 2');
                expect(rows.getAt(0).getCells().getAt(5).getValue()).toBe(18);

                rows = group2.getRows();
                expect(rows.length).toBe(2);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(2);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe('6.00');
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe('Test10');
                expect(rows.getAt(0).getCells().getAt(4).getValue()).toBe('Export14');
                expect(rows.getAt(0).getCells().getAt(5).getValue()).toBe(18);
                expect(rows.getAt(1).getCells().getAt(0).getValue()).toBe('test 2');
                expect(rows.getAt(1).getCells().getAt(1).getValue()).toBe(4);
                expect(rows.getAt(1).getCells().getAt(2).getValue()).toBe('8.00');
                expect(rows.getAt(1).getCells().getAt(3).getValue()).toBe('Test12');
                expect(rows.getAt(1).getCells().getAt(4).getValue()).toBe('Export16');
                expect(rows.getAt(1).getCells().getAt(5).getValue()).toBe(20);

                rows = group2.getSummaries();
                expect(rows).not.toBeNull();
                expect(rows.length).toBe(1);
                expect(rows.getAt(0).getCells().getAt(0).getValue()).toBeUndefined();
                expect(rows.getAt(0).getCells().getAt(1).getValue()).toBe(6);
                expect(rows.getAt(0).getCells().getAt(2).getValue()).toBe('8.0');
                expect(rows.getAt(0).getCells().getAt(3).getValue()).toBe('Min summary 10');
                expect(rows.getAt(0).getCells().getAt(4).getValue()).toBe('Count summary 2');
                expect(rows.getAt(0).getCells().getAt(5).getValue()).toBe(19);
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
