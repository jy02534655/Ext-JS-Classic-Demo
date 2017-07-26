(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.svg.Svg", ['Ext.d3.*'], function() {
    function createSvg(config) {
        return new Ext.d3.svg.Svg(Ext.apply({
            renderTo: document.body,
            width: 200,
            height: 200
        }, config));
    }

    describe('resizeHandler', function () {
        var component;

        it('should set proper size of the SVG element', function () {
            var size = {
                width: 200,
                height: 200
            };

            component = createSvg();
            component.handleResize(size, true);

            var svg = component.getSvg();

            expect(parseInt(svg.attr('width'), 10)).toBe(size.width);
            expect(parseInt(svg.attr('height'), 10)).toBe(size.height);
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

    describe('defaultCls', function () {
        var sub;
        it('should inherit superclass CSS class names', function () {
            var value = 'sub-class-name';
            var Sub = Ext.define(null, {
                extend: 'Ext.d3.svg.Svg',

                defaultCls: {
                    sub: value
                }
            });
            sub = new Sub;
            expect(sub.defaultCls.scene).toBeTruthy();
            expect(sub.defaultCls.sub).toBe(value);
        });
        it('should not inherit self-defined superclass CSS class names', function () {
            var value = 'scene-class-name';
            var Sub = Ext.define(null, {
                extend: 'Ext.d3.svg.Svg',

                defaultCls: {
                    scene: value
                }
            });
            sub = new Sub;
            expect(sub.defaultCls.scene).toBe(value);
        });
        afterEach(function () {
            Ext.destroy(sub);
        });
    });

    describe('resizeScene', function () {
        var component;

        it('should translate the scener wrapper by the amount of left/top padding', function () {
            // setting width/height of the wrapper group has no practical effect
            // that's what the clipRect is for
            component = createSvg({
                padding: {
                    left: 100,
                    top: 50
                }
            });
            component.handleResize({
                width: 200,
                height: 200
            }, true);

            var wrapper = component.getWrapper();
            var p = component.getPadding();
            // In IE11 tranlation components will be separated by a space (even if a comma was used
            // when setting the 'transform' attribute).
            var translate = wrapper.attr('transform').match(/translate\(([0-9]+)[,\s]([0-9]+)\)/);

            expect(+translate[1]).toBe(p.left);
            expect(+translate[2]).toBe(p.top);
        });
        it('should set proper size of the clip rect', function () {
            component = createSvg();
            component.handleResize({
                width: 200,
                height: 200
            }, true);

            var clipRect = component.getWrapperClipRect();
            var size = component.getSize();
            var p = component.getPadding();

            expect(parseInt(clipRect.attr('width'), 10)).toBe(size.width - p.left - p.right);
            expect(parseInt(clipRect.attr('height'), 10)).toBe(size.height - p.top - p.bottom);
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

});