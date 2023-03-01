import { event, uoid, utilitas } from 'utilitas';
import natUpnp from 'nat-upnp';

const [_EVENT, jobs, TTL_MIN, TTL_DEFAULT] = ['NAT_UPNP', {}, 10, 60];
const get = (key) => key ? jobs[key] : jobs;

let _client;

const check = async () => {
    const externalIp = await utilitas.call([_client.externalIp, _client]);
    (await utilitas.call(
        [_client.getMappings, _client], { local: true }
    )).map(m => jobs[m.description] && (jobs[m.description].status = m));
    for (let key in jobs) {
        let result, error;
        try {
            result = await utilitas.call(
                [_client.portMapping, _client], jobs[key].options
            );
        } catch (err) { error = err; }
        jobs[key].externalIp = externalIp;
        jobs[key].response = {
            success: !!!error, result, error, updatedAt: new Date(),
        };
        jobs[key].options.callback && await utilitas.ignoreErrFunc(
            () => jobs[key].options.callback(jobs[key])
        );
    }
};

const init = async () => {
    if (!_client) {
        _client = natUpnp.createClient();
        await event.loop(check, 10, 10, 0, _EVENT, { silent: true });
    }
    assert(_client, 'Failed to init NAT-UPNP client.', 500);
    return _client;
};

const end = async () => {
    if (!_client) { return; }
    await event.end(_EVENT);
    for (let key in jobs) {
        await utilitas.call([_client.portUnmapping, _client], jobs[key].options);
        delete jobs[key];
    }
    _client = null;
};

const unifyOptions = (options) => {
    assert(~~options?.private, 'Invalid private port.', 500);
    const description = utilitas.ensureString(
        options?.description || uoid.create({ type: 'UTILITAS:NATUPNP' })
    );
    return {
        ...options, description, private: ~~options.private,
        public: ~~options?.public || ~~options.private,
        ttl: Math.max(~~options?.ttl || TTL_DEFAULT, TTL_MIN),
    };
};

const map = async (opts) => {
    await init();
    const options = unifyOptions(opts);
    jobs[options.description] = { options };
};

const unmap = async (opts) => {
    const options = unifyOptions(opts);
    delete jobs[options.description];
    const resp = await utilitas.call([_client.portUnmapping, _client], options);
    Object.keys(jobs).length || await end();
    return resp;
};

export {
    end,
    get,
    map,
    unmap,
};
