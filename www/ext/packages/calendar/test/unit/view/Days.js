describe("Ext.calendar.view.Days", function() {

    var D = Ext.Date,
        view, tzOffset, oldTzOffset;

    function makeRange(start, end) {
        return new Ext.calendar.date.Range(start, end);
    }

    function makeView(cfg) {
        cfg = Ext.apply({
            width: 800,
            height: 600
        }, cfg);
        view = new Ext.calendar.view.Days(cfg);
        view.render(Ext.getBody());
    }

    beforeEach(function() {
        tzOffset = 0;

        oldTzOffset = Ext.calendar.date.Util.getDefaultTimezoneOffset;
        Ext.calendar.date.Util.getDefaultTimezoneOffset = function() {
            return tzOffset;
        };

        this.addMatchers({
            toEqualRange: function(expected) {
                var actual = this.actual,
                    pass = actual.equals(expected);

                if (!pass) {
                    this.message = Ext.String.format(
                        'Expected range {0} - {1} to equal range {2}, {3}',
                        actual.start, actual.end, expected.start, expected.end);
                }

                return pass;
            }
        });
    });

    afterEach(function() {
        tzOffset = 0;
        Ext.calendar.date.Util.getDefaultTimezoneOffset = oldTzOffset;
        view = Ext.destroy(view);
    });

    function pad(v) {
        return Ext.String.leftPad(v.toString(), 2, '0');
    }

    function getHeaderCell(index) {
        // +1 for the gutter
        var header = view.getHeader(),
            cell = header.element.down('tr', true).cells[index + 1];

        // Check for spacer el
        if (cell && cell.className.indexOf(header.$headerCls) === -1) {
            cell = null;
        }
        return cell || null;
    }

    describe("view configurations", function() {
        describe("value", function() {
            it("should default to the current date, with the time cleared", function() {
                var d = new Date();
                makeView();
                expect(view.getValue()).toEqual(D.clearTime(d, true));
            });

            it("should accept a date object and clear the time", function() {
                makeView({
                    value: new Date(2011, 4, 1, 13, 12, 11)
                });
                expect(view.getValue()).toEqual(new Date(2011, 4, 1));
            });

            it("should not modify a passed date", function() {
                var d = new Date(2011, 4, 1, 13, 12, 11);
                makeView({
                    value: d
                });
                expect(view.getValue()).not.toBe(d);
                expect(d).toEqual(new Date(2011, 4, 1, 13, 12, 11));
            });
        });

        describe("sizing", function() {
            describe("column widths", function() {
                function makeWidthSuite(days) {
                    describe(days + " days", function() {
                        it("should stretch width evenly", function() {
                            makeView({
                                width: 600,
                                height: 600,
                                visibleDays: days
                            });

                            var availWidth = view.element.getWidth() - view.timeContainer.getWidth(),
                                colWidth = availWidth / days,
                                i;

                            for (i = 0; i < days; ++i) {
                                expect(Ext.fly(view.getColumn(0)).getWidth()).toBeWithin(1, colWidth);
                            }
                        });
                    });
                }

                makeWidthSuite(1);
                makeWidthSuite(2);
                makeWidthSuite(3);
                makeWidthSuite(4);
            });
        });

        describe("date ranges", function() {
            describe("visibleDays: 1", function() {
                it("should return the visible range", function() {
                    makeView({
                        visibleDays: 1,
                        value: new Date(2010, 0, 1)
                    });
                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 2)));
                });
            });

            describe("visibleDays: 2", function() {
                it("should return the visible range", function() {
                    makeView({
                        visibleDays: 2,
                        value: new Date(2010, 0, 1)
                    });
                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 3)));
                });
            });

            describe("visibleDays: 3", function() {
                it("should return the visible range", function() {
                    makeView({
                        visibleDays: 3,
                        value: new Date(2010, 0, 1)
                    });
                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 4)));
                });
            });

            describe("visibleDays: 4", function() {
                it("should return the visible range", function() {
                    makeView({
                        visibleDays: 4,
                        value: new Date(2010, 0, 1)
                    });
                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 5)));
                });
            });
        });

        describe("timeFormat", function() {
            function format1(hour) {
                return pad(hour) + ':00';
            }

            function format2(hour, ampm) {
                ampm = ampm || ['am', 'pm'];
                var suffix = ampm[hour < 12 ? 0 : 1];
                if (hour > 12) {
                    hour -= 12;
                }
                return hour + ':00 ' + suffix;
            }

            describe("at configuration time", function() {
                it("should default to 'H:i'", function() {
                    makeView();

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }
                });

                it("should accept a custom format", function() {
                    makeView({
                        timeFormat: 'g:i a'
                    });

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i));
                    }
                });

                it("should keep the format if the start/end changes", function() {
                    makeView({
                        timeFormat: 'g:i a'
                    });

                    view.setStartTime(10);
                    view.setEndTime(14);

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i));
                    }
                });
            });

            describe("after creation", function() {
                it("should be able to change the format", function() {
                    makeView();

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }

                    view.setTimeFormat('g:i a');
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i));
                    }

                    view.setTimeFormat('H:i');
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }
                });

                it("should keep the format when the start/end changes", function() {
                    makeView();

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    view.setTimeFormat('g:i a');
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i));
                    }

                    view.setStartTime(10);
                    view.setEndTime(14);

                    childNodes = view.timeContainer.dom.childNodes;
                    len = childNodes.length;
                    start = view.getStartTime();
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i));
                    }
                });
            });

            describe("localization", function() {
                var oldCode;

                beforeEach(function() {
                    oldCode = D.formatCodes.a;
                    D.formatCodes.a = '(m.getHours() < 12 ? "ym" : "zm")';
                });

                afterEach(function() {
                    D.formatCodes.a = oldCode;
                });

                it("should use localized values", function() {
                    makeView({
                        timeFormat: 'g:i a'
                    });

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i;

                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format2(start + i), ['ym', 'zm']);
                    }
                });
            });
        });

        describe("visibleDays", function() {
            function makeHeader() {
                var h = new Ext.calendar.header.Days();
                h.render(Ext.getBody());
                return h;
            }

            function add(d, n) {
                return D.add(d, D.DAY, n);
            }

            function format(d, add) {
                add = add || 0;
                d = D.add(d, D.DAY, add);
                return D.format(d, view.getHeader().getFormat());
            }

            describe("at configuration time", function() {
                describe("headers", function() {
                    it("should default to 4", function() {
                        var d = new Date(2010, 0, 1);

                        makeView({
                            header: makeHeader(),
                            value: d
                        });

                        expect(getHeaderCell(0)).hasHTML(format(d));
                        expect(getHeaderCell(1)).hasHTML(format(d, 1));
                        expect(getHeaderCell(2)).hasHTML(format(d, 2));
                        expect(getHeaderCell(3)).hasHTML(format(d, 3));
                        expect(getHeaderCell(4)).toBeNull();
                    });

                    it("should accept a custom value", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            header: makeHeader(),
                            value: d,
                            visibleDays: 2
                        });

                        expect(getHeaderCell(0)).hasHTML(format(d));
                        expect(getHeaderCell(1)).hasHTML(format(d, 1));
                        expect(getHeaderCell(2)).toBeNull();
                    });

                    it("should update the range when the value changes", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            header: makeHeader(),
                            value: d,
                            visibleDays: 2
                        });

                        d = D.add(d, D.DAY, 2);
                        view.setValue(d);

                        expect(getHeaderCell(0)).hasHTML(format(d));
                        expect(getHeaderCell(1)).hasHTML(format(d, 1));
                        expect(getHeaderCell(2)).toBeNull();
                    });
                });

                describe("columns", function() {
                    it("should default to 4", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            value: d
                        });

                        expect(view.getColumns().length).toBe(4);
                        expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 5)));
                    });

                    it("should accept a custom value", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            value: d,
                            visibleDays: 2
                        });

                        expect(view.getColumns().length).toBe(2);
                        expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 3)));
                    });

                    it("should update the range when the value changes", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            value: d,
                            visibleDays: 2
                        });

                        view.setValue(D.add(d, D.DAY, 2));

                        expect(view.getColumns().length).toBe(2);
                        expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 3), D.utc(2010, 0, 5)));
                    });
                });
            });

            describe("after creation", function() {
                describe("headers", function() {
                    it("should be able to change the number of days", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            header: makeHeader(),
                            value: d,
                            visibleDays: 2
                        });

                        view.setVisibleDays(4);

                        expect(getHeaderCell(0)).hasHTML(format(d));
                        expect(getHeaderCell(1)).hasHTML(format(d, 1));
                        expect(getHeaderCell(2)).hasHTML(format(d, 2));
                        expect(getHeaderCell(3)).hasHTML(format(d, 3));
                        expect(getHeaderCell(4)).toBeNull();
                    });

                    it("should retain the new value after changing the value", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            header: makeHeader(),
                            value: d,
                            visibleDays: 2
                        });

                        view.setVisibleDays(4);
                        d = D.add(d, D.DAY, 2);
                        view.setValue(d);

                        expect(getHeaderCell(0)).hasHTML(format(d));
                        expect(getHeaderCell(1)).hasHTML(format(d, 1));
                        expect(getHeaderCell(2)).hasHTML(format(d, 2));
                        expect(getHeaderCell(3)).hasHTML(format(d, 3));
                        expect(getHeaderCell(4)).toBeNull();
                    });
                });

                describe("columns", function() {
                    it("should be able to change the number of days", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            value: d,
                            visibleDays: 2
                        });

                        view.setVisibleDays(4);
                        expect(view.getColumns().length).toBe(4);
                        expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 1), D.utc(2010, 0, 5)));
                    });

                    it("should retain the new value after changing the value", function() {
                        var d = new Date(2010, 0, 1);
                        makeView({
                            value: d,
                            visibleDays: 2
                        });

                        view.setVisibleDays(4);
                        view.setValue(D.add(d, D.DAY, 2));

                        expect(view.getColumns().length).toBe(4);
                        expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 0, 3), D.utc(2010, 0, 7)));
                    });
                });
            });
        });

        describe("startTime/endTime", function() {
            function format1(hour) {
                return pad(hour) + ':00';
            }

            describe("at configuration time", function() {
                it("should default to 8-20", function() {
                    makeView({
                        visibleDays: 2
                    });

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i, markers;

                    expect(childNodes.length).toBe(12);
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }

                    for (i = 0; i < 2; ++i) {
                        markers = Ext.fly(view.getColumn(0)).query('.' + view.$markerCls);
                        expect(markers.length).toBe(12);
                    }
                });

                it("should accept a custom config", function() {
                    makeView({
                        visibleDays: 2,
                        startTime: 10,
                        endTime: 23
                    });

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i, markers;

                    expect(childNodes.length).toBe(13);
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }

                    for (i = 0; i < 2; ++i) {
                        markers = Ext.fly(view.getColumn(0)).query('.' + view.$markerCls);
                        expect(markers.length).toBe(13);
                    }
                });
            });

            describe("after configuration", function() {
                it("should be able to change the time", function() {
                    makeView({
                        visibleDays: 2
                    });

                    view.setTimeRange(10, 16);

                    var childNodes = view.timeContainer.dom.childNodes,
                        len = childNodes.length,
                        start = view.getStartTime(),
                        i, markers;

                    expect(childNodes.length).toBe(6);
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }

                    for (i = 0; i < 2; ++i) {
                        markers = Ext.fly(view.getColumn(0)).query('.' + view.$markerCls);
                        expect(markers.length).toBe(6);
                    }

                    view.setTimeRange(8, 18);

                    childNodes = view.timeContainer.dom.childNodes;
                    len = childNodes.length;
                    start = view.getStartTime();

                    expect(childNodes.length).toBe(10);
                    for (i = 0; i < len; ++i) {
                        expect(childNodes[i]).hasHTML(format1(start + i));
                    }

                    for (i = 0; i < 2; ++i) {
                        markers = Ext.fly(view.getColumn(0)).query('.' + view.$markerCls);
                        expect(markers.length).toBe(10);
                    }
                });
            });
        });
    });

});