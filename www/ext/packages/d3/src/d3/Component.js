/**
 * Abstract class for D3 Components: {@link Ext.d3.canvas.Canvas} and {@link Ext.d3.svg.Svg}.
 *
 * Notes:
 *
 * Unlike the Charts package with its Draw layer, the D3 package does not provide
 * an abstraction layer and the user is expected to deal with the SVG and Canvas
 * directly.
 *
 * D3 package supports IE starting from version 9, as neither Canvas nor SVG
 * are supported by prior IE versions.
 */
Ext.define('Ext.d3.Component', {
    extend: 'Ext.d3.ComponentBase',

    requires: [
        'Ext.d3.lib.d3'
    ],

    isD3: true,

    config: {
        /**
         * The store with data to render.
         * @cfg {Ext.data.Store} store
         */
        store: null,

        /**
         * The CSS class used by a subclass of the D3 Component.
         * Normally, the lower-cased name of a subclass.
         * @cfg {String} componentCls
         */
        componentCls: '',

        /**
         * The list of interaction configs for this D3 component.
         * D3 package interactions are very simular to native D3 behaviors.
         * However, D3 behaviors (and its event system), are incompatible
         * with ExtJS event system. D3 package interactions may also support
         * certain features that D3 behaviors lack, like kinetic scrolling,
         * elastic borders and scroll indicators (see the {@link Ext.d3.interaction.PanZoom panzoom}
         * interaction for more information).
         *
         */
        interactions: [],

        /**
         * A map of transition configs. For example:
         *
         *     transitions: {
         *         select: {
         *             duration: 500,
         *             ease: 'cubicInOut'
         *         },
         *         zoom: {
         *             name: 'zoom',
         *             duration: 1000
         *         },
         *         ...
         *     }
         *
         * A class would define the defaults for its transitions, and a user only needs
         * to set the `transitions` config of an instance to disable a transition, e.g.:
         *
         *     transitions: {
         *         // transitions are enabled by default, `true` should never be used here
         *         select: false
         *     }
         *
         * or alter its config:
         *
         *     transitions: {
         *         select: {
         *             // the `duration` stays the same,
         *             // only the easing function is altered
         *             ease: 'bounceOut'
         *         }
         *     }
         *
         * The transitions defined this way are merely configs. To create an actual transition
         * from one of these configs, use the {@link #createTransition} method. For example:
         *
         *     this.createTransition('select')
         *
         * A transition object can optionally specify a name, if it's different from
         * the key in the `transitions` config. For example:
         *
         *     transitions: {
         *         layout: {
         *             name: 'foo',
         *             duration: 500
         *         }
         *     }
         *
         * Otherwise the name will be set automatically, for example:
         *
         *     transition.name = this.getId() + '-' + key
         *
         * Transition names (whether explicitly given or not) are prefixed by component ID
         * to prevent transitions with the same name but on a different component from
         * cancelling each other out.
         *
         * However, transitions with the same name on the same component will still cancel
         * each other out, if created via {@link #createTransition} on the same selection
         * or with no selection provided.
         *
         * `duration`, `ease` and `name` properties of transition objects in this config
         * are reserved, and will be used to configure a `d3.transition` instance.
         * However, transition objects may also have other properties that are related to
         * this transition. For example:
         *
         *     transitions: {
         *         select: {
         *             duration: 500,
         *             ease: 'cubicInOut',
         *             targetScale: 1.1
         *         }
         *     }
         *
         * The `targetScale` property here won't be consumed by a `d3.transition` instance;
         * instead a component can make use of it in whichever way it sees fit to animate
         * the selected element.
         */
        transitions: {
            none: {
                name: undefined,
                duration: 0,
                ease: Ext.identityFn
            }
        },

        touchAction: {
            panX: false,
            panY: false,
            pinchZoom: false,
            doubleTapZoom: false
        }
    },

    baseCls: Ext.baseCSSPrefix + 'd3',

    /*
     * @private
     * Some configs in the D3 package are saved as properties on the class instance for faster access.
     * Prefixed properties are not used, as prefix can in theory change.
     * `$configPrefixed: false` is not used, as there's really no need to change the default for all configs.
     * All instance properties that are accessed bypassing getters/setters are listed on the prototype
     * to keep things explicit.
     */

    defaultBindProperty: 'store',

    isInitializing: true,

    refreshDelay: 100, // in milliseconds
    resizeDelay: 250, // in milliseconds
    resizeTimerId: 0,
    size: null, // cached size

    d3Components: null,

    constructor: function (config) {
        var me = this;

        me.d3Components = {};

        me.callParent(arguments);

        me.isInitializing = false;

        me.on('resize', 'onElementResize', me);
    },

    destroy: function () {
        var me = this;
        
        if (me.resizeTimerId) {
            clearTimeout(me.resizeTimerId);
        }

        me.un('resize', 'onElementResize', me);
        me.setInteractions();
        me.callParent();
    },

    updateComponentCls: function (componentCls, oldComponentCls) {
        var baseCls = this.baseCls,
            el = this.element;

        if (componentCls && Ext.isString(componentCls)) {
            el.addCls(componentCls, baseCls);
            if (oldComponentCls) {
                el.removeCls(oldComponentCls, baseCls);
            }
        }
    },

    register: function (component) {
        var map = this.d3Components,
            id = component.getId();

        //<debug>
        if (id === undefined) {
            Ext.raise('Attempting to register a component with no ID.');
        }
        if (id in map) {
            Ext.raise('Component with ID "' + id + '" is already registered.');
        }
        //</debug>

        map[id] = component;
    },

    unregister: function (component) {
        var map = this.d3Components,
            id = component.getId();

        delete map[id];
    },

    applyInteractions: function (interactions, oldInteractions) {
        if (!oldInteractions) {
            oldInteractions = [];
            oldInteractions.map = {};
        }

        var me = this,
            result = [],
            oldMap = oldInteractions.map,
            i, ln, interaction, id;

        result.map = {};
        interactions = Ext.Array.from(interactions, true); // `true` to clone
        for (i = 0, ln = interactions.length; i < ln; i++) {
            interaction = interactions[i];
            if (!interaction) {
                continue;
            }
            if (interaction.isInteraction) {
                id = interaction.getId();
            } else {
                id = interaction.id;
                interaction.element = me.element;
            }
            // Create a new interaction by alias or reconfigure the old one.
            interaction = Ext.factory(interaction, null, oldMap[id], 'd3.interaction');
            if (interaction) {
                interaction.setComponent(me);
                me.addInteraction(interaction);
                result.push(interaction);
                result.map[interaction.getId()] = interaction;
            }
        }

        // Destroy old interactions that were not reused.
        for (i in oldMap) {
            if (!result.map[i]) {
                interaction = oldMap[i];
                interaction.destroy();
            }
        }
        return result;
    },

    applyTransitions: function (transitions) {
        var name, transition, ease,
            ret = {};

        for (name in transitions) {
            transition = transitions[name];

            if (transition === true) {
                Ext.raise("'true' is not a valid transition value (should be an object or 'false').");
            }
            ret[name] = transition = Ext.apply({}, transition || transitions.none);
            ease = transition.ease;
            if (typeof ease === 'string') {
                transition.ease = d3['ease' + ease.charAt(0).toUpperCase() + ease.substr(1)];
            }
            if (!('name' in transition)) {
                transition.name = this.getId() + '-' + name;
            }
        }

        return ret;
    },

    /**
     * Creates a `d3.transition` instance from a named object in the {@link #transitions} config.
     * @param {String} name The name of the transition in the {@link #transitions} config.
     * @param {d3.selection} [selection] The selection to create this transition on.
     * @return {d3.transition}
     */
    createTransition: function (name, selection) {
        var transition = this.getTransitions()[name];
        //<debug>
        if (!transition) {
            Ext.raise('No transition named "' + name + '"');
        }
        //</debug>
        if (!selection) {
            selection = d3;
        }
        return selection.transition(transition.name)
                              .ease(transition.ease)
                          .duration(transition.duration);
    },

    /**
     * @property {Ext.d3.interaction.PanZoom} panZoom
     * If the `panzoom` interaction has been added, a reference to it is saved on the
     * component instance for quick access.
     */
    panZoom: null,

    /**
     * @protected
     * When {@link Ext.d3.interaction.PanZoom `panzoom`} interaction is added to the component,
     * this method is used as a listener for the interaction's `panzoom` event.
     * This method should be implemented by subclasses what wish to be affected by the interaction.
     * @param {Ext.d3.interaction.PanZoom} interaction
     * @param {Number[]} scaling
     * @param {Number[]} translation
     */
    onPanZoom: Ext.emptyFn,
    /**
     * @protected
     * Returns the bounding box of the content before transformations.
     * This method should be implemented by subclasses that wish to support constrained panning
     * via {@link Ext.d3.interaction.PanZoom `panzoom`} interaction.
     * @return {Object} rect
     * @return {Number} return.x
     * @return {Number} return.y
     * @return {Number} return.width
     * @return {Number} return.height
     */
    getContentRect: Ext.emptyFn,
    /**
     * @protected
     * Returns the position and size of the viewport in component's coordinates.
     * This method should be implemented by subclasses that wish to support constrained panning
     * via {@link Ext.d3.interaction.PanZoom `panzoom`} interaction.
     * @return {Object} rect
     * @return {Number} return.x
     * @return {Number} return.y
     * @return {Number} return.width
     * @return {Number} return.height
     */
    getViewportRect: Ext.emptyFn,

    addInteraction: function (interaction) {
        var me = this;

        if (interaction.isPanZoom) {
            interaction.setContentRect(me.getContentRect.bind(me));
            interaction.setViewportRect(me.getViewportRect.bind(me));
            me.panZoom = interaction;
            interaction.on('panzoom', me.onPanZoom, me);
        }

        interaction.on('destroy', me.onInteractionDestroy, me);
    },

    removeInteraction: function (interaction) {
        if (interaction.isPanZoom) {
            interaction.setContentRect(null);
            interaction.setViewportRect(null);
            this.panZoom = null;
            interaction.un('panzoom', this.onPanZoom, this);
        }
    },

    onInteractionDestroy: function (interaction) {
        interaction.un('destroy', this.onInteractionDestroy, this);

        this.removeInteraction(interaction);
    },

    applyStore: function (store) {
        return store && Ext.StoreManager.lookup(store);
    },

    updateStore: function (store, oldStore) {
        var me = this,
            storeEvents = {
                // remove listeners for update and load since they trigger datachanged
                datachanged: 'onDataChange',
                // delay listener until all store changes (add/update/remove) are ready
                // and call it one time only
                buffer: me.refreshDelay,
                scope: me,
                order: 'after'
            },
            root;

        if (oldStore) {
            oldStore.un(storeEvents);
            if (oldStore.getAutoDestroy()) {
                oldStore.destroy();
            }
        }
        if (store) {
            store.on(storeEvents);
            me.onDataChange(store);
            if (store.isTreeStore) {
                root = store.getRoot();
                // If the root is not yet expanded, suspend all 'datachanged' events and
                // wait until it has fully expanded, then fire a single 'datachanged' event.
                if (!root.isExpanded()) {
                    store.suspendEvent('datachanged');
                    root.on({
                        expand: function() {
                            store.resumeEvent('datachanged');
                            store.fireEvent('datachanged', store);
                        },
                        single: true
                    });
                }
            }
        }
    },

    onDataChange: function (store) {
        var me = this;

        if (me.isInitializing) {
            return;
        }

        me.processDataChange(store);
    },

    onDataUpdate: function (store, record, operation, modifiedFieldNames, details) {
        var me = this;

        if (me.isInitializing) {
            return;
        }

        me.processDataUpdate(store, record, operation, modifiedFieldNames, details);
    },

    onDataLoad: function (store, records, successful, operation) {
        this.processDataLoad(store, records, successful, operation);
    },

    processDataChange: Ext.emptyFn,
    processDataUpdate: Ext.emptyFn,
    processDataLoad: Ext.emptyFn,

    maskEl: null,

    /**
     * @private
     */
    showMask: function (msg) {
        var me = this;

        if (me.maskEl) {
            me.maskEl.dom.firstChild.textContent = msg;
            me.maskEl.setStyle('display', 'flex');
        } else {
            me.maskEl = this.element.createChild({
                style: {
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.5)'
                },
                children: [{
                    html: msg,
                    style: {
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        padding: '10px'
                    }
                }]
            });
        }
    },

    /**
     * @private
     */
    hideMask: function () {
        this.maskEl && this.maskEl.setStyle('display', 'none');
    },

    handleResize: function (size, instantly) {
        var me = this,
            el = me.element;

        size = size || (el && el.getSize());

        if (!(size && size.width && size.height)) {
            return;
        }

        clearTimeout(me.resizeTimerId);

        if (instantly) {
            me.resizeTimerId = 0;
        } else {
            me.resizeTimerId = Ext.defer(me.handleResize, me.resizeDelay, me, [size, true]);
            return;
        }

        me.resizeHandler(size);

        if (me.panZoom && me.panZoom.updateIndicator) {
            me.panZoom.updateIndicator();
        }

        me.size = size;
    },

    resizeHandler: Ext.emptyFn,

    /**
     * Converts event coordinates from page coordinates to view coordinates.
     * @param {Ext.event.Event} event
     * @param {Ext.dom.Element} [view] If omitted, the component's element will be used.
     * @return {Number[]}
     */
    toLocalXY: function (event, view) {
        var pageXY = event.getXY(),
            viewXY = view ? view.getXY() : this.element.getXY();
        
        return [
            pageXY[0] - viewXY[0],
            pageXY[1] - viewXY[1]
        ];
    }

});
