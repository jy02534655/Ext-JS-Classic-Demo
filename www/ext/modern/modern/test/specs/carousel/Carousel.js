topSuite("Ext.carousel.Carousel", function() {
    var carousel;

    function makeCarousel(cfg) {
        carousel = new Ext.carousel.Carousel(Ext.apply({
            renderTo: Ext.getBody(),
            width: 400,
            height: 400
        }, cfg));
    }

    function makeCarouselWithItems(n, cfg) {
        var items = [],
            i;

        for (i = 1; i <= n; ++i) {
            items.push({
                html: 'Carousel' + i
            });
        }

        makeCarousel(Ext.apply({
            items: items
        }, cfg));
    }

    afterEach(function() {
        carousel = Ext.destroy(carousel);
    });

    describe("reference", function() {
        it("should be able to look up components by reference", function() {
            makeCarousel({
                referenceHolder: true,
                items: [{
                    reference: 'foo',
                    id: 'carouselFoo'
                }, {
                    reference: 'bar',
                    id: 'carouselBar'
                }]
            });

            expect(carousel.lookup('foo').id).toBe('carouselFoo');
            expect(carousel.lookup('bar').id).toBe('carouselBar');
        });
    });
});