/**
 * This class contains all predefined aggregator functions for the pivot grid.
 *
 * For each summary function (ie `fn`) defined in this class there's a property name (ie `fnText`) which will be
 * used by the configurator plugin to display the function used for each aggregate dimension.
 *
 * Override this class if more aggregate functions are needed:
 *
 *      Ext.define('overrides.pivot.Aggregators', {
 *          override: 'Ext.pivot.Aggregators',
 *
 *          fnText: 'My special fn', // useful when using the Configurator plugin
 *          fn: function(records, measure, matrix, rowGroupKey, colGroupKey){
 *              var result;
 *
 *              // ... calculate the result
 *
 *              return result;
 *          }
 *      });
 *
 * @singleton
 */
Ext.define('Ext.pivot.Aggregators', {
    alternateClassName: [
        'Mz.aggregate.Aggregators'
    ],

    singleton: true,

    /**
     * @property {String} customText
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    customText: 'Custom',

    /**
     * @property {String} sumText
     *
     * Defines the name of the {@link #sum} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    sumText: 'Sum',
    
    /**
     * @property {String} avgText
     *
     * Defines the name of the {@link #avg} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    avgText: 'Avg',
    
    /**
     * @property {String} minText
     *
     * Defines the name of the {@link #min} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    minText: 'Min',
    
    /**
     * @property {String} maxText
     *
     * Defines the name of the {@link #max} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    maxText: 'Max',
    
    /**
     * @property {String} countText
     *
     * Defines the name of the {@link #count} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    countText: 'Count',
    
    /**
     * @property {String} countNumbersText
     *
     * Defines the name of the {@link #countNumbers} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    countNumbersText: 'Count numbers',

    /**
     * @property {String} groupSumPercentageText
     *
     * Defines the name of the {@link #groupSumPercentage} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    groupSumPercentageText: 'Group sum percentage',
    
    /**
     * @property {String} groupCountPercentageText
     *
     * Defines the name of the {@link #groupCountPercentage} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    groupCountPercentageText: 'Group count percentage',
    
    /**
     * @property {String} varianceText
     *
     * Defines the name of the {@link #variance} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    varianceText: 'Var',
    
    /**
     * @property {String} variancePText
     *
     * Defines the name of the {@link #varianceP} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    variancePText: 'Varp',
    
    /**
     * @property {String} stdDevText
     *
     * Defines the name of the {@link #stdDev} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    stdDevText: 'StdDev',
    
    /**
     * @property {String} stdDevPText
     *
     * Defines the name of the {@link #stdDevP} function.
     *
     * **Note:** Used by the {@link Ext.pivot.plugin.Configurator configurator plugin} when listing all functions that can
     * be used on an aggregate dimension.
     */
    stdDevPText: 'StdDevp',

    /**
     * Calculates the sum of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    sum: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            total = matrix.calculateAsExcel ? null : 0,
            i, value;

        // Excel works like this:
        // - if all values are null then sum is null
        // - if at least one value is not null then sum is not null (it's either 0 or some other number)

        for (i = 0; i < length; i++) {
            value = records[i].get(measure);
            if(value !== null) {
                if(total === null) {
                    total = 0;
                }
                if(typeof value === 'number') {
                    total += value;
                }
            }
        }

        return total;
    },

    /**
     * Calculates the avg of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    avg: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            asExcel = matrix.calculateAsExcel,
            total = asExcel ? null : 0,
            items = 0,
            i, value;

        // Excel works like this:
        // - it sums all numeric values
        // - it counts only the numeric values
        // - null and not numeric values are ignored

        for (i = 0; i < length; i++) {
            value = records[i].get(measure);
            if(typeof value === 'number') {
                if(total === null) {
                    total = 0;
                }
                total += value;
                items++;
            }
        }

        if(!asExcel) {
            items = length;
        }

        return (items > 0 && total !== null) ? (total / items) : null;
    },

    /**
     * Calculates the min of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    min: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            min = null,
            i, item, compare;

        // Excel works like this:
        // - if all values are null then min is null
        // - if all values are null except one that is a number then min is that number
        // - if all values are null except one that is a string then min is 0

        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            compare = true;

            if (matrix.calculateAsExcel) {
                if (item !== null) {
                    if (typeof item !== 'number') {
                        item = 0;
                        compare = false;
                    }

                    if (min === null) {
                        min = item;
                    }
                } else {
                    compare = false;
                }
            }

            if (compare && item < min) {
                min = item;
            }
        }

        return min;
    },

    /**
     * Calculates the max of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    max: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            max = null,
            i, item, compare;

        // Excel works like this:
        // - if all values are null then max is null
        // - if all values are null except one that is a number then max is that number
        // - if all values are null except one that is a string then max is 0

        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            compare = true;

            if (matrix.calculateAsExcel) {
                if (item !== null) {
                    if (typeof item !== 'number') {
                        item = 0;
                        compare = false;
                    }

                    if (max === null) {
                        max = item;
                    }
                } else {
                    compare = false;
                }
            }

            if (compare && item > max) {
                max = item;
            }
        }

        return max;
    },

    /**
     * Calculates the count of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    count: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            n = null,
            i, item;

        // Excel works like this:
        // - if all values are null then count is null
        // - count how many not-null values are

        if (matrix.calculateAsExcel) {
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);
                if (item !== null) {
                    if (n === null) {
                        n = 0;
                    }
                    n++;
                }
            }
        } else {
            n = length;
        }

        return n;
    },

    /**
     * Calculates the number of all numeric values in the records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    countNumbers: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var length = records.length,
            n = null,
            i, item;

        // Excel works like this:
        // - if all values are null then countNumbers is null
        // - if all values are null except one that is a string then countNumbers is 0
        // - count how many numeric values are

        for (i = 0; i < length; i++) {
            item = records[i].get(measure);
            if (item !== null) {
                if (n === null) {
                    n = 0;
                }
                if (typeof item === 'number') {
                    n++;
                }
            }
        }

        return matrix.calculateAsExcel ? n : n || 0;
    },

    /**
     * Calculates the percentage from the row group sum.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    groupSumPercentage: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var sumFn = Ext.pivot.Aggregators.sum,
            length = records.length,
            keys = rowGroupKey.split(matrix.keysSeparator),
            sum = null,
            sumParent = null,
            result, resultParent;
        
        if(!length) return null;
        
        keys.pop();
        keys = keys.join(matrix.keysSeparator);
        if(Ext.isEmpty(keys)){
            keys = matrix.grandTotalKey;
        }
        
        result = matrix.results.get(rowGroupKey, colGroupKey);
        if(result){
            if(result.hasValue('groupSum')) {
                sum = result.getValue('groupSum');
            } else {
                sum = result.calculateByFn('groupSum', measure, sumFn);
            }
        }
        
        resultParent = matrix.results.get(keys, colGroupKey);
        if(resultParent){
            if(resultParent.hasValue('groupSum')) {
                sumParent = resultParent.getValue('groupSum');
            } else {
                sumParent = resultParent.calculateByFn('groupSum', measure, sumFn);
            }
        }
        
        return (sumParent !== null && sum !== null && sumParent !== 0) ? sum/sumParent * 100 : null;
    },

    /**
     * Calculates the percentage from the row group count.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    groupCountPercentage: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var countFn = Ext.pivot.Aggregators.count,
            length = records.length,
            keys = rowGroupKey.split(matrix.keysSeparator),
            sum = null,
            sumParent = null,
            result, resultParent;
        
        if(!length) return null;
        
        keys.pop();
        keys = keys.join(matrix.keysSeparator);
        if(Ext.isEmpty(keys)){
            keys = matrix.grandTotalKey;
        }

        result = matrix.results.get(rowGroupKey, colGroupKey);
        if(result){
            if(result.hasValue('groupCount')) {
                sum = result.getValue('groupCount');
            } else {
                sum = result.calculateByFn('groupCount', measure, countFn);
            }
        }

        resultParent = matrix.results.get(keys, colGroupKey);
        if(resultParent){
            if(resultParent.hasValue('groupCount')) {
                sumParent = resultParent.getValue('groupCount');
            } else {
                sumParent = resultParent.calculateByFn('groupCount', measure, countFn);
            }
        }

        return (sumParent !== null && sum !== null && sumParent !== 0) ? sum/sumParent * 100 : null;
    },
    
    /**
     * Calculates the sample variance of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    variance: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var asExcel = matrix.calculateAsExcel,
            me = Ext.pivot.Aggregators,
            count = asExcel ? me.countNumbers.apply(me, arguments) : records.length,
            avg = me.avg.apply(me, arguments),
            length = records.length,
            total = 0,
            i, item;

        // Excel works like this:
        // - only numbers in the array are counted
        // - null values, logical values or text are ignored.

        if(avg > 0){
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);

                if(asExcel) {
                    if(typeof item === 'number') {
                        total += Math.pow(item - avg, 2);
                    }
                } else {
                    total += Math.pow(Ext.Number.from(item, 0) - avg, 2);
                }
            }
        }

        return (total > 0 && count > 1) ? (total / (count - 1)) : null;
    },

    /**
     * Calculates the population variance of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    varianceP: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var asExcel = matrix.calculateAsExcel,
            me = Ext.pivot.Aggregators,
            count = asExcel ? me.countNumbers.apply(me, arguments) : records.length,
            avg = me.avg.apply(me, arguments),
            length = records.length,
            total = 0,
            i, item;

        // Excel works like this:
        // - only numbers in the array are counted
        // - null values, logical values or text are ignored.

        if(avg > 0){
            for (i = 0; i < length; i++) {
                item = records[i].get(measure);

                if(asExcel) {
                    if(typeof item === 'number') {
                        total += Math.pow(item - avg, 2);
                    }
                } else {
                    total += Math.pow(Ext.Number.from(item, 0) - avg, 2);
                }
            }
        }

        return (total > 0 && count > 0) ? (total / count) : null;
    },

    /**
     * Calculates the sample standard deviation of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    stdDev: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var me = Ext.pivot.Aggregators,
            v = me.variance.apply(me, arguments);
        
        return v > 0 ? Math.sqrt(v) : null;
    },

    /**
     * Calculates the population standard deviation of all records using the measure field.
     *
     * @param {Array} records Records to process.
     * @param {String} measure Field to aggregate by.
     * @param {Ext.pivot.matrix.Base} matrix The matrix object reference.
     * @param {String} rowGroupKey Key of the left axis item.
     * @param {String} colGroupKey Key of the top axis item.
     *
     * @return {Number}
     */
    stdDevP: function(records, measure, matrix, rowGroupKey, colGroupKey) {
        var me = Ext.pivot.Aggregators,
            v = me.varianceP.apply(me, arguments);

        return v > 0 ? Math.sqrt(v) : null;
    }

});


