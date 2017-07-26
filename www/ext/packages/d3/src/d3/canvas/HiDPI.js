/**
 * This singleton applies overrides to the '2d' context of the HTML5 Canvas element
 * to make it resolution independent.
 */
Ext.define('Ext.d3.canvas.HiDPI', {
    singleton: true,

    relFontSizeRegEx: /(^[0-9])*(\d+(?:\.\d+)?)(px|%|em|pt)/,
    absFontSizeRegEx: /(xx-small)|(x-small)|(small)|(medium)|(large)|(x-large)|(xx-large)/,

    /*
     * Methods [M] and properties [P] that don't correspond to a number of pixels
     * (or do, but aren't meant to be resolution independent) and don't need to be overriden:
     * - [M] save
     * - [M] restore
     * - [M] scale
     * - [M] rotate
     * - [M] beginPath
     * - [M] closePath
     * - [M] clip
     * - [M] createImageData
     * - [M] getImageData
     * - [M] drawFocusIfNeeded
     * - [M] createPattern
     *
     * - [P] shadowBlur
     * - [P] shadowColor
     * - [P] textAlign
     * - [P] textBaseline
     * - [P] fillStyle
     * - [P] strokeStyle
     * - [P] lineCap
     * - [P] globalAlpha
     * - [P] globalCompositeOperation
     *
     * `fill` and `stroke` methods still have to be overriden, because we cannot
     * override context properties (that do correspond to a number of pixels).
     * But because context properties are not used until a fill or stroke operation
     * is performed, we can postpone scaling them, and do it when `fill` and `stroke`
     * methods are called.
     */

    /**
     * @private
     */
    fillStroke: function (ctx, ratio, method) {
        var font = ctx.font,
            fontChanged = font !== ctx.$oldFont,
            shadowOffsetX = ctx.shadowOffsetX,
            shadowOffsetY = ctx.shadowOffsetY,
            lineDashOffset = ctx.lineDashOffset,
            lineWidth = ctx.lineWidth,
            scaledFont;

        if (fontChanged) {
            // No support for shorthands like 'caption', 'icon', 'menu', etc.
            // Sample font shorthand:
            //     italic small-caps 400 1.2em/110% "Times New Roman", serif
            scaledFont = font.replace(this.relFontSizeRegEx, function (match, p1, p2) {
                return parseFloat(p2) * ratio;
            });
            scaledFont = scaledFont.replace(this.absFontSizeRegEx, function (match, p1, p2, p3, p4, p5, p6, p7) {
                if (p1) {
                    return 9 * ratio + 'px'; // xx-small
                }
                if (p2) {
                    return 10 * ratio + 'px'; // x-small
                }
                if (p3) {
                    return 13 * ratio + 'px'; // small
                }
                if (p4) {
                    return 16 * ratio + 'px'; // medium
                }
                if (p5) {
                    return 18 * ratio + 'px'; // large
                }
                if (p6) {
                    return 24 * ratio + 'px'; // x-large
                }
                if (p7) {
                    return 32 * ratio + 'px'; // xx-large
                }
            });
            ctx.font = scaledFont;
            ctx.$oldFont = font;
            ctx.$scaledFont = scaledFont;
        } else {
            ctx.font = ctx.$scaledFont;
        }
        ctx.shadowOffsetX = shadowOffsetX * ratio;
        ctx.shadowOffsetY = shadowOffsetY * ratio;
        ctx.lineDashOffset = lineDashOffset * ratio;
        ctx.lineWidth = lineWidth * ratio;

        if (arguments.length > 3) {
            ctx[method].apply(ctx, Array.prototype.slice.call(arguments, 3));
        } else {
            ctx[method]();
        }

        ctx.font = font;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.lineDashOffset = lineDashOffset;
        ctx.lineWidth = lineWidth;
    },

    /**
     * @private
     */
    getOverrides: function () {
        var me = this,
            ratio = me.getDevicePixelRatio();

        return this.overrides || (this.overrides = {
            fill: function () {
                me.fillStroke(this, ratio, '$fill');
            },
            stroke: function () {
                me.fillStroke(this, ratio, '$stroke');
            },
            moveTo: function (x, y) {
                this.$moveTo(x * ratio, y * ratio);
            },
            lineTo: function (x, y) {
                this.$lineTo(x * ratio, y * ratio);
            },
            quadraticCurveTo: function (cpx, cpy, x, y) {
                this.$quadraticCurveTo(cpx * ratio, cpy * ratio, x * ratio, y * ratio);
            },
            bezierCurveTo: function (cp1x, cp1y, cp2x, cp2y, x, y) {
                this.$bezierCurveTo(
                    cp1x * ratio, cp1y * ratio,
                    cp2x * ratio, cp2y * ratio,
                    x * ratio, y * ratio
                );
            },
            arcTo: function (x1, y1, x2, y2, radius) {
                this.$arcTo(x1 * ratio, y1 * ratio, x2 * ratio, y2 * ratio, radius * ratio);
            },
            arc: function (x, y, radius, startAngle, endAngle, counterclockwise) {
                this.$arc(
                    x * ratio, y * ratio, radius * ratio,
                    startAngle, endAngle, counterclockwise
                );
            },
            rect: function (x, y, width, height) {
                this.$rect(x * ratio, y * ratio, width * ratio, height * ratio);
            },
            clearRect: function (x, y, width, height) {
                this.$clearRect(x * ratio, y * ratio, width * ratio, height * ratio);
            },
            fillRect: function (x, y, width, height) {
                me.fillStroke(this, ratio, '$fillRect',
                    x * ratio, y * ratio, width * ratio, height * ratio);
            },
            strokeRect: function (x, y, width, height) {
                me.fillStroke(this, ratio, '$strokeRect',
                    x * ratio, y * ratio, width * ratio, height * ratio);
            },
            translate: function (x, y) {
                this.$translate(x * ratio, y * ratio);
            },
            transform: function (xx, yx, xy, yy, dx, dy) {
                this.$transform(xx, yx, xy, yy, dx * ratio, dy * ratio);
            },
            setTransform: function (xx, yx, xy, yy, dx, dy) {
                this.$setTransform(xx, yx, xy, yy, dx * ratio, dy * ratio);
            },
            isPointInPath: function (path, x, y, fillRule) {
                var n = arguments.length;

                if (n > 3) {
                    return this.$isPointInPath(path, x * ratio, y * ratio, fillRule);
                } else if (n > 2) {
                    return this.$isPointInPath(path * ratio, x * ratio, y);
                } else {
                    return this.$isPointInPath(path * ratio, x * ratio);
                }
            },
            isPointInStroke: function (path, x, y) {
                var n = arguments.length;

                if (n > 2) {
                    return this.$isPointInStroke(path, x * ratio, y * ratio);
                } else {
                    return this.$isPointInStroke(path * ratio, x * ratio);
                }
            },
            drawImage: function (image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
                var n = arguments.length;

                if (n > 5) {
                    this.$drawImage(image,
                        sx, sy, sWidth, sHeight,
                        dx * ratio, dy * ratio, dWidth * ratio, dHeight * ratio);
                } else if (n > 3) {
                    // sx, sy, sWidth, sHeight are actually dx, dy, dWidth, dHeight in this case,
                    // i.e. destination canvas coordinates and dimensions, and have to be scaled.
                    this.$drawImage(image,
                        sx * ratio, sy * ratio,
                        sWidth * ratio, sHeight * ratio
                    );
                } else {
                    // sx and sy are actually dx and dy in this case,
                    // i.e. destination canvas coordinates and have to be scaled.
                    this.$drawImage(image, sx * ratio, sy * ratio);
                }
            },
            putImageData: function (imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
                this.$putImageData(imagedata, dx * ratio, dy * ratio,
                    dirtyX, dirtyY, dirtyWidth, dirtyHeight);
            },
            setLineDash: function (segments) {
                if (!(segments instanceof Array)) {
                    segments = Array.prototype.slice.call(segments);
                }
                this.$setLineDash(segments.map(function (v) { return v * ratio; }));
            },
            fillText: function (text, x, y, maxWidth) {
                this.$fillText(text, x * ratio, y * ratio, maxWidth * ratio);
            },
            strokeText: function (text, x, y, maxWidth) {
                this.$strokeText(text, x * ratio, y * ratio, maxWidth * ratio);
            },
            measureText: function (text) {
                var result = this.$measureText(text);

                result.width *= ratio;

                return result;
            },
            createLinearGradient: function (x0, y0, x1, y1) {
                return this.$createLinearGradient(
                    x0 * ratio, y0 * ratio, x1 * ratio, y1 * ratio
                );
            },
            createRadialGradient: function (x0, y0, r0, x1, y1, r1) {
                return this.$createRadialGradient(
                    x0 * ratio, y0 * ratio, r0 * ratio,
                    x1 * ratio, y1 * ratio, r1 * ratio
                );
            }
        });
    },

    /**
     * Gets device pixel ratio of the `window` object or the given Canvas element.
     * If given a Canvas element without {@link #applyOverrides overrides},
     * the method will return 1, regardless of the actual device pixel ratio.
     * @param {HTMLCanvasElement} [canvas]
     * @return {Number}
     */
    getDevicePixelRatio: function (canvas) {
        if (canvas) {
            return canvas.$devicePixelRatio || 1;
        }
        // `devicePixelRatio` is only supported from IE11,
        // so we use `deviceXDPI` and `logicalXDPI` that are supported from IE6.
        return window.devicePixelRatio
            || window.screen && window.screen.deviceXDPI / window.screen.logicalXDPI
            || 1;
    },

    /**
     * Enables resolution independed drawing for the given Canvas element,
     * if device pixel ratio is not 1.
     * @param {HTMLCanvasElement} canvas
     * @return {HTMLCanvasElement} The given canvas element.
     */
    applyOverrides: function (canvas) {
        var ctx = canvas.getContext('2d'),
            ratio = this.getDevicePixelRatio(),
            overrides = this.getOverrides(),
            name;

        if (!(canvas.$devicePixelRatio || ratio === 1)) {
            // Save original ctx methods under a different name
            // by prefixing them with '$'. Original methods will
            // be called from overrides.
            for (name in overrides) {
                ctx['$' + name] = ctx[name];
            }
            Ext.apply(ctx, overrides);

            // Take note of the pixel ratio, which should be used for this canvas
            // element from now on, e.g. when new size is given via 'setResize'.
            // This is because the overrides have already been applied for a certain
            // pixel ratio, and if we move the browser window to a screen with a
            // different pixel ratio, the overrides would have to change as well,
            // and the canvas would have to be rerendered by whoever's using it.
            // This is also complicated by the absense of any sort of event
            // that lets us know about a change in the device pixel ratio.
            canvas.$devicePixelRatio = ratio;
        }

        return canvas;
    },

    /**
     * Sets the size of the Canvas element, taking device pixel ratio into account.
     * Note that resizing the Canvas will reset its context, e.g.
     * lineWidth will be set to 1, fillStyle to #000000, and so on.
     * @param {HTMLCanvasElement} canvas
     * @param {Number} width
     * @param {Number} height
     * @return {HTMLCanvasElement} The given canvas element.
     */
    setSize: function (canvas, width, height) {
        var ratio = this.getDevicePixelRatio(canvas);

        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = Math.round(width) + 'px';
        canvas.style.height = Math.round(height) + 'px';

        return canvas;
    }

});