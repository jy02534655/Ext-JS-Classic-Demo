/**
 * A drag proxy for week style events.
 */
Ext.define('Ext.calendar.dd.WeeksProxy', {
    extend: 'Ext.drag.proxy.Placeholder',
    alias: 'drag.proxy.calendar-weeks',

    config: {
        /**
         * @cfg {String/Ext.XTemplate} titleTpl
         * The title to be used while dragging. Values passed:
         * - `model` - The event model.
         * - `title` - The current title.
         * - `days` - The number of days spanned.
         * @locale
         */
        titleTpl: '<tpl if="days &gt; 1">' +
                      '({days} days) ' +
                   '</tpl>' +
                   '{title}',

        width: null
    },

    draggingCls: Ext.baseCSSPrefix + 'calendar-event-dragging',

    // Appliers/Updaters
    applyTitleTpl: function(titleTpl) {
        if (titleTpl && !titleTpl.isXTemplate) {
            titleTpl = new Ext.XTemplate(titleTpl);
        }
        return titleTpl;
    },

    getElement: function(info) {
        var me = this,
            view = info.view,
            clone = info.widget.cloneForProxy(),
            el = clone.element;

        clone.removeCls(view.$staticEventCls);
        clone.addCls(me.draggingCls);
        clone.addCls(me.placeholderCls);
        view.element.appendChild(el);
        clone.setWidth(me.getWidth());
        me.setTitle(clone);
        me.clone = clone;
        return el;
    },

    cleanup: function() {
        this.clone = Ext.destroy(this.clone);
        this.callParent();
    },

    privates: {
        setTitle: function(clone) {
            var titleTpl = this.getTitleTpl(),
                model;

            if (titleTpl) {
                model = clone.getModel();
                clone.setTitle(titleTpl.apply({
                    model: model,
                    title: clone.getTitle(),
                    days: this.getSource().getView().getEventDaysSpanned(model)
                }));
            }
        }
    }
});
