describe("Ext.calendar.view.Week", function() {

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
        view = new Ext.calendar.view.Week(cfg);
        view.render(Ext.getBody());
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

        describe("date ranges", function() {
            var cfg;

            function makeHeader() {
                var h = new Ext.calendar.header.Days();
                h.render(Ext.getBody());
                return h;
            }

            beforeEach(function() {
                cfg = {
                    header: makeHeader()
                };
            });

            afterEach(function() {
                cfg = null;
            });

            function makeSuite(name, o) {
                describe(name, function() {
                    beforeEach(function() {
                        cfg.value = o.value;
                        makeView(cfg);
                    });

                    it("should set values correctly and render the correct range", function() {
                        var visible = o.visible,
                            current = visible[0],
                            format = view.getHeader().getFormat(),
                            i;


                        expect(view.getVisibleRange()).toEqualRange(makeRange(visible[0], visible[1]));
                        for (i = 0; i < cfg.visibleDays; ++i) {
                            expect(getHeaderCell(i)).hasHTML(D.format(current, format));
                            current = D.add(current, D.DAY, 1);
                        }
                    });
                });
            }

            describe("firstDayOfWeek: 0", function() {
                beforeEach(function() {
                    cfg.firstDayOfWeek = 0;
                });

                describe("visibleDays: 7", function() {
                    beforeEach(function() {
                        cfg.visibleDays = 7;
                    });

                    makeSuite("when the first day is at the start of the week", {
                        value: new Date(2016, 0, 10), // Sun
                        visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 17)]
                    });

                    makeSuite("when the first day is at the end of the week", {
                        value: new Date(2016, 0, 16), // Sat
                        visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 17)]
                    });

                    makeSuite("when the first day is in the middle of the week", {
                        value: new Date(2016, 0, 13), // Wed
                        visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 17)]
                    });
                });

                describe("visibleDays: 5", function() {
                    beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 0, 10), // Sun
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 15)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 0, 16), // Sat
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 15)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 0, 13), // Wed
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 15)]
                        });
                });
            });

            describe("firstDayOfWeek: 1", function() {
                beforeEach(function() {
                    cfg.firstDayOfWeek = 1;
                });

                describe("visibleDays: 7", function() {
                    beforeEach(function() {
                        cfg.visibleDays = 7;
                    });

                    makeSuite("when the first day is at the start of the week", {
                        value: new Date(2016, 0, 11), // Mon
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 18)]
                    });

                    makeSuite("when the first day is at the end of the week", {
                        value: new Date(2016, 0, 17), // Sun
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 18)]
                    });

                    makeSuite("when the first day is in the middle of the week", {
                        value: new Date(2016, 0, 13), // Wed
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 18)]
                    });
                });

                describe("visibleDays: 5", function() {
                    beforeEach(function() {
                        cfg.visibleDays = 5;
                    });

                    makeSuite("when the first day is at the start of the week", {
                        value: new Date(2016, 0, 11), // Mon
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 16)]
                    });

                    makeSuite("when the first day is at the end of the week", {
                        value: new Date(2016, 0, 17), // Sun
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 16)]
                    });

                    makeSuite("when the first day is in the middle of the week", {
                        value: new Date(2016, 0, 13), // Wed
                        visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 16)]
                    });
                });
            });
        });

        describe("firstDayOfWeek", function() {
            function makeHeader() {
                var h = new Ext.calendar.header.Days({
                    format: 'd-m'
                });
                h.render(Ext.getBody());
                return h;
            }

            describe("at configuration time", function() {
                it("should default to Ext.Date.firstDayOfWeek", function() {
                    makeView();
                    expect(view.getFirstDayOfWeek()).toBe(Ext.Date.firstDayOfWeek);
                });

                it("should set days from the default", function() {
                    makeView({
                        header: makeHeader(),
                        value: new Date(2016, 0, 10) //Sun
                    });

                    expect(getHeaderCell(0)).hasHTML('10-01');
                    expect(getHeaderCell(1)).hasHTML('11-01');
                    expect(getHeaderCell(2)).hasHTML('12-01');
                    expect(getHeaderCell(3)).hasHTML('13-01');
                    expect(getHeaderCell(4)).hasHTML('14-01');
                    expect(getHeaderCell(5)).hasHTML('15-01');
                    expect(getHeaderCell(6)).hasHTML('16-01');

                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2016, 0, 10), D.utc(2016, 0, 17)));
                });

                it("should set days from a custom value", function() {
                    makeView({
                        header: makeHeader(),
                        value: new Date(2016, 0, 11), // Mon
                        firstDayOfWeek: 1
                    });

                    expect(getHeaderCell(0)).hasHTML('11-01');
                    expect(getHeaderCell(1)).hasHTML('12-01');
                    expect(getHeaderCell(2)).hasHTML('13-01');
                    expect(getHeaderCell(3)).hasHTML('14-01');
                    expect(getHeaderCell(4)).hasHTML('15-01');
                    expect(getHeaderCell(5)).hasHTML('16-01');
                    expect(getHeaderCell(6)).hasHTML('17-01');

                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2016, 0, 11), D.utc(2016, 0, 18)));
                });
            });

            describe("after creation", function() {
                beforeEach(function() {
                    makeView({
                        header: makeHeader(),
                        value: new Date(2010, 0, 1)
                    });
                    view.setFirstDayOfWeek(1);
                });

                it("should change days", function() {
                    expect(getHeaderCell(0)).hasHTML('28-12');
                    expect(getHeaderCell(1)).hasHTML('29-12');
                    expect(getHeaderCell(2)).hasHTML('30-12');
                    expect(getHeaderCell(3)).hasHTML('31-12');
                    expect(getHeaderCell(4)).hasHTML('01-01');
                    expect(getHeaderCell(5)).hasHTML('02-01');
                    expect(getHeaderCell(6)).hasHTML('03-01');

                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2009, 11, 28), D.utc(2010, 0, 4)));
                });

                it("should keep the change when the value changes", function() {
                    view.setValue(new Date(2010, 5, 5));

                    expect(getHeaderCell(0)).hasHTML('31-05');
                    expect(getHeaderCell(1)).hasHTML('01-06');
                    expect(getHeaderCell(2)).hasHTML('02-06');
                    expect(getHeaderCell(3)).hasHTML('03-06');
                    expect(getHeaderCell(4)).hasHTML('04-06');
                    expect(getHeaderCell(5)).hasHTML('05-06');
                    expect(getHeaderCell(6)).hasHTML('06-06');

                    expect(view.getVisibleRange()).toEqualRange(makeRange(D.utc(2010, 4, 31), D.utc(2010, 5, 7)));
                });
            });
        });
    });
});