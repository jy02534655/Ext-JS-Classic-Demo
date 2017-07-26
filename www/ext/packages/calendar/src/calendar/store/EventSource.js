/**
 * This store contains a flattened list of {@link Ext.calendar.model.EventBase events}
 * from multiple {@link Ext.calendar.store.Calendars calendars}. It provides a simpler
 * API for calendar views to interact with and monitors the attached {@link #source}
 * for changes.
 *
 * This store ensures that only events within the specified {@link #setRange range} are
 * included. Views will communicate with this store to set the range, which is then 
 * forwarded to any appropriate {@link Ext.calendar.store.Events event stores}.
 *
 * Typically, this class is not created directly but rather via the 
 * {@link Ext.calendar.store.Calendars#getEventSource} method.
 */
Ext.define('Ext.calendar.store.EventSource', {
    extend: 'Ext.data.Store',

    requires: [
        'Ext.calendar.date.Range'
    ],

    config: {
        /**
         * @cfg {Ext.calendar.store.Calendars} source
         * The calendar source for events.
         */
        source: null
    },

    sorters: [{
        direction: 'ASC',
        sorterFn: function(a, b) {
            return Ext.calendar.model.Event.sort(a, b);
        }
    }],

    trackRemoved: false,

    constructor: function(config) {
        this.calendarMap = {};
        this.callParent([config]);
    },

    createEvent: function(data) {
        //<debug>
        if (!this.getSource()) {
            Ext.raise('Cannot create event, no source specified.');
        }

        if (!this.getSource().first()) {
            Ext.raise('Cannot create event, source is empty.');
        }
        //</debug>
        var T = this.getSource().first().events().getModel(),
            event = new T();

        if (data) {
            event.setData(data);
        }

        return event;
    },

    updateSource: function(source) {
        var me = this;

        me.sourceListeners = Ext.destroy(me.sourceListeners);

        if (source) {
            me.sourceListeners = source.on({
                // Run through the full set on change, it's not expected that
                // there will be a significant amount of calendars so it's not
                // really a performance concern.
                destroyable: true,
                scope: me,
                add: 'checkData',
                remove: 'checkData',
                refresh: 'checkData'
            });
            me.checkData();
        }
    },

    add: function(record) {
        var events = this.getEventsForCalendar(record.getCalendarId());
        if (!events) {
            //<debug>
            Ext.raise('Unknown calendar: ' + record.getCalendarId());
            //</debug>
            return;
        }
        events.add(record);
    },

    move: function(record, oldCalendar) {
        var store = this.getEventsForCalendar(oldCalendar),
            newCalendar = record.getCalendar(),
            removed;

        if (newCalendar) {
            store.suspendAutoSync();
            ++store.isMoving;
        }
        store.remove(record);
        if (newCalendar) {
            --store.isMoving;
            store.resumeAutoSync();
            record.unjoin(store);
            removed = store.removed;
            if (removed) {
                Ext.Array.remove(removed, record);
            }
            store = this.getEventsForCalendar(newCalendar);
            store.suspendAutoSync();
            store.add(record);
            store.resumeAutoSync();
        }


    },

    remove: function(record) {
        var events = this.getEventsForCalendar(record.getCalendarId());
        if (!events) {
            //<debug>
            Ext.raise('Unknown calendar: ' + record.getCalendarId());
            //</debug>
            return;
        }
        events.remove(record);
    },

    hasRangeCached: function(range) {
        var map = this.calendarMap,
            current = this.range,
            id, store, hasAny;

        if (!current) {
            return false;
        }

        for (id in map) {
            hasAny = true;
            store = this.getEventsForCalendar(map[id]);
            if (!store.hasRangeCached(range)) {
                return false;
            }
        }

        if (!hasAny) {
            return current.containsRange(range);
        }

        return true;
    },

    setRange: function(range) {
        var me = this,
            map = me.calendarMap,
            success = true,
            allCached = true,
            cached, store, id, loads,
            hasAny;

        me.range = range.clone();

        for (id in map) {
            hasAny = true;
            store = me.getEventsForCalendar(map[id]);
            // The store doesn't have the immediate range
            cached = store.hasRangeCached(range);
            allCached = allCached && cached;
            store.setRange(range);
            if (!cached) {
                loads = loads || [];
                store.on('load', function(s, records, successful) {
                    Ext.Array.remove(loads, s);
                    success = success && successful;
                    if (loads.length === 0) {
                        me.doBulkLoad(success);
                    }
                }, null, {single: true});
                loads.push(store);
                me.activeLoad = true;
            }
        }

        if (hasAny && allCached) {
            me.checkData(true);
        } else if (loads) {
            me.fireEvent('beforeload', me);
        }
    },

    doDestroy: function() {
        var me = this,
            map = this.calendarMap,
            id;

        for (id in map) {
            me.untrackCalendar(map[id]);
        }

        me.calendarMap = me.stores = null;
        me.setSource(null);
        me.callParent();
    },

    privates: {
        checkData: function(fromSetRange) {
            var me = this,
                map = me.calendarMap,
                o = Ext.apply({}, map),
                source = me.getSource(),
                calendars = source.getRange(),
                len = calendars.length,
                records = [],
                range = me.range,
                i, id, calendar, events,
                start, end;

            if (range) {
                start = range.start;
                end = range.end;
            }

            for (i = 0; i < len; ++i) {
                calendar = calendars[i];
                id = calendar.getId();
                if (o[id]) {
                    // We already know about it, but the object reference may
                    // be different, so rebind listeners to be sure
                    delete o[id];
                    me.untrackCalendar(map[id]);
                }
                me.trackCalendar(calendar);
                if (range) {
                    events = me.getEventsForCalendar(calendar);
                    if (events.getCount()) {
                        Ext.Array.push(records, events.getInRange(start, end));
                    }
                }
                map[id] = calendar;
            }

            for (id in o) {
                // These are any leftovers, untrack them
                me.untrackCalendar(o[id]);
                delete map[id];
            }

            if (fromSetRange !== true && range) {
                me.setRange(range);
            }

            me.loadRecords(records);
        },

        doBulkLoad: function(success) {
            var me = this,
                map = me.calendarMap,
                range = me.range,
                records = [],
                id, events;

            if (success) {
                for (id in map) {
                    events = me.getEventsForCalendar(map[id]);
                    Ext.Array.push(records, events.getInRange(range.start, range.end));
                }
                me.loadRecords(records);
            }
            me.fireEvent('load', me, records, success);
            me.activeLoad = false;
        },

        fireChangeEvent: function() {
            return false;
        },

        getEventsForCalendar: function(calendar) {
            var ret = null;

            if (!calendar.isModel) {
                 calendar = this.calendarMap[calendar];
            }

            if (calendar) {
                ret = calendar.events();
            }
            return ret;
        },

        onEventStoreAdd: function(store, records) {
            var range = this.range,
                len = records.length,
                toAdd = [],
                i, rec;

            for (i = 0; i < len; ++i) {
                rec = records[i];
                if (rec.occursInRange(range.start, range.end)) {
                    toAdd.push(rec);
                }
            }

            if (toAdd.length > 0) {
                this.getDataSource().add(toAdd);
            }
        },

        onEventStoreBeforeUpdate: function(store, record) {
            if (!record.$moving) {
                this.suspendEvents();
                this.lastIndex = this.indexOf(record);
            }
        },

        onEventStoreClear: function(store, records) {
            var me = this,
                result;

            if (records.length > 0) {
                me.suspendEvents();
                result = me.getDataSource().remove(records);
                me.resumeEvents();
                if (result) {
                    me.fireEvent('refresh', me);
                }
            }
        },

        onEventStorePrefetch: function(store, added, pruned) {
            this.getDataSource().remove(pruned);
        },

        onEventStoreRefresh: function() {
            if (this.activeLoad) {
                return;
            }

            this.checkData();
        },

        onEventStoreRemove: function(store, records) {
            this.getDataSource().remove(records);
        },

        onEventStoreUpdate: function(store, record, type, modifiedFieldNames, info) {
            if (record.$moving) {
                return;
            }

            var me = this,
                range = me.range,
                oldIndex = me.lastIndex,
                contained = me.lastIndex !== -1,
                contains = me.contains(record);

            me.resumeEvents();

            if (contained && contains) {
                me.fireEvent('update', me, record, type, modifiedFieldNames, info);
            } else if (contained && !contains) {
                me.fireEvent('remove', me, [record], oldIndex, false);
            } else if (!contained && contains) {
                me.fireEvent('add', me, [record], me.indexOf(record));
            }
        },

        trackCalendar: function(calendar) {
            var events = this.getEventsForCalendar(calendar);
            events.sourceListeners = events.on({
                destroyable: true,
                scope: this,
                add: 'onEventStoreAdd',
                beforeupdate: 'onEventStoreBeforeUpdate',
                clear: 'onEventStoreClear',
                prefetch: 'onEventStorePrefetch',
                refresh: 'onEventStoreRefresh',
                remove: 'onEventStoreRemove',
                update: 'onEventStoreUpdate'
            });
        },

        untrackCalendar: function(calendar) {
            var events = this.getEventsForCalendar(calendar);
            events.sourceListeners = Ext.destroy(events.sourceListeners);
        }
    }
});