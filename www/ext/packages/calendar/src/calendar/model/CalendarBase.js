/**
 * A mixin that provides some base behaviors for calendars. The default
 * implementation is {@link Ext.calendar.model.Calendar}. To provide
 * a custom implementation, this mixin should be used and the remaining
 * parts of the API need to be implemented.
 */
Ext.define('Ext.calendar.model.CalendarBase', {
    extend: 'Ext.Mixin',

    requires: [
        'Ext.calendar.store.Events',
        'Ext.calendar.theme.Theme'
    ],

    config: {
        /**
         * @cfg {Object} eventStoreDefaults
         * Defaults to use for the {@link #events} store.
         */
        eventStoreDefaults: {
            type: 'calendar-events',
            proxy: {
                type: 'ajax'
            }
        }
    },

    /**
     * @method getEventStoreDefaults
     * @hide
     */
    
    /**
     * @method setEventStoreDefaults
     * @hide
     */

    /**
     * Get the events store for this calendar.
     * @return {Ext.calendar.store.Events} The events.
     */
    events: function() {
        var me = this,
            store = me._eventStore,
            cfg;

        if (!store) {
            cfg = Ext.merge({
                calendar: me
            }, me.config.eventStoreDefaults, me.eventStoreDefaults);
            me._eventStore = store = Ext.Factory.store(me.getEventStoreConfig(cfg));
        }
        return store;
    },

    /**
     * @method getAssignedColor
     * Get the assigned color for this calendar. Used when a {@link #getColor color}
     * is not specified.
     * @return {String} The color.
     *
     * @abstract
     */

    /**
     * Get the base color for this calendar. Uses {@link #getColor} or {@link #getAssignedColor}.
     * If not specified, a color is used from the default theme.
     * @return {String} The color.
     */
    getBaseColor: function() {
        var color = this.getColor() || this.getAssignedColor();
        if (!color) {
            color = Ext.calendar.theme.Theme.getBaseColor(this);
            this.setAssignedColor(color);
        }
        return color;
    },

    /**
     * @method getColor
     * Gets a specified color for this calendar.
     * @return {String} The color.
     *
     * @abstract
     */

    /**
     * @method getDescription
     * Gets the description for this calendar.
     * @return {String} The description.
     *
     * @abstract
     */
    
    /**
     * @method getEditable
     * Gets the editable state for this calendar.
     * @return {Boolean} The editable state.
     *
     * @abstract
     */
    
    /**
     * @method getEventStoreConfig
     * Get the event store configuration.
     * @param {Object} config The default config.
     * @return {Object} The configuration.
     * 
     * @protected
     */

    /**
     * @method getHidden
     * Gets the hidden state for this calendar.
     * @return {Boolean} The hidden state.
     *
     * @abstract
     */

    /**
     * @method getTitle
     * Gets the title for this calendar.
     * @return {String} The title.
     *
     * @abstract
     */

     /**
      * Checks if this calendar (and events) are editable. This
      * includes being able to create, modify or remove events.
      * @return {Boolean} `true` if this calendar is editable.
      */
     isEditable: function() {
        return this.getEditable();
     },

    /**
     * Checks if this calendar is hidden.
     * @return {Boolean} `true` if the calendar is hidden.
     */
    isHidden: function() {
        return this.getHidden();
    },

    /**
     * @method setAssignedColor
     * Set the assigned color for this calendar.
     * @param {String} color The assigned color.
     *
     * @abstract
     */

    /**
     * @method setColor
     * Set the color for this calendar.
     * @param {String} color The color.
     *
     * @abstract
     */

    /**
     * @method setDescription
     * Set the description for this calendar.
     * @param {String} description The description.
     *
     * @abstract
     */
    
    /**
     * @method setEditable
     * Set the editable state for this calendar.
     * @param {Boolean} editable The editable state.
     *
     * @abstract
     */

    /**
     * @method setHidden
     * Set the hidden state for this calendar.
     * @param {Boolean} hidden The hidden state.
     *
     * @abstract
     */

    /**
     * @method setTitle
     * Set the title for this calendar.
     * @param {String} title The title.
     *
     * @abstract
     */
    
    privates: {
        /**
         * @inheritdoc Ext.data.Model#method!onIdChanged
         * @private
         */
        onIdChanged: function(newId, oldId) {
            Ext.calendar.theme.Theme.onIdChanged(newId, oldId);
        }
    }
});