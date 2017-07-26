topSuite("Ext.exporter.Plugin", ['Ext.exporter.*', 'Ext.Component'], function() {
    var cmp, events, ready, saveAs, saveBinaryAs, savePopup;

    function onEventFired(event){
        return function(){
            return new Ext.Promise(function(resolve, reject){
                events[event] = true;
                resolve();
            });
        }
    }

    function makeCmp(){
        events = {};
        cmp = new Ext.Component({
            html: 'testing component',
            plugins: 'exporterplugin',
            listeners: {
                beforedocumentsave: onEventFired('beforedocumentsave'),
                dataready: onEventFired('dataready'),
                documentsave: onEventFired('documentsave')
            },
            renderTo: document.body
        });

        savePopup = Ext.exporter.File.initializePopup;
        Ext.exporter.File.initializePopup = Ext.emptyFn;
        // temporarily disable saveAs and saveBinaryAs
        saveAs = Ext.exporter.File.saveAs;
        Ext.exporter.File.saveAs = onEventFired('saveAs');
        saveBinaryAs = Ext.exporter.File.saveBinaryAs;
        Ext.exporter.File.saveBinaryAs = onEventFired('saveBinaryAs');

        cmp.saveDocumentAs({
            type: 'excel'
        }).then(function(){
            ready = true;
        });
    }

    function destroyCmp(){
        events = cmp = ready = Ext.destroy(cmp);
        Ext.exporter.File.saveAs = saveAs;
        Ext.exporter.File.saveBinaryAs = saveBinaryAs;
        Ext.exporter.File.initializePopup = savePopup;
    }

    afterEach(destroyCmp);

    it('should fire "beforedocumentsave"', function(){
        makeCmp();
        waitsFor(function(){
            return ready;
        });

        runs(function() {
            expect(events && events.beforedocumentsave).toBe(true);
        });
    });

    it('should fire "dataready"', function(){
        makeCmp();
        waitsFor(function(){
            return ready;
        });

        runs(function() {
            expect(events && events.dataready).toBe(true);
        });
    });

    it('should fire "documentsave"', function(){
        makeCmp();
        waitsFor(function(){
            return ready;
        });

        runs(function() {
            expect(events && events.documentsave).toBe(true);
        });
    });

});