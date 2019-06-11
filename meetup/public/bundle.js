
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

    /* src\components\Meetup-Item.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\components\\Meetup-Item.svelte";

    function create_fragment$1(ctx) {
    	var article, header, h1, t0, t1, h2, t2, t3, p0, t4, t5, div0, img, t6, div1, p1, t7, t8, footer, a, t9, a_href_value, t10, button0, t12, button1;

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
    			a = element("a");
    			t9 = text("Contact");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Show Details";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Favorite";
    			h1.className = "svelte-2ao9o8";
    			add_location(h1, file$1, 65, 4, 966);
    			h2.className = "svelte-2ao9o8";
    			add_location(h2, file$1, 66, 4, 988);
    			p0.className = "svelte-2ao9o8";
    			add_location(p0, file$1, 67, 4, 1013);
    			header.className = "svelte-2ao9o8";
    			add_location(header, file$1, 64, 2, 952);
    			img.src = ctx.imageUrl;
    			img.alt = ctx.title;
    			img.className = "svelte-2ao9o8";
    			add_location(img, file$1, 70, 4, 1071);
    			div0.className = "image svelte-2ao9o8";
    			add_location(div0, file$1, 69, 2, 1046);
    			p1.className = "svelte-2ao9o8";
    			add_location(p1, file$1, 73, 4, 1150);
    			div1.className = "content svelte-2ao9o8";
    			add_location(div1, file$1, 72, 2, 1123);
    			a.href = a_href_value = "mailTo:" + ctx.email;
    			add_location(a, file$1, 77, 4, 1204);
    			add_location(button0, file$1, 78, 4, 1246);
    			add_location(button1, file$1, 79, 4, 1281);
    			footer.className = "svelte-2ao9o8";
    			add_location(footer, file$1, 76, 2, 1190);
    			article.className = "svelte-2ao9o8";
    			add_location(article, file$1, 63, 0, 939);
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
    			append(footer, a);
    			append(a, t9);
    			append(footer, t10);
    			append(footer, button0);
    			append(footer, t12);
    			append(footer, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.title) {
    				set_data(t0, ctx.title);
    			}

    			if (changed.subTitle) {
    				set_data(t2, ctx.subTitle);
    			}

    			if (changed.address) {
    				set_data(t4, ctx.address);
    			}

    			if (changed.imageUrl) {
    				img.src = ctx.imageUrl;
    			}

    			if (changed.title) {
    				img.alt = ctx.title;
    			}

    			if (changed.description) {
    				set_data(t7, ctx.description);
    			}

    			if ((changed.email) && a_href_value !== (a_href_value = "mailTo:" + ctx.email)) {
    				a.href = a_href_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(article);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
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
    		init(this, options, instance, create_fragment$1, safe_not_equal, ["title", "subTitle", "imageUrl", "description", "address", "email"]);

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

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.meetup = list[i];
    	return child_ctx;
    }

    // (36:4) {#each meetups as meetup}
    function create_each_block(ctx) {
    	var current;

    	var meetupitem = new Meetup_Item({
    		props: {
    		title: ctx.meetup.title,
    		subTitle: ctx.meetup.subTitle,
    		description: ctx.meetup.description,
    		imageUrl: ctx.meetup.imageUrl,
    		address: ctx.meetup.address,
    		contactEmail: ctx.meetup.contactEmail
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
    			if (changed.meetups) meetupitem_changes.contactEmail = ctx.meetup.contactEmail;
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

    function create_fragment$2(ctx) {
    	var t, section, current;

    	var header = new Header({ $$inline: true });

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
    			header.$$.fragment.c();
    			t = space();
    			section = element("section");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			section.id = "meetups";
    			section.className = "svelte-169sn84";
    			add_location(section, file$2, 34, 0, 867);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert(target, t, anchor);
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
    			header.$$.fragment.i(local);

    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			header.$$.fragment.o(local);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			header.$destroy(detaching);

    			if (detaching) {
    				detach(t);
    				detach(section);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$1($$self) {
    	

        const meetups = [
            {
                id: 'm1',
                title: 'title',
                subTitle: 'subtitle',
                description: 'In this descriptiong',
                imageUrl: 'images/rota-alternativa-1663969-unsplash.jpg',
                address: 'address',
                contactEmail: 'email@email.com'
            },
            {
                id: 'm2',
                title: 'title2',
                subTitle: 'subtitle2',
                description: 'In this description2',
                imageUrl: 'images/janis-karkossa-1668527-unsplash.jpg',
                address: 'address2',
                contactEmail: 'email@email.com2'
            }
        ];

    	return { meetups };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
