/**
 * A base class for displaying a set of days/dates as a horizontal header.
 *
 * @abstract
 */
Ext.define('Ext.calendar.header.Base', {
    extend: 'Ext.Gadget',

    mixins: ['Ext.mixin.ConfigState'],
    alternateStateConfig: 'compactOptions',

    config: {
        /**
         * @cfg {String} cellCls
         * A class to add to each day cell.
         */
        cellCls: '',

        /**
         * @cfg {Boolean} compact
         * `true` to display this view in compact mode, typically used
         * for smaller form factors.
         */
        compact: false,

        /**
         * @cfg {Object} compactOptions
         * A series of config options for this class to set when this class is in
         * {@link #compact} mode.
         */
        compactOptions: null,

        /**
         * @cfg {String} format
         * The format to display the day in the header.
         */
        format: '',

        /**
         * @cfg {Date} value
         * The starting value to display.
         */
        value: null,

        /**
         * @cfg {Number} visibleDays
         * The number of days to display, starting from the {@link #value}.
         */
        visibleDays: null
    },

    baseCls: Ext.baseCSSPrefix + 'calendar-header',

    constructor: function(config) {
        this.callParent([config]);
        this.redrawCells();
    },

    // Appliers/Updaters
    updateCompact: function(compact) {
        var me = this,
            baseCls = me.baseCls;

        me.element.toggleCls(baseCls + '-compact', compact);
        me.element.toggleCls(baseCls + '-large', !compact);

        me.toggleConfigState(compact);
    },

    updateCompactOptions: function() {
        if (!this.isConfiguring && this.getCompact()) {
            this.toggleConfigState();
        }
    },

    updateFormat: function() {
        if (!this.isConfiguring) {
            this.setHeaderText(true);
        }
    },

    applyValue: function(value, oldValue) {
        if (value && oldValue && value - oldValue === 0) {
            value = undefined;
        }
        return value;
    },

    updateValue: function() {
        if (!this.isConfiguring) {
            this.setHeaderText();
        }
    },

    updateVisibleDays: function() {
        if (!this.isConfiguring) {
            this.redrawCells();
        }
    },

    getElementConfig: function() {
        return {
            tag: 'table',
            cls: this.$tableCls,
            reference: 'element',
            children: [{
                tag: 'tbody',
                children: [{
                    tag: 'tr',
                    reference: 'row'
                }]
            }]
        };
    },

    privates: {
        domFormat: 'Y-m-d',
        useDates: true,
        $headerCls: Ext.baseCSSPrefix + 'calendar-header-cell',
        $hiddenCls: Ext.baseCSSPrefix + 'calendar-header-hidden-cell',
        $tableCls: Ext.baseCSSPrefix + 'calendar-header-table',

        clearCells: function(limit) {
            limit = limit || 0;

            var row = this.row.dom,
                childNodes = row.childNodes;

            while (childNodes.length > limit) {
                row.removeChild(childNodes[limit]);
            }
        },

        createCells: function() {
            var me = this,
                row = me.row.dom,
                cells = [],
                days = me.getCreateDays(),
                cls = Ext.baseCSSPrefix + 'unselectable ' + me.$headerCls,
                cellCls = me.getCellCls(),
                cell, i;

            if (cellCls) {
                cls += ' ' + cellCls;
            }

            for (i = 0; i < days; ++i) {
                cell = document.createElement('td');
                cell.className = cls;
                cell.setAttribute('data-index', i);
                me.onCellCreate(cell, i);
                row.appendChild(cell);
                cells.push(cell);
            }

            return cells;
        },

        getCreateDays: function() {
            return this.getVisibleDays();
        },

        onCellCreate: Ext.privateFn,

        redrawCells: function() {
            this.clearCells();
            this.cells = this.createCells();
            this.setHeaderText();
        },

        setHeaderText: function() {
            var me = this,
                D = Ext.Date,
                value = me.getValue(),
                format = me.getFormat(),
                domFormat = me.domFormat,
                cells = me.cells,
                len = cells.length,
                useDates = me.useDates,
                cell, i;

            if (!value) {
                return;
            }

            value = D.clone(value);

            for (i = 0; i < len; ++i) {
                cell = cells[i];
                if (useDates) {
                    cell.setAttribute('data-date', D.format(value, domFormat));
                }
                cell.setAttribute('data-day', value.getDay());
                cell.innerHTML = D.format(value, format);
                value = D.add(value, D.DAY, 1, true);
            }
        }
    }
});
