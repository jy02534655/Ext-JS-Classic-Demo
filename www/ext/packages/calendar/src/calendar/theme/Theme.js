/**
 * This class provides theming functionality for events in the calendar.
 *
 * The colors used for call calendars in an app can be stipulated by overriding this
 * class.  Below is an example override that sets the `colors`, `lightColor`, and
 * `darkColor` values:
 *
 *     Ext.define('MyApp.util.MyPalette', {
 *         override: 'Ext.calendar.theme.Theme',
 *         colors: [
 *             'rgb(44,151,222)',
 *             'rgb(233,75,53)',
 *             'rgb(30,206,109)',
 *             'rgb(156,86,184)',
 *             'rgb(60,214,220)',
 *             'rgb(232,126,3)',
 *             'rgb(0,189,156)'
 *         ],
 *         lightColor: 'rgb(238,238,238)',
 *         darkColor: 'rgb(34,34,34)'
 *     });
 */
Ext.define('Ext.calendar.theme.Theme', {
    singleton: true,

    requires: ['Ext.util.Color'],

    /**
     * @property {String[]} colors
     * The list of primary colors to use for events. These colors will be used as
     * defaults if the event or owning calendar does not specify a color.
     */
    colors: [
        '#F44336',
        '#3F51B5',
        '#4CAF50',
        '#FF9800',
        '#E91E63',
        '#2196F3',
        '#8BC34A',
        '#FF5722',
        '#673AB7',
        '#009688',
        '#FFC107',
        '#607D8B'
    ],

    /**
     * @property {String} lightColor
     * A complementary color to be used when the primary color is dark.
     */
    lightColor: '#FFFFFF',

    /**
     * @property {String} darkColor
     * A complementary color to be used when the primary color is light.
     */
    darkColor: '#000000',

    /**
     * Gererates a color palette from a base color. To be
     * overriden when providing custom implementations.
     * @param {Ext.util.Color} color The base color.
     * @param {Number} color.r The red component.
     * @param {Number} color.g The green component.
     * @param {Number} color.b The blue component.
     * @return {Ext.calendar.theme.Palette} The color palette.
     *
     * @protected
     */
    generatePalette: function(color) {
        var me = this,
            light = me.light,
            dark = me.dark,
            lightColor = me.lightColor,
            darkColor = me.darkColor,
            brightness = color.getBrightness(),
            lightContrast, darkConstrast;

        if (!light) {
            me.light = light = Ext.util.Color.fromString(lightColor);
            me.dark = dark = Ext.util.Color.fromString(darkColor);
        }

        lightContrast = Math.abs(light.getBrightness() - brightness);
        darkConstrast = Math.abs(dark.getBrightness() - brightness);

        return {
            primary: color.toString(),
            secondary: lightContrast > darkConstrast ? lightColor : darkColor,
            border: color.createDarker(0.2).toString()
        }
    },

    /**
     * Get the base color for a calendar. If one has been previously generated, use
     * that, otherwise get the next available base color from the specified
     *  {@link #cfg-colors color} sequence.
     * @param {Ext.data.Model} calendar The calendar.
     * @return {String} The color
     */
    getBaseColor: function(calendar) {
        var me = this,
            map = me.idMap,
            colors = me.colors,
            id = calendar.id,
            color;

        color = map[id];
        if (!color) {
            color = colors[me.current % colors.length];
            map[id] = color;
            ++me.current;
        }
        return color;
    },

    /**
     * Gets a palette for a base color.
     * @param {String} color The base color.
     * @return {Ext.calendar.theme.Palette} The color palette.
     */
    getPalette: function(color) {
        var map = this.colorMap,
            palette = map[color],
            o;

        if (!palette) {
            o = Ext.util.Color.fromString(color);
            map[color] = palette = this.generatePalette(o);
        }

        return palette;
    },

    privates: {
        /**
         * @property {Object} colorMap
         * A map of color strings to palettes.
         *
         * @private
         */
        colorMap: {},

        /**
         * @property {Object} idMap
         * A map of calendar id to color.
         *
         * @private
         */
        idMap: {},

        /**
         * @property {Number} current
         * The current index to pull the latest color from.
         *
         * @private
         */
        current: 0,

        /**
         * React to calendar id changing, update the internal map with
         * the new id.
         * @param {Object} newId The new id.
         * @param {Object} oldId The old id.
         *
         * @private
         */
        onIdChanged: function(newId, oldId) {
            var map = this.idMap,
                val = map[oldId];

            if (val) {
                delete map[oldId];
                map[newId] = val;
            }

        }
    }
});
