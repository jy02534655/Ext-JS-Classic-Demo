/**
 * A base class for a calendar panel that allows switching between views.
 *
 * @private
 */
Ext.define('Ext.calendar.panel.AbstractPanel', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.layout.container.Border',
        'Ext.button.Segmented',
        'Ext.toolbar.Toolbar'
    ],

    layout: 'border',

    config: {
        createButton: {
            ui: 'default-small'
        },

        sideBar: {
            region: 'west',
            collapsible: true
        }
    },

    items: [{
        xtype: 'panel',
        reference: 'mainContainer',
        region: 'center',
        layout: 'fit'
    }],

    initComponent: function() {
        var me = this,
            ct;

        me.callParent();

        ct = me.lookup('mainContainer');

        me.addSideBar({
            collapsed: me.getCompact()
        });
        me.addTitleBar();
        ct.add(me.createView());
        me.refreshCalTitle();
    },

    onRender: function(parentNode, containerIdx) {
        this.callParent([parentNode, containerIdx]);
        this.body.unselectable();
    },

    // Appliers/Updaters
    updateCompact: function(compact) {
        if (!this.isConfiguring) {
            this.reconfigureItems();
        }
    },

    updateCreateButtonPosition: function() {
        var me = this,
            sheet = me.sheet,
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
            sheet = me.sheet,
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
            if (cfg) {
                this.add(cfg);
            }
        },

        addTitleBar: function() {
            var cfg = this.createTitleBar();
            if (cfg) {
                this.lookup('mainContainer').addDocked(cfg);
            }
        },

        createSideBar: function(cfg) {
            var me = this,
                items = [];

            if (me.getCreateButtonPosition() === 'sideBar') {
                items.push({
                    xtype: 'container',
                    margin: '0 0 10 0',
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

            cfg = Ext.merge({
                reference: 'sideBar',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                }
            }, cfg);

            return this.createContainerWithChildren(cfg, this.getSideBar(), items);
        },

        createTitleBar: function() {
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

            return this.createContainerWithChildren({
                reference: 'titleBar'
            }, this.getTitleBar(), items);
        },

        onSwitcherChange: function(btn, value) {
            this.doSetView(value, true);
        },

        reconfigureItems: function() {
            var me = this;

            Ext.suspendLayouts();
            Ext.destroy(me.lookup('titleBar'), me.lookup('sideBar'));

            me.addTitleBar();
            me.addSideBar({
                collapsed: me.getCompact()
            });
            me.refreshCalTitle();
            Ext.resumeLayouts(true);
        },

        setSwitcherValue: function(value) {
            var switcher = this.lookup('switcher');
            if (switcher) {
                switcher.setValue(value);
            } else {
                this.setView(value, true);
            }
        }
    }
});