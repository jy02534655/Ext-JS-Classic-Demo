describe("Ext.calendar.view.Month", function() {

    var D = Ext.Date,
        view, tzOffset, oldTzOffset;

    function makeRange(start, end) {
        return new Ext.calendar.date.Range(start, end);
    }

    function makeView(cfg) {
        view = new Ext.calendar.view.Month(cfg);
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

    function getHeaderCell(day) {
        return view.getHeaderCell(day);
    }

    function getHeaderCellByIndex(index) {
        var cell = getHeaderCell(0);
        return cell.parentNode.childNodes[index];
    }

    function getCell(date) {
        if (!Ext.isDate(date)) {
            date = D.parse(date, 'Y-m-d');
        }
        return view.getCell(date);
    }

    function getCellByIndex(index) {
        var d = D.add(view.active.visibleRange[0], D.DAY, index);

        return view.getCell(d);
    }

    function isVisible(cell) {
        if (typeof cell === 'number') {
            cell = getCellByIndex(cell);
        }
        return Ext.fly(cell).isVisible(true);
    }

    function expectRange(expectedRange, weeks) {
        weeks = weeks || 6;

        expectedRange = makeRange(expectedRange[0], expectedRange[1]);

        var range = view.getVisibleRange(),
            current = range.start,
            visibleDays = view.getVisibleDays(),
            count = 0,
            cell, visible, i;

        expect(range).toEqualRange(expectedRange);

        for (i = 0; i < 42; ++i) {
            cell = getCell(current);
            visible = count % 7 < visibleDays && i < weeks * 7;

            expectDayText(cell, current.getDate().toString());
            expect(isVisible(cell)).toBe(visible);

            ++count;
            current = D.add(current, D.DAY, 1);
        }
    }

    function expectDayText(cell, text) {
        expect(cell.firstChild.firstChild).hasHTML(text);
    }

    describe("view only, without events", function() {
        describe("value", function() {
            it("should default to the first day of the current month with the time cleared", function() {
                var d = new Date();
                makeView();
                expect(view.getValue()).toEqual(new Date(d.getFullYear(), d.getMonth(), 1));
            });

            it("should accept a date object and clear the time", function() {
                makeView({
                    value: new Date(2011, 4, 1, 3, 4, 5)
                });
                expect(view.getValue()).toEqual(new Date(2011, 4, 1));
            });

            it("should choose the first date of the passed value", function() {
                makeView({
                    value: new Date(2011, 4, 5, 3, 4, 5)
                });
                expect(view.getValue()).toEqual(new Date(2011, 4, 1));
            });

            it("should not modify a passed date", function() {
                var d = new Date(2011, 4, 2, 13, 12, 11);
                makeView({
                    value: d
                });
                expect(view.getValue()).not.toBe(d);
                expect(view.getValue()).toEqual(new Date(2011, 4, 1));
                expect(d).toEqual(new Date(2011, 4, 2, 13, 12, 11));
            });
        });

        describe("sizing", function() {
            describe("row heights", function() {
                function makeHeightSuite(value, weeks, auto) {
                    it("should stretch height evenly", function() {
                        makeView({
                            width: 600,
                            height: 600,
                            value: value,
                            visibleWeeks: auto === true ? null : 6
                        });

                        var rowHeight = view.cellTable.getHeight() / weeks,
                            rows = view.cellTable.query('.' + view.$rowCls);

                        Ext.Array.forEach(rows, function(row) {
                            // Allow a fudge factor of 1px either side to account for
                            // uneven row sizing because of % based heights
                            if (isVisible(row)) {
                                expect(Ext.fly(row).getHeight()).toBeWithin(1, rowHeight);
                            } else {
                                expect(Ext.fly(row).getHeight()).toBe(0);
                            }
                        });
                    });
                }

                describe("visibleWeeks: null", function() {
                    describe("4 week month", function() {
                        makeHeightSuite(new Date(2009, 1, 1), 4, true);
                    });

                    describe("5 week month", function() {
                        makeHeightSuite(new Date(2002, 11, 1), 5, true);
                    });

                    describe("6 week month", function() {
                        makeHeightSuite(new Date(2001, 11, 1), 6, true);
                    });
                });

                describe("visibleWeeks: 6", function() {
                    describe("4 week month", function() {
                        makeHeightSuite(new Date(2009, 1, 1), 6);
                    });

                    describe("5 week month", function() {
                        makeHeightSuite(new Date(2002, 11, 1), 6);
                    });

                    describe("6 week month", function() {
                        makeHeightSuite(new Date(2001, 11, 1), 6);
                    });
                });
            });
        });

        describe("date ranges", function() {
            var cfg;

            beforeEach(function() {
                cfg = {};
            });

            afterEach(function() {
                cfg = null;
            });

            function makeSuite(name, o) {
                describe(name, function() {
                    beforeEach(function() {
                        cfg.value = new Date(o.value[0], o.value[1], 1);
                        makeView(cfg);
                    });

                    it("should set values correctly and render the correct range", function() {
                        expectRange(o.visible, o.weeks);
                    });
                });
            }

            // These are the 2 most common across calendars
            describe("firstDayOfWeek: 0", function() {
                beforeEach(function() {
                    cfg.firstDayOfWeek = 0;
                });

                describe("visibleWeeks: null", function() {
                    beforeEach(function() {
                        cfg.visibleWeeks = null;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2006, 0, 1), D.utc(2006, 1, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2005, 0], // Saturday
                                visible: [D.utc(2004, 11, 26), D.utc(2005, 1, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 29), D.utc(2003, 1, 2)],
                                weeks: 5
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 1, 1), D.utc(2004, 2, 7)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2020, 1], // Saturday
                                    visible: [D.utc(2020, 0, 26), D.utc(2020, 2, 1)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 29), D.utc(2012, 2, 4)],
                                    weeks: 5
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 1, 1), D.utc(2009, 2, 1)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2014, 1], // Saturday
                                    visible: [D.utc(2014, 0, 26), D.utc(2014, 2, 2)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 29),D.utc(2006, 2, 5)],
                                    weeks: 5
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 11, 1), D.utc(2003, 0, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 11], // Saturday
                                visible: [D.utc(2001, 10, 25), D.utc(2002, 0, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 28), D.utc(2005, 0, 2)],
                                weeks: 5
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 3, 1), D.utc(2001, 4, 6)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 3], // Saturday
                                visible: [D.utc(2006, 2, 26), D.utc(2006, 4, 7)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 29), D.utc(2009, 4, 3)],
                                weeks: 5
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2004, 7], // Sunday
                                visible:[D.utc(2004, 7, 1), D.utc(2004, 8, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2009, 7], // Saturday
                                visible: [D.utc(2009, 6, 26), D.utc(2009, 8, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 29), D.utc(2001, 8, 2)],
                                weeks: 5
                            });
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });
                        
                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2006, 0, 1), D.utc(2006, 1, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2005, 0], // Saturday
                                visible: [D.utc(2005, 0, 2), D.utc(2005, 1, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 29), D.utc(2003, 0, 31)],
                                weeks: 5
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 1, 1), D.utc(2004, 2, 5)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2020, 1], // Saturday
                                    visible: [D.utc(2020, 1, 2), D.utc(2020, 1, 28)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 29), D.utc(2012, 2, 2)],
                                    weeks: 5
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 1, 1), D.utc(2009, 1, 27)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2014, 1], // Saturday
                                    visible: [D.utc(2014, 1, 2), D.utc(2014, 1, 28)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 29), D.utc(2006, 2, 3)],
                                    weeks: 5
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 11, 1), D.utc(2003, 0, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 11], // Saturday
                                visible: [D.utc(2001, 11, 2), D.utc(2002, 0, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 28), D.utc(2004, 11, 31)],
                                weeks: 5
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 3, 1), D.utc(2001, 4, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 3], // Saturday
                                visible: [D.utc(2006, 3, 2), D.utc(2006, 4, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 29), D.utc(2009, 4, 1)],
                                weeks: 5
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2004, 7], // Sunday
                                visible:[D.utc(2004, 7, 1), D.utc(2004, 8, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2009, 7], // Saturday
                                visible: [D.utc(2009, 7, 2), D.utc(2009, 8, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 29), D.utc(2001, 7, 31)],
                                weeks: 5
                            });
                        });
                    });
                });

                describe("visibleWeeks: 6", function() {
                    beforeEach(function() {
                        cfg.visibleWeeks = 6;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2006, 0, 1), D.utc(2006, 1, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2005, 0], // Saturday
                                visible: [D.utc(2004, 11, 26), D.utc(2005, 1, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 29), D.utc(2003, 1, 9)],
                                weeks: 6
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 1, 1), D.utc(2004, 2, 14)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2020, 1], // Saturday
                                    visible: [D.utc(2020, 0, 26), D.utc(2020, 2, 8)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 29), D.utc(2012, 2, 11)],
                                    weeks: 6
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 1, 1), D.utc(2009, 2, 15)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2014, 1], // Saturday
                                    visible: [D.utc(2014, 0, 26), D.utc(2014, 2, 9)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 29), D.utc(2006, 2, 12)],
                                    weeks: 6
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 11, 1), D.utc(2003, 0, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 11], // Saturday
                                visible: [D.utc(2001, 10, 25), D.utc(2002, 0, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 28), D.utc(2005, 0, 9)],
                                weeks: 6
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 3, 1), D.utc(2001, 4, 13)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 3], // Saturday
                                visible: [D.utc(2006, 2, 26), D.utc(2006, 4, 7)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 29), D.utc(2009, 4, 10)],
                                weeks: 6
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 7, 1), D.utc(2004, 8, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2009, 7], // Saturday
                                visible: [D.utc(2009, 6, 26), D.utc(2009, 8, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 29), D.utc(2001, 8, 9)],
                                weeks: 6
                            });
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });
                        
                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2006, 0, 1), D.utc(2006, 1, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2005, 0], // Saturday
                                visible: [D.utc(2004, 11, 26), D.utc(2005, 1, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 29), D.utc(2003, 1, 7)],
                                weeks: 6
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 1, 1), D.utc(2004, 2, 12)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2020, 1], // Saturday
                                    visible: [D.utc(2020, 0, 26), D.utc(2020, 2, 6)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 29), D.utc(2012, 2, 9)],
                                    weeks: 6
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 1, 1), D.utc(2009, 2, 13)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2014, 1], // Saturday
                                    visible: [D.utc(2014, 0, 26), D.utc(2014, 2, 7)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 29), D.utc(2006, 2, 10)],
                                    weeks: 6
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 11, 1), D.utc(2003, 0, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 11], // Saturday
                                visible: [D.utc(2001, 10, 25), D.utc(2002, 0, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 28), D.utc(2005, 0, 7)],
                                weeks: 6
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 3, 1), D.utc(2001, 4, 11)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 3], // Saturday
                                visible: [D.utc(2006, 2, 26), D.utc(2006, 4, 5)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 29), D.utc(2009, 4, 8)],
                                weeks: 6
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 7, 1), D.utc(2004, 8, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2009, 7], // Saturday
                                visible: [D.utc(2009, 6, 26), D.utc(2009, 8, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 29), D.utc(2001, 8, 7)],
                                weeks: 6
                            });
                        });
                    });
                });
            });

            describe("firstDayOfWeek: 1", function() {
                beforeEach(function() {
                    cfg.firstDayOfWeek = 1;
                });

                describe("visibleWeeks: null", function() {
                    beforeEach(function() {
                        cfg.visibleWeeks = null;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 0], // Monday
                                visible: [D.utc(2001, 0, 1), D.utc(2001, 1, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2005, 11, 26), D.utc(2006, 1, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 30), D.utc(2003, 1, 3)],
                                weeks: 5
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2016, 1], // Monday
                                    visible: [D.utc(2016, 1, 1), D.utc(2016, 2, 7)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 0, 26), D.utc(2004, 2, 1)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 30), D.utc(2012, 2, 5)],
                                    weeks: 5
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2010, 1], // Monday
                                    visible: [D.utc(2010, 1, 1), D.utc(2010, 2, 1)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 0, 26), D.utc(2009, 2, 2)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 30), D.utc(2006, 2, 6)],
                                    weeks: 5
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2003, 11], // Monday
                                visible: [D.utc(2003, 11, 1), D.utc(2004, 0, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 10, 25), D.utc(2003, 0, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 29), D.utc(2005, 0, 3)],
                                weeks: 5
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 3], // Monday
                                visible: [D.utc(2002, 3, 1), D.utc(2002, 4, 6)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 2, 26), D.utc(2001, 4, 7)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 30), D.utc(2009, 4, 4)],
                                weeks: 5
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2005, 7], // Monday
                                visible: [D.utc(2005, 7, 1), D.utc(2005, 8, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 6, 26), D.utc(2004, 8, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 30), D.utc(2001, 8, 3)],
                                weeks: 5
                            });
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });
                        
                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 0], // Monday
                                visible: [D.utc(2001, 0, 1), D.utc(2001, 1, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2006, 0, 2), D.utc(2006, 1, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 30), D.utc(2003, 1, 1)],
                                weeks: 5
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2016, 1], // Monday
                                    visible: [D.utc(2016, 1, 1), D.utc(2016, 2, 5)],
                                    weeks: 5
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 1, 2), D.utc(2004, 1, 28)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 30), D.utc(2012, 2, 3)],
                                    weeks: 5
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2010, 1], // Monday
                                    visible: [D.utc(2010, 1, 1), D.utc(2010, 1, 27)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 1, 2), D.utc(2009, 1, 28)],
                                    weeks: 4
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 30), D.utc(2006, 2, 4)],
                                    weeks: 5
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2003, 11], // Monday
                                visible: [D.utc(2003, 11, 1), D.utc(2004, 0, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 11, 2), D.utc(2003, 0, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 29), D.utc(2005, 0, 1)],
                                weeks: 5
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 3], // Monday
                                visible: [D.utc(2002, 3, 1), D.utc(2002, 4, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 3, 2), D.utc(2001, 4, 5)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 30), D.utc(2009, 4, 2)],
                                weeks: 5
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2005, 7], // Monday
                                visible: [D.utc(2005, 7, 1), D.utc(2005, 8, 3)],
                                weeks: 5
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 7, 2), D.utc(2004, 8, 4)],
                                weeks: 5
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 30), D.utc(2001, 8, 1)],
                                weeks: 5
                            });
                        });
                    });
                });

                describe("visibleWeeks: 6", function() {
                    beforeEach(function() {
                        cfg.visibleWeeks = 6;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 0], // Monday
                                visible: [D.utc(2001, 0, 1), D.utc(2001, 1, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2005, 11, 26), D.utc(2006, 1, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 30), D.utc(2003, 1, 10)],
                                weeks: 6
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2016, 1], // Monday
                                    visible: [D.utc(2016, 1, 1), D.utc(2016, 2, 14)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 0, 26), D.utc(2004, 2, 8)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 30), D.utc(2012, 2, 12)],
                                    weeks: 6
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2010, 1], // Monday
                                    visible: [D.utc(2010, 1, 1), D.utc(2010, 2, 15)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 0, 26), D.utc(2009, 2, 9)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 30), D.utc(2006, 2, 13)],
                                    weeks: 6
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2003, 11], // Monday
                                visible: [D.utc(2003, 11, 1), D.utc(2004, 0, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 10, 25), D.utc(2003, 0, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 29), D.utc(2005, 0, 10)],
                                weeks: 6
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 3], // Monday
                                visible: [D.utc(2002, 3, 1), D.utc(2002, 4, 13)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 2, 26), D.utc(2001, 4, 7)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 30), D.utc(2009, 4, 11)],
                                weeks: 6
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2005, 7], // Monday
                                visible: [D.utc(2005, 7, 1), D.utc(2005, 8, 12)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 6, 26), D.utc(2004, 8, 6)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 30), D.utc(2001, 8, 10)],
                                weeks: 6
                            });
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        // Check dates go back a year when needed
                        describe("January", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2001, 0], // Monday
                                visible: [D.utc(2001, 0, 1), D.utc(2001, 1, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2006, 0], // Sunday
                                visible: [D.utc(2005, 11, 26), D.utc(2006, 1, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2003, 0], // Wednesday
                                visible: [D.utc(2002, 11, 30), D.utc(2003, 1, 8)],
                                weeks: 6
                            });
                        });

                        // Feb has special cases, only one to display as 4 weeks
                        describe("February", function() {
                            describe("in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2016, 1], // Monday
                                    visible: [D.utc(2016, 1, 1), D.utc(2016, 2, 12)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2004, 1], // Sunday
                                    visible: [D.utc(2004, 0, 26), D.utc(2004, 2, 6)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2012, 1], // Wednesday
                                    visible: [D.utc(2012, 0, 30), D.utc(2012, 2, 10)],
                                    weeks: 6
                                });
                            });

                            describe("not in a leap year", function() {
                                makeSuite("when the first is at the start of the week", {
                                    value: [2010, 1], // Monday
                                    visible: [D.utc(2010, 1, 1), D.utc(2010, 2, 13)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is at the end of the week", {
                                    value: [2009, 1], // Sunday
                                    visible: [D.utc(2009, 0, 26), D.utc(2009, 2, 7)],
                                    weeks: 6
                                });

                                makeSuite("when the first day is in the middle of the week", {
                                    value: [2006, 1], // Wednesday
                                    visible: [D.utc(2006, 0, 30), D.utc(2006, 2, 11)],
                                    weeks: 6
                                });
                            });
                        });

                        // Check dates go back a year when needed
                        describe("December", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2003, 11], // Monday
                                visible: [D.utc(2003, 11, 1), D.utc(2004, 0, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2002, 11], // Sunday
                                visible: [D.utc(2002, 10, 25), D.utc(2003, 0, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2004, 11], // Wednesday
                                visible: [D.utc(2004, 10, 29), D.utc(2005, 0, 8)],
                                weeks: 6
                            });
                        });
                        
                        describe("30 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2002, 3], // Monday
                                visible: [D.utc(2002, 3, 1), D.utc(2002, 4, 11)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2001, 3], // Sunday
                                visible: [D.utc(2001, 2, 26), D.utc(2001, 4, 5)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2009, 3], // Wednesday
                                visible: [D.utc(2009, 2, 30), D.utc(2009, 4, 9)],
                                weeks: 6
                            });
                        });

                        describe("31 day month", function() {
                            makeSuite("when the first is at the start of the week", {
                                value: [2005, 7], // Monday
                                visible: [D.utc(2005, 7, 1), D.utc(2005, 8, 10)],
                                weeks: 6
                            });

                            makeSuite("when the first is at the end of the week", {
                                value: [2004, 7], // Sunday
                                visible: [D.utc(2004, 6, 26), D.utc(2004, 8, 4)],
                                weeks: 6
                            });

                            makeSuite("when the first day is in the middle of the week", {
                                value: [2001, 7], // Wednesday
                                visible: [D.utc(2001, 6, 30), D.utc(2001, 8, 8)],
                                weeks: 6
                            });
                        });
                    });
                });
            });
        });

        describe("cell classes", function() {
            describe("pastCls", function() {
                it("should add the pastCls for cells before the current month range", function() {
                    makeView({
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    for (var i = 0; i < 42; ++i) {
                        if (i < 5) {
                            expect(getCellByIndex(i)).toHaveCls(view.$pastCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$pastCls);
                        }
                    }
                });
            });

            describe("futureCls", function() {
                it("should add the futureCls for cells after the current month range", function() {
                    makeView({
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    for (var i = 0; i < 42; ++i) {
                        if (i > 35) {
                            expect(getCellByIndex(i)).toHaveCls(view.$futureCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$futureCls);
                        }
                    }
                });
            });

            describe("outsideCls", function() {
                it("should add the outsideCls for cells that are past || future", function() {
                    makeView({
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    for (var i = 0; i < 42; ++i) {
                        if (i < 5 || i > 35) {
                            expect(getCellByIndex(i)).toHaveCls(view.$outsideCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$outsideCls);
                        }
                    }
                });
            });
        });

        describe("navigation", function() {
            beforeEach(function() {
                makeView({
                    value: new Date(2010, 6, 1),
                    visibleWeeks: 6
                });    
            });

            describe("nextMonth", function() {
                describe("with no arguments", function() {
                    it("should move forward one month", function() {
                        view.nextMonth();
                        expect(view.getValue()).toEqual(new Date(2010, 7, 1));
                        expectRange([D.utc(2010, 7, 1), D.utc(2010, 8, 12)]);
                    });

                    it("should move past a year boundary", function() {
                        view.setValue(D.utc(2010, 11, 1));
                        view.nextMonth();
                        expect(view.getValue()).toEqual(new Date(2011, 0, 1));
                        expectRange([D.utc(2010, 11, 26), D.utc(2011, 1, 6)]);
                    });
                });

                describe("with an argument", function() {
                    it("should do nothing if the value is 0", function() {
                        view.nextMonth(0);
                        expect(view.getValue()).toEqual(new Date(2010, 6, 1));
                        expectRange([D.utc(2010, 5, 27), D.utc(2010, 7, 8)]);
                    });

                    it("should be able to move forward 1 month", function() {
                        view.nextMonth(1);
                        expect(view.getValue()).toEqual(new Date(2010, 7, 1));
                        expectRange([D.utc(2010, 7, 1), D.utc(2010, 8, 12)]);
                    });

                    it("should move forward less than a year boundary", function() {
                        view.nextMonth(3);
                        expect(view.getValue()).toEqual(new Date(2010, 9, 1));
                        expectRange([D.utc(2010, 8, 26), D.utc(2010, 10, 7)]);
                    });

                    it("should be able to move forward past a year boundary", function() {
                        view.nextMonth(6);
                        expect(view.getValue()).toEqual(new Date(2011, 0, 1));
                        expectRange([D.utc(2010, 11, 26), D.utc(2011, 1, 6)]);
                    });

                    it("should be able to move forward over 12 months", function() {
                        view.nextMonth(14);
                        expect(view.getValue()).toEqual(new Date(2011, 8, 1));
                        expectRange([D.utc(2011, 7, 28), D.utc(2011, 9, 9)]);
                    });

                    it("should move backward if passed a negative", function() {
                        view.nextMonth(-2);
                        expect(view.getValue()).toEqual(new Date(2010, 4, 1));
                        expectRange([D.utc(2010, 3, 25), D.utc(2010, 5, 6)]);
                    });
                });
            });

            describe("nextYear", function() {
                describe("with no arguments", function() {
                    it("should move forward one year", function() {
                        view.nextYear();
                        expect(view.getValue()).toEqual(new Date(2011, 6, 1));
                        expectRange([D.utc(2011, 5, 26), D.utc(2011, 7, 7)]);
                    });
                });

                describe("with an argument", function() {
                    it("should do nothing if the value is 0", function() {
                        view.nextYear(0);
                        expect(view.getValue()).toEqual(new Date(2010, 6, 1));
                        expectRange([D.utc(2010, 5, 27), D.utc(2010, 7, 8)]);
                    });

                    it("should be able to move forward 1 year", function() {
                        view.nextYear(1);
                        expect(view.getValue()).toEqual(new Date(2011, 6, 1));
                        expectRange([D.utc(2011, 5, 26), D.utc(2011, 7, 7)]);
                    });

                    it("should move forward more than 1 year", function() {
                        view.nextYear(3);
                        expect(view.getValue()).toEqual(new Date(2013, 6, 1));
                        expectRange([D.utc(2013, 5, 30), D.utc(2013, 7, 11)]);
                    });

                    it("should move backward if passed a negative", function() {
                        view.nextYear(-2);
                        expect(view.getValue()).toEqual(new Date(2008, 6, 1));
                        expectRange([D.utc(2008, 5, 29), D.utc(2008, 7, 10)]);
                    });
                });
            });

            describe("previousMonth", function() {
                describe("with no arguments", function() {
                    it("should move backward one month", function() {
                        view.previousMonth();
                        expect(view.getValue()).toEqual(new Date(2010, 5, 1));
                        expectRange([D.utc(2010, 4, 30), D.utc(2010, 6, 11)]);
                    });

                    it("should go past a year boundary", function() {
                        view.setValue(D.utc(2010, 0, 1));
                        view.previousMonth();
                        expect(view.getValue()).toEqual(new Date(2009, 11, 1));
                        expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 10)]);
                    });
                });

                describe("with an argument", function() {
                    it("should do nothing if the value is 0", function() {
                        view.previousMonth(0);
                        expect(view.getValue()).toEqual(new Date(2010, 6, 1));
                        expectRange([D.utc(2010, 5, 27), D.utc(2010, 7, 8)]);
                    });

                    it("should be able to move backward 1 month", function() {
                        view.previousMonth(1);
                        expect(view.getValue()).toEqual(new Date(2010, 5, 1));
                        expectRange([D.utc(2010, 4, 30), D.utc(2010, 6, 11)]);
                    });

                    it("should advance less than a year boundary", function() {
                        view.previousMonth(3);
                        expect(view.getValue()).toEqual(new Date(2010, 3, 1));
                        expectRange([D.utc(2010, 2, 28), D.utc(2010, 4, 9)]);
                    });

                    it("should be able to move backward over a year boundary", function() {
                        view.previousMonth(7);
                        expect(view.getValue()).toEqual(new Date(2009, 11, 1));
                        expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 10)]);
                    });

                    it("should be able to move backward over 12 months", function() {
                        view.previousMonth(14);
                        expect(view.getValue()).toEqual(new Date(2009, 4, 1));
                        expectRange([D.utc(2009, 3, 26), D.utc(2009, 5, 7)]);
                    });

                    it("should move forward if passed a negative", function() {
                        view.previousMonth(-2);
                        expect(view.getValue()).toEqual(new Date(2010, 8, 1));
                        expectRange([D.utc(2010, 7, 29), D.utc(2010, 9, 10)]);
                    });
                });
            });

            describe("previousYear", function() {
                describe("with no arguments", function() {
                    it("should move backward one year", function() {
                        view.previousYear();
                        expect(view.getValue()).toEqual(new Date(2009, 6, 1));
                        expectRange([D.utc(2009, 5, 28), D.utc(2009, 7, 9)]);
                    });
                });

                describe("with an argument", function() {
                    it("should do nothing if the value is 0", function() {
                        view.previousYear(0);
                        expect(view.getValue()).toEqual(new Date(2010, 6, 1));
                        expectRange([D.utc(2010, 5, 27), D.utc(2010, 7, 8)]);
                    });

                    it("should be able to move backward 1 year", function() {
                        view.previousYear(1);
                        expect(view.getValue()).toEqual(new Date(2009, 6, 1));
                        expectRange([D.utc(2009, 5, 28), D.utc(2009, 7, 9)]);
                    });

                    it("should move backward more than 1 year", function() {
                        view.previousYear(3);
                        expect(view.getValue()).toEqual(new Date(2007, 6, 1));
                        expectRange([D.utc(2007, 6, 1), D.utc(2007, 7, 12)]);
                    });

                    it("should move forward if passed a negative", function() {
                        view.previousYear(-2);
                        expect(view.getValue()).toEqual(new Date(2012, 6, 1));
                        expectRange([D.utc(2012, 6, 1), D.utc(2012, 7, 12)]);
                    });
                });
            });
        });

        describe("visibleWeeks", function() {
            describe("at configuration time", function() {
                describe("4 week month", function() {
                    describe("with visibleWeeks: null", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2009, 1, 1),
                                visibleWeeks: null
                            });
                            expectRange([D.utc(2009, 1, 1), D.utc(2009, 1, 29)], 4);
                        });
                    });

                    describe("with visibleWeeks: 6", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2009, 1, 1),
                                visibleWeeks: 6
                            });
                            expectRange([D.utc(2009, 1, 1), D.utc(2009, 2, 15)], 6);
                        });
                    });
                });

                describe("5 week month", function() {
                    describe("with visibleWeeks: null", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2009, 11, 1),
                                visibleWeeks: null
                            });
                            expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 3)], 5);                               
                        });
                    });

                    describe("with visibleWeeks: 6", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2009, 11, 1),
                                visibleWeeks: 6
                            });
                            expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 10)], 6);
                        });
                    });
                });

                describe("6 week month", function() {
                    describe("with visibleWeeks: null", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2010, 0, 1),
                                visibleWeeks: null
                            });
                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 1, 7)], 6);
                        });
                    });

                    describe("with visibleWeeks: 6", function() {
                        it("should should show the correct range", function() {
                            makeView({
                                value: new Date(2010, 0, 1),
                                visibleWeeks: 6
                            });
                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 1, 7)], 6);
                        });
                    });
                });
            });

            describe("after creation", function() {
                describe("4 week month", function() {
                    describe("from null -> 6", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: null,
                                value: new Date(2009, 1, 1)
                            });
                            view.setVisibleWeeks(6);
                            expectRange([D.utc(2009, 1, 1), D.utc(2009, 2, 15)], 6);
                        });
                    });

                    describe("from 6 -> null", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: 6,
                                value: new Date(2009, 1, 1)
                            });
                            view.setVisibleWeeks(null);
                            expectRange([D.utc(2009, 1, 1), D.utc(2009, 1, 29)], 4);
                        });
                    });
                });

                describe("5 week month", function() {
                    describe("from null -> 6", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: null,
                                value: new Date(2009, 11, 1)
                            });
                            view.setVisibleWeeks(6);
                            expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 10)], 6);
                        });
                    });

                    describe("from 6 -> null", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: 6,
                                value: new Date(2009, 11, 1)
                            });
                            view.setVisibleWeeks(null);
                            expectRange([D.utc(2009, 10, 29), D.utc(2010, 0, 3)], 5);
                        });
                    });
                });

                describe("6 week month", function() {
                    describe("from null -> 6", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: null,
                                value: new Date(2010, 0, 1)
                            });
                            view.setVisibleWeeks(6);
                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 1, 7)], 6);
                        });
                    });

                    describe("from 6 -> null", function() {
                        it("should update the visibleRange", function() {
                            makeView({
                                visibleWeeks: 6,
                                value: new Date(2010, 0, 1)
                            });
                            view.setVisibleWeeks(null);
                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 1, 7)], 6);
                        });
                    });
                });
            });
        });
    });
});