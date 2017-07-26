/**
 * This exporter produces HTML files for the supplied data.
 */
Ext.define('Ext.exporter.text.Html', {
    extend: 'Ext.exporter.Base',

    alias: 'exporter.html',

    requires: [
        'Ext.exporter.file.html.Doc'
    ],

    config: {
        tpl: [
            '<!DOCTYPE html>\n',
            '<html>\n',
            '   <head>\n',
            '       <meta charset="{charset}">\n',
            '       <title>{title}</title>\n',
            '       <style>\n',
            '       table { border-collapse: collapse; border-spacing: 0; }\n',
            '<tpl if="styles"><tpl for="styles.getRange()">{[values.render()]}</tpl></tpl>',
            '       </style>\n',
            '   </head>\n',
            '   <body>\n',
            '       <h1>{title}</h1>\n',
            '       <table>\n',
            '           <thead>\n',
            '<tpl for="table.columns">',
            '               <tr>\n',
            '<tpl for=".">',
            '                   <th<tpl if="width"> width="{width}"</tpl><tpl if="mergeAcross"> colSpan="{mergeAcross}"</tpl><tpl if="mergeDown"> rowSpan="{mergeDown}"</tpl>>{text}</th>\n',
            '</tpl>',
            '               </tr>\n',
            '</tpl>',
            '           </thead>\n',
            '           <tbody>\n',
            '<tpl for="table.rows">',
            '               <tr<tpl if="cls"> class="{cls}"</tpl>>\n',
            '<tpl for="cells">',
            '                   <td<tpl if="cls"> class="{cls}"</tpl><tpl if="mergeAcross"> colSpan="{mergeAcross}"</tpl><tpl if="mergeDown"> rowSpan="{mergeDown}"</tpl>>{value}</td>\n',
            '</tpl>',
            '               </tr>\n',
            '</tpl>',
            '           </tbody>\n',
            '           <tfoot>\n',
            '               <tr>\n',
            '                   <th<tpl if="table.columnsCount"> colSpan="{table.columnsCount}"</tpl>>&nbsp;</th>\n',
            '               </tr>\n',
            '           </tfoot>\n',
            '       </table>\n',
            '   </body>\n',
            '</html>'
        ],

        /**
         * @cfg {Ext.exporter.file.html.Style} defaultStyle
         *
         * Default style applied to all cells
         */
        defaultStyle: {
            name: 'table tbody td, table thead th',
            alignment: {
                vertical: 'Top'
            },
            font: {
                fontName: 'Arial',
                size: 12,
                color: '#000000'
            },
            borders: [{
                position: 'Left',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            },{
                position: 'Right',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            }]
        },

        /**
         * @cfg {Ext.exporter.file.html.Style} titleStyle
         *
         * Default style applied to the title
         */
        titleStyle: {
            name: 'h1',
            font: {
                fontName: 'Arial',
                size: 18,
                color: '#1F497D'
            }
        },

        /**
         * @cfg {Ext.exporter.file.html.Style} groupHeaderStyle
         *
         * Default style applied to the group headers
         */
        groupHeaderStyle: {
            name: '.groupHeader td',
            borders: [{
                position: 'Top',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            },{
                position: 'Bottom',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            }]
        },

        /**
         * @cfg {Ext.exporter.file.html.Style} groupFooterStyle
         *
         * Default style applied to the group footers
         */
        groupFooterStyle: {
            name: '.groupFooter td',
            borders: [{
                position: 'Bottom',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            }]
        },

        /**
         * @cfg {Ext.exporter.file.html.Style} tableHeaderStyle
         *
         * Default style applied to the table headers
         */
        tableHeaderStyle: {
            name: 'table thead th',
            alignment: {
                horizontal: 'Center',
                vertical: 'Center'
            },
            borders: [{
                position: 'Top',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            },{
                position: 'Bottom',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            }],
            font: {
                fontName: 'Arial',
                size: 12,
                color: '#1F497D'
            }
        },
        /**
         * @cfg {Ext.exporter.file.html.Style} tableFooterStyle
         *
         * Default style applied to the table footer
         */
        tableFooterStyle: {
            name: 'table tfoot th',
            borders: [{
                position: 'Top',
                lineStyle: 'Continuous',
                weight: 1,
                color: '#4F81BD'
            }]
        }
    },

    fileName: 'export.html',
    mimeType: 'text/html',

    getContent: function(){
        var me = this,
            config = me.getConfig(),
            data = config.data,
            table = {
                columnsCount: 0,
                columns: [],
                rows: []
            },
            colMerge, html;

        me.doc = new Ext.exporter.file.html.Doc({
            title:  config.title,
            author: config.author,
            tpl:    config.tpl,
            styles: [ config.defaultStyle, config.titleStyle, config.groupHeaderStyle, config.groupFooterStyle, config.tableHeaderStyle, config.tableFooterStyle ]
        });

        if(data) {
            colMerge = data.getColumnCount();
            Ext.apply(table, {
                columnsCount: data.getColumnCount(),
                columns: me.buildHeader(),
                rows: me.buildRows(data, colMerge, 0)
            });
        }
        me.doc.setTable(table);

        html = me.doc.render();
        me.doc = me.columnStyles = Ext.destroy(me.doc);

        return html;
    },

    buildRows: function (group, colMerge, level) {
        var me = this,
            showSummary = me._showSummary,
            result = [],
            groups, row, i, j, k, gLen, rLen, cLen, cell,
            r, cells, oneLine, style, text;

        if(!group) {
            return result;
        }

        me.doc.addStyle({
            id: '.levelHeader' + level,
            name: '.levelHeader' + level,
            alignment: {
                Horizontal: 'Left',
                Indent: (level > 0 ? level : 0) * 5
            }
        });
        me.doc.addStyle({
            id: '.levelFooter' + level,
            name: '.levelFooter' + level,
            alignment: {
                Horizontal: 'Left',
                Indent: (level > 0 ? level : 0) * 5
            }
        });

        groups = group._groups;
        text = group._text;

        // if the group has no subgroups and no rows then show only summaries
        oneLine = (!groups && !group._rows);

        if (!Ext.isEmpty(text) && !oneLine) {
            result.push({
                cls: 'groupHeader',
                cells: [{value: text, mergeAcross: colMerge, cls: 'levelHeader' + level}]
            });
        }

        if(groups) {
            gLen = groups.length;
            for (i = 0; i < gLen; i++) {
                Ext.Array.insert(result, result.length, me.buildRows(groups.items[i], colMerge, level + 1));
            }
        }

        if(group._rows) {
            rLen = group._rows.length;

            for(j = 0; j < rLen; j++){
                row = [];
                r = group._rows.items[j];
                cells = r._cells;
                cLen = cells.length;
                for(k = 0; k < cLen; k++){
                    cell = cells.items[k].getConfig();
                    style = me.columnStyles[k];
                    if(style) {
                        cell.cls = style._id + (cell.style ? ' ' + me.doc.addStyle(cell.style)._id : '');
                        cell.value = style.getFormattedValue(cell.value);
                    }
                    row.push(cell);
                }
                result.push({
                    cells: row
                });
            }
        }

        if( group._summaries && (showSummary || oneLine) ){
            rLen = group._summaries.length;

            for(j = 0; j < rLen; j++){
                row = [];
                r = group._summaries.items[j];
                cells = r._cells;
                cLen = cells.length;
                for(k = 0; k < cLen; k++){
                    cell = cells.items[k].getConfig();
                    style = me.columnStyles[k];
                    cell.cls = (k === 0 ? 'levelFooter' + level : '');
                    if(style) {
                        cell.cls += ' ' + style.getId() + (cell.style ? ' ' + me.doc.addStyle(cell.style).getId() : '');
                        cell.value = style.getFormattedValue(cell.value);
                    }
                    row.push(cell);
                }
                result.push({
                    cls: 'groupFooter' + (oneLine ? ' groupHeader' : ''),
                    cells: row
                });
            }
        }

        return result;
    },

    buildHeader: function () {
        var me = this,
            ret = {},
            data = me.getData(),
            arr, lenCells, i, style;

        me.buildHeaderRows(data.getColumns(), ret);

        arr = data.getBottomColumns();
        lenCells = arr.length;
        me.columnStyles = [];

        for(i = 0; i < lenCells; i++){
            style = arr[i].getStyle() || {};
            if(!style.id){
                style.id = Ext.id();
            }
            style.name = '.' + style.id;
            me.columnStyles.push(me.doc.addStyle(style));
        }

        return Ext.Object.getValues(ret);
    },

    buildHeaderRows: function (columns, result) {
        var col, i, len, name, s;

        if (!columns) {
            return;
        }

        len = columns.length;
        for (i = 0; i < len; i++) {
            col = columns.items[i].getConfig();

            name = 's' + col.level;
            result[name] = result[name] || [];


            if(col.mergeAcross){
                col.mergeAcross++;
            }

            if(col.mergeDown){
                col.mergeDown++;
            }

            result[name].push(col);

            this.buildHeaderRows(col.columns, result);
        }
    }

});