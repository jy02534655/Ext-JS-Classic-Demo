/**
 * @private
 * Modern.
 */
Ext.define('Ext.d3.ComponentBase', {
    extend: 'Ext.Component',

    onElementResize: function (element, width, height) {
        this.handleResize({
            width: width,
            height: height
        });
    }

});