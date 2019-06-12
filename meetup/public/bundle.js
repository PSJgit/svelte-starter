
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    /* src\ui\TextInput.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\ui\\TextInput.svelte";

    // (48:2) {:else}
    function create_else_block(ctx) {
    	var label_1, t0, t1, input, dispose;

    	return {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			input = element("input");
    			label_1.htmlFor = ctx.label;
    			label_1.className = "svelte-10fbh92";
    			add_location(label_1, file$1, 48, 4, 893);
    			attr(input, "type", ctx.type);
    			input.id = ctx.id;
    			input.value = ctx.value;
    			input.className = "svelte-10fbh92";
    			add_location(input, file$1, 49, 4, 933);
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
    function create_if_block(ctx) {
    	var label_1, t0, t1, textarea, dispose;

    	return {
    		c: function create() {
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			textarea = element("textarea");
    			label_1.htmlFor = ctx.id;
    			label_1.className = "svelte-10fbh92";
    			add_location(label_1, file$1, 45, 4, 798);
    			textarea.rows = ctx.rows;
    			textarea.id = ctx.id;
    			textarea.value = ctx.value;
    			textarea.className = "svelte-10fbh92";
    			add_location(textarea, file$1, 46, 4, 835);
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

    function create_fragment$1(ctx) {
    	var div;

    	function select_block_type(ctx) {
    		if (ctx.controlType === 'textarea') return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			div.className = "form-control svelte-10fbh92";
    			add_location(div, file$1, 43, 0, 730);
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

    function instance($$self, $$props, $$invalidate) {
    	/* props */
      let { controlType, rows, id, label, value, type } = $$props;

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
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["controlType", "rows", "id", "label", "value", "type"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.controlType === undefined && !('controlType' in props)) {
    			console.warn("<TextInput> was created without expected prop 'controlType'");
    		}
    		if (ctx.rows === undefined && !('rows' in props)) {
    			console.warn("<TextInput> was created without expected prop 'rows'");
    		}
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<TextInput> was created without expected prop 'id'");
    		}
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
    		}
    		if (ctx.value === undefined && !('value' in props)) {
    			console.warn("<TextInput> was created without expected prop 'value'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<TextInput> was created without expected prop 'type'");
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

    /* src\ui\Button.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\ui\\Button.svelte";

    // (165:2) {:else}
    function create_else_block$1(ctx) {
    	var button, t;

    	return {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.text);
    			button.className = "" + ctx.mode + " svelte-364aat";
    			button.type = ctx.type;
    			add_location(button, file$2, 165, 2, 2784);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.text) {
    				set_data(t, ctx.text);
    			}

    			if (changed.mode) {
    				button.className = "" + ctx.mode + " svelte-364aat";
    			}

    			if (changed.type) {
    				button.type = ctx.type;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}
    		}
    	};
    }

    // (163:0) {#if href}
    function create_if_block$1(ctx) {
    	var a, t;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(ctx.text);
    			a.href = ctx.href;
    			a.className = "svelte-364aat";
    			add_location(a, file$2, 163, 2, 2749);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.text) {
    				set_data(t, ctx.text);
    			}

    			if (changed.href) {
    				a.href = ctx.href;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if (ctx.href) return create_if_block$1;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	/* props */
      let { type, text, href, mode } = $$props;

    	const writable_props = ['type', 'text', 'href', 'mode'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('href' in $$props) $$invalidate('href', href = $$props.href);
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    	};

    	return { type, text, href, mode };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, ["type", "text", "href", "mode"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}
    		if (ctx.href === undefined && !('href' in props)) {
    			console.warn("<Button> was created without expected prop 'href'");
    		}
    		if (ctx.mode === undefined && !('mode' in props)) {
    			console.warn("<Button> was created without expected prop 'mode'");
    		}
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
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
    }

    /* src\components\Meetup-Item.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\components\\Meetup-Item.svelte";

    function create_fragment$3(ctx) {
    	var article, header, h1, t0, t1, h2, t2, t3, p0, t4, t5, div0, img, t6, div1, p1, t7, t8, footer, t9, t10, current;

    	var button0 = new Button({
    		props: {
    		href: "mailTo:" + ctx.email,
    		type: "button",
    		text: "Contact"
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: { type: "button", text: "Show details" },
    		$$inline: true
    	});

    	var button2 = new Button({
    		props: {
    		mode: "outline",
    		type: "button",
    		text: "Favourite"
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
    			h2 = element("h2");
    			t2 = text(ctx.subTitle);
    			t3 = space();
    			p0 = element("p");
    			t4 = text(ctx.address);
    			t5 = space();
    			div0 = element("div");
    			img = element("img");
    			t6 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t7 = text(ctx.description);
    			t8 = space();
    			footer = element("footer");
    			button0.$$.fragment.c();
    			t9 = space();
    			button1.$$.fragment.c();
    			t10 = space();
    			button2.$$.fragment.c();
    			h1.className = "svelte-2ao9o8";
    			add_location(h1, file$3, 69, 4, 1040);
    			h2.className = "svelte-2ao9o8";
    			add_location(h2, file$3, 70, 4, 1062);
    			p0.className = "svelte-2ao9o8";
    			add_location(p0, file$3, 71, 4, 1087);
    			header.className = "svelte-2ao9o8";
    			add_location(header, file$3, 68, 2, 1026);
    			img.src = ctx.imageUrl;
    			img.alt = ctx.title;
    			img.className = "svelte-2ao9o8";
    			add_location(img, file$3, 74, 4, 1145);
    			div0.className = "image svelte-2ao9o8";
    			add_location(div0, file$3, 73, 2, 1120);
    			p1.className = "svelte-2ao9o8";
    			add_location(p1, file$3, 77, 4, 1220);
    			div1.className = "content svelte-2ao9o8";
    			add_location(div1, file$3, 76, 2, 1193);
    			footer.className = "svelte-2ao9o8";
    			add_location(footer, file$3, 80, 2, 1256);
    			article.className = "svelte-2ao9o8";
    			add_location(article, file$3, 67, 0, 1013);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, article, anchor);
    			append(article, header);
    			append(header, h1);
    			append(h1, t0);
    			append(header, t1);
    			append(header, h2);
    			append(h2, t2);
    			append(header, t3);
    			append(header, p0);
    			append(p0, t4);
    			append(article, t5);
    			append(article, div0);
    			append(div0, img);
    			append(article, t6);
    			append(article, div1);
    			append(div1, p1);
    			append(p1, t7);
    			append(article, t8);
    			append(article, footer);
    			mount_component(button0, footer, null);
    			append(footer, t9);
    			mount_component(button1, footer, null);
    			append(footer, t10);
    			mount_component(button2, footer, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.title) {
    				set_data(t0, ctx.title);
    			}

    			if (!current || changed.subTitle) {
    				set_data(t2, ctx.subTitle);
    			}

    			if (!current || changed.address) {
    				set_data(t4, ctx.address);
    			}

    			if (!current || changed.imageUrl) {
    				img.src = ctx.imageUrl;
    			}

    			if (!current || changed.title) {
    				img.alt = ctx.title;
    			}

    			if (!current || changed.description) {
    				set_data(t7, ctx.description);
    			}

    			var button0_changes = {};
    			if (changed.email) button0_changes.href = "mailTo:" + ctx.email;
    			button0.$set(button0_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			button0.$$.fragment.i(local);

    			button1.$$.fragment.i(local);

    			button2.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			button0.$$.fragment.o(local);
    			button1.$$.fragment.o(local);
    			button2.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(article);
    			}

    			button0.$destroy();

    			button1.$destroy();

    			button2.$destroy();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	/* Meetup-item component props */
      let { title, subTitle, imageUrl, description, address, email } = $$props;

    	const writable_props = ['title', 'subTitle', 'imageUrl', 'description', 'address', 'email'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Meetup_Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('subTitle' in $$props) $$invalidate('subTitle', subTitle = $$props.subTitle);
    		if ('imageUrl' in $$props) $$invalidate('imageUrl', imageUrl = $$props.imageUrl);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('address' in $$props) $$invalidate('address', address = $$props.address);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    	};

    	return {
    		title,
    		subTitle,
    		imageUrl,
    		description,
    		address,
    		email
    	};
    }

    class Meetup_Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["title", "subTitle", "imageUrl", "description", "address", "email"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'title'");
    		}
    		if (ctx.subTitle === undefined && !('subTitle' in props)) {
    			console.warn("<Meetup_Item> was created without expected prop 'subTitle'");
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
    	}

    	get title() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Meetup_Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subTitle() {
    		throw new Error("<Meetup_Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subTitle(value) {
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
    }

    /* src\components\Meetup-grid.svelte generated by Svelte v3.5.1 */

    const file$4 = "src\\components\\Meetup-grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.meetup = list[i];
    	return child_ctx;
    }

    // (24:2) {#each meetups as meetup}
    function create_each_block(ctx) {
    	var current;

    	var meetupitem = new Meetup_Item({
    		props: {
    		title: ctx.meetup.title,
    		subTitle: ctx.meetup.subTitle,
    		description: ctx.meetup.description,
    		imageUrl: ctx.meetup.imageUrl,
    		address: ctx.meetup.address,
    		email: ctx.meetup.contactEmail
    	},
    		$$inline: true
    	});

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
    			if (changed.meetups) meetupitem_changes.title = ctx.meetup.title;
    			if (changed.meetups) meetupitem_changes.subTitle = ctx.meetup.subTitle;
    			if (changed.meetups) meetupitem_changes.description = ctx.meetup.description;
    			if (changed.meetups) meetupitem_changes.imageUrl = ctx.meetup.imageUrl;
    			if (changed.meetups) meetupitem_changes.address = ctx.meetup.address;
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
    			section.className = "svelte-1ns8a2s";
    			add_location(section, file$4, 22, 0, 370);
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
    	/* Receive meetup data array */
      let { meetups } = $$props;

    	const writable_props = ['meetups'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Meetup_grid> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('meetups' in $$props) $$invalidate('meetups', meetups = $$props.meetups);
    	};

    	return { meetups };
    }

    class Meetup_grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["meetups"]);

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

    const file$5 = "src\\App.svelte";

    function create_fragment$5(ctx) {
    	var t0, main, form, t1, t2, t3, t4, t5, t6, t7, current, dispose;

    	var header = new Header({ $$inline: true });

    	var textinput0 = new TextInput({
    		props: {
    		type: "text",
    		id: "title",
    		label: "Title",
    		value: ctx.title
    	},
    		$$inline: true
    	});
    	textinput0.$on("input", ctx.input_handler);

    	var textinput1 = new TextInput({
    		props: {
    		type: "text",
    		id: "subtitle",
    		label: "Subtitle",
    		value: ctx.subtitle
    	},
    		$$inline: true
    	});
    	textinput1.$on("input", ctx.input_handler_1);

    	var textinput2 = new TextInput({
    		props: {
    		type: "text",
    		id: "address",
    		label: "Address",
    		value: ctx.address
    	},
    		$$inline: true
    	});
    	textinput2.$on("input", ctx.input_handler_2);

    	var textinput3 = new TextInput({
    		props: {
    		type: "text",
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
    		type: "text",
    		id: "contact-email",
    		label: "Contact Email",
    		value: ctx.contactEmail
    	},
    		$$inline: true
    	});
    	textinput5.$on("input", ctx.input_handler_5);

    	var button = new Button({
    		props: { type: "submit", text: "Save" },
    		$$inline: true
    	});

    	var meetupgrid = new Meetup_grid({
    		props: { meetups: ctx.meetups },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			main = element("main");
    			form = element("form");
    			textinput0.$$.fragment.c();
    			t1 = space();
    			textinput1.$$.fragment.c();
    			t2 = space();
    			textinput2.$$.fragment.c();
    			t3 = space();
    			textinput3.$$.fragment.c();
    			t4 = space();
    			textinput4.$$.fragment.c();
    			t5 = space();
    			textinput5.$$.fragment.c();
    			t6 = space();
    			button.$$.fragment.c();
    			t7 = space();
    			meetupgrid.$$.fragment.c();
    			form.className = "svelte-1u939va";
    			add_location(form, file$5, 66, 2, 1683);
    			main.className = "svelte-1u939va";
    			add_location(main, file$5, 65, 0, 1673);
    			dispose = listen(form, "submit", prevent_default(ctx.addMeetup));
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, form);
    			mount_component(textinput0, form, null);
    			append(form, t1);
    			mount_component(textinput1, form, null);
    			append(form, t2);
    			mount_component(textinput2, form, null);
    			append(form, t3);
    			mount_component(textinput3, form, null);
    			append(form, t4);
    			mount_component(textinput4, form, null);
    			append(form, t5);
    			mount_component(textinput5, form, null);
    			append(form, t6);
    			mount_component(button, form, null);
    			append(main, t7);
    			mount_component(meetupgrid, main, null);
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

    			var meetupgrid_changes = {};
    			if (changed.meetups) meetupgrid_changes.meetups = ctx.meetups;
    			meetupgrid.$set(meetupgrid_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			header.$$.fragment.i(local);

    			textinput0.$$.fragment.i(local);

    			textinput1.$$.fragment.i(local);

    			textinput2.$$.fragment.i(local);

    			textinput3.$$.fragment.i(local);

    			textinput4.$$.fragment.i(local);

    			textinput5.$$.fragment.i(local);

    			button.$$.fragment.i(local);

    			meetupgrid.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			header.$$.fragment.o(local);
    			textinput0.$$.fragment.o(local);
    			textinput1.$$.fragment.o(local);
    			textinput2.$$.fragment.o(local);
    			textinput3.$$.fragment.o(local);
    			textinput4.$$.fragment.o(local);
    			textinput5.$$.fragment.o(local);
    			button.$$.fragment.o(local);
    			meetupgrid.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			header.$destroy(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(main);
    			}

    			textinput0.$destroy();

    			textinput1.$destroy();

    			textinput2.$destroy();

    			textinput3.$destroy();

    			textinput4.$destroy();

    			textinput5.$destroy();

    			button.$destroy();

    			meetupgrid.$destroy();

    			dispose();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

      let meetups = [
        {
          id: "m1",
          title: "Meet up title one",
          subTitle: "The subtitle for the first one",
          description: "Meet up one, do thing, something. Anything.",
          imageUrl: "images/rota-alternativa-1663969-unsplash.jpg",
          address: "Somewhere other there, maybe.",
          contactEmail: "email@email.com"
        },
        {
          id: "m2",
          title: "Meet up title two",
          subTitle: "Another subtitle",
          description: "Meet up two, with a coastline.",
          imageUrl: "images/janis-karkossa-1668527-unsplash.jpg",
          address: "The coast, something something, 4005",
          contactEmail: "coast@email.com2"
        }
      ];

      /* init vars for storing data from form input via bind directive */
      let title = "";
      let subtitle = "";
      let address = "";
      let imageUrl = "";
      let description = "";
      let contactEmail = "";

      const addMeetup = () => {
        let newMeetup = {
          id: Math.random().toString(),
          title: title,
          subtitle: subtitle,
          description: description,
          imageUrl: imageUrl,
          address: address,
          contactEmail: contactEmail
        };
        /* unpack old meetup array into new meet up array to get Svelte to update the dom*/
        $$invalidate('meetups', meetups = [newMeetup, ...meetups]);
      };

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
    		meetups,
    		title,
    		subtitle,
    		address,
    		imageUrl,
    		description,
    		contactEmail,
    		addMeetup,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input_handler_3,
    		input_handler_4,
    		input_handler_5
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
