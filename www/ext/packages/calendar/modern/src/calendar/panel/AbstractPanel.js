/**
 * A base class for a calendar panel that allows switching between views.
 *
 * @private
 */
Ext.define('Ext.calendar.panel.AbstractPanel', {
    extend: 'Ext.Panel',

    requires: [
        'Ext.layout.Fit',
        'Ext.SegmentedButton',
        'Ext.Toolbar',
        'Ext.Sheet'
    ],

    layout: 'fit',

    config: {
        compactOptions: {
            createButton: {
                xtype: 'button',
                text: null,
                iconCls: Ext.baseCSSPrefix + 'fa fa-plus'
            }
        },

        createButton: {
            ui: 'action'
        },

        /**
         * @cfg {Object} menuButton
         * The configuration for the menu button in {@link #compact} mode.
         */
        menuButton: {
            xtype: 'button',
            iconCls: Ext.baseCSSPrefix + 'fa fa-bars'
        },

        sideBar: {
            docked: 'left',
            autoSize: null,
            ui: 'light'
        },

        /**
         * @cfg {Object} sheet
         * The configuration for the sheet in {@link #compact} mode.
         */
        sheet: {
            xtype: 'sheet',
            reference: 'sheet',
            cls: Ext.baseCSSPrefix + 'calendar-panel-sheet',
            centered: false,
            enter: 'left',
            exit: 'left',
            hideOnMaskTap: true,
            stretchY: true,
            ui: 'light',
            header: {
                border: false,
                title: 'Calendars'
            }
        },

        titleBar: {
            docked: 'top'
        }
    },

    items: [{
        xtype: 'panel',
        reference: 'mainContainer',
        flex: 1,
        layout: 'fit'
    }],

    autoSize: false,

    /**
     * @method getMenuButton
     * @hide
     */

    /**
     * @method setMenuButton
     * @hide
     */

    /**
     * @method getSheet
     * @hide
     */

    /**
     * @method setSheet
     * @hide
     */

    initialize: function() {
        var me = this,
            // This depends on createViews
            defaultView = me.defaultView,
            ct = me.lookup('mainContainer');

        if (!me.getCompact()) {
            me.addSideBar();
        }
        me.addTitleBar();
        ct.add(me.createView());
        me.refreshCalTitle();
        me.callParent();
    },

    // Appliers/Updaters
    updateCompact: function(compact) {
        if (!this.isConfiguring) {
            this.reconfigureItems();
        }
    },

    updateCreateButtonPosition: function() {
        var me = this,
            sheet = me.lookup('sheet'),
            vis;

        if (!me.isConfiguring) {
            vis = sheet && sheet.isVisible();
            me.reconfigureItems();
            if (vis) {
                me.showSheet();
            }
        }
    },

    updateSwitcherPosition: function() {
        var me = this,
            sheet = me.lookup('sheet'),
            vis;

        if (!me.isConfiguring) {
            vis = sheet && sheet.isVisible();
            me.reconfigureItems();
            if (vis) {
                me.showSheet();
            }
        }
    },

    privates: {
        addSideBar: function() {
            var cfg = this.createSideBar();
            if (cfg)  {
                this.add(cfg);
            }
        },

        addTitleBar: function() {
            var me = this,
                cfg = me.getCompact() ? me.createCompactTitleBar() : me.createNormalTitleBar();

            if (cfg) {
                me.lookup('mainContainer').add(cfg);
            }
        },

        createCompactTitleBar: function() {
            var me = this;

            return me.createTitleBar([Ext.apply({
                scope: me,
                handler: 'onMenuButtonTap'
            }, me.getMenuButton()), me.createDateTitle({
                listeners: {
                    element: 'element',
                    scope: me,
                    tap: 'onTodayTap'
                }
            }), {
                xtype: 'component',
                flex: 1
            }, me.createCreateButton()]);
        },

        createNormalTitleBar: function() {
            var me = this,
                items = [];

            if (me.getCreateButtonPosition() === 'titleBar') {
                items.push(me.createCreateButton({
                    margin: '0 10 0 0'
                }));
            }

            items.push(me.createTodayButton(), {
                xtype: 'segmentedbutton',
                allowToggle: false,
                items: [me.createPreviousButton(), me.createNextButton()]
            }, me.createDateTitle());

            if (me.getSwitcherPosition() === 'titleBar') {
                items.push({
                    xtype: 'component',
                    flex: 1
                }, me.createSwitcher());
            }

            return me.createTitleBar(items);
        },

        createTitleBar: function(items) {
            var cfg = this.getTitleBar();
            if (!cfg) {
                return null;
            }

            return this.createContainerWithChildren({
                reference: 'titleBar'
            }, cfg, items);
        },

        createSheet: function() {
            return Ext.apply({
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [
                    this.createCalendarList(),
                    this.createSwitcher({
                        vertical: true
                    })
                ]
            }, this.getSheet());
        },

        createSideBar: function() {
            var me = this,
                cfg = this.getSideBar(),
                items = [];

            if (!cfg) {
                return null;
            }

            if (me.getCreateButtonPosition() === 'sideBar') {
                items.push({
                    xtype: 'container',
                    margin: '0 0 10 0',
                    autoSize: null,
                    layout: {
                        type: 'hbox',
                        pack: 'center'
                    },
                    items: me.createCreateButton()
                });
            }

            items.push(me.createCalendarList());

            if (me.getSwitcherPosition() === 'sideBar') {
                items.push(me.createSwitcher({
                    vertical: true
                }));
            }

            return this.createContainerWithChildren({
                reference: 'sideBar',
                layout: 'vbox'
            }, cfg, items);
        },

        onMenuButtonTap: function() {
            this.showSheet();
        },

        onSwitcherChange: function(btn, value) {
            var sheet = this.lookup('sheet');
            if (sheet && this.getCompact()) {
                sheet.hide();
            }
            this.doSetView(value, true);
        },

        reconfigureItems: function() {
            var me = this;

            Ext.destroy(me.lookup('sheet'), me.lookup('titleBar'), me.lookup('sideBar'));

            me.addTitleBar();
            if (!me.getCompact()) {
                me.addSideBar();
            }
            me.refreshCalTitle();
        },

        setSwitcherValue: function(value) {
            var switcher = this.lookup('switcher');
            if (switcher) {
                switcher.setValue(value);
            } else {
                this.setView(value, true);
            }
        },

        showSheet: function() {
            var me = this,
                sheet = me.lookup('sheet');

            if (!sheet) {
                sheet = me.add(me.createSheet());
            }
            sheet.show();
        }
    }
});