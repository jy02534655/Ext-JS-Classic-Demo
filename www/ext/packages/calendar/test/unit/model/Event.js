describe("Ext.calendar.model.Event", function() {

    var event;

    function makeEvent(data, end) {
        if (Ext.isDate(data)) {
            data = {
                startDate: data,
                endDate: end
            }
        }

        event = new Ext.calendar.model.Event(data);
    }

    afterEach(function() {
        event = null;
    });

    describe("occursInRange", function() {
        beforeEach(function() {
            makeEvent({
                startDate: new Date(2010, 3, 16, 9),
                endDate: new Date(2010, 3, 20, 17)
            });
        });

        describe("valid ranges", function() {
            // event    |-----------------|
            // range    |-----------------|
            it("should return true when the ranges are equal", function() {
                var start = new Date(2010, 3, 16, 9),
                    end = new Date(2010, 3, 20, 17);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event      |----------------------------|
            // range              |------------|
            it("should return true if the range is fully encompassed by the event", function() {
                var start = new Date(2010, 3, 16, 14),
                    end = new Date(2010, 3, 18, 10);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event               |----------|
            // range      |-----------------------------|
            it("should return true if the event is fully encompassed by the range", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 22);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event              |------------------|
            // range       |----------------|
            it("should return true if the start is before the event start and the end is before the event end", function() {
                var start = new Date(2010, 3, 16, 6),
                    end = new Date(2010, 3, 18, 10);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event              |------------------|
            // range       |-------------------------|
            it("should return true if the start is before the event start and the end is equal to the event end", function() {
                var start = new Date(2010, 3, 16, 6),
                    end = new Date(2010, 3, 20, 17);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event        |------------------|
            // range        |-------------------------|
            it("should return true if the start is equal to the event start and the end is after the event end", function() {
                var start = new Date(2010, 3, 16, 9),
                    end = new Date(2010, 3, 20, 22);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event              |------------------|
            // range                   |-------------------------|
            it("should return true if the start is after the event start and the end is after the event end", function() {
                var start = new Date(2010, 3, 17, 6),
                    end = new Date(2010, 3, 22, 20);

                expect(event.occursInRange(start, end)).toBe(true);
            });

            // event              |------------------|
            // range                   |-------------|
            it("should return true if the start is after the event start and the end is equal to the event end", function() {
                var start = new Date(2010, 3, 17, 6),
                    end = new Date(2010, 3, 20, 17);

                expect(event.occursInRange(start, end)).toBe(true);
            });
        });

        describe("invalid ranges", function() {
            // event                   |------------------|
            // range   |-----------|
            it("should return false when the start and end are before the event start", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 15);

                expect(event.occursInRange(start, end)).toBe(false);
            });

            // event    |------------------|
            // range                           |-----------|
            it("should return false when the start and end are after the event end", function() {
                var start = new Date(2010, 3, 21),
                    end = new Date(2010, 3, 22);

                expect(event.occursInRange(start, end)).toBe(false);
            });

            // event          |--------------------|
            // range   |------|
            it("should return false when the end is at the event start", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 16, 9);

                expect(event.occursInRange(start, end)).toBe(false);
            });

            // event   |--------------------|
            // range                        |------|
            it("should return false when the start is at the event end", function() {
                var start = new Date(2010, 3, 20, 17),
                    end = new Date(2010, 3, 20, 20)

                expect(event.occursInRange(start, end)).toBe(false);
            });
        });
    });

    describe("isContainedByRange", function() {
        beforeEach(function() {
            makeEvent({
                startDate: new Date(2010, 3, 16, 9),
                endDate: new Date(2010, 3, 20, 17)
            });
        });

        describe("valid ranges", function() {
            // event    |-----------------|
            // range    |-----------------|
            it("should return true when the ranges are equal", function() {
                var start = new Date(2010, 3, 16, 9),
                    end = new Date(2010, 3, 20, 17);

                expect(event.isContainedByRange(start, end)).toBe(true);
            });

            // event               |----------|
            // range      |-----------------------------|
            it("should return true if the event is fully encompassed by the range", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 22);

                expect(event.isContainedByRange(start, end)).toBe(true);
            });

            // event              |------------------|
            // range       |-------------------------|
            it("should return true if the start is before the event start and the end is equal to the event end", function() {
                var start = new Date(2010, 3, 16, 6),
                    end = new Date(2010, 3, 20, 17);

                expect(event.isContainedByRange(start, end)).toBe(true);
            });

            // event          |------------------|
            // range          |-------------------------|
            it("should return true if the start is equal the event start and the end is after to the event end", function() {
                var start = new Date(2010, 3, 16, 9),
                    end = new Date(2010, 3, 22, 17);

                expect(event.isContainedByRange(start, end)).toBe(true);
            });
        });

        describe("invalid ranges", function() {
            // event      |----------------------------|
            // range              |------------|
            it("should return false if the range is fully encompassed by the event", function() {
                var start = new Date(2010, 3, 16, 14),
                    end = new Date(2010, 3, 18, 10);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event              |------------------|
            // range       |----------------|
            it("should return false if the start is before the event start and the end is before the event end", function() {
                var start = new Date(2010, 3, 16, 6),
                    end = new Date(2010, 3, 18, 10);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event              |------------------|
            // range                   |-------------------------|
            it("should return false if the start is after the event start and the end is after the event end", function() {
                var start = new Date(2010, 3, 17, 6),
                    end = new Date(2010, 3, 22, 20);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event              |------------------|
            // range                   |-------------|
            it("should return false if the start is after the event start and the end is equal to the event end", function() {
                var start = new Date(2010, 3, 17, 6),
                    end = new Date(2010, 3, 20, 17);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event                   |------------------|
            // range   |-----------|
            it("should return false when the start and end are before the event start", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 15);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event    |------------------|
            // range                           |-----------|
            it("should return false when the start and end are after the event end", function() {
                var start = new Date(2010, 3, 21),
                    end = new Date(2010, 3, 22);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event          |--------------------|
            // range   |------|
            it("should return false when the end is at the event start", function() {
                var start = new Date(2010, 3, 14),
                    end = new Date(2010, 3, 16, 9);

                expect(event.isContainedByRange(start, end)).toBe(false);
            });

            // event   |--------------------|
            // range                        |------|
            it("should return false when the start is at the event end", function() {
                var start = new Date(2010, 3, 20, 17),
                    end = new Date(2010, 3, 20, 20)

                expect(event.isContainedByRange(start, end)).toBe(false);
            });
        });
    });
});