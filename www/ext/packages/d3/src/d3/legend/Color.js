/**
 * The `Ext.d3.legend.Color` is designed to work with the {@link Ext.d3.axis.Color Color} axis
 * and present the range of its possible values in various ways.
 */
Ext.define('Ext.d3.legend.Color', {
    extend: 'Ext.d3.legend.Legend',

    requires: [
        'Ext.d3.Helpers'
    ],

    config: {
        /**
         * @cfg {Ext.d3.axis.Color} axis
         * The color axis that this legend represents.
         */
        axis: null,

        /**
         * @cfg {Object} items
         * @cfg {Number} items.count The number of legend items to use to represent
         * the range of possible values of the color axis scale.
         * This config makes use of the `ticks` method of the color axis
         * scale. Please see the method's [documentation](https://github.com/d3/d3-3.x-api-reference/blob/master/Quantitative-Scales.md#user-content-linear_ticks)
         * for more info.
         * This number is only a hint, the actual number may be different.
         * @cfg {Number[]} items.slice Arguments to the Array's `slice` method.
         * For example, to skip the first legend item use the value of `[1]`,
         * to skip the first and last item: `[1, -1]`.
         * @cfg {Boolean} items.reverse Set to `true` to reverse the order of items in the legend.
         * Note: the slicing of items happens before the order is reversed.
         * @cfg {Object} items.size The size of a single legend item.
         * @cfg {Number} items.size.x The width of a legend item.
         * @cfg {Number} items.size.y The height of a legend item.
         */
        items: {
            count: 5,
            slice: null,
            reverse: false,
            size: {
                x: 30,
                y: 30
            }
        }
    },

    getScale: function () {
        return this.getAxis().getScale();
    },
    
    updateAxis: function (axis, oldAxis) {
        var me = this;

        if (oldAxis) {
            oldAxis.un('scalechange', me.onScaleChange, me);
        }
        if (axis) {
            axis.on('scalechange', me.onScaleChange, me);
        }
    },

    onScaleChange: function (axis, scale) {
        this.renderItems();
    },

    updateItems: function () {
        if (!this.isConfiguring) {
            this.renderItems();
        }
    },

    renderItems: function () {
        var me = this,
            scale = me.getScale(),
            items = me.getItems(),
            itemSelection = me.getRenderedItems(),
            ticks, updateSelection;

        if (items.count > 0 && scale.ticks) {
            ticks = scale.ticks(items.count);
            if (items.slice) {
                ticks = ticks.slice.apply(ticks, items.slice);
            }
            if (items.reverse) {
                ticks = ticks.reverse();
            }
        } else {
            ticks = scale.domain();
        }

        if (ticks) {
            updateSelection = itemSelection.data(ticks);

            me.onAddItems(updateSelection.enter());
            me.onUpdateItems(updateSelection);
            me.onRemoveItems(updateSelection.exit());
        }
    },

    getRenderedItems: function () {
        return this.group.selectAll('.' + this.defaultCls.item);
    },

    onAddItems: function (selection) {
        var me = this;

        selection = selection.append('g').classed(me.defaultCls.item, true);
        selection.append('rect');
        selection.append('text');
        me.onUpdateItems(selection);
    },

    onUpdateItems: function (selection) {
        var me = this,
            items = me.getItems(),
            docked = me.getDocked(),
            scale = me.getScale(),
            blocks, labels;

        blocks = selection.select('rect')
            .attr('width', items.size.x)
            .attr('height', items.size.y)
            .style('fill', scale);

        labels = selection.select('text')
            .each(function () {
                Ext.d3.Helpers.setDominantBaseline(this, 'middle');
            })
            .attr('text-anchor', 'middle')
            .text(String);

        switch (docked) {
            case 'left':
            case 'right':
                blocks.attr('transform', function (data, index) {
                    return 'translate(0,' + index * items.size.y + ')';
                });
                labels
                    .attr('x', items.size.x + 10)
                    .attr('y', function (data, index) {
                        return (index + 0.5) * items.size.y;
                    })
                    .attr('dx', 10);
                break;
            case 'top':
            case 'bottom':
                blocks.attr('transform', function (data, index) {
                    return 'translate(' + index * items.size.x + ',0)';
                });
                labels
                    .attr('x', function (data, index) {
                        return (index + 0.5) * items.size.x;
                    })
                    .attr('y', items.size.y)
                    .attr('dy', '1em');
                break;
        }
    },

    onRemoveItems: function (selection) {
        selection.remove();
    }

});
