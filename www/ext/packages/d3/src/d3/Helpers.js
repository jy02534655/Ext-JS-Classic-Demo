/**
 * @private
 */
Ext.define('Ext.d3.Helpers', {
    singleton: true,

    makeScale: function (config) {
        var type = config.type,
            Type, scale;
        //<debug>
        if (!type) {
            Ext.raise('The type of scale is not specified.');
        }
        //</debug>
        Type = type.charAt(0).toUpperCase() + type.substr(1);

        scale = this.make('scale' + Type, config);
        if ('nice' in config && scale.nice) {
            // mbostock: @Vitalyx Yes; scale.nice rounds the current domain.
            // So it has no effect if you subsequently set a new domain.
            scale.nice(this.eval(config.nice));
        }

        scale._type = type;

        return scale;
    },

    makeAxis: function (config) {
        var type = config.orient,
            Type, axis;
        //<debug>
        if (!type) {
            Ext.raise('The position of the axis ("orient" property) is not specified.');
        }
        //</debug>
        Type = type.charAt(0).toUpperCase() + type.substr(1);

        axis = this.make('axis' + Type, config);

        axis._type = type;

        return axis;
    },

    make: function (name, config) {
        return this.configure(d3[name](), config);
    },

    /**
     * @param {Function} thing A D3 entity instance, such as a scale or an axis.
     * @param {Object} config The configs to be set on the instance.
     * @return {Function} Configured `thing`.
     */
    configure: function (thing, config) {

        // Examples:
        // bandScale.round(true).align(0.7)    <-> configure(bandScale, {round: true, align: 0.7})
        // axis.ticks(d3.timeMinute.every(15)) <-> configure(axis, {ticks: 'd3.timeMinute.every(15)'})
        // scale.domain([0, 20])               <-> configure(scale, {domain: [0, 20]})
        // timeScale.nice(d3.timeSecond, 10)   <-> configure(timeScale, {$nice: ['d3.timeSecond', 10]})

        var key, arrayArgs, param;

        for (key in config) {
            arrayArgs = key.charAt(0) === '$';
            if (arrayArgs) {
                key = key.substr(1);
            }
            if (typeof thing[key] === 'function') {
                if (arrayArgs) {
                    param = config['$' + key].map(function (param) {
                        if (typeof param === 'string' && !param.search('d3.')) {
                            param = (new Function('return ' + param))();
                        }
                        return param;
                    });
                    thing[key].apply(thing, param);
                    arrayArgs = false;
                } else {
                    param = this.eval(config[key]);
                    thing[key](param);
                }
            }
        }
        return thing;
    },

    eval: function (param) {
        if (typeof param === 'string' && !param.search('d3.')) {
            param = (new Function('return ' + param))();
        }
        return param;
    },

    /**
     * See https://bugzilla.mozilla.org/show_bug.cgi?id=612118
     */
    isBBoxable: function (selection) {
        if (Ext.isFirefox) {
            if (selection) {
                if (selection instanceof Element) {
                    selection = d3.select(selection);
                }
                return document.contains(selection.node())
                    && selection.style('display') !== 'none'
                    && selection.attr('visibility') !== 'hidden';
            }
        }
        return true;
    },

    getBBox: function (selection) {
        var display = selection.style('display');

        if (display !== 'none') {
            return selection.node().getBBox();
        }
    },

    setDominantBaseline: function (element, baseline) {
        element.setAttribute('dominant-baseline', baseline);
        this.fakeDominantBaseline(element, baseline);
        if (Ext.isSafari && baseline === 'text-after-edge') {
            // dominant-baseline: text-after-edge doesn't work properly in Safari
            element.setAttribute('baseline-shift', 'super');
        }
    },

    noDominantBaseline: function () {
        // 'dominant-baseline' and 'alignment-baseline' don't work in IE and Edge.
        return Ext.isIE || Ext.isEdge;
    },

    fakeDominantBaselineMap: {
        'alphabetic': '0em',
        'ideographic': '-.24em',
        'hanging': '.72em',
        'mathematical': '.46em',
        'middle': '.22em',
        'central': '.33em',
        'text-after-edge': '-.26em',
        'text-before-edge': '.91em'
    },

    fakeDominantBaseline: function (element, baseline, force) {
        if (force || this.noDominantBaseline()) {
            var dy = this.fakeDominantBaselineMap[baseline];
            dy && element.setAttribute('dy', dy);
        }
    },

    fakeDominantBaselines: function (config) {
        var map = this.fakeDominantBaselineMap,
            selector, baseline, dy, nodeList, i, ln;

        // `config` is a map of the {selector: baseline} format.
        // Alternatively, the method takes two arguments: selector and baseline.

        if (this.noDominantBaseline()) {
            if (arguments.length > 1) {
                selector = arguments[0];
                baseline = arguments[1];
                nodeList = document.querySelectorAll(selector);
                dy = map[baseline];
                if (dy) {
                    for (i = 0, ln = nodeList.length; i < ln; i++) {
                        nodeList[i].setAttribute('dy', dy);
                    }
                }
            } else {
                for (selector in config) {
                    baseline = config[selector];
                    dy = map[baseline];
                    if (dy) {
                        nodeList = document.querySelectorAll(selector);
                        for (i = 0, ln = nodeList.length; i < ln; i++) {
                            nodeList[i].setAttribute('dy', dy);
                        }
                    }
                }
            }
        }
    },

    unitMath: function (string, operation, number) {
        var value = parseFloat(string),
            unit = string.substr(value.toString().length);

        switch (operation) {
            case '*':
                value *= number;
                break;
            case '+':
                value += number;
                break;
            case '/':
                value /= number;
                break;
            case '-':
                value -= number;
                break;
        }

        return value.toString() + unit;
    },

    getLinkId: function (link) {
        var pos = link.search('#'), // e.g. url(#path)
            id = link.substr(pos, link.length - pos - 1);

        return id;
    },

    alignRect: function (x, y, inner, outer, selection) {
        var tx, ty, translation;

        if (outer && inner) {
            switch (x) {
                case 'center':
                    tx = outer.width / 2 - (inner.x + inner.width / 2);
                    break;
                case 'left':
                    tx = -inner.x;
                    break;
                case 'right':
                    tx = outer.width - (inner.x + inner.width);
                    break;
                default:
                    Ext.raise('Invalid value. Valid `x` values are: center, left, right.');
            }
            switch (y) {
                case 'center':
                    ty = outer.height / 2 - (inner.y + inner.height / 2);
                    break;
                case 'top':
                    ty = -inner.y;
                    break;
                case 'bottom':
                    ty = outer.height - (inner.y + inner.height);
                    break;
                default:
                    Ext.raise('Invalid value. Valid `y` values are: center, top, bottom.');
            }
        }

        if (Ext.isNumber(tx) && Ext.isNumber(ty)) {
            tx += outer.x;
            ty += outer.y;
            translation = [tx, ty];
            selection.attr('transform', 'translate(' + translation + ')');
        }
    },

    commasRe: /,+/g,

    getTransformComponent: function (transform, name) {
        var pos = transform.indexOf(name),
            start, end, str, values, x, y;

        if (pos >= 0) {
            start = transform.indexOf('(', pos) + 1;
            end = transform.indexOf(')', start);
            if (start >= 0 && end >= 0) {
                str = transform.substr(start, end - start);
                str = str.replace(' ', ',');
                str = str.replace(this.commasRe, ',');
            }
        }

        if (str) {
            values = str.split(',');
            if (values.length > 1) {
                x = parseFloat(values[0]);
                y = parseFloat(values[1]);
                return [x, y];
            } else {
                x = parseFloat(values[0]);
                return [x];
            }
        }
    },

    parseTransform: function (str) {
        var scale = this.getTransformComponent(str, 'scale'),
            rotate = this.getTransformComponent(str, 'rotate'),
            translate = this.getTransformComponent(str, 'translate');

        if (scale) {
            if (scale.length < 2) {
                scale.push(scale[0]);
            }
        } else {
            scale = [0, 0];
        }

        rotate = rotate ? rotate[0] : 0;

        if (translate) {
            if (translate.length < 2) {
                translate.push(0);
            }
        } else {
            translate = [0, 0];
        }

        return {
            scale: scale,
            rotate: rotate,
            translate: translate
        }
    }

});