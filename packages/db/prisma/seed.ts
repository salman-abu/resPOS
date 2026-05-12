import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'spice-garden' },
    update: {},
    create: {
      name: 'Spice Garden Restaurant',
      slug: 'spice-garden',
      gstin: '29ABCDE1234F1Z5',
      state_code: '29',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      subscription_plan: 'GROWTH',
    },
  });
  console.log('✅ Tenant:', tenant.name);

  // ── Outlet ──────────────────────────────────────────────────────────────────
  const outlet = await prisma.outlet.upsert({
    where: { id: 'outlet-main' },
    update: {},
    create: {
      id: 'outlet-main',
      tenant_id: tenant.id,
      name: 'Main Branch',
      address: '123 MG Road, Bangalore',
      state_code: '29',
    },
  });
  console.log('✅ Outlet:', outlet.name);

  // ── Users ───────────────────────────────────────────────────────────────────
  const pinHash = await bcrypt.hash('1234', 10);
  const users = [
    { id:'user-owner',   name:'Salman Khan',   mobile:'9876543210', email:'owner@spicegarden.com', role:'OWNER'   as const },
    { id:'user-priya',   name:'Priya Sharma',  mobile:'9876543211', role:'CASHIER'  as const },
    { id:'user-rohan',   name:'Rohan Verma',   mobile:'9876543212', role:'WAITER'   as const },
    { id:'user-deepa',   name:'Deepa Singh',   mobile:'9876543213', role:'MANAGER'  as const },
    { id:'user-amit',    name:'Amit Kumar',    mobile:'9876543214', role:'KITCHEN'  as const },
    { id:'user-sara',    name:'Sara Khan',     mobile:'9876543215', role:'WAITER'   as const },
    { id:'user-jay',     name:'Jay Patel',     mobile:'9876543216', role:'CAPTAIN'  as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, tenant_id: tenant.id, pin_hash: pinHash, is_active: true },
    });
  }
  console.log(`✅ ${users.length} users seeded (all PIN: 1234)`);

  // ── Zone + Tables ────────────────────────────────────────────────────────────
  const zone = await prisma.zone.upsert({
    where: { id: 'zone-main' },
    update: {},
    create: { id: 'zone-main', tenant_id: tenant.id, name: 'Main Hall' },
  });

  for (let i = 1; i <= 12; i++) {
    await prisma.table.upsert({
      where: { id: `table-${i}` },
      update: {},
      create: { id:`table-${i}`, tenant_id: tenant.id, zone_id: zone.id, table_number: String(i), capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6 },
    });
  }
  console.log('✅ 12 tables seeded');

  // ── Categories ───────────────────────────────────────────────────────────────
  const catDefs = [
    { id:'cat-1', name:'Starters',        sort_order:1, color:'#F97316' },
    { id:'cat-2', name:'Main Course',     sort_order:2, color:'#EF4444' },
    { id:'cat-3', name:'Breads',          sort_order:3, color:'#F59E0B' },
    { id:'cat-4', name:'Rice & Biryani',  sort_order:4, color:'#10B981' },
    { id:'cat-5', name:'Beverages',       sort_order:5, color:'#3B82F6' },
    { id:'cat-6', name:'Desserts',        sort_order:6, color:'#8B5CF6' },
  ];

  for (const c of catDefs) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, tenant_id: tenant.id, is_active: true },
    });
  }
  console.log('✅ 6 categories seeded');

  // ── Menu Items ───────────────────────────────────────────────────────────────
  type ItemSeed = { id:string; category_id:string; name:string; description:string; base_price:number; item_type:'VEG'|'NON_VEG'; tax_slab:'GST_5'|'GST_12'; station_route:'HOT_KITCHEN'|'COLD_KITCHEN'|'BAR'|'BAKERY'; sort_order:number };
  const V='VEG' as const, NV='NON_VEG' as const;
  const G5='GST_5' as const, G12='GST_12' as const;
  const HK='HOT_KITCHEN' as const, CK='COLD_KITCHEN' as const, BAR='BAR' as const, BK='BAKERY' as const;

  const items: ItemSeed[] = [
    {id:'item-01',category_id:'cat-1',name:'Paneer Tikka',       description:'Smoky cottage cheese in spiced yogurt',        base_price:28000,item_type:V, tax_slab:G5, station_route:HK,sort_order:1},
    {id:'item-02',category_id:'cat-1',name:'Chicken 65',          description:'Crispy South Indian fried chicken',             base_price:34000,item_type:NV,tax_slab:G5, station_route:HK,sort_order:2},
    {id:'item-03',category_id:'cat-1',name:'Veg Spring Rolls',   description:'Crispy rolls with seasoned vegetables',          base_price:19000,item_type:V, tax_slab:G5, station_route:HK,sort_order:3},
    {id:'item-04',category_id:'cat-1',name:'Seekh Kebab',        description:'Minced lamb skewers with aromatic spices',       base_price:38000,item_type:NV,tax_slab:G5, station_route:HK,sort_order:4},
    {id:'item-05',category_id:'cat-1',name:'Samosa (2 pcs)',     description:'Crisp pastry with spiced potato and peas',       base_price:8000, item_type:V, tax_slab:G5, station_route:HK,sort_order:5},
    {id:'item-06',category_id:'cat-2',name:'Butter Chicken',     description:'Tender chicken in tomato-cream sauce',           base_price:38000,item_type:NV,tax_slab:G12,station_route:HK,sort_order:1},
    {id:'item-07',category_id:'cat-2',name:'Paneer Butter Masala',description:'Fresh paneer in tomato-cashew gravy',           base_price:32000,item_type:V, tax_slab:G12,station_route:HK,sort_order:2},
    {id:'item-08',category_id:'cat-2',name:'Dal Makhani',        description:'Slow-cooked black lentils with butter',          base_price:24000,item_type:V, tax_slab:G12,station_route:HK,sort_order:3},
    {id:'item-09',category_id:'cat-2',name:'Mutton Rogan Josh',  description:'Aromatic Kashmiri lamb curry',                   base_price:48000,item_type:NV,tax_slab:G12,station_route:HK,sort_order:4},
    {id:'item-10',category_id:'cat-2',name:'Palak Paneer',       description:'Cottage cheese in spinach gravy',                base_price:28000,item_type:V, tax_slab:G12,station_route:HK,sort_order:5},
    {id:'item-11',category_id:'cat-2',name:'Fish Curry',         description:'Fresh fish in coconut curry',                    base_price:44000,item_type:NV,tax_slab:G12,station_route:HK,sort_order:6},
    {id:'item-12',category_id:'cat-3',name:'Garlic Naan',        description:'Tandoor flatbread with garlic and butter',       base_price:5000, item_type:V, tax_slab:G5, station_route:HK,sort_order:1},
    {id:'item-13',category_id:'cat-3',name:'Butter Naan',        description:'Soft tandoor flatbread with butter',             base_price:4000, item_type:V, tax_slab:G5, station_route:HK,sort_order:2},
    {id:'item-14',category_id:'cat-3',name:'Lachha Paratha',     description:'Layered whole-wheat flatbread',                  base_price:6000, item_type:V, tax_slab:G5, station_route:HK,sort_order:3},
    {id:'item-15',category_id:'cat-3',name:'Tandoori Roti',      description:'Whole-wheat flatbread from clay oven',           base_price:3500, item_type:V, tax_slab:G5, station_route:HK,sort_order:4},
    {id:'item-16',category_id:'cat-4',name:'Paneer Biryani',     description:'Fragrant basmati rice with spiced paneer',       base_price:36000,item_type:V, tax_slab:G12,station_route:HK,sort_order:1},
    {id:'item-17',category_id:'cat-4',name:'Chicken Biryani',    description:'Hyderabadi dum biryani with chicken',            base_price:42000,item_type:NV,tax_slab:G12,station_route:HK,sort_order:2},
    {id:'item-18',category_id:'cat-4',name:'Jeera Rice',         description:'Basmati rice tempered with cumin',               base_price:14000,item_type:V, tax_slab:G5, station_route:HK,sort_order:3},
    {id:'item-19',category_id:'cat-5',name:'Masala Chai',        description:'Spiced Indian tea with ginger',                  base_price:4000, item_type:V, tax_slab:G5, station_route:BAR,sort_order:1},
    {id:'item-20',category_id:'cat-5',name:'Mango Lassi',        description:'Chilled yogurt drink with Alphonso mango',       base_price:9000, item_type:V, tax_slab:G5, station_route:BAR,sort_order:2},
    {id:'item-21',category_id:'cat-5',name:'Fresh Lime Soda',    description:'Sparkling lime water with mint',                 base_price:7000, item_type:V, tax_slab:G5, station_route:BAR,sort_order:3},
    {id:'item-22',category_id:'cat-5',name:'Virgin Mojito',      description:'Fresh mint, lime and soda',                      base_price:12000,item_type:V, tax_slab:G5, station_route:BAR,sort_order:4},
    {id:'item-23',category_id:'cat-6',name:'Gulab Jamun',        description:'Milk-solid dumplings in rose sugar syrup',       base_price:8000, item_type:V, tax_slab:G5, station_route:CK, sort_order:1},
    {id:'item-24',category_id:'cat-6',name:'Rasmalai',           description:'Cottage cheese patties in saffron milk',         base_price:10000,item_type:V, tax_slab:G5, station_route:CK, sort_order:2},
    {id:'item-25',category_id:'cat-6',name:'Chocolate Brownie',  description:'Warm Belgian brownie with vanilla ice cream',    base_price:15000,item_type:V, tax_slab:G12,station_route:BK, sort_order:3},
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, tenant_id: tenant.id, is_available: true },
    });
  }
  console.log(`✅ ${items.length} menu items seeded`);

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Login credentials:`);
  console.log(`   Owner: owner@spicegarden.com | PIN: 1234`);
  console.log(`   All staff PIN: 1234`);
  console.log(`   Tenant slug: spice-garden`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
