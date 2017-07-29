(Ext.isIE10m ? xtopSuite : topSuite)('Ext.d3.hierarchy.TreeMap',
    ['Ext.d3.*', 'Ext.data.TreeStore'],
function() {
    describe('tiling', function () {
        var treemap;

        it('should take a function', function () {
            function f() {}
            treemap = new Ext.d3.hierarchy.TreeMap({
                tiling: f
            });
            expect(treemap.getTiling()).toBe(f);
        });
        it('should evaluate a string to a built-in D3 function', function () {
            treemap = new Ext.d3.hierarchy.TreeMap({
                tiling: 'd3.treemapSlice'
            });
            expect(typeof treemap.getTiling()).toBe('function');
        });

        afterEach(function () {
            Ext.destroy(treemap);
        });
    });

});