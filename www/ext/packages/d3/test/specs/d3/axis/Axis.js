(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.axis.Axis", ['Ext.d3.*'], function() {
    function createSvg(config) {
        return new Ext.d3.svg.Svg(Ext.apply({
            renderTo: document.body,
            width: 500,
            height: 500
        }, config));
    }

    describe('axis', function () {
        it('should create a new d3 axis, if one does not exist', function () {
            var component, haveSceneSize;

            runs(function () {
                component = createSvg({
                    listeners: {
                        sceneresize: function () {
                            haveSceneSize = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveSceneSize;
            });
            runs(function () {
                var scene = component.getScene();
                var axis = new Ext.d3.axis.Axis({
                    axis: {
                        orient: 'top',
                        tickSize: 20
                    },
                    parent: scene
                });

                var d3Axis = axis.getAxis();
                var tickSize = d3Axis.tickSize();
                var orient = d3Axis._type;

                expect(tickSize).toBe(20);
                expect(orient).toBe('top');

                Ext.destroy(component);
            });
        });
        it('should reconfigure existing d3 axis', function () {
            var component, haveSceneSize;

            runs(function () {
                component = createSvg({
                    listeners: {
                        sceneresize: function () {
                            haveSceneSize = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveSceneSize;
            });
            runs(function () {
                var scene = component.getScene();
                var axis = new Ext.d3.axis.Axis({
                    axis: {
                        orient: 'top',
                        tickSize: 20
                    },
                    parent: scene
                });
                var d3Axis = axis.getAxis();

                axis.setAxis({
                    orient: 'bottom',
                    tickSize: 40
                });

                var d3Axis2 = axis.getAxis();
                var tickSize = d3Axis2.tickSize();
                var orient = d3Axis2._type;

                expect(d3Axis).not.toEqual(d3Axis2);
                expect(tickSize).toBe(40);
                expect(orient).toBe('bottom');

                Ext.destroy(component);
            });
        });
    });

});
