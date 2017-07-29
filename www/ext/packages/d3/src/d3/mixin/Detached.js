/**
 * @private
 */
Ext.define('Ext.d3.mixin.Detached', {

    extend: 'Ext.Mixin',

    detached: null,

    constructor: function (config) {
        this.detached = d3.select('body').append('svg').remove().attr('version', '1.1');
    },

    getDetached: function () {
        return this.detached;
    },

    isDetached: function (selection) {
        return selection && selection.node().parentElement === this.detached.node();
    },

    attach: function (parent, child) {
        if (parent instanceof d3.selection) {
            parent = parent.node();
        }
        if (!(parent instanceof SVGElement)) {
            Ext.raise('The `parent` must either be a D3 selection or an SVG element.');
        }

        if (child instanceof d3.selection) {
            parent.appendChild(child.node());
        } else if (child instanceof SVGElement) {
            parent.appendChild(child);
        } else {
            Ext.raise('The `child` must either be a D3 selection or an SVG element.');
        }
    },

    detach: function (child) {
        this.attach(this.detached, child);
    },

    destroy: function() {
        var node = this.detached.node();
        
        // IE does not support Element.remove() on SVG elements
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
        
        this.callParent();
    }

});