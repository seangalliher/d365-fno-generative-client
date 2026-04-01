/**
 * Dashboard — Landing page with recently accessed and frequently used items.
 */

import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/store/navigationHistory";
import { useMenuStructure } from "@/hooks/useMenuStructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULE_TAXONOMY, getAllMenuItems } from "@/data/moduleTaxonomy";
import { Clock, TrendingUp, Layers } from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const recentItemsFn = useNavigationHistory((s) => s.recentItems);
  const recentItems = recentItemsFn(8);
  const { modules } = useMenuStructure();

  // Top accessed items across all modules
  const popularItems = getAllMenuItems(modules)
    .filter((entry) => entry.item.accessCount > 0)
    .sort((a, b) => b.item.accessCount - a.item.accessCount)
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">D365 Generative Client</h1>
        <p className="mt-1 text-muted-foreground">
          Select a module to begin, or use the search bar to find a specific form.
        </p>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recently Accessed</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((entry, i) => (
              <Card
                key={`${entry.path}-${i}`}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate(entry.path)}
              >
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{entry.label}</p>
                  {entry.menuItemName && (
                    <p className="mt-1 text-xs text-muted-foreground">{entry.menuItemName}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Frequently Used</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularItems.map(({ item }) => (
              <Card
                key={item.menuItemName}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate(`/form/${item.menuItemName}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.menuItemName}</p>
                  </div>
                  <Badge variant="secondary">{item.accessCount}x</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Module Overview */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Modules</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_TAXONOMY.map((mod) => (
            <Card
              key={mod.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => navigate(`/module/${mod.id}`)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{mod.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xs text-muted-foreground">{mod.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {mod.items.length} item{mod.items.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
