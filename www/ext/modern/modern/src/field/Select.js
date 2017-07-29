/**
 * Simple Select field wrapper. Example usage:
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         fullscreen: true,
 *         items: [{
 *             xtype: 'fieldset',
 *             title: 'Select',
 *             items: [{
 *                 xtype: 'selectfield',
 *                 label: 'Choose one',
 *                 options: [{
 *                     text: 'First Option',
 *                     value: 'first'
 *                 }, {
 *                     text: 'Second Option',
 *                     value: 'second'
 *                 }, {
 *                     text: 'Third Option',
 *                     value: 'third'
 *                 }]
 *             }]
 *         }]
 *     });
 */
Ext.define('Ext.field.Select', {
    extend: 'Ext.field.Picker',
    xtype: 'selectfield',

    alternateClassName: 'Ext.form.Select',

    requires: [
        'Ext.Panel',
        'Ext.picker.Picker',
        'Ext.picker.Tablet',
        'Ext.data.Store',
        'Ext.data.StoreManager',
        'Ext.dataview.BoundList'
    ],

    /**
     * @property {Boolean} isSelectField
     * `true` to identify an object as an instance of this class, or a subclass thereof.
     */
    isSelectField: true,

    /**
     * @event change
     * Fires when selection has changed.
     *
     * This includes keystrokes that edit the text (if editable).
     * @param {Ext.field.Select} this
     * @param {Ext.data.Model} newValue The corresponding record for the new value
     * @param {Ext.data.Model} oldValue The corresponding record for the old value
     */

    /**
     * @event select
     * Fires when an option from the drop down list has been selected.
     * @param {Ext.field.Select} this
     * @param {Ext.data.Model} newValue The corresponding record for the new value
     */

    /**
     * @event focus
     * Fires when this field receives input focus. This happens both when you tap on the field and when you focus on the field by using
     * 'next' or 'tab' on a keyboard.
     *
     * Please note that this event is not very reliable on Android. For example, if your Select field is second in your form panel,
     * you cannot use the Next button to get to this select field. This functionality works as expected on iOS.
     * @param {Ext.field.Select} this This field
     * @param {Ext.event.Event} e
     */

    config: {
        /**
         * @cfg {Object|Ext.util.Collection} A {@link Ext.util.Collection} instance, or configuration object
         * used to create the collection of selected records.
         *
         * This is used by the {@link #cfg!picker} as the core of its selection handling, and also as the collection
         * of selected values for this widget.
         *
         * @readonly
         */
        valueCollection: true,

        /**
         * @cfg {String/Number} [valueField=value] The underlying {@link Ext.data.Field#name data value name} to bind to this
         * Select control. If configured as `null`, the {@link #cfg!displayField} is used.
         * @accessor
         */
        valueField: 'value',

        /**
         * @cfg {String/Ext.XTemplate} [itemTpl]
         * An XTemplate definition string (Or an {@link Ext.XTemplate}) which specifies how to display a list
         * item from a record values object. This is automatically generated to display the {@link #cfg!displayField}
         * if not specified.
         */
        itemTpl: false,

        /**
         * @cfg {String/String[]/Ext.XTemplate} [displayTpl]
         * The template to be used to display the selected record inside the text field.
         *
         * If not specified, the {@link #cfg!displayField} is shown in the text field.
         */
        displayTpl: null,

        /**
         * @cfg {String/Number} [displayField=text] The underlying {@link Ext.data.Field#name data value name} to bind to this
         * Select control.  If configured as `null`, the {@link #cfg!valueField} is used.
         *
         * This resolved value is the visibly rendered value of the available selection options.
         * @accessor
         */
        displayField: 'text',

        /**
         * @cfg {Ext.data.Store/Object/String} store The store to provide selection options data.
         * Either a Store instance, configuration object or store ID.
         * @accessor
         */
        store: null,

        /**
         * @cfg {Array} options An array of select options.
         *
         *     [
         *         {text: 'First Option',  value: 'first'},
         *         {text: 'Second Option', value: 'second'},
         *         {text: 'Third Option',  value: 'third'}
         *     ]
         *
         * __Note:__ Option object member names should correspond with defined {@link #valueField valueField} and {@link #displayField displayField} values.
         * This config will be ignored if a {@link #store store} instance is provided.
         * @accessor
         */
        options: null,

        /**
         * @cfg {String} hiddenName Specify a `hiddenName` if you're using the {@link Ext.form.Panel#standardSubmit standardSubmit} option.
         * This name will be used to post the underlying value of the select to the server.
         * @accessor
         */
        hiddenName: null,

        /**
         * @cfg {Boolean} [autoSelect=true]
         * `true` to auto select the first value in the {@link #store} or {@link #options} when they are changed. Only happens when
         * the {@link #value} is set to `null`.
         */
        autoSelect: true,

        /**
         * @cfg {Ext.data.Model} selection
         * @accessor
         * The selected model. `null` if no value exists.
         */
        selection: null,

        /**
         * @cfg {Boolean} autoLoadOnValue
         * This option controls whether to *initially* load the store when a value is set so that
         * the display value can be determined from the appropriate record.
         * The store will only be loaded in a limited set of circumstances:
         * - The store is not currently loading.
         * - The store does not have a pending {@link Ext.data.Store#autoLoad}.
         * - The store has not been loaded before.
         */
        autoLoadOnValue: false,

        /**
         * @cfg {Boolean} forceSelection
         * By default the value must always be the {@link #cfg!valueField} of one of the records in the store.
         * Configure as `false` to allow the value to be set to arbitrary text, and have this component
         * auto create an associated record with the typed value as the {@link #cfg!valueField}.
         *
         * This config is only supported for use in {@link Ext.field.ComboBox} but is defined
         * here (as private) because of its many entanglements with value processing.
         * @private
         * @since 6.5.0
         */
        forceSelection: true,

        /**
         * @cfg {String} [valueNotFoundText]
         * If the value passed to setValue is not found in the store, valueNotFoundText will
         * be displayed as the field text if defined. If this default text is used, it means there
         * is no value set and no validation will occur on this field.
         */
        valueNotFoundText: null,

        /**
         * @cfg {Boolean} selectOnTab
         * Whether the Tab key should select the currently highlighted item.
         */
        selectOnTab: true,

        /**
         * @cfg {Boolean} [multiSelect=false]
         * @hide
         * Configure as `true` to allow selection of multiple items from the picker. This results in each
         * selected item being represented by a "tag" in the combobox's input area.
         */
        multiSelect: null,

        /**
         * @cfg {Boolean} [collapseOnSelect=false]
         * Has no effect if {@link #cfg!multiSelect} is `false`
         *
         * Configure as true to automatically hide the picker after a selection is made.
         */
        collapseOnSelect: null
    },

    editable: false,

    floatedPicker: {
        xtype: 'boundlist',
        infinite: false,
        // BoundListNavigationModel binds to input field
        // Must only be enabled when list is visible
        navigationModel: {
            disabled: true
        },
        scrollToTopOnRefresh: false,
        loadingHeight: 70,
        maxHeight: 300,
        floated: true,
        axisLock: true,
        hideAnimation: null
    },

    edgePicker: {
        xtype: 'picker',
        cover: true
    },

    classCls: Ext.baseCSSPrefix + 'selectfield',

    twoWayBindable: {
        selection: 1
    },

    /**
     * @cfg
     * @inheritdoc
     */
    publishes: {
        selection: 1
    },

    applyValueCollection: function(valueCollection) {
        if (!valueCollection.isCollection) {
            valueCollection = new Ext.util.Collection(valueCollection);
        }

        // Add this ComboBox as an observer immediately so that we are informed of any
        // mutations which occur in this event run.
        // We must sync the selection property and the rawValue upon mutation.
        valueCollection.addObserver(this);

        return valueCollection;
    },

    /**
     * This method is called to create a temporary record when the value entered does not
     * match a record in the `store` (when {@link #cfg!forceSelection} is `false`).
     *
     * The `data` object passed contains the typed value in both the {@link #cfg!valueField}
     * and the {@link #cfg!displayField}.
     *
     * The record created and returned from this method will be the {@link #cfg!selection}
     * value in this non-matching state.
     *
     * @param data The data object used to create the new record.
     * @return {Ext.data.Model} The new record.
     * @template
     * @since 6.5.1
     */
    createSelectionRecord: function (data) {
        var Model = this.getStore().getModel();

        return new Model(data);
    },

    completeEdit: Ext.emptyFn,

    /**
     * @private
     */
    maybeCollapse: function(event) {
        var record = event.to && event.to.record,
            multi = this.getMultiSelect(),
            selection = this.getSelection();

        if (!multi && record === selection) {
            this.collapse();
        }
    },

    /**
     * @private
     * Respond to deselection. Call the onItemDeselect template method
     */
    onCollectionRemove: function(valueCollection, chunk) {
        var selection = valueCollection.getRange();

        // If this remove is part of a splice, wait until the collection add to sync the selection.
        if (!chunk.replacement) {
            // Must ensure that null is passed if the valueCollection is empty
            this.setSelection(selection.length ? (this.getMultiSelect() ? selection : selection[0]) : null);
        }
    },

    /**
     * @private
     * Respond to selection. Call the onItemSelect template method
     */
    onCollectionAdd: function(valueCollection, adds) {
        var selection = valueCollection.getRange();

        this.setSelection(this.getMultiSelect() ? selection : selection[0]);
    },

    clearValue: function () {
        // We clear things differently vs superclass. The value of Select fields depends
        // upon the value collection.
        this.setValue(null);

        this.syncEmptyState();
    },

    /* TODO fixup these docs and move to value config
     * Sets the value of the field.
     * @param {Mixed/Ext.data.Model} newValue The new value. This may be specified as either
     * an existing store record, or the required {@link #cfg!valueField} value.
     *
     * Either way, both {@link #cfg!valueField} value *and* the associated record will be ascertained.
     *
     * The {@link #cfg!valueField} value is published to the ViewModel as is the {@link #cfg-selection associated record}.
     *
     * The record published to the selection property will be `null` if the value did not
     * match a record, and the field is not configured to create new records for unmatched
     * values using `{@link #cfg!forceSelection}: false`
     */

    applyValue: function(value, oldValue) {
        // Ensure that a store is formed from any options before we get the store.
        this.getOptions();

        var me = this,
            autoLoadOnValue = me.getAutoLoadOnValue(),
            valueField = me.getValueField(),
            displayField = me.getDisplayField(),
            store = me.getStore(),
            record, isLoaded, pendingLoad, needsLoad, dataObj, notFoundText;

        // We were passed a record.
        // Set the selection which updates the value from the valueField.
        if (value && value.isEntity) {
            me.setSelection(value);
            return;
        }
        // A non-empty value has to be matched to the valueField of a record
        else if (value != null) {
            if (store) {
                // Stores can be programatically populated without going through a load.
                // And they can have loaded and still have zero records.
                isLoaded = store.getCount() > 0 || store.isLoaded();

                // If it turns out that we need to kick off a load, we don't need to bother is this is true
                pendingLoad = store.hasPendingLoad();

                // If we are configured to autoLoad when the value arrives, prepare to do so
                needsLoad = autoLoadOnValue && !isLoaded && !pendingLoad;
            }

            if (me.isConfiguring) {
                me.originalValue = value;
            }
            // Find the value in the store.
            // *or in the valueCollection which may contain the new records enabled
            // by setValue being passed a record, or by forceSelection: false, or
            // createNewOnEnter or createNewOnTab*
            // The method may be overridden in subclasses to also search
            // in the valueCollection.
            record = me.findRecordByValue(value);

            // record was not found
            if (!record) {
                if (isLoaded && !me.getForceSelection()) {
                    // user has typed in something that isn't in the store
                    dataObj = {};
                    dataObj[displayField] = value;

                    if (valueField && displayField !== valueField) {
                        dataObj[valueField] = value;
                    }

                    record = me.createSelectionRecord(dataObj);
                    
                    // mark record as entered text vs. an existing one from the store
                    record.isEntered = true;
                }
                // If the store has not yet arrived from a bind flush
                //  or, it has not yet been loaded then we need to cache
                //  the value and apply it on store load.
                // The onStoreLoad will push the cachedValue through setValue.
                else {
                    me.cachedValue = value;
                }
            } else if (store && me.getForceSelection() && store.indexOf(record) === -1) {
                record = null;
                value = null;
            }
        }

        // Kick off a load unless we are clearing the value.
        // Doesn't matter whether proxy is remote - it needs loading
        // so we can select the correct record for the value in the load event handler.
        if (value && needsLoad) {
            store.load();
        }

        // If we have a record, set the value property, so that our set of the selection
        // does not recurse.
        if (record && !record.isEntered) {
            me._value = value;
            me.setSelection(record);
        } else if (me.getForceSelection()) {
            me._value = null;
            me.setSelection(null);
            // If we could not match the value, update the valueNotFOund text
            notFoundText = me.getValueNotFoundText();
            if (notFoundText) {
                me.inputElement.dom.value = notFoundText;
            }
        } else {
            me._value = value = me.transformValue(value);

            // In !forceSelection mode when we have a value that does not match a record
            // we do not report the temporary record as the selection. But we also need
            // to prevent the updateSelection process from zapping the value.
            me._ignoreSelection = true;
            // We must go through the "front door" and clear our value collection
            // while not disturbing the selection config.
            me.getValueCollection().removeAll();
            me._ignoreSelection = false;

            me.setFieldDisplay(record);
        }

        // Because we set the value property in here before setting the selection in order
        // to prevent infinite recursion, and return undefined, the config's setter will
        // not invoke the updater.
        // We have to invoke our updater directly if the value has changed.
        if (value !== oldValue) {
            me.updateValue(value, oldValue);
        }
    },

    updateValue: function(value, oldValue) {
        // Note that we must not invoke superclass updateValue because that updates the
        // field UI in ways that SelectFields cannot handle.
        // We must directly invoke the base class's updateValue. That fires the change
        // event and validates the value which we still need to happen.
        Ext.field.Field.prototype.updateValue.call(this, value, oldValue);
    },

    /**
     * Finds the record in the {@link #cfg!store}, or the {@link #cfg!valueCollection} which has the {@link #cfg!valueField}
     * matching the passed value.
     *
     * The {@link #cfg!valueCollection} is included because of the {@link #cfg!createNewOnEnter},
     * {@link #cfg!createNewOnBlur}, and {@link #cfg!forceSelection} configs which allow for insertion into the
     * {@link #cfg!valueCollection} of newly created records which are not in the configured {@link #cfg!store}.
     *
     * Also, a currently selected value may be filtered out of visibility in the configured {@link #cfg!store}
     *
     * @param {String} value The value to match the {@link #valueField} against.
     * @return {Ext.data.Model} The matched record or null.
     */
    findRecordByValue: function(value) {
        var me = this,
            store = me.getStore(),
            valueField = me.getValueField(),
            result,
            ret = null;

        if (store) {
            result = store.byValue.get(value);

            // If there are duplicate keys, tested behaviour is to return the *first* match.
            if (result) {
                ret = result[0] || result;
            }
        }

        // Not found in the base store.
        // See if there's a match in the valueCollection.
        // This is because we allow new records to be created if forceSelection is false
        // And we allow value to be set to a record which is then inserted into the valueCollection.
        if (!ret) {
            ret = me.getValueCollection().findBy(function(record) {
                return record.get(valueField) === value;
            });
        }
        return ret;
    },

    /**
     * Finds the record by searching values in the {@link #displayField}.
     * @param {Object} value The value to match the field against.
     * @return {Ext.data.Model/false} The matched record or `false`.
     */
    findRecordByDisplay: function(value) {
        var store = this.getStore(),
            result,
            ret = false;

        if (store) {
            result = store.byText.get(value);
            // If there are duplicate keys, tested behaviour is to return the *first* match.
            if (result) {
                ret = result[0] || result;
            }
        }
        return ret;
    },

    applySelection: function(selection, oldSelection) {
        var multiValues = selection && this.getMultiSelect();

        selection = multiValues ? Ext.Array.from(selection) : selection;

        if (multiValues ? (!oldSelection || !Ext.Array.equals(selection, oldSelection)) : selection !== oldSelection) {
            return selection || null;
        }
    },

    /**
     * @private
     * Updates the fields input UI according to the current selection.
     * In the case of single selection, simply updates the input field's value.
     *
     * For multiSelection, a more complex input UI is needed.
     * @param selection
     */
    setFieldDisplay: function(selection) {
        var me = this,
            inputValue = '',
            displayTpl;

        if (me.getMultiSelect()) {
            //<debug>
            Ext.raise('multiselect is not yet supported');
            //</debug>
        }
        else {
            if (selection) {
                displayTpl = me.getDisplayTpl();
                if (displayTpl) {
                    inputValue = displayTpl.apply(me.getRecordDisplayData(selection));
                } else {
                    inputValue = selection.get(me.getDisplayField());
                }
            }
            me.setInputValue(inputValue);
        }
    },

    /**
     * @private
     * Update the UI to reflect the new selection. The selection arrives as mutation notifications
     * from the {@link #cfg!valueCollection} which is the {@link Ext.util.Collection} at the heart
     * of the picker's {@link Ext.mixin.Selectable} persona.
     */
    updateSelection: function(selection, oldSelection) {
        if (this._ignoreSelection) {
            return;
        }

        var me = this,
            multiSelect = me.getMultiSelect(),
            valueCollection = me.getValueCollection(),
            isNull = selection == null,
            spliceArgs = [0, valueCollection.getCount()],
            valueField = me.getValueField(),
            displayField = me.getDisplayField(),
            // Only get the picker if it has been created.
            picker = me.getConfig('picker', false, true);

        if (isNull || !valueCollection.contains(selection)) {
            if (!isNull) {
                // Ext.Array.push uses .call/.apply to push either
                // the passed single value, *or* the passed array.
                Ext.Array.push(spliceArgs, selection);
            }
            // Replace all valueCollection content with the new selection.
            // We are an observer of the valueCollection.
            //
            // This will feed through to our onCollectionRemove, which will only
            // push through to the selection property if there's no upcoming add.
            //
            // If there's an add, then our onCollectionAdd will be called
            // which will push the valueCollection's data through to
            // our selection property.
            valueCollection.splice.apply(valueCollection, spliceArgs);
        }

        if (!me.destroyed && !me.destroying && valueField) {
            if (selection) {
                if (!selection.isEntered) {
                    me.setValue(selection.get(valueField));

                    if (me.fireEvent('select', me, selection) === false) {
                        me.setValue(null);
                        selection = null;
                    }

                    if (me.destroyed) {
                        return;
                    }
                }
            }
            else {
                me.clearValue();
            }
        }

        // Update the field's input UI.
        // Note that this may be a DOM <input> value, but may also
        // be a UI like a TagField which is produced from the
        // selected record(s)
        me.setFieldDisplay(selection);

        // If the picker has been created, either collapse it,
        // or scroll to the latest selection.
        if (picker && picker.isVisible()) {
            if (!multiSelect || me.getCollapseOnSelect() || !me.getStore().getCount()) {

                // The setter's equality test cannot tell if the single selected record
                // is in effect unchanged. We only need to collapse if a *new* value has
                // been set, that is, the user has selected a record with a different id.
                // We can get here when the selection is refreshed due to record add/remove
                // when the record *instance* is renewed, but it is the same id.
                // In that case, all we need is a refresh of the data in case the record's
                // data payload changed.
                //
                // If unchanged, it's possible that other data in the record may have changed
                // which could affect the BoundList, so refresh that
                if (!multiSelect && selection && oldSelection && selection.id === oldSelection.id) {
                    picker.refresh();
                } else {
                    me.collapse();
                }
            }

            // If picker is visible, keep the navigated-to location synced
            if (picker.isVisible()) {
                me.setPickerLocation();
            }
        }
    },

    /**
     * Gets data for each record to be used for constructing the display value with
     * the {@link #displayTpl}. This may be overridden to provide access to associated records.
     * @param {Ext.data.Model} record The record.
     * @return {Object} The data to be passed for each record to the {@link #displayTpl}.
     *
     * @protected
     * @template
     */
    getRecordDisplayData: function(record) {
        return record.getData();
    },

    createFloatedPicker: function() {
        var me = this,
            multiSelect = me.getMultiSelect(),
            result = Ext.merge({
                ownerCmp: me,
                store: me.getStore(),
                selectable: {
                    selected: me.getValueCollection(),
                    selectedRecord: me.getSelection(),
                    deselectable: !!multiSelect,
                    mode: multiSelect ? 'multi' : 'single'
                },
                itemTpl: me.getItemTpl()
            }, me.getFloatedPicker());

        // Allow SPACE to navigate unless it's needed
        // to edit the inputElement.
        result.navigationModel.navigateOnSpace = !me.getEditable();

        return result;
    },

    createEdgePicker: function() {
        var me = this;

        return Ext.merge({
            ownerCmp: me,
            slots: [{
                align: me.getPickerSlotAlign(),
                name: me.getValueField(),
                valueField: me.getValueField(),
                displayField: me.getDisplayField(),
                value: me.getValue(),
                store: me.getStore()
            }],
            listeners: {
                change: me.onPickerChange,
                scope: me
            },
            setStore: function(store) {
                this.child('pickerslot').setStore(store);
            },
            deselectAll: function() {
                this.child('pickerslot').deselectAll();
            }
        }, me.getEdgePicker());
    },

    setPickerLocation: function() {
        var me = this,
            picker = me.getConfig('picker', false, true),
            selection = me.getSelection(),
            store;

        if (picker && me.expanded) {
            store = me.getStore();

            if (store && store.getCount() > 0) {
                if (me.pickerType === 'floated') {
                    picker.getNavigationModel().setLocation(selection, {
                        select: true
                    });
                } else {
                    this.updatePickerValue(picker);
                }
            }
        }
    },

    updatePickerValue: function (picker, value) {
        var name = this.getValueField(),
            pickerValue = {};

        if (!value) {
            value = this.getValue();
        }

        pickerValue[name] = value;

        picker.setValue(pickerValue);
    },

    onPickerShow: function(picker) {
        this.callParent([picker]);

        // Enable the picker's key mappings in this field's KeyMap,
        // unless it's an edge picker that doesn't support keyboard
        if (this.pickerType === 'floated') {
            picker.getNavigationModel().enable();
        }
    },

    onPickerHide: function(picker) {
        var navModel;
        
        this.callParent([picker]);

        // Set the location to null because there's no onFocusLeave
        // to do this because the picker does not get focused.
        // Disable the picker's key mappings in this field's KeyMap
        if (!picker.destroying && this.pickerType === 'floated') {
            navModel = picker.getNavigationModel();

            navModel.setLocation(null);
            navModel.disable();
        }
    },

    /**
     * @private
     * Used when the edge picker is used.
     */
    onPickerChange: function(picker, value) {
        this.setValue(this.findRecordByValue(value[this.getValueField()]));
    },

    applyItemTpl: function (itemTpl) {
        if (itemTpl === false) {
            itemTpl = '<span class="x-list-label">{' + this.getDisplayField() + ':htmlEncode}</span>';
        }
        return itemTpl;
    },

    applyDisplayTpl: function (displayTpl) {
        if (displayTpl && !displayTpl.isTemplate) {
            displayTpl = new Ext.XTemplate(displayTpl);
        }
        return displayTpl;
    },

    applyOptions: function(options) {
        if (options) {
            var len = options.length,
                valueField = this.getValueField(),
                displayField = this.getDisplayField(),
                i, value, option;

            // Convert an array of primitives to record data objects
            options = Ext.Array.slice(options);
            for (i = 0; i < len; i++) {
                value = options[i];
                if (Ext.isPrimitive(value)) {
                    options[i] = option = {};
                    option[valueField] = value;
                    if (displayField && displayField !== valueField) {
                        option[displayField] = value;
                    }
                }
            }
        }
        return options;
    },

    /**
     * Updates the underlying `<options>` list with new values.
     *
     * @param {Array} newOptions An array of options configurations to insert or append.
     *
     *     selectBox.setOptions([
     *         {text: 'First Option',  value: 'first'},
     *         {text: 'Second Option', value: 'second'},
     *         {text: 'Third Option',  value: 'third'}
     *     ]).setValue('third');
     *
     * __Note:__ option object member names should correspond with defined {@link #valueField valueField} and
     * {@link #displayField displayField} values.
     *
     * @return {Ext.field.Select} this
     */
    updateOptions: function(newOptions) {
        if (newOptions) {

            // *peek* at the store. Do not cause the config to be processed.
            // The options data must be available to onStoreUpdate if we in fact
            // have to pull the configuration through updateStore.
            var me = this,
                store = me.getConfig('store', true);

            // We already had a store. Just update it
            if (store && store.isStore) {
                store.setData(newOptions);
                me.onStoreDataChanged(store);
                me.setOptions(null);
            }
            // Pull any configured store through updateStore which will
            // load it with the options data.
            else {
                store = me.getStore();
                me.setOptions(null);

                // If we had a store, it will have picked up the optionsData and added them.
                // If not, we create it here.
                if (!store) {
                    me.setStore({
                        fields: [me.getValueField(), me.getDisplayField()],
                        autoDestroy: true,
                        data: newOptions
                    });
                }
            }
        }
    },

    applyStore: function(store) {
        if (store) {
            store = Ext.data.StoreManager.lookup(store);
        }

        return store;
    },

    updateStore: function(store, oldStore) {
        var me = this,
            picker = me.getConfig('picker', false, true),
            valueField = me.getValueField(),
            displayField = me.getDisplayField(),
            optionsData = me.getOptions(),
            extraKeySpec;

        if (oldStore) {
            if (oldStore.getAutoDestroy()) {
                oldStore.destroy();
            } else {
                oldStore.byValue = oldStore.byText = Ext.destroy(oldStore.byValue, oldStore.byText);
            }
        }

        if (store) {
            // Add a byValue index to the store so that we can efficiently look up records by the value field
            // when setValue passes string value(s).
            // The two indices (Ext.util.CollectionKeys) are configured unique: false, so that if duplicate keys
            // are found, they are all returned by the get call.
            // This is so that findByText and findByValue are able to return the *FIRST* matching value. By default,
            // if unique is true, CollectionKey keeps the *last* matching value.
            extraKeySpec = {
                byValue: {
                    rootProperty: 'data',
                    unique: false,
                    property: valueField
                }
            };
            if (displayField !== valueField) {
                extraKeySpec.byText = {
                    rootProperty: 'data',
                    unique: false,
                    property: displayField
                };
            }
            store.setExtraKeys(extraKeySpec);

            // If display and value fields are the same, the same index goes by both names.
            if (displayField === valueField) {
                store.byText = store.byValue;
            }

            store.on({
                scope: this,
                add: 'onStoreDataChanged',
                filterchange: 'onStoreDataChanged',
                remove: 'onStoreDataChanged',
                update: 'onStoreRecordUpdated',

                // Must be informed after list, and selection has been updated
                load: {
                    fn: 'onStoreLoad',
                    priority: -1
                }
            });

            // Add options from the last setOptions call.
            if (optionsData) {
                store.setData(optionsData);
            }

            // If the store is already loaded, fix up any value we may have.
            // cachedValue will be set if there was no store at init time.
            // If we had a selected record, rematch it.
            // Otherwise auto select first record if configured to do so.
            if (store.getCount()) {
                // cachedValue could be 0 or false
                if (me.cachedValue != null) {
                    me.onStoreLoad(store);
                }
                // If we don't have a value, and we are not going to receive a value from
                // binding and we are autoSelect: true, autoSelect the first record.
                else if (!(me.getValue() != null || me.getSelection() || me.isBound('value') || me.isBound('selection')) && me.getAutoSelect()) {
                    me.setSelection(store.getAt(0));
                }
            }
            // If not loaded, and there's a value waiting to be matched
            // and we should autoload on value, load the store and onStoreLoad
            // will match it up.
            else if (me.cachedValue != null && me.getAutoLoadOnValue() && !store.isLoaded() && !store.hasPendingLoad()) {
                store.load();
            }
        }

        if (picker) {
            picker.setStore(store);
        }
    },

    applyValueField: function(valueField) {
        // If either valueField or displayField are configured as null, then
        // this Select component uses the remaining configured field name for both purposes.
        if (valueField == null) {
            valueField = this.getDisplayField();
        }
        return valueField;
    },

    updateValueField: function(valueField) {
        var store = this.getStore();

        // Keep the byValue index synced
        if (store && !this.isConfiguring) {
            store.byValue.setCollection(null);
            store.setExtraKeys({
                byValue: {
                    rootProperty: 'data',
                    unique: false,
                    property: valueField
                }
            });
        }
    },

    applyDisplayField: function(displayField) {
        // If either valueField or displayField are configured as null, then
        // this Select component uses the remaining configured field name for both purposes.
        if (displayField == null) {
            displayField = this.getValueField();
        }
        return displayField;
    },

    updateDisplayField: function(displayField) {
        var store = this.getStore();

        // Keep the byValue index synced
        if (store && !this.isConfiguring) {
            store.byText.setCollection(null);
            store.setExtraKeys({
                byText: {
                    rootProperty: 'data',
                    unique: false,
                    property: displayField
                }
            });
        }
    },

    /**
     * @private
     * Whenever the store loads, we need to refresh the selection by pushing a value through
     * the setValue machinery. Upon initialization, there may be a cached initial value.
     * Otherwise use the current value.
     */
    onStoreLoad: function(store) {
        var me = this;

        // cachedValue could be 0 or false
        me.setValue(me.cachedValue == null ? me.getValue() : me.cachedValue);
        me.cachedValue = null;
    },

    /**
     * @private
     * Called when the internal {@link #store}'s data has changed.
     */
    onStoreDataChanged: function () {
        if (this.getForceSelection()) {
            var value = this.getValue();

            // Push the textual value from the selected record through applyValue
            // to match with a new record from the new data.
            if (value != null) {
                this.setValue(value);
            }
        }
    },

    /**
     * @private
     * Called when a internal {@link #store}'s record has been mutated.
     * Keep the field UI synced
     */
    onStoreRecordUpdated: function(store, record) {
        if (this.getValueCollection().contains(record)) {
            this.updateSelection(this.getSelection());
        }
    },

    /**
     * Resets the Select field to the value of the first record in the store.
     * @return {Ext.field.Select} this
     * @chainable
     */
    reset: function() {
        var me = this,
            picker = me.getConfig('picker', false, true),
            record = me.originalValue || null,
            store;

        if (me.getAutoSelect()) {
            store = me.getStore();
            record = (record != null) ? record : store && store.getAt(0);
        } else {
            if (picker) {
                picker.deselectAll();
            }
        }

        me.setValue(record);
        return me;
    },

    doDestroy: function() {
        var store = this.getStore();

        if (store && !store.destroyed && store.getAutoDestroy()) {
            store.destroy();
        }

        this.callParent();
    }
});
