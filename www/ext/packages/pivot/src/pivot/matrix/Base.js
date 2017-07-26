/**
 * Base implementation of a pivot matrix.
 *
 * This class contains basic methods that are used to generate the pivot data. It
 * needs to be extended by other classes to properly generate the results.
 */
Ext.define('Ext.pivot.matrix.Base', {
    alternateClassName: [
        'Mz.aggregate.matrix.Abstract'
    ],

    extend: 'Ext.util.Observable',
    
    alias:  'pivotmatrix.base',

    mixins: [
        'Ext.mixin.Factoryable'
    ],

    requires: [
        'Ext.util.DelayedTask',
        'Ext.data.ArrayStore',
        'Ext.XTemplate',
        'Ext.pivot.Aggregators',
        'Ext.pivot.MixedCollection',
        'Ext.pivot.axis.Base',
        'Ext.pivot.dimension.Item',
        'Ext.pivot.result.Collection'
    ],

    /**
     * Fires before the generated data is destroyed.
     * The components that uses the matrix should unbind this pivot store before is destroyed.
     * The grid panel will trow errors if the store is destroyed and the grid is refreshed.
     *
     * @event cleardata
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */

    /**
     * Fires before the matrix is reconfigured.
     *
     * Return false to stop reconfiguring the matrix.
     *
     * @event beforereconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */

    /**
     * Fires when the matrix is reconfigured.
     *
     * @event reconfigure
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Object} config Object used to reconfigure the matrix
     */

    /**
     * Fires when the matrix starts processing the records.
     *
     * @event start
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */

    /**
     * Fires during records processing.
     *
     * @event progress
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Integer} index Current index of record that is processed
     * @param {Integer} total Total number of records to process
     */

    /**
     * Fires when the matrix finished processing the records
     *
     * @event done
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     */

    /**
     * Fires after the matrix built the store model.
     *
     * @event modelbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} model The built model
     */

    /**
     * Fires after the matrix built the columns.
     *
     * @event columnsbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} columns The built columns
     */

    /**
     * Fires after the matrix built a pivot store record.
     *
     * @event recordbuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Model} record The built record
     * @param {Ext.pivot.axis.Item} item The left axis item the record was built for
     */

    /**
     * Fires before grand total records are created in the pivot store.
     * Push additional objects to the array if you need to create additional grand totals.
     *
     * @event buildtotals
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Array} totals Array of objects that will be used to create grand total records in the pivot store. Each object should have:
     * @param {String} totals.title Name your grand total
     * @param {Object} totals.values Values used to generate the pivot store record
     */

    /**
     * Fires after the matrix built the pivot store.
     *
     * @event storebuilt
     * @param {Ext.pivot.matrix.Base} matrix Reference to the Matrix object
     * @param {Ext.data.Store} store The built store
     */

    /**
     * @cfg {String} [type=abstract]
     *
     * Used when you define a filter on a dimension to set what kind of filter is to be
     * instantiated.
     */

    /**
     * @cfg {String} resultType
     *
     * Define the type of Result this class uses. Specify here the pivotresult alias.
     */
    resultType:     'base',

    /**
     * @cfg {String} leftAxisType
     *
     * Define the type of left Axis this class uses. Specify here the pivotaxis alias.
     */
    leftAxisType:     'base',

    /**
     * @cfg {String} topAxisType
     *
     * Define the type of top Axis this class uses. Specify here the pivotaxis alias.
     */
    topAxisType:      'base',

    /**
     * @cfg {String} textRowLabels
     *
     * In compact layout only one column is generated for the left axis dimensions.
     * This is value of that column header.
     */
    textRowLabels:      'Row labels',
    
    /**
     * @cfg {String} textTotalTpl Configure the template for the group total. (i.e. '{name} ({rows.length} items)')
     * @cfg {String}           textTotalTpl.groupField         The field name being grouped by.
     * @cfg {String}           textTotalTpl.name               Group name
     * @cfg {Ext.data.Model[]} textTotalTpl.rows               An array containing the child records for the group being rendered.
     */
    textTotalTpl:       'Total ({name})',

    /**
     * @cfg {String} textGrandTotalTpl Configure the template for the grand total.
     */
    textGrandTotalTpl:  'Grand total',

    /**
     * @cfg {String} keysSeparator
     *
     * An axis item has a key that is a combination of all its parents keys. This is the keys separator.
     *
     * Do not use regexp special chars for this.
     */
    keysSeparator:      '#_#',
    
    /**
     * @cfg {String} grandTotalKey
     *
     * Generic key used by the grand total records.
     */
    grandTotalKey:      'grandtotal',
    
    /**
     * @cfg {String} compactViewKey
     *
     * In compact view layout mode the matrix generates only one column for all left axis dimensions.
     * This is the 'dataIndex' field name on the pivot store model.
     */
    compactViewKey:     '_compactview_',

    /**
     * @cfg {Number} compactViewColumnWidth
     *
     * In compact view layout mode the matrix generates only one column for all left axis dimensions.
     * This is the width of that column.
     */
    compactViewColumnWidth:   200,
    
    /**
     * @cfg {String} viewLayoutType Type of layout used to display the pivot data.
     * Possible values: outline, compact, tabular
     */
    viewLayoutType:             'outline',

    /**
     * @cfg {String} rowSubTotalsPosition Possible values: `first`, `none`, `last`
     */
    rowSubTotalsPosition:       'first',

    /**
     * @cfg {String} rowGrandTotalsPosition Possible values: `first`, `none`, `last`
     */
    rowGrandTotalsPosition:     'last',

    /**
     * @cfg {String} colSubTotalsPosition Possible values: `first`, `none`, `last`
     */
    colSubTotalsPosition:       'last',

    /**
     * @cfg {String} colGrandTotalsPosition Possible values: `first`, `none`, `last`
     */
    colGrandTotalsPosition:     'last',

    /**
     * @cfg {Boolean} showZeroAsBlank Should 0 values be displayed as blank?
     *
     */
    showZeroAsBlank:            false,

    /**
     * @cfg {Boolean} calculateAsExcel
     *
     * Set to true if you want calculations to be done like in Excel.
     *
     * Set to false if you want all non numeric values to be treated as 0.
     *
     * Let's say we have the following values: 2, null, 4, 'test'.
     * - when `calculateAsExcel` is true then we have the following results: sum: 6; min: 2; max: 4; avg: 3; count: 3
     * - if `calculateAsExcel` is false then the results are: sum = 6, min: null; max: 4; avg: 1.5; count: 4
     */
    calculateAsExcel: false,

    /**
     * @cfg {Ext.pivot.axis.Base} leftAxis
     *
     * Left axis object stores all generated groups for the left axis dimensions
     */
    leftAxis:       null,

    /**
     * @cfg {Ext.pivot.axis.Base} topAxis
     *
     * Top axis object stores all generated groups for the top axis dimensions
     */
    topAxis:        null,

    /**
     * @cfg {Ext.pivot.MixedCollection} aggregate
     *
     * Collection of configured aggregate dimensions
     */
    aggregate:      null,
    
    /**
     * @property {Ext.pivot.result.Collection} results
     * @readonly
     *
     * Stores the calculated results
     */
    results:        null,
    
    /**
     * @property {Ext.data.ArrayStore} pivotStore
     * @readonly
     *
     * The generated pivot store
     *
     * @private
     */
    pivotStore:     null,
    
    /**
     * @property {Boolean} isDestroyed
     * @readonly
     *
     * This property is set to true when the matrix object is destroyed.
     * This is useful to check when functions are deferred.
     */
    isDestroyed:    false,

    /**
     * @cfg {Ext.Component} cmp (required)
     *
     * Reference to the pivot component that monitors this matrix.
     */
    cmp:            null,

    /**
     * @cfg {Boolean} useNaturalSorting
     *
     * Set to true if you want to use natural sorting algorithm when sorting dimensions.
     *
     * For performance reasons this is turned off by default.
     */
    useNaturalSorting: false,

    /**
     * @cfg {Boolean} collapsibleRows
     *
     * Set to false if you want row groups to always be expanded and the buttons that
     * expand/collapse groups to be hidden in the UI.
     */
    collapsibleRows: true,

    /**
     * @cfg {Boolean} collapsibleColumns
     *
     * Set to false if you want column groups to always be expanded and the buttons that
     * expand/collapse groups to be hidden in the UI.
     */
    collapsibleColumns: true,

    isPivotMatrix:  true,

    serializeProperties: [
        'viewLayoutType', 'rowSubTotalsPosition', 'rowGrandTotalsPosition',
        'colSubTotalsPosition', 'colGrandTotalsPosition', 'showZeroAsBlank',
        'collapsibleRows', 'collapsibleColumns'
    ],

    constructor: function(config){
        var ret = this.callParent(arguments);

        this.initialize(true, config);

        return ret;
    },
    
    destroy: function(){
        var me = this;
        
        me.delayedTask.cancel();
        me.delayedTask = null;
        
        if(Ext.isFunction(me.onDestroy)){
            me.onDestroy();
        }
        
        Ext.destroy(me.results, me.leftAxis, me.topAxis, me.aggregate, me.pivotStore);
        me.results = me.leftAxis = me.topAxis = me.aggregate = me.pivotStore = null;
        
        if(Ext.isArray(me.columns)){
            me.columns.length = 0;
        }
        if(Ext.isArray(me.model)){
            me.model.length = 0;
        }
        if(Ext.isArray(me.totals)){
            me.totals.length = 0;
        }
        me.columns = me.model = me.totals = me.keysMap = me.cmp = me.modelInfo = null;
        
        me.isDestroyed = true;

        me.callParent(arguments);
    },
    
    /**
     * The arguments are combined in a string and the function returns the crc32
     * for that key
     *
     * @deprecated 6.0.0 This method is deprecated.
     * @method formatKeys
     * @returns {String}
     */

    /**
     * Return a unique id for the specified value. The function builds a keys map so that same values get same ids.
     *
     * @param value
     * @returns {String}
     *
     * @private
     */
    getKey: function(value){
        var me = this;

        me.keysMap = me.keysMap || {};
        if(!Ext.isDefined(me.keysMap[value])){
            me.keysMap[value] = Ext.id();
        }
        return me.keysMap[value];
    },

    /**
     * Natural Sort algorithm for Javascript - Version 0.8 - Released under MIT license
     * Author: Jim Palmer (based on chunking idea from Dave Koelle)
     * https://github.com/overset/javascript-natural-sort/blob/master/naturalSort.js
     *
     * @private
     */
    naturalSort: (function () {
        var re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g,
            sre = /^\s+|\s+$/g,   // trim pre-post whitespace
            snre = /\s+/g,        // normalize all whitespace to single ' ' character
            dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
            hre = /^0x[0-9a-f]+$/i,
            ore = /^0/,
            normChunk = function(s, l) {
                // normalize spaces; find floats not starting with '0', string or 0 if not defined (Clint Priest)
                s = s || '';
                return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
            };

        return function (a, b) {
            // convert all to strings strip whitespace
            var x = String(a instanceof Date ? a.getTime() : (a || '')).replace(sre, ''),
                y = String(b instanceof Date ? b.getTime() : (b || '')).replace(sre, ''),
                // chunk/tokenize
                xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                // numeric, hex or date detection
                xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && Date.parse(x)),
                yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
                oFxNcL, oFyNcL;
            // first try and sort Hex codes or Dates
            if (yD) {
                if ( xD < yD ) { return -1; }
                else if ( xD > yD ) { return 1; }
            }
            // natural sorting through split numeric strings and default strings
            for(var cLoc=0, xNl = xN.length, yNl = yN.length, numS=Math.max(xNl, yNl); cLoc < numS; cLoc++) {
                oFxNcL = normChunk(xN[cLoc], xNl);
                oFyNcL = normChunk(yN[cLoc], yNl);
                // handle numeric vs string comparison - number < string - (Kyle Adams)
                if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
                // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
                else if (typeof oFxNcL !== typeof oFyNcL) {
                    oFxNcL += '';
                    oFyNcL += '';
                }
                if (oFxNcL < oFyNcL) { return -1; }
                if (oFxNcL > oFyNcL) { return 1; }
            }
            return 0;
        };
    }()),

    /**
     *
     * Initialize the matrix with the new config object
     *
     * @param firstTime
     * @param config
     *
     * @private
     *
     */
    initialize: function(firstTime, config){
        var me = this,    
            props = me.serializeProperties,
            i;

        config = config || {};

        // initialize the results object
        me.initResults();
        
        if(firstTime || config.aggregate) {
            // initialize aggregates
            me.initAggregates(config.aggregate || []);
        }

        if(firstTime || config.leftAxis) {
            // initialize dimensions and build axis tree
            me.initLeftAxis(config.leftAxis || []);
        }

        if(firstTime || config.topAxis) {
            // initialize dimensions and build axis tree
            me.initTopAxis(config.topAxis || []);
        }

        for(i = 0; i < props.length; i++){
            if(Ext.isDefined(config[props[i]])){
                me[props[i]] = config[props[i]];
            }
        }
        me.totals = [];
        me.modelInfo = {};
        me.keysMap = null;

        if(!firstTime){
            if(!me.collapsibleRows){
                me.leftAxis.expandAll();
            }
            if(!me.collapsibleColumns){
                me.topAxis.expandAll();
            }
        }

        if(firstTime){
            me.pivotStore = new Ext.data.ArrayStore({
                autoDestroy:    false,
                fields:         []
            });
            
            me.delayedTask = new Ext.util.DelayedTask(me.startProcess, me);
            
            if(Ext.isFunction(me.onInitialize)){
                me.onInitialize();
            }
        }
        // after initializing the matrix we can start processing data
        // we do it in a delayed task because a reconfigure may follow shortly
        me.delayedTask.delay(5);
    },
    
    /**
     * @method
     * Template method called to do your internal initialization when you extend this class.
     */
    onInitialize: Ext.emptyFn,
    
    /**
     * @method
     * Template method called before destroying the instance.
     */
    onDestroy: Ext.emptyFn,
    
    /**
     * Call this function to reconfigure the matrix with a new set of configs
     *
     * @param {Object} config Config object which has all configs that you want to change on this instance
     */
    reconfigure: function(config){
        var me = this,
            cfg = Ext.clone(config || {});

        if(me.fireEvent('beforereconfigure', me, cfg) !== false) {
            if (Ext.isFunction(me.onReconfigure)) {
                me.onReconfigure(cfg);
            }

            // the user can change values on the config before reinitializing the matrix
            me.fireEvent('reconfigure', me, cfg);
            me.initialize(false, cfg);
            me.clearData();
        }else{
            me.delayedTask.cancel();
        }
    },
    
    /**
     * @method
     *
     * Template function called when the matrix has to be reconfigured with a new set of configs.
     *
     * @param {Object} config Config object which has all configs that need to be changed on this instance
     */
    onReconfigure: Ext.emptyFn,

    /**
     * Returns the serialized matrix configs.
     *
     * @return {Object}
     */
    serialize: function(){
        var me = this,
            props = me.serializeProperties,
            len = props.length,
            cfg = {},
            i, prop;

        for(i = 0; i < len; i++){
            prop = props[i];
            cfg[prop] = me[prop];
        }

        cfg.leftAxis = me.serializeDimensions(me.leftAxis.dimensions);
        cfg.topAxis = me.serializeDimensions(me.topAxis.dimensions);
        cfg.aggregate = me.serializeDimensions(me.aggregate);

        return cfg;
    },

    /**
     * Serialize the given dimensions collection
     *
     * @param dimensions
     * @return {Array}
     * @private
     */
    serializeDimensions: function(dimensions){
        var len = dimensions.getCount(),
            cfg = [],
            i;

        for(i = 0; i < len; i++){
            cfg.push(dimensions.getAt(i).serialize());
        }

        return cfg;
    },

    /**
     * Initialize the Results object
     *
     * @private
     */
    initResults: function(){
        Ext.destroy(this.results);
        this.results = new Ext.pivot.result.Collection({
            resultType: this.resultType,
            matrix:     this
        });
    },
    
    /**
     * @private
     */
    initAggregates: function(dimensions){
        var me = this,
            i, item;
        
        Ext.destroy(me.aggregate);
        me.aggregate = new Ext.pivot.MixedCollection();
        me.aggregate.getKey = function(item){
            return item.getId();
        };
        
        if(Ext.isEmpty(dimensions)){
            return;
        }

        dimensions = Ext.Array.from(dimensions);
        
        for(i = 0; i < dimensions.length; i++){
            item = dimensions[i];

            if(!item.isInstance){
                Ext.applyIf(item, {
                    isAggregate:        true,
                    align:              'right',
                    showZeroAsBlank:    me.showZeroAsBlank
                });
                item = new Ext.pivot.dimension.Item(item);
            }
            item.matrix = this;

            me.aggregate.add(item);
        }
    },

    /**
     * @private
     */
    initLeftAxis: function(dimensions){
        var me = this;

        dimensions = Ext.Array.from(dimensions || []);
        Ext.destroy(me.leftAxis);
        me.leftAxis = Ext.Factory.pivotaxis({
            type:       me.leftAxisType,
            matrix:     me,
            dimensions: dimensions,
            isLeftAxis: true
        });
    },

    /**
     * @private
     */
    initTopAxis: function(dimensions){
        var me = this;

        dimensions = Ext.Array.from(dimensions || []);
        Ext.destroy(me.topAxis);
        me.topAxis = Ext.Factory.pivotaxis({
            type:       me.topAxisType,
            matrix:     me,
            dimensions: dimensions,
            isLeftAxis: false
        });
    },

    /**
     * This function clears any data that was previously calculated/generated.
     *
     */
    clearData: function(){
        var me = this;
        
        me.fireEvent('cleardata', me);
        
        me.leftAxis.clear();
        me.topAxis.clear();
        me.results.clear();
        
        if(Ext.isArray(me.columns)){
            me.columns.length = 0;
        }
        
        if(Ext.isArray(me.model)){
            me.model.length = 0;
        }
        
        me.totals = [];
        me.modelInfo = {};
        me.keysMap = null;
        
        if(me.pivotStore){
            me.pivotStore.removeAll(true);
        }
    },
    
    /**
     * Template function called when the calculation process is started.
     * This function needs to be implemented in the subclass.
     */
    startProcess: Ext.emptyFn,
    
    /**
     * Call this function after you finished your matrix processing.
     * This function will build up the pivot store and column headers.
     */
    endProcess: function(){
        var me = this;
        
        // force tree creation on both axis
        me.leftAxis.getTree();
        me.topAxis.getTree();
        
        // build pivot store model and column headers
        me.buildModelAndColumns();
        
        // build pivot store rows
        me.buildPivotStore();
        if(Ext.isFunction(me.onBuildStore)){
            me.onBuildStore(me.pivotStore);
        }
        me.fireEvent('storebuilt', me, me.pivotStore);
        
        me.fireEvent('done', me);
    },
    
    /**
     * @method
     *
     * Template function called after the pivot store model was created.
     * You could extend the model in a subclass if you implement this method.
     *
     * @param {Array} model
     */
    onBuildModel: Ext.emptyFn,
    
    /**
     * @method
     *
     * Template function called after the pivot columns were created.
     * You could extend the columns in a subclass if you implement this method.
     *
     * @param {Array} columns
     */
    onBuildColumns: Ext.emptyFn,
    
    /**
     * @method
     *
     * Template function called after a pivot store record was created.
     * You can use this to populate the record with your data.
     *
     * @param {Ext.data.Model} record
     * @param {Ext.pivot.axis.Item} item
     */
    onBuildRecord: Ext.emptyFn,
    
    /**
     * @method
     *
     * Template function called before building grand total records.
     * Use it to add additional grand totals to the pivot grid.
     * You have to push objects into the totals array with properties for each matrix.model fields.
     * For each object that you add a new record will be added to the pivot store
     * and will be styled as a grand total.
     *
     * @param {Array} totals
     */
    onBuildTotals: Ext.emptyFn,
    
    /**
     * @method
     *
     * Template function called after the pivot store was created.
     *
     * @param {Ext.data.ArrayStore} store
     */
    onBuildStore: Ext.emptyFn,
    
    /**
     * This function dynamically builds the model of the pivot records.
     *
     * @private
     */
    buildModelAndColumns: function(){
        var me = this;

        me.model = [
            {name: 'id', type: 'string'},
            {name: 'isRowGroupHeader', type: 'boolean', defaultValue: false},
            {name: 'isRowGroupTotal', type: 'boolean', defaultValue: false},
            {name: 'isRowGrandTotal', type: 'boolean', defaultValue: false},
            {name: 'leftAxisKey', type: 'string', defaultValue: null}
        ];

        me.internalCounter = 0;
        me.columns = [];

        if(me.viewLayoutType == 'compact'){
            me.generateCompactLeftAxis();
        }else{
            me.leftAxis.dimensions.each(me.parseLeftAxisDimension, me);
        }

        if(me.colGrandTotalsPosition == 'first'){
            me.columns.push(me.parseAggregateForColumn(null, {
                text:       me.textGrandTotalTpl,
                grandTotal: true
            }));
        }
        Ext.Array.each(me.topAxis.getTree(), me.parseTopAxisItem, me);

        if(me.colGrandTotalsPosition == 'last'){
            me.columns.push(me.parseAggregateForColumn(null, {
                text:       me.textGrandTotalTpl,
                grandTotal: true
            }));
        }

        // call the hook functions
        if(Ext.isFunction(me.onBuildModel)){
            me.onBuildModel(me.model);
        }
        me.fireEvent('modelbuilt', me, me.model);
        if(Ext.isFunction(me.onBuildColumns)){
            me.onBuildColumns(me.columns);
        }
        me.fireEvent('columnsbuilt', me, me.columns);
    },

    getDefaultFieldInfo: function(config){
        return Ext.apply({
            isColGroupTotal:    false,
            isColGrandTotal:    false,
            leftAxisColumn:     false,
            topAxisColumn:      false,
            topAxisKey:         null
        }, config);
    },

    /**
     * @private
     */
    parseLeftAxisDimension: function(dimension){
        var me = this,
            id = dimension.getId();

        me.model.push({
            name:   id,
            type:   'auto'
        });
        me.columns.push(Ext.merge({
            dataIndex:  id,
            text:       dimension.header,
            dimension:  dimension,
            leftAxis:   true
        }, dimension.column));
        me.modelInfo[id] = me.getDefaultFieldInfo({
            leftAxisColumn:     true
        });
    },
    
    /**
     * @private
     */
    generateCompactLeftAxis: function(){
        var me = this;

        me.model.push({
            name:   me.compactViewKey,
            type:   'auto'
        });
        me.columns.push({
            dataIndex:  me.compactViewKey,
            text:       me.textRowLabels,
            leftAxis:   true,
            width:      me.compactViewColumnWidth
        });
        me.modelInfo[me.compactViewKey] = me.getDefaultFieldInfo({
            leftAxisColumn:     true
        });
    },
    
    /**
     * @private
     */
    parseTopAxisItem: function(item){
        var me = this,
            columns = [],
            retColumns = [],
            o1, o2,
            len, i, ret;
        
        if(!item.children){
            columns = me.parseAggregateForColumn(item, null);
            if(item.level === 0){
                me.columns.push(columns);
            }else{
                // we reached the deepest level so we can add to the model now
                return columns;
            }
        }else{
            if(me.colSubTotalsPosition == 'first'){
                o2 = me.addColSummary(item);
                if(o2){
                    retColumns.push(o2);
                }
            }
            
            // this part has to be done no matter if the column is added to the grid or not
            // the dataIndex is generated incrementally
            len = item.children.length;
            for(i = 0; i < len; i++){
                ret = me.parseTopAxisItem(item.children[i]);

                if(Ext.isArray(ret)){
                    Ext.Array.insert(columns, columns.length, ret);
                }else{
                    columns.push(ret);
                }
            }

            o1 = {
                text:           item.name,
                group:          item,
                columns:        columns,
                key:            item.key,
                xexpandable:    true,
                xgrouped:       true
            };
            if(item.level === 0){
                me.columns.push(o1);
            }
            retColumns.push(o1);

            if(me.colSubTotalsPosition == 'last'){
                o2 = me.addColSummary(item);
                if(o2){
                    retColumns.push(o2);
                }
            }

            if(me.colSubTotalsPosition == 'none'){
                o2 = me.addColSummary(item);
                if(o2){
                    retColumns.push(o2);
                }
            }

            return retColumns;
        }
    },
    
    /**
     * @private
     */
    addColSummary: function(item){
        var me = this,
            o2, doAdd = false;
            
        // add subtotal columns if required
        o2 = me.parseAggregateForColumn(item, {
            text:           item.expanded ? item.getTextTotal() : item.name,
            group:          item,
            subTotal:       true
        });

        if(item.level === 0){
            me.columns.push(o2);
        }

        Ext.apply(o2, {
            key:            item.key,
            xexpandable:    true,
            xgrouped:       true
        });
        return o2;
    },
    
    /**
     * @private
     */
    parseAggregateForColumn: function(item, config){
        var me = this,
            columns = [],
            column = {},
            dimensions = me.aggregate.getRange(),
            length = dimensions.length,
            i, agg;

        for(i = 0; i < length; i++){
            agg = dimensions[i];

            me.internalCounter++;
            me.model.push({
                name:           'c' + me.internalCounter,
                type:           'auto',
                defaultValue:   undefined,
                useNull:        true,
                col:            item ? item.key : me.grandTotalKey,
                agg:            agg.getId()
            });

            columns.push(Ext.merge({
                dataIndex:  'c' + me.internalCounter,
                text:       agg.header,
                topAxis:    true,   // generated based on the top axis
                subTotal:   (config ? config.subTotal === true : false),
                grandTotal: (config ? config.grandTotal === true : false),
                dimension:  agg
            }, agg.column));

            me.modelInfo['c' + me.internalCounter] = me.getDefaultFieldInfo({
                isColGroupTotal:    (config ? config.subTotal === true : false),
                isColGrandTotal:    (config ? config.grandTotal === true : false),
                topAxisColumn:      true,
                topAxisKey:         item ? item.key : me.grandTotalKey
            });
        }

        if(columns.length == 0 && me.aggregate.getCount() == 0){
            me.internalCounter++;
            column = Ext.apply({
                text:       item ? item.name : '',
                dataIndex:  'c' + me.internalCounter
            }, config || {});
        }else if(columns.length == 1){
            column = Ext.applyIf({
                text:   item ? item.name : ''
            }, columns[0]);
            Ext.apply(column, config || {});
            // if there is only one aggregate available then don't show the grand total text
            // use the aggregate header instead.
            if(config && config.grandTotal && me.aggregate.getCount() == 1){
                column.text = me.aggregate.getAt(0).header || config.text;
            }
        }else{
            column = Ext.apply({
                text:       item ? item.name : '',
                columns:    columns
            }, config || {});
        }
        return column;
    },
    
    /**
     * @private
     */
    buildPivotStore: function(){
        var me = this;
        
        if(Ext.isFunction(me.pivotStore.model.setFields)){
            me.pivotStore.model.setFields(me.model);
        }else{
            // ExtJS 5 has no "setFields" anymore so fallback to "replaceFields"
            me.pivotStore.model.replaceFields(me.model, true);
        }
        me.pivotStore.removeAll(true);

        Ext.Array.each(me.leftAxis.getTree(), me.addRecordToPivotStore, me);
        me.addGrandTotalsToPivotStore();
    },
    
    /**
     * @private
     */
    addGrandTotalsToPivotStore: function(){
        var me = this,
            totals = [],
            len, i, t;
            
        // first of all add the grand total
        totals.push({
            title:      me.textGrandTotalTpl,
            values:     me.preparePivotStoreRecordData({
                key: me.grandTotalKey
            }, {
                isRowGrandTotal:    true
            })
        });
        
        // additional grand totals can be added. collect these using events or 
        if(Ext.isFunction(me.onBuildTotals)){
            me.onBuildTotals(totals);
        }
        me.fireEvent('buildtotals', me, totals);
        
        // add records to the pivot store for each grand total
        len = totals.length;
        for(i = 0; i < len; i++){
            t = totals[i];
            if(Ext.isObject(t) && Ext.isObject(t.values)){
                Ext.applyIf(t.values, {
                    isRowGrandTotal:    true
                });
                me.totals.push({
                    title:      t.title || '',
                    record:     me.pivotStore.add(t.values)[0]
                });
            }
        }
    },
    
    /**
     * @private
     */
    addRecordToPivotStore: function(item){
        var me = this,
            record, dataIndex;

        if(!item.children){
            // we are on the deepest level so it's time to build the record and add it to the store
            record = me.pivotStore.add(me.preparePivotStoreRecordData(item))[0];
            item.record = record;
            // this should be moved into the function "preparePivotStoreRecordData"
            if(Ext.isFunction(me.onBuildRecord)){
                me.onBuildRecord(record, item);
            }
            me.fireEvent('recordbuilt', me, record, item);
        }else{

            // This group is expandable so let's generate records for the following use cases
            // - expanded group
            // - collapsed group
            // - footer for an expanded group that has rowSubTotalsPosition = last.
            // We define all these records on the group item so that we can update them as well
            // when we have an editable pivot. Without doing this we can't mark dirty records
            // in the pivot grid cells
            item.records = {};
            dataIndex = (me.viewLayoutType === 'compact' ? me.compactViewKey : item.dimensionId);

            // a collapsed group will always be the same
            item.records.collapsed = me.pivotStore.add(me.preparePivotStoreRecordData(item, {
                isRowGroupHeader:   true,
                isRowGroupTotal:    true
            }))[0];
            if(me.rowSubTotalsPosition === 'first' && me.viewLayoutType !== 'tabular'){
                item.records.expanded = me.pivotStore.add(me.preparePivotStoreRecordData(item, {
                    isRowGroupHeader:   true
                }))[0];
            }else {
                record = {};
                record[dataIndex] = item.name;
                record.isRowGroupHeader = true;

                item.records.expanded = me.pivotStore.add(record)[0];
                if(me.rowSubTotalsPosition === 'last' || me.viewLayoutType === 'tabular') {
                    record = me.preparePivotStoreRecordData(item, {
                        isRowGroupTotal:    true
                    });
                    record[dataIndex] = item.getTextTotal();
                    item.records.footer = me.pivotStore.add(record)[0];
                }
            }

            Ext.Array.each(item.children, me.addRecordToPivotStore, me);
        }
    },
    
    /**
     * Create an object using the pivot model and data of an axis item.
     * This object is used to create a record in the pivot store.
     *
     * @private
     */
    preparePivotStoreRecordData: function(group, values){
        var me = this,
            data = {},
            len = me.model.length,
            i, field, result;

        if(group) {
            if (group.dimensionId) {
                data[group.dimensionId] = group.name;
            }
            data.leftAxisKey = group.key;

            for(i = 0; i < len; i++){
                field = me.model[i];

                if (field.col && field.agg) {
                    //result = me.results.get(group.key, field.col);
                    // optimize this call
                    result = me.results.items.map[group.key + '/' + field.col];
                    //data[field.name] = result.getValue(field.agg);
                    //optimize this call
                    data[field.name] = result ? result.values[field.agg] : null;
                }
            }

            if (me.viewLayoutType === 'compact') {
                data[me.compactViewKey] = group.name;
            }
        }
        
        return Ext.applyIf(data, values);
    },
    
    /**
     * Returns the generated model fields
     *
     * @returns {Object[]} Array of config objects used to build the pivot store model fields
     */
    getColumns: function(){
        return this.model;
    },
    
    /**
     * Returns all generated column headers
     *
     * @returns {Object[]} Array of config objects used to build the pivot grid columns
     */
    getColumnHeaders: function(){
        var me = this;
        
        if(!me.model){
            me.buildModelAndColumns();
        }
        return me.columns;
    },
    
    /**
     *    Find out if the specified key belongs to a row group.
     *
     *    Returns FALSE if the key is not found.
     *
     *    Returns 0 if the current key doesn't belong to a group. That means that group children items will always be 0.
     *
     *    If it'a a group then it returns the level number which is always > 0.
     *
     * @param {String} key
     * @returns {Number/Boolean}
     */
    isGroupRow: function(key) {
        var obj = this.leftAxis.findTreeElement('key', key);

        if(!obj) return false;
        return (obj.node.children && obj.node.children.length == 0) ? 0 : obj.level;
    },
    
    /**
     *    Find out if the specified key belongs to a col group.
     *
     *    Returns FALSE if the key is not found.
     *
     *    Returns 0 if the current key doesn't belong to a group. That means that group children items will always be 0.
     *
     *    If it'a a group then it returns the level number which is always > 0.
     *
     * @param {String} key
     * @returns {Number/Boolean}
     */
    isGroupCol: function(key) {
        var obj = this.topAxis.findTreeElement('key', key);

        if(!obj) return false;
        return (obj.node.children && obj.node.children.length == 0) ? 0 : obj.level;
    },

    deprecated: {
        '6.0': {
            properties: {
                /**
                 * @cfg {String} mztype
                 *
                 * @deprecated 6.0 Use {@link #type} instead.
                 */
                mztype: 'type',

                /**
                 * @cfg {String} mztypeLeftAxis
                 * @deprecated 6.0 Use {@link #leftAxisType} instead.
                 *
                 * Define the type of left Axis this class uses. Specify here the pivotaxis alias.
                 */
                mztypeLeftAxis: 'leftAxisType',

                /**
                 * @cfg {String} mztypeTopAxis
                 * @deprecated 6.0 Use {@link #topAxisType} instead.
                 *
                 * Define the type of top Axis this class uses. Specify here the pivotaxis alias.
                 */
                mztypeTopAxis: 'topAxisType'
            }
        }
    }
});
