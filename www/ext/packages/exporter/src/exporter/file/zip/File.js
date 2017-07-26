/**
 * Implementation of a file stored inside a zip archive
 *
 * @private
 */
Ext.define('Ext.exporter.file.zip.File', {
    extend: 'Ext.Base',

    requires: [
        'Ext.overrides.exporter.util.Format'
    ],

    config: {
        path: '',
        data: null,
        dateTime: null,
        folder: false
    },

    constructor: function(config){
        var me = this;

        me.initConfig(config);
        if(!me.getDateTime()){
            me.setDateTime(new Date());
        }
        return me.callParent([config]);
    },

    getId: function(){
        return this.getPath();
    },

    crc32: function (input, crc) {
        var table = this.self.crcTable,
            x = 0,
            y = 0,
            b = 0,
            isArray;

        // this method uses code from https://github.com/Stuk/jszip

        if (typeof input === "undefined" || !input.length) {
            return 0;
        }

        isArray = (typeof input !== "string");

        if (typeof(crc) == "undefined") {
            crc = 0;
        }

        crc = crc ^ (-1);
        for (var i = 0, iTop = input.length; i < iTop; i++) {
            b = isArray ? input[i] : input.charCodeAt(i);
            y = (crc ^ b) & 0xFF;
            x = table[y];
            crc = (crc >>> 8) ^ x;
        }

        return crc ^ (-1);
    },

    getHeader: function(offset){
        var data = this.getData(),
            path = this.getPath(),
            utfName = Ext.util.Base64._utf8_encode(path),
            useUTF8 = utfName !== path,
            dateTime = this.getDateTime(),
            extraFields = '',
            unicodePathExtraField = '',
            decToHex = Ext.util.Format.decToHex,
            header = '',
            dosTime, dosDate, fileHeader, dirHeader;

        // this method uses code from https://github.com/Stuk/jszip

        dosTime = dateTime.getHours();
        dosTime = dosTime << 6;
        dosTime = dosTime | dateTime.getMinutes();
        dosTime = dosTime << 5;
        dosTime = dosTime | dateTime.getSeconds() / 2;

        dosDate = dateTime.getFullYear() - 1980;
        dosDate = dosDate << 4;
        dosDate = dosDate | (dateTime.getMonth() + 1);
        dosDate = dosDate << 5;
        dosDate = dosDate | dateTime.getDate();

        if (useUTF8) {
            unicodePathExtraField =
                // Version
                decToHex(1, 1) +
                    // NameCRC32
                decToHex(this.crc32(utfName), 4) +
                    // UnicodeName
                utfName;

            extraFields +=
                // Info-ZIP Unicode Path Extra Field
                "\x75\x70" +
                    // size
                decToHex(unicodePathExtraField.length, 2) +
                    // content
                unicodePathExtraField;
        }

        // version needed to extract
        header += "\x0A\x00";
        // general purpose bit flag
        // set bit 11 if utf8
        header += useUTF8 ? "\x00\x08" : "\x00\x00";
        // compression method
        header += "\x00\x00";
        // last mod file time
        header += decToHex(dosTime, 2);
        // last mod file date
        header += decToHex(dosDate, 2);
        // crc-32
        header += decToHex(data ? this.crc32(data) : 0, 4);
        // compressed size
        header += decToHex(data ? data.length : 0, 4);
        // uncompressed size
        header += decToHex(data ? data.length : 0, 4);
        // file name length
        header += decToHex(utfName.length, 2);
        // extra field length
        header += decToHex(extraFields.length, 2);

        fileHeader = "PK\x03\x04" + header + utfName + extraFields;

        dirHeader =
                // central file header
            "PK\x01\x02" +
                // version made by (00: DOS)
            "\x14\x00" +
                // file header (common to file and central directory)
            header +
                // file comment length
            "\x00\x00" +
                // disk number start
            "\x00\x00" +
                // internal file attributes TODO
            "\x00\x00" +
                // external file attributes
            (this.getFolder() === true ? "\x10\x00\x00\x00" : "\x00\x00\x00\x00") +
                // relative offset of local header
            decToHex(offset, 4) +
                // file name
            utfName +
                // extra field
            extraFields;


        return {
            fileHeader: fileHeader,
            dirHeader: dirHeader,
            data: data || ''
        };

    }
}, function(File){
    var c, table = [];

    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }

    File.crcTable = table;
});