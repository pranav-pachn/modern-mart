const fs = require('fs');
const files = [
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/admin/stats/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/ai/history/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/health/db/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/orders/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/orders/analytics/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/orders/[id]/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/products/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/products/categories/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/products/[id]/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/products/[id]/reviews/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/products/[id]/test/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/user/address/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/user/orders/route.ts',
  'C:/Users/prana/Projects/modernmart/frontend/apps/web/app/api/user/orders/[id]/route.ts'
];
for (let f of files) {
  try {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('force-dynamic')) {
      fs.writeFileSync(f, "export const dynamic = 'force-dynamic';\n" + c);
      console.log('Updated ' + f);
    }
  } catch (e) {
    console.log('Failed ' + f);
  }
}
