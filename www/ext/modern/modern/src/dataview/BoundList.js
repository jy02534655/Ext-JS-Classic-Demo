/**
 * @private
 * Class used to display popup selection lists bound to fields.
 *
 * A BoundList is not focusable, has no `focusEl`, and has no `tabIndex` stamped into it.
 *
 * Its keyboard events are provided by its owning field, referenced by its `ownerCmp`, and
 * the `BoundListNavigationModel` uses the field as the key event source.
 */
Ext.define('Ext.dataview.BoundList', {
    extend: 'Ext.dataview.List',
    xtype: 'boundlist',
    requires: [
        'Ext.dataview.BoundListNavigationModel'
    ],

    tabIndex: null,
    focusEl: null,
    itemsFocusable: false,
    navigationModel: {
        type: 'boundlist'
    },
    /**
     * @cfg {'tap'} triggerEvent
     * @hide
     * BoundLists always use tap. This is ignored.
     */
    onFocusEnter: Ext.emptyFn,
    onFocusLeave: Ext.emptyFn
});