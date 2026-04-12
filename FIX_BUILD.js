const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

function fixAdminPage() {
  const filePath = path.join(projectRoot, 'app', 'admin', 'page.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace any potential malformed imports with correct ones
  const uiImports = `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"`;
  
  content = content.replace(/import \{[\s\S]*?\} from "@\/components\/ui\/[^"]*"/g, uiImports);
  content = content.replace(/from "@\/contexts\/auth-context"/g, 'from "@/contexts/auth-context"');
  content = content.replace(/from "@\/lib\/supabase"/g, 'from "@/lib/supabase.ts"');
  content = content.replace(/from "@\/lib\/text-formatter"/g, 'from "@/lib/text-formatter.ts"');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed app/admin/page.tsx imports');
}

fixAdminPage();
console.log('Build fix complete. Run: node FIX_BUILD.js && npm run build');

