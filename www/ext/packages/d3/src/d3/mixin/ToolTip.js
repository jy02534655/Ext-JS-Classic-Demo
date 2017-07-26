/**
 * The ToolTip mixin is used to add {@link Ext.tip.ToolTip tooltip} support to various
 * D3 components.
 */
Ext.define('Ext.d3.mixin.ToolTip', {
    extend: 'Ext.Mixin',

    mixinConfig: {
        id: 'd3tooltip',
        before: {
            destroy: 'destroyTooltip'
        }
    },
    
    requires: [
        'Ext.tip.ToolTip'
    ],

    config: {
        /**
         * @cfg {Ext.tip.ToolTip} tooltip
         * The {@link Ext.tip.ToolTip} class config object with one extra supported
         * property: `renderer`.
         * @cfg {Function} tooltip.renderer
         * For example:
         *
         *     tooltip: {
         *         renderer: function (component, tooltip, node, element) {
         *             tooltip.setHtml('Customer: ' + node.data.get('name'));
         *         }
         *     }
         */
        tooltip: null
    },

    applyTooltip: function (tooltip, oldTooltip) {
        Ext.destroy(oldTooltip);

        if (tooltip) {
            tooltip = new Ext.tip.ToolTip(Ext.merge({
                renderer: Ext.emptyFn,
                target: this.el,
                constrainPosition: true,
                shrinkWrapDock: true,
                autoHide: true,
                trackMouse: true,
                showOnTap: true
            }, tooltip));

            tooltip.on('hovertarget', 'onTargetHover', this);
        }

        return tooltip;
    },

    onTargetHover: function (tooltip, element) {
        if (element.dom) {
            Ext.callback(tooltip.renderer, tooltip.scope,
                [this, tooltip, element.dom.__data__, element], 0, this);
        }
    },

    destroyTooltip: function () {
        this.setTooltip(null);
    }
});
