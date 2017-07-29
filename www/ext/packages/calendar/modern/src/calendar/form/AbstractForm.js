/**
 * A base implementation of a form for the modern toolkit.
 * @abstract
 */
Ext.define('Ext.calendar.form.AbstractForm', {
    extend: 'Ext.form.Panel',

    requires: [
        'Ext.calendar.form.CalendarPicker',
        'Ext.calendar.form.TimeField',
        'Ext.field.Text',
        'Ext.field.TextArea',
        'Ext.field.DatePicker',
        'Ext.form.FieldSet',
        'Ext.layout.HBox'
    ],

    trackResetOnLoad: true,
    defaultListenerScope: true,

    platformConfig: {
        '!desktop': {
            width: '100%',
            height: '100%',
            layout: 'fit',
            isCompact: true,
            fullscreen: true
        },

        'desktop': {
            modal: true,
            centered: true,
            scrollable: 'y'
        }
    },

    floated: true,

    config: {
        /**
         * @cfg {Object} calendarField
         * The config for the calendar field.
         */
        calendarField: {
            xtype: 'calendar-calendar-picker',
            label: 'Calendar',
            name: 'calendarId',
            displayField: 'title',
            valueField: 'id'
        },

        /**
         * @cfg {Object} titleField
         * The config for the title field.
         */
        titleField: {
            xtype: 'textfield',
            label: 'Title',
            name: 'title'
        },

        /**
         * @cfg {Object} startDateField
         * The config for the start date field.
         */
        startDateField: {
            xtype: 'datepickerfield',
            label: 'From',
            itemId: 'startDate',
            name: 'startDate'
        },

        /**
         * @cfg {Object} startTimeField
         * The config for the start time field.
         */
        startTimeField: {
            xtype: 'calendar-timefield',
            label: '&#160;',
            itemId: 'startTime',
            name: 'startTime'
        },

        /**
         * @cfg {Object} endDateField
         * The config for the end date field.
         */
        endDateField: {
            xtype: 'datepickerfield',
            label: 'To',
            itemId: 'endDate',
            name: 'endDate'
        },

        /**
         * @cfg {Object} endTimeField
         * The config for the end time field.
         */
        endTimeField: {
            xtype: 'calendar-timefield',
            label: '&#160;',
            itemId: 'endTime',
            name: 'endTime'
        },

        /**
         * @cfg {Object} allDayField
         * The config for the all day field.
         */
        allDayField: {
            xtype: 'checkboxfield',
            itemId: 'allDay',
            name: 'allDay',
            label: 'All Day',
            listeners: {
                change: 'onAllDayChange'
            }
        },

        /**
         * @cfg {Object} descriptionField
         * The config for the description field.
         */
        descriptionField: {
            xtype: 'textareafield',
            label: 'Description',
            name: 'description',
            flex: 1,
            minHeight: '6em'
        },

        /**
         * @cfg {Object} dropButton
         * The config for the drop button. `null` to not show this button.
         */
        dropButton: {
            text: 'Delete',
            handler: 'onDropTap'
        },

        /**
         * @cfg {Object} saveButton
         * The config for the save button.
         */
        saveButton: {
            text: 'Save',
            handler: 'onSaveTap'
        },

        /**
         * @cfg {Object} cancelButton
         * The config for the cancel button.
         */
        cancelButton: {
            text: 'Cancel',
            handler: 'onCancelTap'
        }
    },

    initialize: function() {
        var me = this;

        me.initForm();
        me.add({
            xtype: 'toolbar',
            docked: 'bottom',
            items: me.generateButtons()
        });
        me.callParent();
        me.applyValues();
        me.checkFields();
    },

    generateButtons: function() {
        var buttons = [],
            drop = this.getDropButton();

        if (drop) {
            buttons.push(drop);
        }

        buttons.push({
            xtype: 'component',
            flex: 1
        }, this.getCancelButton(), this.getSaveButton());

        return buttons;
    },

    fieldQuery: function() {
        return this.query('[isField][?name]');
    },

    applyValues: function() {
        this.setValues(this.consumeEventData());
    },

    createItems: function() {
        var me = this,
            calField = me.getCalendarField();

        if (!calField.store) {
            calField.store = me.getCalendarStore();
        }

        me.add([{
            xtype: 'fieldset',
            scrollable: me.isCompact ? 'y' : undefined,
            margin: 0,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [
                calField,
                me.getTitleField(),
                me.getStartDateField(),
                me.getStartTimeField(),
                me.getEndDateField(),
                me.getEndTimeField(),
                me.getAllDayField(),
                me.getDescriptionField()
            ]
        }]);
    },

    privates: {
        checkFields: function() {
            var checked = this.down('#allDay').isChecked();
            this.down('#startTime').setDisabled(checked);
            this.down('#endTime').setDisabled(checked);
        },

        onAllDayChange: function() {
            this.checkFields();
        },

        onCancelTap: function() {
            this.fireCancel();
        },

        onDropTap: function() {
            this.fireDrop();
        },

        onSaveTap: function() {
            this.fireSave(this.produceEventData(this.getValues()));
        }
    }
});