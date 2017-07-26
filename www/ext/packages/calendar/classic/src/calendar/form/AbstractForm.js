/**
 * A base implementation of a form for the classic toolkit.
 * @abstract
 */
Ext.define('Ext.calendar.form.AbstractForm', {
    extend: 'Ext.window.Window',

    requires: [
        'Ext.layout.container.Fit',
        'Ext.layout.container.VBox',
        'Ext.layout.container.HBox',
        'Ext.form.Panel',
        'Ext.form.field.Text',
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.field.Checkbox',
        'Ext.calendar.form.CalendarPicker'
    ],

    layout: 'fit',
    modal: true,
    closable: false,
    defaultListenerScope: true,

    config: {
        /**
         * @cfg {Object} calendarField
         * The config for the calendar field.
         */
        calendarField: {
            xtype: 'calendar-calendar-picker',
            fieldLabel: 'Calendar',
            name: 'calendarId',
            forceSelection: true,
            editable: false,
            queryMode: 'local',
            displayField: 'title',
            valueField: 'id'
        },

        /**
         * @cfg {Object} titleField
         * The config for the title field.
         */
        titleField: {
            xtype: 'textfield',
            fieldLabel: 'Title',
            name: 'title',
            allowBlank: false
        },

        /**
         * @cfg {Object} fromContainer
         * The config for the from container.
         */
        fromContainer: {
            xtype: 'fieldcontainer',
            fieldLabel: 'From',
            layout: 'hbox'
        },

        /**
         * @cfg {Object} startDateField
         * The config for the start date field.
         */
        startDateField: {
            xtype: 'datefield',
            itemId: 'startDate',
            name: 'startDate',
            allowBlank: false
        },

        /**
         * @cfg {Object} startTimeField
         * The config for the start time field.
         */
        startTimeField: {
            xtype: 'timefield',
            itemId: 'startTime',
            name: 'startTime',
            margin: '0 0 0 5'
        },

        /**
         * @cfg {Object} toContainer
         * The config for the to container.
         */
        toContainer: {
            xtype: 'fieldcontainer',
            fieldLabel: 'To',
            layout: 'hbox'
        },

        /**
         * @cfg {Object} endDateField
         * The config for the end date field.
         */
        endDateField: {
            xtype: 'datefield',
            itemId: 'endDate',
            name: 'endDate',
            allowBlank: false
        },

        /**
         * @cfg {Object} endTimeField
         * The config for the end time field.
         */
        endTimeField: {
            xtype: 'timefield',
            itemId: 'endTime',
            name: 'endTime',
            margin: '0 0 0 5'
        },

        /**
         * @cfg {Object} allDayField
         * The config for the all day field.
         */
        allDayField: {
            xtype: 'checkbox',
            itemId: 'allDay',
            name: 'allDay',
            boxLabel: 'All Day',
            hideEmptyLabel: false,
            handler: 'onAllDayChange'
        },

        /**
         * @cfg {Object} descriptionField
         * The config for the description field.
         */
        descriptionField: {
            xtype: 'textarea',
            fieldLabel: 'Description',
            name: 'description',
            flex: 1
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

    initComponent: function() {
        var me = this;

        me.initForm();
        me.fbar = me.generateButtons();

        me.callParent();
        me.form = me.items.first();
        me.checkFields();
        me.applyValues();
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
        }, this.getSaveButton(), this.getCancelButton());

        return buttons;
    },

    applyValues: function() {
        this.form.getForm().setValues(this.consumeEventData());
    },

    createItems: function() {
        var me = this,
            calField = me.getCalendarField(),
            fromCt = me.getFromContainer(),
            toCt = me.getToContainer();

        if (!calField.store) {
            calField.store = me.getCalendarStore();
        }

        if (!fromCt.items) {
            fromCt.items = [me.getStartDateField(), me.getStartTimeField()];
        }

        if (!toCt.items) {
            toCt.items = [me.getEndDateField(), me.getEndTimeField()];
        }

        this.items = [{
            xtype: 'form',
            border: false,
            trackResetOnLoad: true,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                calField,
                me.getTitleField(),
                fromCt,
                toCt,
                me.getAllDayField(),
                me.getDescriptionField()
            ]
        }];
    },

    privates: {
        checkFields: function() {
            var checked = this.down('#allDay').checked;
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
            var form = this.form,
                values = form.getForm().getFieldValues();

            if (!form.isValid()) {
                return;
            }

            values.allDay = this.down('#allDay').checked;
            this.fireSave(this.produceEventData(values));
        }
    }
});