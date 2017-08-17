//自定义按钮
//点击按钮显示一个弹出
//注：需要实现createPicker方法
Ext.define('ux.button.Picker', {
    extend: 'Ext.button.Button',
    xtype: 'buttonPicker',
    /**
     * @cfg {String} pickerAlign
     * The {@link Ext.util.Positionable#alignTo alignment position} with which to align the picker. Defaults to "t-b?"
     */
    pickerAlign: 't-b?',

    /**
     * @cfg {Number[]} pickerOffset
     * An offset [x,y] to use in addition to the {@link #pickerAlign} when positioning the picker.
     * Defaults to undefined.
     */

    /**
     * @cfg {String} [openCls='x-pickerfield-open']
     * A class to be added to the field's {@link #bodyEl} element when the picker is opened.
     */
    openCls: Ext.baseCSSPrefix + 'pickerfield-open',

    /**
     * @property {Boolean} isExpanded
     * True if the picker is currently expanded, false if not.
     */
    isExpanded: false,

    /**
     * @event expand
     * Fires when the field's picker is expanded.
     * @param {Ext.form.field.Picker} field This field instance
     */

    /**
     * @event collapse
     * Fires when the field's picker is collapsed.
     * @param {Ext.form.field.Picker} field This field instance
     */

    //监听点击事件
    initComponent: function () {
        var me = this;
        me.on('click', me.onTriggerClick, me);
        me.callParent(arguments);
    },

    /**
     * 显示弹窗
     */
    expand: function () {
        var me = this,
        ariaDom, picker, doc;
        if (me.rendered && !me.isExpanded && !me.destroyed) {
            picker = me.getPicker();
            doc = Ext.getDoc();
            //设置最大高度
            picker.setMaxHeight(picker.initialConfig.maxHeight);

            // 显示弹窗
            picker.show();
            me.isExpanded = true;
            me.alignPicker();
            me.addCls(me.openCls);

            if (me.ariaRole) {
                ariaDom = me.ariaEl.dom;

                ariaDom.setAttribute('aria-owns', picker.listEl ? picker.listEl.id : picker.el.id);
                ariaDom.setAttribute('aria-expanded', true);
            }

            // Collapse on touch outside this component tree.
            // Because touch platforms do not focus document.body on touch
            // so no focusleave would occur to trigger a collapse.
            me.touchListeners = doc.on({
                // Do not translate on non-touch platforms.
                // mousedown will blur the field.
                translate: false,
                touchstart: me.collapseIf,
                scope: me,
                delegated: false,
                destroyable: true
            });

            // Scrolling of anything which causes this field to move should collapse
            me.scrollListeners = Ext.on({
                scroll: me.onGlobalScroll,
                scope: me,
                destroyable: true
            });

            // Buffer is used to allow any layouts to complete before we align
            Ext.on('resize', me.alignPicker, me, {
                buffer: 1
            });
            me.fireEvent('expand', me);
            me.onExpand();
        }
    },

    onExpand: Ext.emptyFn,

    /**
     * 对齐弹窗
     * @protected
     */
    alignPicker: function () {
        if (!this.destroyed) {
            var picker = this.getPicker();
            if (picker.isVisible() && picker.isFloating()) {
                this.doAlign();
            }
        }
    },

    /**
     * 对齐弹窗
     * @private
     */
    doAlign: function () {
        var me = this,
        picker = me.picker,
        aboveSfx = '-above',
        isAbove;

        // 对齐弹窗防止偏移
        me.picker.el.alignTo(me, me.pickerAlign, me.pickerOffset);
        // add the {openCls}-above class if the picker was aligned above
        // the field due to hitting the bottom of the viewport
        isAbove = picker.el.getY() < me.getY();
        me[isAbove ? 'addCls' : 'removeCls'](me.openCls + aboveSfx);
        picker[isAbove ? 'addCls' : 'removeCls'](picker.baseCls + aboveSfx);
    },

    /**
     * 隐藏弹窗
     */
    collapse: function () {
        var me = this;
        if (me.isExpanded && !me.destroyed && !me.destroying) {
            var openCls = me.openCls,
            picker = me.picker,
            aboveSfx = '-above';

            // hide the picker and set isExpanded flag
            picker.hide();
            me.isExpanded = false;

            // remove the openCls
            me.removeCls([openCls, openCls + aboveSfx]);
            picker.el.removeCls(picker.baseCls + aboveSfx);

            if (me.ariaRole) {
                me.ariaEl.dom.setAttribute('aria-expanded', false);
            }

            // remove event listeners
            me.touchListeners.destroy();
            me.scrollListeners.destroy();
            Ext.un('resize', me.alignPicker, me);
            me.fireEvent('collapse', me);
            me.onCollapse();
        }
    },

    onCollapse: Ext.emptyFn,

    /**
     * @private
     * Runs on touchstart of doc to check to see if we should collapse the picker.
     */
    collapseIf: function (e) {
        var me = this;

        // If what was mousedowned on is outside of this Field, and is not focusable, then collapse.
        // If it is focusable, this Field will blur and collapse anyway.
        if (!me.destroyed && !e.within(me.bodyEl, false, true) && !me.owns(e.target) && !Ext.fly(e.target).isFocusable()) {
            me.collapse();
        }
    },

    /**
     * Returns a reference to the picker component for this field, creating it if necessary by
     * calling {@link #createPicker}.
     * @return {Ext.Component} The picker component
     */
    getPicker: function () {
        var me = this,
        picker = me.picker;

        if (!picker) {
            me.creatingPicker = true;
            me.picker = picker = me.createPicker();
            // For upward component searches.
            picker.ownerCmp = me;
            delete me.creatingPicker;
        }
        return me.picker;
    },

    // When focus leaves the picker component, if it's to outside of this
    // Component's hierarchy
    onFocusLeave: function (e) {
        this.collapse();
        this.callParent([e]);
    },

    /**
     * @method
     * Creates and returns the component to be used as this field's picker. Must be implemented by subclasses of Picker.
     */
    createPicker: Ext.emptyFn,
    /**
     * Handles the trigger click; by default toggles between expanding and collapsing the picker component.
     * @protected
     */
    onTriggerClick: function (e) {
        var me = this;
        if (!me.readOnly && !me.disabled) {
            if (me.isExpanded) {
                me.collapse();
            } else {
                me.expand();
            }
        }
    },

    beforeDestroy: function () {
        var me = this,
        picker = me.picker;

        me.callParent();
        Ext.un('resize', me.alignPicker, me);
        Ext.destroy(me.keyNav, picker);
        if (picker) {
            me.picker = picker.pickerField = null;
        }
    },

    privates: {
        onGlobalScroll: function (scroller) {
            // Collapse if the scroll is anywhere but inside the picker
            if (!this.picker.owns(scroller.getElement())) {
                this.collapse();
            }
        }
    }
});