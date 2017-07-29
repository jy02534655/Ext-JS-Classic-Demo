topSuite("Ext.chart.Util", ['Ext.chart.*'], function() {

    var defaultRange = [0, 1];

    describe('validateRange', function () {
        it('should work with zero ranges', function () {
            var range1 = [0, 0];
            var range2 = [5, 5];
            var range3 = [-5, -5];
            var range4 = [-Infinity, -Infinity];
            var range5 = [Infinity, Infinity];
            var range6 = [Ext.Number.MIN_SAFE_INTEGER, Ext.Number.MIN_SAFE_INTEGER];
            var range7 = [Ext.Number.MAX_SAFE_INTEGER, Ext.Number.MAX_SAFE_INTEGER];
            var range8 = [Ext.Number.MIN_SAFE_INTEGER - 1, Ext.Number.MIN_SAFE_INTEGER - 1];
            var range9 = [Ext.Number.MAX_SAFE_INTEGER + 1, Ext.Number.MAX_SAFE_INTEGER + 1];

            var result;

            result = Ext.chart.Util.validateRange(range1, defaultRange);
            expect(result[0]).toBe(-0.5);
            expect(result[1]).toBe(0.5);

            result = Ext.chart.Util.validateRange(range2, defaultRange);
            expect(result[0]).toBe(4.5);
            expect(result[1]).toBe(5.5);

            result = Ext.chart.Util.validateRange(range3, defaultRange);
            expect(result[0]).toBe(-5.5);
            expect(result[1]).toBe(-4.5);

            result = Ext.chart.Util.validateRange(range4, defaultRange);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(1);

            result = Ext.chart.Util.validateRange(range5, defaultRange);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(1);

            result = Ext.chart.Util.validateRange(range6, defaultRange);
            expect(result[0]).toBe(Ext.Number.MIN_SAFE_INTEGER - 1);
            expect(result[1]).toBe(Ext.Number.MIN_SAFE_INTEGER + 1);
            expect(isFinite(result[0])).toBe(true);
            expect(isFinite(result[1])).toBe(true);

            result = Ext.chart.Util.validateRange(range7, defaultRange);
            expect(result[0]).toBe(Ext.Number.MAX_SAFE_INTEGER - 1);
            expect(result[1]).toBe(Ext.Number.MAX_SAFE_INTEGER + 1);
            expect(isFinite(result[0])).toBe(true);
            expect(isFinite(result[1])).toBe(true);

            result = Ext.chart.Util.validateRange(range8, defaultRange);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(1);
            expect(isFinite(result[0])).toBe(true);
            expect(isFinite(result[1])).toBe(true);

            result = Ext.chart.Util.validateRange(range9, defaultRange);
            expect(result[0]).toBe(0);
            expect(result[1]).toBe(1);
            expect(isFinite(result[0])).toBe(true);
            expect(isFinite(result[1])).toBe(true);
        });
    });
});