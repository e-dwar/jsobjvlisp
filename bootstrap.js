(function (ns) {

    // local vars

    var _Inst;
    var _Class;
    var Thing;
    var Class;

    // offsets

    var UID = 0;
    var SID = 1;
    var IVS = 2;

    // public primitives

    _Inst = extend(Object, function () {
        this.constructor = function (classId) {
            this.classId = classId;
        };
        this.send = function (msg, args) {
            return basicSend.call(
                this, msg, args, getClass.call(this)
            );
        };
        this.toString = function () {
            var Class = getClass.call(this);
            return 'I am an ' + Class[UID];
        };
    });

    _Class = extend(_Inst, function (sup) {
        this.constructor = function (classId) {
            sup.constructor.call(this, classId);
            this.methods = {};
        };
        this.addMethod = function (name, fn) {
            var superSend = createSuperSend(this[SID]);
            this.methods[name] = function () {
                this.superSend = superSend;
                try { return fn.apply(this, arguments); }
                catch (error) { throw error; } 
                finally { delete this.superSend; }
            };
        };
        this.toString = function () {
            return 'I am the class ' + this[UID];
        };
    });

    // fake Class

    Class = new _Class('Class');
    Class[UID] = 'Class';
    Class[SID] = 'Thing';
    Class[IVS] = ['id', 'superId', 'ivs'];
    declare(Class);

    Class.addMethod('new', function () {
        var inst = allocate.call(this);
        inst.send('init', arguments);
        return inst;
    });

    Class.addMethod('init', function (ivs) {
        this[UID] = ivs.id;
        this[SID] = ivs.superId;
        this[IVS] = ivs.ivs;
        declare(this);
    });

    // final Thing

    Thing = Class.send('new', [{
        id: 'Thing',
        superId: null,
        ivs: []
    }]);

    Thing.addMethod('init', function (ivs) {
        for (var iv in ivs) {
            this.send('set', [iv, ivs[iv]]);
        }
    });

    Thing.addMethod('get', function (iv) {
        var Class = this.send('getClass', []);
        return this[indexOfIV.call(Class, iv)];
    });

    Thing.addMethod('set', function (iv, value) {
        var Class = this.send('getClass', []);
        this[indexOfIV.call(Class, iv)] = value;
    });

    Thing.addMethod('getClass', function () {
        return getClass.call(this);
    });

    // final Class

    Class = Class.send('new', [{
        id: Class[UID],
        superId: Class[SID],
        ivs: Class[IVS]
    }]);

    Class.addMethod('new', function () {
        var inst = allocate.call(this);
        inst.send('init', arguments);
        return inst;
    });

    Class.addMethod('init', function () {
        this.superSend('init', arguments);
        this[IVS] = computeIVs.call(this);
        declare(this);
    });

    // private primitives

    function declare (Class) {
        ns[Class[UID]] = Class;
    }

    function raise (msg) {
        throw new Error(msg);
    }

    function raiseUnknownIV (iv) {
        raise('unknown instance variable "' + iv + '"');
    }

    function raiseUnknownMsg (msg) {
        raise('unknown message "' + msg + '"');
    }

    function getClass () {
        return ns[this.classId];
    }

    function allocate () {
        var isMeta = this[UID] == 'Class';
        var Ctor = isMeta ? _Class : _Inst;
        return new Ctor(this[UID]);
    }

    function computeIVs () {
        var Super = ns[this[SID]];
        ivs = Super[IVS].concat(this[IVS]);
        return uniq(ivs);
    }

    function indexOfIV (iv) {
        var i = this[IVS].indexOf(iv);
        if (i != -1) return i;
        else raiseUnknownIV(iv);
    }

    function basicSend (msg, args, Class) {
        var meth = lookup.call(Class, msg);
        if (!meth) raiseUnknownMsg(msg);
        else return meth.apply(this, args);
    }

    function createSuperSend (superId) {
        return function (msg, args) {
            return basicSend.call(
                this, msg, args, ns[superId]
            );
        };
    }

    function lookup (msg) {
        if (this.methods[msg]) {
            return this.methods[msg];
        } else if (ns[this[SID]]) {
            return lookup.call(ns[this[SID]], msg);
        }
    }

    function uniq (set) {
        var i, ii;
        var r = [];
        var ll = 0;
        var l = set.length;
        for (i = 0, ii = 0; i < l; i++, ii = 0) {
            while (ii < ll && r[ii] != set[i]) ii++;
            if (ii == ll) { r.push(set[i]); ll++; }
        }
        return r;
    }

    // js inheritance

    function extend (Super, proto) {
        proto.prototype = Super.prototype;
        proto = new proto(Super.prototype);
        proto.constructor = getCtor(Super, proto);
        proto.constructor.prototype = proto;
        return proto.constructor;
    }

    function getCtor (Super, proto) {
        if (proto.hasOwnProperty('constructor')) {
            return proto.constructor;
        } else {
            return function () {
                Super.apply(this, arguments);
            };
        }
    }
})(this);



