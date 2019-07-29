
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
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
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                }
            };
        }
        return { set, update, subscribe };
    }

    const meetups = writable([
      {
        id: 'm1',
        title: 'Coding Bootcamp',
        subtitle: 'Learn to code in 2 hours',
        description:
          'In this meetup, we will have some experts that teach you how to code!',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Caffe_Nero_coffee_bar%2C_High_St%2C_Sutton%2C_Surrey%2C_Greater_London.JPG/800px-Caffe_Nero_coffee_bar%2C_High_St%2C_Sutton%2C_Surrey%2C_Greater_London.JPG',
        address: '27th Nerd Road, 32523 New York',
        contactEmail: 'code@test.com',
        isFavorite: false
      },
      {
        id: 'm2',
        title: 'Swim Together',
        subtitle: "Let's go for some swimming",
        description: 'We will simply swim some rounds!',
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Olympic_swimming_pool_%28Tbilisi%29.jpg/800px-Olympic_swimming_pool_%28Tbilisi%29.jpg',
        address: '27th Nerd Road, 32523 New York',
        contactEmail: 'swim@test.com',
        isFavorite: false
      }
    ]);

    const customMeetupsStore = {
      subscribe: meetups.subscribe,
      addMeetup: meetupData => {
        const newMeetup = {
          ...meetupData,
          id: Math.random().toString(),
          isFavorite: false
        };
        meetups.update(items => {
          return [newMeetup, ...items];
        });
      },
      toggleFavorite: id => {
        meetups.update(items => {
          const updatedMeetup = { ...items.find(m => m.id === id) };
          updatedMeetup.isFavorite = !updatedMeetup.isFavorite;
          const meetupIndex = items.findIndex(m => m.id === id);
          const updatedMeetups = [...items];
          updatedMeetups[meetupIndex] = updatedMeetup;
          return updatedMeetups;
        });
      }
    };

    /* src\UI\Header.svelte generated by Svelte v3.5.1 */

    const file = "src\\UI\\Header.svelte";

    function create_fragment(ctx) {
    	var header, h1;

    	return {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "MeetUs";
    			h1.className = "svelte-3mmc7n";
    			add_location(h1, file, 22, 2, 354);
    			header.className = "svelte-3mmc7n";
    			add_location(header, file, 21, 0, 343);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, h1);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}
    		}
    	};
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\UI\Button.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\UI\\Button.svelte";

    // (91:0) {:else}
    function create_else_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			button.className = button_class_value = "" + ctx.mode + " " + ctx.color + " svelte-g32zaw";
    			button.type = ctx.type;
    			button.disabled = ctx.disabled;
    			add_location(button, file$1, 91, 2, 1517);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if ((!current || changed.mode || changed.color) && button_class_value !== (button_class_value = "" + ctx.mode + " " + ctx.color + " svelte-g32zaw")) {
    				button.className = button_class_value;
    			}

    			if (!current || changed.type) {
    				button.type = ctx.type;
    			}

    			if (!current || changed.disabled) {
    				button.disabled = ctx.disabled;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    // (87:0) {#if href}
    function create_if_block(ctx) {
    	var a, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			a.href = ctx.href;
    			a.className = "svelte-g32zaw";
    			add_location(a, file$1, 87, 2, 1476);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (!current || changed.href) {
    				a.href = ctx.href;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.href) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				on_outro(() => {
    					if_blocks[previous_block_index].d(1);
    					if_blocks[previous_block_index] = null;
    				});
    				if_block.o(1);
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				if_block.i(1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { type = "button", href = null, mode = null, color = null, disabled = false } = $$props;

    	const writable_props = ['type', 'href', 'mode', 'color', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('href' in $$props) $$invalidate('href', href = $$props.href);
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		type,
    		href,
    		mode,
    		color,
    		disabled,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["type", "href", "mode", "color", "disabled"]);
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\UI\Badge.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\UI\\Badge.svelte";

    function create_fragment$2(ctx) {
    	var span, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			span = element("span");

    			if (default_slot) default_slot.c();

    			span.className = "svelte-18dcboe";
    			add_location(span, file$2, 14, 0, 262);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Badge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\Meetups\MeetupItem.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\Meetups\\MeetupItem.svelte";

    // (80:6) {#if isFav}
    function create_if_block$1(ctx) {
    	var current;

    	var badge = new Badge({
    		props: {
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			badge.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(badge, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			badge.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			badge.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			badge.$destroy(detaching);
    		}
    	};
    }

    // (81:8) <Badge>
    function create_default_slot_3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("FAVORITE");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (94:4) <Button href="mailto:{email}">
    function create_default_slot_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Contact");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (95:4) <Button       mode="outline"       color={isFav ? null : 'success'}       type="button"       on:click={() => dispatch('togglefavorite', id)}>
    function create_default_slot_1(ctx) {
    	var t_value = ctx.isFav ? 'Unfavorite' : 'Favorite', t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.isFav) && t_value !== (t_value = ctx.isFav ? 'Unfavorite' : 'Favorite')) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (102:4) <Button type="button">
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Show Details");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var article, header, h1, t0, t1, t2, h2, t3, t4, p0, t5, t6, div0, img, t7, div1, p1, t8, t9, footer, t10, t11, current;

    	var if_block = (ctx.isFav) && create_if_block$1(ctx);

    	var button0 = new Button({
    		props: {
    		href: "mailto:" + ctx.email,
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: {
    		mode: "outline",
    		color: ctx.isFav ? null : 'success',
    		type: "button",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.click_handler);

    	var button2 = new Button({
    		props: {
    		type: "button",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			article = element("article");
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(ctx.title);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(ctx.subtitle);
    			t4 = space();
    			p0 = element("p");
    			t5 = text(ctx.address);
    			t6 = space();
    			div0 = element("div");
    			img = element("img");
    			t7 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t8 = text(ctx.description);
    			t9 = space();
    			footer = element("footer");
    			button0.$$.fragment.c();
    			t10 = space();
    			button1.$$.fragment.c();
    			t11 = space();
    			button2.$$.fragment.c();
    			h1.className = "svelte-enhpap";
    			add_location(h1, file$3, 77, 4, 1144);
    			h2.className = "svelte-enhpap";
    			add_location(h2, file$3, 83, 4, 1239);
    			p0.className = "svelte-enhpap";
    			add_location(p0, file$3, 84, 4, 1263);
    			header.className = "svelte-enhpap";
    			add_location(header, file$3, 76, 2, 1131);
    			img.src = ctx.imageUrl;
    			img.alt = ctx.title;
    			img.className = "svelte-enhpap";
    			add_location(img, file$3, 87, 4, 1318);
    			div0.className = "image svelte-enhpap";
    			add_location(div0, file$3, 86, 2, 1294);
    			p1.className = "svelte-enhpap";
    			add_location(p1, file$3, 90, 4, 1390);
    			div1.className = "content svelte-enhpap";
    			add_location(div1, file$3, 89, 2, 1364);
    			footer.className = "svelte-enhpap";
    			add_location(footer, file$3, 92, 2, 1422);
    			article.className = "svelte-enhpap";
    			add_location(article, file$3, 75, 0, 1119);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, article, anchor);
    			append(article, header);
    			append(header, h1);
    			append(h1, t0);
    			append(h1, t1);
    			if (if_block) if_block.m(h1, null);
    			append(header, t2);
    			append(header, h2);
    			append(h2, t3);
    			append(header, t4);
    			append(header, p0);
    			append(p0, t5);
    			append(article, t6);
    			append(article, div0);
    			append(div0, img);
    			append(article, t7);
    			append(article, div1);
    			append(div1, p1);
    			append(p1, t8);
    			append(article, t9);
    			append(article, footer);
    			mount_component(button0, footer, null);
    			append(footer, t10);
    			mount_component(button1, footer, null);
    			append(footer, t11);
    			mount_component(button2, footer, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.title) {
    				set_data(t0, ctx.title);
    			}

    			if (ctx.isFav) {
    				if (!if_block) {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(h1, null);
    				} else {
    									if_block.i(1);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
    			}

    			if (!current || changed.subtitle) {
    				set_data(t3, ctx.subtitle);
    			}

    			if (!current || changed.address) {
    				set_data(t5, ctx.address);
    			}

    			if (!current || changed.imageUrl) {
    				img.src = ctx.imageUrl;
    			}

    			if (!current || changed.title) {
    				img.alt = ctx.title;
    			}

    			if (!current || changed.description) {
    				set_data(t8, ctx.description);
    			}

    			var button0_changes = {};
    			if (changed.email) button0_changes.href = "mailto:" + ctx.email;
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.isFav) button1_changes.color = ctx.isFav ? null : 'success';
    			if (changed.$$scope || changed.isFav) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.$$scope) button2_changes.$$scope = { changed, ctx };
    			button2.$set(button2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (if_block) if_block.i();

    			button0.$$.fragment.i(local);

    			button1.$$.fragment.i(local);

    			button2.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (if_block) if_block.o();
    			button0.$$.fragment.o(local);
    			button1.$$.fragment.o(local);
    			button2.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(article);
    			}

    			if (if_block) if_block.d();

    			button0.$destroy();

    			button1.$destroy();

    			button2.$destroy();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let { id, title, subtitle, imageUrl, description, address, email, isFav } = $$props;

      const dispatch = createEventDispatcher();

    	const writable_props = ['id', 'title', 'subtitle', 'imageUrl', 'description', 'address', 'email', 'isFav'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<MeetupItem> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		return dispatch('togglefavorite', id);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate('subtitle', subtitle = $$props.subtitle);
    		if ('imageUrl' in $$props) $$invalidate('imageUrl', imageUrl = $$props.imageUrl);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('address' in $$props) $$invalidate('address', address = $$props.address);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('isFav' in $$props) $$invalidate('isFav', isFav = $$props.isFav);
    	};

    	return {
    		id,
    		title,
    		subtitle,
    		imageUrl,
    		description,
    		address,
    		email,
    		isFav,
    		dispatch,
    		click_handler
    	};
    }

    class MeetupItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["id", "title", "subtitle", "imageUrl", "description", "address", "email", "isFav"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'id'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'title'");
    		}
    		if (ctx.subtitle === undefined && !('subtitle' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'subtitle'");
    		}
    		if (ctx.imageUrl === undefined && !('imageUrl' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'imageUrl'");
    		}
    		if (ctx.description === undefined && !('description' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'description'");
    		}
    		if (ctx.address === undefined && !('address' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'address'");
    		}
    		if (ctx.email === undefined && !('email' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'email'");
    		}
    		if (ctx.isFav === undefined && !('isFav' in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'isFav'");
    		}
    	}

    	get id() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageUrl() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageUrl(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get email() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFav() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFav(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Meetups\MeetupGrid.svelte generated by Svelte v3.5.1 */

    const file$4 = "src\\Meetups\\MeetupGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.meetup = list[i];
    	return child_ctx;
    }

    // (23:2) {#each meetups as meetup}
    function create_each_block(ctx) {
    	var current;

    	var meetupitem = new MeetupItem({
    		props: {
    		id: ctx.meetup.id,
    		title: ctx.meetup.title,
    		subtitle: ctx.meetup.subtitle,
    		description: ctx.meetup.description,
    		imageUrl: ctx.meetup.imageUrl,
    		email: ctx.meetup.contactEmail,
    		address: ctx.meetup.address,
    		isFav: ctx.meetup.isFavorite
    	},
    		$$inline: true
    	});
    	meetupitem.$on("togglefavorite", ctx.togglefavorite_handler);

    	return {
    		c: function create() {
    			meetupitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(meetupitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var meetupitem_changes = {};
    			if (changed.meetups) meetupitem_changes.id = ctx.meetup.id;
    			if (changed.meetups) meetupitem_changes.title = ctx.meetup.title;
    			if (changed.meetups) meetupitem_changes.subtitle = ctx.meetup.subtitle;
    			if (changed.meetups) meetupitem_changes.description = ctx.meetup.description;
    			if (changed.meetups) meetupitem_changes.imageUrl = ctx.meetup.imageUrl;
    			if (changed.meetups) meetupitem_changes.email = ctx.meetup.contactEmail;
    			if (changed.meetups) meetupitem_changes.address = ctx.meetup.address;
    			if (changed.meetups) meetupitem_changes.isFav = ctx.meetup.isFavorite;
    			meetupitem.$set(meetupitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			meetupitem.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			meetupitem.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			meetupitem.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var section, current;

    	var each_value = ctx.meetups;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c: function create() {
    			section = element("section");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			section.id = "meetups";
    			section.className = "svelte-181fmcx";
    			add_location(section, file$4, 21, 0, 313);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.meetups) {
    				each_value = ctx.meetups;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { meetups } = $$props;

    	const writable_props = ['meetups'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<MeetupGrid> was created with unknown prop '${key}'`);
    	});

    	function togglefavorite_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('meetups' in $$props) $$invalidate('meetups', meetups = $$props.meetups);
    	};

    	return { meetups, togglefavorite_handler };
    }

    class MeetupGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["meetups"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.meetups === undefined && !('meetups' in props)) {
    			console.warn("<MeetupGrid> was created without expected prop 'meetups'");
    		}
    	}

    	get meetups() {
    		throw new Error("<MeetupGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set meetups(value) {
    		throw new Error("<MeetupGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\UI\TextInput.svelte generated by Svelte v3.5.1 */

    const file$5 = "src\\UI\\TextInput.svelte";

    // (61:2) {:else}
    function create_else_block$1(ctx) {
    	var input, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			attr(input, "type", ctx.type);
    			input.id = ctx.id;
    			input.value = ctx.value;
    			input.className = "svelte-1mrfx4j";
    			toggle_class(input, "invalid", !ctx.valid && ctx.touched);
    			add_location(input, file$5, 61, 4, 1128);

    			dispose = [
    				listen(input, "input", ctx.input_handler),
    				listen(input, "blur", ctx.blur_handler_1)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.type) {
    				attr(input, "type", ctx.type);
    			}

    			if (changed.id) {
    				input.id = ctx.id;
    			}

    			if (changed.value) {
    				input.value = ctx.value;
    			}

    			if ((changed.valid || changed.touched)) {
    				toggle_class(input, "invalid", !ctx.valid && ctx.touched);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (59:2) {#if controlType === 'textarea'}
    function create_if_block_1(ctx) {
    	var textarea, dispose;

    	return {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.rows = ctx.rows;
    			textarea.id = ctx.id;
    			textarea.className = "svelte-1mrfx4j";
    			toggle_class(textarea, "invalid", !ctx.valid && ctx.touched);
    			add_location(textarea, file$5, 59, 4, 1011);

    			dispose = [
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(textarea, "blur", ctx.blur_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, textarea, anchor);

    			textarea.value = ctx.value;
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) textarea.value = ctx.value;

    			if (changed.rows) {
    				textarea.rows = ctx.rows;
    			}

    			if (changed.id) {
    				textarea.id = ctx.id;
    			}

    			if ((changed.valid || changed.touched)) {
    				toggle_class(textarea, "invalid", !ctx.valid && ctx.touched);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(textarea);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (64:2) {#if validityMessage && !valid && touched}
    function create_if_block$2(ctx) {
    	var p, t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.validityMessage);
    			p.className = "error-message svelte-1mrfx4j";
    			add_location(p, file$5, 64, 4, 1291);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.validityMessage) {
    				set_data(t, ctx.validityMessage);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var div, label_1, t0, t1, t2;

    	function select_block_type(ctx) {
    		if (ctx.controlType === 'textarea') return create_if_block_1;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.validityMessage && !ctx.valid && ctx.touched) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			label_1.htmlFor = ctx.id;
    			label_1.className = "svelte-1mrfx4j";
    			add_location(label_1, file$5, 57, 2, 940);
    			div.className = "form-control svelte-1mrfx4j";
    			add_location(div, file$5, 56, 0, 911);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label_1);
    			append(label_1, t0);
    			append(div, t1);
    			if_block0.m(div, null);
    			append(div, t2);
    			if (if_block1) if_block1.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data(t0, ctx.label);
    			}

    			if (changed.id) {
    				label_1.htmlFor = ctx.id;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(changed, ctx);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t2);
    				}
    			}

    			if (ctx.validityMessage && !ctx.valid && ctx.touched) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { controlType = null, id, label, rows = null, value, type = "text", valid = true, validityMessage = "" } = $$props;

      let touched = false;

    	const writable_props = ['controlType', 'id', 'label', 'rows', 'value', 'type', 'valid', 'validityMessage'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function blur_handler() {
    		const $$result = touched = true;
    		$$invalidate('touched', touched);
    		return $$result;
    	}

    	function blur_handler_1() {
    		const $$result = touched = true;
    		$$invalidate('touched', touched);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('controlType' in $$props) $$invalidate('controlType', controlType = $$props.controlType);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('valid' in $$props) $$invalidate('valid', valid = $$props.valid);
    		if ('validityMessage' in $$props) $$invalidate('validityMessage', validityMessage = $$props.validityMessage);
    	};

    	return {
    		controlType,
    		id,
    		label,
    		rows,
    		value,
    		type,
    		valid,
    		validityMessage,
    		touched,
    		input_handler,
    		textarea_input_handler,
    		blur_handler,
    		blur_handler_1
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, ["controlType", "id", "label", "rows", "value", "type", "valid", "validityMessage"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<TextInput> was created without expected prop 'id'");
    		}
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
    		}
    		if (ctx.value === undefined && !('value' in props)) {
    			console.warn("<TextInput> was created without expected prop 'value'");
    		}
    	}

    	get controlType() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controlType(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rows() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validityMessage() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validityMessage(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\UI\Modal.svelte generated by Svelte v3.5.1 */

    const file$6 = "src\\UI\\Modal.svelte";

    const get_footer_slot_changes = ({}) => ({});
    const get_footer_slot_context = ({}) => ({});

    // (69:6) <Button on:click={closeModal}>
    function create_default_slot$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Close");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var div0, t0, div2, h1, t1, t2, div1, t3, footer, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	const footer_slot_1 = ctx.$$slots.footer;
    	const footer_slot = create_slot(footer_slot_1, ctx, get_footer_slot_context);

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.closeModal);

    	return {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			h1 = element("h1");
    			t1 = text(ctx.title);
    			t2 = space();
    			div1 = element("div");

    			if (default_slot) default_slot.c();
    			t3 = space();
    			footer = element("footer");

    			if (!footer_slot) {
    				button.$$.fragment.c();
    			}

    			if (footer_slot) footer_slot.c();
    			div0.className = "modal-backdrop svelte-1wfedfe";
    			add_location(div0, file$6, 60, 0, 950);
    			h1.className = "svelte-1wfedfe";
    			add_location(h1, file$6, 62, 2, 1025);

    			div1.className = "content svelte-1wfedfe";
    			add_location(div1, file$6, 63, 2, 1044);

    			footer.className = "svelte-1wfedfe";
    			add_location(footer, file$6, 66, 2, 1090);
    			div2.className = "modal svelte-1wfedfe";
    			add_location(div2, file$6, 61, 0, 1003);
    			dispose = listen(div0, "click", ctx.closeModal);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div1_nodes);

    			if (footer_slot) footer_slot.l(footer_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t0, anchor);
    			insert(target, div2, anchor);
    			append(div2, h1);
    			append(h1, t1);
    			append(div2, t2);
    			append(div2, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append(div2, t3);
    			append(div2, footer);

    			if (!footer_slot) {
    				mount_component(button, footer, null);
    			}

    			else {
    				footer_slot.m(footer, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.title) {
    				set_data(t1, ctx.title);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (!footer_slot) {
    				var button_changes = {};
    				if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    				button.$set(button_changes);
    			}

    			if (footer_slot && footer_slot.p && changed.$$scope) {
    				footer_slot.p(get_slot_changes(footer_slot_1, ctx, changed, get_footer_slot_changes), get_slot_context(footer_slot_1, ctx, get_footer_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);

    			button.$$.fragment.i(local);

    			if (footer_slot && footer_slot.i) footer_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			button.$$.fragment.o(local);
    			if (footer_slot && footer_slot.o) footer_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t0);
    				detach(div2);
    			}

    			if (default_slot) default_slot.d(detaching);

    			if (!footer_slot) {
    				button.$destroy();
    			}

    			if (footer_slot) footer_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      let { title } = $$props;

      const dispatch = createEventDispatcher();

      function closeModal() {
        dispatch("cancel");
      }

    	const writable_props = ['title'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { title, closeModal, $$slots, $$scope };
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["title"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Modal> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function isEmpty(val) {
      return val.trim().length === 0;
    }

    function isValidEmail(val) {
      return new RegExp(
        "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
      ).test(val);
    }

    /* src\Meetups\EditMeetup.svelte generated by Svelte v3.5.1 */

    const file$7 = "src\\Meetups\\EditMeetup.svelte";

    // (100:4) <Button type="button" mode="outline" on:click={cancel}>
    function create_default_slot_2$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Cancel");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (101:4) <Button type="button" on:click={submitForm} disabled={!formIsValid}>
    function create_default_slot_1$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Save");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (99:2) <div slot="footer">
    function create_footer_slot(ctx) {
    	var div, t, current;

    	var button0 = new Button({
    		props: {
    		type: "button",
    		mode: "outline",
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button0.$on("click", ctx.cancel);

    	var button1 = new Button({
    		props: {
    		type: "button",
    		disabled: !ctx.formIsValid,
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.submitForm);

    	return {
    		c: function create() {
    			div = element("div");
    			button0.$$.fragment.c();
    			t = space();
    			button1.$$.fragment.c();
    			attr(div, "slot", "footer");
    			add_location(div, file$7, 98, 2, 2563);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(button0, div, null);
    			append(div, t);
    			mount_component(button1, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.formIsValid) button1_changes.disabled = !ctx.formIsValid;
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			button0.$$.fragment.i(local);

    			button1.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			button0.$$.fragment.o(local);
    			button1.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			button0.$destroy();

    			button1.$destroy();
    		}
    	};
    }

    // (53:0) <Modal title="Edit Meetup Data" on:cancel>
    function create_default_slot$2(ctx) {
    	var form, t0, t1, t2, t3, t4, updating_value, t5, current, dispose;

    	var textinput0 = new TextInput({
    		props: {
    		id: "title",
    		label: "Title",
    		valid: ctx.titleValid,
    		validityMessage: "Please enter a valid title.",
    		value: ctx.title
    	},
    		$$inline: true
    	});
    	textinput0.$on("input", ctx.input_handler);

    	var textinput1 = new TextInput({
    		props: {
    		id: "subtitle",
    		label: "Subtitle",
    		valid: ctx.subtitleValid,
    		validityMessage: "Please enter a valid subtitle.",
    		value: ctx.subtitle
    	},
    		$$inline: true
    	});
    	textinput1.$on("input", ctx.input_handler_1);

    	var textinput2 = new TextInput({
    		props: {
    		id: "address",
    		label: "Address",
    		valid: ctx.addressValid,
    		validityMessage: "Please enter a valid address.",
    		value: ctx.address
    	},
    		$$inline: true
    	});
    	textinput2.$on("input", ctx.input_handler_2);

    	var textinput3 = new TextInput({
    		props: {
    		id: "imageUrl",
    		label: "Image URL",
    		valid: ctx.imageUrlValid,
    		validityMessage: "Please enter a valid image url.",
    		value: ctx.imageUrl
    	},
    		$$inline: true
    	});
    	textinput3.$on("input", ctx.input_handler_3);

    	var textinput4 = new TextInput({
    		props: {
    		id: "email",
    		label: "E-Mail",
    		type: "email",
    		valid: ctx.emailValid,
    		validityMessage: "Please enter a valid email address.",
    		value: ctx.email
    	},
    		$$inline: true
    	});
    	textinput4.$on("input", ctx.input_handler_4);

    	function textinput5_value_binding(value) {
    		ctx.textinput5_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput5_props = {
    		id: "description",
    		label: "Description",
    		controlType: "textarea",
    		valid: ctx.descriptionValid,
    		validityMessage: "Please enter a valid description."
    	};
    	if (ctx.description !== void 0) {
    		textinput5_props.value = ctx.description;
    	}
    	var textinput5 = new TextInput({ props: textinput5_props, $$inline: true });

    	add_binding_callback(() => bind(textinput5, 'value', textinput5_value_binding));

    	return {
    		c: function create() {
    			form = element("form");
    			textinput0.$$.fragment.c();
    			t0 = space();
    			textinput1.$$.fragment.c();
    			t1 = space();
    			textinput2.$$.fragment.c();
    			t2 = space();
    			textinput3.$$.fragment.c();
    			t3 = space();
    			textinput4.$$.fragment.c();
    			t4 = space();
    			textinput5.$$.fragment.c();
    			t5 = space();
    			form.className = "svelte-no1xoc";
    			add_location(form, file$7, 53, 2, 1177);
    			dispose = listen(form, "submit", prevent_default(ctx.submitForm));
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			mount_component(textinput0, form, null);
    			append(form, t0);
    			mount_component(textinput1, form, null);
    			append(form, t1);
    			mount_component(textinput2, form, null);
    			append(form, t2);
    			mount_component(textinput3, form, null);
    			append(form, t3);
    			mount_component(textinput4, form, null);
    			append(form, t4);
    			mount_component(textinput5, form, null);
    			insert(target, t5, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.titleValid) textinput0_changes.valid = ctx.titleValid;
    			if (changed.title) textinput0_changes.value = ctx.title;
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.subtitleValid) textinput1_changes.valid = ctx.subtitleValid;
    			if (changed.subtitle) textinput1_changes.value = ctx.subtitle;
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (changed.addressValid) textinput2_changes.valid = ctx.addressValid;
    			if (changed.address) textinput2_changes.value = ctx.address;
    			textinput2.$set(textinput2_changes);

    			var textinput3_changes = {};
    			if (changed.imageUrlValid) textinput3_changes.valid = ctx.imageUrlValid;
    			if (changed.imageUrl) textinput3_changes.value = ctx.imageUrl;
    			textinput3.$set(textinput3_changes);

    			var textinput4_changes = {};
    			if (changed.emailValid) textinput4_changes.valid = ctx.emailValid;
    			if (changed.email) textinput4_changes.value = ctx.email;
    			textinput4.$set(textinput4_changes);

    			var textinput5_changes = {};
    			if (changed.descriptionValid) textinput5_changes.valid = ctx.descriptionValid;
    			if (!updating_value && changed.description) {
    				textinput5_changes.value = ctx.description;
    			}
    			textinput5.$set(textinput5_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			textinput0.$$.fragment.i(local);

    			textinput1.$$.fragment.i(local);

    			textinput2.$$.fragment.i(local);

    			textinput3.$$.fragment.i(local);

    			textinput4.$$.fragment.i(local);

    			textinput5.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			textinput0.$$.fragment.o(local);
    			textinput1.$$.fragment.o(local);
    			textinput2.$$.fragment.o(local);
    			textinput3.$$.fragment.o(local);
    			textinput4.$$.fragment.o(local);
    			textinput5.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			textinput0.$destroy();

    			textinput1.$destroy();

    			textinput2.$destroy();

    			textinput3.$destroy();

    			textinput4.$destroy();

    			textinput5.$destroy();

    			if (detaching) {
    				detach(t5);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		title: "Edit Meetup Data",
    		$$slots: {
    		default: [create_default_slot$2],
    		footer: [create_footer_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("cancel", ctx.cancel_handler);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.formIsValid || changed.descriptionValid || changed.description || changed.emailValid || changed.email || changed.imageUrlValid || changed.imageUrl || changed.addressValid || changed.address || changed.subtitleValid || changed.subtitle || changed.titleValid || changed.title) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			modal.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			modal.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			modal.$destroy(detaching);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

      let title = "";
      let subtitle = "";
      let address = "";
      let email = "";
      let description = "";
      let imageUrl = "";

      const dispatch = createEventDispatcher();

      function submitForm() {
        dispatch("save", {
          title: title,
          subtitle: subtitle,
          address: address,
          email: email,
          description: description,
          imageUrl: imageUrl
        });
      }

      function cancel() {
        dispatch("cancel");
      }

    	function cancel_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		const $$result = (title = event.target.value);
    		$$invalidate('title', title);
    		return $$result;
    	}

    	function input_handler_1(event) {
    		const $$result = (subtitle = event.target.value);
    		$$invalidate('subtitle', subtitle);
    		return $$result;
    	}

    	function input_handler_2(event) {
    		const $$result = (address = event.target.value);
    		$$invalidate('address', address);
    		return $$result;
    	}

    	function input_handler_3(event) {
    		const $$result = (imageUrl = event.target.value);
    		$$invalidate('imageUrl', imageUrl);
    		return $$result;
    	}

    	function input_handler_4(event) {
    		const $$result = (email = event.target.value);
    		$$invalidate('email', email);
    		return $$result;
    	}

    	function textinput5_value_binding(value) {
    		description = value;
    		$$invalidate('description', description);
    	}

    	let titleValid, subtitleValid, addressValid, descriptionValid, imageUrlValid, emailValid, formIsValid;

    	$$self.$$.update = ($$dirty = { title: 1, subtitle: 1, address: 1, description: 1, imageUrl: 1, email: 1, titleValid: 1, subtitleValid: 1, addressValid: 1, descriptionValid: 1, imageUrlValid: 1, emailValid: 1 }) => {
    		if ($$dirty.title) { $$invalidate('titleValid', titleValid = !isEmpty(title)); }
    		if ($$dirty.subtitle) { $$invalidate('subtitleValid', subtitleValid = !isEmpty(subtitle)); }
    		if ($$dirty.address) { $$invalidate('addressValid', addressValid = !isEmpty(address)); }
    		if ($$dirty.description) { $$invalidate('descriptionValid', descriptionValid = !isEmpty(description)); }
    		if ($$dirty.imageUrl) { $$invalidate('imageUrlValid', imageUrlValid = !isEmpty(imageUrl)); }
    		if ($$dirty.email) { $$invalidate('emailValid', emailValid = isValidEmail(email)); }
    		if ($$dirty.titleValid || $$dirty.subtitleValid || $$dirty.addressValid || $$dirty.descriptionValid || $$dirty.imageUrlValid || $$dirty.emailValid) { $$invalidate('formIsValid', formIsValid =
            titleValid &&
            subtitleValid &&
            addressValid &&
            descriptionValid &&
            imageUrlValid &&
            emailValid); }
    	};

    	return {
    		title,
    		subtitle,
    		address,
    		email,
    		description,
    		imageUrl,
    		submitForm,
    		cancel,
    		titleValid,
    		subtitleValid,
    		addressValid,
    		descriptionValid,
    		imageUrlValid,
    		emailValid,
    		formIsValid,
    		cancel_handler,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input_handler_3,
    		input_handler_4,
    		textinput5_value_binding
    	};
    }

    class EditMeetup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$8 = "src\\App.svelte";

    // (52:4) <Button on:click={() => (editMode = 'add')}>
    function create_default_slot$3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("New Meetup");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (54:2) {#if editMode === 'add'}
    function create_if_block$3(ctx) {
    	var current;

    	var editmeetup = new EditMeetup({ $$inline: true });
    	editmeetup.$on("save", ctx.addMeetup);
    	editmeetup.$on("cancel", ctx.cancelEdit);

    	return {
    		c: function create() {
    			editmeetup.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(editmeetup, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			editmeetup.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			editmeetup.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			editmeetup.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	var t0, main, div, t1, t2, current;

    	var header = new Header({ $$inline: true });

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.click_handler);

    	var if_block = (ctx.editMode === 'add') && create_if_block$3(ctx);

    	var meetupgrid = new MeetupGrid({
    		props: { meetups: ctx.$meetups },
    		$$inline: true
    	});
    	meetupgrid.$on("togglefavorite", toggleFavorite);

    	return {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			div = element("div");
    			button.$$.fragment.c();
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			meetupgrid.$$.fragment.c();
    			div.className = "meetup-controls svelte-1w77hyv";
    			add_location(div, file$8, 50, 2, 1035);
    			main.className = "svelte-1w77hyv";
    			add_location(main, file$8, 49, 0, 1026);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, div);
    			mount_component(button, div, null);
    			append(main, t1);
    			if (if_block) if_block.m(main, null);
    			append(main, t2);
    			mount_component(meetupgrid, main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			if (ctx.editMode === 'add') {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					if_block.i(1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(main, t2);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
    			}

    			var meetupgrid_changes = {};
    			if (changed.$meetups) meetupgrid_changes.meetups = ctx.$meetups;
    			meetupgrid.$set(meetupgrid_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			header.$$.fragment.i(local);

    			button.$$.fragment.i(local);

    			if (if_block) if_block.i();

    			meetupgrid.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			header.$$.fragment.o(local);
    			button.$$.fragment.o(local);
    			if (if_block) if_block.o();
    			meetupgrid.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			header.$destroy(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			button.$destroy();

    			if (if_block) if_block.d();

    			meetupgrid.$destroy();
    		}
    	};
    }

    function toggleFavorite(event) {
      const id = event.detail;
      customMeetupsStore.toggleFavorite(id);
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $meetups;

    	validate_store(customMeetupsStore, 'meetups');
    	subscribe($$self, customMeetupsStore, $$value => { $meetups = $$value; $$invalidate('$meetups', $meetups); });

    	

      // let meetups = ;

      let editMode;

      function addMeetup(event) {
        const meetupData = {
          title: event.detail.title,
          subtitle: event.detail.subtitle,
          description: event.detail.description,
          imageUrl: event.detail.imageUrl,
          contactEmail: event.detail.email,
          address: event.detail.address
        };

        // meetups.push(newMeetup); // DOES NOT WORK!
        customMeetupsStore.addMeetup(meetupData);
        $$invalidate('editMode', editMode = null);
      }

      function cancelEdit() {
        $$invalidate('editMode', editMode = null);
      }

    	function click_handler() {
    		const $$result = (editMode = 'add');
    		$$invalidate('editMode', editMode);
    		return $$result;
    	}

    	return {
    		editMode,
    		addMeetup,
    		cancelEdit,
    		$meetups,
    		click_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, []);
    	}
    }

    // import Header from './UI/Header.svelte';

    const app = new App({
    	// target: document.querySelector('#app')
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
