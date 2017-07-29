/**
 * This component extends the D3 HeatMap to work with a pivot matrix.
 *
 * Basically this component needs a pivot matrix to be configured. The values
 * calculated by the pivot matrix are distributed as following:
 *
 *  - `leftAxis` maps to HeatMap `xAxis`
 *  - `topAxis` maps to HeatMap `yAxis`
 *  - `aggregate` maps to HeatMap `colorAxis`
 *
 * The pivot matrix should be configured with maximum one dimension per
 * `leftAxis`, `topAxis` or `aggregate`.
 *
 */
Ext.define('Ext.pivot.d3.HeatMap', {
    extend: 'Ext.d3.HeatMap',
    xtype: 'pivotheatmap',

    requires: [
        'Ext.pivot.matrix.Local',
        'Ext.pivot.matrix.Remote'
    ],

    padding: {
        top: 20,
        right: 30,
        bottom: 20,
        left: 80
    },

    config: {
        /**
         * @cfg {String} defaultFormatter
         *
         * Default formatter used to render cells on colorAxis
         */
        defaultFormatter: 'number("0.00")',

        /**
         * @cfg {Ext.pivot.matrix.Base} matrix
         *
         * Pivot matrix specific configuration
         */
        matrix: {
            type: 'local',
            rowGrandTotalsPosition: 'none',
            colGrandTotalsPosition: 'none'
        },

        xAxis: {
            axis: {
                orient: 'bottom'
            },
            scale: {
                type: 'band'
            },
            step: 100
        },

        yAxis: {
            axis: {
                orient: 'left'
            },
            scale: {
                type: 'band'
            },
            step: 100
        },

        colorAxis: {
            scale: {
                type: 'linear',
                range: ['white', 'green']
            }
        },

        tiles: {
            attr: {
                'stroke': 'green',
                'stroke-width': 1
            },
            labels: true
        },

        legend: {
            docked: 'bottom',
            padding: 60,
            items: {
                count: 10,
                slice: [1],
                size: {
                    x: 40,
                    y: 20
                }
            }
        }

    },

    destroy: function(){
        this.setMatrix(null);
        this.callParent();
    },

    applyMatrix: function(matrix){
        if (matrix) {
            if (!matrix.isPivotMatrix) {
                if(!matrix.type){
                    matrix.type = 'local';
                }
                matrix.cmp = this;
                matrix = Ext.Factory.pivotmatrix(matrix);
            }
        }
        return matrix;
    },

    updateMatrix: function(matrix, oldMatrix){
        var me = this;

        Ext.destroy(oldMatrix, me.matrixListeners);
        me.matrixListeners = null;

        if(matrix) {
            me.matrixListeners = matrix.on({
                done: me.onMatrixDataReady,
                scope: me,
                destroyable: true
            });
        }
    },

    updateStore: Ext.emptyFn,
    updateXAxis: Ext.emptyFn,
    updateYAxis: Ext.emptyFn,
    updateColorAxis: Ext.emptyFn,

    onMatrixDataReady: function(matrix){
        //let's configure the heatmap widget axis
        var me = this,
            xAxis = me.getXAxis(),
            yAxis = me.getYAxis(),
            zAxis = me.getColorAxis(),
            xDim = matrix.topAxis.dimensions,
            yDim = matrix.leftAxis.dimensions,
            zDim = matrix.aggregate,
            dim;

        if(xDim.getCount() && xAxis){
            dim = xDim.getAt(0);
            xAxis.setField(dim.getDataIndex());
            xAxis.setTitle({
                text: dim.getHeader()
            });
        }
        if(yDim.getCount() && yAxis){
            dim = yDim.getAt(0);
            yAxis.setField(dim.getDataIndex());
            yAxis.setTitle({
                text: dim.getHeader()
            });
        }
        if(zDim.getCount() && zAxis){
            dim = zDim.getAt(0);
            zAxis.setField(dim.getId());
        }

        this.processData();
        this.performLayout();
    },

    bindFormatter: function (format, scope) {
        var me = this;

        return function (v) {
            return format(v, scope || me.resolveListenerScope());
        };
    },

    getStoreData: function(){
        var me = this,
            matrix = me.getMatrix(),
            leftItems = matrix.leftAxis.getTree(),
            lenLeft = leftItems.length,
            topItems = matrix.topAxis.getTree(),
            lenTop = topItems.length,
            items = [],
            xAxis = me.getXAxis(),
            yAxis = me.getYAxis(),
            colorAxis = me.getColorAxis(),

            xField = xAxis.getField(),
            yField = yAxis.getField(),
            zField = colorAxis.getField(),

            i, j, leftItem, topItem, result, obj, value;

        for(i = 0; i < lenLeft; i++){
            leftItem = leftItems[i];
            for(j = 0; j < lenTop; j++){
                topItem = topItems[j];
                result = matrix.results.get(leftItem.key, topItem.key);
                obj = { data: { }};
                obj.data[xField] = topItem.name;
                obj.data[yField] = leftItem.name;
                obj.data[zField] = result ? result.getValue(zField) : null;
                obj.data['records'] = result ? result.records.length : 0;

                items.push(obj);
            }
        }

        return items;
    },

    onUpdateTiles: function(selection){
        var me = this,
            matrix = me.getMatrix(),
            colorAxis = me.getColorAxis(),
            colorField = colorAxis.getField(),
            dimension, formatter, scope, parser;

        if(matrix.aggregate.getCount()){
            dimension = matrix.aggregate.getAt(0);
            formatter = dimension.getFormatter() || me.getDefaultFormatter();
            scope = dimension.getScope();

            parser = Ext.app.bind.Parser.fly(formatter);
            formatter = me.bindFormatter(parser.compileFormat(), scope);
            parser.release();
        }

        me.callParent([selection]);

        selection.select('text')
            .text(function (item) {
                var v = item.data[colorField] || null;

                if(v!== null && dimension && formatter){
                    v = formatter(v);
                }
                return v !== null ? v : null;
            });
    }

});