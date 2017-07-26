/**
 * The 'd3-sunburst' component visualizes tree nodes as donut sectors,
 * with the root circle in the center. The angle and area of each sector corresponds
 * to its {@link Ext.d3.hierarchy.Hierarchy#nodeValue value}. By default
 * the same value is returned for each node, meaning that siblings will span equal
 * angles and occupy equal area.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'Sunburst Chart',
 *         height: 750,
 *         width: 750,
 *         layout: 'fit',
 *         items: [
 *             {
 *                 xtype: 'd3-sunburst',
 *                 padding: 20,
 *                 tooltip: {
 *                     renderer: function (component, tooltip, node) {
 *                         tooltip.setHtml(node.data.get('text'));
 *                     }
 *                 },
 *                 store: {
 *                     type: 'tree',
 *                     data: [
 *                         {
 *                             text: "Oscorp",
 *                             children: [
 *                                 {text: 'Norman Osborn'},
 *                                 {text: 'Harry Osborn'},
 *                                 {text: 'Arthur Stacy'}
 *                             ]
 *                         },
 *                         {
 *                             text: "SHIELD",
 *                             children: [
 *                                 {text: 'Nick Fury'},
 *                                 {text: 'Maria Hill'},
 *                                 {text: 'Tony Stark'}
 *                             ]
 *                         },
 *                         {
 *                             text: "Illuminati",
 *                             children: [
 *                                 {text: 'Namor'},
 *                                 {text: 'Tony Stark'},
 *                                 {text: 'Reed Richards'},
 *                                 {text: 'Black Bolt'},
 *                                 {text: 'Stephen Strange'},
 *                                 {text: 'Charles Xavier'}
 *                             ]
 *                         }
 *                     ]
 *                 }
 *             }
 *         ]
 *     });
 *
 */
Ext.define('Ext.d3.hierarchy.partition.Sunburst', {
    extend: 'Ext.d3.hierarchy.partition.Partition',
    xtype: 'd3-sunburst',

    config: {
        componentCls: 'sunburst',

        /**
         * The padding of a node's text inside its container.
         * @cfg {Array} textPadding
         */
        textPadding: [5, '0.35em'],

        /**
         * The radius of the dot in the center of the sunburst that represents the parent node
         * of the currently visible node hierarchy and allows to zoom one level up by clicking
         * or tapping it.
         * @cfg {Number} [zoomParentDotRadius=30]
         */
        zoomParentDotRadius: 30,

        transitions: {
            zoom: {
                duration: 1000,
                ease: 'cubicInOut'
            }
        }
    },

    setupScene: function (scene) {
        this.callParent([scene]);
        this.setupScales();
        this.setupArcGenerator();
    },

    scaleDefaults: {
        x: {
            domain: [0, 1],
            range: [0, 2 * Math.PI]
        },
        y: {
            domain: [0, 1]
        }
    },

    setupScales: function () {
        var defaults = this.scaleDefaults;
        // Node's x0 & x1 properties will represent the angle.
        // Node's y0 & y1 properties will represent the area
        // divided by π (since circle area = πr², we can treat
        // the area as if it's been already divided by π and
        // remove it from the right side of the equation as well,
        // the relationship is still preserved, and we can simply
        // take a square root of the area to get the radius).
        this.xScale = d3.scaleLinear()
            .domain(defaults.x.domain.slice())
            .range(defaults.x.range.slice());

        this.yScale = d3.scaleSqrt()
            .domain(defaults.y.domain.slice());
    },

    /**
     * [Arc generator](https://github.com/mbostock/d3/wiki/SVG-Shapes#arc)
     * for sunburst slices.
     * @private
     * @property {Function} arc
     */
    arc: null,

    defaultCls: {
        center: Ext.baseCSSPrefix + 'd3-center'
    },

    setupArcGenerator: function () {
        var me = this,
            x = me.xScale,
            y = me.yScale;

        // Takes a node of a partition layout and returns an arc (in SVG path syntax)
        // that represents it.
        me.arc = d3.arc()
            .startAngle(function (node) {
                return Math.max(0, Math.min(2 * Math.PI, x(node.x0)));
            })
            .endAngle(function (node) {
                return Math.max(0, Math.min(2 * Math.PI, x(node.x1)));
            })
            .innerRadius(function (node) {
                return Math.max(0, y(node.y0));
            })
            .outerRadius(function (node) {
                return Math.max(0, y(node.y1));
            });
    },

    /**
     * @protected
     * Override parent method to neither set the layout size,
     * nor perform layout on scene resize.
     * The default layout size of 1x1 is used at all times.
     * Only the output range of scales changes.
     */
    onSceneResize: function (scene, rect) {
        var me = this,
            nodesGroup = me.nodesGroup,
            centerX = .5 * rect.width,
            centerY = .5 * rect.height,
            radius = Math.min(centerX, centerY);

        nodesGroup.attr('transform', 'translate(' + centerX + ',' + centerY + ')');

        me.setRadius(radius);
    },

    radius: null,
    minRadius: 1,

    setRadius: function (radius) {
        var me = this;

        radius = Math.max(me.minRadius, radius);
        me.radius = radius;
        me.yScale.range([0, radius]);

        me.renderScene();
    },

    /**
     * Zooms in the `node`, so that the sunburst only shows the node itself and its children.
     * To zoom in instantly, even when the {@link #transitions} `zoom` config is not `false`,
     * set the second argument to `true`.
     * @param {Ext.data.TreeModel} record
     * @param {Boolean} [instantly]
     */
    zoomInNode: function (record, instantly) {
        var me = this,
            scene = me.getScene(),
            parentRadius = me.getZoomParentDotRadius(),
            radius = me.radius,
            xScale = me.xScale,
            yScale = me.yScale,
            arc = me.arc,
            transition, node, nodes;

        if (me.hasFirstLayout && me.hasFirstRender && me.size && record && record.isNode) {
            node = me.nodeFromRecord(record);
        }
        if (!node) {
            return;
        }

        transition = me.createTransition(instantly ? 'none' : 'zoom', scene);

        nodes = transition.tween('scale', function () {
                // Default xScale and yScale domain is [0, 1].
                // Default xScale range is [0, 2π].
                // By reducing the xScale's domain to the span of selected slice,
                // we make it occupy the whole pie angle.
                // Similarly, by reducing the yScale's domain to an interval
                // past slice's radius, we make that slice and its children
                // occupy the whole pie radius.
                // By making the yScale's range start with a non-zero value,
                // we make a hole in the current subtree that now occupies
                // the whole pie. Inside that hole the parent node (that now
                // falls out of yScale's range) is going to be visible
                // and available for selection to go one level up.
                var xDomain = d3.interpolate(xScale.domain(), [node.x0, node.x1]),
                    yDomain = d3.interpolate(yScale.domain(), [node.y0, 1]),
                    yRange = d3.interpolate(yScale.range(), [node.y0 ? parentRadius : 0, radius]);

                return function (t) {
                    xScale.domain(xDomain(t));
                    yScale.domain(yDomain(t)).range(yRange(t));
                };
            })
            .selectAll('.' + me.defaultCls.node);

        nodes.selectAll('path')
            .attrTween('d', function (node) {
                return function (t) {
                    // Layout stays exactly the same, but scales
                    // change slightly on every frame.
                    return arc(node);
                };
            });

        nodes.selectAll('text')
            .call(me.positionTextFn.bind(me))
            .call(me.textVisibilityFn.bind(me));

        if (instantly) {
            me.xScale.domain([node.x0, node.x1]);
            me.yScale.domain([node.y0, 1]).range([node.y0 ? parentRadius : 0, radius]);
        }
    },

    onNodeSelect: function (node, el) {
        var me = this,
            transitionCfg = me.getTransitions().select,
            to = transitionCfg.targetScale,
            from = transitionCfg.sourceScale,
            transition = me.createTransition('select');

        me.callParent(arguments);

        // Bring selected element to front to avoid the stroke being clipped by adjacent elements.
        // Remove the fill, so that CSS can be used to specify the color of the selection.
        el.raise().select('path').style('fill', null);

        if (transition.duration()) {
            el
                .transition(transition)
                .attr('transform', 'scale(' + to +  ',' + to + ')')
                .transition(transition)
                .attr('transform', 'scale(' + from +  ',' + from + ')');
        }
    },

    onNodeDeselect: function (node, el) {
        var me = this,
            colorAxis = me.getColorAxis();

        me.callParent(arguments);

        // Restore the original color.
        // (see 'onNodeSelect' comments).
        el
            .select('path')
            .style('fill', function (node) {
                return colorAxis.getColor(node);
            });
    },

    /**
     * @private
     * Checks if a bounding box (e.g. of a text) fits inside a slice.
     * The bounding box is assumed to be centered in the middle of the slice
     * angularly, with the width of the box in the direction of the radius,
     * and left edge 'px' pixels from inner radius (r1).
     * @param {Object} bbox
     * @param {Number} bbox.width
     * @param {Number} bbox.height
     * @param {Number} a1 Start angle in the [0, 2 * Math.PI] interval.
     * @param {Number} a2 End angle in the [0, 2 * Math.PI] interval.
     * @param {Number} r1 Inner radius.
     * @param {Number} r2 Outer radius.
     * @param {Number} px X-padding.
     * @param {Number} py Y-padding.
     * @returns {Boolean}
     */
    isBBoxInSlice: function (bbox, a1, a2, r1, r2, px, py) {
        var a = Math.abs(a2 - a1),
            width = Math.abs(r2 - r1) - px * 2,
            height = a < Math.PI
                ? 2 * (r1 + px) * Math.tan(0.5 * a) - py * 2
                : 0.5 * r2, // for very big angles text is never too tall,
                            // so there must be some other limit
            isWider = bbox.width > width,
            isTaller = bbox.height > height;

        return !(isWider || isTaller);
    },

    /**
     * @private
     */
    textVisibilityFn: function (selection) {
        var me = this,
            x = me.xScale,
            y = me.yScale,
            invisibleCls = me.defaultCls.invisible,
            textPadding = me.getTextPadding(),
            px = parseFloat(textPadding[0]),
            py = parseFloat(textPadding[1]),
            isTransition = selection instanceof d3.transition;

        function isInvisible(el, node) {
            //<debug>
            if (me.isDestroyed) {
                Ext.log.warn("Component is destroyed, shouldn't have executed this.");
            }
            //</debug>
            var bbox = el._bbox || el.getBBox(), // SVG 'text' element
                a1 = x(node.x0),
                a2 = x(node.x1),
                r1 = y(node.y0),
                r2 = y(node.y1),
                isBBoxInSlice = me.isBBoxInSlice(bbox, a1, a2, r1, r2, px, py),
                xDomain = x.domain(),
                yDomain = y.domain(),
                isOutOfX = xDomain[0] > node.x0 || xDomain[1] < node.x1,
                isOutOfY = yDomain[0] > node.y0 || yDomain[1] < node.y1;

            return !isBBoxInSlice || isOutOfX || isOutOfY;
        }

        if (isTransition) {
            selection.tween('class.invisible', function (node) {
                var el = this;
                return function () {
                    d3.select(el).classed(invisibleCls, isInvisible(el, node));
                };
            });
        } else {
            selection.classed(invisibleCls, function (node) {
                return isInvisible(this, node);
            });
        }
    },

    /**
     * @private
     * @param {d3.selection} selection 'text' elements.
     */
    positionTextFn: function (selection) {
        var me = this,
            x = me.xScale,
            y = me.yScale,
            halfPi = Math.PI / 2,
            degreesPerRadian = 180 / Math.PI,
            isTween = selection instanceof d3.transition,
            method = isTween ? 'attrTween' : 'attr',
            xFn, transformFn;

        function getX(node) {
            return y(node.y0);
        }
        function getTransform(node) {
            return node === me.root ? ''
                : ('rotate(' + (x((node.x0 + node.x1) / 2) - halfPi) * degreesPerRadian + ')');
        }

        if (isTween) {
            // Interpolator factory evaluated for every element on transition start.
            xFn = function (node) {
                // Interpolator, invoked for every frame of transition and is given time t in [0, 1].
                return function () {
                    // We don't use the time here, as the running transition will be changing
                    // the domain of the scale used by the `getX` function, so each frame the result
                    // will be different even if `node.y` doesn't change. See the `zoomInNode`
                    // method for more details.
                    return getX(node);
                };
            };
            transformFn = function (node) {
                return function () {
                    return getTransform(node);
                };
            };
        } else {
            xFn = function (node) {
                return getX(node);
            };
            transformFn = function (node) {
                return getTransform(node);
            };
        }

        selection
            [method]('x', xFn)
            [method]('transform', transformFn);
    },

    addNodes: function (selection) {
        var me = this,
            textPadding = me.getTextPadding();

        selection
            .append('path')
            .attr('d', me.arc);

        selection
            .append('text')
            .attr('class', me.defaultCls.label)
            .each(function (node) {
                if (node !== me.root) {
                    this.setAttribute('dx', textPadding[0]);
                    this.setAttribute('dy', textPadding[1]);
                }
            });
    },

    measureLabels: function (selection) {
        var isTransition = selection instanceof d3.transition;

        if (!isTransition) {
            selection.each(function () {
                // Cache the bounding box on the element itself each time data updates
                // to use later during a transition.
                this._bbox = this.getBBox();
            });
        }
    },

    updateNodes: function (update, enter) {
        var me = this,
            colorAxis = me.getColorAxis(),
            nodeText = me.getNodeText(),
            selectionCfg = me.getSelection(),
            selection = update.merge(enter);

        selection
            .select('path')
            .attr('d', me.arc)
            .style('fill', function (node) {
                // Don't set the color of selected element to allow for CSS styling.
                return node.data === selectionCfg ? null : colorAxis.getColor(node);
            });

        selection
            .select('text')
            .text(function (node) {
                return nodeText(me, node);
            })
            .call(me.measureLabels.bind(me))
            .call(me.positionTextFn.bind(me))
            .call(me.textVisibilityFn.bind(me));

        me.nodesGroup.select('.' + me.defaultCls.selected).raise();
    },

    updateColorAxis: function (colorAxis) {
        var me = this;

        if (!me.isConfiguring) {
            me.getRenderedNodes()
                .select('path')
                .style('fill', function (node) {
                    return colorAxis.getColor(node);
                });
        }
    }

});
