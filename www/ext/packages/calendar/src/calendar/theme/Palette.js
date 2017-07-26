/**
 * A color palette for styling events.
 */
Ext.define('Ext.calendar.theme.Palette', {

    /**
     * @property {String} primary
     * The primary color.
     */
    primary: null,

    /**
     * @property {String} secondary
     * The secondary color.
     */
    secondary: null,

    /**
     * @property {String} border
     * The border color.
     */
    border: null,

    constructor: function(config) {
        Ext.apply(this, config);
    }

});