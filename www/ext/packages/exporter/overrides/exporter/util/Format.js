Ext.define('Ext.overrides.exporter.util.Format', {
    override: 'Ext.util.Format',

    /**
     * Transform an integer into a string in hexadecimal.
     *
     * @param {Number} dec The number to convert.
     * @param {Number} bytes The number of bytes to generate.
     * @return {String} The result.
     */
    decToHex: function(dec, bytes) {
        var hex = '',
            i;

        // this method uses code from https://github.com/Stuk/jszip

        for (i = 0; i < bytes; i++) {
            hex += String.fromCharCode(dec & 0xff);
            dec = dec >>> 8;
        }
        return hex;
    }

});