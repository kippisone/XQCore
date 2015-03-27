describe('XQCore.Event', function() {
    'use strict';

    describe('on', function() {
        var ee;

        beforeEach(function() {
            ee = new XQCore.Event();
                    
        });

        it('Should register event listener', function() {
            var fn = sinon.stub();
            ee.on('test', fn);

            expect(ee._events).to.be.an('array');
            expect(ee._events).to.have.length(1);
            expect(ee._events[0]).to.equal(fn);
        });
    });

    describe('emit', function() {
        var ee;

        beforeEach(function() {
            ee = new XQCore.Event();
            var ee2 = new XQCore.Event();
            var cbSpy = sinon.spy();
            var cbSpy2 = sinon.spy();
        });

        it('Should emit an event', function() {
            
        });
    });

    beforeEach(function() {

    });

    afterEach(function() {

    });

    it('Should register an event listener', function() {
        var ee = new XQCore.Event();
        var cbSpy = sinon.spy();
        ee.on('test', cbSpy);
        ee.emit('test', 1, { a: 'AA'});

        expect(cbSpy).was.calledOnce();
        expect(cbSpy).was.calledWith(1, { a: 'AA' });
    });

    it('Should register multiple event listener', function() {
        var ee = new XQCore.Event();
        var ee2 = new XQCore.Event();
        var cbSpy = sinon.spy();
        var cbSpy2 = sinon.spy();
        
        ee.on('test', cbSpy);
        ee2.on('test', cbSpy2);
        
        ee.emit('test', 1, { a: 'AA'});
        ee2.emit('test', 2, { b: 'BB'});

        expect(cbSpy).was.calledOnce();
        expect(cbSpy2).was.calledOnce();
        expect(cbSpy).was.calledWith(1, { a: 'AA' });
        expect(cbSpy2).was.calledWith(2, { b: 'BB' });
    });

    it('Should unregister an event listener', function() {
        var ee = new XQCore.Event();
        var cbSpy = sinon.spy();
        ee.on('test', cbSpy);
        ee.emit('test', 1, { a: 'AA'});
        ee.off('test', cbSpy);
        ee.emit('test', 1, { a: 'AA'});

        expect(cbSpy).was.calledOnce();
        expect(cbSpy).was.calledWith(1, { a: 'AA' });
    });

});