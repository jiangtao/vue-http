import Vue from 'vue'
import http from '../src'

function isDate(time) {
    return new Date(parseInt(time, 10)) instanceof Date
}

function Spy() {
    return function counter() {
        if(!counter.callCount) {
            counter.callCount = 0
        }

        counter.callCount++
    }
}

describe('Vue-http', () => {
    let spy1 = Spy()
    let spy2 = Spy()
    let root = `${location.protocol}//${location.hostname}:8889`

    Vue.use(http, {
        root,
        error: spy1,
        loading: spy2,
        timeout: 2000,
        timestamp: true
    })

    it('get', (done) => {
        let params = { foo: 'bar' }

        Vue.http.get('get', { params }).then((res) => {
            expect(res.ok).to.equal(true)
            expect(res.status).to.equal(200)
            expect(res.data.foo).to.equal(params.foo)
            done()
        })
    })

    it('post', (done) => {
        let params = { foo: 'bar' }

        Vue.http.post('post', params).then((res) => {
            expect(res.ok).to.equal(true)
            expect(res.status).to.equal(200)
            expect(res.data.foo).to.equal(params.foo)
            done()
        })
    })

    it('timestamp', (done) => {
        let params = { foo: 'bar' }

        Vue.Promise.all([
            Vue.http.get('timestamp', { params }),
            Vue.http.post('timestamp', params)
        ]).then((res) => {
            expect(res[0].ok).to.equal(true)
            expect(res[0].status).to.equal(200)
            expect(res[0].data.foo).to.equal(params.foo)
            expect(isDate(res[0].data.t)).to.equal(true)

            expect(res[1].ok).to.equal(true)
            expect(res[1].status).to.equal(200)
            expect(res[1].data.t).to.equal(undefined)
            expect(res[1].data.foo).to.equal(params.foo)
            done()
        })
    })

    it('timeout', (done) => {
        Vue.http.get('timeout')
        setTimeout(() => {
            expect(spy1.callCount).to.equal(1)
            done()
        }, 2200)
    }).timeout(3000)

    it('loading', (done) => {
        Vue.http.get('loading')

        setTimeout(() => {
            expect(spy2.callCount).to.equal(4)
            done()
        }, 2200)
    }).timeout(3000)

    it('repeat', (done) => {
        let params = { foo: 'bar' }

        Vue.http.get('repeat', { params }).then((res) => {
            expect(res.ok).to.equal(true)
            expect(res.status).to.equal(200)
            expect(res.data.foo).to.equal(params.foo)
            done()
        })

        Vue.http.get('repeat', { params })
    })

    it('format data', (done) => {
        let params = { foo: 'bar' }

        Vue.http.get('data', { params }).then((res) => {
            expect(res.code).to.equal(20000)
            expect(res.message).to.equal('done')
            expect(res.data.foo).to.equal(params.foo)
            done()
        })
    })

    it('respone status: 4xx', (done) => {
        Vue.http.get('4xx')

        setTimeout(() => {
            expect(spy1.callCount).to.equal(2)
            done()
        }, 2200)
    }).timeout(3000)

    it('response status: 5xx', (done) => {
        Vue.http.get('5xx')

        setTimeout(() => {
            expect(spy1.callCount).to.equal(3)
            done()
        }, 2200)
    }).timeout(3000)

    it('headers', (done) => {
        Vue.http.get('headers', {
            headers: {
                Auth: 'test'
            }
        }).then((res) => {
            expect(res.ok).to.equal(true)
            expect(res.status).to.equal(200)
            expect(res.data).to.equal('test')
            done()
        })
    })
})