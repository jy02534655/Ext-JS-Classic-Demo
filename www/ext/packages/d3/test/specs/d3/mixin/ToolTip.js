(Ext.isIE10m ? xtopSuite : topSuite)('Ext.d3.mixin.ToolTip',
    ['Ext.d3.HeatMap'],
function() {
    var component;

    function makeComponent (cfg) {
        component = new Ext.d3.HeatMap(cfg);
    }

    afterEach(function () {
        component = Ext.destroy(component);
    });

    describe('create', function () {
        it('should create a tooltip', function () {
            makeComponent();

            component.setTooltip({
                renderer: Ext.emptyFn
            });

            var tooltip = component.getTooltip();

            expect(tooltip instanceof Ext.tip.ToolTip).toBeTruthy();
        });
    });

    describe('destroy', function () {
        it('should destroy the tooltip', function () {
            makeComponent();

            component.setTooltip({
                renderer: Ext.emptyFn
            });

            var tooltip = component.getTooltip();

            component.setTooltip(null);

            expect(tooltip.destroyed).toBeTruthy();
        });
    });
});
