/**
 * Provides DOM helper methods for calendar.
 *
 * @private
 */
Ext.define('Ext.calendar.util.Dom', {
    singleton: true,

    /**
     * Extract the positions for the childnodes of an element.
     * @param {Ext.dom.Element/HTMLElement} parentNode The parent node.
     * @param {String} method The position method to call. Should be a
     * Ext.dom.Element method.
     * @return {Number[]} The values.
     *
     * @private
     */
    extractPositions: function(parentNode, method) {
        var len = parentNode.length,
            pos = [],
            i;

        for (i = 0; i < len; ++i) {
            pos.push(Ext.fly(parentNode[i])[method]());
        }

        return pos;
    },

    /**
     * Find index via the positions.
     * @param {Number[]} positions The positions to check against.
     * @param {Number} pos The position to match.
     * @return {Number} The index.
     *
     * @private
     */
    getIndexPosition: function(positions, pos) {
        var len = positions.length,
            index, i;

        if (pos < positions[0]) {
            index = 0;
        } else if (pos > positions[len - 1]) {
            index = len - 1;
        } else {
            for (i = len - 1; i >= 0; --i) {
                if (pos > positions[i]) {
                    index = i;
                    break;
                }
            }
        }

        return index;
    }
});