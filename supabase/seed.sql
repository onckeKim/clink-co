-- ============================================================================
-- Clink & Co by HEIMSIGHT — development seed data.
--
-- Run automatically by `supabase db reset`, or manually via
-- `supabase db execute -f supabase/seed.sql` (or paste into the SQL editor)
-- — see supabase/README.md for the full walkthrough.
--
-- Scope, deliberately: categories, collections, 20+ products (with
-- variants, images, and inventory), homepage sections, hero slides, store
-- settings, and sample reviews — exactly the storefront-facing data a fresh
-- environment needs to render and demo. It does NOT seed profiles, orders,
-- carts, wishlists, or any customer-owned row: those all key off a real
-- auth.users id, and fabricating one bypasses Supabase Auth entirely
-- without producing anything you could actually sign in as. Create a real
-- account through the app's own sign-up flow instead, then either add its
-- email to ADMIN_BOOTSTRAP_EMAILS before first sign-in, or grant it a role
-- directly: `insert into user_roles (user_id, role) values ('<uuid from
-- auth.users>', 'super_admin');`. No row below contains real customer
-- personal information — every name, review, and address-shaped value here
-- is invented for this seed.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Categories — the six launch categories, in display order.
-- ----------------------------------------------------------------------------
insert into public.categories (slug, name, description, image, sort_order) values
  ('glassware', 'Glassware', 'Coupes, tumblers and stemware, mouth-blown for everyday elegance.', '/images/categories/glassware.svg', 0),
  ('barware', 'Barware', 'Shakers, jiggers and bar tools built for the home mixologist.', '/images/categories/barware.svg', 1),
  ('tableware', 'Tableware', 'Plates, bowls and linens for a table set with intention.', '/images/categories/tableware.svg', 2),
  ('serveware', 'Serveware', 'Decanters, trays and ice buckets that carry the evening.', '/images/categories/serveware.svg', 3),
  ('gift-sets', 'Gift Sets', 'Curated pairings, boxed and ribboned, ready to give.', '/images/categories/gift-sets.svg', 4),
  ('accessories', 'Accessories', 'Candles, coasters and small objects that finish a room.', '/images/categories/accessories.svg', 5);

-- ----------------------------------------------------------------------------
-- Collections — four curated cross-category edits.
-- ----------------------------------------------------------------------------
insert into public.collections (slug, name, description, image, sort_order) values
  ('home-bar-edit', 'The Home Bar Edit', 'Shakers, jiggers and glassware for the ritual of the first pour.', '/images/collection-home-bar.svg', 0),
  ('everyday-elegance', 'Everyday Elegance', 'Considered pieces sturdy enough for Tuesday, refined enough for Saturday.', '/images/collection-everyday-elegance.svg', 1),
  ('gifts-worth-giving', 'Gifts Worth Giving', 'Boxed, ribboned sets for the hosts, newlyweds and new-home friends on your list.', '/images/collection-gifts-worth-giving.svg', 2),
  ('autumn-edit', 'The Autumn Edit', 'Seasonal glassware and warm-toned tableware for the months ahead.', '/images/hero-table.svg', 3);

-- ----------------------------------------------------------------------------
-- Products — 22 pieces across all six categories. Prices in ZAR.
-- ----------------------------------------------------------------------------
insert into public.products (
  slug, sku, name, short_description, description, price, product_type, material,
  capacity, set_size, weight_grams, care_instructions, tags, badges, featured, publish_status
) values
  ('solstice-coupe-glasses', 'CC-GLS-001', 'Solstice Coupe Glasses', 'Set of 4, hand-finished rims',
   'A wide, shallow bowl balanced on a slender stem — Solstice brings a soft amber cast to sparkling wine and classic cocktails alike. Mouth-blown and hand-finished, so faint variation in the rim is part of the character.',
   1450, 'Champagne Glasses', 'Hand-blown glass', '180 ml', 'Set of 4', 620,
   array['Hand wash recommended', 'Avoid extreme temperature changes'],
   array['coupe', 'champagne', 'sparkling wine', 'mouth-blown', 'wedding gift'], array['Bestseller'], true, 'published'),

  ('harbor-rocks-glasses', 'CC-GLS-002', 'Harbor Rocks Glasses', 'Set of 4, heavyweight base',
   'Wide enough for a single oversized cube, weighted enough to feel substantial in hand — our most requested piece for whisky, negronis and quiet nights in.',
   1250, 'Tumblers', 'Lead-free crystal', '300 ml', 'Set of 4', 540,
   array['Hand wash recommended', 'Avoid extreme temperature changes'],
   array['rocks glass', 'whisky', 'old fashioned', 'heavyweight'], array['Bestseller'], true, 'published'),

  ('meridian-cocktail-shaker', 'CC-BAR-001', 'Meridian Cocktail Shaker', 'Brushed stainless, 710 ml',
   'A three-piece Cobbler shaker with a built-in strainer and a cap that doubles as a jigger — no leaks, no fuss, just a clean pour every time.',
   1750, 'Shakers', 'Brushed stainless steel', '710 ml', null, 480,
   array['Hand wash recommended', 'Dry immediately to prevent water spots'],
   array['shaker', 'cocktail', 'bar tool', 'stainless steel'], array['Bestseller'], true, 'published'),

  ('aldine-decanter', 'CC-SRV-001', 'Aldine Decanter', 'Hand-blown, 1 L capacity',
   'A statement decanter with a wide base for aerating and a fitted stopper that seats with a satisfying click. Sized for a standard 750 ml bottle to pour through easily.',
   2650, 'Decanters', 'Hand-blown glass', '1 L', null, 1100,
   array['Hand wash recommended', 'Polish with a soft cloth'],
   array['decanter', 'whisky', 'wine', 'gift'], array[]::text[], true, 'published'),

  ('wilder-linen-napkins', 'CC-TAB-001', 'Wilder Linen Napkins', 'Set of 6, stonewashed',
   'Stonewashed European linen napkins that soften with every wash — a table staple that looks better a year in than it does on day one.',
   980, 'Linens', '100% European linen', null, 'Set of 6', 360,
   array['Machine washable, cold cycle', 'Tumble dry low or line dry'],
   array['napkins', 'linen', 'table setting'], array[]::text[], false, 'published'),

  ('hearth-dinner-plates', 'CC-TAB-002', 'Hearth Dinner Plates', 'Set of 4, stoneware',
   'Hand-glazed stoneware plates with a soft, matte finish and a slightly irregular edge — nice enough for guests, durable enough for every day.',
   1550, 'Dinnerware', 'Glazed stoneware', null, 'Set of 4', 1800,
   array['Dishwasher safe on gentle cycle', 'Microwave safe'],
   array['dinner plates', 'stoneware', 'wedding registry'], array['Bestseller'], true, 'published'),

  ('the-nightcap-gift-set', 'CC-GFT-001', 'The Nightcap Gift Set', 'Rocks glasses, jigger & bitters tray',
   'Two Harbor Rocks glasses, a brass jigger and a small marble bitters tray, boxed together for a housewarming or milestone birthday.',
   2450, 'Barware Sets', 'Mixed — glass, brass, marble', null, null, 1600,
   array['See individual care instructions for each piece'],
   array['gift set', 'housewarming', 'whisky', 'boxed gift'], array['Gift Edit'], true, 'published'),

  ('ember-taper-candles', 'CC-ACC-001', 'Ember Taper Candles', 'Set of 6, unscented beeswax',
   'Slow-burning, drip-resistant beeswax tapers in a warm ivory tone — the easiest way to change the light in a room.',
   580, 'Candles', 'Beeswax', null, 'Set of 6', 240,
   array['Trim wick to 1cm before lighting', 'Keep away from drafts'],
   array['candles', 'beeswax', 'tablescape'], array[]::text[], false, 'published'),

  ('stonewell-marble-coasters', 'CC-ACC-002', 'Stonewell Marble Coasters', 'Set of 4, cork-backed',
   'Honed marble coasters with a cork underside so they sit steady and protect the table beneath.',
   780, 'Coasters', 'Marble, cork backing', null, 'Set of 4', 900,
   array['Wipe clean with a dry cloth', 'Seal annually if used with acidic drinks'],
   array['coasters', 'marble', 'bar accessory'], array[]::text[], false, 'published'),

  ('tidewater-ice-bucket', 'CC-SRV-002', 'Tidewater Ice Bucket', 'Brass-lined, with tongs',
   'A brass-lined ice bucket with double-wall insulation and matching tongs — keeps ice frozen through a long dinner, not just the first round.',
   1980, 'Ice Buckets', 'Brass, stainless steel lining', '2.5 L', null, 1400,
   array['Hand wash recommended', 'Dry thoroughly before storing'],
   array['ice bucket', 'entertaining', 'brass'], array[]::text[], false, 'published'),

  ('lowland-wine-glasses', 'CC-GLS-003', 'Lowland Wine Glasses', 'Set of 4, all-purpose bowl',
   'A generous, all-purpose bowl that works equally well for a bold red or a crisp white — one glass shape for every bottle in the rack.',
   1350, 'Wine Glasses', 'Machine-blown glass', '450 ml', 'Set of 4', 210,
   array['Dishwasher safe on gentle cycle'],
   array['wine glasses', 'all-purpose', 'everyday'], array[]::text[], false, 'published'),

  ('almanac-brass-jigger', 'CC-BAR-002', 'Almanac Brass Jigger', '30 ml / 60 ml, solid brass',
   'A solid brass double jigger with an etched fill line — the small tool that makes every cocktail at home taste like the one at the bar.',
   520, 'Jiggers', 'Solid brass', '30 ml / 60 ml', null, 90,
   array['Hand wash recommended', 'Polish occasionally to maintain shine'],
   array['jigger', 'bar tool', 'brass', 'cocktail measuring'], array[]::text[], false, 'published'),

  ('gathering-serving-tray', 'CC-SRV-003', 'Gathering Serving Tray', 'Oak & brass, 50 cm',
   'A wide oak tray with brass handles, sized to carry a full round of drinks or anchor a spread at the centre of the table.',
   1650, 'Trays', 'Oak, brass', '50 cm', null, 1300,
   array['Wipe clean with a dry cloth', 'Oil occasionally to maintain finish'],
   array['tray', 'oak', 'entertaining'], array[]::text[], false, 'published'),

  ('toast-champagne-flutes', 'CC-GLS-004', 'Toast Champagne Flutes', 'Set of 4, fluted stem',
   'A classic fluted silhouette with a delicately ribbed stem — the glass for a proper toast.',
   1380, 'Champagne Glasses', 'Machine-blown glass', '200 ml', 'Set of 4', 190,
   array['Hand wash recommended'],
   array['flutes', 'champagne', 'celebration', 'wedding gift'], array['New'], false, 'published'),

  ('meadow-stem-wine-glasses', 'CC-GLS-005', 'Meadow Stem Wine Glasses', 'Set of 4, tinted crystal',
   'A soft sage-tinted crystal wine glass with a long, elegant stem — a quiet point of colour on a set table.',
   1450, 'Wine Glasses', 'Lead-free crystal', '400 ml', 'Set of 4', 230,
   array['Hand wash recommended', 'Avoid extreme temperature changes'],
   array['wine glasses', 'tinted glass', 'entertaining'], array['New'], false, 'published'),

  ('ridgeline-whisky-tumblers', 'CC-GLS-006', 'Ridgeline Whisky Tumblers', 'Set of 2, faceted base',
   'A faceted base catches the light and adds grip in hand — built for a slow pour, neat or over one large cube.',
   980, 'Tumblers', 'Lead-free crystal', '280 ml', 'Set of 2', 480,
   array['Hand wash recommended'],
   array['tumbler', 'whisky', 'faceted glass'], array[]::text[], false, 'published'),

  ('drift-linen-table-runner', 'CC-TAB-003', 'Drift Linen Table Runner', '36 x 275 cm, stonewashed',
   'A long stonewashed linen runner that softens a bare table instantly, in a warm oat tone that pairs with almost any setting.',
   890, 'Linens', '100% European linen', null, null, 420,
   array['Machine washable, cold cycle', 'Iron on low heat while damp'],
   array['table runner', 'linen', 'tablescape'], array[]::text[], false, 'published'),

  ('cove-copper-bar-tools', 'CC-BAR-003', 'Cove Copper Bar Tools Set', 'Bar spoon, strainer & muddler',
   'A three-piece copper-finished tool set — a long bar spoon, a Hawthorne strainer and a muddler — for the home bar that is starting to get serious.',
   1620, 'Bar Tools', 'Copper-plated stainless steel', null, null, 340,
   array['Hand wash recommended', 'Dry immediately to prevent tarnish'],
   array['bar tools', 'copper', 'muddler', 'strainer'], array[]::text[], false, 'published'),

  ('nomad-cocktail-glasses', 'CC-GLS-007', 'Nomad Cocktail Glasses', 'Set of 4, stemmed martini shape',
   'A modern take on the martini shape — a shorter stem and a slightly wider bowl make it steadier to carry across a room.',
   1250, 'Cocktail Glasses', 'Machine-blown glass', '210 ml', 'Set of 4', 200,
   array['Hand wash recommended'],
   array['cocktail glass', 'martini', 'stemmed'], array[]::text[], false, 'published'),

  ('haven-highball-glasses', 'CC-GLS-008', 'Haven Highball Glasses', 'Set of 4, tall straight side',
   'A tall, straight-sided highball built for a long drink over plenty of ice — gin and tonic weather, all year round.',
   1150, 'Tumblers', 'Machine-blown glass', '350 ml', 'Set of 4', 260,
   array['Dishwasher safe on gentle cycle'],
   array['highball', 'gin and tonic', 'tumbler'], array[]::text[], false, 'published'),

  ('ridge-oak-coasters', 'CC-ACC-003', 'Ridge Oak Coasters', 'Set of 6, ridged grain',
   'Solid oak coasters with a subtly ridged grain, finished with a food-safe oil that lets the wood grain character show.',
   650, 'Coasters', 'Solid oak', null, 'Set of 6', 480,
   array['Wipe clean with a dry cloth', 'Oil occasionally to maintain finish'],
   array['coasters', 'oak', 'wood'], array[]::text[], false, 'published'),

  ('willow-champagne-bucket', 'CC-SRV-004', 'Willow Champagne Bucket', 'Willow-wrapped, brass rim',
   'A hand-wrapped willow champagne bucket with a polished brass rim — as much a centrepiece as it is functional.',
   1450, 'Ice Buckets', 'Willow, brass', '3 L', null, 1200,
   array['Wipe clean with a damp cloth', 'Avoid prolonged soaking'],
   array['champagne bucket', 'willow', 'entertaining'], array['Limited'], true, 'published');

-- Primary category per product.
insert into public.product_categories (product_id, category_id, is_primary)
select p.id, c.id, true
from (values
  ('solstice-coupe-glasses', 'glassware'), ('harbor-rocks-glasses', 'glassware'),
  ('meridian-cocktail-shaker', 'barware'), ('aldine-decanter', 'serveware'),
  ('wilder-linen-napkins', 'tableware'), ('hearth-dinner-plates', 'tableware'),
  ('the-nightcap-gift-set', 'gift-sets'), ('ember-taper-candles', 'accessories'),
  ('stonewell-marble-coasters', 'accessories'), ('tidewater-ice-bucket', 'serveware'),
  ('lowland-wine-glasses', 'glassware'), ('almanac-brass-jigger', 'barware'),
  ('gathering-serving-tray', 'serveware'), ('toast-champagne-flutes', 'glassware'),
  ('meadow-stem-wine-glasses', 'glassware'), ('ridgeline-whisky-tumblers', 'glassware'),
  ('drift-linen-table-runner', 'tableware'), ('cove-copper-bar-tools', 'barware'),
  ('nomad-cocktail-glasses', 'glassware'), ('haven-highball-glasses', 'glassware'),
  ('ridge-oak-coasters', 'accessories'), ('willow-champagne-bucket', 'serveware')
) as map(product_slug, category_slug)
join public.products p on p.slug = map.product_slug
join public.categories c on c.slug = map.category_slug;

-- Collection membership.
insert into public.collection_products (collection_id, product_id)
select col.id, p.id
from (values
  ('home-bar-edit', 'harbor-rocks-glasses'), ('home-bar-edit', 'meridian-cocktail-shaker'),
  ('home-bar-edit', 'almanac-brass-jigger'), ('home-bar-edit', 'cove-copper-bar-tools'),
  ('home-bar-edit', 'ridgeline-whisky-tumblers'), ('home-bar-edit', 'haven-highball-glasses'),
  ('home-bar-edit', 'nomad-cocktail-glasses'),
  ('everyday-elegance', 'hearth-dinner-plates'), ('everyday-elegance', 'wilder-linen-napkins'),
  ('everyday-elegance', 'lowland-wine-glasses'), ('everyday-elegance', 'meadow-stem-wine-glasses'),
  ('everyday-elegance', 'stonewell-marble-coasters'), ('everyday-elegance', 'ridge-oak-coasters'),
  ('everyday-elegance', 'drift-linen-table-runner'),
  ('gifts-worth-giving', 'the-nightcap-gift-set'), ('gifts-worth-giving', 'ember-taper-candles'),
  ('gifts-worth-giving', 'toast-champagne-flutes'),
  ('autumn-edit', 'solstice-coupe-glasses'), ('autumn-edit', 'aldine-decanter'),
  ('autumn-edit', 'tidewater-ice-bucket'), ('autumn-edit', 'gathering-serving-tray'),
  ('autumn-edit', 'willow-champagne-bucket')
) as map(collection_slug, product_slug)
join public.collections col on col.slug = map.collection_slug
join public.products p on p.slug = map.product_slug;

-- Product images — reuses the repo's existing placeholder SVGs
-- (public/images/products/{slug}-{n}.svg), two per product.
insert into public.product_images (product_id, url, alt_text, sort_order, is_primary)
select p.id, '/images/products/' || p.slug || '-1.svg', p.name || ' — front view', 0, true
from public.products p;

insert into public.product_images (product_id, url, alt_text, sort_order, is_primary)
select p.id, '/images/products/' || p.slug || '-2.svg', p.name || ' — detail view', 1, false
from public.products p;

-- Variants — colour options on a handful of glassware pieces, to
-- demonstrate the feature without adding one to every product.
insert into public.product_variants (product_id, label, swatch, sort_order, is_default)
select p.id, v.label, v.swatch, v.sort_order, v.is_default
from public.products p
join (values
  ('meadow-stem-wine-glasses', 'Sage', '#9CAF88', 0, true),
  ('meadow-stem-wine-glasses', 'Smoke', '#6B6862', 1, false),
  ('meadow-stem-wine-glasses', 'Ivory', '#F4EFE6', 2, false),
  ('haven-highball-glasses', 'Clear', '#E8ECEA', 0, true),
  ('haven-highball-glasses', 'Smoke', '#6B6862', 1, false),
  ('ridgeline-whisky-tumblers', 'Clear', '#E8ECEA', 0, true),
  ('ridgeline-whisky-tumblers', 'Amber', '#B5763B', 1, false)
) as v(product_slug, label, swatch, sort_order, is_default)
  on p.slug = v.product_slug;

-- Inventory — one row per product at the main studio location. Two
-- intentionally low-stock and one intentionally out-of-stock, so the admin
-- dashboard's low/out-of-stock widgets have something to show.
insert into public.inventory (product_id, location, quantity_on_hand, low_stock_threshold)
select p.id, 'main', s.qty, 5
from public.products p
join (values
  ('solstice-coupe-glasses', 42), ('harbor-rocks-glasses', 58), ('meridian-cocktail-shaker', 35),
  ('aldine-decanter', 21), ('wilder-linen-napkins', 64), ('hearth-dinner-plates', 30),
  ('the-nightcap-gift-set', 18), ('ember-taper-candles', 90), ('stonewell-marble-coasters', 47),
  ('tidewater-ice-bucket', 4), ('lowland-wine-glasses', 55), ('almanac-brass-jigger', 76),
  ('gathering-serving-tray', 3), ('toast-champagne-flutes', 40), ('meadow-stem-wine-glasses', 33),
  ('ridgeline-whisky-tumblers', 22), ('drift-linen-table-runner', 38), ('cove-copper-bar-tools', 15),
  ('nomad-cocktail-glasses', 27), ('haven-highball-glasses', 44), ('ridge-oak-coasters', 61),
  ('willow-champagne-bucket', 0)
) as s(product_slug, qty)
  on p.slug = s.product_slug;

-- ----------------------------------------------------------------------------
-- Homepage sections — default order, all visible.
-- ----------------------------------------------------------------------------
insert into public.homepage_sections (section_key, sort_order, is_visible) values
  ('hero', 0, true),
  ('feature-strip', 1, true),
  ('category-showcase', 2, true),
  ('editorial', 3, true),
  ('bestsellers', 4, true),
  ('new-arrivals', 5, true),
  ('curated-collections', 6, true),
  ('brand-story', 7, true),
  ('reviews', 8, true),
  ('social-gallery', 9, true),
  ('newsletter', 10, true),
  ('recently-viewed', 11, true);

-- ----------------------------------------------------------------------------
-- Hero slides.
-- ----------------------------------------------------------------------------
insert into public.hero_slides (eyebrow, heading, copy, image, image_alt, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, sort_order) values
  ('New Season', 'Made for moments worth raising a glass to', 'Premium glassware, barware and tableware for entertaining, gifting and everyday living.', '/images/hero-table.svg', 'A table set with Clink & Co glassware and tableware', 'Shop the Edit', '/shop', 'Our Story', '/about', 0),
  ('The Home Bar Edit', 'Everything the first pour deserves', 'Shakers, jiggers and glassware built for the ritual of a proper cocktail hour at home.', '/images/hero-bar-cart.svg', 'A styled home bar cart with shaker, jigger and glassware', 'Shop Barware', '/shop/barware', 'View Collection', '/collections/home-bar-edit', 1),
  ('Gifts Worth Giving', 'Boxed, ribboned, ready to give', 'Curated gift sets for the hosts, newlyweds and new-home friends on your list.', '/images/hero-gifting.svg', 'A wrapped gift box from the Gifts Worth Giving collection', 'Shop Gifts', '/collections/gifts-worth-giving', null, null, 2);

-- ----------------------------------------------------------------------------
-- Store settings — replace the bare default row the migration inserted.
-- ----------------------------------------------------------------------------
update public.store_settings set
  business_name = 'Clink & Co by HEIMSIGHT',
  contact_email = 'hello@clinkandco.com',
  contact_phone = '+27 21 555 0142',
  tax_rate_percent = 15,
  free_delivery_threshold = 1500,
  enabled_delivery_method_ids = array['standard', 'express', 'pickup']::public.delivery_method[],
  enabled_payment_method_ids = array['test', 'eft', 'payfast', 'ozow', 'yoco', 'peach']::public.payment_method[],
  email_sender_name = 'Clink & Co',
  email_sender_local_part = 'orders',
  order_notification_email = 'orders@clinkandco.com',
  social = jsonb_build_object(
    'instagram', 'https://instagram.com/clinkandco',
    'facebook', 'https://facebook.com/clinkandco',
    'tiktok', 'https://tiktok.com/@clinkandco',
    'pinterest', 'https://pinterest.com/clinkandco',
    'whatsapp', 'https://wa.me/27215550142'
  ),
  order_number_prefix = 'CC',
  return_window_days = 30,
  maintenance_mode = false,
  maintenance_message = 'We''re carrying out some scheduled maintenance and will be back shortly. Thanks for your patience.'
where id = true;

-- ----------------------------------------------------------------------------
-- Sample reviews — fictional customers, no real personal information.
-- Guest-style (user_id left null) since no seed row exists in auth.users;
-- see the file header.
-- ----------------------------------------------------------------------------
insert into public.reviews (product_id, customer_name, location, rating, title, body, verified, status, helpful_count, created_at)
select p.id, r.customer_name, r.location, r.rating, r.title, r.body, r.verified, 'published', r.helpful_count, r.created_at
from public.products p
join (values
  ('solstice-coupe-glasses', 'Sipho K.', 'Durban', 5, 'Changed how I feel about a Tuesday-night glass of MCC',
   'Mouth-blown, slightly imperfect in the best way — you can tell someone actually made these.', true, 23, now() - interval '95 days'),
  ('solstice-coupe-glasses', 'Naledi P.', 'Johannesburg', 5, 'Our go-to hosting glass now',
   'Ordered a second set of four within a month because we kept reaching for these over our old flutes.', true, 17, now() - interval '80 days'),
  ('solstice-coupe-glasses', 'Michael T.', 'Cape Town', 4, 'Gorgeous, just a little delicate',
   'Every bit as lovely as the photos. I would want a sturdier option for a big outdoor gathering.', true, 8, now() - interval '65 days'),
  ('harbor-rocks-glasses', 'Amahle N.', 'Johannesburg', 5, null,
   'The heaviest, most satisfying glasses I own. Pours just feel like an occasion now.', true, 14, now() - interval '60 days'),
  ('the-nightcap-gift-set', 'Werner B.', 'Cape Town', 5, null,
   'Bought this for a housewarming and got a photo of it on the bar cart within the hour. Packaging alone made it feel like a bigger gift.', true, 9, now() - interval '50 days'),
  ('aldine-decanter', 'Lerato M.', 'Pretoria', 4, null,
   'Genuinely a statement piece on our sideboard. Docking one star only because the stopper took a couple of tries to seat properly.', true, 6, now() - interval '45 days'),
  ('hearth-dinner-plates', 'Chloe V.', 'Stellenbosch', 5, null,
   'We registered for these for our wedding and use them every single day — nice enough for guests, durable enough for real life.', true, 11, now() - interval '40 days'),
  ('meridian-cocktail-shaker', 'Robyn F.', 'Johannesburg', 5, null,
   'The first shaker I have owned that does not leak from the strainer. Small thing, huge difference.', false, 3, now() - interval '30 days'),
  ('almanac-brass-jigger', 'Dean R.', 'Cape Town', 5, 'Small tool, big difference',
   'Every cocktail I make at home tastes more balanced since I started actually measuring with this.', true, 5, now() - interval '20 days'),
  ('willow-champagne-bucket', 'Bianca L.', 'Durban', 4, null,
   'Beautiful centrepiece — wish it came in a slightly larger size for a full bottle plus ice.', true, 2, now() - interval '10 days')
) as r(product_slug, customer_name, location, rating, title, body, verified, helpful_count, created_at)
  on p.slug = r.product_slug;

commit;
