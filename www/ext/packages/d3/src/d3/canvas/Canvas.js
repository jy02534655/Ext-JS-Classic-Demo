/**
 * The base class of every Canvas D3 Component that can also be used standalone.
 * For example:
 *
 *     @example
 *     Ext.create({
 *         renderTo: document.body,
 *
 *         width: 300,
 *         height: 300,
 *
 *         xtype: 'd3-canvas',
 *
 *         listeners: {
 *             sceneresize: function (component, canvas, size) {
 *                 var barCount = 10,
 *                     barWidth = size.width / barCount,
 *                     barHeight = size.height,
 *                     context = canvas.getContext('2d'),
 *                     colors = d3.scaleOrdinal(d3.schemeCategory20),
 *                     i = 0;
 *
 *                 for (; i < barCount; i++) {
 *                     context.fillStyle = colors(i);
 *                     context.fillRect(i * barWidth, 0, barWidth, barHeight);
 *                 }
 *             }
 *         }
 *     });
 */
Ext.define('Ext.d3.canvas.Canvas', {
    extend: 'Ext.d3.Component',
    xtype: 'd3-canvas',

    isCanvas: true,

    config: {
        /**
         * @cfg {Boolean} [hdpi=true]
         * If `true`, will automatically override Canvas context ('2d') methods
         * when running on HDPI displays. Setting this to 'false' will greatly
         * improve performance on such devices at the cost of image quality.
         * It can also be useful when this class is used in conjunction with
         * another Canvas library that provides HDPI support as well.
         * Once set cannot be changed.
         */
        hdpi: true
    },

    requires: [
        'Ext.d3.canvas.HiDPI'
    ],

    template: [{
        tag: 'canvas',
        reference: 'canvasElement',
        style: {
            position: 'absolute'
        }
    }],

    canvas: null,
    context2D: null,

    /**
     * This method will be called by the {@link #onPanZoom} method each time
     * the canvas context is transformed via {@link Ext.d3.interaction.PanZoom}
     * interaction.
     * @method renderScene
     * @param {CanvasRenderingContext2D} ctx
     */
    renderScene: null,

    /**
     * Returns the Canvas element to draw on.
     * Overrides for resolution independent drawing are automatically applied
     * to the '2d' rendering context of the canvas the first time the method is called.
     * @return {HTMLCanvasElement}
     */
    getCanvas: function () {
        var me = this,
            canvas = me.canvas;

        if (!canvas) {
            canvas = me.canvasElement.dom;
            if (me.getHdpi()) {
                canvas = Ext.d3.canvas.HiDPI.applyOverrides(canvas);
            }
            me.canvas = canvas;
            me.context2D = canvas.getContext('2d');
        }

        return canvas;
    },

    /**
     * @private
     * Calculates and sets scene size and position based on the given `size` object.
     * @param {Object} size
     * @param {Number} size.width
     * @param {Number} size.height
     */
    resizeHandler: function (size) {
        var me = this,
            canvas = me.canvas || me.getCanvas(),
            rect = me.sceneRect || (me.sceneRect = {});

        rect.x = 0;
        rect.y = 0;

        rect.width = size.width;
        rect.height = size.height;

        Ext.d3.canvas.HiDPI.setSize(canvas, rect.width, rect.height);

        me.onSceneResize(canvas, rect);
        me.fireEvent('sceneresize', me, canvas, rect);
    },

    /**
     * Whether or not the component got its first size.
     * Can be used in the `canvasresize` event handler to do user-defined setup on first
     * resize, for example:
     *
     *     listeners: {
     *         canvasresize: function (component, canvas, rect) {
     *             if (!component.size) {
     *                 // set things up
     *             } else {
     *                 // handle resize
     *             }
     *         }
     *     }
     *
     * @cfg {Object} size
     * @accessor
     */

    /**
     * @event sceneresize
     * Fires after scene size has changed.
     * Note that resizing the Canvas will reset its context, e.g.
     * `lineWidth` will be reset to `1`, `fillStyle` to `#000000`, and so on,
     * including transformations.
     * @param {Ext.d3.canvas.Canvas} component
     * @param {HTMLCanvasElement} canvas
     * @param {Object} size An object with `width` and `height` properties.
     */

    /**
     * @method onSceneResize
     * @protected
     * This method is called after the scene gets its position and size.
     * It's a good place to recalculate layout(s) and re-render the scene.
     * @param {HTMLCanvasElement} canvas
     * @param {Object} rect
     * @param {Number} rect.x
     * @param {Number} rect.y
     * @param {Number} rect.width
     * @param {Number} rect.height
     */
    onSceneResize: Ext.emptyFn,

    onPanZoom: function (interaction, scaling, translation) {
        var me = this,
            canvas = me.canvas,
            ctx = me.context2D;

        if (ctx && me.renderScene) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(scaling[0], 0, 0, scaling[1], translation[0], translation[1]);
            me.renderScene(ctx);
            ctx.restore();
        }
    },

    /**
     * @private
     */
    getSceneRect: function () {
        return this.sceneRect;
    }
});
