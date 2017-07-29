(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.Component",
    Ext.isModern
        ? ['Ext.Container', 'Ext.data.ArrayStore']
        : ['Ext.Container', 'Ext.data.ArrayStore', 'Ext.layout.container.Fit'],
function() {
    describe('component sizing', function () {
        var panel;

        it('should fire a resize event', function () {
            var component, handleResizeSpy,
                size1 = [200, 200],
                size2 = [250, 300];

            panel = Ext.create({
                xtype: 'container',
                layout: 'fit',
                style: {
                    background: 'red'
                },
                width: size1[0],
                height: size1[1],
                items: [component = new Ext.d3.Component()]
            });
            
            handleResizeSpy = spyOn(component, 'handleResize').andCallThrough();
            
            panel.render(document.body);
            
            waitsForSpy(handleResizeSpy);
            
            runs(function () {
                var args = handleResizeSpy.argsForCall.pop(),
                    size = args[0];

                expect(size.width).toBe(size1[0]);
                expect(size.height).toBe(size1[1]);

                handleResizeSpy.reset();

                panel.setSize(size2[0], size2[1]);
            });
            
            waitsForSpy(handleResizeSpy);
            
            runs(function () {
                var args = handleResizeSpy.argsForCall.pop(),
                    size = args[0];

                expect(size.width).toBe(size2[0]);
                expect(size.height).toBe(size2[1]);
            });
        });

        afterEach(function () {
            Ext.destroy(panel);
        });

    });

    describe('store', function () {
        var component;

        it('should react to store changes', function () {
            var onDataChangeSpy, onDataUpdateSpy;

            component = new Ext.d3.Component;
            onDataChangeSpy = spyOn(component, 'onDataChange');
            component.setStore(new Ext.data.Store({
                data: [
                    {name: 'Ann', count: 5},
                    {name: 'Mike', count: 3}
                ]
            }));
            expect(onDataChangeSpy).toHaveBeenCalled();
            component.getStore().getAt(1).set('name', 'Mary');
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });
});
