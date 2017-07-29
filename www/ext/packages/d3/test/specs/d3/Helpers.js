(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.Helpers", ['Ext.d3.*'], function() {
    describe('makeScale', function () {
        it('should create a proper scale given its type', function () {
            var x = ['a', 'b', 'c', 'd'],
                y = [0, 100];

            var bandScale = Ext.d3.Helpers.makeScale({
                type: 'band',
                domain: x,
                range: y
            });

            expect(bandScale.bandwidth()).toBe(Math.abs(y[1] - y[0]) / x.length);
        });

        it('should add type information to the created scale', function () {
            var type = 'linear';
            var linearScale = Ext.d3.Helpers.makeScale({
                type: type
            });

            expect(linearScale._type).toBe(type);
        });
    });

    describe('make', function () {
        it('should create a proper type of entity', function () {
            var symbol = Ext.d3.Helpers.make('symbol');

            expect(typeof symbol).toBe('function');
            expect(typeof symbol.type).toBe('function');
            expect(typeof symbol.context).toBe('function');
        });
    });

    describe('configure', function () {
        it('should work with scalar values', function () {
            var round = true,
                align = 0.7;

            var bandScale = Ext.d3.Helpers.configure(d3.scaleBand(), {
                round: round,
                align: align
            });

            expect(bandScale.round()).toBe(round);
            expect(bandScale.align()).toBe(align);
        });
        it('should work with array values', function () {
            var x1 = 0,
                x2 = 20;

            var linearScale = Ext.d3.Helpers.configure(d3.scaleLinear(), {
                domain: [x1, x2]
            });

            expect(linearScale.domain()[0]).toBe(x1);
            expect(linearScale.domain()[1]).toBe(x2);
        });
        it('should work with multiple values', function () {
            var param1, param2;
            var x1 = 'hi';
            var x2 = 5;
            var oldD3 = window.d3;
            var d3 = {
                method: function (a, b) {
                    param1 = a;
                    param2 = b;
                }
            };
            Ext.d3.Helpers.configure(d3, {
                $method: [x1, x2]
            });
            expect(param1).toBe(x1);
            expect(param2).toBe(x2);
        });
        it('should evaluate D3 values', function () {
            var every;
            var oldD3 = window.d3;
            var d3 = {
                timeMinute: {
                    every: function (param) {
                        every = param;
                    }
                }
            };
            try {
                window.d3 = d3;
                Ext.d3.Helpers.configure(oldD3.axisLeft(), {
                    ticks: 'd3.timeMinute.every(15)'
                });
            } finally {
                window.d3 = oldD3;
            }

            expect(every).toBe(15);
        });
        it('should evaluate D3 values in case of multiple values', function () {
            var oldD3 = window.d3;
            var f = function () {};
            var n = 10;
            var param1, param2;
            var d3 = {
                method1: function (a, b) {
                    param1 = a;
                    param2 = b;
                },
                method2: f
            };
            try {
                window.d3 = d3;
                Ext.d3.Helpers.configure(d3, {
                    $method1: ['d3.method2', n]
                });
            } finally {
                window.d3 = oldD3;
            }

            expect(param1).toBe(f);
            expect(param2).toBe(n);
        });
    });

    describe('unitMath', function () {
        it('should add', function () {
            var value = Ext.d3.Helpers.unitMath('15.5px', '+', 15.5);
            expect(value).toBe('31px');
            var value = Ext.d3.Helpers.unitMath('10em', '+', 10);
            expect(value).toBe('20em');
        });
        it('should subtract', function () {
            var value = Ext.d3.Helpers.unitMath('15.5px', '-', 5.5);
            expect(value).toBe('10px');
            var value = Ext.d3.Helpers.unitMath('10em', '-', 9);
            expect(value).toBe('1em');
        });
        it('should multiply', function () {
            var value = Ext.d3.Helpers.unitMath('13.5px', '*', 2);
            expect(value).toBe('27px');
            var value = Ext.d3.Helpers.unitMath('10em', '*', 1.5);
            expect(value).toBe('15em');
        });
        it('should divide', function () {
            var value = Ext.d3.Helpers.unitMath('20px', '/', 2);
            expect(value).toBe('10px');
            var value = Ext.d3.Helpers.unitMath('30em', '/', 3);
            expect(value).toBe('10em');
        });
    });

    describe('parseTransform', function () {
        it('should parse scale, rotate, translate components', function () {
            var test1 = 'translate(10,20) rotate(3.14) scale(2,  1.5)',
                test2 = 'rotate(2) translate(10) scale(3)',
                test3 = 'scale(1   2)  translate(6 -7)',
                test4 = 'rotate(1.5)',
                test5 = '   ';

            var result1 = Ext.d3.Helpers.parseTransform(test1);
            var result2 = Ext.d3.Helpers.parseTransform(test2);
            var result3 = Ext.d3.Helpers.parseTransform(test3);
            var result4 = Ext.d3.Helpers.parseTransform(test4);
            var result5 = Ext.d3.Helpers.parseTransform(test5);

            expect(result1.translate[0]).toBe(10);
            expect(result1.translate[1]).toBe(20);
            expect(result1.rotate).toBe(3.14);
            expect(result1.scale[0]).toBe(2);
            expect(result1.scale[1]).toBe(1.5);

            expect(result2.translate[0]).toBe(10);
            expect(result2.translate[1]).toBe(0);
            expect(result2.rotate).toBe(2);
            expect(result2.scale[0]).toBe(3);
            expect(result2.scale[1]).toBe(3);

            expect(result3.translate[0]).toBe(6);
            expect(result3.translate[1]).toBe(-7);
            expect(result3.rotate).toBe(0);
            expect(result3.scale[0]).toBe(1);
            expect(result3.scale[1]).toBe(2);

            expect(result4.translate[0]).toBe(0);
            expect(result4.translate[1]).toBe(0);
            expect(result4.rotate).toBe(1.5);
            expect(result4.scale[0]).toBe(0);
            expect(result4.scale[1]).toBe(0);

            expect(result5.translate[0]).toBe(0);
            expect(result5.translate[1]).toBe(0);
            expect(result5.rotate).toBe(0);
            expect(result5.scale[0]).toBe(0);
            expect(result5.scale[1]).toBe(0);
        });
    });

});
