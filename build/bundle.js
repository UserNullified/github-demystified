
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const subchapterOpened = writable('lerp');

    const chapters = [
        ["Unity Explained", [
            ["What Is Unity ?", "what-is-unity"]
        ]],
        ["Practical Examples", [
            ["Lerp", "lerp"]
        ]]
    ];

    const codeLines = [
        [
            { code: [
                {type: "prefix", value: "public float "},
                {type: "function", value: "Lerp"},
                {type: "text", value: "("},
                {type: "prefix", value: "float "},
                {type: "variable", value: "start"},
                {type: "text", value: ", "},
                {type: "prefix", value: "float "},
                {type: "variable", value: "end"},
                {type: "text", value: ", "},
                {type: "prefix", value: "float "},
                {type: "variable", value: "percentage"},
                {type: "text", value: ")"},
            ], indent: 0 },
            { code: [
                {type: "text", value: "{"},
            ], indent: 0},
            { code: [
                {type: "if", value: "return "},
                {type: "variable", value: "start"},
                {type: "text", value: " + ("},
                {type: "variable", value: "end"},
                {type: "text", value: " - "},
                {type: "variable", value: "start"},
                {type: "text", value: ") * "},
                {type: "variable", value: "percentage"},
                {type: "text", value: ";"}
            ], indent: 1},
            { code: [
                {type: "text", value: "}"},
            ], indent: 0}
        ],
        [
            { code: [
                {type: "comment", value: "// Our initial values."}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "public static float "},
                {type: "classVariable", value: "start"},
                {type: "text", value: " = "},
                {type: "number", value: "0"},
                {type: "classVariable", value:";"}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "public static float "},
                {type: "classVariable", value: "end"},
                {type: "text", value: " = "},
                {type: "number", value: "0"},
                {type: "classVariable", value:";"}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "public static float "},
                {type: "classVariable", value: "percentage"},
                {type: "text", value: " = "},
                {type: "number", value: "0"},
                {type: "classVariable", value:";"}
            ], indent: 0},
            { code: [], indent: 0},
            { code: [
                {type: "comment", value: "// We calculate how much we need to add in total to our start variable."}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "private static float "},
                {type: "classVariable", value: "difference"},
                {type: "text", value: " = "},
                {type: "classVariable", value: "end"},
                {type: "text", value: " - "},
                {type: "classVariable", value: "start;"},
            ], indent: 0},
            { code: [], indent: 0},
            { code: [
                {type: "comment", value: "// We get percentage % from the difference, that will be how much we add this step."}
            ], indent: 0},
            { code: [
                {type: "comment", value: "// Example: percentage = 0.5 (50%); difference = 4; 50% of 4 = 2; toAdd = 2;"}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "private static float "},
                {type: "classVariable", value: "toAdd"},
                {type: "text", value: " = "},
                {type: "classVariable", value: "difference"},
                {type: "text", value: " * "},
                {type: "classVariable", value: "percentage;"},
            ], indent: 0},
            { code: [], indent: 0},
            { code: [
                {type: "comment", value: "// We add our toAdd variable to our start variable to get the result."}
            ], indent: 0},
            { code: [
                {type: "prefix", value: "private static float "},
                {type: "classVariable", value: "result"},
                {type: "text", value: " = "},
                {type: "classVariable", value: "start"},
                {type: "text", value: " + "},
                {type: "classVariable", value: "toAdd;"},
            ], indent: 0},
            { code: [
                {type: "prefix", value: "private static float "},
                {type: "classVariable", value: "resultOneLine"},
                {type: "text", value: " = "},
                {type: "classVariable", value: "start"},
                {type: "text", value: " + ("},
                {type: "classVariable", value: "end"},
                {type: "text", value: " - "},
                {type: "classVariable", value: "start"},
                {type: "text", value: ") * "},
                {type: "classVariable", value: "percentage"},
                {type: "classVariable", value: ";"}
            ], indent: 0},
        ]
    ];

    /* src\Sidebar.svelte generated by Svelte v3.44.2 */
    const file$5 = "src\\Sidebar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (20:12) {#each chapter[1] as subchapter}
    function create_each_block_1$1(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t0_value = `${chapters.indexOf(/*chapter*/ ctx[4]) + 1}.${/*chapter*/ ctx[4][1].indexOf(/*subchapter*/ ctx[7]) + 1}` + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*subchapter*/ ctx[7][0] + "";
    	let t2;
    	let div2_style_value;
    	let t3;
    	let div3_style_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[3](/*subchapter*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(div0, "class", "sidebar-button sidebar-subchapter-number flex-center svelte-1nh0a4c");
    			add_location(div0, file$5, 22, 24, 1362);
    			attr_dev(div1, "class", "sidebar-button sidebar-subchapter-title flex-center svelte-1nh0a4c");
    			add_location(div1, file$5, 23, 24, 1534);
    			attr_dev(div2, "class", "sidebar-button sidebar-subchapter svelte-1nh0a4c");

    			attr_dev(div2, "style", div2_style_value = /*subchapterOpenedValue*/ ctx[1] == /*subchapter*/ ctx[7][1]
    			? "background-color: var(--dark-background-400);"
    			: " background-color: none;");

    			add_location(div2, file$5, 21, 20, 1033);
    			attr_dev(div3, "class", "sidebar-subchapter-container");

    			attr_dev(div3, "style", div3_style_value = /*chaptersOpened*/ ctx[0][chapters.indexOf(/*chapter*/ ctx[4])]
    			? "display: block;"
    			: "display: none;");

    			add_location(div3, file$5, 20, 16, 880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*subchapterOpenedValue*/ 2 && div2_style_value !== (div2_style_value = /*subchapterOpenedValue*/ ctx[1] == /*subchapter*/ ctx[7][1]
    			? "background-color: var(--dark-background-400);"
    			: " background-color: none;")) {
    				attr_dev(div2, "style", div2_style_value);
    			}

    			if (dirty & /*chaptersOpened*/ 1 && div3_style_value !== (div3_style_value = /*chaptersOpened*/ ctx[0][chapters.indexOf(/*chapter*/ ctx[4])]
    			? "display: block;"
    			: "display: none;")) {
    				attr_dev(div3, "style", div3_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(20:12) {#each chapter[1] as subchapter}",
    		ctx
    	});

    	return block;
    }

    // (18:8) {#each chapters as chapter}
    function create_each_block$1(ctx) {
    	let div;
    	let t0_value = /*chapter*/ ctx[4][0] + "";
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*chapter*/ ctx[4]);
    	}

    	let each_value_1 = /*chapter*/ ctx[4][1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div, "class", "sidebar-button sidebar-chapter flex-center svelte-1nh0a4c");
    			add_location(div, file$5, 18, 12, 577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*chaptersOpened, chapters, subchapterOpenedValue, subchapterOpened*/ 3) {
    				each_value_1 = /*chapter*/ ctx[4][1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(18:8) {#each chapters as chapter}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div7;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div3;
    	let t4;
    	let div4;
    	let t5;
    	let div5;
    	let t6;
    	let div6;
    	let each_value = chapters;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Unity Demystified";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "by null#4193";
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div5 = element("div");
    			t6 = space();
    			div6 = element("div");
    			div6.textContent = "v0.2.0";
    			attr_dev(div0, "class", "sidebar-credits-title svelte-1nh0a4c");
    			add_location(div0, file$5, 12, 8, 315);
    			attr_dev(div1, "class", "sidebar-credits-creator svelte-1nh0a4c");
    			add_location(div1, file$5, 13, 8, 383);
    			attr_dev(div2, "class", "sidebar-credits flex-center svelte-1nh0a4c");
    			add_location(div2, file$5, 11, 4, 264);
    			attr_dev(div3, "class", "sidebar-divider svelte-1nh0a4c");
    			add_location(div3, file$5, 15, 4, 456);
    			attr_dev(div4, "class", "sidebar-content svelte-1nh0a4c");
    			add_location(div4, file$5, 16, 4, 497);
    			attr_dev(div5, "class", "sidebar-divider svelte-1nh0a4c");
    			add_location(div5, file$5, 29, 4, 1728);
    			attr_dev(div6, "class", "sidebar-version flex-center svelte-1nh0a4c");
    			add_location(div6, file$5, 30, 4, 1769);
    			attr_dev(div7, "class", "sidebar svelte-1nh0a4c");
    			add_location(div7, file$5, 10, 0, 237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div7, t3);
    			append_dev(div7, div3);
    			append_dev(div7, t4);
    			append_dev(div7, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			append_dev(div7, t5);
    			append_dev(div7, div5);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chapters, chaptersOpened, subchapterOpenedValue, subchapterOpened*/ 3) {
    				each_value = chapters;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	let chaptersOpened = [];
    	let subchapterOpenedValue;

    	subchapterOpened.subscribe(value => {
    		$$invalidate(1, subchapterOpenedValue = value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = chapter => {
    		!chaptersOpened[chapters.indexOf(chapter)]
    		? $$invalidate(0, chaptersOpened[chapters.indexOf(chapter)] = true, chaptersOpened)
    		: $$invalidate(0, chaptersOpened[chapters.indexOf(chapter)] = false, chaptersOpened);
    	};

    	const click_handler_1 = subchapter => {
    		subchapterOpenedValue == subchapter[1]
    		? subchapterOpened.set("default")
    		: subchapterOpened.set(subchapter[1]);
    	};

    	$$self.$capture_state = () => ({
    		chapters,
    		subchapterOpened,
    		chaptersOpened,
    		subchapterOpenedValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('chaptersOpened' in $$props) $$invalidate(0, chaptersOpened = $$props.chaptersOpened);
    		if ('subchapterOpenedValue' in $$props) $$invalidate(1, subchapterOpenedValue = $$props.subchapterOpenedValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [chaptersOpened, subchapterOpenedValue, click_handler, click_handler_1];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\cs\Type.svelte generated by Svelte v3.44.2 */

    const file$4 = "src\\cs\\Type.svelte";

    function create_fragment$4(ctx) {
    	let span;
    	let span_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*type*/ ctx[0]) + " svelte-1muy86p"));
    			add_location(span, file$4, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*type*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty(/*type*/ ctx[0]) + " svelte-1muy86p"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Type', slots, ['default']);
    	let { type } = $$props;
    	const writable_props = ['type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Type> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ type });

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, $$scope, slots];
    }

    class Type extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Type",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !('type' in props)) {
    			console.warn("<Type> was created without expected prop 'type'");
    		}
    	}

    	get type() {
    		throw new Error("<Type>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Type>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\cs\Arg.svelte generated by Svelte v3.44.2 */
    const file$3 = "src\\cs\\Arg.svelte";

    // (7:0) {#if type == "float"}
    function create_if_block$2(ctx) {
    	let span;
    	let type_1;
    	let current;

    	type_1 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(type_1.$$.fragment);
    			add_location(span, file$3, 7, 0, 108);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(type_1, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const type_1_changes = {};

    			if (dirty & /*$$scope, type*/ 5) {
    				type_1_changes.$$scope = { dirty, ctx };
    			}

    			type_1.$set(type_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(type_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(type_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(type_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(7:0) {#if type == \\\"float\\\"}",
    		ctx
    	});

    	return block;
    }

    // (8:33) <Type type="variable">
    function create_default_slot_1$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(8:33) <Type type=\\\"variable\\\">",
    		ctx
    	});

    	return block;
    }

    // (8:6) <Type type="prefix">
    function create_default_slot$2(ctx) {
    	let t0;
    	let t1;
    	let type_1;
    	let current;

    	type_1 = new Type({
    			props: {
    				type: "variable",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text(/*type*/ ctx[0]);
    			t1 = space();
    			create_component(type_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(type_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*type*/ 1) set_data_dev(t0, /*type*/ ctx[0]);
    			const type_1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				type_1_changes.$$scope = { dirty, ctx };
    			}

    			type_1.$set(type_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(type_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(type_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			destroy_component(type_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(8:6) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*type*/ ctx[0] == "float" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*type*/ ctx[0] == "float") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*type*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Arg', slots, ['default']);
    	let { type } = $$props;
    	const writable_props = ['type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Arg> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ type, Type });

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, slots, $$scope];
    }

    class Arg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Arg",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !('type' in props)) {
    			console.warn("<Arg> was created without expected prop 'type'");
    		}
    	}

    	get type() {
    		throw new Error("<Arg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Arg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\code\PageCodeBlock.svelte generated by Svelte v3.44.2 */
    const file$2 = "src\\code\\PageCodeBlock.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (19:20) {:else}
    function create_else_block(ctx) {
    	let type;
    	let current;

    	type = new Type({
    			props: {
    				type: /*lineCode*/ ctx[4].type,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(type.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(type, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const type_changes = {};
    			if (dirty & /*lines*/ 1) type_changes.type = /*lineCode*/ ctx[4].type;

    			if (dirty & /*$$scope, lines*/ 129) {
    				type_changes.$$scope = { dirty, ctx };
    			}

    			type.$set(type_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(type.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(type.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(type, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(19:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:53) 
    function create_if_block_1$1(ctx) {
    	let arg;
    	let current;

    	arg = new Arg({
    			props: {
    				type: /*lineCode*/ ctx[4].argType,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(arg.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(arg, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const arg_changes = {};
    			if (dirty & /*lines*/ 1) arg_changes.type = /*lineCode*/ ctx[4].argType;

    			if (dirty & /*$$scope, lines*/ 129) {
    				arg_changes.$$scope = { dirty, ctx };
    			}

    			arg.$set(arg_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(arg, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(17:53) ",
    		ctx
    	});

    	return block;
    }

    // (15:20) {#if lineCode.type == "text"}
    function create_if_block$1(ctx) {
    	let span;
    	let t_value = /*lineCode*/ ctx[4].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$2, 15, 20, 551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lines*/ 1 && t_value !== (t_value = /*lineCode*/ ctx[4].value + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:20) {#if lineCode.type == \\\"text\\\"}",
    		ctx
    	});

    	return block;
    }

    // (20:20) <Type type={lineCode.type}>
    function create_default_slot_1$1(ctx) {
    	let t_value = /*lineCode*/ ctx[4].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lines*/ 1 && t_value !== (t_value = /*lineCode*/ ctx[4].value + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(20:20) <Type type={lineCode.type}>",
    		ctx
    	});

    	return block;
    }

    // (18:20) <Arg type={lineCode.argType}>
    function create_default_slot$1(ctx) {
    	let t_value = /*lineCode*/ ctx[4].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lines*/ 1 && t_value !== (t_value = /*lineCode*/ ctx[4].value + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(18:20) <Arg type={lineCode.argType}>",
    		ctx
    	});

    	return block;
    }

    // (14:16) {#each line.code as lineCode}
    function create_each_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*lineCode*/ ctx[4].type == "text") return 0;
    		if (/*lineCode*/ ctx[4].type == "arg") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(14:16) {#each line.code as lineCode}",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#each lines as line}
    function create_each_block(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*lines*/ ctx[0].indexOf(/*line*/ ctx[1]) + 1 + "";
    	let t0;
    	let t1;
    	let div1;
    	let pre;
    	let div1_style_value;
    	let t2;
    	let current;
    	let each_value_1 = /*line*/ ctx[1].code;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			pre = element("pre");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(div0, "class", "page-code-block-index svelte-t05jfi");
    			add_location(div0, file$2, 10, 8, 235);
    			add_location(pre, file$2, 12, 12, 426);
    			attr_dev(div1, "class", "page-code-block-code svelte-t05jfi");

    			attr_dev(div1, "style", div1_style_value = /*line*/ ctx[1].indent > 0
    			? `margin-left:${/*line*/ ctx[1].indent * 32}px`
    			: "");

    			add_location(div1, file$2, 11, 8, 311);
    			attr_dev(div2, "class", "page-code-block-line svelte-t05jfi");
    			add_location(div2, file$2, 9, 4, 191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, pre);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(pre, null);
    			}

    			append_dev(div2, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*lines*/ 1) && t0_value !== (t0_value = /*lines*/ ctx[0].indexOf(/*line*/ ctx[1]) + 1 + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*lines*/ 1) {
    				each_value_1 = /*line*/ ctx[1].code;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(pre, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*lines*/ 1 && div1_style_value !== (div1_style_value = /*line*/ ctx[1].indent > 0
    			? `margin-left:${/*line*/ ctx[1].indent * 32}px`
    			: "")) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:4) {#each lines as line}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*lines*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "page-code-block svelte-t05jfi");
    			add_location(div, file$2, 7, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*lines*/ 1) {
    				each_value = /*lines*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PageCodeBlock', slots, []);
    	let { lines } = $$props;
    	const writable_props = ['lines'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PageCodeBlock> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('lines' in $$props) $$invalidate(0, lines = $$props.lines);
    	};

    	$$self.$capture_state = () => ({ lines, Type, Arg });

    	$$self.$inject_state = $$props => {
    		if ('lines' in $$props) $$invalidate(0, lines = $$props.lines);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [lines];
    }

    class PageCodeBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { lines: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PageCodeBlock",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*lines*/ ctx[0] === undefined && !('lines' in props)) {
    			console.warn("<PageCodeBlock> was created without expected prop 'lines'");
    		}
    	}

    	get lines() {
    		throw new Error("<PageCodeBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lines(value) {
    		throw new Error("<PageCodeBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Page.svelte generated by Svelte v3.44.2 */
    const file$1 = "src\\Page.svelte";

    // (44:46) 
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div3;
    	let t4;
    	let div5;
    	let strong0;
    	let t6;
    	let strong1;
    	let t8;
    	let strong2;
    	let t10;
    	let strong3;
    	let t12;
    	let br0;
    	let t13;
    	let strong4;
    	let t15;
    	let strong5;
    	let t17;
    	let strong6;
    	let t19;
    	let strong7;
    	let t21;
    	let br1;
    	let t22;
    	let strong8;
    	let t24;
    	let strong9;
    	let t26;
    	let br2;
    	let t27;
    	let div4;
    	let pre0;
    	let type0;
    	let t28;
    	let type1;
    	let t29;
    	let arg0;
    	let t30;
    	let arg1;
    	let t31;
    	let arg2;
    	let t32;
    	let t33;
    	let div6;
    	let t35;
    	let div32;
    	let t36;
    	let strong10;
    	let type2;
    	let t37;
    	let type3;
    	let t38;
    	let strong11;
    	let t40;
    	let pagecodeblock0;
    	let t41;
    	let strong12;
    	let type4;
    	let t42;
    	let strong13;
    	let type5;
    	let t43;
    	let br3;
    	let t44;
    	let strong14;
    	let type6;
    	let t45;
    	let strong15;
    	let t47;
    	let strong16;
    	let type7;
    	let t48;
    	let strong17;
    	let t50;
    	let strong18;
    	let type8;
    	let t51;
    	let strong19;
    	let type9;
    	let t52;
    	let t53;
    	let strong20;
    	let type10;
    	let t54;
    	let br4;
    	let t55;
    	let strong21;
    	let t57;
    	let strong22;
    	let t59;
    	let strong23;
    	let t61;
    	let pagecodeblock1;
    	let t62;
    	let strong24;
    	let t64;
    	let strong25;
    	let t66;
    	let div31;
    	let div28;
    	let div9;
    	let div7;
    	let pre1;
    	let type11;
    	let t67;
    	let type12;
    	let t68;
    	let div8;
    	let pre2;
    	let t70;
    	let div12;
    	let div10;
    	let pre3;
    	let type13;
    	let t71;
    	let type14;
    	let t72;
    	let div11;
    	let pre4;
    	let t74;
    	let div15;
    	let div13;
    	let pre5;
    	let type15;
    	let t75;
    	let type16;
    	let t76;
    	let div14;
    	let pre6;
    	let t77_value = Math.round(/*lerpDifference*/ ctx[1]) + "";
    	let t77;
    	let t78;
    	let div18;
    	let div16;
    	let pre7;
    	let type17;
    	let t79;
    	let type18;
    	let t80;
    	let div17;
    	let pre8;
    	let t81_value = /*lerpPercentage*/ ctx[3].toFixed(3) + "";
    	let t81;
    	let t82;
    	let div21;
    	let div19;
    	let t83;
    	let div20;
    	let pre9;
    	let t84_value = `${(/*lerpPercentage*/ ctx[3] * 100).toFixed(1)}%` + "";
    	let t84;
    	let t85;
    	let div24;
    	let div22;
    	let pre10;
    	let type19;
    	let t86;
    	let type20;
    	let t87;
    	let div23;
    	let pre11;
    	let t88_value = /*lerpToAdd*/ ctx[2].toFixed(2) + "";
    	let t88;
    	let t89;
    	let div27;
    	let div25;
    	let pre12;
    	let type21;
    	let t90;
    	let type22;
    	let t91;
    	let div26;
    	let pre13;
    	let t92_value = Math.round(/*lerpValue*/ ctx[4]) + "";
    	let t92;
    	let t93;
    	let div30;
    	let div29;
    	let div29_style_value;
    	let t94;
    	let br5;
    	let t95;
    	let br6;
    	let current;
    	let mounted;
    	let dispose;

    	type0 = new Type({
    			props: {
    				type: "struct",
    				$$slots: { default: [create_default_slot_25] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type1 = new Type({
    			props: {
    				type: "function",
    				$$slots: { default: [create_default_slot_24] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	arg0 = new Arg({
    			props: {
    				type: "float",
    				$$slots: { default: [create_default_slot_23] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	arg1 = new Arg({
    			props: {
    				type: "float",
    				$$slots: { default: [create_default_slot_22] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	arg2 = new Arg({
    			props: {
    				type: "float",
    				$$slots: { default: [create_default_slot_21] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type2 = new Type({
    			props: {
    				type: "struct",
    				$$slots: { default: [create_default_slot_20] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type3 = new Type({
    			props: {
    				type: "function",
    				$$slots: { default: [create_default_slot_19] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pagecodeblock0 = new PageCodeBlock({
    			props: { lines: codeLines[0] },
    			$$inline: true
    		});

    	type4 = new Type({
    			props: {
    				type: "function",
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type5 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type6 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type7 = new Type({
    			props: {
    				type: "variable",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type8 = new Type({
    			props: {
    				type: "variable",
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type9 = new Type({
    			props: {
    				type: "variable",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type10 = new Type({
    			props: {
    				type: "variable",
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	pagecodeblock1 = new PageCodeBlock({
    			props: { lines: codeLines[1] },
    			$$inline: true
    		});

    	type11 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type12 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type13 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type14 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type15 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type16 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type17 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type18 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type19 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type20 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type21 = new Type({
    			props: {
    				type: "prefix",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	type22 = new Type({
    			props: {
    				type: "classVariable",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Lerp";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "And How To Use It";
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div5 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Lerp";
    			t6 = text(", otherwise known as ");
    			strong1 = element("strong");
    			strong1.textContent = "Linear Interpolation";
    			t8 = text(", is a way to ");
    			strong2 = element("strong");
    			strong2.textContent = "move (interpolate)";
    			t10 = text(" between ");
    			strong3 = element("strong");
    			strong3.textContent = "2 values";
    			t12 = text(".");
    			br0 = element("br");
    			t13 = space();
    			strong4 = element("strong");
    			strong4.textContent = "Lerp";
    			t15 = text(" requires 3 arguments, a ");
    			strong5 = element("strong");
    			strong5.textContent = "start";
    			t17 = text(", an ");
    			strong6 = element("strong");
    			strong6.textContent = "end";
    			t19 = text(" and a ");
    			strong7 = element("strong");
    			strong7.textContent = "percentage (alpha, t, ...)";
    			t21 = text(".");
    			br1 = element("br");
    			t22 = space();
    			strong8 = element("strong");
    			strong8.textContent = "Unity's Mathf struct";
    			t24 = text(" has a ");
    			strong9 = element("strong");
    			strong9.textContent = "built-in Lerp function";
    			t26 = text(":");
    			br2 = element("br");
    			t27 = space();
    			div4 = element("div");
    			pre0 = element("pre");
    			create_component(type0.$$.fragment);
    			t28 = text(".");
    			create_component(type1.$$.fragment);
    			t29 = text("(");
    			create_component(arg0.$$.fragment);
    			t30 = text(", ");
    			create_component(arg1.$$.fragment);
    			t31 = text(", ");
    			create_component(arg2.$$.fragment);
    			t32 = text(");");
    			t33 = space();
    			div6 = element("div");
    			div6.textContent = "What Does Lerp Do ?";
    			t35 = space();
    			div32 = element("div");
    			t36 = text("To easily imagine what ");
    			strong10 = element("strong");
    			create_component(type2.$$.fragment);
    			t37 = text(".");
    			create_component(type3.$$.fragment);
    			t38 = text(" does, let's look at an ");
    			strong11 = element("strong");
    			strong11.textContent = "example implementation";
    			t40 = text(":\r\n\t\t\t");
    			create_component(pagecodeblock0.$$.fragment);
    			t41 = text("\r\n\t\t\tWe have a ");
    			strong12 = element("strong");
    			create_component(type4.$$.fragment);
    			t42 = text(" that returns a ");
    			strong13 = element("strong");
    			create_component(type5.$$.fragment);
    			t43 = text(".");
    			br3 = element("br");
    			t44 = text("\r\n\t\t\tTo get this ");
    			strong14 = element("strong");
    			create_component(type6.$$.fragment);
    			t45 = text(" we ");
    			strong15 = element("strong");
    			strong15.textContent = "start with";
    			t47 = text(" our ");
    			strong16 = element("strong");
    			create_component(type7.$$.fragment);
    			t48 = text(", and ");
    			strong17 = element("strong");
    			strong17.textContent = "add the difference between";
    			t50 = space();
    			strong18 = element("strong");
    			create_component(type8.$$.fragment);
    			t51 = text(" and ");
    			strong19 = element("strong");
    			create_component(type9.$$.fragment);
    			t52 = text(" multiplied");
    			t53 = text(" by our ");
    			strong20 = element("strong");
    			create_component(type10.$$.fragment);
    			t54 = text(".");
    			br4 = element("br");
    			t55 = text("\r\n\t\t\tLet's ");
    			strong21 = element("strong");
    			strong21.textContent = "go over";
    			t57 = text(" this function ");
    			strong22 = element("strong");
    			strong22.textContent = "step by step";
    			t59 = text(" with ");
    			strong23 = element("strong");
    			strong23.textContent = "some values";
    			t61 = text(":\r\n\t\t\t");
    			create_component(pagecodeblock1.$$.fragment);
    			t62 = space();
    			strong24 = element("strong");
    			strong24.textContent = "Another way";
    			t64 = text(" too look at how Lerp works is ");
    			strong25 = element("strong");
    			strong25.textContent = "an animation";
    			t66 = text("!\r\n\t\t\t");
    			div31 = element("div");
    			div28 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			pre1 = element("pre");
    			create_component(type11.$$.fragment);
    			t67 = text(" ");
    			create_component(type12.$$.fragment);
    			t68 = space();
    			div8 = element("div");
    			pre2 = element("pre");
    			pre2.textContent = `${Math.round(/*lerpStart*/ ctx[5])}`;
    			t70 = space();
    			div12 = element("div");
    			div10 = element("div");
    			pre3 = element("pre");
    			create_component(type13.$$.fragment);
    			t71 = text(" ");
    			create_component(type14.$$.fragment);
    			t72 = space();
    			div11 = element("div");
    			pre4 = element("pre");
    			pre4.textContent = `${Math.round(/*lerpEnd*/ ctx[6])}`;
    			t74 = space();
    			div15 = element("div");
    			div13 = element("div");
    			pre5 = element("pre");
    			create_component(type15.$$.fragment);
    			t75 = text(" ");
    			create_component(type16.$$.fragment);
    			t76 = space();
    			div14 = element("div");
    			pre6 = element("pre");
    			t77 = text(t77_value);
    			t78 = space();
    			div18 = element("div");
    			div16 = element("div");
    			pre7 = element("pre");
    			create_component(type17.$$.fragment);
    			t79 = text(" ");
    			create_component(type18.$$.fragment);
    			t80 = space();
    			div17 = element("div");
    			pre8 = element("pre");
    			t81 = text(t81_value);
    			t82 = space();
    			div21 = element("div");
    			div19 = element("div");
    			t83 = space();
    			div20 = element("div");
    			pre9 = element("pre");
    			t84 = text(t84_value);
    			t85 = space();
    			div24 = element("div");
    			div22 = element("div");
    			pre10 = element("pre");
    			create_component(type19.$$.fragment);
    			t86 = text(" ");
    			create_component(type20.$$.fragment);
    			t87 = space();
    			div23 = element("div");
    			pre11 = element("pre");
    			t88 = text(t88_value);
    			t89 = space();
    			div27 = element("div");
    			div25 = element("div");
    			pre12 = element("pre");
    			create_component(type21.$$.fragment);
    			t90 = text(" ");
    			create_component(type22.$$.fragment);
    			t91 = space();
    			div26 = element("div");
    			pre13 = element("pre");
    			t92 = text(t92_value);
    			t93 = space();
    			div30 = element("div");
    			div29 = element("div");
    			t94 = text("\r\n\t\t\tIn this animation we use a square, and update its position based on the value from the Lerp function we made earlier.");
    			br5 = element("br");
    			t95 = text("\r\n\t\t\tWe can see that, as the percentage variable goes up, so does the result. This is because the percentage variable shows close to the end variable we are. ");
    			br6 = element("br");
    			attr_dev(div0, "class", "page-title svelte-1a63stj");
    			add_location(div0, file$1, 45, 12, 1264);
    			attr_dev(div1, "class", "page-subtitle svelte-1a63stj");
    			add_location(div1, file$1, 46, 12, 1312);
    			attr_dev(div2, "class", "page-title-container flex-center svelte-1a63stj");
    			add_location(div2, file$1, 44, 8, 1187);
    			attr_dev(div3, "class", "page-divider svelte-1a63stj");
    			add_location(div3, file$1, 48, 8, 1388);
    			add_location(strong0, file$1, 50, 12, 1472);
    			add_location(strong1, file$1, 50, 54, 1514);
    			add_location(strong2, file$1, 50, 105, 1565);
    			add_location(strong3, file$1, 50, 149, 1609);
    			add_location(br0, file$1, 50, 175, 1635);
    			add_location(strong4, file$1, 51, 12, 1653);
    			add_location(strong5, file$1, 51, 58, 1699);
    			add_location(strong6, file$1, 51, 85, 1726);
    			add_location(strong7, file$1, 51, 112, 1753);
    			add_location(br1, file$1, 51, 156, 1797);
    			add_location(strong8, file$1, 52, 12, 1815);
    			add_location(strong9, file$1, 52, 56, 1859);
    			add_location(br2, file$1, 52, 96, 1899);
    			add_location(pre0, file$1, 54, 16, 1974);
    			attr_dev(div4, "class", "page-function flex-center svelte-1a63stj");
    			add_location(div4, file$1, 53, 12, 1917);
    			attr_dev(div5, "class", "page-paragraph svelte-1a63stj");
    			add_location(div5, file$1, 49, 8, 1430);
    			attr_dev(div6, "class", "page-header svelte-1a63stj");
    			add_location(div6, file$1, 57, 8, 2179);
    			add_location(strong10, file$1, 59, 35, 2304);
    			add_location(strong11, file$1, 59, 142, 2411);
    			add_location(strong12, file$1, 61, 13, 2508);
    			add_location(strong13, file$1, 61, 83, 2578);
    			add_location(br3, file$1, 61, 133, 2628);
    			add_location(strong14, file$1, 62, 15, 2649);
    			add_location(strong15, file$1, 62, 68, 2702);
    			add_location(strong16, file$1, 62, 100, 2734);
    			add_location(strong17, file$1, 62, 157, 2791);
    			add_location(strong18, file$1, 63, 3, 2839);
    			add_location(strong19, file$1, 63, 57, 2893);
    			add_location(strong20, file$1, 63, 127, 2963);
    			add_location(br4, file$1, 63, 184, 3020);
    			add_location(strong21, file$1, 64, 9, 3035);
    			add_location(strong22, file$1, 64, 48, 3074);
    			add_location(strong23, file$1, 64, 83, 3109);
    			add_location(strong24, file$1, 66, 3, 3185);
    			add_location(strong25, file$1, 66, 62, 3244);
    			add_location(pre1, file$1, 71, 7, 3460);
    			attr_dev(div7, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div7, file$1, 70, 6, 3405);
    			add_location(pre2, file$1, 76, 7, 3640);
    			attr_dev(div8, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div8, file$1, 75, 6, 3584);
    			attr_dev(div9, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div9, file$1, 69, 5, 3356);
    			add_location(pre3, file$1, 83, 7, 3831);
    			attr_dev(div10, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div10, file$1, 82, 6, 3776);
    			add_location(pre4, file$1, 88, 7, 4009);
    			attr_dev(div11, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div11, file$1, 87, 6, 3953);
    			attr_dev(div12, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div12, file$1, 81, 5, 3727);
    			add_location(pre5, file$1, 95, 7, 4198);
    			attr_dev(div13, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div13, file$1, 94, 6, 4143);
    			add_location(pre6, file$1, 100, 7, 4383);
    			attr_dev(div14, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div14, file$1, 99, 6, 4327);
    			attr_dev(div15, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div15, file$1, 93, 5, 4094);
    			add_location(pre7, file$1, 107, 7, 4579);
    			attr_dev(div16, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div16, file$1, 106, 6, 4524);
    			add_location(pre8, file$1, 112, 7, 4764);
    			attr_dev(div17, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div17, file$1, 111, 6, 4708);
    			attr_dev(div18, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div18, file$1, 105, 5, 4475);
    			attr_dev(div19, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div19, file$1, 118, 6, 4904);
    			add_location(pre9, file$1, 120, 7, 5020);
    			attr_dev(div20, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div20, file$1, 119, 6, 4964);
    			attr_dev(div21, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div21, file$1, 117, 5, 4855);
    			add_location(pre10, file$1, 127, 7, 5229);
    			attr_dev(div22, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div22, file$1, 126, 6, 5174);
    			add_location(pre11, file$1, 132, 7, 5409);
    			attr_dev(div23, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div23, file$1, 131, 6, 5353);
    			attr_dev(div24, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div24, file$1, 125, 5, 5125);
    			add_location(pre12, file$1, 139, 7, 5599);
    			attr_dev(div25, "class", "page-animation-sidebar-line-name svelte-1a63stj");
    			add_location(div25, file$1, 138, 6, 5544);
    			add_location(pre13, file$1, 144, 7, 5780);
    			attr_dev(div26, "class", "page-animation-sidebar-line-value svelte-1a63stj");
    			add_location(div26, file$1, 143, 6, 5724);
    			attr_dev(div27, "class", "page-animation-sidebar-line svelte-1a63stj");
    			add_location(div27, file$1, 137, 5, 5495);
    			attr_dev(div28, "class", "page-animation-sidebar svelte-1a63stj");
    			add_location(div28, file$1, 68, 4, 3313);
    			attr_dev(div29, "class", "lerp-animation-square svelte-1a63stj");
    			attr_dev(div29, "style", div29_style_value = `left: ${/*lerpValue*/ ctx[4]}%`);
    			add_location(div29, file$1, 151, 5, 5921);
    			attr_dev(div30, "class", "page-animation-content svelte-1a63stj");
    			add_location(div30, file$1, 150, 4, 5878);
    			attr_dev(div31, "class", "page-animation svelte-1a63stj");
    			add_location(div31, file$1, 67, 3, 3279);
    			add_location(br5, file$1, 154, 120, 6137);
    			add_location(br6, file$1, 155, 156, 6299);
    			attr_dev(div32, "class", "page-paragraph svelte-1a63stj");
    			add_location(div32, file$1, 58, 8, 2239);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, strong0);
    			append_dev(div5, t6);
    			append_dev(div5, strong1);
    			append_dev(div5, t8);
    			append_dev(div5, strong2);
    			append_dev(div5, t10);
    			append_dev(div5, strong3);
    			append_dev(div5, t12);
    			append_dev(div5, br0);
    			append_dev(div5, t13);
    			append_dev(div5, strong4);
    			append_dev(div5, t15);
    			append_dev(div5, strong5);
    			append_dev(div5, t17);
    			append_dev(div5, strong6);
    			append_dev(div5, t19);
    			append_dev(div5, strong7);
    			append_dev(div5, t21);
    			append_dev(div5, br1);
    			append_dev(div5, t22);
    			append_dev(div5, strong8);
    			append_dev(div5, t24);
    			append_dev(div5, strong9);
    			append_dev(div5, t26);
    			append_dev(div5, br2);
    			append_dev(div5, t27);
    			append_dev(div5, div4);
    			append_dev(div4, pre0);
    			mount_component(type0, pre0, null);
    			append_dev(pre0, t28);
    			mount_component(type1, pre0, null);
    			append_dev(pre0, t29);
    			mount_component(arg0, pre0, null);
    			append_dev(pre0, t30);
    			mount_component(arg1, pre0, null);
    			append_dev(pre0, t31);
    			mount_component(arg2, pre0, null);
    			append_dev(pre0, t32);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div6, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, div32, anchor);
    			append_dev(div32, t36);
    			append_dev(div32, strong10);
    			mount_component(type2, strong10, null);
    			append_dev(strong10, t37);
    			mount_component(type3, strong10, null);
    			append_dev(div32, t38);
    			append_dev(div32, strong11);
    			append_dev(div32, t40);
    			mount_component(pagecodeblock0, div32, null);
    			append_dev(div32, t41);
    			append_dev(div32, strong12);
    			mount_component(type4, strong12, null);
    			append_dev(div32, t42);
    			append_dev(div32, strong13);
    			mount_component(type5, strong13, null);
    			append_dev(div32, t43);
    			append_dev(div32, br3);
    			append_dev(div32, t44);
    			append_dev(div32, strong14);
    			mount_component(type6, strong14, null);
    			append_dev(div32, t45);
    			append_dev(div32, strong15);
    			append_dev(div32, t47);
    			append_dev(div32, strong16);
    			mount_component(type7, strong16, null);
    			append_dev(div32, t48);
    			append_dev(div32, strong17);
    			append_dev(div32, t50);
    			append_dev(div32, strong18);
    			mount_component(type8, strong18, null);
    			append_dev(div32, t51);
    			append_dev(div32, strong19);
    			mount_component(type9, strong19, null);
    			append_dev(strong19, t52);
    			append_dev(div32, t53);
    			append_dev(div32, strong20);
    			mount_component(type10, strong20, null);
    			append_dev(div32, t54);
    			append_dev(div32, br4);
    			append_dev(div32, t55);
    			append_dev(div32, strong21);
    			append_dev(div32, t57);
    			append_dev(div32, strong22);
    			append_dev(div32, t59);
    			append_dev(div32, strong23);
    			append_dev(div32, t61);
    			mount_component(pagecodeblock1, div32, null);
    			append_dev(div32, t62);
    			append_dev(div32, strong24);
    			append_dev(div32, t64);
    			append_dev(div32, strong25);
    			append_dev(div32, t66);
    			append_dev(div32, div31);
    			append_dev(div31, div28);
    			append_dev(div28, div9);
    			append_dev(div9, div7);
    			append_dev(div7, pre1);
    			mount_component(type11, pre1, null);
    			append_dev(pre1, t67);
    			mount_component(type12, pre1, null);
    			append_dev(div9, t68);
    			append_dev(div9, div8);
    			append_dev(div8, pre2);
    			append_dev(div28, t70);
    			append_dev(div28, div12);
    			append_dev(div12, div10);
    			append_dev(div10, pre3);
    			mount_component(type13, pre3, null);
    			append_dev(pre3, t71);
    			mount_component(type14, pre3, null);
    			append_dev(div12, t72);
    			append_dev(div12, div11);
    			append_dev(div11, pre4);
    			append_dev(div28, t74);
    			append_dev(div28, div15);
    			append_dev(div15, div13);
    			append_dev(div13, pre5);
    			mount_component(type15, pre5, null);
    			append_dev(pre5, t75);
    			mount_component(type16, pre5, null);
    			append_dev(div15, t76);
    			append_dev(div15, div14);
    			append_dev(div14, pre6);
    			append_dev(pre6, t77);
    			append_dev(div28, t78);
    			append_dev(div28, div18);
    			append_dev(div18, div16);
    			append_dev(div16, pre7);
    			mount_component(type17, pre7, null);
    			append_dev(pre7, t79);
    			mount_component(type18, pre7, null);
    			append_dev(div18, t80);
    			append_dev(div18, div17);
    			append_dev(div17, pre8);
    			append_dev(pre8, t81);
    			append_dev(div28, t82);
    			append_dev(div28, div21);
    			append_dev(div21, div19);
    			append_dev(div21, t83);
    			append_dev(div21, div20);
    			append_dev(div20, pre9);
    			append_dev(pre9, t84);
    			append_dev(div28, t85);
    			append_dev(div28, div24);
    			append_dev(div24, div22);
    			append_dev(div22, pre10);
    			mount_component(type19, pre10, null);
    			append_dev(pre10, t86);
    			mount_component(type20, pre10, null);
    			append_dev(div24, t87);
    			append_dev(div24, div23);
    			append_dev(div23, pre11);
    			append_dev(pre11, t88);
    			append_dev(div28, t89);
    			append_dev(div28, div27);
    			append_dev(div27, div25);
    			append_dev(div25, pre12);
    			mount_component(type21, pre12, null);
    			append_dev(pre12, t90);
    			mount_component(type22, pre12, null);
    			append_dev(div27, t91);
    			append_dev(div27, div26);
    			append_dev(div26, pre13);
    			append_dev(pre13, t92);
    			append_dev(div31, t93);
    			append_dev(div31, div30);
    			append_dev(div30, div29);
    			append_dev(div32, t94);
    			append_dev(div32, br5);
    			append_dev(div32, t95);
    			append_dev(div32, br6);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "load", /*lerp*/ ctx[7](), false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const type0_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type0_changes.$$scope = { dirty, ctx };
    			}

    			type0.$set(type0_changes);
    			const type1_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type1_changes.$$scope = { dirty, ctx };
    			}

    			type1.$set(type1_changes);
    			const arg0_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				arg0_changes.$$scope = { dirty, ctx };
    			}

    			arg0.$set(arg0_changes);
    			const arg1_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				arg1_changes.$$scope = { dirty, ctx };
    			}

    			arg1.$set(arg1_changes);
    			const arg2_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				arg2_changes.$$scope = { dirty, ctx };
    			}

    			arg2.$set(arg2_changes);
    			const type2_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type2_changes.$$scope = { dirty, ctx };
    			}

    			type2.$set(type2_changes);
    			const type3_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type3_changes.$$scope = { dirty, ctx };
    			}

    			type3.$set(type3_changes);
    			const type4_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type4_changes.$$scope = { dirty, ctx };
    			}

    			type4.$set(type4_changes);
    			const type5_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type5_changes.$$scope = { dirty, ctx };
    			}

    			type5.$set(type5_changes);
    			const type6_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type6_changes.$$scope = { dirty, ctx };
    			}

    			type6.$set(type6_changes);
    			const type7_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type7_changes.$$scope = { dirty, ctx };
    			}

    			type7.$set(type7_changes);
    			const type8_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type8_changes.$$scope = { dirty, ctx };
    			}

    			type8.$set(type8_changes);
    			const type9_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type9_changes.$$scope = { dirty, ctx };
    			}

    			type9.$set(type9_changes);
    			const type10_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type10_changes.$$scope = { dirty, ctx };
    			}

    			type10.$set(type10_changes);
    			const type11_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type11_changes.$$scope = { dirty, ctx };
    			}

    			type11.$set(type11_changes);
    			const type12_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type12_changes.$$scope = { dirty, ctx };
    			}

    			type12.$set(type12_changes);
    			const type13_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type13_changes.$$scope = { dirty, ctx };
    			}

    			type13.$set(type13_changes);
    			const type14_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type14_changes.$$scope = { dirty, ctx };
    			}

    			type14.$set(type14_changes);
    			const type15_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type15_changes.$$scope = { dirty, ctx };
    			}

    			type15.$set(type15_changes);
    			const type16_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type16_changes.$$scope = { dirty, ctx };
    			}

    			type16.$set(type16_changes);
    			if ((!current || dirty & /*lerpDifference*/ 2) && t77_value !== (t77_value = Math.round(/*lerpDifference*/ ctx[1]) + "")) set_data_dev(t77, t77_value);
    			const type17_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type17_changes.$$scope = { dirty, ctx };
    			}

    			type17.$set(type17_changes);
    			const type18_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type18_changes.$$scope = { dirty, ctx };
    			}

    			type18.$set(type18_changes);
    			if ((!current || dirty & /*lerpPercentage*/ 8) && t81_value !== (t81_value = /*lerpPercentage*/ ctx[3].toFixed(3) + "")) set_data_dev(t81, t81_value);
    			if ((!current || dirty & /*lerpPercentage*/ 8) && t84_value !== (t84_value = `${(/*lerpPercentage*/ ctx[3] * 100).toFixed(1)}%` + "")) set_data_dev(t84, t84_value);
    			const type19_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type19_changes.$$scope = { dirty, ctx };
    			}

    			type19.$set(type19_changes);
    			const type20_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type20_changes.$$scope = { dirty, ctx };
    			}

    			type20.$set(type20_changes);
    			if ((!current || dirty & /*lerpToAdd*/ 4) && t88_value !== (t88_value = /*lerpToAdd*/ ctx[2].toFixed(2) + "")) set_data_dev(t88, t88_value);
    			const type21_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type21_changes.$$scope = { dirty, ctx };
    			}

    			type21.$set(type21_changes);
    			const type22_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				type22_changes.$$scope = { dirty, ctx };
    			}

    			type22.$set(type22_changes);
    			if ((!current || dirty & /*lerpValue*/ 16) && t92_value !== (t92_value = Math.round(/*lerpValue*/ ctx[4]) + "")) set_data_dev(t92, t92_value);

    			if (!current || dirty & /*lerpValue*/ 16 && div29_style_value !== (div29_style_value = `left: ${/*lerpValue*/ ctx[4]}%`)) {
    				attr_dev(div29, "style", div29_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(type0.$$.fragment, local);
    			transition_in(type1.$$.fragment, local);
    			transition_in(arg0.$$.fragment, local);
    			transition_in(arg1.$$.fragment, local);
    			transition_in(arg2.$$.fragment, local);
    			transition_in(type2.$$.fragment, local);
    			transition_in(type3.$$.fragment, local);
    			transition_in(pagecodeblock0.$$.fragment, local);
    			transition_in(type4.$$.fragment, local);
    			transition_in(type5.$$.fragment, local);
    			transition_in(type6.$$.fragment, local);
    			transition_in(type7.$$.fragment, local);
    			transition_in(type8.$$.fragment, local);
    			transition_in(type9.$$.fragment, local);
    			transition_in(type10.$$.fragment, local);
    			transition_in(pagecodeblock1.$$.fragment, local);
    			transition_in(type11.$$.fragment, local);
    			transition_in(type12.$$.fragment, local);
    			transition_in(type13.$$.fragment, local);
    			transition_in(type14.$$.fragment, local);
    			transition_in(type15.$$.fragment, local);
    			transition_in(type16.$$.fragment, local);
    			transition_in(type17.$$.fragment, local);
    			transition_in(type18.$$.fragment, local);
    			transition_in(type19.$$.fragment, local);
    			transition_in(type20.$$.fragment, local);
    			transition_in(type21.$$.fragment, local);
    			transition_in(type22.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(type0.$$.fragment, local);
    			transition_out(type1.$$.fragment, local);
    			transition_out(arg0.$$.fragment, local);
    			transition_out(arg1.$$.fragment, local);
    			transition_out(arg2.$$.fragment, local);
    			transition_out(type2.$$.fragment, local);
    			transition_out(type3.$$.fragment, local);
    			transition_out(pagecodeblock0.$$.fragment, local);
    			transition_out(type4.$$.fragment, local);
    			transition_out(type5.$$.fragment, local);
    			transition_out(type6.$$.fragment, local);
    			transition_out(type7.$$.fragment, local);
    			transition_out(type8.$$.fragment, local);
    			transition_out(type9.$$.fragment, local);
    			transition_out(type10.$$.fragment, local);
    			transition_out(pagecodeblock1.$$.fragment, local);
    			transition_out(type11.$$.fragment, local);
    			transition_out(type12.$$.fragment, local);
    			transition_out(type13.$$.fragment, local);
    			transition_out(type14.$$.fragment, local);
    			transition_out(type15.$$.fragment, local);
    			transition_out(type16.$$.fragment, local);
    			transition_out(type17.$$.fragment, local);
    			transition_out(type18.$$.fragment, local);
    			transition_out(type19.$$.fragment, local);
    			transition_out(type20.$$.fragment, local);
    			transition_out(type21.$$.fragment, local);
    			transition_out(type22.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div5);
    			destroy_component(type0);
    			destroy_component(type1);
    			destroy_component(arg0);
    			destroy_component(arg1);
    			destroy_component(arg2);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(div32);
    			destroy_component(type2);
    			destroy_component(type3);
    			destroy_component(pagecodeblock0);
    			destroy_component(type4);
    			destroy_component(type5);
    			destroy_component(type6);
    			destroy_component(type7);
    			destroy_component(type8);
    			destroy_component(type9);
    			destroy_component(type10);
    			destroy_component(pagecodeblock1);
    			destroy_component(type11);
    			destroy_component(type12);
    			destroy_component(type13);
    			destroy_component(type14);
    			destroy_component(type15);
    			destroy_component(type16);
    			destroy_component(type17);
    			destroy_component(type18);
    			destroy_component(type19);
    			destroy_component(type20);
    			destroy_component(type21);
    			destroy_component(type22);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(44:46) ",
    		ctx
    	});

    	return block;
    }

    // (42:4) {#if subchapterOpenedValue == "default"}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No Subchapter Opened!";
    			set_style(div, "font-size", "32px");
    			set_style(div, "color", "var(--dark-text-primary-500)");
    			add_location(div, file$1, 42, 8, 1035);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:4) {#if subchapterOpenedValue == \\\"default\\\"}",
    		ctx
    	});

    	return block;
    }

    // (55:21) <Type type="struct">
    function create_default_slot_25(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Mathf");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_25.name,
    		type: "slot",
    		source: "(55:21) <Type type=\\\"struct\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:54) <Type type="function">
    function create_default_slot_24(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Lerp");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_24.name,
    		type: "slot",
    		source: "(55:54) <Type type=\\\"function\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:88) <Arg type="float">
    function create_default_slot_23(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("a");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_23.name,
    		type: "slot",
    		source: "(55:88) <Arg type=\\\"float\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:115) <Arg type="float">
    function create_default_slot_22(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("b");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_22.name,
    		type: "slot",
    		source: "(55:115) <Arg type=\\\"float\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:142) <Arg type="float">
    function create_default_slot_21(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("t");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_21.name,
    		type: "slot",
    		source: "(55:142) <Arg type=\\\"float\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:43) <Type type="struct">
    function create_default_slot_20(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Mathf");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20.name,
    		type: "slot",
    		source: "(60:43) <Type type=\\\"struct\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:76) <Type type="function">
    function create_default_slot_19(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Lerp");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19.name,
    		type: "slot",
    		source: "(60:76) <Type type=\\\"function\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:21) <Type type="function">
    function create_default_slot_18(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("function");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(62:21) <Type type=\\\"function\\\">",
    		ctx
    	});

    	return block;
    }

    // (62:91) <Type type="prefix">
    function create_default_slot_17(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(62:91) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (63:23) <Type type="prefix">
    function create_default_slot_16(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(63:23) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (63:108) <Type type="variable">
    function create_default_slot_15(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("start");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(63:108) <Type type=\\\"variable\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:11) <Type type="variable">
    function create_default_slot_14(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("end");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(64:11) <Type type=\\\"variable\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:65) <Type type="variable">
    function create_default_slot_13(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("start");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(64:65) <Type type=\\\"variable\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:135) <Type type="variable">
    function create_default_slot_12(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("percentage");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(64:135) <Type type=\\\"variable\\\">",
    		ctx
    	});

    	return block;
    }

    // (73:8) <Type type="prefix">
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(73:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (73:41) <Type type="classVariable">
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("start");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(73:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    // (85:8) <Type type="prefix">
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(85:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (85:41) <Type type="classVariable">
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("end");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(85:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    // (97:8) <Type type="prefix">
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(97:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (97:41) <Type type="classVariable">
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("difference");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(97:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    // (109:8) <Type type="prefix">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(109:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (109:41) <Type type="classVariable">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("percentage");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(109:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    // (129:8) <Type type="prefix">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(129:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (129:41) <Type type="classVariable">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("toAdd");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(129:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    // (141:8) <Type type="prefix">
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("float");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(141:8) <Type type=\\\"prefix\\\">",
    		ctx
    	});

    	return block;
    }

    // (141:41) <Type type="classVariable">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("result");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(141:41) <Type type=\\\"classVariable\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let main_class_value;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*subchapterOpenedValue*/ ctx[0] == "default") return 0;
    		if (/*subchapterOpenedValue*/ ctx[0] == "lerp") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();

    			attr_dev(main, "class", main_class_value = "" + (null_to_empty(/*subchapterOpenedValue*/ ctx[0] == "default"
    			? "page page-default"
    			: "page") + " svelte-1a63stj"));

    			add_location(main, file$1, 40, 0, 899);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*subchapterOpenedValue*/ 1 && main_class_value !== (main_class_value = "" + (null_to_empty(/*subchapterOpenedValue*/ ctx[0] == "default"
    			? "page page-default"
    			: "page") + " svelte-1a63stj"))) {
    				attr_dev(main, "class", main_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sleep(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Page', slots, []);
    	let subchapterOpenedValue;

    	subchapterOpened.subscribe(value => {
    		$$invalidate(0, subchapterOpenedValue = value);
    	});

    	let lerpStart = 0;
    	let lerpEnd = 100;
    	let lerpDifference = 0;
    	let lerpToAdd = 0;
    	let lerpPercentage = 0;
    	let lerpValue = 0;

    	async function lerp() {
    		$$invalidate(3, lerpPercentage = 0);
    		$$invalidate(4, lerpValue = 0);
    		$$invalidate(1, lerpDifference = lerpEnd - lerpStart);

    		while (true) {
    			$$invalidate(3, lerpPercentage += 0.001);
    			$$invalidate(2, lerpToAdd = lerpDifference * lerpPercentage);
    			$$invalidate(4, lerpValue = lerpStart + lerpToAdd);
    			await sleep(20);

    			if (lerpPercentage >= 1) {
    				break;
    			}
    		}

    		lerp();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Page> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		subchapterOpened,
    		codeLines,
    		Type,
    		Arg,
    		PageCodeBlock,
    		sleep,
    		subchapterOpenedValue,
    		lerpStart,
    		lerpEnd,
    		lerpDifference,
    		lerpToAdd,
    		lerpPercentage,
    		lerpValue,
    		lerp
    	});

    	$$self.$inject_state = $$props => {
    		if ('subchapterOpenedValue' in $$props) $$invalidate(0, subchapterOpenedValue = $$props.subchapterOpenedValue);
    		if ('lerpStart' in $$props) $$invalidate(5, lerpStart = $$props.lerpStart);
    		if ('lerpEnd' in $$props) $$invalidate(6, lerpEnd = $$props.lerpEnd);
    		if ('lerpDifference' in $$props) $$invalidate(1, lerpDifference = $$props.lerpDifference);
    		if ('lerpToAdd' in $$props) $$invalidate(2, lerpToAdd = $$props.lerpToAdd);
    		if ('lerpPercentage' in $$props) $$invalidate(3, lerpPercentage = $$props.lerpPercentage);
    		if ('lerpValue' in $$props) $$invalidate(4, lerpValue = $$props.lerpValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		subchapterOpenedValue,
    		lerpDifference,
    		lerpToAdd,
    		lerpPercentage,
    		lerpValue,
    		lerpStart,
    		lerpEnd,
    		lerp
    	];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let t0;
    	let div;
    	let sidebar;
    	let t1;
    	let page;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });
    	page = new Page({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = space();
    			div = element("div");
    			create_component(sidebar.$$.fragment);
    			t1 = space();
    			create_component(page.$$.fragment);
    			document.title = "Unity Demystified";
    			attr_dev(div, "class", "root svelte-186vrj1");
    			add_location(div, file, 9, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(sidebar, div, null);
    			append_dev(div, t1);
    			mount_component(page, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(sidebar);
    			destroy_component(page);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Sidebar, Page });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
