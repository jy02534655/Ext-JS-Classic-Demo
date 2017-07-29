(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.axis.Color", ['Ext.d3.*'], function() {
    describe('scale', function () {
        it('autocalculate the domain', function () {
            var store = new Ext.data.Store({
                    data: [
                        {test: 4},
                        {test: 5},
                        {test: 6},
                        {test: 7},
                        {test: 8}
                    ]
                }),
                axis = new Ext.d3.axis.Color({
                    field: 'test',
                    scale: {
                        type: 'linear',
                        range: ['#ff0000', '#00ff00', '#0000ff']
                    }
                });
            
            axis.setDomainFromData(store.getRange());
            expect(axis.getColor(0)).toBe('rgb(255, 0, 0)');
            expect(axis.getColor(4)).toBe('rgb(255, 0, 0)');
            expect(axis.getColor(6)).toBe('rgb(0, 255, 0)');
            expect(axis.getColor(8)).toBe('rgb(0, 0, 255)');
            expect(axis.getColor(10)).toBe('rgb(0, 0, 255)');

            Ext.destroy(axis, store);
        });
        it('should allow for custom domains', function () {
            var store = new Ext.data.Store({
                    data: [
                        {test: 4},
                        {test: 5},
                        {test: 6},
                        {test: 7}
                    ]
                }),
                axis = new Ext.d3.axis.Color({
                    field: 'test',
                    scale: {
                        type: 'linear',
                        domain: [0, 5, 10],
                        range: ['#ff0000', '#00ff00', '#0000ff']
                    }
                });

            axis.setDomainFromData(store.getRange());
            expect(axis.getColor(0)).toBe('rgb(255, 0, 0)');
            expect(axis.getColor(4)).not.toBe('rgb(255, 0, 0)');
            expect(axis.getColor(5)).toBe('rgb(0, 255, 0)');
            expect(axis.getColor(7)).not.toBe('rgb(0, 0, 255)');
            expect(axis.getColor(10)).toBe('rgb(0, 0, 255)');

            Ext.destroy(axis, store);
        });
    });

});
