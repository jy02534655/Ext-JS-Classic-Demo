describe("Ext.calendar.view.Weeks", function() {

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
        view = new Ext.calendar.view.Weeks(cfg);
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
        return view.getHeader().element.down('[data-day="' + day + '"]', true);
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

    function expectRange(range) {
        var viewRange = view.getVisibleRange(),
            count = 0,
            weeks = view.getVisibleWeeks(),
            current = viewRange.start,
            end = viewRange.end,
            visibleDays = view.getVisibleDays(),
            cell, visible;

        expect(viewRange).toEqualRange(makeRange(range[0], range[1]));

        while (current < end) {
            visible = count % 7 < visibleDays;
            cell = getCell(current);

            expectDayText(cell, current.getDate().toString());
            expect(isVisible(cell)).toBe(visible);

            current = D.add(current, D.DAY, 1);
            ++count;
        }
    }

    function expectDayText(cell, text) {
        expect(cell.firstChild.firstChild).hasHTML(text);
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
            describe("row heights", function() {
                function makeHeightSuite(weeks) {
                    describe(weeks === 1 ? "1 week" : weeks + " weeks", function() {
                        it("should stretch height evenly", function() {
                            makeView({
                                width: 600,
                                height: 600,
                                visibleWeeks: weeks
                            });

                            var rowHeight = view.cellTable.getHeight() / weeks,
                                rows = view.cellTable.query('.' + view.$rowCls);

                            Ext.Array.forEach(rows, function(row) {
                                // Allow a fudge factor of 1px either side to account for
                                // uneven row sizing because of % based heights
                                expect(Ext.fly(row).getHeight()).toBeWithin(1, rowHeight);
                            });
                        });
                    });
                }

                makeHeightSuite(1);
                makeHeightSuite(2);
                makeHeightSuite(3);
                makeHeightSuite(4);
                makeHeightSuite(5);
                makeHeightSuite(6);
            });

            describe("cell widths", function() {
                function makeWidthSuite(days) {
                    describe(days + " days", function() {
                        it("should stretch width evenly", function() {
                            makeView({
                                width: 600,
                                height: 600,
                                visibleWeeks: 1,
                                visibleDays: days
                            });

                            var cellWidth = view.cellTable.getWidth() / days,
                                cells = view.cellTable.query('.' + view.$cellCls);

                            Ext.Array.forEach(cells, function(cell) {
                                // Allow a fudge factor of 1px either side to account for
                                // uneven row sizing because of the table-layout: fixed algorithm
                                if (isVisible(cell)) {
                                    expect(Ext.fly(cell).getWidth()).toBeWithin(1, cellWidth);
                                } else {
                                    expect(Ext.fly(cell).getWidth()).toBe(0);
                                }
                            });
                        });
                    });
                }

                makeWidthSuite(4);
                makeWidthSuite(5);
                makeWidthSuite(6);
                makeWidthSuite(7);
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
                        cfg.value = o.value;
                        makeView(cfg);
                    });

                    it("should set values correctly and render the correct range", function() {
                        expectRange(o.visible);
                    });
                });
            }

            describe("visibleWeeks: 1", function() {
                beforeEach(function() {
                    cfg.visibleWeeks = 1;
                });

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

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 0, 10), // Sun
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 14)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 0, 16), // Sat
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 14)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 0, 13), // Wed
                            visible: [D.utc(2016, 0, 10), D.utc(2016, 0, 14)]
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

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 0, 11), // Mon
                            visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 15)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 0, 17), // Sun
                            visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 15)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 0, 13), // Wed
                            visible: [D.utc(2016, 0, 11), D.utc(2016, 0, 15)]
                        });
                    });
                });
            });

            describe("2 weeks", function() {
                beforeEach(function() {
                    cfg.visibleWeeks = 2;
                });

                describe("firstDayOfWeek: 0", function() {
                    beforeEach(function() {
                        cfg.firstDayOfWeek = 0;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2015, 5, 14), // Sun
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 28)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 20), // Sat
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 28)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 28)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2015, 5, 14), // Sun
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 26)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 20), // Sat
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 26)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 26)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2015, 5, 14), // Sun
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 25)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 20), // Sat
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 25)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 14), D.utc(2015, 5, 25)]
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
                            value: new Date(2015, 5, 15), // Mon
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 29)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 21), // Sun
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 29)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 29)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2015, 5, 15), // Mon
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 27)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 21), // Sun
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 27)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 27)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2015, 5, 15), // Mon
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 26)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2015, 5, 21), // Sun
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 26)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2015, 5, 17), // Wed
                            visible: [D.utc(2015, 5, 15), D.utc(2015, 5, 26)]
                        });
                    });
                });
            });

            describe("3 weeks", function() {
                beforeEach(function() {
                    cfg.visibleWeeks = 3;
                });

                describe("firstDayOfWeek: 0", function() {
                    beforeEach(function() {
                        cfg.firstDayOfWeek = 0;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 2, 6), // Sun
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 27)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 12), // Sat
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 27)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 27)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 2, 6), // Sun
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 25)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 12), // Sat
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 25)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 25)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 2, 6), // Sun
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 24)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 12), // Sat
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 24)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 6), D.utc(2016, 2, 24)]
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
                            value: new Date(2016, 2, 7), // Mon
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 28)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 13), // Sun
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 28)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 28)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 2, 7), // Mon
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 26)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 13), // Sun
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 26)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 26)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2016, 2, 7), // Mon
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 25)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2016, 2, 13), // Sun
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 25)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2016, 2, 9), // Wed
                            visible: [D.utc(2016, 2, 7), D.utc(2016, 2, 25)]
                        });
                    });
                });
            });

            describe("4 weeks", function() {
                beforeEach(function() {
                    cfg.visibleWeeks = 4;
                });

                describe("firstDayOfWeek: 0", function() {
                    beforeEach(function() {
                        cfg.firstDayOfWeek = 0;
                    });

                    describe("visibleDays: 7", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 7;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2017, 0, 1), // Sun
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 29)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 7), // Sat
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 29)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 29)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2017, 0, 1), // Sun
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 27)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 7), // Sat
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 27)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 27)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2017, 0, 1), // Sun
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 26)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 7), // Sat
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 26)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 1), D.utc(2017, 0, 26)]
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
                            value: new Date(2017, 0, 2), // Mon
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 30)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 8), // Sun
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 30)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 30)]
                        });
                    });

                    describe("visibleDays: 5", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 5;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2017, 0, 2), // Mon
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 28)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 8), // Sun
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 28)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 28)]
                        });
                    });

                    describe("visibleDays: 4", function() {
                        beforeEach(function() {
                            cfg.visibleDays = 4;
                        });

                        makeSuite("when the first day is at the start of the week", {
                            value: new Date(2017, 0, 2), // Mon
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 27)]
                        });

                        makeSuite("when the first day is at the end of the week", {
                            value: new Date(2017, 0, 8), // Sun
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 27)]
                        });

                        makeSuite("when the first day is in the middle of the week", {
                            value: new Date(2017, 0, 4), // Wed
                            visible: [D.utc(2017, 0, 2), D.utc(2017, 0, 27)]
                        });
                    });
                });
            });

            describe("month boundaries", function() {
                beforeEach(function() {
                    cfg.visibleDays = 7;
                    cfg.visibleWeeks = 2;
                    cfg.firstDayOfWeek = 0;
                });

                makeSuite("when the first date needs to go into the previous month", {
                    value: new Date(2016, 2, 2), // Wed
                    visible: [D.utc(2016, 1, 28), D.utc(2016, 2, 13)]
                });

                makeSuite("when the end date needs to go into the next month", {
                    value: new Date(2016, 1, 29), // Mon
                    visible: [D.utc(2016, 1, 28), D.utc(2016, 2, 13)]
                });
            });
        });

        describe("cell classes", function() {
            describe("cellCls", function() {
                it("should add the cellCls to all cells", function() {
                    makeView({
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    for (var i = 0; i < 42; ++i) {
                        expect(getCellByIndex(i)).toHaveCls(view.$cellCls);
                    }
                });
            });

            describe("todayCls", function() {
                var getNow, now;

                beforeEach(function() {
                    getNow = T.prototype.getNow;
                    T.prototype.getLocalNow = function() {
                        return D.clone(now);
                    };
                });

                afterEach(function() {
                    T.prototype.getNow = getNow;
                    getNow = null;
                });

                it("should add the todayCls if it's in range", function() {
                    now = new Date(2010, 6, 8);
                    makeView({
                        value: now,
                        visibleWeeks: 2
                    });

                    for (var i = 0; i < 14; ++i) {
                        if (i === 4) {
                            expect(getCellByIndex(i)).toHaveCls(view.$todayCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$todayCls);
                        }
                    }
                });

                it("should not add the cls if today is not visible", function() {
                    now = new Date(2010, 6, 8);
                    makeView({
                        value: new Date(2010, 0, 1)
                    });

                    for (var i = 0; i < 14; ++i) {
                        expect(getCellByIndex(i)).not.toHaveCls(view.$todayCls);
                    }
                });
            });

            describe("weekendCls", function() {
                it("should add the class for weekend days", function() {
                    var hasCls, i;
                    makeView({
                        visibleWeeks: 4
                    });

                    for (i = 0; i < 28; ++i) {
                        hasCls = i % 7 === 0 || i % 7 === 6;
                        if (hasCls) {
                            expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                        }
                    }
                });

                it("should add the class when using non-default weekend days", function() {
                    var hasCls, i;
                    makeView({
                        weekendDays: [5, 6],
                        visibleWeeks: 4
                    });

                    for (i = 0; i < 28; ++i) {
                        hasCls = i % 7 === 5 || i % 7 === 6;
                        if (hasCls) {
                            expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                        }
                    }
                });

                it("should add the class when using non-default firstDayOfWeek", function() {
                    var hasCls, i;
                    makeView({
                        firstDayOfWeek: 1,
                        visibleWeeks: 4
                    });

                    for (i = 0; i < 28; ++i) {
                        hasCls = i % 7 === 5 || i % 7 === 6;
                        if (hasCls) {
                            expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                        }
                    }
                });
            });
        });

        describe("navigation", function() {
            beforeEach(function() {
                makeView({
                    value: new Date(2016, 6, 1),
                    visibleWeeks: 2
                });    
            });

            describe("with no interval", function() {
                describe("positive", function() {
                    it("should move forward by days", function() {
                        view.navigate(12);
                        expect(view.getValue()).toEqual(new Date(2016, 6, 13));
                        expectRange([D.utc(2016, 6, 10), D.utc(2016, 6, 24)]);
                    });
                });

                describe("negative", function() {
                    it("should move backward by days", function() {
                        view.navigate(-11);
                        expect(view.getValue()).toEqual(new Date(2016, 5, 20));
                        expectRange([D.utc(2016, 5, 19), D.utc(2016, 6, 3)]);
                    });
                });
            });

            describe("with interval", function() {
                describe("year", function() {
                    describe("positive", function() {
                        it("should do nothing if the value is 0", function() {
                            view.navigate(0, D.YEAR);
                            expect(view.getValue()).toEqual(new Date(2016, 6, 1));
                            expectRange([D.utc(2016, 5, 26), D.utc(2016, 6, 10)]);
                        });

                        it("should move forward by years", function() {
                            view.navigate(4, D.YEAR);
                            expect(view.getValue()).toEqual(new Date(2020, 6, 1));
                            expectRange([D.utc(2020, 5, 28), D.utc(2020, 6, 12)]);
                        });
                    });

                    describe("negative", function() {
                        it("should move backward by years", function() {
                            view.navigate(-4, D.YEAR);
                            expect(view.getValue()).toEqual(new Date(2012, 6, 1));
                            expectRange([D.utc(2012, 6, 1), D.utc(2012, 6, 15)]);
                        });
                    });
                });

                describe("month", function() {
                    describe("positive", function() {
                        it("should do nothing if the value is 0", function() {
                            view.navigate(0, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2016, 6, 1));
                            expectRange([D.utc(2016, 5, 26), D.utc(2016, 6, 10)]);
                        });

                        it("should be able to move forward 1 month", function() {
                            view.navigate(1, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2016, 7, 1));
                            expectRange([D.utc(2016, 6, 31), D.utc(2016, 7, 14)]);
                        });

                        it("should move forward less than a year boundary", function() {
                            view.navigate(3, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2016, 9, 1));
                            expectRange([D.utc(2016, 8, 25), D.utc(2016, 9, 9)]);
                        });

                        it("should be able to move forward past a year boundary", function() {
                            view.navigate(7, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2017, 1, 1));
                            expectRange([D.utc(2017, 0, 29), D.utc(2017, 1, 12)]);
                        });

                        it("should be able to move forward over 12 months", function() {
                            view.navigate(14, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2017, 8, 1));
                            expectRange([D.utc(2017, 7, 27), D.utc(2017, 8, 10)]);
                        });
                    });

                    describe("negative", function() {
                        it("should be able to move backward 1 month", function() {
                            view.navigate(-1, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2016, 5, 1));
                            expectRange([D.utc(2016, 4, 29), D.utc(2016, 5, 12)]);
                        });

                        it("should advance less than a year boundary", function() {
                            view.navigate(-3, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2016, 3, 1));
                            expectRange([D.utc(2016, 2, 27), D.utc(2016, 3, 10)]);
                        });

                        it("should be able to move backward over a year boundary", function() {
                            view.navigate(-8, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2015, 10, 1));
                            expectRange([D.utc(2015, 10, 1), D.utc(2015, 10, 15)]);
                        });

                        it("should be able to move backward over 12 months", function() {
                            view.navigate(-14, D.MONTH);
                            expect(view.getValue()).toEqual(new Date(2015, 4, 1));
                            expectRange([D.utc(2015, 3, 26), D.utc(2015, 4, 10)]);
                        });
                    });
                });

                describe("day", function() {
                    describe("positive", function() {
                        it("should do nothing if the value is 0", function() {
                            view.navigate(0, D.DAY);
                            expect(view.getValue()).toEqual(new Date(2016, 6, 1));
                            expectRange([D.utc(2016, 5, 26), D.utc(2016, 6, 10)]);
                        });

                        it("should move within the same range", function() {
                            view.navigate(1, D.DAY);
                            expect(view.getValue()).toEqual(new Date(2016, 6, 2));
                            expectRange([D.utc(2016, 5, 26), D.utc(2016, 6, 10)]);
                        });

                        it("should navigate based on the range changing", function() {
                            view.navigate(40, D.DAY);
                            expect(view.getValue()).toEqual(new Date(2016, 7, 10));
                            expectRange([D.utc(2016, 7, 7), D.utc(2016, 7, 21)]);
                        });
                    });

                    describe("negative", function() {
                        it("should move within the same range", function() {
                            view.navigate(-1, D.DAY);
                            expect(view.getValue()).toEqual(new Date(2016, 5, 30));
                            expectRange([D.utc(2016, 5, 26), D.utc(2016, 6, 10)]);
                        });

                        it("should navigate multiple month boundaries", function() {
                            view.navigate(-45, D.DAY);
                            expect(view.getValue()).toEqual(new Date(2016, 4, 17));
                            expectRange([D.utc(2016, 4, 15), D.utc(2016, 4, 29)]);
                        });
                    });
                });
            });
        });

        describe("dayFormat", function() {
            describe("at configuration time", function() {
                it("should default to 'j'", function() {
                    makeView({
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = current.getDate().toString();
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });

                it("should accept a different default", function() {
                    makeView({
                        dayFormat: 'd',
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = Ext.String.leftPad(current.getDate().toString(), 2, '0');
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });

                it("should be able to accept a non-numeric format", function() {
                    makeView({
                        dayFormat: 'j D',
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = current.getDate() + ' ' + D.getShortDayName(current.getDay());
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });
            });

            describe("after creation", function() {
                beforeEach(function() {
                    makeView({
                        dayFormat: 'j',
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });
                    view.setDayFormat('d');
                });

                it("should be able to change the format", function() {
                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = Ext.String.leftPad(current.getDate().toString(), 2, '0');
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }

                    view.setDayFormat('j D');
                    current = view.getVisibleRange().start;

                    for (i = 0; i < 42; ++i) {
                        s = current.getDate() + ' ' + D.getShortDayName(current.getDay());
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }

                    view.setDayFormat('j');
                    current = view.getVisibleRange().start;

                    for (i = 0; i < 42; ++i) {
                        s = current.getDate().toString();
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });

                it("should keep the format when the date changes", function() {
                    view.setValue(new Date(2010, 1, 1));

                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = Ext.String.leftPad(current.getDate().toString(), 2, '0');
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });
            });

            describe("localization", function() {
                var oldNamer;

                beforeEach(function() {
                    oldNamer = D.getShortDayName;
                    D.getShortDayName = function(day) {
                        return ['a', 'b', 'c', 'd', 'e', 'f', 'g'][day];
                    };
                });

                afterEach(function() {
                    D.getShortDayName = oldNamer;
                });

                it("should use localized values", function() {
                    makeView({
                        dayFormat: 'j D',
                        value: new Date(2010, 0, 1),
                        visibleWeeks: 6
                    });

                    var current = view.getVisibleRange().start,
                        i, s;

                    for (i = 0; i < 42; ++i) {
                        s = current.getDate() + ' ' + D.getShortDayName(current.getDay());
                        expectDayText(getCellByIndex(i), s);
                        current = D.add(current, D.DAY, 1);
                    }
                });
            });
        });

        describe("firstDayOfWeek", function() {
            function makeHeader() {
                var h = new Ext.calendar.header.Weeks();
                h.render(Ext.getBody());
                return h;
            }

            describe("at configuration time", function() {
                it("should default to Ext.Date.firstDayOfWeek", function() {
                    makeView();
                    expect(view.getFirstDayOfWeek()).toBe(D.firstDayOfWeek);
                });

                describe("headers", function() {
                    it("should set header days from the default", function() {
                        makeView({
                            header: makeHeader()
                        });

                        expect(getHeaderCellByIndex(0)).hasHTML('Sun');
                        expect(getHeaderCellByIndex(1)).hasHTML('Mon');
                        expect(getHeaderCellByIndex(2)).hasHTML('Tue');
                        expect(getHeaderCellByIndex(3)).hasHTML('Wed');
                        expect(getHeaderCellByIndex(4)).hasHTML('Thu');
                        expect(getHeaderCellByIndex(5)).hasHTML('Fri');
                        expect(getHeaderCellByIndex(6)).hasHTML('Sat');

                    });

                    it("should set header days from a custom value", function() {
                        makeView({
                            header: makeHeader(),
                            firstDayOfWeek: 1
                        });

                        expect(getHeaderCellByIndex(0)).hasHTML('Mon');
                        expect(getHeaderCellByIndex(1)).hasHTML('Tue');
                        expect(getHeaderCellByIndex(2)).hasHTML('Wed');
                        expect(getHeaderCellByIndex(3)).hasHTML('Thu');
                        expect(getHeaderCellByIndex(4)).hasHTML('Fri');
                        expect(getHeaderCellByIndex(5)).hasHTML('Sat');
                        expect(getHeaderCellByIndex(6)).hasHTML('Sun');
                    });
                });

                describe("days", function() {
                    it("should render day cells from the default", function() {
                        makeView({
                            value: new Date(2010, 0, 1),
                            visibleWeeks: 6
                        });

                        var current = new Date(2009, 11, 27),
                            i, cell;

                        for (i = 0; i < 42; ++i) {
                            expect(getCellByIndex(i)).toBe(getCell(current));
                            current.setDate(current.getDate() + 1);
                        }
                    });

                    it("should render day cells with a custom value", function() {
                        makeView({
                            firstDayOfWeek: 1,
                            visibleWeeks: 6,
                            value: new Date(2010, 0, 1)
                        });

                        var current = new Date(2009, 11, 28),
                            i, cell;

                        for (i = 0; i < 42; ++i) {
                            expect(getCellByIndex(i)).toBe(getCell(current));
                            current.setDate(current.getDate() + 1);
                        }
                    });
                });
            });

            describe("after creation", function() {
                describe("headers", function() {
                    it("should change the header days", function() {
                        makeView({
                            header: makeHeader()
                        });

                        view.setFirstDayOfWeek(1);

                        expect(getHeaderCellByIndex(0)).hasHTML('Mon');
                        expect(getHeaderCellByIndex(1)).hasHTML('Tue');
                        expect(getHeaderCellByIndex(2)).hasHTML('Wed');
                        expect(getHeaderCellByIndex(3)).hasHTML('Thu');
                        expect(getHeaderCellByIndex(4)).hasHTML('Fri');
                        expect(getHeaderCellByIndex(5)).hasHTML('Sat');
                        expect(getHeaderCellByIndex(6)).hasHTML('Sun');

                        view.setFirstDayOfWeek(0);

                        expect(getHeaderCellByIndex(0)).hasHTML('Sun');
                        expect(getHeaderCellByIndex(1)).hasHTML('Mon');
                        expect(getHeaderCellByIndex(2)).hasHTML('Tue');
                        expect(getHeaderCellByIndex(3)).hasHTML('Wed');
                        expect(getHeaderCellByIndex(4)).hasHTML('Thu');
                        expect(getHeaderCellByIndex(5)).hasHTML('Fri');
                        expect(getHeaderCellByIndex(6)).hasHTML('Sat');
                    });
                });

                describe("days", function() {
                    beforeEach(function() {
                        makeView({
                            visibleWeeks: 6,
                            value: new Date(2010, 0, 1)
                        });
                        view.setFirstDayOfWeek(1);
                    });

                    it("should change the day cells", function() {
                        var current = new Date(2009, 11, 28),
                            i;

                        for (i = 0; i < 42; ++i) {
                            expect(getCellByIndex(i)).toBe(getCell(current));
                            current.setDate(current.getDate() + 1);
                        }

                        view.setFirstDayOfWeek(0);

                        current = new Date(2009, 11, 27);

                        for (i = 0; i < 42; ++i) {
                            expect(getCellByIndex(i)).toBe(getCell(current));
                            current.setDate(current.getDate() + 1);
                        }
                    });

                    it("should keep the new firstDayOfWeek when the value changes", function() {
                        view.setValue(new Date(2010, 3, 1));

                        var current = new Date(2010, 2, 29),
                            i;

                        for (i = 0; i < 42; ++i) {
                            expect(getCellByIndex(i)).toBe(getCell(current));
                            current.setDate(current.getDate() + 1);
                        }
                    });
                });
            });
        });

        describe("visibleDays", function() {
            function makeHeader() {
                var h = new Ext.calendar.header.Weeks();
                h.render(Ext.getBody());
                return h;
            }

            describe("at configuration time", function() {
                describe("headers", function() {
                    it("should show all headers by default", function() {
                        makeView({
                            header: makeHeader(),
                            visibleDays: 7
                        });

                        for (var i = 0; i < 7; ++i) {
                            expect(isVisible(getHeaderCellByIndex(i))).toBe(true);
                        }
                    });

                    it("should have only 5 headers visible", function() {
                        makeView({
                            header: makeHeader(),
                            visibleDays: 5
                        });

                        for (var i = 0; i < 7; ++i) {
                            expect(isVisible(getHeaderCellByIndex(i))).toBe(i < 5);
                        }
                    });
                });

                describe("days", function() {
                    it("should have all 7 days visible", function() {
                        makeView({
                            visibleDays: 7,
                            visibleWeeks: 2,
                            value: new Date(2010, 0, 1)
                        });

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 10)]);
                    });

                    it("should have only 5 days visible", function() {
                        makeView({
                            visibleDays: 5,
                            visibleWeeks: 2,
                            value: new Date(2010, 0, 1)
                        });

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 8)]);
                    });

                    it("should show the days based off the firstDayOfWeek", function() {
                        makeView({
                            visibleDays: 5,
                            visibleWeeks: 2,
                            firstDayOfWeek: 1,
                            value: new Date(2010, 0, 1)
                        });

                        expectRange([D.utc(2009, 11, 28), D.utc(2010, 0, 9)]);
                    });
                });
            });

            describe("after creation", function() {
                describe("headers", function() {
                    describe("from larger -> smaller", function() {
                        it("should show the correct headers", function() {
                            makeView({
                                header: makeHeader(),
                                visibleDays: 7
                            });

                            var i;

                            view.setVisibleDays(5);

                            for (i = 0; i < 7; ++i) {
                                expect(isVisible(getHeaderCellByIndex(i))).toBe(i < 5);
                            }

                            view.setVisibleDays(3);

                            for (i = 0; i < 7; ++i) {
                                expect(isVisible(getHeaderCellByIndex(i))).toBe(i < 3);
                            }
                        });
                    });

                    describe("from smaller -> larger", function() {
                         it("should show the correct headers", function() {
                            makeView({
                                header: makeHeader(),
                                visibleDays: 3
                            });

                            var i;

                            view.setVisibleDays(5);

                            for (i = 0; i < 7; ++i) {
                                expect(isVisible(getHeaderCellByIndex(i))).toBe(i < 5);
                            }

                            view.setVisibleDays(7);

                            for (i = 0; i < 7; ++i) {
                                expect(isVisible(getHeaderCellByIndex(i))).toBe(i < 7);
                            }
                        });
                    });
                });

                describe("days", function() {
                    describe("from larger -> smaller", function() {
                        it("should show the correct range", function() {
                            makeView({
                                visibleDays: 7,
                                value: new Date(2010, 0, 1)
                            });

                            view.setVisibleDays(5);

                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 8)]);

                            view.setVisibleDays(3);

                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 6)]);
                        });
                    });

                    describe("from smaller -> larger", function() {
                        it("should show the correct range", function() {
                            makeView({
                                visibleDays: 3,
                                value: new Date(2010, 0, 1)
                            });

                            view.setVisibleDays(5);

                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 8)]);

                            view.setVisibleDays(7);

                            expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 10)]);
                        });
                    });
                });
            });
        });

        describe("visibleWeeks", function() {
            describe("at configuration time", function() {
                it("should render the specified number of weeks", function() {
                    makeView({
                        visibleWeeks: 3,
                        value: new Date(2010, 0, 1)
                    });

                    expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 17)]);

                    expect(getCell(new Date(2009, 11, 26))).toBeNull();
                    expect(getCell(new Date(2010, 0, 18))).toBeNull();
                });

                it("should render full weeks and hide cells based off visibleDays", function() {
                    makeView({
                        visibleWeeks: 2,
                        visibleDays: 5,
                        value: new Date(2010, 0, 1)
                    });

                    expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 8)]);

                    var i, visible;

                    for (i = 0; i < 14; ++i) {
                        visible = i % 7 !== 5 && i % 7 !== 6;
                        expect(isVisible(i)).toBe(visible);
                    }

                    expect(getCell(new Date(2009, 11, 26))).toBeNull();
                    expect(getCell(new Date(2010, 0, 11))).toBeNull();
                });
            });

            describe("after creation", function() {
                describe("from larger -> smaller", function() {
                    it("should render the correct range", function() {
                        makeView({
                            visibleWeeks: 3,
                            value: new Date(2010, 0, 1)
                        });

                        view.setVisibleWeeks(2);

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 10)]);
                        expect(getCell(new Date(2009, 11, 26))).toBeNull();
                        expect(getCell(new Date(2010, 0, 11))).toBeNull();

                        view.setVisibleWeeks(1);

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 3)]);
                        expect(getCell(new Date(2009, 11, 26))).toBeNull();
                        expect(getCell(new Date(2010, 0, 4))).toBeNull();
                    });
                });

                describe("from smaller -> larger", function() {
                    it("should render the correct range", function() {
                        makeView({
                            visibleWeeks: 1,
                            value: new Date(2010, 0, 1)
                        });

                        view.setVisibleWeeks(2);

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 10)]);
                        expect(getCell(new Date(2009, 11, 26))).toBeNull();
                        expect(getCell(new Date(2010, 0, 11))).toBeNull();

                        view.setVisibleWeeks(3);

                        expectRange([D.utc(2009, 11, 27), D.utc(2010, 0, 17)]);
                        expect(getCell(new Date(2009, 11, 26))).toBeNull();
                        expect(getCell(new Date(2010, 0, 18))).toBeNull();
                    });
                });
            });
        });

        describe("weekendDays", function() {
            it("should default to Ext.Date.weekendDays", function() {
                makeView();
                expect(view.getWeekendDays()).toEqual(D.weekendDays);
            });

            describe("at configuration time", function() {
                describe("with defaults", function() {
                    it("should add the weekendCls", function() {
                        var isWeekend, i;
                        makeView({
                            visibleWeeks: 6
                        });

                        for (i = 0; i < 42; ++i) {
                            isWeekend = i % 7 === 0 || i % 7 === 6;
                            if (isWeekend) {
                                expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                            } else {
                                expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                            }
                        }
                    });
                });

                describe("with custom days", function() {
                    it("should add the weekendCls", function() {
                        var isWeekend, i;
                        makeView({
                            visibleWeeks: 6,
                            weekendDays: [2, 5]
                        });

                        for (i = 0; i < 42; ++i) {
                            isWeekend = i % 7 === 2 || i % 7 === 5;
                            if (isWeekend) {
                                expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                            } else {
                                expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                            }
                        }
                    });
                });
            });

            describe("after creation", function() {
                it("should add the weekendCls to the correct items", function() {
                    var isWeekend, i;
                    makeView({
                        visibleWeeks: 6
                    });

                    view.setWeekendDays([2, 5]);

                    for (i = 0; i < 42; ++i) {
                        isWeekend = i % 7 === 2 || i % 7 === 5;
                        if (isWeekend) {
                            expect(getCellByIndex(i)).toHaveCls(view.$weekendCls);
                        } else {
                            expect(getCellByIndex(i)).not.toHaveCls(view.$weekendCls);
                        }
                    }
                });
            });
        });
    });

    xdescribe("events", function() {
        function compressRow(row) {
            var ret = [],
                count = 0,
                last;

            Ext.Array.forEach(row, function(item, i) {
                if (last && last !== item) {
                    ret[ret.length - 1].length = count;
                    count = 0;
                }

                if (item) {
                    if (count === 0) {
                        ret.push({
                            id: item,
                            start: i
                        });
                    }
                    ++count;
                }

                last = item;
            });

            if (ret.length) {
                last = ret[ret.length - 1];
                if (!last.length) {
                    last.length = count;
                }
            }

            return ret;
        }

        function expectWeek(rows, weekIndex) {
            var tracker = [],
                eventEls = view.eventContainer.query('.' + view.$eventCls + '[data-week="' + weekIndex + '"]');

            if (rows === null) {
                expect(eventEls.length).toBe(0);
                return;
            }

            rows = Ext.Array.map(rows, compressRow);

            var daySizes = view.getDaySizes(),
                eventStyle = view.getEventStyle(),
                margin = eventStyle.margin,
                widths = daySizes.widths;

            Ext.Array.forEach(rows, function(row, localIdx) {
                Ext.Array.forEach(row, function(item) {
                    var start = item.start,
                        headerOffset, top, left, width, el;

                    headerOffset = daySizes.headerHeight + eventStyle.height * localIdx + (localIdx + 1) * margin.height;

                    el = getEventEl();

                    top = view.positionSum(0, weekIndex, daySizes.heights) + headerOffset;
                    left = view.positionSum(0, start, widths) + margin.left;
                    width = view.positionSum(start, item.length, widths) - margin.width;
                });
            });

            expect(Ext.Array.difference(tracker, eventEls).length).toBe(0);
        }

        function expectAll(rows) {
            Ext.Array.forEach(rows, expectWeek);
        }

        function getEventEl(id, weekIdx) {
            return view.eventContainer.child('.' + view.$eventCls + '[data-eventid=' + id + '][data-week="' + weekIdx + '"]', true);
        }

        describe("single day events", function() {
            function makeEventView(events) {
                Ext.Array.forEach(events, function(event) {
                    event.name = event.name || event.id;
                });

                makeView({
                    value: new Date(2016, 0, 13),
                    visibleWeeks: 1,
                    store: {
                        model: 'Ext.calendar.model.Event',
                        data: events
                    }
                });
            }

            // Range 2016-01-10 -> 2016-01-17

            describe("out of range", function() {
                it("should not render anything if the event is before the range", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 8),
                        allDay: true
                    }]);

                    expectWeek(null, 0);
                });

                it("should not render anything if the event is after the range", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 18),
                        allDay: true
                    }]);

                    expectWeek(null, 0);
                });
            });

            describe("range boundaries", function() {
                it("should include an event that starts at 00:00:00 on the first day of the range", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 10, 0, 0, 0),
                        allDay: true
                    }]);

                    expectWeek([
                        [1, null, null, null, null, null, null]
                    ], 0);
                });

                it("should exclude an event that starts at 00:00:00 on the last day of the range", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 18, 0, 0, 0),
                        allDay: true
                    }]);

                    expectWeek(null, 0);
                });
            });

            describe("events that occur on multiple different days", function() {
                it("should render multiple events", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 11),
                        allDay: true
                    }, {
                        id: 2,
                        startDate: new Date(2016, 0, 12),
                        allDay: true
                    }, {
                        id: 3,
                        startDate: new Date(2016, 0, 14),
                        allDay: true
                    }, {
                        id: 4,
                        startDate: new Date(2016, 0, 16),
                        allDay: true
                    }]);

                    expectWeek([
                        [null, 1, 2, null, 3, null, 4]
                    ], 0);
                });
            });

            describe("multiple events on the same day", function() {
                it("should render several all day events", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 10),
                        allDay: true
                    }, {
                        id: 2,
                        startDate: new Date(2016, 0, 10),
                        allDay: true
                    }, {
                        id: 3,
                        startDate: new Date(2016, 0, 10),
                        allDay: true
                    }]);

                    expectWeek([
                        [1, null, null, null, null, null, null],
                        [2, null, null, null, null, null, null],
                        [3, null, null, null, null, null, null]
                    ], 0);
                });

                it("should render several timed events", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 10, 9, 30),
                        endDate: new Date(2016, 0, 10, 10, 0)
                    }, {
                        id: 2,
                        startDate: new Date(2016, 0, 10, 11, 30),
                        endDate: new Date(2016, 0, 10, 12, 0)
                    }, {
                        id: 3,
                        startDate: new Date(2016, 0, 10, 13, 30),
                        endDate: new Date(2016, 0, 10, 14, 0)
                    }]);

                    expectWeek([
                        [1, null, null, null, null, null, null],
                        [2, null, null, null, null, null, null],
                        [3, null, null, null, null, null, null]
                    ], 0);
                });

                it("should render items by start time, then duration", function() {
                    makeEventView([{
                        id: 1,
                        startDate: new Date(2016, 0, 10, 9, 30),
                        endDate: new Date(2016, 0, 10, 10, 0)
                    }, {
                        id: 2,
                        startDate: new Date(2016, 0, 10, 10, 30),
                        endDate: new Date(2016, 0, 10, 12, 0)
                    }, {
                        id: 3,
                        startDate: new Date(2016, 0, 10, 10, 30),
                        endDate: new Date(2016, 0, 10, 14, 0)
                    }, {
                        id: 4,
                        startDate: new Date(2016, 0, 10, 11, 0),
                        endDate: new Date(2016, 0, 10, 18, 0)
                    }]);

                    expectWeek([
                        [1, null, null, null, null, null, null],
                        [3, null, null, null, null, null, null],
                        [2, null, null, null, null, null, null],
                        [4, null, null, null, null, null, null]
                    ], 0);
                });
            });
        });
    });
});