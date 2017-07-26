/**
 * This component extends the D3 TreeMap to work with a pivot matrix.
 *
 * Basically this component needs a pivot matrix to be configured. The values
 * calculated by the pivot matrix are distributed as following:
 *
 *  - `leftAxis` maps to TreeMap `colorAxis`
 *  - `aggregate` maps to TreeMap `nodeValue`
 *
 * Multiple dimensions can be configured on `leftAxis` but only one dimension
 * on the `aggregate`. `topAxis` dimensions are ignored.
 *
 */
Ext.define('Ext.pivot.d3.TreeMap', {
    extend: 'Ext.d3.hierarchy.TreeMap',
    xtype: 'pivottreemap',

    requires: [
        'Ext.pivot.matrix.Local',
        'Ext.pivot.matrix.Remote'
    ],

    config: {
        /**
         * @cfg {Boolean} autoExpand
         *
         * Should the generated tree items be expanded by default?
         */
        autoExpand: true,
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

        store: {
            type: 'tree',
            fields: [
                'name', 'value',
                { name: 'records', type: 'int' }
            ],
            root: {
                expanded: true,
                name: 'Root',
                children: []
            }
        },

        nodeValue: function (record){
            return record.data.value;
        },

        colorAxis: {
            scale: {
                range: ['#E45649', '#ECECEC', '#50A14F']
            },
            processor: function (axis, scale, node, field) {
                var record = node.data;
                return record.isLeaf() ? scale(record.get('depth') - 5) : '#ececec';
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

    onMatrixDataReady: function(matrix){
        //let's configure the treemap widget axis
        var me = this,
            zAxis = me.getColorAxis(),
            zDim = matrix.aggregate,
            root = me.getStore().getRoot(),
            dim;

        if(zDim.getCount() && zAxis){
            dim = zDim.getAt(0).getId();
            zAxis.setField(dim);
        }

        // let's update the data in the tree store
        var data = me.getTreeStoreData(matrix.leftAxis.getTree(), dim);
        if(root){
            root.removeAll();
            root.appendChild(data);
        }
        me.performLayout();
    },

    getTreeStoreData: function(tree, field){
        var ret = [],
            matrix = this.getMatrix(),
            expanded = this.getAutoExpand(),
            i, len, item, obj, result;

        if(tree && matrix){
            len = tree.length;
            for(i = 0; i < len; i++){
                item = tree[i];
                result = matrix.results.get(item.key, matrix.grandTotalKey);
                if(result) {
                    obj = {
                        path: item.key,
                        name: item.name,
                        value: result ? result.getValue(field) : null,
                        // the Remote matrix has no records in the result
                        records: result && result.records ? result.records.length : 0
                    };
                    if (item.children) {
                        obj.children = this.getTreeStoreData(item.children, field);
                        obj.expanded = expanded;
                    } else {
                        obj.leaf = true;
                    }
                    ret.push(obj);
                }
            }
        }

        return ret;
    }

});