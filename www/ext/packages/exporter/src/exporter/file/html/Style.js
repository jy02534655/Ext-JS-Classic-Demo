/**
 * @private
 */
Ext.define('Ext.exporter.file.html.Style', {
    extend: 'Ext.exporter.file.Style',

    idPrefix: 'ext-',
    indentation: 10,

    mappings: {
        readingOrder: {
            LeftToRight: 'ltr',
            RightToLeft: 'rtl',
            Context: 'initial',
            Automatic: 'initial'
        },

        horizontal: {
            Automatic: 'initial',
            Left: 'left',
            Center: 'center',
            Right: 'right',
            Justify: 'justify'
        },

        vertical: {
            Top: 'top',
            Bottom: 'bottom',
            Center: 'middle',
            Automatic: 'baseline'
        },

        lineStyle: {
            None:   'none',
            Continuous: 'solid',
            Dash: 'dashed',
            Dot: 'dotted'
        }
    },

    updateId: function(id) {
        if (id && !this.getName()) {
            this.setName('.' + id);
        }
    },

    render: function(){
        var cfg = this.getConfig(),
            map = this.mappings,
            s = '',
            align = cfg.alignment,
            font = cfg.font,
            borders = cfg.borders,
            interior = cfg.interior,
            i, length, name, border;

        if(align) {
            if (align.horizontal) {
                s += 'text-align: ' + map.horizontal[align.horizontal] + ';\n';
            }
            if (align.readingOrder) {
                s += 'direction: ' + map.readingOrder[align.readingOrder] + ';\n';
            }
            if (align.vertical) {
                s += 'vertical-align: ' + map.vertical[align.vertical] + ';\n';
            }
            if (align.indent) {
                s += 'padding-left: ' + (align.indent * this.indentation) + 'px;\n';
            }
        }

        if(font) {
            if (font.size) {
                s += 'font-size: ' + font.size + 'px;\n';
            }
            if (font.bold) {
                s += 'font-weight: bold;\n';
            }
            if (font.italic) {
                s += 'font-style: italic;\n';
            }
            if (font.strikeThrough) {
                s += 'text-decoration: line-through;\n';
            }
            if (font.underline === 'Single') {
                s += 'text-decoration: underline;\n';
            }
            if (font.color) {
                s += 'color: ' + font.color + ';\n';
            }
        }

        if(interior && interior.color){
            s += 'background-color: ' + interior.color + ';\n';
        }

        if(borders){
            length = borders.length;
            for(i = 0; i < length; i++){
                border = borders[i];
                name = 'border-' + border.position.toLowerCase();
                s += name + '-width: ' + (border.weight || 0) + 'px;\n';
                s += name + '-style: ' + (map.lineStyle[border.lineStyle] || 'initial') + ';\n';
                s += name + '-color: ' + (border.color || 'initial') + ';\n';
            }
        }

        return cfg.name + '{\n' + s + '}\n';
    }

});