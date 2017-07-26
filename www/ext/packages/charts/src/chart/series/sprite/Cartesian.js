/**
 * Cartesian sprite.
 */
Ext.define('Ext.chart.series.sprite.Cartesian', {
    extend: 'Ext.chart.series.sprite.Series',

    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Number} [selectionTolerance=20]
                 * The distance from the event position to the sprite's data points to trigger interactions (used for 'iteminfo', etc).
                 */
                selectionTolerance: 'number',

                /**
                 * @cfg {Boolean} flipXY If flipXY is 'true', the series is flipped.
                 */
                flipXY: 'bool',

                renderer: 'default',

                // Visible range of data (pan/zoom) information.
                visibleMinX: 'number',
                visibleMinY: 'number',
                visibleMaxX: 'number',
                visibleMaxY: 'number',
                innerWidth: 'number',
                innerHeight: 'number'
            },
            defaults: {
                selectionTolerance: 20,
                flipXY: false,
                renderer: null,
                transformFillStroke: false,

                visibleMinX: 0,
                visibleMinY: 0,
                visibleMaxX: 1,
                visibleMaxY: 1,
                innerWidth: 1,
                innerHeight: 1
            },
            triggers: {
                dataX: 'dataX,bbox',
                dataY: 'dataY,bbox',
                visibleMinX: 'panzoom',
                visibleMinY: 'panzoom',
                visibleMaxX: 'panzoom',
                visibleMaxY: 'panzoom',
                innerWidth: 'panzoom',
                innerHeight: 'panzoom'
            },
            updaters: {
                dataX: function (attr) {
                    this.processDataX();
                    this.scheduleUpdater(attr, 'dataY', ['dataY']);
                },

                dataY: function () {
                    this.processDataY();
                },

                panzoom: function (attr) {
                    var dx = attr.visibleMaxX - attr.visibleMinX,
                        dy = attr.visibleMaxY - attr.visibleMinY,
                        innerWidth = attr.flipXY ? attr.innerHeight : attr.innerWidth,
                        innerHeight = !attr.flipXY ? attr.innerHeight : attr.innerWidth,
                        surface = this.getSurface(),
                        isRtl = surface ? surface.getInherited().rtl : false;

                    if (isRtl && !attr.flipXY) {
                        attr.translationX = innerWidth + attr.visibleMinX * innerWidth / dx;
                    } else {
                        attr.translationX = -attr.visibleMinX * innerWidth / dx;
                    }
                    attr.translationY = -attr.visibleMinY * innerHeight / dy;
                    attr.scalingX = (isRtl && !attr.flipXY ? -1 : 1) * innerWidth / dx;
                    attr.scalingY = innerHeight / dy;
                    attr.scalingCenterX = 0;
                    attr.scalingCenterY = 0;
                    this.applyTransformations(true);
                }
            }
        }
    },

    processDataY: Ext.emptyFn,

    processDataX: Ext.emptyFn,

    updatePlainBBox: function (plain) {
        var attr = this.attr;

        plain.x = attr.dataMinX;
        plain.y = attr.dataMinY;
        plain.width = attr.dataMaxX - attr.dataMinX;
        plain.height = attr.dataMaxY - attr.dataMinY;
    },

    /**
     * Does a binary search of the data on the x-axis using the given key.
     * @param {String} key
     * @return {*}
     */
    binarySearch: function (key) {
        var dx = this.attr.dataX,
            start = 0,
            end = dx.length;

        if (key <= dx[0]) {
            return start;
        }
        if (key >= dx[end - 1]) {
            return end - 1;
        }

        while (start + 1 < end) {
            var mid = (start + end) >> 1,
                val = dx[mid];
            if (val === key) {
                return mid;
            } else if (val < key) {
                start = mid;
            } else {
                end = mid;
            }
        }

        return start;
    },

    render: function (surface, ctx, surfaceClipRect) {
        var me = this,
            attr = me.attr,
            margin = 1, // TODO: why do we need it?
            inverseMatrix = attr.inverseMatrix.clone();

        // The sprite's `attr.matrix` is stretching/shrinking data coordinates
        // to surface coordinates.
        // This matrix is set (indirectly) by the 'panzoom' updater.
        // The sprite's `attr.inverseMatrix` does the opposite.
        // The `surface.matrix` of the 'series' surface of a cartesian chart flips the
        // surface content vertically, so that y=0 is at the bottom.
        // This matrix is set in the 'performLayout' of the CartesianChart.
        // The `surface.inverseMatrix` flips the content back.
        //
        // By combining the inverse matrices of the series surface and the series sprite,
        // we essentially get a transformation that allows us to go from surface coordinates
        // in a final flipped drawing back to data points.
        //
        // For example
        //
        //     inverseMatrix.transformPoint([ 0, rect[3] ])
        //     inverseMatrix.transformPoint([ rect[2], 0 ])
        //
        // will return
        //
        //     [attr.dataMinX, attr.dataMinY]
        //     [attr.dataMaxX, attr.dataMaxY]
        //
        // because left/bottom and top/right of the series surface is where the first smallest
        // and last largest data points would be (given no pan/zoom), respectively.
        //
        // So the `dataClipRect` passed to the `renderClipped` call below is effectively
        // the visible rect in data (not surface!) coordinates.

        // It is important to note, that the all the scaling and translation is defined
        // by the sprite's matrix, the 'series' surface matrix does not contain scaling
        // or translation components, except for the vertical flipping.

        // This is important because there is a common pattern in chart series sprites
        // (MarkerHolders) - instead of using transform attributes for their Markers
        // (e.g. instances of a 'rect' sprite in case of 'bar' series), the attributes
        // that would position a sprite with no transformations are transformed.

        // For example, to draw a rect with coordinates TL(10, 10), BR(20, 40),
        // we could use the folling 'rect' sprite attributes:
        //
        //     {
        //         x: 0,
        //         y: 0
        //         width: 10,
        //         height: 30
        //
        //         translationX: 10,
        //         translationY: 10
        //
        // But the correct thing to do here is
        //
        //    {
        //        x: 10,
        //        y: 10,
        //        width: 10,
        //        height: 30
        //    }
        //
        // Similarly, if the sprite was scaled, the 'x', 'y', 'width', 'height' attributes
        // would have to account for that as well.
        //
        // This is done, so that the attribute values a marker gets by the time it renders,
        // are the final values, and are not affected later by other transforms, such as
        // surface matrix scaling, which could ruin the visual result, if the attributes
        // values are doctored to make lines align to the pixel grid (which is typically
        // the case).

        inverseMatrix.appendMatrix(surface.inverseMatrix);

        if (attr.dataX === null || attr.dataX === undefined) {
            return;
        }
        if (attr.dataY === null || attr.dataY === undefined) {
            return;
        }
        if (inverseMatrix.getXX() * inverseMatrix.getYX() || inverseMatrix.getXY() * inverseMatrix.getYY()) {
            Ext.Logger.warn('Cartesian Series sprite does not support rotation/sheering');
            return;
        }

        var dataClipRect = inverseMatrix.transformList([
            [surfaceClipRect[0] - margin, surfaceClipRect[3] + margin],  // (left, height)
            [surfaceClipRect[0] + surfaceClipRect[2] + margin, -margin]  // (width, top)
        ]);

        dataClipRect = dataClipRect[0].concat(dataClipRect[1]);

        // TODO: RTL improvements:
        // TODO: produce such a dataClipRect here, so that we don't have to do:
        // TODO: min = Math.min(dataClipRect[0], dataClipRect[2])
        // TODO: max = Math.max(dataClipRect[0], dataClipRect[2])
        // TODO: inside each 'renderClipped' call

        me.renderClipped(surface, ctx, dataClipRect, surfaceClipRect);
    },

    /**
     * @method
     * Render the given visible clip range.
     * @param {Ext.draw.Surface} surface A draw container surface.
     * @param {CanvasRenderingContext2D} ctx A context object that is API compatible with the native
     * [CanvasRenderingContext2D](https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D).
     * @param {Number[]} dataClipRect The clip rect in data coordinates, roughly equivalent to
     * [attr.dataMinX, attr.dataMinY, attr.dataMaxX, attr.dataMaxY] for an untranslated/unscaled surface/sprite.
     * @param {Number[]} surfaceClipRect The clip rect in surface coordinates: [left, top, width, height].
     */
    renderClipped: Ext.emptyFn,

    /**
     * Get the nearest item index from point (x, y). -1 as not found.
     * @param {Number} x
     * @param {Number} y
     * @return {Number} The index
     */
    getIndexNearPoint: function (x, y) {
        var me = this,
            matrix = me.attr.matrix,
            dataX = me.attr.dataX,
            dataY = me.attr.dataY,
            selectionTolerance = me.attr.selectionTolerance,
            dx = Infinity, dy = Infinity, index = -1,
            inverseMatrix = matrix.clone().prependMatrix(me.surfaceMatrix).inverse(),
            center = inverseMatrix.transformPoint([x, y]),
            hitboxBL = inverseMatrix.transformPoint([x - selectionTolerance, y - selectionTolerance]),
            hitboxTR = inverseMatrix.transformPoint([x + selectionTolerance, y + selectionTolerance]),
            left = Math.min(hitboxBL[0], hitboxTR[0]),
            right = Math.max(hitboxBL[0], hitboxTR[0]),
            bottom = Math.min(hitboxBL[1], hitboxTR[1]),
            top = Math.max(hitboxBL[1], hitboxTR[1]),
            xi, yi, i, ln;

        for (i = 0, ln = dataX.length; i < ln; i++) {
            xi = dataX[i];
            yi = dataY[i];
            // Don't stop when the first matching point is found.
            // Keep looking for the nearest point.
            if (xi >= left && xi < right && yi >= bottom && yi < top) {
                if (index === -1 || (Math.abs(xi - center[0]) < dx) && (Math.abs(yi - center[1]) < dy)) {
                    dx = Math.abs(xi - center[0]);
                    dy = Math.abs(yi - center[1]);
                    index = i;
                }
            }
        }

        return index;
    }
});
