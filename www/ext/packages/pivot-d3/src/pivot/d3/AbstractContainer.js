/**
 * This container can host D3 drawing components that need a pivot configurator
 * plugin.
 */
Ext.define('Ext.pivot.d3.AbstractContainer', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.pivot.d3.HeatMap',
        'Ext.pivot.plugin.Configurator'
    ],

    // this makes the pivot configurator plugin work with this container
    isPivotComponent: true,

    config: {
        /**
         * @cfg {Ext.pivot.matrix.Base} matrix (required)
         *
         * This is the pivot matrix used by the pivot D3 container. All axis and aggregate dimensions should
         * be defined here.
         *
         * Needed by this pivot container so that the configurator plugin can call getMatrix.
         *
         * This matrix is also used by the {@link #drawing}.
         */
        matrix: {
            type: 'local'
        },

        /**
         * @cfg {Ext.Component} drawing
         *
         * Configuration object for the item that will be added to this container
         */
        drawing: {
            xtype: 'pivotheatmap'
        },

        /**
         * @cfg {Ext.pivot.plugin.Configurator} configurator
         *
         * Configuration object for the pivot Configurator plugin.
         */
        configurator: null
    },

    destroy: function(){
        this.setMatrix(null);
        this.callParent();
    },

    addDrawing: function(){
        this.add(Ext.applyIf({
            matrix: this.getMatrix()
        }, this.getDrawing()));
    },

    applyMatrix: function(newMatrix, oldMatrix){
        Ext.destroy(oldMatrix);

        if(newMatrix == null){
            return newMatrix;
        }

        if(newMatrix && newMatrix.isPivotMatrix){
            newMatrix.cmp = this;
            return newMatrix;
        }

        Ext.applyIf(newMatrix, {
            type: 'local'
        });
        newMatrix.cmp = this;

        return Ext.Factory.pivotmatrix(newMatrix);
    },

    applyConfigurator: function(plugin){
        return plugin ? this.addPlugin(plugin) : null;
    },

    updateConfigurator: function(plugin, oldPlugin){
        if(oldPlugin){
            this.removePlugin(oldPlugin);
        }
    }

});