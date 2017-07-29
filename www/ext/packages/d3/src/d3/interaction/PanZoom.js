/**
 * The 'panzoom' interaction allows to react to gestures in D3 components and interpret
 * them as pan and zoom actions.
 * One can then listen to the 'panzoom' event of the interaction or implement the
 * {@link Ext.d3.Component#onPanZoom} method and receive the translation and scaling
 * components that can be applied to the content.
 * The way in which pan/zoom gestures are interpreted is highly configurable,
 * and it's also possible to show a scroll indicator.
 */
Ext.define('Ext.d3.interaction.PanZoom', {

    extend: 'Ext.d3.interaction.Abstract',

    type: 'panzoom',
    alias: 'd3.interaction.panzoom',
    isPanZoom: true,

    config: {
        /**
         * @cfg {Object} pan The pan interaction config. Set to `null` if panning is not desired.
         * @cfg {String} pan.gesture The pan gesture, must have 'start' and 'end' counterparts.
         * @cfg {Boolean} pan.constrain If `false`, the panning will be unconstrained,
         * even if {@link #contentRect} and {@link #viewportRect} configs are set.
         * @cfg {Object} pan.momentum Momentum scrolling config. Set to `null` to pan with no momentum.
         * @cfg {Number} pan.momentum.friction The magnitude of the friction force.
         * @cfg {Number} pan.momentum.spring Spring constant. Spring force will be proportional to the
         * degree of viewport bounds penetration (displacement from equilibrium position), as well as
         * this spring constant. See [Hooke's law](https://en.wikipedia.org/wiki/Hooke%27s_law).
         */
        pan: {
            gesture: 'drag',
            constrain: true,
            momentum: {
                friction: 1,
                spring: 0.2
            }
        },

        /**
         * @cfg {Object} zoom The zoom interaction config. Set to `null` if zooming is not desired.
         * @cfg {String} zoom.gesture The zoom gesture, must have 'start' and 'end' counterparts.
         * @cfg {Number[]} zoom.extent Minimum and maximum zoom levels as an array of two numbers.
         * @cfg {Boolean} zoom.uniform Set to `false` to allow independent scaling in both directions.
         * @cfg {Object} zoom.mouseWheel Set to `null` if scaling with mouse wheel is not desired.
         * @cfg {Number} zoom.mouseWheel.factor How much to zoom in or out on each mouse wheel step.
         * @cfg {Object} zoom.doubleTap Set to `null` if zooming in on double tap is not desired.
         * @cfg {Number} zoom.doubleTap.factor How much to zoom in on double tap.
         */
        zoom: {
            gesture: 'pinch',
            extent: [1, 3],
            uniform: true,
            mouseWheel: {
                factor: 1.02
            },
            doubleTap: {
                factor: 1.1
            }
        },

        /**
         * A function that returns natural (before transformations) content position and dimensions.
         * If {@link #viewportRect} config is specified as well, constrains the panning,
         * so that the content is always visible (can't pan offscreen).
         * By default the panning is unconstrained.
         * The interaction needs to know the content's bounding box at any given time, as the content
         * can be very dynamic, e.g. animate at a time when panning or zooming action is performed.
         * @cfg {Function} [contentRect]
         * @return {Object} rect
         * @return {Number} return.x
         * @return {Number} return.y
         * @return {Number} return.width
         * @return {Number} return.height
         */
        contentRect: null,

        /**
         * A function that returns viewport position and dimensions in component's coordinates.
         * If {@link #contentRect} config is specified as well, constrains the panning,
         * so that the content is always visible (can't pan offscreen).
         * By default the panning is unconstrained.
         * @cfg {Function} [viewportRect]
         * @return {Object} rect
         * @return {Number} return.x
         * @return {Number} return.y
         * @return {Number} return.width
         * @return {Number} return.height
         */
        viewportRect: null,

        /**
         * @cfg {Object} indicator The scroll indicator config. Set to `null` to disable.
         * @cfg {String} indicator.parent The name of the reference on the component to the element
         * that will be used as the scroll indicator container.
         */
        indicator: {
            parent: 'element'
        }
    },

    /**
     * @private
     * @property {Number[]} panOrigin
     * Coordinates of the initial touch/click.
     */
    panOrigin: null,
    /**
     * @private
     * Horizontal and vertical distances between original touches.
     * @property {Number[]} startSpread
     */
    startSpread: null,
    /**
     * Minimum distance between fingers in a pinch gesture.
     * If the actual distance is smaller, this value will be used.
     * @property {Number} minSpread
     */
    minSpread: 50,
    /**
     * @private
     * @property {Number[]} scaling
     */
    scaling: null,
    /**
     * @private
     * @property {Number[]} oldScaling
     */
    oldScaling: null,
    /**
     * @private
     * @property {Number[]} oldScalingCenter
     */
    oldScalingCenter: null,
    /**
     * @private
     * @property {Number[]} translation
     */
    translation: null,
    /**
     * @private
     * @property {Number[]} oldTranslation
     */
    oldTranslation: null,
    /**
     * @private
     * The amount the cursor/finger moved horizontally between the last two pan events.
     * Can be thought of as instantaneous velocity.
     * @property {Number} dx
     */
    dx: 0,
    /**
     * @private
     * The amount the cursor/finger moved vertically between the last two pan events.
     * Can be thought of as instantaneous velocity.
     * @property {Number} dy
     */
    dy: 0,

    velocityX: 0,
    velocityY: 0,

    pan: null,
    viewportRect: null,
    contentRect: null,

    updatePan: function (pan) {
        this.pan = pan;
        this.resetComponent();
    },

    updateZoom: function () {
        this.resetComponent();
    },

    updateContentRect: function (contentRect) {
        this.contentRect = contentRect;
        this.constrainTranslation();
    },

    updateViewportRect: function (viewportRect) {
        this.viewportRect = viewportRect;
        this.constrainTranslation();
    },

    constructor: function (config) {
        var me = this;

        me.translation = config && config.translation
            ? config.translation.slice()
            : [0, 0];
        me.scaling = config && config.scaling
            ? config.scaling.slice()
            : [1, 1];

        me.callParent(arguments);
    },

    destroy: function () {
        this.destroyIndicator();
        Ext.AnimationQueue.stop(this.panFxFrame, this);
        this.callParent();
    },

    /**
     * @private
     * Converts page coordinates to {@link #viewportRect viewport} coordinates.
     * @param {Number} pageX
     * @param {Number} pageY
     * @return {Number[]}
     */
    toViewportXY: function (pageX, pageY) {
        var elementXY = this.component.element.getXY(),
            viewportRect = this.viewportRect && this.viewportRect(),
            x = pageX - elementXY[0] - (viewportRect ? viewportRect.x : 0),
            y = pageY - elementXY[1] - (viewportRect ? viewportRect.y : 0);

        return [x, y];
    },

    /**
     * @private
     * Same as {@link #toViewportXY}, but accounts for RTL.
     */
    toRtlViewportXY: function (pageX, pageY) {
        var xy = this.toViewportXY(pageX, pageY),
            component = this.component;

        if (component.getInherited().rtl) {
            xy[0] = component.getWidth() - xy[0];
        }

        return xy;
    },

    /**
     * @private
     * Makes sure the given `range` is within `x` range.
     * If `y` range is specified, `x` and `y` are used to constrain the first and second
     * components of the `range` array, respectively.
     * @param {Number[]} range
     * @param {Number[]} x
     * @param {Number[]} [y]
     * @return {Number[]} The given `range` object with applied constraints.
     */
    constrainRange: function (range, x, y) {
        y = y || x;

        range[0] = Math.max(x[0], Math.min(x[1], range[0]));
        range[1] = Math.max(y[0], Math.min(y[1], range[1]));

        return range;
    },

    constrainTranslation: function (translation) {
        var me = this,
            pan = me.pan,
            constrain = pan && pan.constrain,
            momentum = pan && pan.momentum,
            contentRect = constrain && me.contentRect && me.contentRect(),
            viewportRect = constrain && me.viewportRect && me.viewportRect(),
            constraints, offLimits;

        if (contentRect && viewportRect) {
            translation = translation || me.translation;
            constraints = me.getConstraints(contentRect, viewportRect);
            offLimits = me.getOffLimits(translation, constraints);

            me.constrainRange(
                translation,
                constraints.slice(0, 2),
                constraints.slice(2)
            );

            if (offLimits && momentum && momentum.spring) { // Allow slight bounds violation.
                translation[0] += offLimits[0] * momentum.spring;
                translation[1] += offLimits[1] * momentum.spring;
            }

            me.updateIndicator(contentRect, viewportRect);
        }
    },

    /**
     * @private
     * Creates an interpolator function that maps values from an input domain
     * to the range of [0..1]. The domain can be specified via the
     * `domain` method of the interpolator. The `multiplier` is applied
     * to the calculated value in the output range before it is returned.
     * @param {Number} multiplier
     * @return {Function}
     */
    createInterpolator: function (multiplier) {
        var start = 0,
            delta = 1;

        multiplier = multiplier || 1;

        var interpolator = function (x) {
            var result = 0;

            if (delta) {
                result = (x - start) / delta;
                result = Math.max(0, result);
                result = Math.min(1, result);
                result *= multiplier;
            }

            return result;
        };
        interpolator.domain = function (a, b) {
            start = a;
            delta = b - a;
        };

        return interpolator;
    },

    updateIndicator: function (contentRect, viewportRect) {
        var me = this,
            hScale = me.hScrollScale,
            vScale = me.vScrollScale,
            contentX, contentY,
            contentWidth, contentHeight,
            h0, h1, v0, v1,
            sx, sy;

        contentRect = contentRect || me.contentRect && me.contentRect();
        viewportRect = viewportRect || me.viewportRect && me.viewportRect();

        if (me.hScroll && contentRect && viewportRect) {
            sx = me.scaling[0];
            sy = me.scaling[1];

            contentX = contentRect.x * sx + me.translation[0];
            contentY = contentRect.y * sy + me.translation[1];
            contentWidth  = contentRect.width  * sx;
            contentHeight = contentRect.height * sy;

            if (contentWidth > viewportRect.width) {
                hScale.domain(contentX, contentX + contentWidth);

                h0 = hScale(0);
                h1 = hScale(viewportRect.width);

                me.hScrollBar.style.left = h0 + '%';
                me.hScrollBar.style.width = (h1 - h0) + '%';
                me.hScroll.dom.style.display = 'block';
            } else {
                me.hScroll.dom.style.display = 'none';
            }

            if (contentHeight > viewportRect.height) {
                vScale.domain(contentY, contentY + contentHeight);

                v0 = vScale(0);
                v1 = vScale(viewportRect.height);

                me.vScrollBar.style.top = v0 + '%';
                me.vScrollBar.style.height = (v1 - v0) + '%';
                me.vScroll.dom.style.display = 'block';
            } else {
                me.vScroll.dom.style.display = 'none';
            }
        }
    },

    /**
     * @private
     * Determines the mininum and maximum translation values based on the dimensions of
     * content and viewport.
     */
    getConstraints: function (contentRect, viewportRect) {
        var me = this,
            pan = me.pan,
            result = null,
            contentX, contentY, contentWidth, contentHeight,
            sx, sy, dx, dy;

        contentRect = pan && pan.constrain && (contentRect || me.contentRect && me.contentRect());
        viewportRect = viewportRect || me.viewportRect && me.viewportRect();

        if (contentRect && viewportRect) {
            sx = me.scaling[0];
            sy = me.scaling[1];

            contentX = contentRect.x * sx;
            contentY = contentRect.y * sy;
            contentWidth  = contentRect.width  * sx;
            contentHeight = contentRect.height * sy;

            dx = viewportRect.width  - contentWidth - contentX;
            dy = viewportRect.height - contentHeight - contentY;

            result = [
                Math.min(-contentX, dx), // minX
                Math.max(-contentX, dx), // maxX
                Math.min(-contentY, dy), // minY
                Math.max(-contentY, dy)  // maxY
            ];
        }

        return result;
    },

    /**
     * @private
     * Returns the amounts by which translation components are bigger or smaller than
     * constraints. If a value is positive/negative, the translation component is bigger/smaller
     * than maximum/minimum allowed translation by that amount.
     * @param translation
     * @param constraints
     * @param minimum
     * @return {Number[]}
     */
    getOffLimits: function (translation, constraints, minimum) {
        var me = this,
            result = null,
            minX, minY,
            maxX, maxY,
            x, y;

        constraints = constraints || me.getConstraints();
        minimum = minimum || 0.1;

        if (constraints) {
            translation = translation || me.translation;
            x = translation[0];
            y = translation[1];

            minX = constraints[0];
            maxX = constraints[1];
            minY = constraints[2];
            maxY = constraints[3];

            if (x < minX) {
                x = x - minX;
            } else if (x > maxX) {
                x = x - maxX;
            } else {
                x = 0;
            }

            if (y < minY) {
                y = y - minY;
            } else if (y > maxY) {
                y = y - maxY;
            } else {
                y = 0;
            }

            if (x && Math.abs(x) < minimum) {
                x = 0;
            }

            if (y && Math.abs(y) < minimum) {
                y = 0;
            }

            if (x || y) {
                result = [x, y];
            }
        }

        return result;
    },

    translate: function (x, y) {
        var translation = this.translation;

        this.setTranslation(
            translation[0] + x,
            translation[1] + y
        );
    },

    setTranslation: function (x, y) {
        var me = this,
            translation = me.translation;

        translation[0] = x;
        translation[1] = y;

        me.constrainTranslation(translation);

        me.fireEvent('panzoom', me, me.scaling, translation);
    },

    scale: function (sx, sy, center) {
        var scaling = this.scaling;

        this.setScaling(
            scaling[0] * sx,
            scaling[1] * sy,
            center
        );
    },

    setScaling: function (sx, sy, center) {
        var me = this,
            zoom = me.getZoom(),
            scaling = me.scaling,
            oldSx = scaling[0],
            oldSy = scaling[1],
            translation = me.translation,
            oldTranslation = me.oldTranslation,
            cx, cy;

        if (zoom) {
            if (zoom.uniform) {
                sx = sy = (sx + sy) / 2;
            }

            scaling[0] = sx;
            scaling[1] = sy;

            me.constrainRange(scaling, zoom.extent);

            // Actual scaling delta.
            sx = scaling[0] / oldSx;
            sy = scaling[1] / oldSy;

            cx = center && center[0] || 0;
            cy = center && center[1] || 0;

            // To scale around center we need to:
            //
            // 1) preserve existing translation
            // 2) translate coordinate grid to the center of scaling (taking existing translation into account)
            // 3) scale coordinate grid
            // 4) translate back by the same amount, this time in scaled coordinate grid
            //
            //     Step 1           Step 2           Step 3           Step 4
            //   |1  0  tx|   |1  0  (cx - tx)|   |sx  0   0|   |1  0  -(cx - tx)|   |sx  0   cx + sx * (tx - cx)|
            //   |0  1  ty| * |0  1  (cy - ty)| * |0   sy  0| * |0  1  -(cy - ty)| = |0   sy  cy + sy * (ty - cy)|
            //   |0  0   1|   |0  0      1    |   |0   0   1|   |0  0       1    |   |0   0           1          |
            //
            // Multiplying matrices in reverse order (column-major), get the result.

            translation[0] = cx + sx * (translation[0] - cx);
            translation[1] = cy + sy * (translation[1] - cy);

            // We won't always have oldTranslation, e.g. when scaling with mouse wheel
            // or calling the method directly.
            if (oldTranslation) {
                // The way panning while zooming is implemented in the 'onZoomGesture'
                // is the delta between original center of scaling and the current center of scaling
                // is added to the original translation (that we save in 'onZoomGestureStart').
                // However, scaling invalidates that original translation, and it needs to be
                // recalculated here.
                oldTranslation[0] = cx - (cx - oldTranslation[0]) * sx;
                oldTranslation[1] = cy - (cy - oldTranslation[1]) * sy;
            }

            me.constrainTranslation(translation);

            me.fireEvent('panzoom', me, scaling, translation);
        }
    },

    /**
     * Sets the pan and zoom values of the interaction without firing the `panzoom` event.
     * This method should be called by components that are using the interaction, but set
     * some initial translation/scaling themselves, to notify the interaction about the
     * changes they've made.
     * @param {Number[]} pan
     * @param {Number[]} zoom
     */
    setPanZoomSilently: function (pan, zoom) {
        var me = this;

        me.suspendEvent('panzoom');
        pan && me.setTranslation(pan[0], pan[1]);
        zoom && me.setScaling(zoom[0], zoom[1]);
        me.resumeEvent('panzoom');
    },

    /**
     * Sets the pan and zoom values of the interaction.
     * @param {Number[]} pan
     * @param {Number[]} zoom
     */
    setPanZoom: function (pan, zoom) {
        var me = this;

        me.setPanZoomSilently(pan, zoom);
        me.fireEvent('panzoom', me, me.scaling, me.translation);
    },

    /**
     * Normalizes the given vector represented by `x` and `y` components,
     * and optionally scales it by the `factor` (in other words, makes it
     * a certain length without changing the direction).
     * @param x
     * @param y
     * @param factor
     * @return {Number[]}
     */
    normalize: function (x, y, factor) {
        var k = (factor || 1) / this.magnitude(x, y);

        return [x * k, y * k];
    },

    /**
     * Returns the magnitude of a vector specified by `x` and `y`.
     * @param x {Number}
     * @param y {Number}
     * @return {Number}
     */
    magnitude: function (x, y) {
        return Math.sqrt(x*x + y*y);
    },

    /**
     * @private
     * @param {Object} pan The {@link #pan} config.
     */
    panFx: function (pan) {
        if (!pan.momentum) {
            return;
        }

        var me = this,
            momentum = pan.momentum,
            translation = me.translation,
            offLimits = me.getOffLimits(translation),
            velocityX = me.velocityX = me.dx,
            velocityY = me.velocityY = me.dy,
            friction, spring;

        // If we let go at a time when the content is already off-screen (on x, y or both axes),
        // then we only want the spring force acting on the content to bring it back.
        // Just feels more natural this way.
        if (offLimits) {
            if (offLimits[0]) {
                me.velocityX = 0;
                velocityX = offLimits[0];
            }
            if (offLimits[1]) {
                me.velocityY = 0;
                velocityY = offLimits[1];
            }
        }

        // Both friction and spring forces can be derived from velocity,
        // by changing its magnitude and flipping direction.

        friction = me.normalize(velocityX, velocityY, -momentum.friction);
        me.frictionX = friction[0];
        me.frictionY = friction[1];

        spring = me.normalize(velocityX, velocityY, -momentum.spring);
        me.springX = spring[0];
        me.springY = spring[1];

        Ext.AnimationQueue.start(me.panFxFrame, me);
    },

    /**
     * @private
     * Increments a non-zero value without crossing zero.
     * @param {Number} x Current value.
     * @param {Number} inc Increment.
     * @return {Number}
     */
    incKeepSign: function (x, inc) {
        if (x) {
            // x * inc < 0 is only when x and inc have opposite signs.
            if (x * inc < 0 && Math.abs(x) < Math.abs(inc)) {
                return 0; // sign change is not allowed, return 0
            } else {
                return x + inc;
            }
        }

        return x;
    },

    panFxFrame: function () {
        var me = this,
            translation = me.translation,
            offLimits = me.getOffLimits(translation),
            offX = offLimits && offLimits[0],
            offY = offLimits && offLimits[1],
            absOffX = 0,
            absOffY = 0,
            // combined force vector
            forceX = 0,
            forceY = 0,
            // the value at which the force is considered too weak and no longer acting
            cutoff = 1,
            springX,
            springY;

        // Apply friction to velocity.
        forceX += me.velocityX = me.incKeepSign(me.velocityX, me.frictionX);
        forceY += me.velocityY = me.incKeepSign(me.velocityY, me.frictionY);

        if (offX) {
            absOffX = Math.abs(offX);
            springX = me.springX * absOffX;
            // forceX equals velocityX at this point.
            // Apply spring force to velocity.
            me.velocityX = me.incKeepSign(forceX, springX);
            // velocityX can't change sign (stops at zero),
            // but this doesn't affect combined force calculation,
            // it may very well change its direction.
            forceX += springX;

            if (Math.abs(forceX) < 0.1) {
                forceX = Ext.Number.sign(forceX) * 0.1;
            }

            // If only the spring force is left acting,
            // and it's so small, it's going to barely move the content,
            // or so strong, the content edge is going to overshoot the viewport boundary ...
            if (!(me.velocityX || Math.abs(forceX) > cutoff || me.incKeepSign(offX, forceX))) {
                forceX = -offX; // ... snap to boundary
            }
        }
        if (offY) {
            absOffY = Math.abs(offY);
            springY = me.springY * absOffY;

            me.velocityY = me.incKeepSign(forceY, springY);
            forceY += springY;

            if (Math.abs(forceY) < 0.1) {
                forceY = Ext.Number.sign(forceY) * 0.1;
            }

            if (!(me.velocityY || Math.abs(forceY) > cutoff || me.incKeepSign(offY, forceY))) {
                forceY = -offY;
            }
        }

        me.prevForceX = forceX;
        me.prevForceY = forceY;

        translation[0] += forceX;
        translation[1] += forceY;

        me.updateIndicator();

        if (!(forceX || forceY)) {
            Ext.AnimationQueue.stop(me.panFxFrame, me);
        }

        me.fireEvent('panzoom', me, me.scaling, translation);
    },

    getGestures: function () {
        var me = this,
            gestures = me.gestures,
            pan = me.getPan(),
            zoom = me.getZoom(),
            panGesture,
            zoomGesture;

        if (!gestures) {
            me.gestures = gestures = {};

            if (pan) {
                panGesture = pan.gesture;
                gestures[panGesture] = 'onPanGesture';
                gestures[panGesture + 'start'] = 'onPanGestureStart';
                gestures[panGesture + 'end'] = 'onPanGestureEnd';
                gestures[panGesture + 'cancel'] = 'onPanGestureEnd';
            }

            if (zoom) {
                zoomGesture = zoom.gesture;
                gestures[zoomGesture] = 'onZoomGesture';
                gestures[zoomGesture + 'start'] = 'onZoomGestureStart';
                gestures[zoomGesture + 'end'] = 'onZoomGestureEnd';
                gestures[zoomGesture + 'cancel'] = 'onZoomGestureEnd';

                if (zoom.doubleTap) {
                    gestures.doubletap = 'onDoubleTap';
                }
                if (zoom.mouseWheel) {
                    gestures.wheel = 'onMouseWheel';
                }
            }
        }

        return gestures;
    },

    updateGestures: function (gestures) {
        this.gestures = gestures;
    },

    isPanning: function (pan) {
        pan = pan || this.getPan();
        return pan && this.getLocks()[pan.gesture] === this;
    },

    onPanGestureStart: function (e) {
        // e.touches check is for IE11/Edge.
        // There was a bug with e.touches where reported coordinates were incorrect,
        // so a switch to e.event.touches was made, but those are not available in IE11/Edge.
        // The bug might have been fixed since then.
        var me = this,
            touches = e && e.event && e.event.touches || e.touches,
            pan = me.getPan(),
            xy;

        if (pan && (!touches || touches.length < 2)) {
            e.claimGesture();

            Ext.AnimationQueue.stop(me.panFxFrame, me);
            me.lockEvents(pan.gesture);
            xy = e.getXY();
            me.panOrigin = me.lastPanXY = me.toRtlViewportXY(xy[0], xy[1]);
            me.oldTranslation = me.translation.slice();

            return false; // stop event propagation
        }
    },

    onPanGesture: function (e) {
        var me = this,
            oldTranslation = me.oldTranslation,
            panOrigin = me.panOrigin,
            xy, dx, dy;

        if (me.isPanning()) {
            xy = e.getXY();
            xy = me.toRtlViewportXY(xy[0], xy[1]);

            me.dx = xy[0] - me.lastPanXY[0];
            me.dy = xy[1] - me.lastPanXY[1];
            me.lastPanXY = xy;

            // Displacement relative to the original touch point.
            dx = xy[0] - panOrigin[0];
            dy = xy[1] - panOrigin[1];

            me.setTranslation(
                oldTranslation[0] + dx,
                oldTranslation[1] + dy
            );

            return false;
        }
    },

    onPanGestureEnd: function () {
        var me = this,
            pan = me.getPan();

        if (me.isPanning(pan)) {
            me.panOrigin = null;
            me.oldTranslation = null;
            me.unlockEvents(pan.gesture);
            me.panFx(pan);
            return false;
        }
    },

    onZoomGestureStart: function (e) {
        var me = this,
            zoom = me.getZoom(),
            touches = e && e.event && e.event.touches || e.touches,
            point1, point2,   // points in local coordinates
            xSpread, ySpread, // distance between points
            touch1, touch2;

        if (zoom && touches && touches.length === 2) {
            e.claimGesture();

            me.lockEvents(zoom.gesture);

            me.oldTranslation = me.translation.slice();

            touch1 = touches[0];
            touch2 = touches[1];
            point1 = me.toViewportXY(touch1.pageX, touch1.pageY);
            point2 = me.toViewportXY(touch2.pageX, touch2.pageY);

            xSpread = point2[0] - point1[0];
            ySpread = point2[1] - point1[1];

            me.startSpread = [
                Math.max(me.minSpread, Math.abs(xSpread)),
                Math.max(me.minSpread, Math.abs(ySpread))
            ];

            me.oldScaling = me.scaling.slice();
            me.oldScalingCenter = [
                point1[0] + .5 * xSpread,
                point1[1] + .5 * ySpread
            ];

            return false;
        }
    },

    onZoomGesture: function (e) {
        var me = this,
            zoom = me.getZoom(),
            startSpread = me.startSpread,
            oldScaling = me.oldScaling,
            oldScalingCenter = me.oldScalingCenter,
            touches = e && e.event && e.event.touches || e.touches,
            point1, point2,   // points in local coordinates
            xSpread, ySpread, // distance between points
            xScale, yScale,   // current scaling factors
            touch1, touch2,
            scalingCenter,
            dx, dy;

        if (zoom && me.getLocks()[zoom.gesture] === me) {

            touch1 = touches[0];
            touch2 = touches[1];
            point1 = me.toViewportXY(touch1.pageX, touch1.pageY);
            point2 = me.toViewportXY(touch2.pageX, touch2.pageY);

            xSpread = point2[0] - point1[0];
            ySpread = point2[1] - point1[1];

            scalingCenter = [
                point1[0] + .5 * xSpread,
                point1[1] + .5 * ySpread
            ];

            // Displacement relative to the original zoom center.
            dx = scalingCenter[0] - oldScalingCenter[0];
            dy = scalingCenter[1] - oldScalingCenter[1];

            // For zooming to feel natural, the panning should work as well.
            me.setTranslation(
                me.oldTranslation[0] + dx,
                me.oldTranslation[1] + dy
            );

            xSpread = Math.max(me.minSpread, Math.abs(xSpread));
            ySpread = Math.max(me.minSpread, Math.abs(ySpread));

            xScale = xSpread / startSpread[0];
            yScale = ySpread / startSpread[1];

            me.setScaling(
                xScale * oldScaling[0],
                yScale * oldScaling[1],
                scalingCenter
            );

            return false;
        }
    },

    onZoomGestureEnd: function () {
        var me = this,
            zoom = me.getZoom();

        if (zoom && me.getLocks()[zoom.gesture] === me) {
            me.startSpread = null;
            me.oldScalingCenter = null;
            me.oldTranslation = null;
            me.unlockEvents(zoom.gesture);
            // Since panning while zooming is possible,
            // we have to make sure to return within bounds.
            me.dx = 0; // Though, clear velocity to avoid any weird motion,
            me.dy = 0; // after all we aren't really panning...
            me.panFx(me.getPan());
            return false;
        }
    },

    onMouseWheel: function (e) {
        var me = this,
            delta = e.getWheelDelta(), // Normalized y-delta.
            zoom = me.getZoom(),
            factor, center, xy;

        if (zoom && zoom.mouseWheel && (factor = zoom.mouseWheel.factor)) {
            factor = Math.pow(factor, delta);
            xy = e.getXY();
            center = me.toViewportXY(xy[0], xy[1]);
            me.scale(factor, factor, center);
            e.preventDefault();
        }
    },

    onDoubleTap: function (e) {
        var me = this,
            zoom = me.getZoom(),
            factor, center, xy;

        if (zoom && zoom.doubleTap && (factor = zoom.doubleTap.factor)) {
            xy = e.getXY();
            center = me.toViewportXY(xy[0], xy[1]);
            me.scale(factor, factor, center);
        }
    },

    createIndicator: function () {
        var me = this;

        if (me.hScroll) {
            return;
        }

        me.hScroll = Ext.dom.Element.create({
            tag: 'div',
            classList: [
                Ext.baseCSSPrefix + 'd3-scroll',
                Ext.baseCSSPrefix + 'd3-hscroll'
            ],
            style: {
            },
            children: [
                {
                    tag: 'div',
                    reference: 'bar',
                    classList: [
                        Ext.baseCSSPrefix + 'd3-scrollbar',
                        Ext.baseCSSPrefix + 'd3-hscrollbar'
                    ]
                }
            ]
        });
        me.hScrollBar = me.hScroll.dom.querySelector('[reference=bar]');
        me.hScrollBar.removeAttribute('reference');

        me.vScroll = Ext.dom.Element.create({
            tag: 'div',
            classList: [
                Ext.baseCSSPrefix + 'd3-scroll',
                Ext.baseCSSPrefix + 'd3-vscroll'
            ],
            style: {
            },
            children: [
                {
                    tag: 'div',
                    reference: 'bar',
                    classList: [
                        Ext.baseCSSPrefix + 'd3-scrollbar',
                        Ext.baseCSSPrefix + 'd3-vscrollbar'
                    ]
                }
            ]
        });
        me.vScrollBar = me.vScroll.dom.querySelector('[reference=bar]');
        me.vScrollBar.removeAttribute('reference');

        me.hScrollScale = me.createInterpolator(100);
        me.vScrollScale = me.createInterpolator(100);
    },

    destroyIndicator: function () {
        var me = this;

        Ext.destroy(me.hScroll, me.vScroll);
        me.hScroll = me.vScroll = me.hScrollBar = me.vScrollBar = null;
    },

    addIndicator: function (component) {
        var me = this,
            indicator = me.getIndicator(),
            indicatorParent = me.indicatorParent;

        if (indicator && !indicatorParent) {
            me.createIndicator();
            indicatorParent = me.indicatorParent = component[indicator.parent];
            if (indicatorParent) {
                indicatorParent.appendChild(me.hScroll);
                indicatorParent.appendChild(me.vScroll);
            }
        }
    },

    removeIndicator: function () {
        var me = this,
            indicatorParent = me.indicatorParent;

        if (indicatorParent) {
            if (me.hScroll) {
                indicatorParent.removeChild(me.hScroll);
            }
            if (me.vScroll) {
                indicatorParent.removeChild(me.vScroll);
            }
            me.indicatorParent = null;
        }
    },

    addComponent: function (component) {
        this.callParent([component]);
        this.addIndicator(component);
    },

    removeComponent: function (component) {
        this.removeIndicator();
        this.callParent([component]);
    }

});