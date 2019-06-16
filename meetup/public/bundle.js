
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
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

    /* src\ui\Header.svelte generated by Svelte v3.5.1 */

    const file = "src\\ui\\Header.svelte";

    function create_fragment(ctx) {
    	var header, h1;

    	return {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Meet up";
    			h1.className = "svelte-1bea21v";
    			add_location(h1, file, 26, 4, 463);
    			header.className = "svelte-1bea21v";
    			add_location(header, file, 25, 0, 449);
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

    /* src\ui\Button.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\ui\\Button.svelte";

    // (167:2) {:else}
    function create_else_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			button.className = button_class_value = "" + ctx.mode + " " + ctx.color + " svelte-6ra9d1";
    			button.type = ctx.type;
    			add_location(button, file$1, 167, 2, 2956);
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

    			if ((!current || changed.mode || changed.color) && button_class_value !== (button_class_value = "" + ctx.mode + " " + ctx.color + " svelte-6ra9d1")) {
    				button.className = button_class_value;
    			}

    			if (!current || changed.type) {
    				button.type = ctx.type;
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

    // (163:0) {#if href}
    function create_if_block(ctx) {
    	var a, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			a.href = ctx.href;
    			a.className = "svelte-6ra9d1";
    			add_location(a, file$1, 163, 2, 2910);
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
    	/* props */
      let { type = "button", href = null, mode = null, color = null } = $$props;

    	const writable_props = ['type', 'href', 'mode', 'color'];
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
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		type,
    		href,
    		mode,
    		color,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["type", "href", "mode", "color"]);
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
    }

    /* src\ui\TextInput.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\ui\\TextInput.svelte";

    // (48:2) {:else}
    function create_else_block$1(ctx) {
    	var label_1, t0, t1, input, dispose;

    	return {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			input = element("input");
    			label_1.htmlFor = ctx.label;
    			label_1.className = "svelte-10fbh92";
    			add_location(label_1, file$2, 48, 4, 916);
    			attr(input, "type", ctx.type);
    			input.id = ctx.id;
    			input.value = ctx.value;
    			input.className = "svelte-10fbh92";
    			add_location(input, file$2, 49, 4, 956);
    			dispose = listen(input, "input", ctx.input_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, label_1, anchor);
    			append(label_1, t0);
    			insert(target, t1, anchor);
    			insert(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data(t0, ctx.label);
    				label_1.htmlFor = ctx.label;
    			}

    			if (changed.type) {
    				attr(input, "type", ctx.type);
    			}

    			if (changed.id) {
    				input.id = ctx.id;
    			}

    			if (changed.value) {
    				input.value = ctx.value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label_1);
    				detach(t1);
    				detach(input);
    			}

    			dispose();
    		}
    	};
    }

    // (45:2) {#if controlType === 'textarea'}
    function create_if_block$1(ctx) {
    	var label_1, t0, t1, textarea, dispose;

    	return {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			textarea = element("textarea");
    			label_1.htmlFor = ctx.id;
    			label_1.className = "svelte-10fbh92";
    			add_location(label_1, file$2, 45, 4, 821);
    			textarea.rows = ctx.rows;
    			textarea.id = ctx.id;
    			textarea.value = ctx.value;
    			textarea.className = "svelte-10fbh92";
    			add_location(textarea, file$2, 46, 4, 858);
    			dispose = listen(textarea, "input", ctx.input_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, label_1, anchor);
    			append(label_1, t0);
    			insert(target, t1, anchor);
    			insert(target, textarea, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data(t0, ctx.label);
    			}

    			if (changed.id) {
    				label_1.htmlFor = ctx.id;
    			}

    			if (changed.rows) {
    				textarea.rows = ctx.rows;
    			}

    			if (changed.id) {
    				textarea.id = ctx.id;
    			}

    			if (changed.value) {
    				textarea.value = ctx.value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label_1);
    				detach(t1);
    				detach(textarea);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div;

    	function select_block_type(ctx) {
    		if (ctx.controlType === 'textarea') return create_if_block$1;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			div.className = "form-control svelte-10fbh92";
    			add_location(div, file$2, 43, 0, 753);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block.d();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	/* props */
      let { controlType = null, rows = null, id, label, value, type = "text" } = $$props;

    	const writable_props = ['controlType', 'rows', 'id', 'label', 'value', 'type'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('controlType' in $$props) $$invalidate('controlType', controlType = $$props.controlType);
    		if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    	};

    	return {
    		controlType,
    		rows,
    		id,
    		label,
    		value,
    		type,
    		input_handler,
    		input_handler_1
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, ["controlType", "rows", "id", "label", "value", "type"]);

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

    	get rows() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
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
    }

    /* src\ui\Modal.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\ui\\Modal.svelte";

    const get_footer_slot_changes = ({}) => ({});
    const get_footer_slot_context = ({}) => ({});

    // (13:12) <Button on:click={closeModal}>
    function create_default_slot(ctx) {
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

    function create_fragment$3(ctx) {
    	var div0, t0, div2, h1, t1, t2, div1, t3, footer, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	const footer_slot_1 = ctx.$$slots.footer;
    	const footer_slot = create_slot(footer_slot_1, ctx, get_footer_slot_context);

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot] },
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
    			div0.className = "modal-backdrop svelte-4o4z22";
    			add_location(div0, file$3, 0, 0, 0);
    			h1.className = "svelte-4o4z22";
    			add_location(h1, file$3, 5, 4, 89);

    			div1.className = "content svelte-4o4z22";
    			add_location(div1, file$3, 6, 4, 111);

    			footer.className = "svelte-4o4z22";
    			add_location(footer, file$3, 10, 4, 169);
    			div2.className = "modal svelte-4o4z22";
    			add_location(div2, file$3, 4, 0, 64);
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

    function instance$2($$self, $$props, $$invalidate) {
    	

        let { title } = $$props;
        const dispatch = createEventDispatcher();

        const closeModal = () => {
            dispatch('cancel');
        };

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
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["title"]);

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

    /* src\components\Edit-meetup.svelte generated by Svelte v3.5.1 */

    const file$4 = "src\\components\\Edit-meetup.svelte";

    // (38:8) <Button type={"submit"}>
    function create_default_slot_1(ctx) {
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

    // (37:4) <div slot='footer'>
    function create_footer_slot(ctx) {
    	var div, current;

    	var button = new Button({
    		props: {
    		type: "submit",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			button.$$.fragment.c();
    			attr(div, "slot", "footer");
    			add_location(div, file$4, 36, 4, 1211);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			button.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			button.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			button.$destroy();
    		}
    	};
    }

    // (2:0) <Modal title='Edit Meetup' on:cancel>
    function create_default_slot$1(ctx) {
    	var form, t0, t1, t2, t3, t4, t5, current, dispose;

    	var textinput0 = new TextInput({
    		props: {
    		id: "title",
    		label: "Title",
    		value: ctx.title
    	},
    		$$inline: true
    	});
    	textinput0.$on("input", ctx.input_handler);

    	var textinput1 = new TextInput({
    		props: {
    		id: "subtitle",
    		label: "Subtitle",
    		value: ctx.subtitle
    	},
    		$$inline: true
    	});
    	textinput1.$on("input", ctx.input_handler_1);

    	var textinput2 = new TextInput({
    		props: {
    		id: "address",
    		label: "Address",
    		value: ctx.address
    	},
    		$$inline: true
    	});
    	textinput2.$on("input", ctx.input_handler_2);

    	var textinput3 = new TextInput({
    		props: {
    		id: "imageUrl",
    		label: "Image Url",
    		value: ctx.imageUrl
    	},
    		$$inline: true
    	});
    	textinput3.$on("input", ctx.input_handler_3);

    	var textinput4 = new TextInput({
    		props: {
    		controlType: "textarea",
    		rows: "3",
    		id: "description",
    		label: "Description",
    		value: ctx.description
    	},
    		$$inline: true
    	});
    	textinput4.$on("input", ctx.input_handler_4);

    	var textinput5 = new TextInput({
    		props: {
    		id: "contact-email",
    		label: "Contact Email",
    		value: ctx.contactEmail
    	},
    		$$inline: true
    	});
    	textinput5.$on("input", ctx.input_handler_5);

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
    			form.className = "svelte-shrb4m";
    			add_location(form, file$4, 2, 4, 45);
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
    			if (changed.title) textinput0_changes.value = ctx.title;
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.subtitle) textinput1_changes.value = ctx.subtitle;
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (changed.address) textinput2_changes.value = ctx.address;
    			textinput2.$set(textinput2_changes);

    			var textinput3_changes = {};
    			if (changed.imageUrl) textinput3_changes.value = ctx.imageUrl;
    			textinput3.$set(textinput3_changes);

    			var textinput4_changes = {};
    			if (changed.description) textinput4_changes.value = ctx.description;
    			textinput4.$set(textinput4_changes);

    			var textinput5_changes = {};
    			if (changed.contactEmail) textinput5_changes.value = ctx.contactEmail;
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

    function create_fragment$4(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		title: "Edit Meetup",
    		$$slots: {
    		default: [create_default_slot$1],
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
    			if (changed.$$scope || changed.contactEmail || changed.description || changed.imageUrl || changed.address || changed.subtitle || changed.title) modal_changes.$$scope = { changed, ctx };
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

    function instance$3($$self, $$props, $$invalidate) {
    	

        const dispatch = createEventDispatcher();

        let title = "";
        let subtitle = "";
        let address = "";
        let imageUrl = "";
        let description = "";
        let contactEmail = "";

        const submitForm = () => {
            dispatch('save', {
                title: title,
                subtitle: subtitle,
                address: address,
                imageUrl: imageUrl,
                description: description,
                contactEmail: contactEmail
            });
        };

    	function cancel_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(e) {
    		const $$result = (title = e.target.value);
    		$$invalidate('title', title);
    		return $$result;
    	}

    	function input_handler_1(e) {
    		const $$result = (subtitle = e.target.value);
    		$$invalidate('subtitle', subtitle);
    		return $$result;
    	}

    	function input_handler_2(e) {
    		const $$result = (address = e.target.value);
    		$$invalidate('address', address);
    		return $$result;
    	}

    	function input_handler_3(e) {
    		const $$result = (imageUrl = e.target.value);
    		$$invalidate('imageUrl', imageUrl);
    		return $$result;
    	}

    	function input_handler_4(e) {
    		const $$result = (description = e.target.value);
    		$$invalidate('description', description);
    		return $$result;
    	}

    	function input_handler_5(e) {
    		const $$result = (contactEmail = e.target.value);
    		$$invalidate('contactEmail', contactEmail);
    		return $$result;
    	}

    	return {
    		title,
    		subtitle,
    		address,
    		imageUrl,
    		description,
    		contactEmail,
    		submitForm,
    		cancel_handler,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input_handler_3,
    		input_handler_4,
    		input_handler_5
    	};
    }

    class Edit_meetup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src\ui\Badge.svelte generated by Svelte v3.5.1 */

    const file$5 = "src\\ui\\Badge.svelte";

    function create_fragment$5(ctx) {
    	var span, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			span = element("span");

    			if (default_slot) default_slot.c();

    			span.className = "svelte-134umif";
    			add_location(span, file$5, 0, 0, 0);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Badge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\components\Meetup-Item.svelte generated by Svelte v3.5.1 */

    const file$6 = "src\\components\\Meetup-Item.svelte";

    // (5:6) {#if isFavourite}
    function create_if_block$2(ctx) {
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

    // (6:8) <Badge>
    function create_default_slot_3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("FAVOURITE");
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

    // (22:4) <Button href="mailTo:{email}" type={"button"}>
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

    // (23:4) <Button type={"button"}>
    function create_default_slot_1$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Show details");
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

    // (24:4) <Button         mode={"outline"}         type={"button"}         color={isFavourite ? null : 'success'}        on:click={() => dispatch('togglefavourite', id)}>
    function create_default_slot$2(ctx) {
    	var t_value = ctx.isFavourite ? 'Unfavourite' : 'Favourite', t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.isFavourite) && t_value !== (t_value = ctx.isFavourite ? 'Unfavourite' : 'Favourite')) {
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

    function create_fragment$6(ctx) {
    	var article, header, h1, t0, t1, t2, h2, t3, t4, p0, t5, t6, div0, img, t7, div1, p1, t8, t9, footer, t10, t11, current;

    	var if_block = (ctx.isFavourite) && create_if_block$2(ctx);

    	var button0 = new Button({
    		props: {
    		href: "mailTo:" + ctx.email,
    		type: "button",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: {
    		type: "button",
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button2 = new Button({
    		props: {
    		mode: "outline",
    		type: "button",
    		color: ctx.isFavourite ? null : 'success',
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button2.$on("click", ctx.click_handler);

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
    			h1.className = "svelte-1xvjpvv";
    			add_location(h1, file$6, 2, 4, 27);
    			h2.className = "svelte-1xvjpvv";
    			add_location(h2, file$6, 10, 4, 158);
    			p0.className = "svelte-1xvjpvv";
    			add_location(p0, file$6, 11, 4, 183);
    			header.className = "svelte-1xvjpvv";
    			add_location(header, file$6, 1, 2, 13);
    			img.src = ctx.imageUrl;
    			img.alt = ctx.title;
    			img.className = "svelte-1xvjpvv";
    			add_location(img, file$6, 14, 4, 241);
    			div0.className = "image svelte-1xvjpvv";
    			add_location(div0, file$6, 13, 2, 216);
    			p1.className = "svelte-1xvjpvv";
    			add_location(p1, file$6, 17, 4, 316);
    			div1.className = "content svelte-1xvjpvv";
    			add_location(div1, file$6, 16, 2, 289);
    			footer.className = "svelte-1xvjpvv";
    			add_location(footer, file$6, 20, 2, 352);
    			article.className = "svelte-1xvjpvv";
    			add_location(article, file$6, 0, 0, 0);
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

    			if (ctx.isFavourite) {
    				if (!if_block) {
    					if_block = create_if_block$2(ctx);
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
    			if (changed.email) button0_changes.href = "mailTo:" + ctx.email;
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.isFavourite) button2_changes.color = ctx.isFavourite ? null : 'success';
    			if (changed.$$scope || changed.isFavourite) button2_changes.$$scope = { changed, ctx };
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

    function instance$5($$self, $$props, $$invalidate) {
    	

      /* dispatch var used for forwarding events */
      const dispatch = createEventDispatcher();

      /* Meetup-item component props */
      let { id, title, subtitle, imageUrl, description, address, email, isFavourite } = $$props;

    	const writable_props = ['id', 'title', 'subtitle', 'imageUrl', 'description', 'address', 'email', 'isFavourite'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Meetup_Item> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		return dispatch('togglefavourite', id);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate('subtitle', subtitle = $$props.subtitle);
    		if ('imageUrl' in $$props) $$invalidate('imageUrl', imageUrl = $$props.imageUrl);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('address' in $$props) $$invalidate('address', address = $$props.address);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('isFavourite' in $$props) $$invalidate('isFavourite', isFavourite = $$props.isFavourite);
    	};

    	return {
    		dispatch,
    		id,
    		title,
    		subtitle,
    		imageUrl,
    		description,
    		address,
    		email,
    		isFavourite,
    		click_handler
    	};
    }

    class Meetup_Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, ["id", "title", "subtitle", "imageUrl", "description", "address", "email", "isFavourite"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'id'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'title'");
    		}
    		if (ctx.subtitle === undefined && !('subtitle' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'subtitle'");
    		}
    		if (ctx.imageUrl === undefined && !('imageUrl' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'imageUrl'");
    		}
    		if (ctx.description === undefined && !('description' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'description'");
    		}
    		if (ctx.address === undefined && !('address' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'address'");
    		}
    		if (ctx.email === undefined && !('email' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'email'");
    		}
    		if (ctx.isFavourite === undefined && !('isFavourite' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'isFavourite'");
    		}
    	}

    	get id() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageUrl() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageUrl(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get email() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFavourite() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFavourite(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Meetup-grid.svelte generated by Svelte v3.5.1 */

    const file$7 = "src\\components\\Meetup-grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.meetup = list[i];
    	return child_ctx;
    }

    // (2:2) {#each meetups as meetup}
    function create_each_block(ctx) {
    	var current;

    	var meetupitem = new Meetup_Item({
    		props: {
    		id: ctx.meetup.id,
    		title: ctx.meetup.title,
    		subtitle: ctx.meetup.subtitle,
    		description: ctx.meetup.description,
    		imageUrl: ctx.meetup.imageUrl,
    		address: ctx.meetup.address,
    		isFavourite: ctx.meetup.isFavourite,
    		email: ctx.meetup.contactEmail
    	},
    		$$inline: true
    	});
    	meetupitem.$on("togglefavourite", ctx.togglefavourite_handler);

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
    			if (changed.meetups) meetupitem_changes.address = ctx.meetup.address;
    			if (changed.meetups) meetupitem_changes.isFavourite = ctx.meetup.isFavourite;
    			if (changed.meetups) meetupitem_changes.email = ctx.meetup.contactEmail;
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

    function create_fragment$7(ctx) {
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
    			section.className = "svelte-1ns8a2s";
    			add_location(section, file$7, 0, 0, 0);
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

    function instance$6($$self, $$props, $$invalidate) {
    	/* Receive meetup data array */
      let { meetups } = $$props;

    	const writable_props = ['meetups'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Meetup_grid> was created with unknown prop '${key}'`);
    	});

    	function togglefavourite_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('meetups' in $$props) $$invalidate('meetups', meetups = $$props.meetups);
    	};

    	return { meetups, togglefavourite_handler };
    }

    class Meetup_grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, ["meetups"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.meetups === undefined && !('meetups' in props)) {
    			console.warn("<Meetup_grid> was created without expected prop 'meetups'");
    		}
    	}

    	get meetups() {
    		throw new Error("<Meetup_grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set meetups(value) {
    		throw new Error("<Meetup_grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$8 = "src\\App.svelte";

    // (5:4) <Button on:click="{() => editMode = 'add'}">
    function create_default_slot$3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("New meetup");
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

    // (10:2) {:else}
    function create_else_block$2(ctx) {
    	var current;

    	var meetupgrid = new Meetup_grid({
    		props: { meetups: ctx.meetups },
    		$$inline: true
    	});
    	meetupgrid.$on("togglefavourite", ctx.toggleFavourite);

    	return {
    		c: function create() {
    			meetupgrid.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(meetupgrid, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var meetupgrid_changes = {};
    			if (changed.meetups) meetupgrid_changes.meetups = ctx.meetups;
    			meetupgrid.$set(meetupgrid_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			meetupgrid.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			meetupgrid.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			meetupgrid.$destroy(detaching);
    		}
    	};
    }

    // (8:2) {#if editMode === 'add'}
    function create_if_block$3(ctx) {
    	var current;

    	var editmeetup = new Edit_meetup({ $$inline: true });
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
    	var t0, main, div, t1, current_block_type_index, if_block, current;

    	var header = new Header({ $$inline: true });

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.click_handler);

    	var if_block_creators = [
    		create_if_block$3,
    		create_else_block$2
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.editMode === 'add') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			div = element("div");
    			button.$$.fragment.c();
    			t1 = space();
    			if_block.c();
    			div.className = "meetup-controls svelte-1m5959e";
    			add_location(div, file$8, 3, 2, 24);
    			main.className = "svelte-1m5959e";
    			add_location(main, file$8, 2, 0, 14);
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
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

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
    				if_block.m(main, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			header.$$.fragment.i(local);

    			button.$$.fragment.i(local);

    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			header.$$.fragment.o(local);
    			button.$$.fragment.o(local);
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			header.$destroy(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			button.$destroy();

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	
      
      let editMode;

      let meetups = [
        {
          id: "m1",
          title: "Meet up title one",
          subtitle: "The subtitle for the first one",
          description: "Meet up one, do thing, something. Anything.",
          imageUrl: "images/rota-alternativa-1663969-unsplash.jpg",
          address: "Somewhere other there, maybe.",
          contactEmail: "email@email.com",
          isFavourite: false
        },
        {
          id: "m2",
          title: "Meet up title two",
          subtitle: "Another subtitle",
          description: "Meet up two, with a coastline.",
          imageUrl: "images/janis-karkossa-1668527-unsplash.jpg",
          address: "The coast, something something, 4005",
          contactEmail: "coast@email.com2",
          isFavourite: false
        }
      ];

      const addMeetup = (e) => {
        let newMeetup = {
          id: Math.random().toString(),
          title: e.detail.title,
          subtitle: e.detail.subtitle,
          description: e.detail.description,
          imageUrl: e.detail.imageUrl,
          address: e.detail.address,
          contactEmail: e.detail.contactEmail
        };
        $$invalidate('meetups', meetups = [newMeetup, ...meetups]);
        $$invalidate('editMode', editMode = null);
      };

      const toggleFavourite = (e) => {
        const id = e.detail;
        const toggleFav = meetups.map( (obj) => {
          if (obj.id === id) {
            obj.isFavourite = !obj.isFavourite;
          }
          return obj;
        });
        $$invalidate('meetups', meetups = [...toggleFav]);
     
        /* const meetupTarget =  {...meetups.find(m => m.id === id)};

        meetupTarget.isFavourite = !meetupTarget.isFavourite;

        const meetupIndex = meetups.findIndex(m => m.id === id);
        
        const updatedMeetups = [...meetups];
        updatedMeetups[meetupIndex] = meetupTarget;
        meetups = updatedMeetups; */

      };

      const cancelEdit = () => {
        $$invalidate('editMode', editMode = null);
      };

    	function click_handler() {
    		const $$result = editMode = 'add';
    		$$invalidate('editMode', editMode);
    		return $$result;
    	}

    	return {
    		editMode,
    		meetups,
    		addMeetup,
    		toggleFavourite,
    		cancelEdit,
    		click_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
