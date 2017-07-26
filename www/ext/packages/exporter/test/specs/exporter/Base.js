topSuite("Ext.exporter.Base", ['Ext.exporter.*'], function() {
    var cmp, events, ready, saveAs, saveBinaryAs, savePopup;

    function onEventFired(event){
        return function(){
            return new Ext.Promise(function(resolve, reject){
                events[event] = true;
                resolve();
            });
        }
    }

    function makeCmp(cfg){
        events = {};

        cmp = Ext.Factory.exporter(cfg);

        savePopup = Ext.exporter.File.initializePopup;
        Ext.exporter.File.initializePopup = Ext.emptyFn;
        // temporarily disable saveAs and saveBinaryAs
        saveAs = Ext.exporter.File.saveAs;
        Ext.exporter.File.saveAs = onEventFired('saveAs');
        saveBinaryAs = Ext.exporter.File.saveBinaryAs;
        Ext.exporter.File.saveBinaryAs = onEventFired('saveBinaryAs');

        cmp.saveAs().then(function(){
            ready = true;
        });
    }

    function destroyCmp(){
        events = cmp = ready = Ext.destroy(cmp);
        Ext.exporter.File.saveAs = saveAs;
        Ext.exporter.File.saveBinaryAs = saveBinaryAs;
        Ext.exporter.File.initializePopup = savePopup;
    }

    describe('Save exported documents', function() {
        afterEach(destroyCmp);

        it('should save csv files', function(){
            makeCmp({
                type: 'csv'
            });

            waitsFor(function(){
                return ready;
            });

            runs(function() {
                expect(events && events.saveAs).toBe(true);
            });
        });

        it('should save tsv files', function(){
            makeCmp({
                type: 'tsv'
            });

            waitsFor(function(){
                return ready;
            });

            runs(function() {
                expect(events && events.saveAs).toBe(true);
            });
        });

        it('should save html files', function(){
            makeCmp({
                type: 'html'
            });

            waitsFor(function(){
                return ready;
            });

            runs(function() {
                expect(events && events.saveAs).toBe(true);
            });
        });

        it('should save excel xml files', function(){
            makeCmp({
                type: 'excel03'
            });

            waitsFor(function(){
                return ready;
            });

            runs(function() {
                expect(events && events.saveAs).toBe(true);
            });
        });

        it('should save excel xlsx files', function(){
            makeCmp({
                type: 'excel07'
            });

            waitsFor(function(){
                return ready;
            });

            runs(function() {
                expect(events && events.saveBinaryAs).toBe(true);
            });
        });

    });


});