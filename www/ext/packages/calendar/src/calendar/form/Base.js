/**
 * Defines the API used by {@link Ext.calendar.view.Base} for showing
 * forms to add and edit events. A default implementation is provided by
 * {@link Ext.calendar.form.Add} and {@link Ext.calendar.form.Edit}.
 */
Ext.define('Ext.calendar.form.Base', {
    extend: 'Ext.Mixin',

    requires: [
        'Ext.data.ChainedStore'
    ],

    config: {
        /**
         * @cfg {Ext.calendar.model.EventBase} event
         * The data for this form.
         */
        event: null,

        /**
         * @cfg {Ext.calendar.view.Base} view
         * The view form this form.
         */
        view: null
    },

    /**
     * @event cancel
     * Fired when this form is dismissed with no change.
     * @param {Ext.calendar.form.Base} this This form.
     */
    
    /**
     * @event drop
     * Fired when a drop action is taken on this form.
     * @param {Ext.calendar.form.Base} this This form.
     */
    
    /**
     * @event save
     * Fired when a create/edit has been made on this form.
     * @param {Ext.calendar.form.Base} this This form.
     * @param {Object} context The context.
     * @param {Object} context.data The data to be pushed into
     * the model via {@link Ext.calendar.model.EventBase#setData setData}.
     */
    
    /**
     * To be called when a cancel action takes place. Fires the
     * cancel event.
     * @protected
     */
    fireCancel: function() {
        this.fireEvent('cancel', this);
    },

    /**
     * To be called when a drop takes place. Fires the drop
     * event.
     * @protected
     */
    fireDrop: function() {
        this.fireEvent('drop', this);
    },

    /**
     * To be called when a save takes place. Fires the save
     * event.
     * @param {Object} data The form data.
     * @protected
     */
    fireSave: function(data) {
        this.fireEvent('save', this, {
            data: data
        });
    },

    /**
     * Gets a calendar store configuration for use with the calendar picker.
     * Automatically adds a filter to exclude calendars that are not 
     * {@link Ext.calendar.model.CalendarBase#isEditable editable}.
     * @return {Object} The config for the calendar store.
     *
     * @protected
     */
    getCalendarStore: function() {
        return {
            type: 'chained',
            autoDestroy: true,
            source: this.getView().getStore(),
            filters: [{
                filterFn: function(cal) {
                    return cal.isEditable();
                }
            }]
        };
    }
});