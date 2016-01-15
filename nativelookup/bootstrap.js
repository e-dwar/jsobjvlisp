(function (ns) {

    var Thing = {};
    var Class = {};

    // fake classes

    Thing.methods = {
        owns: function (name) {
            return this.hasOwnProperty(name);
        },
        toString: function () {
            return 'I am ' + this.whoami + '.';
        }
    };

    Class.methods = chain(function (sup) {
        this.init = function (name, sup, methods) {
            this.name = name;
            this.methods = sup && sup.methods;
            this.methods = chain(methods, this.methods);
            set(ns, name, this);
        };
        this.new = function () {
            var inst = chain(Dummy, this.methods);
            inst.whoami = 'an instance of ' + this.name;
            inst.init && inst.init.apply(inst, arguments);
            return inst;
        };
        this.subclass = function (name, methods) {
            Class.new(name, this, methods);
        };
        this.addMethod = function (proxy) {
            proxy.call(this.methods, sup.methods);
        };
    }, Thing.methods);

    Class = {
        name: 'Class',
        new: Class.methods.new,
        methods: Class.methods
    };

    // final classes

    Class.new('Thing', null, Dummy);
    ns.Thing.methods = Thing.methods;
    Class.new('Class', ns.Thing, Dummy);
    ns.Class.methods = Class.methods;

    // helpers

    function Dummy () {}

    function chain (head, tail) {
        head.prototype = tail;
        tail = new head(tail);
        head.prototype = null;
        return tail;
    }

    function set (node, path, value) {
        path = path.split('.');
        if (path.length == 1) {
            node[path] = value;
        } else {
            node = node[path[0]] = node[path[0]] || {};
            path = path.slice(1).join('.');
            set(node, path, value);
        }
    }
})(this);






















