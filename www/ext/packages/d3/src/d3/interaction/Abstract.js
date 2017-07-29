/**
 * Defines a common abstract parent class for all D3 interactions.
 */
Ext.define('Ext.d3.interaction.Abstract', {

    isInteraction: true,

    mixins: {
        observable: 'Ext.mixin.Observable'
    },

    statics: {
        /**
         * @private
         * Map of components to locked events on those components, e.g.:
         *
         *     {
         *         componentId: {
         *             drag: true,
         *             pinch: true
         *         }
         *     }
         */
        lockedEvents: {}
    },

    config: {
        /**
         * @cfg {Ext.d3.Component} component
         * The interaction will listen for gestures on this component's element.
         */
        component: null,

        /**
         * @cfg {Object} gestures
         * Maps gestures that should be used for starting/maintaining/ending
         * the interaction to corresponding class methods. For example:
         *
         *     gestures: {
         *         tap: 'onGesture'
         *     }
         *
         * It is also possible to override the default getter for the `gestures`
         * config, that will derive gestures to be used based on other configs' values.
         * For example, a subclass can define:
         *
         *     getGestures: function () {
         *         var someConfig = this.getSomeConfig(),
         *             gestures = {};
         *
         *         gestures[someConfig.gesture] = 'onGesture';
         *
         *         return gestures;
         *     }
         *
         */
        gestures: null,

        /**
         * @cfg {Boolean} [enabled=true] `true` if the interaction is enabled.
         */
        enabled: true
    },

    /**
     * @private
     * @event destroy
     * Fires when an interaction is destroyed.
     * @param {Ext.d3.interaction.Abstract} interaction
     */

    /**
     * @private
     * Class names or namespaces of supported components, e.g.:
     * Ext.d3
     * Ext.d3.hierarchy.Pack
     */
    supports: [],

    listeners: null,

    constructor: function (config) {
        var me = this,
            id;

        config = config || {};

        if ('id' in config) {
            id = config.id;
        } else if ('id' in me.config) {
            id = me.config.id;
        } else {
            id = me.getId();
        }
        me.setId(id);

        me.mixins.observable.constructor.call(me, config);
    },

    resetComponent: function () {
        var me = this,
            component = me.getComponent();

        if (!me.isConfiguring) {
            me.setComponent(null);
            me.setGestures(null);
            me.setComponent(component);
        }
    },

    updateComponent: function (component, oldComponent) {
        var me = this;

        if (oldComponent === component) {
            return;
        }
        if (oldComponent) {
            me.removeComponent(oldComponent);
        }
        if (component) {
            me.addComponent(component);
        }
    },

    addComponent: function (component) {
        component.register(this);
        this.component = component;
        this.addElementListener(component.element);
    },

    removeComponent: function (component) {
        this.removeElementListener(component.element);
        this.component = null;
        component.unregister(this);
    },

    updateEnabled: function (enabled) {
        var me = this,
            component = me.getComponent();

        if (component) {
            if (enabled) {
                me.addElementListener(component.element);
            } else {
                me.removeElementListener(component.element);
            }
        }
    },

    /**
     * @method
     * @protected
     * Placeholder method.
     */
    onGesture: Ext.emptyFn,

    /**
     * @private
     */
    addElementListener: function (element) {
        var me = this,
            gestures = me.getGestures(),
            locks = me.getLocks(),
            name;

        if (!me.getEnabled()) {
            return;
        }

        function addGesture(name, fn) {
            if (!Ext.isFunction(fn)) {
                fn = me[fn];
            }
            element.on(
                name,
                me.listeners[name] = function (e) {
                    if (me.getEnabled() && (!(name in locks) || locks[name] === me)) {
                        var result = fn.apply(this, arguments);
                        if (result === false && e && e.stopPropagation) {
                            e.stopPropagation();
                        }
                        return result;
                    }
                },
                me
            );
        }

        me.listeners = me.listeners || {};
        for (name in gestures) {
            addGesture(name, gestures[name]);
        }
    },

    removeElementListener: function (element) {
        var me = this,
            gestures = me.getGestures(),
            name;

        function removeGesture(name) {
            var fn = me.listeners[name];

            if (fn) {
                element.un(name, fn);
                delete me.listeners[name];
            }
        }

        if (me.listeners) {
            for (name in gestures) {
                removeGesture(name);
            }
        }
    },

    lockEvents: function () {
        var me = this,
            locks = me.getLocks(),
            args = Array.prototype.slice.call(arguments),
            i = args.length;

        while (i--) {
            locks[args[i]] = me;
        }
    },

    unlockEvents: function () {
        var locks = this.getLocks(),
            args = Array.prototype.slice.call(arguments),
            i = args.length;

        while (i--) {
            delete locks[args[i]];
        }
    },

    getLocks: function () {
        return this.statics().lockedEvents;
    },

    destroy: function () {
        var me = this;

        me.fireEvent('destroy', me);
        me.setComponent(null);
        me.listeners = null;
    }

});
