/**
 * The base abstract class for legends.
 * The legend is designed to work with the {@link Ext.d3.svg.Svg} component.
 */
Ext.define('Ext.d3.legend.Legend', {

    mixins: {
        observable: 'Ext.mixin.Observable',
        detached: 'Ext.d3.mixin.Detached'
    },

    config: {
        /**
         * @cfg {"top"/"bottom"/"left"/"right"} [docked='bottom']
         * The position of the legend.
         */
        docked: 'bottom',

        padding: 30,

        hidden: false,

        /**
         * @cfg {Ext.d3.svg.Svg} component
         * The D3 SVG component to which the legend belongs.
         */
        component: null
    },

    defaultCls: {
        self: Ext.baseCSSPrefix + 'd3-legend',
        item: Ext.baseCSSPrefix + 'd3-legend-item',
        label: Ext.baseCSSPrefix + 'd3-legend-label',
        hidden: Ext.baseCSSPrefix + 'd3-hidden' // declared in Svg.scss
    },

    constructor: function (config) {
        var me = this;

        me.mixins.detached.constructor.call(me, config);
        me.group = me.getDetached().append('g').classed(me.defaultCls.self, true);

        me.mixins.observable.constructor.call(me, config);
    },

    getGroup: function () {
        return this.group;
    },

    applyDocked: function (docked) {
        var component = this.getComponent(),
            isRtl = component.getInherited().rtl;

        if (isRtl) {
            if (docked === 'left') {
                docked = 'right';
            } else if (docked === 'right') {
                docked = 'left';
            }
        }

        return docked;
    },

    getBox: function () {
        var me = this,
            hidden = me.getHidden(),
            docked = me.getDocked(),
            padding = me.getPadding(),
            bbox = me.group.node().getBBox(),
            box = me.box || (me.box = {});

        if (hidden) {
            return {
                x: 0, y: 0, width: 0, height: 0
            };
        }

        // Can't use Ext.Object.chain on SVGRect types.
        box.x = bbox.x;
        box.y = bbox.y;
        box.width = bbox.width;
        box.height = bbox.height;

        switch (docked) {
            case 'right':
                box.x -= padding;
            case 'left':
                box.width += padding;
                break;
            case 'bottom':
                box.y -= padding;
            case 'top':
                box.height += padding;
                break;

        }

        return box;
    },

    updateHidden: function (hidden) {
        hidden ? this.hide() : this.show();
    },

    show: function () {
        var me = this;

        me.group.classed(me.defaultCls.hidden, false);
        me.setHidden(false);
        me.fireEvent('show', me);
    },

    hide: function () {
        var me = this;

        me.group.classed(me.defaultCls.hidden, true);
        me.setHidden(true);
        me.fireEvent('hide', me);
    },

    updateComponent: function (component, oldComponent) {
        var me = this;

        if (oldComponent) {
            me.detach(me.group);
        }
        if (component) {
            me.attach(component.getScene(), me.group);
        }
    },

    destroy: function () {
        this.mixins.detached.destroy.call(this);
    }
});
